/**
 * InfrastructureFailureSystem
 *
 * ★ 重构（聚合存储版本）：原版逐卡遍历 100k 卡场景 O(N) 不可接受
 *
 * 故障检测全部按 CardAggregate 桶执行，O(桶数) ≈ O(几千)，与卡数解耦：
 * - 卡故障：按桶计算期望故障数 → 减少桶 count 或拆桶
 * - 节点故障：直接修改桶 status 字段（整桶 online → offline），不逐卡
 * - 老化：每日按桶 ageBucket +1，合并同桶相邻键
 * - 恢复：扫描 offline 桶中 autoRecoverDay ≤ today 的桶
 * - 热备替换：按 broken 桶 + spare 桶互换
 *
 * 训练卡损失：故障发生时按 projectId 反查（按桶被 project 标记），不遍历单卡。
 *
 * 关键设计：
 * - 卡不再有 assignedProjectId 字段（聚合内信息不存储）→ 改为桶级 projectId 标签
 * - 实际上为了让训练系统在加入/移除分配时高效，新增桶级 metadata：
 *   CardAggregate.assignedProject?: string | null
 * - 训练分配 = 把 idle 桶的 N 张卡转移到 assignedProject=X 的桶
 * - 故障 = 把 assignedProject=X 桶的 N 张卡转回 idle（location 不变）
 *
 * 真实数据迁移：旧 CardInstance.assignedProjectId → 聚合桶 metadata。
 * 由于本次重构较大，分配追踪逻辑保留在 Project 侧
 * （TrainingProject.nodeAssignments[nodeId] 已有 uid 列表），故障系统
 * 不再依赖卡侧 assignedProjectId，而是依赖训练项目侧的 nodeAssignments 列表。
 *
 * 兼容策略：故障事件仍按"项目丢失 N 张卡"产生，UI 日志显示"合成 uid"前缀，
 * 真实 uid 仍由 TrainingProject.nodeAssignments[nodeId] 提供。
 */

import type { GameState, GameData } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { getCardSpec } from '../config/computeCards';
import { getStaffInfraFailureReduction } from '../utils/crossSystemUtils';
import { getMaintenanceMultiplier } from '../commands/MaintenanceCommands';
import {
  type CardPool,
  adjustBucketCount,
  transferBetweenBuckets,
  recoverOfflineCards,
  markCardsFailed,
  ageAllBuckets,
  sampleCards,
  parseCardUid,
} from '../utils/cardAggregate';

/** 模型 id 池格式守卫 */
function isCardPool(v: unknown): v is CardPool {
  return !!v && typeof v === 'object' && Array.isArray((v as any).aggregates);
}

/**
 * 应用单桶故障（聚合路径专用）
 *
 * 行为：
 * 1. 从故障桶扣减 count
 * 2. 创建新的 offline/broken 桶（location 不变）
 * 3. 通过 sampleCards 抽取 N 个合成 uid 用于事件日志
 * 4. 同步修改 project.nodeAssignments[nodeId] 移除对应 uid
 *
 * 注意：因为我们没有逐卡 uid（聚合没有），nodeAssignments 侧的 uid 列表
 * 必须是合成 uid。TrainingProject 分配时应使用合成 uid：
 *   `${modelId}:${ageBucket}:${nodeId}:${countIndex}`
 */
