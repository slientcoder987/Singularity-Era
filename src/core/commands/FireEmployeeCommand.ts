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
      // 从部门成员列表中移除
      if (emp.departmentId) {
        const dept = draft.departments.find((d) => d.id === emp.departmentId);
        if (dept) {
          dept.memberIds = dept.memberIds.filter((id) => id !== this.employeeId);
          // 若是部门负责人，需清空
          if (dept.headId === this.employeeId) {
            dept.headId = null;
          }
        }
      }
      // 取消培训关联
      if (emp.trainingId) {
        const training = draft.staffTrainings.find((t) => t.id === emp.trainingId);
        if (training && training.status === 'in_progress') {
          training.status = 'cancelled';
        }
      }
      // 清理高管槽位（设计：fire 高管时自动卸任）
      const exec = draft.executives;
      if (exec.ceoId === this.employeeId) exec.ceoId = null;
      if (exec.cooId === this.employeeId) exec.cooId = null;
      if (exec.cfoId === this.employeeId) exec.cfoId = null;
      if (exec.ctoId === this.employeeId) exec.ctoId = null;
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
