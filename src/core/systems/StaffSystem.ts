import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { Employee } from '../entities/Employee';
import type { StaffTrainingProject } from '../entities/StaffTrainingProject';
import {
  PAY_PERIOD_DAYS,
  experienceForLevel,
  LEVEL_UP_ATTRIBUTE_GAIN,
  LEVEL_UP_SKILL_POINTS,
  PERFORMANCE_EVAL_PERIOD,
  PERFORMANCE_GRADE_THRESHOLDS,
  PERFORMANCE_S_SKILL_POINT,
  PERFORMANCE_C_LOYALTY_PENALTY,
} from '../config/employees';
import { STAFF_TRAINING_CONFIG } from '../entities/StaffTrainingProject';
import { REGIONS } from '../config/regions';
import { clamp } from '../utils';
import { salaryCompetitiveness, salaryLoyaltyDelta, resignProbability } from '../utils/employeeUtils';

/**
 * StaffSystem
 *
 * 每日更新所有员工状态：
 * 1. 疲劳：空闲时快速恢复，工作中缓慢积累（速度与 stamina 成反比）。
 * 2. 忠诚度：自然衰减 + 薪资竞争力影响 + 高疲劳加速衰减 + 魅力抵抗。
 * 3. 经验：工作中获得经验，达到阈值升级（属性提升 + 技能点）。
 * 4. 培训：推进进行中的培训项目，完成时发放经验/属性/技能点。
 * 5. 离职：忠诚度 < 30 时每日概率离职，股权锁定期内不可离职。
 * 6. 发薪：每 PAY_PERIOD_DAYS 天计算总薪资，直接扣 funds，发射 SALARY_PAID。
 *
 * 每 PERFORMANCE_EVAL_PERIOD 天进行一次绩效评估。
 */
export class StaffSystem implements System {
  name = 'StaffSystem';

  private static readonly DAILY_LOYALTY_DECAY = 0.1;
  private static readonly DAILY_EXPERIENCE_WORK = 2;
  private static readonly DAILY_EXPERIENCE_IDLE = 0.5;
  private static readonly IDLE_FATIGUE_RECOVERY = 5;
  private static readonly WORK_FATIGUE_BASE = 1.5;

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const today = state.read().date;
    const resignList: Array<{ id: string; name: string; role: Employee['role'] }> = [];
    const levelUpList: Array<{ employeeId: string; newLevel: number }> = [];
    const trainingCompletedList: Array<{ employeeId: string; trainingId: string }> = [];