function applyBucketFailure(
  draft: any,
  pool: CardPool,
  spec: any,
  modelId: string,
  sourceAgeBucket: number,
  location: string,
  isAssigned: boolean,
  assignedProjectId: string | null,
  failCount: number,
  isMajor: boolean,
  failedCards: Array<{ uid: string; modelId: string; severity: 'minor' | 'major' }>,
  projectLostCards: Map<string, number>,
  today: number,
): CardPool {
  if (failCount <= 0) return pool;
  // 1. 异桶转移 online → offline/broken（markCardsFailed 内部调 adjustBucket）
  // ★ 修复：原实现先 -n（adjustBucket 同桶扣减）再 +n（markCardsFailed 异桶扣 online），
  //   导致 online 被扣 2n 而 offline/broken 只加 n → 净消失 n 张卡
  //   正确做法：单次异桶 transfer 完成 online → offline/broken，totalCount 不变
  const p = markCardsFailed(pool, sourceAgeBucket, location, isMajor, failCount, today);

  // 3. 抽样 N 个合成 uid 用于事件日志
  const samples = sampleCards(p, Math.min(failCount, 5), (a) =>
    a.ageBucket === sourceAgeBucket && a.location === location &&
    a.status === (isMajor ? 'broken' : 'offline')
  );
  for (const s of samples) {
    failedCards.push({ uid: s.uid, modelId, severity: isMajor ? 'major' : 'minor' });
  }

  // 4. 同步训练项目卡列表（按合成 uid 移除）
  if (isAssigned && assignedProjectId) {
    const project = draft.trainingProjects.find((p: any) => p.id === assignedProjectId);
    if (project) {
      // ★ 修复：只检查故障节点 nodeId 的 nodeAssignments，不遍历所有节点
      //   原实现遍历所有 nodeId，只匹配 modelId+ageBucket 不检查 location，
      //   会错误移除其他节点上同型号同年龄桶的卡
      const list: string[] = project.nodeAssignments[location];
      if (list) {
        let removed = 0;
        const filtered: string[] = [];
        for (const uid of list) {
          if (removed < failCount) {
            const p = parseCardUid(uid);
            if (p && p.modelId === modelId && p.ageBucket === sourceAgeBucket && p.location === location) {
              removed++;
              continue;
            }
          }
          filtered.push(uid);
        }
        project.nodeAssignments[location] = filtered;
      }
      projectLostCards.set(assignedProjectId, (projectLostCards.get(assignedProjectId) ?? 0) + failCount);
    }
  }

  // 5. 事件日志（合并成一条 N 卡故障）
  const cardName = spec.name ?? modelId;
  const recoverMsg = isMajor ? '（需报废）' : `（${p.aggregates.find((a) => a.ageBucket === sourceAgeBucket && a.location === location && a.status === 'offline')?.autoRecoverDay! - today} 天后自动修复）`;
  draft.infraEventLog.push({
    date: today,
    type: 'CARD_FAILED',
    message: `${cardName} × ${failCount} 发生${isMajor ? '严重故障' : '轻微故障'}${recoverMsg}`,
    severity: isMajor ? 'critical' : 'warning',
  });

  return p;
}

/**
 * InfrastructureFailureSystem — 聚合存储版
 */
export class InfrastructureFailureSystem implements System {
  name = 'InfrastructureFailureSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const failedCards: Array<{ uid: string; modelId: string; severity: 'minor' | 'major' }> = [];
    const recoveredCards: Array<{ uid: string; modelId: string }> = [];
    const failedNodes: Array<{ id: string; name: string; cardCount: number }> = [];
    const networkGlitches: Array<{ clusterId: string; clusterName: string }> = [];
    const pausedProjects: string[] = [];

