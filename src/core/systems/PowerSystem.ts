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

    // 3. 超容部分自动从电网购电
    if (excessKW > 0) {
      const regionMods = getRegionModifiers(current.headquartersRegionId);
      // 市场电价 = 基础电价 × 地区能源乘数
      const marketPricePerKWh = POWER_CONFIG.pricePerKWh * regionMods.energyMultiplier;
      // 日费用 = 超出kW × 24h × 电价 × deltaDays
      const gridCost = excessKW * 24 * marketPricePerKWh * deltaDays;

      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - gridCost;
      });

      events.emit('GRID_PURCHASE', {
        consumptionKW: totalPowerKW,
        capacityKW,
        excessKW,
        marketPricePerKWh,
        dailyCost: gridCost / deltaDays,
        deltaDays,
      });
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
