import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { getCardSpec } from '../config/computeCards';
import { getStaffInfraFailureReduction } from '../utils/crossSystemUtils';
import { getCardIndex } from '../utils/cardIndex';

/**
 * InfrastructureFailureSystem
 *
 * 每日推进时按概率触发基础设施故障。
 *
 * 【设计原则：大型集群容错】
 * 1024 卡集群每日约 2-3 次故障事件（卡级 + 节点级），若每次故障都暂停训练
 * 并回退进度，大模型训练完全不可行。真实数据中心通过以下机制保证正常运行：
 *
 * 1. 卡故障 → 训练降速，不暂停（仅当 >30% 分配卡同日故障才视为灾难性事件）
 * 2. 节点故障 → 训练降速，不暂停（单节点下线不影响集群其余节点）
 * 3. minor 故障自动修复（offline 卡 3-7 天后自动变 online，扣小额维修费）
 * 4. 数据中心热备池（≥50 卡时自动预留 2% 冗余，故障后 1 天自动替换）
 *
 * 节点老化：每 30 天可靠性 -1（下限 50），维护可恢复。
 *
 * 网络恢复：每日开头恢复被故障清零的 utilizationBonus。
 */
export class InfrastructureFailureSystem implements System {
  name = 'InfrastructureFailureSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const failedCards: Array<{ uid: string; modelId: string; severity: 'minor' | 'major' }> = [];
    const recoveredCards: Array<{ uid: string; modelId: string }> = [];
    const failedNodes: Array<{ id: string; name: string; cardCount: number }> = [];
    const networkGlitches: Array<{ clusterId: string; clusterName: string }> = [];
    const pausedProjects: string[] = []; // 仅灾难性故障才暂停

    state.update((draft) => {
      // 0. 恢复昨日网络故障的 utilizationBonus
      for (const cluster of draft.clusters) {
        if (cluster.utilizationBonus === 0 && cluster.baseUtilizationBonus > 0) {
          cluster.utilizationBonus = cluster.baseUtilizationBonus;
        }
      }

      // ★ R1: 自动恢复：到达 autoRecoverDay 的 offline 卡自动变 online
      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId] as CardInstance[];
        if (!Array.isArray(pool)) continue;
        for (const card of pool) {
          if (card.status === 'offline' && card.autoRecoverDay !== undefined && draft.date >= card.autoRecoverDay) {
            card.status = 'online';
            card.autoRecoverDay = undefined;
            recoveredCards.push({ uid: card.uid, modelId });
            // 自动恢复扣小额维修费
            const spec = getCardSpec(modelId);
            const repairCost = spec ? spec.unitCost * 0.005 : 100;
            draft.resources['funds'] = (draft.resources['funds'] ?? 0) - repairCost;
            draft.infraEventLog.push({
              date: draft.date,
              type: 'CARD_RECOVERED',
              message: `${spec?.name ?? modelId} (${card.uid.slice(-6)}) 自动修复完成，扣 $${repairCost.toLocaleString()}`,
              severity: 'info',
            });
          }
        }
      }

      // ★ R4: 热备替换：数据中心自动用空闲卡替换 broken/offline 卡（≥50 卡的 DC 有效）
      this.applyHostSpares(draft, draft.date);

      // 1. 节点老化
      for (const node of draft.serverNodes) {
        const daysSinceMaintenance = draft.date - node.lastMaintenanceDay;
        const agingSteps = Math.floor(daysSinceMaintenance / 30);
        const expectedReliability = Math.max(50, node.baseReliability - agingSteps);
        if (node.reliability > expectedReliability) {
          node.reliability = expectedReliability;
        }
      }

      // 2. 计算卡老化 + 故障
      const staffFailureMult = getStaffInfraFailureReduction(draft);
      // 统计每个训练项目失去的卡数（用于判断是否需要暂停）
      const projectLostCards = new Map<string, number>();
      const projectTotalAssigned = new Map<string, number>();

