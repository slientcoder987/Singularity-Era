import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { ResourceRegistry } from '../resources/ResourceRegistry';
import { COMPUTE_CARD_SPECS } from '../config/computeCards';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { CloudRentalContract } from '../commands/RentComputeCommand';
import {
  type CardPool,
  addCards,
  createEmptyPool,
  migrateFromCards,
} from '../utils/cardAggregate';

/** 类型守卫：判断资源池是否为新聚合格式 */
function isCardPool(v: unknown): v is CardPool {
  return !!v && typeof v === 'object' && Array.isArray((v as any).aggregates);
}

/**
 * ComputeHardwareSystem（聚合存储版）
 *
 * 关注硬件类资源（compute_h100, compute_a100 等）。
 * 职责：
 * 1. 处理采购订单交付：从 pendingOrders 中取出今日到期的订单，按桶 addCards 入池
 *    （1000 卡订单 → 1 个新桶），并增加对应资源数值。
 *
 * 硬件实例池存储在 state.resourceMeta[modelId] 中（CardPool）。
 * 资源数值（resources[modelId]）作为数量统计，与实例池保持同步。
 *
 * 扩展新硬件型号：只需在 config/computeCards.ts 添加配置并注册对应资源，本系统自动处理。
 */
export class ComputeHardwareSystem implements System {
  name = 'ComputeHardwareSystem';
  private readonly specs = new Map<string, ComputeCardSpec>();

  constructor(_registry: ResourceRegistry) {
    for (const spec of COMPUTE_CARD_SPECS) {
      this.specs.set(spec.resourceId, spec);
    }
  }

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();
    const today = current.date;

    // 1. 处理到期订单交付
    const dueOrders = current.pendingOrders.filter((o) => o.deliveryDay <= today);
    if (dueOrders.length > 0) {
      let tflopsGained = 0;

      state.update((draft) => {
        // 移除已交付订单
        draft.pendingOrders = draft.pendingOrders.filter((o) => o.deliveryDay > today);

        for (const order of dueOrders) {
          const spec = this.specs.get(order.modelId);
          const rawPool = draft.resourceMeta[order.modelId];
          let pool: CardPool;
          if (isCardPool(rawPool)) {
            pool = rawPool;
          } else if (Array.isArray(rawPool)) {
            // 旧版数组，迁移
            pool = migrateFromCards(rawPool, order.modelId);
          } else {
            pool = createEmptyPool();
          }
          // 聚合 addCards：1000 卡 → 1 个 ageBucket=0 桶
          pool = addCards(pool, order.modelId, order.quantity, today);
          draft.resourceMeta[order.modelId] = pool;
          // 同步硬件资源数值
          draft.resources[order.modelId] = (draft.resources[order.modelId] ?? 0) + order.quantity;
          // 同步算力
          if (spec) {
            const addedTFlops = order.quantity * spec.tflopsPerCard;
            draft.resources['compute_power'] = (draft.resources['compute_power'] ?? 0) + addedTFlops;
            tflopsGained += addedTFlops;
          }
        }
      });

      for (const order of dueOrders) {
        events.emit('HARDWARE_DELIVERED', order.modelId, order.quantity);
      }
      if (tflopsGained > 0) {
        events.emit('COMPUTE_POWER_CHANGED', tflopsGained);
      }
    }

    // 注意：计算卡磨损与故障由 InfrastructureFailureSystem 统一处理（按桶统计）

    // 3. 处理云算力租赁合约到期
    const rawCloudContracts = current.resourceMeta['cloud_rental_contracts'];
    const cloudContracts: CloudRentalContract[] = Array.isArray(rawCloudContracts) ? rawCloudContracts : [];
    const expiredContracts = cloudContracts.filter((c) => c.expiresAt <= today);
    if (expiredContracts.length > 0) {
      let tfopsReleased = 0;
      for (const contract of expiredContracts) {
        tfopsReleased += contract.tflops;
      }
      state.update((draft) => {
        const rawActive = draft.resourceMeta['cloud_rental_contracts'];
        const activeContracts: CloudRentalContract[] = Array.isArray(rawActive) ? rawActive : [];
        draft.resourceMeta['cloud_rental_contracts'] = activeContracts.filter((c) => c.expiresAt > today);
      });
      for (const contract of expiredContracts) {
        events.emit('CLOUD_RENTAL_EXPIRED', {
          providerId: contract.providerId,
          tflops: contract.tflops,
          contractId: contract.id,
        });
      }
    }
  }

  /**
   * 获取某型号当前可用的（在线未分配）卡数（聚合版）
   * 返回 0 或正整数
   */
  getAvailableCardCount(state: GameState, modelId: string): number {
    const pool = state.getResourceMeta<CardPool>(modelId);
    if (!pool || !isCardPool(pool)) return 0;
    let n = 0;
    for (const agg of pool.aggregates) {
      if (agg.status === 'online' && agg.location === null) n += agg.count;
    }
    return n;
  }
}
