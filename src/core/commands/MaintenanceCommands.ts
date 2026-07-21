import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';

/**
 * 购买维护合同命令（数值修复：应对后期硬件故障频发）
 *
 * 玩家在后期面临 CARD_FAILED / NODE_FAILED 频发，但游戏内缺乏主动维护手段。
 * 维护合同提供一个用资金换可靠性的机制：
 * - 购买后在有效期内将所有卡/节点的故障率乘以 maintenanceMultiplier
 * - 合同到期后需续购
 *
 * 档位：
 * | 档位     | 费用/天 | 故障率倍率 | 说明                     |
 * |---------|---------|-----------|--------------------------|
 * | basic   | $2,000  | 0.85      | 基础巡检                  |
 * | standard| $5,000  | 0.70      | 标准维护+备件             |
 * | premium | $12,000 | 0.50      | 7×24 驻场+预测性维护      |
 */
export type MaintenanceTier = 'basic' | 'standard' | 'premium';

interface MaintenanceContractState {
  tier: MaintenanceTier;
  /** 故障率倍率 */
  multiplier: number;
  /** 每日费用（美元） */
  costPerDay: number;
  /** 到期日（游戏天数） */
  expiresAt: number;
}

const TIER_CONFIG: Record<MaintenanceTier, { multiplier: number; costPerDay: number }> = {
  basic: { multiplier: 0.85, costPerDay: 2_000 },
  standard: { multiplier: 0.70, costPerDay: 5_000 },
  premium: { multiplier: 0.50, costPerDay: 12_000 },
};

/** 读取当前生效的维护合同故障率倍率（无合同或已过期返回 1.0） */
export function getMaintenanceMultiplier(state: GameState): number {
  const contract = state.read().resourceMeta['maintenance_contract'] as MaintenanceContractState | undefined;
  if (!contract) return 1.0;
  if (state.read().date > contract.expiresAt) return 1.0;
  return contract.multiplier;
}

export class PurchaseMaintenanceContractCommand implements Command {
  constructor(
    private readonly tier: MaintenanceTier,
    private readonly durationDays: number = 90,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const config = TIER_CONFIG[this.tier];
    if (!config) {
      events.emit('MAINTENANCE_REJECTED', { reason: `未知维护档位: ${String(this.tier)}` });
      return;
    }
    if (!Number.isFinite(this.durationDays) || this.durationDays <= 0) {
      events.emit('MAINTENANCE_REJECTED', { reason: '合同天数必须为正数' });
      return;
    }

    const current = state.read();
    const totalCost = config.costPerDay * this.durationDays;
    const funds = current.resources['funds'] ?? 0;
    if (funds < totalCost) {
      events.emit('MAINTENANCE_REJECTED', { reason: '资金不足', cost: totalCost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = Math.max(0, funds - totalCost);
      const contract: MaintenanceContractState = {
        tier: this.tier,
        multiplier: config.multiplier,
        costPerDay: config.costPerDay,
        expiresAt: draft.date + this.durationDays,
      };
      draft.resourceMeta['maintenance_contract'] = contract;
    });

    events.emit('MAINTENANCE_PURCHASED', {
      tier: this.tier,
      multiplier: config.multiplier,
      durationDays: this.durationDays,
      totalCost,
    });
  }
}
