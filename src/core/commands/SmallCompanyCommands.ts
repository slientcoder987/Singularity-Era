import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP } from '../config/techTree';
import { SMALL_COMPANY_TECH_POOL } from '../config/smallCompanyTech';
import { canAcceptUniqueTechs, getMaxUniqueTechSlots, getUniqueTechCount } from '../utils/uniqueTechSlots';

/**
 * 收购小公司，获得其所有技术
 *
 * 校验：公司存在 / 未收购 / 未过期 / 资金充足 / 独有技术槽位（PR-E）。
 * 效果：扣估值、标记 acquired、独有技术注册到 IDEA_TECH_MAP、
 *       每项技术 maturity = max(现有, company.techMaturities[techId])（PR-D：随机 20~80）。
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

    // PR-E：统计此次收购会新增的独有技术数（池中且未注册的）
    const newUniqueCount = company.technologies.filter((tid) => {
      const poolNode = SMALL_COMPANY_TECH_POOL.find((t) => t.id === tid);
      return poolNode && !IDEA_TECH_MAP[poolNode.id];
    }).length;
    if (newUniqueCount > 0 && !canAcceptUniqueTechs(current, newUniqueCount)) {
      const used = getUniqueTechCount(current);
      const max = getMaxUniqueTechSlots(current);
      events.emit('ACQUIRE_REJECTED', {
        reason: `独有技术槽位不足：需 ${newUniqueCount} 个，剩余 ${max - used} 个 (${used}/${max})`,
      });
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
        // PR-D：应用公司该项技术的初始成熟度（生成时已 roll，20~80）
        // 取较大值避免降级已有技术；旧存档无 techMaturities 时防御性默认 40
        const acquiredMat = company.techMaturities?.[techId] ?? 40;
        const existing = draft.techMaturity[techId] ?? 0;
        draft.techMaturity[techId] = Math.max(existing, acquiredMat);
      }
    });

    events.emit('SMALL_COMPANY_ACQUIRED', company);
  }
}