    // 1. 更新员工状态 + 培训推进
    state.update((draft) => {
      const survivors: Employee[] = [];

      // 获取总部地区用于薪资竞争力计算
      const hqRegionId = draft.headquartersRegionId;
      const hqRegion = hqRegionId ? REGIONS.find((r) => r.id === hqRegionId) ?? null : null;

      for (const emp of draft.employees) {
        // —— 培训推进 ——
        if (emp.status === 'training' && emp.trainingId) {
          const training = draft.staffTrainings.find((t) => t.id === emp.trainingId);
          if (training && training.status === 'in_progress') {
            training.elapsedDays += deltaDays;
            // 培训期间不积累疲劳，反而恢复
            emp.fatigue = clamp(emp.fatigue - 3 * deltaDays, 0, 100);

            if (training.elapsedDays >= training.totalDays) {
              // 培训完成
              training.status = 'completed';
              this.applyTrainingCompletion(emp, training);
              emp.status = 'idle';
              emp.trainingId = undefined;
              trainingCompletedList.push({ employeeId: emp.id, trainingId: training.id });
            }
          }
        } else {
          // —— 疲劳 ——
          if (emp.status === 'assigned') {
            const fatigueGain = StaffSystem.WORK_FATIGUE_BASE * (100 / Math.max(emp.attributes.stamina, 1)) * deltaDays;
            emp.fatigue = clamp(emp.fatigue + fatigueGain, 0, 100);
            // 累积工作天数（用于绩效）
            emp.monthlyWorkDays = (emp.monthlyWorkDays ?? 0) + deltaDays;
          } else {
            emp.fatigue = clamp(emp.fatigue - StaffSystem.IDLE_FATIGUE_RECOVERY * deltaDays, 0, 100);
          }

          // —— 忠诚度 ——
          let loyaltyDelta = -StaffSystem.DAILY_LOYALTY_DECAY * deltaDays;
          // 高疲劳加速衰减
          if (emp.fatigue > 70) {
            loyaltyDelta -= (emp.fatigue - 70) * 0.02 * deltaDays;
          }
          // 魅力可抵抗衰减
          loyaltyDelta += emp.attributes.charisma * 0.01 * deltaDays;
          // 薪资竞争力影响
          const competitiveness = salaryCompetitiveness(emp, hqRegion);
          loyaltyDelta += salaryLoyaltyDelta(competitiveness) * deltaDays;
          // 全公司士气影响忠诚度（-10 ~ +5 /天）
          const morale = draft.riskState.employeeMorale ?? 50;
          const moraleEffect = ((morale - 50) / 50) * 0.2;
          loyaltyDelta += moraleEffect * deltaDays;
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
            const attrKeys = ['intelligence', 'creativity', 'leadership', 'stamina', 'charisma'] as const;
            const shuffled = [...attrKeys].sort(() => Math.random() - 0.5);
            (emp.attributes as any)[shuffled[0]] += LEVEL_UP_ATTRIBUTE_GAIN;
            (emp.attributes as any)[shuffled[1]] += LEVEL_UP_ATTRIBUTE_GAIN;
            levelUpList.push({ employeeId: emp.id, newLevel: emp.level });
          }
        }

        // —— 离职检查 ——
        // 股权锁定期内不可离职
        const equityLocked = emp.hasEquity && emp.equityGrantedDay !== undefined
          && (today - emp.equityGrantedDay) < 730;
        if (!equityLocked) {
          const p = resignProbability(emp.loyalty, emp.fatigue) * deltaDays;
          if (p > 0 && Math.random() < p) {
            resignList.push({ id: emp.id, name: emp.name, role: emp.role });
            continue;
          }
        }

        survivors.push(emp);
      }

      draft.employees = survivors;
    });

    // 2. 发射事件
    for (const emp of resignList) {
      events.emit('EMPLOYEE_RESIGNED', emp);
    }
    for (const { employeeId, newLevel } of levelUpList) {
      events.emit('EMPLOYEE_LEVEL_UP', employeeId, newLevel);
    }
    for (const { employeeId, trainingId } of trainingCompletedList) {
      events.emit('STAFF_TRAINING_COMPLETED', { employeeId, trainingId });
    }

    // 3. 发薪
    if (today > 0 && today % PAY_PERIOD_DAYS === 0) {
      this.processPayroll(state, events);
    }

    // 4. 绩效评估
    if (today > 0 && today - state.read().lastPerformanceEvalDay >= PERFORMANCE_EVAL_PERIOD) {
      this.evaluatePerformance(state, events);
    }
  }

  /** 应用培训完成效果 */
  private applyTrainingCompletion(emp: Employee, training: StaffTrainingProject): void {
    const cfg = STAFF_TRAINING_CONFIG[training.type];
    emp.experience += cfg.expGain;
    emp.skillPoints += cfg.skillPointGain;

    if (cfg.allAttributes) {
      // 全属性 +gain
      (emp.attributes as any).intelligence += cfg.attributeGain;
      (emp.attributes as any).creativity += cfg.attributeGain;
      (emp.attributes as any).leadership += cfg.attributeGain;
      (emp.attributes as any).stamina += cfg.attributeGain;
      (emp.attributes as any).charisma += cfg.attributeGain;
    } else if (training.targetAttribute) {
      (emp.attributes as any)[training.targetAttribute] += cfg.attributeGain;
    }
  }

  /** 处理发薪 */
  private processPayroll(state: GameState, events: EventBus): void {
    const current = state.read();
    const dailyTotal = current.employees.reduce((sum, e) => sum + e.salary / 365, 0);
    const totalSalary = dailyTotal * PAY_PERIOD_DAYS;

    if (totalSalary > 0) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalSalary;
      });
      events.emit('SALARY_PAID', totalSalary, current.employees.length);
    }
  }

  /** 绩效评估（每月一次） */
  private evaluatePerformance(state: GameState, events: EventBus): void {
    const today = state.read().date;
    const evaluations: Array<{ employeeId: string; grade: string; score: number }> = [];

    state.update((draft) => {
      for (const emp of draft.employees) {
        const workDays = emp.monthlyWorkDays ?? 0;
        const contribution = emp.monthlyContribution ?? 0;
        const skillCount = emp.skills.filter((s) => s.unlocked).length;
        const attendance = clamp(workDays / 30, 0, 1);
        const score =
          attendance * 50 +
          clamp(contribution, 0, 100) * 0.3 +
          Math.min(skillCount, 5) * 10 +
          (emp.loyalty > 70 ? 10 : 0);

        let grade: 'S' | 'A' | 'B' | 'C' = 'C';
        if (score >= PERFORMANCE_GRADE_THRESHOLDS.S) grade = 'S';
        else if (score >= PERFORMANCE_GRADE_THRESHOLDS.A) grade = 'A';
        else if (score >= PERFORMANCE_GRADE_THRESHOLDS.B) grade = 'B';

        emp.lastPerformance = {
          evalDay: today,
          attendance,
          projectContribution: contribution,
          score: Math.round(score),
          grade,
        };

        // 奖惩
        if (grade === 'S') {
          emp.skillPoints += PERFORMANCE_S_SKILL_POINT;
        } else if (grade === 'C') {
          emp.loyalty = clamp(emp.loyalty - PERFORMANCE_C_LOYALTY_PENALTY, 0, 100);
        }

        // 重置月度累积
        emp.monthlyWorkDays = 0;
        emp.monthlyContribution = 0;

        evaluations.push({ employeeId: emp.id, grade, score: Math.round(score) });
      }
      draft.lastPerformanceEvalDay = today;
    });

    events.emit('PERFORMANCE_EVALUATED', evaluations);
  }

  /**
   * 挖角处理：外部高薪挖角某员工。
   * @returns true 表示员工被挖走（已从 state 移除）
   */
  attemptPoaching(state: GameState, events: EventBus, empId: string, offerSalary: number): boolean {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === empId);
    if (!emp) return false;

    // 股权锁定期内不可被挖走
    const equityLocked = emp.hasEquity && emp.equityGrantedDay !== undefined
      && (current.date - emp.equityGrantedDay) < 730;
    if (equityLocked) {
      events.emit('POACH_FAILED', empId, offerSalary);
      return false;
    }

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
