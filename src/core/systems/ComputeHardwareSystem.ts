import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { ResourceRegistry } from '../resources/ResourceRegistry';
import { COMPUTE_CARD_SPECS } from '../config/computeCards';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import { getCardTflops } from '../entities/ComputeCard';

/**
 * ComputeHardwareSystem
 *
 * 关注硬件类资源（compute_h100, compute_a100 等）。
 * 职责：
 * 1. 处理采购订单交付：从 pendingOrders 中取出今日到期的订单，生成 CardInstance 入池，
 *    并增加对应资源数值。
 * 2. 计算卡磨损与故障：每张在线卡按 wearPerDay 概率故障，故障则状态置为 broken，
 *    资源数值相应减少。
 *
 * 硬件实例池存储在 state.resourceMeta[modelId] 中（CardInstance[]）。
 * 资源数值（resources[modelId]）作为数量统计，与实例池保持同步。
 * CardInstance.location 指向所在节点 id（未安装为 null）。
 *
 * 扩展新硬件型号：只需在 config/computeCards.ts 添加配置并注册对应资源，本系统自动处理。
 */
export class ComputeHardwareSystem implements System {
  name = 'ComputeHardwareSystem';
  private readonly registry: ResourceRegistry;
  private readonly specs = new Map<string, ComputeCardSpec>();

  constructor(registry: ResourceRegistry) {
    this.registry = registry;
    for (const spec of COMPUTE_CARD_SPECS) {
      this.specs.set(spec.resourceId, spec);
    }
  }

  update(state: GameState, events: EventBus, deltaDays: number): void {
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
          const pool = (draft.resourceMeta[order.modelId] as CardInstance[]) ?? [];
          for (let i = 0; i < order.quantity; i++) {
            pool.push({
              uid: `${order.modelId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
              modelId: order.modelId,
              status: 'online',
              age: 0,
              assignedProjectId: null,
              purchasedAt: today,
              location: null,
            });
          }
          draft.resourceMeta[order.modelId] = pool;
          // 同步硬件资源数值
          draft.resources[order.modelId] = (draft.resources[order.modelId] ?? 0) + order.quantity;
          // 同步算力（compute_power 以 BF16 为基准统计，供资源面板参考）
          if (spec) {
            const addedTFlops = order.quantity * getCardTflops(spec, 'bf16');
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

    // 2. 计算卡磨损与故障
    const hardwareDefs = this.registry.getByCategory('hardware');
    let totalBroken = 0;
    let tflopsLost = 0;
    const brokenReport: Array<{ modelId: string; count: number }> = [];

    state.update((draft) => {
      for (const def of hardwareDefs) {
        const spec = this.specs.get(def.id);
        if (!spec) continue;
        const pool = (draft.resourceMeta[def.id] as CardInstance[]) ?? [];
        if (pool.length === 0) continue;

        let brokenCount = 0;
        for (const card of pool) {
          if (card.status === 'online') {
            card.age += deltaDays;
            // 每日按 wearPerDay 概率故障
            if (Math.random() < spec.wearPerDay * deltaDays) {
              card.status = 'broken';
              brokenCount += 1;
            }
          }
        }

        if (brokenCount > 0) {
          // 同步资源数值：在线数量 = 总数 - broken
          const online = pool.filter((c) => c.status !== 'broken').length;
          draft.resources[def.id] = online;
          // 同步算力（BF16 基准）
          const lostTFlops = brokenCount * getCardTflops(spec, 'bf16');
          draft.resources['compute_power'] = (draft.resources['compute_power'] ?? 0) - lostTFlops;
          totalBroken += brokenCount;
          tflopsLost += lostTFlops;
          brokenReport.push({ modelId: def.id, count: brokenCount });
        }
      }
    });

    if (totalBroken > 0) {
      events.emit('CARD_BREAKDOWN', brokenReport);
      events.emit('COMPUTE_POWER_CHANGED', -tflopsLost);
    }
  }

  /** 获取某型号当前可用的（在线未分配）卡实例列表 */
  getAvailableCards(state: GameState, modelId: string): CardInstance[] {
    const pool = state.getResourceMeta<CardInstance[]>(modelId) ?? [];
    return pool.filter((c) => c.status === 'online' && c.assignedProjectId === null);
  }
}
