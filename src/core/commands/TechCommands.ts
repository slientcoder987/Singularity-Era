/**
 * 技术研发命令
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { TECH_MAP, type TechId } from '../config/techTree';

/**
 * 开始研发技术
 *
 * 检查前置技术、资金，设置 researchingTech 状态。
 */
export class StartResearchCommand implements Command {
  constructor(private readonly techId: TechId) {}

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

    // 检查是否已解锁
    if (current.unlockedTechs.includes(this.techId)) {
      events.emit('RESEARCH_REJECTED', { reason: '技术已解锁' });
      return;
    }

    // 检查前置技术
    for (const prereq of tech.prerequisites) {
      if (!current.unlockedTechs.includes(prereq)) {
        events.emit('RESEARCH_REJECTED', { reason: `前置技术未解锁: ${TECH_MAP[prereq]?.name ?? prereq}` });
        return;
      }
    }

    // 检查是否已有研发中技术
    if (current.researchingTech) {
      events.emit('RESEARCH_REJECTED', { reason: '已有技术正在研发中' });
      return;
    }

    // 检查资金
    const funds = current.resources['funds'] ?? 0;
    if (funds < tech.researchCost) {
      events.emit('RESEARCH_REJECTED', { reason: '资金不足', cost: tech.researchCost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= tech.researchCost;
      draft.researchingTech = {
        techId: this.techId,
        progressDays: 0,
        totalDays: tech.researchDays,
      };
    });

    events.emit('RESEARCH_STARTED', this.techId, tech.name);
  }
}

/**
 * 取消研发
 */
export class CancelResearchCommand implements Command {
  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    if (!current.researchingTech) {
      events.emit('RESEARCH_CANCEL_REJECTED', { reason: '无研发中技术' });
      return;
    }

    state.update((draft) => {
      draft.researchingTech = null;
    });

    events.emit('RESEARCH_CANCELLED');
  }
}
