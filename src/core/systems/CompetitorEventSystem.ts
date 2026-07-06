/**
 * CompetitorEventSystem
 *
 * 每日检查是否有应触发的竞品事件。
 * 使用 ICompetitorEngine 接口，P0 为脚本式，未来可替换为模拟。
 */

import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import {
  ScriptedCompetitorEngine,
  type ICompetitorEngine,
  type TriggeredCompetitorEvent,
} from '../entities/CompetitorEvent';

export class CompetitorEventSystem implements System {
  name = 'CompetitorEventSystem';
  private engine: ICompetitorEngine;

  constructor(engine?: ICompetitorEngine) {
    this.engine = engine ?? new ScriptedCompetitorEngine();
  }

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();
    const triggeredIds = new Set(current.triggeredEvents.map((e) => e.eventId));
    const toTrigger = this.engine.checkEvents(current.date, triggeredIds);

    if (toTrigger.length === 0) return;

    state.update((draft) => {
      for (const cfg of toTrigger) {
        const triggered: TriggeredCompetitorEvent = {
          eventId: cfg.id,
          triggeredAt: draft.date,
          config: cfg,
        };
        draft.triggeredEvents.push(triggered);

        // 应用效果
        if (cfg.effects.marketPressure) {
          draft.marketPressure = Math.min(1, draft.marketPressure + cfg.effects.marketPressure);
        }
        if (cfg.effects.userLossRate) {
          draft.totalUsers = Math.round(draft.totalUsers * (1 - cfg.effects.userLossRate));
        }
        if (cfg.effects.fundingImpact) {
          draft.resources['funds'] = (draft.resources['funds'] ?? 0) + cfg.effects.fundingImpact;
        }

        events.emit('COMPETITOR_EVENT', cfg.id, cfg.description);
        events.emit(
          'MARKET_PRESSURE_CHANGED',
          draft.marketPressure - (cfg.effects.marketPressure ?? 0),
          draft.marketPressure,
        );
      }
    });
  }
}
