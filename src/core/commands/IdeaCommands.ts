import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Employee } from '../entities/Employee';
import { canAcceptUniqueTechs, getMaxUniqueTechSlots, getUniqueTechCount } from '../utils/uniqueTechSlots';

/**
 * 计算 idea 验证的成功概率
 *
 * 公式：P = clamp(0.30 + (intelligence - 50) × 0.004 + (creativity - 50) × 0.005 + level × 0.02, 0.30, 0.85)
 *
 * 基准 30%，高属性研究员可提升至 85%。
 * 示例：L5 int=75 cre=70 → P = 0.30 + 0.10 + 0.10 + 0.10 = 0.60
 */
function calcSuccessProbability(emp: Employee): number {
  const raw = 0.30
    + (emp.attributes.intelligence - 50) * 0.004
    + (emp.attributes.creativity - 50) * 0.005
    + emp.level * 0.02;
  return Math.max(0.30, Math.min(0.85, raw));
}

/** 启动 idea 验证（替代原即时接受） */
export class AcceptIdeaCommand implements Command {
  constructor(private readonly ideaId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const idea = current.pendingIdeas.find((i) => i.id === this.ideaId);
    if (!idea || idea.status !== 'pending') {
      events.emit('IDEA_REJECTED', { reason: idea ? 'idea 已处理' : 'idea 不存在' });
      return;
    }

    const emp = current.employees.find((e) => e.id === idea.sourceEmployeeId);
    if (!emp) {
      events.emit('IDEA_REJECTED', { reason: '提出者已离职' });
      return;
    }

    // PR-E：独有技术槽位检查（仅 unique idea 占用槽位，accelerate 不占用）
    if (idea.kind === 'unique' && !canAcceptUniqueTechs(current, 1)) {
      const used = getUniqueTechCount(current);
      const max = getMaxUniqueTechSlots(current);
      events.emit('IDEA_REJECTED', {
        reason: `独有技术槽位已满 (${used}/${max})，需先提升公司规模或研究员数量`,
      });
      return;
    }

    // 计算成功概率（基于提出者属性）
    const successProb = calcSuccessProbability(emp);

    // 计算验证天数：unique 更复杂需更长时间
    // accelerate: 3 + (1-P) × 7 → 3.45~7.9 天
    // unique:     5 + (1-P) × 12 → 5.6~13.4 天
    const baseDays = idea.kind === 'unique' ? 5 : 3;
    const uncertaintyDays = idea.kind === 'unique' ? 12 : 7;
    const totalDays = Math.round(baseDays + (1 - successProb) * uncertaintyDays);

    // 每日验证成本：$2000（accelerate）/ $3500（unique）
    const dailyCost = idea.kind === 'unique' ? 3500 : 2000;

    // 首日成本
    const funds = current.resources['funds'] ?? 0;
    if (funds < dailyCost) {
      events.emit('IDEA_REJECTED', { reason: `资金不足（需要 $${dailyCost}/天）` });
      return;
    }

    state.update((draft) => {
      const target = draft.pendingIdeas.find((i) => i.id === this.ideaId);
      if (!target) return;

      target.status = 'verifying';
      target.verificationDays = 1;
      target.verificationTotalDays = totalDays;
      target.verificationDailyCost = dailyCost;
      target.successProbability = successProb;

      // 扣除首日成本
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - dailyCost;
    });

    events.emit('IDEA_VERIFICATION_STARTED', {
      ideaId: idea.id,
      title: idea.title,
      totalDays,
      dailyCost,
      successProbability: successProb,
    });
  }
}

/** 拒绝员工 idea（产生者忠诚度 +2，被倾听） */
export class RejectIdeaCommand implements Command {
  constructor(private readonly ideaId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const idea = current.pendingIdeas.find((i) => i.id === this.ideaId);
    if (!idea || idea.status !== 'pending') {
      events.emit('IDEA_REJECTED', { reason: 'idea 不存在或已处理' });
      return;
    }

    state.update((draft) => {
      const target = draft.pendingIdeas.find((i) => i.id === this.ideaId);
      if (target) target.status = 'rejected';
      // 产生者忠诚度 +2
      const emp = draft.employees.find((e) => e.id === idea.sourceEmployeeId);
      if (emp) emp.loyalty = Math.min(100, emp.loyalty + 2);
    });

    events.emit('IDEA_REJECTED_OK', idea);
  }
}