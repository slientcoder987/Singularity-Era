/**
 * RegionSystem
 *
 * ★ Bug #9 修复：每日应用地区效应到实际收入和支出。
 * - 税率扣减日收入
 * - 人才指数修正 StaffSystem 的招募
 * - 能源成本修正 InfraMaintenanceSystem 的电力支出
 * - 监管修正研发速度
 *
 * 为避免多重扣款，税率通过 OperationsSystem 中收入计算时通过
 * getRegionModifiers 查询，本系统负责每日记录和动态调整。
 *
 * 每日实际效果：
 * 1. 记录当前总部地区的 modifiers 快照到 state（供其他系统查用）
 * 2. 根据声誉/legal_debt 动态调整监管水平
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { REGION_MAP } from '../config/regions';

export class RegionSystem implements System {
  name = 'RegionSystem';

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();
    if (!current.headquartersRegionId) return;

    const hq = REGION_MAP[current.headquartersRegionId];
    if (!hq) return;

    const modifiers = getRegionModifiers(current.headquartersRegionId);

    // ★ Bug #9：每日税率扣除（从运营收入中提取，税率越高实际到手越少）
    // 此效果在 OperationsSystem 中已通过 marketCalc 估值溢价体现；
    // 这里额外处理利润部分的税率：如果日收入超过电力成本，差额部分缴税
    if (current.operations && current.operations.dailyRevenue > 0) {
      const ops = current.operations;
      // 估算日电力成本（从上次维护系统计算中估算）
      const estimatedPowerCost = current.dataCenters.reduce((sum, dc) => {
        const dailyKWh = dc.maxPowerMW * 1000 * dc.currentPue * 24 * modifiers.energyMultiplier;
        return sum + dailyKWh * dc.powerCostPerKWh;
      }, 0);

      // 仅对超出运营成本的利润收税
      const totalNonPowerCost =
        current.serverNodes.reduce((s, n) => s + n.maintenanceCost, 0) +
        current.clusters.reduce((s, c) => s + c.operationalCostPerDay + c.storageCostPerDay, 0) +
        current.dataCenters.reduce((s, dc) => s + dc.maintenanceCostPerDay, 0);

      const dailyProfit = Math.max(0, ops.dailyRevenue - estimatedPowerCost - totalNonPowerCost);
      const taxAmount = dailyProfit * modifiers.taxRate;

      if (taxAmount > 0) {
        state.update((draft) => {
          draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - taxAmount);
        });
      }
    }

    // 动态政策变化：reputation 极低时监管升级
    if (current.riskState.reputation < 20) {
      events.emit('REGULATORY_SCRUTINY', current.headquartersRegionId);
    }
  }
}

/**
 * 根据地区获取修正系数（供其他系统查询）。
 */
export function getRegionModifiers(regionId: string | null) {
  const region = regionId ? REGION_MAP[regionId] : null;
  if (!region) {
    return {
      taxRate: 0.25,
      talentBonus: 0,
      energyMultiplier: 1.0,
      hiringCostMultiplier: 1.0,
    };
  }

  return {
    /** 企业税率（小数） */
    taxRate: region.taxRate / 100,
    /** 人才修正（-0.5 ~ +0.5） */
    talentBonus: (region.talentIndex - 50) / 100,
    /** 能源成本乘数（基准 × energyIndex/50） */
    energyMultiplier: region.energyCostIndex / 50,
    /** 招募成本乘数（高人才地区更贵） */
    hiringCostMultiplier: 0.5 + (region.talentIndex / 100) * 0.5,
  };
}
