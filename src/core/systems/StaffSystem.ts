import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { Employee } from '../entities/Employee';
import {
  PAY_PERIOD_DAYS,
  experienceForLevel,
  LEVEL_UP_ATTRIBUTE_GAIN,
  LEVEL_UP_SKILL_POINTS,
} from '../config/employees';
import { clamp } from '../utils';

/**
 * StaffSystem
 *
 * 每日更新所有员工状态：
 * 1. 疲劳：空闲时快速恢复，工作中缓慢积累（速度与 stamina 成反比）。
 * 2. 忠诚度：轻微自然衰减，高疲劳或低薪加速衰减；魅力可抵抗。
 * 3. 经验：工作中获得经验，达到阈值升级（属性提升 + 技能点）。
 * 4. 离职：忠诚度 < 10 时每日概率离职，发射 EMPLOYEE_RESIGNED。
 * 5. 发薪：每 PAY_PERIOD_DAYS 天计算总薪资，直接扣 funds，发射 SALARY_PAID。
 *
 * 通过事件解耦：薪资扣除通过 state.update 直接操作 resources['funds']。
 */
export class StaffSystem implements System {
  name = 'StaffSystem';

  /** 每日忠诚度自然衰减 */
  private static readonly DAILY_LOYALTY_DECAY = 0.1;
  /** 工作中每日经验获取 */
  private static readonly DAILY_EXPERIENCE_WORK = 2;
  /** 空闲时每日经验获取 */
  private static readonly DAILY_EXPERIENCE_IDLE = 0.5;
  /** 空闲时每日疲劳恢复 */
  private static readonly IDLE_FATIGUE_RECOVERY = 5;
  /** 工作中每日疲劳积累基数 */
  private static readonly WORK_FATIGUE_BASE = 1.5;
  /** 忠诚度低于此阈值时开始有离职概率 */
  private static readonly RESIGN_THRESHOLD = 10;
  /** 忠诚度低于阈值时的日离职概率 */
  private static readonly RESIGN_PROBABILITY = 0.05;

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const today = state.read().date;
    const resignList: Employee[] = [];
    const levelUpList: Array<{ employee: Employee; newLevel: number }> = [];

    // 1. 更新每个员工的疲劳、忠诚、经验、升级、离职
    state.update((draft) => {
      const survivors: Employee[] = [];

      for (const emp of draft.employees) {
        // —— 疲劳 ——
        if (emp.status === 'assigned') {
          // 工作中：疲劳积累速度 = 基数 * (100 / stamina)
          const fatigueGain = StaffSystem.WORK_FATIGUE_BASE * (100 / Math.max(emp.attributes.stamina, 1)) * deltaDays;
          emp.fatigue = clamp(emp.fatigue + fatigueGain, 0, 100);
        } else {
          // 空闲：快速恢复
          emp.fatigue = clamp(emp.fatigue - StaffSystem.IDLE_FATIGUE_RECOVERY * deltaDays, 0, 100);
        }

        // —— 忠诚度 ——
        let loyaltyDelta = -StaffSystem.DAILY_LOYALTY_DECAY * deltaDays;
        // 高疲劳加速衰减
        if (emp.fatigue > 70) {
          loyaltyDelta -= (emp.fatigue - 70) * 0.02 * deltaDays;
        }
        // 魅力可抵抗衰减（每点魅力抵消 0.01）
        loyaltyDelta += emp.attributes.charisma * 0.01 * deltaDays;
        emp.loyalty = clamp(emp.loyalty + loyaltyDelta, 0, 100);

        // —— 经验 ——
        const expGain = (emp.status === 'assigned'
          ? StaffSystem.DAILY_EXPERIENCE_WORK
          : StaffSystem.DAILY_EXPERIENCE_IDLE) * deltaDays;
        emp.experience += expGain;

        // —— 升级 ——
        while (emp.experience >= experienceForLevel(emp.level)) {
          emp.experience -= experienceForLevel(emp.level);
          emp.level += 1;
          emp.skillPoints += LEVEL_UP_SKILL_POINTS;
          // 属性微幅提升（随机选 2 项各 +LEVEL_UP_ATTRIBUTE_GAIN）
          const attrKeys = ['intelligence', 'creativity', 'leadership', 'stamina', 'charisma'] as const;
          const shuffled = [...attrKeys].sort(() => Math.random() - 0.5);
          (emp.attributes as any)[shuffled[0]] += LEVEL_UP_ATTRIBUTE_GAIN;
          (emp.attributes as any)[shuffled[1]] += LEVEL_UP_ATTRIBUTE_GAIN;
          levelUpList.push({ employee: emp, newLevel: emp.level });
        }

        // —— 离职检查 ——
        if (emp.loyalty < StaffSystem.RESIGN_THRESHOLD) {
          // 每日按概率离职
          let resignChance = StaffSystem.RESIGN_PROBABILITY * deltaDays;
          // 忠诚度越低概率越高
          resignChance += (StaffSystem.RESIGN_THRESHOLD - emp.loyalty) * 0.005 * deltaDays;
          if (Math.random() < resignChance) {
            resignList.push(emp);
            continue; // 不加入 survivors
          }
        }

        survivors.push(emp);
      }

      draft.employees = survivors;
    });

    // 2. 发射离职事件
    for (const emp of resignList) {
      events.emit('EMPLOYEE_RESIGNED', emp);
    }

    // 3. 发射升级事件
    for (const { employee, newLevel } of levelUpList) {
      events.emit('EMPLOYEE_LEVEL_UP', employee.id, newLevel);
    }

    // 4. 发薪日（每 PAY_PERIOD_DAYS 天）
    if (today > 0 && today % PAY_PERIOD_DAYS === 0) {
      this.processPayroll(state, events);
    }
  }

  /** 处理发薪：计算总薪资并扣 funds */
  private processPayroll(state: GameState, events: EventBus): void {
    const current = state.read();
    // 年薪 / 365 * PAY_PERIOD_DAYS = 每个发薪周期应发金额
    const dailyTotal = current.employees.reduce((sum, e) => sum + e.salary / 365, 0);
    const totalSalary = dailyTotal * PAY_PERIOD_DAYS;

    if (totalSalary > 0) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalSalary;
      });
      events.emit('SALARY_PAID', totalSalary, current.employees.length);
    }
  }

  /**
   * 挖角处理：外部高薪挖角某员工。
   * @returns true 表示员工被挖走（已从 state 移除）
   */
  attemptPoaching(state: GameState, events: EventBus, empId: string, offerSalary: number): boolean {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === empId);
    if (!emp) return false;

    // 挖角成功率：薪资提升比例 + 忠诚度反因子
    const salaryRatio = offerSalary / Math.max(emp.salary, 1);
    const loyaltyFactor = emp.loyalty / 100;
    const successChance = clamp((salaryRatio - 1) * 0.5 - loyaltyFactor * 0.5, 0, 0.95);

    if (Math.random() < successChance) {
      state.update((draft) => {
        draft.employees = draft.employees.filter((e) => e.id !== empId);
      });
      events.emit('EMPLOYEE_POACHED', empId, offerSalary);
      return true;
    }

    events.emit('POACH_FAILED', empId, offerSalary);
    return false;
  }
}