      // 先统计每个项目的总分配卡数
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;
        let total = 0;
        for (const nodeId of Object.keys(project.nodeAssignments)) {
          total += project.nodeAssignments[nodeId].length;
        }
        projectTotalAssigned.set(project.id, total);
      }

      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId] as CardInstance[];
        if (!Array.isArray(pool)) continue;
        for (const card of pool) {
          if (card.status !== 'online') continue;
          card.age += deltaDays;

          const spec = getCardSpec(modelId);
          if (!spec) continue;

          const loadFactor = card.assignedProjectId ? 1.0 : 0.3;
          const dailyFailProb = spec.wearPerDay * (1 + card.age / 1000) * loadFactor * staffFailureMult;

          if (Math.random() < dailyFailProb * deltaDays) {
            const isMajor = Math.random() < 0.5;
            card.status = isMajor ? 'broken' : 'offline';

            // ★ R1: minor 故障自动恢复（3-7 天后）
            if (!isMajor) {
              card.autoRecoverDay = draft.date + 3 + Math.floor(Math.random() * 5);
            }

            failedCards.push({ uid: card.uid, modelId, severity: isMajor ? 'major' : 'minor' });

            // ★ R2: GPU 故障不暂停训练，仅从分配中移除（降速）
            if (card.assignedProjectId) {
              const project = draft.trainingProjects.find((p) => p.id === card.assignedProjectId);
              if (project) {
                for (const nodeId of Object.keys(project.nodeAssignments)) {
                  project.nodeAssignments[nodeId] = project.nodeAssignments[nodeId].filter(
                    (uid) => uid !== card.uid,
                  );
                }
                projectLostCards.set(project.id, (projectLostCards.get(project.id) ?? 0) + 1);
              }
              card.assignedProjectId = null;
            }

            const cardName = spec.name ?? modelId;
            const severity = isMajor ? 'critical' : 'warning';
            const recoverMsg = isMajor ? '（需报废）' : `（${card.autoRecoverDay! - draft.date} 天后自动修复）`;
            draft.infraEventLog.push({
              date: draft.date,
              type: 'CARD_FAILED',
              message: `${cardName} (${card.uid.slice(-6)}) 发生${isMajor ? '严重故障' : '轻微故障'}${recoverMsg}`,
              severity,
            });
          }
        }
      }

      // 3. 节点故障
      const totalNodes = draft.serverNodes.length;
      const nodeCountFactor = 1 + Math.log(totalNodes + 1) / 10;

      for (const node of draft.serverNodes) {
        const dailyNodeFailProb = ((100 - node.reliability) / 10000) * nodeCountFactor;

        if (Math.random() < dailyNodeFailProb * deltaDays) {
          let offlineCount = 0;
          // ★ R3: 该节点所有在线卡变为 offline（不暂停训练，训练降速）
          const nodeFailIndex = getCardIndex(draft);
          for (const cardUid of node.installedCards) {
            const entry = nodeFailIndex.get(cardUid);
            if (entry && entry.card.status === 'online') {
              const card = entry.card;
              card.status = 'offline';
              // ★ R1: 节点级故障的卡也自动恢复（5-8 天，比单卡久）
              card.autoRecoverDay = draft.date + 5 + Math.floor(Math.random() * 4);
              offlineCount++;

              // 从分配中移除（降速，不暂停）
              if (card.assignedProjectId) {
                const project = draft.trainingProjects.find((p) => p.id === card.assignedProjectId);
                if (project) {
                  for (const nid of Object.keys(project.nodeAssignments)) {
                    project.nodeAssignments[nid] = project.nodeAssignments[nid].filter(
                      (uid) => uid !== card.uid,
                    );
                  }
                  projectLostCards.set(project.id, (projectLostCards.get(project.id) ?? 0) + 1);
                }
                card.assignedProjectId = null;
              }
            }
          }

          failedNodes.push({ id: node.id, name: node.name, cardCount: offlineCount });

          // ★ R3: 仅当集群中 >50% 节点同日故障才暂停训练（代表机房级事故）
          const cluster = draft.clusters.find((c) => c.nodes.includes(node.id));
          if (cluster && cluster.nodes.length > 1) {
            const failedInCluster = failedNodes.filter((fn) =>
              cluster.nodes.includes(fn.id) && fn.id !== node.id,
            ).length + 1; // +1 = 当前节点
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

          const recoverMin = 5;
            const recoverMax = 9;
            draft.infraEventLog.push({
            date: draft.date,
            type: 'NODE_FAILED',
            message: `节点 ${node.name} 故障，${offlineCount} 卡离线（${recoverMin}-${recoverMax} 天后自动恢复）`,
            severity: 'critical',
          });
        }
      }

      // ★ R2: 仅当训练项目失去 >30% 分配卡时才暂停
      // 设计-23 修复：原实现把 R2 检查放在卡故障循环之后、节点故障循环之前，
      // 导致节点故障导致的卡丢失不触发 30% 暂停检查，可能让训练带着损坏的 checkpoint 继续。
      // 修复：把 R2 检查移到所有故障（卡级 + 节点级）处理完毕后做统一判定，
      // 确保任何来源的累计卡丢失超过 30% 都能触发暂停。
      for (const [projectId, lostCount] of projectLostCards) {
        const total = projectTotalAssigned.get(projectId) ?? 1;
        if (total > 0 && lostCount / total > 0.3) {
          const project = draft.trainingProjects.find((p) => p.id === projectId);
          // 仅对仍在 training 状态的项目暂停（已被 R3 暂停的不重复处理）
          if (project && project.status === 'training') {
            project.status = 'paused';
            project.pauseReason = `同日 ${lostCount}/${total} 卡故障（超过 30%），训练暂停`;
            // 回退到 checkpoint
            const lostProgress = project.lastCheckpointRemaining - project.computeRemaining;
            if (lostProgress > 0) {
              project.lostFlops += lostProgress;
              project.computeRemaining = project.lastCheckpointRemaining;
            }
            pausedProjects.push(projectId);
          }
        }
      }

      // 4. 网络链路故障
      for (const cluster of draft.clusters) {
        const dailyNetworkProb = (0.03 / 365) * cluster.nodes.length;
        if (Math.random() < dailyNetworkProb * deltaDays) {
          cluster.utilizationBonus = 0;
          networkGlitches.push({ clusterId: cluster.id, clusterName: cluster.name });

          draft.infraEventLog.push({
            date: draft.date,
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

    for (const c of failedCards) {
      events.emit('CARD_FAILED', c.uid, c.modelId, c.severity);
    }
    for (const r of recoveredCards) {
      events.emit('CARD_RECOVERED', r.uid, r.modelId);
    }
    for (const n of failedNodes) {
      events.emit('NODE_FAILED', n.id, n.name);
    }
    for (const g of networkGlitches) {
      events.emit('NETWORK_GLITCH', g.clusterId, g.clusterName);
    }
    for (const pid of pausedProjects) {
      events.emit('TRAINING_PAUSED', pid);
    }
  }

  /**
   * ★ R4: 数据中心热备池自动替换 broken/offline 卡
   *
   * 条件：数据中心安装 ≥ 50 卡时启用。
   * 行为：每日检查是否有 broken 的卡，自动从仓库未安装卡中替换。
   *       替换后旧卡报废移除。无库存时 skip。
   *       热备池容量 = 已安装卡数的 2%，min 1 张。
   */
  private applyHostSpares(draft: import('../GameState').GameData, today: number): void {
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

      // 热备容量
      const spareCapacity = Math.max(1, Math.floor(installedTotal * 0.02));

      // 找到此 DC 中 broken 的卡
      const brokenCards: Array<{ uid: string; modelId: string; nodeId: string; location: string }> = [];
      const breakIndex = getCardIndex(draft);
      for (const clusterId of dc.clusters) {
        const cluster = draft.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        for (const nodeId of cluster.nodes) {
          const node = draft.serverNodes.find((n) => n.id === nodeId);
          if (!node) continue;
          for (const cardUid of node.installedCards) {
            const entry = breakIndex.get(cardUid);
            if (entry && entry.card.status === 'broken') {
              brokenCards.push({ uid: entry.card.uid, modelId: entry.modelId, nodeId, location: entry.card.location ?? 'unknown' });
            }
          }
        }
      }

      if (brokenCards.length === 0) continue;

      // 找未安装的在线卡作为备件
      const spareCards: Array<{ uid: string; modelId: string }> = [];
      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId] as CardInstance[] | undefined;
        if (!pool) continue;
        for (const card of pool) {
          if (card.location === null && card.status === 'online' && card.assignedProjectId === null) {
            spareCards.push({ uid: card.uid, modelId });
          }
        }
      }
      if (spareCards.length === 0) continue;

      // 热备替换
      let replaced = 0;
      for (const broken of brokenCards) {
        if (replaced >= spareCapacity || spareCards.length === 0) break;
        const spareIdx = spareCards.findIndex((s) => s.modelId === broken.modelId);
        if (spareIdx < 0) continue;
        const spare = spareCards.splice(spareIdx, 1)[0];
        replaced++;

        // 移除旧卡
        const oldPool = draft.resourceMeta[broken.modelId] as CardInstance[];
        const oldIdx = oldPool.findIndex((c) => c.uid === broken.uid);
        if (oldIdx >= 0) oldPool.splice(oldIdx, 1);

        // 从节点 installedCards 中移除旧卡，添加新卡
        const node = draft.serverNodes.find((n) => n.id === broken.nodeId);
        if (node) {
          const cardIdx = node.installedCards.indexOf(broken.uid);
          if (cardIdx >= 0) {
            node.installedCards[cardIdx] = spare.uid;
          }
        }

        // 新卡状态更新
        const newPool = draft.resourceMeta[spare.modelId] as CardInstance[];
        const newCard = newPool.find((c) => c.uid === spare.uid);
        if (newCard) {
          newCard.location = broken.location;
          newCard.assignedProjectId = null;
        }

        draft.infraEventLog.push({
          date: today,
          type: 'CARD_RECOVERED',
          message: `${getCardSpec(broken.modelId)?.name ?? broken.modelId} 热备替换 (${broken.uid.slice(-6)} → ${spare.uid.slice(-6)})`,
          severity: 'info',
        });
      }
    }
  }
}
