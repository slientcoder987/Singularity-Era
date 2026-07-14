/**
 * 部门管理命令
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { DepartmentType } from '../entities/Department';
import { DEPT_HEAD_MIN_LEVEL } from '../entities/Department';
import { ROLE_TO_STAFF_RESOURCE } from '../config/employees';
import { StaffRole } from '../entities/Employee';

/**
 * 任命部门负责人
 *
 * 要求：
 * - 员工角色与部门对应角色一致
 * - 员工等级 ≥ L7
 * - 员工不属于其他部门或属于本部门
 */
export class AppointDepartmentHeadCommand implements Command {
  constructor(public readonly departmentId: string, public readonly employeeId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const dept = current.departments.find((d) => d.id === this.departmentId);
    if (!dept) {
      events.emit('APPOINT_HEAD_REJECTED', { reason: '部门不存在' });
      return;
    }

    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('APPOINT_HEAD_REJECTED', { reason: '员工不存在' });
      return;
    }

    if (emp.role !== dept.role) {
      events.emit('APPOINT_HEAD_REJECTED', {
        reason: `员工角色不匹配，需 ${dept.role}`,
      });
      return;
    }

    if (emp.level < DEPT_HEAD_MIN_LEVEL) {
      events.emit('APPOINT_HEAD_REJECTED', {
        reason: `等级不足，需 L${DEPT_HEAD_MIN_LEVEL}+`,
      });
      return;
    }

    const oldHeadId = dept.headId;

    state.update((draft) => {
      const d = draft.departments.find((x) => x.id === this.departmentId);
      if (!d) return;

      // 若该员工已是其他部门负责人，移除
      for (const other of draft.departments) {
        if (other.id !== d.id && other.headId === this.employeeId) {
          other.headId = null;
        }
      }

      d.headId = this.employeeId;
      // 自动加入成员列表
      if (!d.memberIds.includes(this.employeeId)) {
        d.memberIds.push(this.employeeId);
      }

      // 更新员工 departmentId
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.departmentId = d.id;
      }
    });

    events.emit('DEPT_HEAD_APPOINTED', {
      departmentId: this.departmentId,
      employeeId: this.employeeId,
      oldHeadId,
    });
  }
}

/**
 * 调动员工到部门
 */
export class TransferDepartmentCommand implements Command {
  constructor(
    public readonly employeeId: string,
    public readonly targetDepartmentId: string | null,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('TRANSFER_REJECTED', { reason: '员工不存在' });
      return;
    }

    // 检查目标部门
    if (this.targetDepartmentId) {
      const targetDept = current.departments.find((d) => d.id === this.targetDepartmentId);
      if (!targetDept) {
        events.emit('TRANSFER_REJECTED', { reason: '目标部门不存在' });
        return;
      }
      if (targetDept.role !== emp.role) {
        events.emit('TRANSFER_REJECTED', {
          reason: `角色不匹配，需 ${targetDept.role}`,
        });
        return;
      }
    }

    // 若员工是当前部门负责人，不允许直接调动（需先免职）
    const oldDeptId = emp.departmentId;
    if (oldDeptId) {
      const oldDept = current.departments.find((d) => d.id === oldDeptId);
      if (oldDept && oldDept.headId === this.employeeId) {
        events.emit('TRANSFER_REJECTED', {
          reason: '员工是当前部门负责人，需先免职',
        });
        return;
      }
    }

    state.update((draft) => {
      // 从原部门移除
      if (oldDeptId) {
        const oldDept = draft.departments.find((d) => d.id === oldDeptId);
        if (oldDept) {
          oldDept.memberIds = oldDept.memberIds.filter((id) => id !== this.employeeId);
        }
      }

      // 加入新部门
      if (this.targetDepartmentId) {
        const newDept = draft.departments.find((d) => d.id === this.targetDepartmentId);
        if (newDept && !newDept.memberIds.includes(this.employeeId)) {
          newDept.memberIds.push(this.employeeId);
        }
      }

      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.departmentId = this.targetDepartmentId ?? undefined;
      }
    });

    events.emit('EMPLOYEE_TRANSFERRED', {
      employeeId: this.employeeId,
      oldDeptId,
      newDeptId: this.targetDepartmentId,
    });
  }
}

/**
 * 分配普通员工到部门
 *
 * 普通员工是资源池中的数量，分配给部门后从资源池扣除。
 */
export class AllocateNormalStaffCommand implements Command {
  constructor(
    public readonly departmentType: DepartmentType,
    public readonly count: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    if (this.count === 0) {
      events.emit('ALLOCATE_NORMAL_REJECTED', { reason: '数量不能为 0' });
      return;
    }

    const current = state.read();
    const dept = current.departments.find((d) => d.type === this.departmentType);
    if (!dept) {
      events.emit('ALLOCATE_NORMAL_REJECTED', { reason: '部门不存在' });
      return;
    }

    // 获取角色对应的资源 id
    const role: StaffRole = dept.role;
    const resourceId = ROLE_TO_STAFF_RESOURCE[role];
    const available = current.resources[resourceId] ?? 0;

    if (this.count > 0) {
      // 分配：从资源池扣除
      if (available < this.count) {
        events.emit('ALLOCATE_NORMAL_REJECTED', {
          reason: `普通员工不足：需要 ${this.count}，可用 ${available}`,
        });
        return;
      }
      state.update((draft) => {
        draft.resources[resourceId] -= this.count;
        const d = draft.departments.find((x) => x.type === this.departmentType);
        if (d) d.normalHeadcount += this.count;
      });
    } else {
      // 回收：放回资源池
      const releaseCount = -this.count;
      if (dept.normalHeadcount < releaseCount) {
        events.emit('ALLOCATE_NORMAL_REJECTED', {
          reason: `部门普通员工不足：需要回收 ${releaseCount}，当前 ${dept.normalHeadcount}`,
        });
        return;
      }
      state.update((draft) => {
        draft.resources[resourceId] += releaseCount;
        const d = draft.departments.find((x) => x.type === this.departmentType);
        if (d) d.normalHeadcount -= releaseCount;
      });
    }

    events.emit('NORMAL_STAFF_ALLOCATED', {
      departmentType: this.departmentType,
      delta: this.count,
    });
  }
}
