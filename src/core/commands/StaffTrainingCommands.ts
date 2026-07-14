/**
 * 员工培训命令
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { StaffTrainingProject, StaffTrainingType } from '../entities/StaffTrainingProject';
import { STAFF_TRAINING_CONFIG } from '../entities/StaffTrainingProject';
import type { StaffAttributes } from '../entities/Employee';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 启动员工培训
 */
export class StartStaffTrainingCommand implements Command {
  constructor(
    public readonly employeeId: string,
    public readonly trainingType: StaffTrainingType,
    /** 目标提升属性（overseas 类型可为 null） */
    public readonly targetAttribute: keyof StaffAttributes | null,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const cfg = STAFF_TRAINING_CONFIG[this.trainingType];
    if (!cfg) {
      events.emit('STAFF_TRAINING_REJECTED', { reason: '未知培训类型' });
      return;
    }

    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('STAFF_TRAINING_REJECTED', { reason: '员工不存在' });
      return;
    }

    if (emp.status === 'assigned') {
      events.emit('STAFF_TRAINING_REJECTED', { reason: '员工已被分配到项目，无法参加培训' });
      return;
    }
    if (emp.status === 'training') {
      events.emit('STAFF_TRAINING_REJECTED', { reason: '员工正在培训中' });
      return;
    }

    if (emp.level < cfg.minLevel) {
      events.emit('STAFF_TRAINING_REJECTED', {
        reason: `等级不足，需 ${cfg.minLevel} 级`,
      });
      return;
    }

    const funds = current.resources['funds'] ?? 0;
    if (funds < cfg.cost) {
      events.emit('STAFF_TRAINING_REJECTED', {
        reason: '资金不足',
        cost: cfg.cost,
        funds,
      });
      return;
    }

    // 非 overseas 类型必须指定目标属性
    if (!cfg.allAttributes && !this.targetAttribute) {
      events.emit('STAFF_TRAINING_REJECTED', { reason: '需指定目标属性' });
      return;
    }

    const trainingId = genId('training');
    const training: StaffTrainingProject = {
      id: trainingId,
      type: this.trainingType,
      employeeId: this.employeeId,
      startedAt: current.date,
      totalDays: cfg.durationDays,
      elapsedDays: 0,
      status: 'in_progress',
      targetAttribute: cfg.allAttributes ? null : this.targetAttribute,
    };

    state.update((draft) => {
      draft.resources['funds'] -= cfg.cost;
      draft.staffTrainings.push(training);
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.status = 'training';
        target.trainingId = trainingId;
      }
    });

    events.emit('STAFF_TRAINING_STARTED', {
      employeeId: this.employeeId,
      trainingId,
      type: this.trainingType,
      cost: cfg.cost,
      durationDays: cfg.durationDays,
    });
  }
}

/**
 * 取消员工培训（不退还费用）
 */
export class CancelStaffTrainingCommand implements Command {
  constructor(public readonly trainingId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const training = current.staffTrainings.find((t) => t.id === this.trainingId);
    if (!training) {
      events.emit('STAFF_TRAINING_CANCEL_REJECTED', { reason: '培训项目不存在' });
      return;
    }
    if (training.status !== 'in_progress') {
      events.emit('STAFF_TRAINING_CANCEL_REJECTED', { reason: '培训已结束' });
      return;
    }

    state.update((draft) => {
      const t = draft.staffTrainings.find((x) => x.id === this.trainingId);
      if (t) t.status = 'cancelled';
      const emp = draft.employees.find((e) => e.id === training.employeeId);
      if (emp) {
        emp.status = 'idle';
        emp.trainingId = undefined;
      }
    });

    events.emit('STAFF_TRAINING_CANCELLED', this.trainingId);
  }
}
