import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import type { StaffRole } from '../entities/Employee';
import { ROLE_CONFIG, ROLE_TO_STAFF_RESOURCE, calcNormalHireCost } from '../config/employees';
import { DEPARTMENT_ROLE_MAP } from '../entities/Department';

/**
 * HireNormalEmployeeCommand
 *
 * 招聘一名普通员工：
 * 1. 检查资金是否足够支付一次性招聘费（递增：>50 人后每超 1 人 +5%）。
 * 2. 将对应 StaffRole 的普通员工资源数量 +1。
 * 3. 扣除招聘费。
 *
 * 普通员工是资源系统中的数值，无独立属性、技能、级别。
 * 新增角色无需修改本命令（ROLE_TO_STAFF_RESOURCE 自动映射）。
 */
export class HireNormalEmployeeCommand implements Command {
  constructor(public readonly role: StaffRole) {}

  execute(state: GameState, events: EventBus): void {
    const roleCfg = ROLE_CONFIG[this.role];
    if (!roleCfg) {
      events.emit('HIRE_REJECTED', { role: this.role, reason: '未知角色' });
      return;
    }

    const staffResourceId = ROLE_TO_STAFF_RESOURCE[this.role];
    if (!staffResourceId) {
      events.emit('HIRE_REJECTED', { role: this.role, reason: '无对应普通员工资源' });
      return;
    }

    const current = state.read();
    const currentCount = current.resources[staffResourceId] ?? 0;
    const hireCost = calcNormalHireCost(currentCount);

    const funds = state.getResource('funds');
    if (funds < hireCost) {
      events.emit('HIRE_REJECTED', {
        role: this.role,
        reason: '资金不足',
        cost: hireCost,
        funds,
      });
      return;
    }

    // ★ P1-8 修复：合并到单次 state.update，避免两次 addResource 触发两次重渲染
    state.update((draft) => {
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - hireCost);
      draft.resources[staffResourceId] = (draft.resources[staffResourceId] ?? 0) + 1;
      const dept = draft.departments.find(
        (d) => DEPARTMENT_ROLE_MAP[d.type] === this.role,
      );
      if (dept) {
        dept.normalHeadcount += 1;
      }
    });

    const newCount = state.getResource(staffResourceId);
    events.emit('NORMAL_EMPLOYEE_HIRED', {
      role: this.role,
      staffResourceId,
      count: newCount,
      cost: hireCost,
    });
  }
}

/**
 * HireNormalEmployeesBatchCommand
 *
 * 批量招普通员工（★ P1-8：性能优化）
 * 之前循环执行 N 次 HireNormalEmployeeCommand 触发 N 次 immer produce + N 次 UI 重渲染
 * 现在单次 state.update 完成 N 个人的招聘，并按增量费率合计费用。
 *
 * 资金不足时按可招数量招满（不发 REJECTED，避免一次失败 N 个）。
 */
export class HireNormalEmployeesBatchCommand implements Command {
  constructor(
    public readonly role: StaffRole,
    public readonly count: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const roleCfg = ROLE_CONFIG[this.role];
    if (!roleCfg) {
      events.emit('HIRE_REJECTED', { role: this.role, reason: '未知角色' });
      return;
    }
    const staffResourceId = ROLE_TO_STAFF_RESOURCE[this.role];
    if (!staffResourceId) {
      events.emit('HIRE_REJECTED', { role: this.role, reason: '无对应普通员工资源' });
      return;
    }
    if (this.count <= 0) return;

    const current = state.read();
    const startCount = current.resources[staffResourceId] ?? 0;
    const funds = current.resources['funds'] ?? 0;

    // 计算按递增费率的总费用，并按当前资金裁剪
    let totalCost = 0;
    let actualHire = 0;
    for (let i = 0; i < this.count; i++) {
      const cost = calcNormalHireCost(startCount + i);
      if (funds - totalCost < cost) break;
      totalCost += cost;
      actualHire += 1;
    }
    if (actualHire === 0) {
      events.emit('HIRE_REJECTED', {
        role: this.role,
        reason: '资金不足',
        cost: calcNormalHireCost(startCount),
        funds,
      });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - totalCost);
      draft.resources[staffResourceId] = (draft.resources[staffResourceId] ?? 0) + actualHire;
      const dept = draft.departments.find(
        (d) => DEPARTMENT_ROLE_MAP[d.type] === this.role,
      );
      if (dept) {
        dept.normalHeadcount += actualHire;
      }
    });

    events.emit('NORMAL_EMPLOYEE_HIRED', {
      role: this.role,
      staffResourceId,
      count: state.getResource(staffResourceId),
      cost: totalCost,
      batched: true,
      requested: this.count,
      hired: actualHire,
    });
  }
}