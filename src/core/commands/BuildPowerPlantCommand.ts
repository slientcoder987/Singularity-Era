import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { POWER_CONFIG } from '../config/resources';

/**
 * BuildPowerPlantCommand
 *
 * 建造电站：扣款 → 增加 power_kw 资源容量。
 * 可在 resourceMeta['power_plants'] 中记录电站元数据列表。
 */
export class BuildPowerPlantCommand implements Command {
  constructor(public readonly capacityKW: number) {}

  execute(state: GameState, events: EventBus): void {
    if (this.capacityKW <= 0) {
      events.emit('POWER_PLANT_REJECTED', { reason: '容量必须大于 0' });
      return;
    }

    const cost = this.capacityKW * POWER_CONFIG.powerPlantCostPerKW;
    const funds = state.getResource('funds');

    if (funds < cost) {
      events.emit('POWER_PLANT_REJECTED', {
        capacityKW: this.capacityKW,
        cost,
        funds,
        reason: '资金不足',
      });
      return;
    }

    // 扣款
    state.addResource('funds', -cost);

    // 增加电力容量
    state.addResource('power_kw', this.capacityKW);

    // 记录电站元数据（防御：旧存档可能被展平为对象）
    const today = state.read().date;
    const rawPlants = state.getResourceMeta<any>('power_plants');
    const plants: Array<{ id: string; capacityKW: number; builtAt: number; cost: number }> =
      Array.isArray(rawPlants) ? rawPlants : [];
    const newPlant = {
      id: `plant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      capacityKW: this.capacityKW,
      builtAt: today,
      cost,
    };
    state.setResource('power_plants', plants.length + 1, [...plants, newPlant]);

    events.emit('POWER_PLANT_BUILT', newPlant);
  }
}
