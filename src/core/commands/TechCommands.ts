/**
 * 技术研发命令
 *
 * 数据结构变更（研发系统扩展）：
 * - unlockedTechs.includes → isTechUnlocked（基于 techMaturity）
 * - StartResearchCommand 接受可选 researcherIds 参数（PR2 起使用，PR1 默认空数组）
 * - researchingTech 包含 researcherIds / dailyCost 字段
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Employee } from '../entities/Employee';
import { StaffRole } from '../entities/Employee';
import { TECH_MAP } from '../config/techTree';
import { isTechUnlocked } from '../utils/techLookup';
import { calcEmployeeEfficiency } from '../utils/employeeUtils';

/**
 * 开始研发技术
 *
 * 检查前置技术、资金，设置 researchingTech 状态。
 *
 * @param techId         目标技术 id
 * @param researcherIds  参与研发的研究员 id 列表（PR2 起使用，PR1 留空）
 */
export class StartResearchCommand implements Command {
  constructor(
    private readonly techId: string,
    private readonly researcherIds: string[] = [],
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const tech = TECH_MAP[this.techId];
    if (!tech) {
      events.emit('RESEARCH_REJECTED', { reason: '未知技术', techId: this.techId });
      return;
    }

    // 初始技术无需研发
    if (tech.researchDays === 0) {
      events.emit('RESEARCH_REJECTED', { reason: '该技术已解锁或无需研发' });
      return;
    }

    // 检查是否已解锁（基于 techMaturity）
    if (isTechUnlocked(current, this.techId)) {
      events.emit('RESEARCH_REJECTED', { reason: '技术已解锁' });
      return;
    }

    // 检查前置技术
    for (const prereq of tech.prerequisites) {
      if (!isTechUnlocked(current, prereq)) {
        events.emit('RESEARCH_REJECTED', { reason: `前置技术未解锁: ${TECH_MAP[prereq]?.name ?? prereq}` });
        return;
      }
    }

    // 检查是否已有研发中技术
    if (current.researchingTech) {
      events.emit('RESEARCH_REJECTED', { reason: '已有技术正在研发中' });
      return;
    }

    // 校验研究员有效性（PR2）：必须 idle + RESEARCHER 角色
    const empMap = new Map(current.employees.map((e) => [e.id, e]));
    const validResearchers: Employee[] = [];
    for (const rid of this.researcherIds) {
      const emp = empMap.get(rid);
      if (!emp) {
        events.emit('RESEARCH_REJECTED', { reason: `研究员不存在: ${rid}` });
        return;
      }
      if (emp.role !== StaffRole.RESEARCHER) {
        events.emit('RESEARCH_REJECTED', { reason: `${emp.name} 不是研究员` });
        return;
      }
      if (emp.status !== 'idle') {
        events.emit('RESEARCH_REJECTED', { reason: `${emp.name} 当前不可用（${emp.status}）` });
        return;
      }
      validResearchers.push(emp);
    }
    // 轻量技术（researchDays < 5）不强制要求研究员；中重型至少 1 名
    if (tech.researchDays >= 5 && validResearchers.length === 0) {
      events.emit('RESEARCH_REJECTED', { reason: '该技术至少需要 1 名研究员' });
      return;
    }

    // 检查资金
    const funds = current.resources['funds'] ?? 0;
    if (funds < tech.researchCost) {
      events.emit('RESEARCH_REJECTED', { reason: '资金不足', cost: tech.researchCost });
      return;
    }

    // 每日维持成本：researchCost / researchDays × 0.1
    // 总维持费约为一次性成本的 10%，避免资金充裕时无限研发
    const dailyCost = Math.round((tech.researchCost / Math.max(1, tech.researchDays)) * 0.1);

    state.update((draft) => {
      draft.resources['funds'] -= tech.researchCost;

      // 锁定研究员（PR2）：status='assigned'，assignedProjectId 标记为 tech-research-${techId}
      const lockProjectId = `tech-research-${this.techId}`;
      for (const emp of validResearchers) {
        const target = draft.employees.find((e) => e.id === emp.id);
        if (target) {
          target.status = 'assigned';
          target.assignedProjectId = lockProjectId;
        }
      }

      draft.researchingTech = {
        techId: this.techId,
        progressDays: 0,
        totalDays: tech.researchDays,
        researcherIds: [...this.researcherIds],
        dailyCost,
      };
    });

    events.emit('RESEARCH_STARTED', this.techId, tech.name);
  }
}

