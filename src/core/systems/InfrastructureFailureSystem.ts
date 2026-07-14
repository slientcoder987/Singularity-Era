import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { getCardSpec } from '../config/computeCards';
import { getStaffInfraFailureReduction } from '../utils/crossSystemUtils';

/**
 * InfrastructureFailureSystem
 *
 * 每日推进时按概率触发基础设施故障：
 * 1. 计算卡故障：基于 wearPerDay × (1 + age/1000) × loadFactor
 *    - 轻微故障 (50%): status → offline（可修复）
 *    - 严重故障 (50%): status → broken（需报废换卡）
 * 2. 节点故障：基于 (100 - reliability) / 10000 × nodeCountFactor
 *    - 节点所有卡变为 offline
 *    - 暂停引用该节点的训练项目
 * 3. 网络链路故障：年故障率 3% × 链路数
 *    - 当日 utilizationBonus 临时降为 0（次日恢复）
 *
 * 节点老化：每 30 天可靠性 -1（下限 50），维护可恢复。
 *
 * 网络恢复：每日开头恢复被故障清零的 utilizationBonus。
 */
export class InfrastructureFailureSystem implements System {
  name = 'InfrastructureFailureSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const failedCards: Array<{ uid: string; modelId: string; severity: 'minor' | 'major' }> = [];
    const failedNodes: Array<{ id: string; name: string }> = [];
    const networkGlitches: Array<{ clusterId: string; clusterName: string }> = [];

    state.update((draft) => {
      // 0. 恢复昨日网络故障的 utilizationBonus
      for (const cluster of draft.clusters) {
        if (cluster.utilizationBonus === 0 && cluster.baseUtilizationBonus > 0) {
          cluster.utilizationBonus = cluster.baseUtilizationBonus;
        }
      }

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
      // 系统工程师降低故障率
      const staffFailureMult = getStaffInfraFailureReduction(draft);
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
            failedCards.push({ uid: card.uid, modelId, severity: isMajor ? 'major' : 'minor' });

            // 若该卡被分配到训练项目，从分配中移除
            if (card.assignedProjectId) {
              const project = draft.trainingProjects.find((p) => p.id === card.assignedProjectId);
              if (project) {
                for (const nodeId of Object.keys(project.nodeAssignments)) {
                  project.nodeAssignments[nodeId] = project.nodeAssignments[nodeId].filter(
                    (uid) => uid !== card.uid,
                  );
                }
                card.assignedProjectId = null;
              }
            }

            // 写入事件日志
            const cardName = spec.name ?? modelId;
            draft.infraEventLog.push({
              date: draft.date,
              type: 'CARD_FAILED',
              message: `${cardName} (${card.uid.slice(-6)}) 发生${isMajor ? '严重故障（报废）' : '轻微故障（可修复）'}`,
              severity: isMajor ? 'critical' : 'warning',
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
          // 该节点所有在线卡变为 offline
          for (const cardUid of node.installedCards) {
            for (const modelId of Object.keys(draft.resourceMeta)) {
              const pool = draft.resourceMeta[modelId] as CardInstance[];
              const card = pool?.find((c) => c.uid === cardUid);
              if (card && card.status === 'online') {
                card.status = 'offline';
              }
            }
          }

          failedNodes.push({ id: node.id, name: node.name });

          // 暂停引用该节点的训练项目，回退到 checkpoint
          for (const project of draft.trainingProjects) {
            if (project.status === 'training' && project.nodeAssignments[node.id]) {
              project.status = 'paused';
              project.pauseReason = `节点 ${node.name} 故障`;

              // 回退到上一个 checkpoint
              const lostProgress = project.lastCheckpointRemaining - project.computeRemaining;
              if (lostProgress > 0) {
                project.lostFlops += lostProgress;
                project.computeRemaining = project.lastCheckpointRemaining;
              }
            }
          }

          draft.infraEventLog.push({
            date: draft.date,
            type: 'NODE_FAILED',
            message: `节点 ${node.name} 故障，所有卡已离线`,
            severity: 'critical',
          });
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
    for (const n of failedNodes) {
      events.emit('NODE_FAILED', n.id, n.name);
    }
    for (const g of networkGlitches) {
      events.emit('NETWORK_GLITCH', g.clusterId, g.clusterName);
    }
  }
}
