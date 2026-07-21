/**
 * 技术相关命令
 *
 * PR-C 变更：
 * - 删除 StartResearchCommand / CancelResearchCommand（技术树花钱时间研发机制已废弃）
 * - 所有技术解锁与提升统一通过实验系统 + idea 验证流程完成
 * - 保留 PolishTechCommand（打磨已解锁技术，提升成熟度）
 * - researchingTech 字段在 GameState 中保留但不再写入（仅兼容旧存档）
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Employee } from '../entities/Employee';
import { StaffRole } from '../entities/Employee';
import { calcEmployeeEfficiency } from '../utils/employeeUtils';

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