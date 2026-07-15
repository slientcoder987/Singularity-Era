import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { ResourceRegistry } from '../resources/ResourceRegistry';
import { COMPUTE_CARD_SPECS } from '../config/computeCards';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import { POWER_CONFIG } from '../config/resources';
import { getRegionModifiers } from './RegionSystem';

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
    const hardwareDefs = this.registry.getByCategory('hardware');

    // 1. 计算在线硬件总功耗
    let totalPowerKW = POWER_CONFIG.baseConsumptionKW;
    const current = state.read();

    for (const def of hardwareDefs) {
      const spec = this.specs.get(def.id);
      if (!spec) continue;
      const pool = (current.resourceMeta[def.id] as CardInstance[]) ?? [];
      const onlineCount = pool.filter((c) => c.status === 'online').length;
      totalPowerKW += onlineCount * spec.powerPerCard;
    }

    // 2. 与电力容量比较
    const capacityKW = current.resources['power_kw'] ?? 0;
    const excessKW = Math.max(0, totalPowerKW - capacityKW);

    // 3. 电力计费
    // ★ Bug #3 修复：PowerSystem 统一收取 IT 功耗电费
    // 自建电站覆盖容量内按数据中心电价收费，超出部分按市场电价（更高）收费
    // 冷却功耗（PUE-1 部分）由 InfraMaintenanceSystem 收取
    const itPowerKW = totalPowerKW; // 卡本身功耗
    const coveredKW = Math.min(itPowerKW, capacityKW);
    const uncoveredKW = Math.max(0, itPowerKW - capacityKW);

    if (itPowerKW > 0) {
      const regionMods = getRegionModifiers(current.headquartersRegionId);
      const marketPricePerKWh = POWER_CONFIG.pricePerKWh * regionMods.energyMultiplier;

      // 自建电站覆盖部分：按数据中心电价（较低）
      const dcPowerCost = current.dataCenters.reduce((sum, dc) => {
        return sum + dc.powerCostPerKWh;
      }, 0);
      const dcPricePerKWh = current.dataCenters.length > 0
        ? dcPowerCost / current.dataCenters.length
        : marketPricePerKWh;

      // 覆盖部分费用 + 超容部分费用
      const coveredCost = coveredKW * 24 * dcPricePerKWh * deltaDays;
      const gridCost = uncoveredKW * 24 * marketPricePerKWh * deltaDays;
      const totalPowerCost = coveredCost + gridCost;

      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalPowerCost;
        // 设计-2：累加当日电力成本，供 RegionSystem 计算利润税基
        if (draft.lastDayPowerCostDate !== current.date) {
          draft.lastDayPowerCostDate = current.date;
          draft.lastDayPowerCost = 0;
        }
        draft.lastDayPowerCost += totalPowerCost;
      });

      if (uncoveredKW > 0) {
        events.emit('GRID_PURCHASE', {
          consumptionKW: totalPowerKW,
          capacityKW,
          excessKW,
          marketPricePerKWh,
          dailyCost: gridCost / deltaDays,
          deltaDays,
        });
      }
    }

    // 4. 发射电力平衡事件（供 UI 和其他系统使用）
    events.emit('POWER_BALANCE', {
      consumptionKW: totalPowerKW,
      capacityKW,
      shortage: false, // 不再有硬性停电
      excessKW,
      deltaDays,
    });
  }
}
