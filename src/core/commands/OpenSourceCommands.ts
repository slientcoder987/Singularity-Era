import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP } from '../config/techTree';
import { OPEN_SOURCE_TECH_POOL } from '../config/openSourcePool';

/**
 * 采纳开源技术
 *
 * 校验：offer 存在 / 未采纳 / 未过期 / 资金充足。
 * 效果：扣资金、标记 adoptedDay、注册独有技术到 IDEA_TECH_MAP、应用初始 maturity=30（取较大值避免降级）。
 */
export class AdoptOpenSourceCommand implements Command {
  constructor(private readonly offerId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const offer = current.openSourceOffers.find((o) => o.id === this.offerId);
    if (!offer) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '要约不存在' });
      return;
    }
    if (offer.adoptedDay !== undefined) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '已采纳' });
      return;
    }
    if (current.date > offer.expiresDay) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '已过期' });
      return;
    }
    const funds = current.resources['funds'] ?? 0;
    if (funds < offer.adoptionCost) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '资金不足' });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - offer.adoptionCost;
      const target = draft.openSourceOffers.find((o) => o.id === this.offerId);
      if (target) target.adoptedDay = draft.date;

      // 注册独有技术（如果是池中的）
      const poolNode = OPEN_SOURCE_TECH_POOL.find((t) => t.id === offer.techId);
      if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
        IDEA_TECH_MAP[poolNode.id] = poolNode;
        draft.acceptedIdeaTechs.push(poolNode);
      }
      // 应用初始 maturity（取较大值，避免降级）
      const existing = draft.techMaturity[offer.techId] ?? 0;
      draft.techMaturity[offer.techId] = Math.max(existing, offer.initialMaturity);
    });

    events.emit('OPEN_SOURCE_ADOPTED', offer);
  }
}