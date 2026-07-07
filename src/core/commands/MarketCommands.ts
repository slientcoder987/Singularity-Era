/**
 * 市场命令
 */

import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { getCrisisEvent } from '../config/crisisEvents';

export type PricingStrategy = 'free' | 'low' | 'medium' | 'high' | 'premium';

/** 设置定价策略 */
export class SetPricingStrategyCommand implements Command {
  constructor(private strategy: PricingStrategy) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      draft.pricingStrategy = this.strategy;
    });
    events.emit('PRICING_CHANGED', this.strategy);
  }
}

/** 处理危机事件 */
export class ResolveCrisisCommand implements Command {
  constructor(
    private crisisId: string,
    private optionId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const crisis = current.activeCrises.find((c) => c.id === this.crisisId && !c.resolved);
    if (!crisis) {
      events.emit('CRISIS_REJECTED', { reason: '危机不存在或已处理' });
      return;
    }

    const config = getCrisisEvent(crisis.crisisId);
    if (!config) {
      events.emit('CRISIS_REJECTED', { reason: '危机配置不存在' });
      return;
    }

    const option = config.options.find((o) => o.id === this.optionId);
    if (!option) {
      events.emit('CRISIS_REJECTED', { reason: '处理选项不存在' });
      return;
    }

    state.update((draft) => {
      const c = draft.activeCrises.find((x) => x.id === this.crisisId);
      if (c) {
        c.resolved = true;
        c.resolvedOptionId = this.optionId;
      }

      const e = option.effects;
      if (e.funds) draft.resources['funds'] = (draft.resources['funds'] ?? 0) + e.funds;
      if (e.reputation) draft.brandReputation = Math.max(0, Math.min(100, draft.brandReputation + e.reputation));
      if (e.marketPressure) draft.marketPressure = Math.max(0, Math.min(100, draft.marketPressure + e.marketPressure));
      if (e.userLoss) draft.totalUsers = Math.max(0, draft.totalUsers - e.userLoss);

      // 训练进度损失（关联模型）
      if (e.trainingProgress && crisis.modelId) {
        const model = draft.models.find((m) => m.id === crisis.modelId);
        if (model) {
          const loss = model.flopsInvested * Math.abs(e.trainingProgress);
          model.flopsInvested = Math.max(0, model.flopsInvested - loss);
          model.currentStep = Math.max(0, Math.floor(model.currentStep * (1 - Math.abs(e.trainingProgress))));
        }
      }
    });

    events.emit('CRISIS_RESOLVED', this.crisisId, this.optionId);
  }
}
