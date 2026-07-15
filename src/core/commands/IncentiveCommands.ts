/**
 * 员工激励命令：奖金、股权、团建
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { clamp } from '../utils';
import {
  BONUS_COOLDOWN_DAYS,
  BONUS_SALARY_RATIO,
  BONUS_LOYALTY_GAIN,
  EQUITY_COOLDOWN_DAYS,
  EQUITY_LOYALTY_GAIN,
  TEAM_BUILDING_COST_PER_HEAD,
  TEAM_BUILDING_COOLDOWN_DAYS,
  TEAM_BUILDING_LOYALTY_GAIN,
  TEAM_BUILDING_FATIGUE_REDUCE,
} from '../config/employees';

/**
 * 发放奖金（单个员工）
 */
export class GiveBonusCommand implements Command {
  constructor(public readonly employeeId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('BONUS_REJECTED', { reason: '员工不存在' });
      return;
    }

    // 冷却检查
    const lastBonus = emp.lastBonusDay ?? -999;
    if (current.date - lastBonus < BONUS_COOLDOWN_DAYS) {
      const remain = BONUS_COOLDOWN_DAYS - (current.date - lastBonus);
      events.emit('BONUS_REJECTED', {
        reason: `冷却中，剩余 ${remain} 天`,
      });
      return;
    }

    const bonusAmount = Math.round(emp.salary * BONUS_SALARY_RATIO);
    const funds = current.resources['funds'] ?? 0;
    if (funds < bonusAmount) {
      events.emit('BONUS_REJECTED', {
        reason: '资金不足',
        cost: bonusAmount,
        funds,
      });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= bonusAmount;
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.loyalty = clamp(target.loyalty + BONUS_LOYALTY_GAIN, 0, 100);
        target.lastBonusDay = draft.date;
      }
    });

    events.emit('BONUS_GIVEN', {
      employeeId: this.employeeId,
      amount: bonusAmount,
      loyaltyGain: BONUS_LOYALTY_GAIN,
    });
  }
}

/**
 * 授予股权（单个员工）
 */
export class GrantEquityCommand implements Command {
  constructor(public readonly employeeId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('EQUITY_REJECTED', { reason: '员工不存在' });
      return;
    }

    if (emp.hasEquity) {
      events.emit('EQUITY_REJECTED', { reason: '员工已持有股权' });
      return;
    }

    // BUG-17 修复：全公司月度授股权配额（30 天内最多 3 人），防止批量授股权瞬间拉满忠诚度
    const recentEquityGrants = current.employees.filter(
      (e) => e.hasEquity && e.equityGrantedDay !== undefined && current.date - e.equityGrantedDay < 30,
    ).length;
    if (recentEquityGrants >= 3) {
      events.emit('EQUITY_REJECTED', {
        reason: `本月授股权配额已用尽（30 天内最多 3 人），请等待 ${30 - (current.date - (Math.min(...current.employees.filter(e => e.hasEquity && e.equityGrantedDay !== undefined).map(e => e.equityGrantedDay!))))} 天`,
      });
      return;
    }

    // 冷却：上次奖金日之后 EQUITY_COOLDOWN_DAYS 天才能授予股权
    // 实际冷却以员工 lastBonusDay 为参考，避免短期内重复激励
    const lastBonus = emp.lastBonusDay ?? -999;
    if (current.date - lastBonus < EQUITY_COOLDOWN_DAYS && lastBonus > 0) {
      events.emit('EQUITY_REJECTED', {
        reason: `刚发过奖金，需等待 ${EQUITY_COOLDOWN_DAYS - (current.date - lastBonus)} 天`,
      });
      return;
    }

    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.hasEquity = true;
        target.equityGrantedDay = draft.date;
        target.loyalty = clamp(target.loyalty + EQUITY_LOYALTY_GAIN, 0, 100);
      }
    });

    events.emit('EQUITY_GRANTED', {
      employeeId: this.employeeId,
      loyaltyGain: EQUITY_LOYALTY_GAIN,
    });
  }
}

/**
 * 团建活动（全员）
 */
export class TeamBuildingCommand implements Command {
  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 冷却检查
    if (current.date - current.lastTeamBuildingDay < TEAM_BUILDING_COOLDOWN_DAYS) {
      const remain = TEAM_BUILDING_COOLDOWN_DAYS - (current.date - current.lastTeamBuildingDay);
      events.emit('TEAM_BUILDING_REJECTED', {
        reason: `冷却中，剩余 ${remain} 天`,
      });
      return;
    }

    const headcount = current.employees.length;
    if (headcount === 0) {
      events.emit('TEAM_BUILDING_REJECTED', { reason: '无员工' });
      return;
    }

    const cost = headcount * TEAM_BUILDING_COST_PER_HEAD;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('TEAM_BUILDING_REJECTED', {
        reason: '资金不足',
        cost,
        funds,
      });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      draft.lastTeamBuildingDay = draft.date;
      for (const emp of draft.employees) {
        emp.loyalty = clamp(emp.loyalty + TEAM_BUILDING_LOYALTY_GAIN, 0, 100);
        emp.fatigue = clamp(emp.fatigue - TEAM_BUILDING_FATIGUE_REDUCE, 0, 100);
      }
    });

    events.emit('TEAM_BUILDING_COMPLETED', {
      headcount,
      cost,
      loyaltyGain: TEAM_BUILDING_LOYALTY_GAIN,
      fatigueReduce: TEAM_BUILDING_FATIGUE_REDUCE,
    });
  }
}
