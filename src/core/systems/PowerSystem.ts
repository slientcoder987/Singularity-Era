import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { ResourceRegistry } from '../resources/ResourceRegistry';
import { HARDWARE_SPECS, POWER_CONFIG } from '../config/resources';

/**
 * PowerSystem
 *
 * 关注电力资源（power_kw）。
 * 职责：
 * 1. 每日计算总功耗：所有在线硬件卡的功耗总和 + 基础设施耗电。
 * 2. 与电力容量（resources['power_kw']）比较：
 *    - 若功耗 <= 容量：正常供电，从电网购电费用计入 funds。
 *    - 若功耗 > 容量：超出部分按更高惩罚电价扣费，并广播 POWER_SHORTAGE。
 * 3. 电力容量可通过 BuildPowerPlantCommand 增加。
 *
 * 电价模型：每天按 24 小时计算，1 kW 容量占用费 + 实际耗电费。
 * 简化：仅按实际耗电 kW * 24h * pricePerKWh 计费。
 */
export class PowerSystem implements System {
  name = 'PowerSystem';
  private readonly registry: ResourceRegistry;
  private readonly specs = new Map<string, typeof HARDWARE_SPECS[number]>();

  constructor(registry: ResourceRegistry) {
    this.registry = registry;
    for (const spec of HARDWARE_SPECS) {
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

    // 2. 计算电费
    const capacityKW = current.resources['power_kw'] ?? 0;
    const hoursPerDay = 24;
    let cost = 0;
    let shortage = false;

    if (totalPowerKW <= capacityKW) {
      // 正常供电
      cost = totalPowerKW * hoursPerDay * POWER_CONFIG.pricePerKWh * deltaDays;
    } else {
      // 超出部分按惩罚电价 2 倍计费
      const normalCost = capacityKW * hoursPerDay * POWER_CONFIG.pricePerKWh * deltaDays;
      const excess = totalPowerKW - capacityKW;
      const penaltyCost = excess * hoursPerDay * POWER_CONFIG.pricePerKWh * 2 * deltaDays;
      cost = normalCost + penaltyCost;
      shortage = true;
    }

    if (cost > 0) {
      state.addResource('funds', -cost);
    }

    events.emit('POWER_BALANCE', {
      consumptionKW: totalPowerKW,
      capacityKW,
      cost,
      shortage,
      deltaDays,
    });

    if (shortage) {
      events.emit('POWER_SHORTAGE', {
        consumptionKW: totalPowerKW,
        capacityKW,
        excessKW: totalPowerKW - capacityKW,
      });
    }
  }
}
