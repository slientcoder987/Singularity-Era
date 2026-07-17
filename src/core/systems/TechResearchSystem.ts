/**
 * TechResearchSystem
 *
 * 每日推进技术研发进度，完成时将技术 maturity 置 50（解锁）。
 *
 * PR2 扩展：
 * - 研究员加速：researcherBoost = log2(1 + Σ(eff×intelligence) / 100)
 * - 每日维持成本：dailyCost × deltaDays，资金不足时暂停研发（不清空）
 * - 完整公式：researchSpeedMult = (1 + researcherBoost + ctoBonus + skillBonus + autoResearchBonus) × mgmtEff
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { Employee } from '../entities/Employee';
import { TECH_MAP } from '../config/techTree';
import {
  getCompanyResearchSpeed,
  getCompanyResearchSpeedBonus,
  getManagementEfficiency,
  getActiveTechEffects,
} from '../utils/crossSystemUtils';
import { calcEmployeeEfficiency } from '../utils/employeeUtils';

export class TechResearchSystem implements System {
  name = 'TechResearchSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    if (!current.researchingTech) return;

    const research = current.researchingTech;
    const tech = TECH_MAP[research.techId];
    if (!tech) return;

    // ===== 1. 资金维持检查 =====
    const totalMaintCost = research.dailyCost * deltaDays;
    const funds = current.resources['funds'] ?? 0;
    if (totalMaintCost > 0 && funds < totalMaintCost) {
      // 资金不足，暂停研发（不清空进度，保留研究员锁定）
      events.emit('RESEARCH_PAUSED', {
        techId: research.techId,
        name: tech.name,
        reason: '资金不足',
        deficit: totalMaintCost - funds,
      });
      return;
    }

    // ===== 2. 研究员加速计算 =====
    const researcherIds = research.researcherIds ?? [];
    const empMap = new Map<string, Employee>();
    for (const e of current.employees) empMap.set(e.id, e);

    let sumIntelligence = 0;
    let activeResearcherCount = 0;
    for (const rid of researcherIds) {
      const r = empMap.get(rid);
      if (!r) continue;
      // 仅计算在职（非 training）的研究员
      if (r.status === 'training') continue;
      const eff = calcEmployeeEfficiency(r, current.departments, current.employees);
      sumIntelligence += eff * r.attributes.intelligence;
      activeResearcherCount++;
    }

    // 对数递减回报：0 智力=0, 100 智力=+100%, 300 智力≈+158%, 600 智力≈+200%
    const researcherBoost = activeResearcherCount > 0
      ? Math.log2(1 + sumIntelligence / 100)
      : 0;

    // ===== 3. 综合研发速度 =====
    const ctoBonus = getCompanyResearchSpeedBonus(current);      // 0~0.05
    const skillBonus = getCompanyResearchSpeed(current);          // research_breakthrough 技能
    const autoResearchBonus = getActiveTechEffects(current)
      .filter((e) => e.type === 'improve_research_speed')
      .reduce((s, e) => s + e.value, 0);                          // auto_research +0.5（按 maturity 缩放）
    const mgmtEff = getManagementEfficiency(current);             // 0.5~1.3

    const researchSpeedMult = (1 + researcherBoost + ctoBonus + skillBonus + autoResearchBonus) * mgmtEff;
    const newProgress = research.progressDays + deltaDays * researchSpeedMult;
    const isCompleted = newProgress >= research.totalDays;

    state.update((draft) => {
      if (!draft.researchingTech) return;

      // 扣除每日维持成本
      if (totalMaintCost > 0) {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalMaintCost;
      }

      if (isCompleted) {
        const techId = draft.researchingTech.techId;
        // 研发完成：maturity 置 50（保留较高值，如小公司收购已获 60）
        const existing = draft.techMaturity[techId] ?? 0;
        draft.techMaturity[techId] = Math.max(existing, 50);

        // 释放锁定研究员
        const lockedIds = draft.researchingTech.researcherIds ?? [];
        for (const rid of lockedIds) {
          const emp = draft.employees.find((e) => e.id === rid);
          if (emp && emp.assignedProjectId === `tech-research-${techId}`) {
            emp.status = 'idle';
            emp.assignedProjectId = undefined;
          }
        }

        draft.researchingTech = null;
      } else {
        draft.researchingTech.progressDays = newProgress;
      }
    });

    if (isCompleted) {
      events.emit('RESEARCH_COMPLETED', research.techId, tech.name);
    } else {
      events.emit('RESEARCH_PROGRESS', {
        techId: research.techId,
        name: tech.name,
        progress: newProgress,
        total: research.totalDays,
        researcherBoost,
        activeResearcherCount,
      });
    }
  }
}
