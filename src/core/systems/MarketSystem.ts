/**
 * MarketSystem
 *
 * 每日推进市场：
 * 1. 计算日收入（基于用户数、定价、能力）
 * 2. 用户增长（基于能力、口碑、市场压力、定价）
 * 3. 口碑更新
 * 4. 市场压力缓慢衰减
 */

import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { PricingStrategy } from '../commands/MarketCommands';
import { clamp } from '../utils';
import { EXPLICIT_DIMS, getEffectiveValue } from '../config/capabilityDims';

/** 定价因子 */
const PRICING_FACTOR: Record<PricingStrategy, number> = {
  free: 0,
  low: 0.5,
  medium: 1.0,
  high: 1.8,
  premium: 3.0,
};

/** 定价对用户增长的抑制 */
const PRICING_DRAG: Record<PricingStrategy, number> = {
  free: 1.5,
  low: 1.2,
  medium: 1.0,
  high: 0.7,
  premium: 0.4,
};

/** 用户细分 ARPU（月收入/用户） */
const ARPU = {
  enterprise: 100,
  developer: 20,
  personal: 2,
};

export class MarketSystem implements System {
  name = 'MarketSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const pricing = current.pricingStrategy ?? 'free';

    // 找出最佳已发布模型
    const releasedModels = current.models.filter((m) => m.status === 'released');
    let bestScore = -1;
    for (const m of releasedModels) {
      const caps = m.releasedCapabilities ?? m.capabilities;
      const score = EXPLICIT_DIMS.reduce((s, d) => s + getEffectiveValue(caps, d), 0);
      if (score > bestScore) {
        bestScore = score;
      }
    }

    state.update((draft) => {
      // ===== 日收入 =====
      const segments = draft.userSegments;
      const totalUsers = segments.enterprise + segments.developer + segments.personal;
      const monthlyARPU =
        (segments.enterprise * ARPU.enterprise + segments.developer * ARPU.developer + segments.personal * ARPU.personal) /
        Math.max(1, totalUsers);
      const dailyRevenue = (totalUsers * monthlyARPU * PRICING_FACTOR[pricing]) / 30;
      draft.monthlyRevenue = dailyRevenue * 30;
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + dailyRevenue * deltaDays;

      // ===== 用户增长 =====
      if (bestScore > 0) {
        const avgCapability = bestScore / EXPLICIT_DIMS.length;
        const attractiveness = Math.pow(avgCapability / 100, 2);
        const reputationFactor = 0.5 + draft.brandReputation / 100;
        const baseGrowthRate = 10; // 基础每日增长
        const dailyUserGain =
          baseGrowthRate *
          attractiveness *
          reputationFactor *
          (1 - draft.marketPressure / 100) *
          PRICING_DRAG[pricing] *
          deltaDays;

        // 按比例分配到各细分
        const gain = Math.round(dailyUserGain);
        segments.personal += Math.round(gain * 0.6);
        segments.developer += Math.round(gain * 0.3);
        segments.enterprise += Math.round(gain * 0.1);
        draft.totalUsers = segments.enterprise + segments.developer + segments.personal;
      }

      // ===== 口碑更新（向 50 回归） =====
      const targetRep = bestScore > 0 ? clamp(30 + bestScore / 10, 30, 95) : 50;
      draft.brandReputation = clamp(
        draft.brandReputation + (targetRep - draft.brandReputation) * 0.01 * deltaDays,
        0,
        100,
      );

      // ===== 市场压力衰减 =====
      draft.marketPressure = clamp(draft.marketPressure - 0.1 * deltaDays, 0, 100);
    });

    events.emit('MARKET_UPDATED', current.totalUsers, current.monthlyRevenue);
  }
}
