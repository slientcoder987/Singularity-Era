/**
 * 科技研发命令
 */

import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { createResearchProject } from '../entities/ResearchProject';
import { canResearch } from '../config/techTree';

/** 开始研发 */
export class StartResearchCommand implements Command {
  constructor(
    private techId: string,
    private assignedEmployeeIds: string[],
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 检查是否可研究
    if (!canResearch(this.techId, current.completedTechs)) {
      events.emit('RESEARCH_REJECTED', { reason: '前置科技未满足或已研究' });
      return;
    }

    // 检查是否已有该项目
    const existing = current.researchProjects.find(
      (r) => r.techId === this.techId && r.status === 'researching',
    );
    if (existing) {
      events.emit('RESEARCH_REJECTED', { reason: '该科技正在研发中' });
      return;
    }

    const project = createResearchProject(this.techId, this.assignedEmployeeIds, current.date);

    state.update((draft) => {
      draft.researchProjects.push(project);
    });

    events.emit('RESEARCH_STARTED', project.id, this.techId);
  }
}

/** 暂停研发 */
export class PauseResearchCommand implements Command {
  constructor(private projectId: string) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      const r = draft.researchProjects.find((p) => p.id === this.projectId);
      if (r && r.status === 'researching') {
        r.status = 'paused';
      }
    });
    events.emit('RESEARCH_PAUSED', this.projectId);
  }
}

/** 恢复研发 */
export class ResumeResearchCommand implements Command {
  constructor(private projectId: string) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      const r = draft.researchProjects.find((p) => p.id === this.projectId);
      if (r && r.status === 'paused') {
        r.status = 'researching';
      }
    });
    events.emit('RESEARCH_RESUMED', this.projectId);
  }
}

/** 购买科技点（1 科技点 = $10,000） */
export class PurchaseTechPointsCommand implements Command {
  private static readonly COST_PER_POINT = 10_000;

  constructor(private quantity: number) {}

  execute(state: GameState, events: EventBus): void {
    const cost = this.quantity * PurchaseTechPointsCommand.COST_PER_POINT;
    const current = state.read();
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('TECH_POINTS_REJECTED', { reason: '资金不足' });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      draft.resources['tech_points'] = (draft.resources['tech_points'] ?? 0) + this.quantity;
    });

    events.emit('TECH_POINTS_PURCHASED', this.quantity);
  }
}

/** 资助研发项目（直接投入科技点加速） */
export class FundResearchCommand implements Command {
  constructor(
    private projectId: string,
    private points: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const available = current.resources['tech_points'] ?? 0;
    if (available < this.points) {
      events.emit('RESEARCH_REJECTED', { reason: '科技点不足' });
      return;
    }

    const project = current.researchProjects.find((p) => p.id === this.projectId);
    if (!project || project.status !== 'researching') {
      events.emit('RESEARCH_REJECTED', { reason: '项目不存在或未在进行中' });
      return;
    }

    state.update((draft) => {
      draft.resources['tech_points'] -= this.points;
      const r = draft.researchProjects.find((p) => p.id === this.projectId);
      if (r) r.investedPoints += this.points;
    });

    events.emit('RESEARCH_FUNDED', this.projectId, this.points);
  }
}
