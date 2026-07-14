import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';

/**
 * AssignEmployeeCommand
 *
 * 分配/取消分配员工到项目：
 * - projectId 为字符串：分配到该项目，status='assigned'。
 * - projectId 为 null：取消分配，status='idle'。
 * 发射 EMPLOYEE_ASSIGNED / EMPLOYEE_UNASSIGNED 事件。
 */
export class AssignEmployeeCommand implements Command {
  constructor(
    public readonly employeeId: string,
    public readonly projectId: string | null,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('ASSIGN_FAILED', { employeeId: this.employeeId, reason: '员工不存在' });
      return;
    }

    // 培训中员工不可分配
    if (emp.status === 'training' && this.projectId !== null) {
      events.emit('ASSIGN_FAILED', {
        employeeId: this.employeeId,
        reason: '员工正在培训中，无法分配到项目',
      });
      return;
    }

    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (!target) return;

      if (this.projectId === null) {
        target.status = 'idle';
        target.assignedProjectId = undefined;
      } else {
        target.status = 'assigned';
        target.assignedProjectId = this.projectId;
      }
    });

    if (this.projectId === null) {
      events.emit('EMPLOYEE_UNASSIGNED', this.employeeId);
    } else {
      events.emit('EMPLOYEE_ASSIGNED', this.employeeId, this.projectId);
    }
  }
}
