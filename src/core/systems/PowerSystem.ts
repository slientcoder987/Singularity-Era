import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { ResourceRegistry } from '../resources/ResourceRegistry';
import { COMPUTE_CARD_SPECS } from '../config/computeCards';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import { POWER_CONFIG } from '../config/resources';
import { getRegionModifiers } from './RegionSystem';
import { countInstalledOnlineCards } from '../utils/cardAggregate';

/**
 * PowerSystem
 *
 * 关注电力资源（power_kw）。
 * 职责：
 * 1. 每日计算总功耗：所有在线硬件卡的功耗总和 + 基础设施耗电。
 * 2. 与电力容量（resources['power_kw']）比较：
 *    - 若功耗 <= 容量：正常供电，无额外费用。
 *    - 若功耗 > 容量：超出部分自动从地区电网购电，按市场电价扣费。
 *      电价 = 基础电价 × 地区能源成本乘数 × 24h × 超出kW × deltaDays
 * 3. 电力容量可通过 BuildPowerPlantCommand 增加（自建电站降低电网依赖）。
 *
 * 无硬性停电：超容不再中断运营，而是产生额外电费开支。
 */
export class PowerSystem implements System {
  name = 'PowerSystem';
  private readonly registry: ResourceRegistry;
  private readonly specs = new Map<string, ComputeCardSpec>();

  constructor(registry: ResourceRegistry) {
    this.registry = registry;
    for (const spec of COMPUTE_CARD_SPECS) {
      this.specs.set(spec.resourceId, spec);
    }
  }

  update(state: GameState, events: EventBus, deltaDays: number): void {
    if (deltaDays <= 0) return;
    const hardwareDefs = this.registry.getByCategory('hardware');

    // 1. 计算在线硬件总功耗
    // ★ P0-1 修复：baseConsumptionKW 是数据中心基础设施照明/监控等基础耗电
    //   （已包含在 PUE 1.0 之内），不再重复收取 IT 电费
    //   冷却部分 (PUE-1) 由 InfraMaintenanceSystem 收取
    //   PowerSystem 只收 IT 设备耗电
    let itPowerKW = 0;
    const current = state.read();

    for (const def of hardwareDefs) {
      const spec = this.specs.get(def.id);
      if (!spec) continue;
      // ★ 修复：只统计已安装到节点的 online 卡；库存/运输中（location=null）不耗电
      const installedCount = countInstalledOnlineCards(current.resourceMeta[def.id]);
      itPowerKW += installedCount * spec.powerPerCard;
    }

    // 2. 与电力容量比较
    const capacityKW = current.resources['power_kw'] ?? 0;
    const excessKW = Math.max(0, itPowerKW - capacityKW);

    // 3. 电力计费
    if (itPowerKW > 0) {
      const regionMods = getRegionModifiers(current.headquartersRegionId);
      const marketPricePerKWh = POWER_CONFIG.pricePerKWh * regionMods.energyMultiplier;

      // 自建电站覆盖部分：按各 DC 实际承载 kW 加权平均电价
      // ★ P0-1 修复：之前是简单算术平均，多 DC 不同电价时全员按均价收
      //   修正后按各 DC maxPowerMW 加权
      let totalWeight = 0;
      let weightedPriceSum = 0;
      for (const dc of current.dataCenters) {
        const weight = dc.maxPowerMW;
        totalWeight += weight;
        weightedPriceSum += dc.powerCostPerKWh * weight;
      }
      const dcPricePerKWh = totalWeight > 0
        ? weightedPriceSum / totalWeight
        : marketPricePerKWh;

      const coveredKW = Math.min(itPowerKW, capacityKW);
      const uncoveredKW = Math.max(0, itPowerKW - capacityKW);

      // 覆盖部分费用 + 超容部分费用
      const coveredCost = coveredKW * 24 * dcPricePerKWh * deltaDays;
      const gridCost = uncoveredKW * 24 * marketPricePerKWh * deltaDays;
      const totalPowerCost = coveredCost + gridCost;

      // ★ P0-2 修复：使用 addResource 统一保护资金下界
      state.addResource('funds', -totalPowerCost);
      state.update((draft) => {
        // 设计-2：累加当日电力成本，供 RegionSystem 计算利润税基
        if (draft.lastDayPowerCostDate !== current.date) {
          draft.lastDayPowerCostDate = current.date;
          draft.lastDayPowerCost = 0;
        }
        draft.lastDayPowerCost += totalPowerCost;
      });

      if (uncoveredKW > 0) {
        events.emit('GRID_PURCHASE', {
          consumptionKW: itPowerKW,
          capacityKW,
          excessKW: uncoveredKW,
          marketPricePerKWh,
          dailyCost: gridCost / deltaDays,
          deltaDays,
        });
      }
    }

    // 4. 发射电力平衡事件（供 UI 和其他系统使用）
    events.emit('POWER_BALANCE', {
      consumptionKW: itPowerKW,
      capacityKW,
      shortage: false, // 不再有硬性停电
      excessKW,
      deltaDays,
    });
  }
}