    state.update((draft) => {
      const today = draft.date;

      // 0. 恢复昨日网络故障的 utilizationBonus
      for (const cluster of draft.clusters) {
        if (cluster.utilizationBonus === 0 && cluster.baseUtilizationBonus > 0) {
          cluster.utilizationBonus = cluster.baseUtilizationBonus;
        }
      }

      // 1. 节点老化
      for (const node of draft.serverNodes) {
        const daysSinceMaintenance = today - node.lastMaintenanceDay;
        const agingSteps = Math.floor(daysSinceMaintenance / 30);
        const expectedReliability = Math.max(50, node.baseReliability - agingSteps);
        if (node.reliability > expectedReliability) {
          node.reliability = expectedReliability;
        }
      }

      // 2. 全局 staff 维护修正
      const staffFailureMult = getStaffInfraFailureReduction(draft);
      const maintenanceMult = getMaintenanceMultiplier(state);

      // 3. 统计训练项目当前分配总数（按 nodeAssignments 累加）
      const projectTotalAssigned = new Map<string, number>();
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;
        let total = 0;
        for (const nodeId of Object.keys(project.nodeAssignments)) {
          total += (project.nodeAssignments[nodeId] as string[]).length;
        }
        projectTotalAssigned.set(project.id, total);
      }

      // 4. 自动恢复（offline → online，按桶检查 autoRecoverDay）
      let totalRecoverCost = 0;
      let recoveredCount = 0;
      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId];
        if (!isCardPool(pool)) continue;
        const { pool: newPool, recovered } = recoverOfflineCards(pool, today);
        if (recovered.length > 0) {
          draft.resourceMeta[modelId] = newPool;
          const spec = getCardSpec(modelId);
          const repairCostPer = spec ? spec.unitCost * 0.005 : 100;
          for (const r of recovered) {
            totalRecoverCost += repairCostPer * r.count;
            recoveredCount += r.count;
            // ★ 修复：填充 recoveredCards 以触发 CARD_RECOVERED 事件
            recoveredCards.push({
              uid: `agg-${modelId}-${r.ageBucket}-${r.location ?? ''}-0`,
              modelId,
            });
          }
        }
      }
      if (totalRecoverCost > 0) {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalRecoverCost;
        draft.infraEventLog.push({
          date: today,
          type: 'CARD_RECOVERED',
          message: `${recoveredCount} 张卡自动修复完成，扣 $${totalRecoverCost.toLocaleString()}`,
          severity: 'info',
        });
      }

      // 5. 每日老化（按桶推进 ageBucket +1）
      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId];
        if (!isCardPool(pool)) continue;
        draft.resourceMeta[modelId] = ageAllBuckets(pool);
      }

      // 6. 故障检测（按桶统计概率）
      const projectLostCards = new Map<string, number>();

      // ★ 性能优化：locationToProject 与 modelId 无关，提到 modelId 循环外构建一次
      //   原：每个 modelId 重建一次 Map（N 型号 × N 项目 → O(N×M)）
      //   新：O(M) 一次构建，所有 modelId 共用
      const locationToProject = new Map<string, string>(); // nodeId -> projectId
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;
        for (const nodeId of Object.keys(project.nodeAssignments)) {
          // 简化：只取第一个项目（一节点多项目暂不考虑）
          if (!locationToProject.has(nodeId)) locationToProject.set(nodeId, project.id);
        }
      }

      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId];
        if (!isCardPool(pool)) continue;
        const spec = getCardSpec(modelId);
        if (!spec) continue;
        if (pool.statusCounts.online === 0) continue;

        // 按桶循环（O(桶数)）
        for (const agg of pool.aggregates.slice()) {
          if (agg.status !== 'online' || agg.count === 0) continue;
          if (agg.location === null || agg.location === '__pending_install__') continue;

          const nodeId = agg.location;
          const projectId = locationToProject.get(nodeId) ?? null;
          const isAssigned = projectId !== null;
          const loadFactor = isAssigned ? 1.0 : 0.3;
          // ageBucket 中心值作为 age 估计
          const ageEstimate = agg.ageBucket * 50 + 25;
          let dailyFailProb = spec.wearPerDay * (1 + ageEstimate / 1000) * loadFactor * staffFailureMult * maintenanceMult;

          if (isAssigned && projectId) {
            const project = draft.trainingProjects.find((p: any) => p.id === projectId);
            if (project) {
              const pc = project.parallelConfig;
              let parallelRiskMultiplier = 1.0;
              let maxMaturity = 0;
              const addRisk = (techId: string, baseRisk: number, safeDegree: number, deg: number) => {
                const mat = draft.techMaturity[techId] ?? 0;
                if (mat >= 1 && deg > 1) {
                  const risk = baseRisk * (1 - mat / 100) * (deg / safeDegree);
                  parallelRiskMultiplier += risk;
                  maxMaturity = Math.max(maxMaturity, mat);
                }
              };
              addRisk('pipeline_parallel', 0.15, 4, pc.ppStages ?? 1);
              addRisk('tensor_parallel', 0.25, 4, pc.tpSize ?? 1);
              addRisk('expert_parallel', 0.10, 8, pc.epGroups ?? 1);
              addRisk('context_parallel', 0.12, 4, pc.cpSize ?? 1);
              const reliabilityBonus = Math.min(0.80, maxMaturity / 100 * 0.80);
              dailyFailProb *= parallelRiskMultiplier * (1 - reliabilityBonus);
            }
          }

          const failProb = dailyFailProb * deltaDays;
          // 期望故障数 = count * failProb
          const expectedFails = agg.count * failProb;
          const failCount = Math.floor(expectedFails) + (Math.random() < (expectedFails % 1) ? 1 : 0);
          if (failCount > 0) {
            const isMajor = Math.random() < 0.5;
            const newPool = applyBucketFailure(
              draft, pool, spec, modelId,
              agg.ageBucket, agg.location!, isAssigned, projectId,
              failCount, isMajor, failedCards, projectLostCards, today,
            );
            draft.resourceMeta[modelId] = newPool;
          }
        }
      }

      // 7. 热备替换（按桶处理）
      this.applyHostSpares(draft, today);

      // 8. 节点故障（整桶 online → offline）
      const totalNodes = draft.serverNodes.length;
      const nodeCountFactor = 1 + Math.log(totalNodes + 1) / 10;

      for (const node of draft.serverNodes) {
        const dailyNodeFailProb = ((100 - node.reliability) / 10000) * nodeCountFactor * maintenanceMult;
        if (Math.random() < dailyNodeFailProb * deltaDays) {
          // 整节点所有 online 桶 → offline（按桶级别转移）
          let offlineCount = 0;
          for (const modelId of Object.keys(draft.resourceMeta)) {
            const pool = draft.resourceMeta[modelId];
            if (!isCardPool(pool)) continue;
            for (const agg of pool.aggregates.slice()) {
              if (agg.location === node.id && agg.status === 'online' && agg.count > 0) {
                const n = agg.count;
                // ★ 修复：用单次异桶 transfer（fromStatus!==toStatus）替代两次 adjustBucket
                //   原实现先 -n（可能耗尽 online 桶），再 +n 转 offline，但当 online 桶被删后
                //   adjustBucket 异桶分支找不到 source → silent fail → offline 桶没创建
                //   → totalCount -= n 但卡数实际消失
                // 异桶分支要求 source 桶 count >= n 且不被删除。n=agg.count 正好等于源桶 count
                //   源桶会被删（newFromCount=0），但异桶分支先扣 source 再加 target，最后 splice source：
                //   流程是 source 找到 → newFromCount = count - n = 0 → 删 source → 加 target。
                //   这种"source 完全清空"的场景异桶分支能正确处理。
                const p = transferBetweenBuckets(pool, agg.ageBucket, node.id, 'online', 'offline', n, {
                  autoRecoverDay: today + 5 + Math.floor(Math.random() * 4),
                });
                draft.resourceMeta[modelId] = p;
                offlineCount += n;
                // 同步项目 nodeAssignments 移除该位置卡
                for (const project of draft.trainingProjects) {
                  if (project.status !== 'training') continue;
                  const list = project.nodeAssignments[node.id];
                  if (!list) continue;
                  let removed = 0;
                  const filtered: string[] = [];
                  for (const uid of list) {
                    if (removed < n) {
                      // ★ 修复：用 parseCardUid 替代手动 split，正确匹配 location
                      const pu = parseCardUid(uid);
                      if (pu && pu.modelId === modelId && pu.ageBucket === agg.ageBucket && pu.location === node.id) {
                        removed++;
                        continue;
                      }
                    }
                    filtered.push(uid);
                  }
                  project.nodeAssignments[node.id] = filtered;
                  if (removed > 0) {
                    projectLostCards.set(project.id, (projectLostCards.get(project.id) ?? 0) + removed);
                  }
                }
              }
            }
          }

          failedNodes.push({ id: node.id, name: node.name, cardCount: offlineCount });

          // R3: 集群 >50% 节点故障时暂停训练
          const cluster = draft.clusters.find((c) => c.nodes.includes(node.id));
          if (cluster && cluster.nodes.length > 1) {
            const failedInCluster = failedNodes.filter((fn) =>
              cluster.nodes.includes(fn.id) && fn.id !== node.id,
            ).length + 1;
            if (failedInCluster > cluster.nodes.length * 0.5) {
              for (const project of draft.trainingProjects) {
                if (project.clusterId === cluster.id && project.status === 'training') {
                  project.status = 'paused';
                  project.pauseReason = `集群 ${cluster.name} 超过半数节点故障`;
                  project.computeRemaining = project.lastCheckpointRemaining;
                  pausedProjects.push(project.id);
                }
              }
            }
          }

          draft.infraEventLog.push({
            date: today,
            type: 'NODE_FAILED',
            message: `节点 ${node.name} 故障，${offlineCount} 卡离线（5-8 天后自动恢复）`,
            severity: 'critical',
          });
        }
      }

      // 9. R2: 训练项目失去 >30% 分配卡时暂停
      for (const [projectId, lostCount] of projectLostCards) {
        const total = projectTotalAssigned.get(projectId) ?? 1;
        if (total > 0 && lostCount / total > 0.3) {
          const project = draft.trainingProjects.find((p: any) => p.id === projectId);
          if (project && project.status === 'training') {
            project.status = 'paused';
            project.pauseReason = `同日 ${lostCount}/${total} 卡故障（超过 30%），训练暂停`;
            const lostProgress = project.lastCheckpointRemaining - project.computeRemaining;
            if (lostProgress > 0) {
              project.lostFlops += lostProgress;
              project.computeRemaining = project.lastCheckpointRemaining;
            }
            pausedProjects.push(projectId);
          }
        }
      }

      // 10. 网络链路故障
      for (const cluster of draft.clusters) {
        const dailyNetworkProb = (0.03 / 365) * cluster.nodes.length;
        if (Math.random() < dailyNetworkProb * deltaDays) {
          cluster.utilizationBonus = 0;
          networkGlitches.push({ clusterId: cluster.id, clusterName: cluster.name });
          draft.infraEventLog.push({
            date: today,
            type: 'NETWORK_GLITCH',
            message: `集群 ${cluster.name} 网络故障，当日利用率加成清零`,
            severity: 'warning',
          });
        }
      }

      // 保留最近 100 条日志
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });

    for (const c of failedCards) events.emit('CARD_FAILED', c.uid, c.modelId, c.severity);
    for (const r of recoveredCards) events.emit('CARD_RECOVERED', r.uid, r.modelId);
    for (const n of failedNodes) events.emit('NODE_FAILED', n.id, n.name);
    for (const g of networkGlitches) events.emit('NETWORK_GLITCH', g.clusterId, g.clusterName);
    for (const pid of pausedProjects) events.emit('TRAINING_PAUSED', pid);
  }

  /**
   * ★ 热备替换（聚合版）
   * 条件：DC 内安装 ≥50 卡时启用。
   * 行为：替换 broken 桶（按桶减少 count）→ 找到相同 modelId 的 idle 桶转移
   */
  private applyHostSpares(draft: GameData, today: number): void {
    for (const dc of draft.dataCenters) {
      // 统计 DC 内已安装卡数
      let installedTotal = 0;
      for (const clusterId of dc.clusters) {
        const cluster = draft.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        for (const nodeId of cluster.nodes) {
          const node = draft.serverNodes.find((n) => n.id === nodeId);
          if (node) installedTotal += node.installedCards.length;
        }
      }
      if (installedTotal < 50) continue;

      const spareCapacity = Math.max(1, Math.floor(installedTotal * 0.02));
      let replacedThisDC = 0;

      for (const clusterId of dc.clusters) {
        const cluster = draft.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        for (const nodeId of cluster.nodes) {
          if (replacedThisDC >= spareCapacity) break;
          const node = draft.serverNodes.find((n) => n.id === nodeId);
          if (!node) continue;

          // 找到该节点的 broken 桶（按 modelId）
          for (const modelId of Object.keys(draft.resourceMeta)) {
            if (replacedThisDC >= spareCapacity) break;
            const pool = draft.resourceMeta[modelId];
            if (!isCardPool(pool)) continue;
            // 找该 modelId 下 location=nodeId 的 broken 桶
            const brokenAgg = pool.aggregates.find((a) => a.location === nodeId && a.status === 'broken');
            if (!brokenAgg || brokenAgg.count === 0) continue;

            // 找相同 modelId 的 idle 桶
            const idleAgg = pool.aggregates.find((a) => a.location === null && a.status === 'online');
            if (!idleAgg || idleAgg.count === 0) continue;

            // 替换：broken 桶 -n（卡从池中消失）+ idle 桶 -n（备件取出）+
            //   新装桶 +n（备件安装）。三次同桶 adjustBucket 净 totalCount 变化 = -n。
            //   语义：1 张 broken 卡被丢弃（totalCount -1），同时 1 张库存备件从 null 位置
            //   移到 nodeId 位置（同 status 转移，totalCount 净 0）→ 净 totalCount -1。
            //   statusCounts：broken -n，online 净 0（idempotent）。
            const n = Math.min(brokenAgg.count, idleAgg.count, spareCapacity - replacedThisDC);
            let p = pool;
            // 1. broken → broken -n：同桶扣减（卡从 broken 桶消失，总卡数 -n）
            p = adjustBucketCount(p, brokenAgg.ageBucket, nodeId, 'broken', -n);
            // 2. idle (location=null, online) -n：备件从库存取出（totalCount -n）
            p = adjustBucketCount(p, idleAgg.ageBucket, null, 'online', -n);
            // 3. new (location=nodeId, online) +n：备件安装到节点（totalCount +n）
            p = adjustBucketCount(p, 0, nodeId, 'online', n);
            draft.resourceMeta[modelId] = p;

            // 同步项目 nodeAssignments（移除 broken uid，添加新 uid）
            for (const project of draft.trainingProjects) {
              if (project.status !== 'training') continue;
              const list = project.nodeAssignments[nodeId];
              if (!list) continue;
              let removed = 0;
              const filtered: string[] = [];
              for (const uid of list) {
                if (removed < n) {
                  // ★ 修复：用 parseCardUid 正确匹配 location
                  const pu = parseCardUid(uid);
                  if (pu && pu.modelId === modelId && pu.ageBucket === brokenAgg.ageBucket && pu.location === nodeId) {
                    removed++;
                    continue;
                  }
                }
                filtered.push(uid);
              }
              // 添加新合成 uid
              for (let i = 0; i < n; i++) {
                filtered.push(`agg-${modelId}-0-${nodeId}-${i}`);
              }
              project.nodeAssignments[nodeId] = filtered;
            }

            replacedThisDC += n;
            const spec = getCardSpec(modelId);
            draft.infraEventLog.push({
              date: today,
              type: 'CARD_RECOVERED',
              message: `${spec?.name ?? modelId} × ${n} 热备替换完成`,
              severity: 'info',
            });
          }
        }
      }
    }
  }
}
