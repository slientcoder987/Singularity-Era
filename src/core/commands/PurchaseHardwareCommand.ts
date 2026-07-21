import type { GameState, HardwareOrder } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { getCardSpec } from '../config/computeCards';
import { formatGameDate } from '../utils';

/**
 * PurchaseHardwareCommand
 *
 * 采购硬件：检查发布日期 → 检查资金 → 扣款 → 创建采购订单（存入 pendingOrders）。
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

    // 发布日期检查：游戏当前日期 < releaseDate 时禁止采购
    if (spec.releaseDate) {
      const current = state.read();
      const currentDateStr = formatGameDate(current.startDate, current.date);
      if (currentDateStr < spec.releaseDate) {
        events.emit('PURCHASE_REJECTED', {
          modelId: this.modelId,
          reason: `${spec.name} 尚未发布（发布日期 ${spec.releaseDate}）`,
        });
        return;
      }
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
      // S3-1 修复：原 Date.now()+Math.random 同毫秒高频采购可能碰撞。改用 crypto.randomUUID。
      id: `order-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`,
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
