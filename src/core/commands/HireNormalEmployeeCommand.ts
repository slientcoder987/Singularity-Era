import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import type { StaffRole } from '../entities/Employee';
import { ROLE_CONFIG, NORMAL_HIRE_COST, ROLE_TO_STAFF_RESOURCE } from '../config/employees';

/**
 * HireNormalEmployeeCommand
 *
 * 招聘一名普通员工：
 * 1. 检查资金是否足够支付一次性招聘费（NORMAL_HIRE_COST）。
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

    const funds = state.getResource('funds');
    if (funds < NORMAL_HIRE_COST) {
      events.emit('HIRE_REJECTED', {
        role: this.role,
        reason: '资金不足',
        cost: NORMAL_HIRE_COST,
        funds,
      });
      return;
    }

    // 扣费 + 增加普通员工资源数量
    state.addResource('funds', -NORMAL_HIRE_COST);
    state.addResource(staffResourceId, 1);

    const newCount = state.getResource(staffResourceId);
    events.emit('NORMAL_EMPLOYEE_HIRED', {
      role: this.role,
      staffResourceId,
      count: newCount,
      cost: NORMAL_HIRE_COST,
    });
  }
}