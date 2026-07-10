import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { getCardSpec } from '../config/computeCards';
import { calcActualPowerDraw, type WorkloadType } from '../utils/computeUtilization';

/**
 * InfraMaintenanceSystem
 *
 * 每日扣除基础设施维护成本：
 * 1. 服务器节点：maintenanceCost
 * 2. 集群：operationalCostPerDay + storageCostPerDay
 * 3. 数据中心：maintenanceCostPerDay + 电力成本
 *    电力成本 = actualPowerKW × currentPue × 24h × powerCostPerKWh
 *    功耗按训练/空闲负载分档计算
 *
 * PUE 衰减：超过 365 天未维护，currentPue 每年劣化 1%（上限 1.1×basePue）
 *
 * 检测电力过载：若数据中心实际功耗超过 maxPowerMW，
 * 发射 POWER_OVERLOAD 事件，并暂停该数据中心内的训练项目。
 */
export class InfraMaintenanceSystem implements System {
  name = 'InfraMaintenanceSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // 1. 计算各层级日维护成本
    let totalNodeMaintenance = 0;
    for (const node of current.serverNodes) {
      totalNodeMaintenance += node.maintenanceCost;
    }

    let totalClusterOps = 0;
    for (const cluster of current.clusters) {
      totalClusterOps += cluster.operationalCostPerDay + cluster.storageCostPerDay;
    }

    let totalDcMaintenance = 0;
    let totalDcPowerCost = 0;
    const overloadDcs: string[] = [];
    const pueUpdatedDcs: Array<{ id: string; oldPue: number; newPue: number }> = [];

    for (const dc of current.dataCenters) {
      totalDcMaintenance += dc.maintenanceCostPerDay;

      // PUE 衰减计算
      const daysSinceMaintenance = current.date - dc.lastMaintenanceDay;
      let effectivePue = dc.currentPue;
      if (daysSinceMaintenance > 365) {
        const decay = 1 + ((daysSinceMaintenance - 365) / 365) * 0.01;
        const degradedPue = Math.min(dc.basePue * decay, dc.basePue * 1.1);
        if (degradedPue > dc.currentPue) {
          effectivePue = degradedPue;
          pueUpdatedDcs.push({ id: dc.id, oldPue: dc.currentPue, newPue: effectivePue });
        }
      }

      // 计算实际功耗：遍历集群中所有在线卡，按训练/空闲分档
      const trainingCardSpecs: Array<NonNullable<ReturnType<typeof getCardSpec>>> = [];
      const idleCardSpecs: Array<NonNullable<ReturnType<typeof getCardSpec>>> = [];

      for (const clusterId of dc.clusters) {
        const cluster = current.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;

        // 判断该集群是否有活跃训练项目
        const hasActiveTraining = current.trainingProjects.some(
          (p) => p.clusterId === clusterId && p.status === 'training',
        );
        const workload: WorkloadType = hasActiveTraining ? 'training' : 'idle';

        for (const nodeId of cluster.nodes) {
          const node = current.serverNodes.find((n) => n.id === nodeId);
          if (!node) continue;
          for (const cardUid of node.installedCards) {
            for (const modelId of Object.keys(current.resourceMeta)) {
              const pool = current.resourceMeta[modelId] as CardInstance[] | undefined;
              const card = pool?.find((c) => c.uid === cardUid);
              if (card && card.status === 'online') {
                const spec = getCardSpec(modelId);
                if (spec) {
                  if (workload === 'training') {
                    trainingCardSpecs.push(spec);
                  } else {
                    idleCardSpecs.push(spec);
                  }
                }
                break;
              }
            }
          }
        }
      }

      // 按负载分档计算功耗
      const trainingPowerKW = calcActualPowerDraw(trainingCardSpecs, 'training');
      const idlePowerKW = calcActualPowerDraw(idleCardSpecs, 'idle');
      const totalPowerKW = trainingPowerKW + idlePowerKW;
      const actualPowerMW = totalPowerKW / 1000;

      // 电力成本 = 功耗(kW) × currentPue × 24h × 电价(/kWh) × deltaDays
      const dailyPowerCost = totalPowerKW * effectivePue * 24 * dc.powerCostPerKWh * deltaDays;
      totalDcPowerCost += dailyPowerCost;

      // 过载检测
      if (actualPowerMW > dc.maxPowerMW) {
        overloadDcs.push(dc.id);
      }
    }

    const totalCost = (totalNodeMaintenance + totalClusterOps + totalDcMaintenance) * deltaDays + totalDcPowerCost;

    // 扣款 + PUE 更新
    state.update((draft) => {
      if (totalCost > 0) {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalCost;
      }

      // 更新 PUE 衰减
      for (const { id, newPue } of pueUpdatedDcs) {
        const d = draft.dataCenters.find((x) => x.id === id);
        if (d) d.currentPue = newPue;
      }
    });

    // 2. 处理电力过载：暂停过载数据中心内的训练项目
    if (overloadDcs.length > 0) {
      state.update((draft) => {
        for (const dcId of overloadDcs) {
          const dc = draft.dataCenters.find((d) => d.id === dcId);
          if (!dc) continue;
          for (const clusterId of dc.clusters) {
            for (const project of draft.trainingProjects) {
              if (project.clusterId === clusterId && project.status === 'training') {
                project.status = 'paused';
                project.pauseReason = '电力过载';
              }
            }
          }
        }
      });

      for (const dcId of overloadDcs) {
        events.emit('POWER_OVERLOAD', dcId);
      }
    }

    events.emit('INFRA_MAINTENANCE', {
      nodeMaintenance: totalNodeMaintenance * deltaDays,
      clusterOps: totalClusterOps * deltaDays,
      dcMaintenance: totalDcMaintenance * deltaDays,
      dcPower: totalDcPowerCost,
      total: totalCost,
    });
  }
}
