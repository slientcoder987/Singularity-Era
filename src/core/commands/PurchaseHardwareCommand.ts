import type { GameState, HardwareOrder } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { getCardSpec } from '../config/computeCards';

/**
 * PurchaseHardwareCommand
 *
 * 采购硬件：检查资金 → 扣款 → 创建采购订单（存入 pendingOrders）。
 * 订单会在 deliveryDays 天后由 ComputeHardwareSystem 交付并生成卡实例。
 *
 * 参数：modelId 对应资源 id（如 'compute_h100'），quantity 为数量。
 */
export class PurchaseHardwareCommand implements Command {
  constructor(
    public readonly modelId: string,
    public readonly quantity: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    if (this.quantity <= 0) {
      events.emit('PURCHASE_REJECTED', { modelId: this.modelId, reason: '数量必须大于 0' });
      return;
    }

    const spec = getCardSpec(this.modelId);
    if (!spec) {
      events.emit('PURCHASE_REJECTED', { modelId: this.modelId, reason: '未知硬件型号' });
      return;
    }

    const totalCost = spec.unitCost * this.quantity;
    const funds = state.getResource('funds');

    if (funds < totalCost) {
      events.emit('PURCHASE_REJECTED', {
        modelId: this.modelId,
        quantity: this.quantity,
        totalCost,
        funds,
        reason: '资金不足',
      });
      return;
    }

    // 扣款
    state.addResource('funds', -totalCost);

    // 创建采购订单
    const today = state.read().date;
    const order: HardwareOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      modelId: this.modelId,
      quantity: this.quantity,
      deliveryDay: today + spec.deliveryDays,
      createdAt: today,
    };

    state.update((draft) => {
      draft.pendingOrders.push(order);
    });

    events.emit('PURCHASE_ORDERED', order, totalCost);
  }
}
