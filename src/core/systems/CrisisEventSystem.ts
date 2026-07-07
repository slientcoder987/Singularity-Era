/**
 * CrisisEventSystem
 *
 * 每日检查危机触发条件，生成待处理的危机事件。
 */

import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { CRISIS_EVENTS } from '../config/crisisEvents';
import { createActiveCrisis } from '../entities/ActiveCrisis';
import { getParamSize } from '../config/paramSizes';

export class CrisisEventSystem implements System {
  name = 'CrisisEventSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // 每天最多触发一次危机检查（deltaDays 可能 > 1，按概率累乘）
    const triggered: Array<{ crisisId: string; modelId?: string; description: string }> = [];

    for (const crisisCfg of CRISIS_EVENTS) {
      const t = crisisCfg.trigger;

      if (t.randomProbability) {
        // 随机危机
        const prob = 1 - Math.pow(1 - t.randomProbability, deltaDays);
        if (Math.random() < prob) {
          const active = createActiveCrisis(crisisCfg.id, current.date);
          state.update((draft) => {
            draft.activeCrises.push(active);
          });
          triggered.push({ crisisId: crisisCfg.id, description: crisisCfg.description });
        }
      } else if (t.minStabilityRisk && t.minParamSizeB) {
        // 基于训练状态的危机：检查所有训练中模型
        for (const model of current.models) {
          if (model.status !== 'training') continue;
          const paramSize = getParamSize(model.config.paramSizeId);
          if (!paramSize) continue;
          if (paramSize.paramCountB < t.minParamSizeB) continue;
          if (model.stabilityRisk < t.minStabilityRisk) continue;

          // 风险越高触发概率越大
          const prob = model.stabilityRisk * 0.1 * deltaDays;
          if (Math.random() < prob) {
            const active = createActiveCrisis(crisisCfg.id, current.date, model.id);
            state.update((draft) => {
              draft.activeCrises.push(active);
              // 暂停相关模型训练
              const m = draft.models.find((x) => x.id === model.id);
              if (m) {
                m.status = 'paused';
                m.pauseReason = `危机事件：${crisisCfg.description}`;
              }
            });
            triggered.push({ crisisId: crisisCfg.id, modelId: model.id, description: crisisCfg.description });
            break; // 同类危机每天最多触发一次
          }
        }
      }
    }

    for (const t of triggered) {
      events.emit('CRISIS_TRIGGERED', t.crisisId, t.description, t.modelId);
    }
  }
}