/**
 * 取消研发
 *
 * PR2：释放锁定研究员的 assigned 状态（status='idle', assignedProjectId=undefined）。
 */
export class CancelResearchCommand implements Command {
  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    if (!current.researchingTech) {
      events.emit('RESEARCH_CANCEL_REJECTED', { reason: '无研发中技术' });
      return;
    }

    const techId = current.researchingTech.techId;
    const researcherIds = current.researchingTech.researcherIds ?? [];
    const lockProjectId = `tech-research-${techId}`;

    state.update((draft) => {
      // 释放锁定研究员
      for (const rid of researcherIds) {
        const emp = draft.employees.find((e) => e.id === rid);
        if (emp && emp.assignedProjectId === lockProjectId) {
          emp.status = 'idle';
          emp.assignedProjectId = undefined;
        }
      }
      draft.researchingTech = null;
    });

    events.emit('RESEARCH_CANCELLED');
  }
}

/**
 * 主动打磨技术（提升成熟度）
 *
 * 一次性即时命令：立即扣除资金、应用成熟度增益、增加研究员疲劳。
 * 不锁定研究员状态（短期投入，不阻塞其他任务），但命令时研究员必须 idle。
 *
 * 公式：
 * - dailyGain = 0.30 × (1 + sumIntelligence/200)
 * - 总增益 = dailyGain × days
 * - 成本 = $5000 × researcherCount × days
 * - 疲劳 = days × 3（每位参与研究员）
 *
 * 7 天预期增长：
 * - 1×L5（int 75, eff 1.18）: sumInt=88.5, dailyGain=0.43, 7天=3.04
 * - 3×L7（int 85, eff 1.52）: sumInt=387.6, dailyGain=0.88, 7天=6.17
 */
export class PolishTechCommand implements Command {
  constructor(
    private readonly techId: string,
    private readonly researcherIds: string[],
    private readonly days: number = 7,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const maturity = current.techMaturity[this.techId] ?? 0;

    // 校验 1：技术已解锁且未满级
    if (maturity < 1) {
      events.emit('POLISH_REJECTED', { reason: '技术未解锁，无法打磨' });
      return;
    }
    if (maturity >= 100) {
      events.emit('POLISH_REJECTED', { reason: '技术已满级' });
      return;
    }

    // 校验 2：days 范围
    if (this.days < 1 || this.days > 14) {
      events.emit('POLISH_REJECTED', { reason: '打磨天数必须在 1~14 之间' });
      return;
    }

    // 校验 3：研究员有效性（必须 idle + RESEARCHER）
    const researchers: Employee[] = [];
    for (const rid of this.researcherIds) {
      const emp = current.employees.find((e) => e.id === rid);
      if (!emp || emp.role !== StaffRole.RESEARCHER) {
        events.emit('POLISH_REJECTED', { reason: '无效研究员' });
        return;
      }
      if (emp.status !== 'idle') {
        events.emit('POLISH_REJECTED', { reason: `${emp.name} 不可用` });
        return;
      }
      researchers.push(emp);
    }
    if (researchers.length === 0) {
      events.emit('POLISH_REJECTED', { reason: '至少需要 1 名研究员' });
      return;
    }

    // 计算总增益
    let sumIntelligence = 0;
    for (const r of researchers) {
      const eff = calcEmployeeEfficiency(r, current.departments, current.employees);
      sumIntelligence += eff * r.attributes.intelligence;
    }
    const dailyGain = 0.30 * (1 + sumIntelligence / 200);
    const totalGain = dailyGain * this.days;
    const cost = 5000 * researchers.length * this.days;

    // 校验 4：资金
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('POLISH_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      // 扣费
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - cost;
      // 应用成熟度（封顶 100）
      const existing = draft.techMaturity[this.techId] ?? 0;
      draft.techMaturity[this.techId] = Math.min(100, existing + totalGain);
      // 增加研究员疲劳
      const fatigueGain = this.days * 3;
      for (const r of researchers) {
        const target = draft.employees.find((e) => e.id === r.id);
        if (target) {
          target.fatigue = Math.min(100, target.fatigue + fatigueGain);
        }
      }
    });

    events.emit('TECH_POLISHED', {
      techId: this.techId,
      gain: totalGain,
      cost,
      researcherCount: researchers.length,
    });
  }
}
