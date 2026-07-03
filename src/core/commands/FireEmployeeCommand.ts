import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';

/**
 * FireEmployeeCommand
 *
 * 解雇员工：
 * 1. 从 state.employees 中移除。
 * 2. 若员工被分配到项目，清理分配（设置 status='idle', assignedProjectId=undefined）。
 * 3. 若该员工忠诚度较高，发射 MORALE_IMPACT 事件影响其他员工士气。
 */
export class FireEmployeeCommand implements Command {
  constructor(public readonly employeeId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);

    if (!emp) {
      events.emit('FIRE_FAILED', { employeeId: this.employeeId, reason: '员工不存在' });
      return;
    }

    const wasAssigned = emp.status === 'assigned';
    const projectId = emp.assignedProjectId;
    const wasLoyal = emp.loyalty > 60;

    state.update((draft) => {
      draft.employees = draft.employees.filter((e) => e.id !== this.employeeId);
    });

    events.emit('EMPLOYEE_FIRED', emp);

    // 若是高忠诚员工被解雇，影响其他员工士气
    if (wasLoyal) {
      state.update((draft) => {
        for (const e of draft.employees) {
          e.loyalty = Math.max(0, e.loyalty - 5);
        }
      });
      events.emit('MORALE_IMPACT', { reason: 'high_loyalty_fired', target: this.employeeId });
    }

    // 释放项目占用
    if (wasAssigned && projectId) {
      events.emit('PROJECT_RESOURCE_RELEASED', {
        projectId,
        employeeId: this.employeeId,
        type: 'employee',
      });
    }
  }
}
