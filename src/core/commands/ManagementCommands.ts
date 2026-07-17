/**
 * 公司管理系统 Commands
 *
 * 3 个命令：
 * - SwitchManagementModeCommand：切换管理模式（含冷却 + 资金检查）
 * - AppointExecutiveCommand：任命高管（含等级/属性校验）
 * - DismissExecutiveCommand：解任高管（保留员工身份）
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import {
  MODE_SWITCH_COOLDOWN_DAYS,
  calcModeSwitchCost,
  EXECUTIVE_CONFIGS,
  EXECUTIVE_ROLES,
  type ManagementMode,
  type ExecutiveRole,
} from '../config/management';
import { StaffRole } from '../entities/Employee';

// ============================================================
// 1. 切换管理模式
// ============================================================

/**
 * 切换管理模式
 *
 * 校验：
 * 1. 不能与当前模式相同
 * 2. 距上次切换 >= 60 天（MODE_SWITCH_COOLDOWN_DAYS）
 * 3. 资金 >= switchCostBase + switchCostPerManager × 在职 manager 数
 *
 * 成功后扣费、更新模式、记录切换日期，发射 MANAGEMENT_MODE_SWITCHED 事件。
 */
export class SwitchManagementModeCommand implements Command {
  constructor(public readonly targetMode: ManagementMode) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 1. 同模式直接拒绝
    if (current.managementMode === this.targetMode) {
      events.emit('MANAGEMENT_MODE_SWITCH_FAILED', {
        reason: 'same_mode',
        target: this.targetMode,
      });
      return;
    }

    // 2. 冷却检查
    const daysSinceLast = current.date - current.managementModeChangedDay;
    if (daysSinceLast < MODE_SWITCH_COOLDOWN_DAYS) {
      events.emit('MANAGEMENT_MODE_SWITCH_FAILED', {
        reason: 'cooldown',
        remainingDays: MODE_SWITCH_COOLDOWN_DAYS - daysSinceLast,
      });
      return;
    }

    // 3. 在职核心 manager 数（用于成本计算）
    const coreManagers = current.employees.filter(
      (e) => e.role === StaffRole.MANAGER && e.status !== 'training',
    ).length;

    // 4. 成本计算
    const cost = calcModeSwitchCost(this.targetMode, coreManagers);

    // 5. 资金检查
    if ((current.resources['funds'] ?? 0) < cost) {
      events.emit('MANAGEMENT_MODE_SWITCH_FAILED', {
        reason: 'insufficient_funds',
        cost,
      });
      return;
    }

    // 6. 执行切换
    const fromMode = current.managementMode;
    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - cost;
      draft.managementMode = this.targetMode;
      draft.managementModeChangedDay = draft.date;
    });

    events.emit('MANAGEMENT_MODE_SWITCHED', {
      from: fromMode,
      to: this.targetMode,
      cost,
    });
  }
}

// ============================================================
// 2. 任命高管
// ============================================================

/**
 * 任命高管
 *
 * 校验：
 * 1. 员工存在
 * 2. 等级 >= 该高管职位 minLevel
 * 3. leadership >= minLeadership
 * 4. charisma >= minCharisma（CTO 不要求，minCharisma=0）
 * 5. 同一员工不能同时任 2 个高管槽位
 *
 * 成功后替换原占用者（原占用者保留员工身份），发射 EXECUTIVE_APPOINTED 事件。
 */
export class AppointExecutiveCommand implements Command {
  constructor(
    public readonly role: ExecutiveRole,
    public readonly employeeId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);

    if (!emp) {
      events.emit('EXECUTIVE_APPOINT_FAILED', {
        role: this.role,
        reason: 'employee_not_found',
      });
      return;
    }

    const cfg = EXECUTIVE_CONFIGS[this.role];

    // 1. 等级检查
    if (emp.level < cfg.minLevel) {
      events.emit('EXECUTIVE_APPOINT_FAILED', {
        role: this.role,
        reason: 'level_too_low',
        required: cfg.minLevel,
        actual: emp.level,
      });
      return;
    }

    // 2. leadership 检查
    if (emp.attributes.leadership < cfg.minLeadership) {
      events.emit('EXECUTIVE_APPOINT_FAILED', {
        role: this.role,
        reason: 'leadership_too_low',
        required: cfg.minLeadership,
        actual: emp.attributes.leadership,
      });
      return;
    }

    // 3. charisma 检查（CTO 为 0 表示不要求）
    if (cfg.minCharisma > 0 && emp.attributes.charisma < cfg.minCharisma) {
      events.emit('EXECUTIVE_APPOINT_FAILED', {
        role: this.role,
        reason: 'charisma_too_low',
        required: cfg.minCharisma,
        actual: emp.attributes.charisma,
      });
      return;
    }

    // 4. 槽位占用检查：同一员工不能同时任 2 个高管槽位
    for (const r of EXECUTIVE_ROLES) {
      const k = `${r}Id` as keyof typeof current.executives;
      if (current.executives[k] === this.employeeId) {
        events.emit('EXECUTIVE_APPOINT_FAILED', {
          role: this.role,
          reason: 'already_executive',
        });
        return;
      }
    }

    // 5. 执行任命（替换原占用者，原占用者保留员工身份）
    const slotKey = `${this.role}Id` as 'ceoId' | 'cooId' | 'cfoId' | 'ctoId';
    const previousId = current.executives[slotKey];
    state.update((draft) => {
      draft.executives[slotKey] = this.employeeId;
    });

    events.emit('EXECUTIVE_APPOINTED', {
      role: this.role,
      employeeId: this.employeeId,
      previousId,
    });
  }
}

// ============================================================
// 3. 解任高管
// ============================================================

/**
 * 解任高管（不解雇员工）
 *
 * 若槽位为空则失败。成功后清空槽位，发射 EXECUTIVE_DISMISSED 事件。
 */
export class DismissExecutiveCommand implements Command {
  constructor(public readonly role: ExecutiveRole) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const slotKey = `${this.role}Id` as 'ceoId' | 'cooId' | 'cfoId' | 'ctoId';
    const previousId = current.executives[slotKey];

    if (!previousId) {
      events.emit('EXECUTIVE_DISMISS_FAILED', {
        role: this.role,
        reason: 'slot_empty',
      });
      return;
    }

    state.update((draft) => {
      draft.executives[slotKey] = null;
    });

    events.emit('EXECUTIVE_DISMISSED', {
      role: this.role,
      previousId,
    });
  }
}


