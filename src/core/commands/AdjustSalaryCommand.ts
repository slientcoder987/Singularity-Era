import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { clamp } from '../utils';

/**
 * AdjustSalaryCommand
 *
 * 调整员工薪资：
 * - 加薪：忠诚度小幅提升。
 * - 减薪：忠诚度大幅下降（减薪对士气打击更大）。
 * 发射 SALARY_ADJUSTED 事件。
 */
export class AdjustSalaryCommand implements Command {
  constructor(
    public readonly employeeId: string,
    public readonly newSalary: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    if (this.newSalary < 0) {
      events.emit('SALARY_ADJUST_REJECTED', { employeeId: this.employeeId, reason: '薪资不能为负' });
      return;
    }

    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('SALARY_ADJUST_REJECTED', { employeeId: this.employeeId, reason: '员工不存在' });
      return;
    }

    const oldSalary = emp.salary;
    const delta = this.newSalary - oldSalary;
    let loyaltyDelta = 0;

    if (delta > 0) {
      // 加薪：忠诚度小幅提升（幅度与加薪比例相关）
      loyaltyDelta = clamp((delta / oldSalary) * 30, 0, 15);
    } else if (delta < 0) {
      // 减薪：忠诚度大幅下降（幅度与减薪比例相关，乘以 2 倍惩罚）
      loyaltyDelta = clamp((delta / oldSalary) * 60, -30, 0);
    }

    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.salary = this.newSalary;
        target.loyalty = clamp(target.loyalty + loyaltyDelta, 0, 100);
      }
    });

    events.emit('SALARY_ADJUSTED', {
      employeeId: this.employeeId,
      oldSalary,
      newSalary: this.newSalary,
      loyaltyDelta,
    });
  }
}
