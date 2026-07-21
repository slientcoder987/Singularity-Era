import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { getCardSpec } from '../config/computeCards';
import { type WorkloadType } from '../utils/computeUtilization';
import { getRegionModifiers } from './RegionSystem';
import { getCompanyPowerReduction } from '../utils/crossSystemUtils';

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

    // ★ 性能：预建 cluster Map 索引，O(N) 替代 N×M 次 find
    const clusterById = new Map(current.clusters.map((c) => [c.id, c]));

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
      // ★ 性能优化：用聚合桶 O(桶数) 统计替代 O(卡数) 的 UID 遍历
      //   10万卡场景：O(几千桶) vs O(10万UID + cardIndex.get + push spec)
      let trainingPowerKW = 0;
      let idlePowerKW = 0;

      for (const clusterId of dc.clusters) {
        const cluster = clusterById.get(clusterId);
        if (!cluster) continue;

        // 判断该集群是否有活跃训练项目
        const hasActiveTraining = current.trainingProjects.some(
          (p) => p.clusterId === clusterId && p.status === 'training',
        );
        const workload: WorkloadType = hasActiveTraining ? 'training' : 'idle';
        const powerFactor = workload === 'idle' ? 0.10 : 0.95;
        const clusterNodeSet = new Set(cluster.nodes);

        // 遍历所有 modelId 池的聚合桶，按 location ∈ cluster.nodes 累加功耗
        for (const modelId of Object.keys(current.resourceMeta)) {
          const pool = current.resourceMeta[modelId];
          if (!pool || !Array.isArray((pool as any).aggregates)) continue;
          const spec = getCardSpec(modelId);
          if (!spec) continue;
          for (const agg of (pool as any).aggregates) {
            if (agg.status === 'online' && agg.count > 0 && agg.location && clusterNodeSet.has(agg.location)) {
              const power = agg.count * spec.maxPowerDrawKW * powerFactor;
              if (workload === 'training') {
                trainingPowerKW += power;
              } else {
                idlePowerKW += power;
              }
            }
          }
        }
      }
      const totalPowerKW = trainingPowerKW + idlePowerKW;
      const actualPowerMW = totalPowerKW / 1000;

      // ★ Bug #3 修复：电力成本只计算 PUE 乘数效应（冷却/照明等额外功耗）
      // 卡本身功耗电费由 PowerSystem 统一处理（超容购电或自建电站覆盖）
      // PUE 1.2 意味着每 1kW IT 负载需要额外 0.2kW 冷却功耗
      const regionMods = getRegionModifiers(current.headquartersRegionId);
      // 改进 B：系统工程师 infra_efficiency 技能降低冷却功耗
      const powerReduction = getCompanyPowerReduction(current);
      const coolingOverheadKW = totalPowerKW * (effectivePue - 1) * (1 - powerReduction);
      const dailyPowerCost = coolingOverheadKW * 24 * dc.powerCostPerKWh * regionMods.energyMultiplier * deltaDays;
      totalDcPowerCost += dailyPowerCost;

      // 过载检测
      if (actualPowerMW > dc.maxPowerMW) {
        overloadDcs.push(dc.id);
      }
    }

    const totalNonPowerCost = (totalNodeMaintenance + totalClusterOps + totalDcMaintenance) * deltaDays;
    const totalCost = totalNonPowerCost + totalDcPowerCost;

    // 扣款 + PUE 更新
    state.update((draft) => {
      // ★ P0-2 修复：Math.max(0, ...) 保护资金下界
      if (totalCost > 0) {
        draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - totalCost);
      }

      // 设计-2：把冷却功耗电费累加到 lastDayPowerCost（与 PowerSystem 的 IT 电费合并）
      if (totalDcPowerCost > 0) {
        if (draft.lastDayPowerCostDate !== current.date) {
          draft.lastDayPowerCostDate = current.date;
          draft.lastDayPowerCost = 0;
        }
        draft.lastDayPowerCost += totalDcPowerCost;
      }

      // ★ R1：把非电力维护成本（节点+集群+DC 维护）累加到 lastDayInfraCost，
      //     供 RegionSystem 计算利润税基 O(1) 读取，避免重复 O(N) 遍历。
      if (totalNonPowerCost > 0) {
        if (draft.lastDayInfraCostDate !== current.date) {
          draft.lastDayInfraCostDate = current.date;
          draft.lastDayInfraCost = 0;
        }
        draft.lastDayInfraCost += totalNonPowerCost;
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
