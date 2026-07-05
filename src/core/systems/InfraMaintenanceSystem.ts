import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { getCardSpec } from '../config/computeCards';

/**
 * InfraMaintenanceSystem
 *
 * 每日扣除基础设施维护成本：
 * 1. 服务器节点：maintenanceCost
 * 2. 集群：operationalCostPerDay
 * 3. 数据中心：maintenanceCostPerDay + 电力成本
 *    电力成本 = usedPowerMW × PUE × 24h × powerCostPerKWh
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
      totalClusterOps += cluster.operationalCostPerDay;
    }

    let totalDcMaintenance = 0;
    let totalDcPowerCost = 0;
    const overloadDcs: string[] = [];

    for (const dc of current.dataCenters) {
      totalDcMaintenance += dc.maintenanceCostPerDay;

      // 计算实际功耗：遍历集群中所有在线卡
      let actualPowerMW = 0;
      for (const clusterId of dc.clusters) {
        const cluster = current.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        for (const nodeId of cluster.nodes) {
          const node = current.serverNodes.find((n) => n.id === nodeId);
          if (!node) continue;
          for (const cardUid of node.installedCards) {
            for (const modelId of Object.keys(current.resourceMeta)) {
              const pool = current.resourceMeta[modelId] as CardInstance[] | undefined;
              const card = pool?.find((c) => c.uid === cardUid);
              if (card && card.status === 'online') {
                const spec = getCardSpec(modelId);
                actualPowerMW += (spec?.maxPowerDrawKW ?? 0) / 1000;
                break;
              }
            }
          }
        }
      }

      // 电力成本 = 功耗(MW) × PUE × 24h × 电价(/kWh) × 1000(kW/MW)
      const powerCostKW = actualPowerMW * 1000;
      const dailyPowerCost = powerCostKW * dc.pue * 24 * dc.powerCostPerKWh * deltaDays;
      totalDcPowerCost += dailyPowerCost;

      // 过载检测
      if (actualPowerMW > dc.maxPowerMW) {
        overloadDcs.push(dc.id);
      }
    }

    const totalCost = (totalNodeMaintenance + totalClusterOps + totalDcMaintenance) * deltaDays + totalDcPowerCost;

    if (totalCost > 0) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalCost;
      });
    }

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
