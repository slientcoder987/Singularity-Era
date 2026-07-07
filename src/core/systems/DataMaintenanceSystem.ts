/**
 * DataMaintenanceSystem
 *
 * 每日推进时，让所有数据集的 freshness 衰减。
 */

import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { clamp } from '../utils';

export class DataMaintenanceSystem implements System {
  name = 'DataMaintenanceSystem';

  update(state: GameState, _events: EventBus, deltaDays: number): void {
    state.update((draft) => {
      for (const ds of draft.datasets) {
        ds.freshness = clamp(ds.freshness - ds.decayPerDay * deltaDays, 0, 100);
      }
    });
  }
}
