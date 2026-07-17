import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP } from '../config/techTree';
import { IDEA_TECH_POOL } from '../config/ideaTechPool';

/** 接受员工 idea */
export class AcceptIdeaCommand implements Command {
  constructor(private readonly ideaId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const idea = current.pendingIdeas.find((i) => i.id === this.ideaId);
    if (!idea) {
      events.emit('IDEA_REJECTED', { reason: 'idea 不存在' });
      return;
    }
    if (idea.status !== 'pending') {
      events.emit('IDEA_REJECTED', { reason: 'idea 已处理' });
      return;
    }

    state.update((draft) => {
      const target = draft.pendingIdeas.find((i) => i.id === this.ideaId);
      if (!target) return;
      target.status = 'accepted';

      if (idea.kind === 'accelerate') {
        if (idea.targetTechId === draft.researchingTech?.techId) {
          // 研发中技术：进度 +20% totalDays
          draft.researchingTech.progressDays += draft.researchingTech.totalDays * idea.value;
        } else {
          // 已解锁技术：maturity += value
          const existing = draft.techMaturity[idea.targetTechId] ?? 0;
          draft.techMaturity[idea.targetTechId] = Math.min(100, existing + idea.value);
        }
      } else {
        // unique：注册独有技术到 IDEA_TECH_MAP + 持久化
        const poolNode = IDEA_TECH_POOL.find((t) => t.id === idea.targetTechId);
        if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
          IDEA_TECH_MAP[poolNode.id] = poolNode;
          draft.acceptedIdeaTechs.push(poolNode);
        }
        // 应用初始 maturity（取较大值，避免重复接受降级）
        const existing = draft.techMaturity[idea.targetTechId] ?? 0;
        draft.techMaturity[idea.targetTechId] = Math.max(existing, idea.value);
      }
    });

    events.emit('IDEA_ACCEPTED', idea);
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