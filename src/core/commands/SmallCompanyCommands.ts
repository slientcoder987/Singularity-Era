import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP } from '../config/techTree';
import { SMALL_COMPANY_TECH_POOL } from '../config/smallCompanyTech';

/**
 * 收购小公司，获得其所有技术
 *
 * 校验：公司存在 / 未收购 / 未过期 / 资金充足。
 * 效果：扣估值、标记 acquired、独有技术注册到 IDEA_TECH_MAP、所有技术 maturity=max(现有,60)。
 */
export class AcquireSmallCompanyCommand implements Command {
  constructor(private readonly companyId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const company = current.smallCompanies.find((c) => c.id === this.companyId);
    if (!company) {
      events.emit('ACQUIRE_REJECTED', { reason: '公司不存在' });
      return;
    }
    if (company.acquired) {
      events.emit('ACQUIRE_REJECTED', { reason: '已被收购' });
      return;
    }
    if (current.date - company.spawnedDay > company.lifespan) {
      events.emit('ACQUIRE_REJECTED', { reason: '已过期' });
      return;
    }
    const funds = current.resources['funds'] ?? 0;
    if (funds < company.valuation) {
      events.emit('ACQUIRE_REJECTED', { reason: '资金不足' });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - company.valuation;
      const target = draft.smallCompanies.find((c) => c.id === this.companyId);
      if (target) target.acquired = true;

      // 转移所有技术
      for (const techId of company.technologies) {
        // 注册独有技术（如果是池中的）
        const poolNode = SMALL_COMPANY_TECH_POOL.find((t) => t.id === techId);
        if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
          IDEA_TECH_MAP[poolNode.id] = poolNode;
          draft.acceptedIdeaTechs.push(poolNode);
        }
        // 应用初始 maturity=60（取较大值，避免降级）
        const existing = draft.techMaturity[techId] ?? 0;
        draft.techMaturity[techId] = Math.max(existing, 60);
      }
    });

    events.emit('SMALL_COMPANY_ACQUIRED', company);
  }
}
