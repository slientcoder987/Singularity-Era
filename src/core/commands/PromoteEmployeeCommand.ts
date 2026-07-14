/**
 * 员工晋升命令
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import {
  experienceForLevel,
  PROMOTE_EXP_RATIO,
  PROMOTE_MIN_GRADE,
  PROMOTE_COOLDOWN_DAYS,
  PROMOTE_SKILL_POINT_GAIN,
} from '../config/employees';
import { REGIONS } from '../config/regions';
import { calcSalaryForLevel } from '../utils/employeeUtils';
import type { PerformanceRecord } from '../entities/Employee';

/** 等级权重，用于冷却判断（同一员工上次晋升日存于 lastBonusDay 字段复用） */
const PROMOTE_DAY_KEY = 'lastBonusDay';

/**
 * 主动晋升员工
 *
 * 条件：
 * - 经验 ≥ 当前等级阈值的 80%
 * - 最近一次绩效 ≥ A
 * - 距上次晋升 ≥ 90 天
 *
 * 效果：
 * - level +1
 * - 技能点 +2
 * - 薪资按新等级重新计算
 */
export class PromoteEmployeeCommand implements Command {
  constructor(public readonly employeeId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('PROMOTE_REJECTED', { reason: '员工不存在' });
      return;
    }

    if (emp.level >= 10) {
      events.emit('PROMOTE_REJECTED', { reason: '已达最高等级' });
      return;
    }

    // 经验检查
    const requiredExp = experienceForLevel(emp.level) * PROMOTE_EXP_RATIO;
    if (emp.experience < requiredExp) {
      events.emit('PROMOTE_REJECTED', {
        reason: `经验不足，需 ${Math.ceil(requiredExp)}，当前 ${Math.floor(emp.experience)}`,
      });
      return;
    }

    // 绩效检查
    const perf: PerformanceRecord | undefined = emp.lastPerformance;
    if (!perf) {
      events.emit('PROMOTE_REJECTED', { reason: '尚无绩效记录' });
      return;
    }
    const gradeOrder: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };
    if (gradeOrder[perf.grade] < gradeOrder[PROMOTE_MIN_GRADE]) {
      events.emit('PROMOTE_REJECTED', {
        reason: `绩效不足，需 ${PROMOTE_MIN_GRADE} 级以上，当前 ${perf.grade} 级`,
      });
      return;
    }

    // 冷却检查（复用 lastBonusDay 字段记录晋升日）
    const lastPromote = (emp as any)[PROMOTE_DAY_KEY] as number | undefined ?? -999;
    if (current.date - lastPromote < PROMOTE_COOLDOWN_DAYS) {
      const remain = PROMOTE_COOLDOWN_DAYS - (current.date - lastPromote);
      events.emit('PROMOTE_REJECTED', {
        reason: `冷却中，剩余 ${remain} 天`,
      });
      return;
    }

    // 计算新等级和新薪资
    const newLevel = emp.level + 1;
    const hqRegionId = current.headquartersRegionId;
    const hqRegion = hqRegionId ? REGIONS.find((r) => r.id === hqRegionId) ?? null : null;
    const newSalary = calcSalaryForLevel(emp.role, newLevel, hqRegion);

    const oldLevel = emp.level;
    const oldSalary = emp.salary;

    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (!target) return;
      target.level = newLevel;
      target.salary = newSalary;
      target.skillPoints += PROMOTE_SKILL_POINT_GAIN;
      target.loyalty = Math.min(100, target.loyalty + 10);
      (target as any)[PROMOTE_DAY_KEY] = draft.date;
    });

    events.emit('EMPLOYEE_PROMOTED', {
      employeeId: this.employeeId,
      oldLevel,
      newLevel,
      oldSalary,
      newSalary,
      skillPointGain: PROMOTE_SKILL_POINT_GAIN,
    });
  }
}
