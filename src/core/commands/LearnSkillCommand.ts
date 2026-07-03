import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { ROLE_CONFIG, SKILL_CONFIG } from '../config/employees';

/**
 * LearnSkillCommand
 *
 * 学习技能：
 * 1. 检查员工是否存在。
 * 2. 检查技能是否在员工角色的技能池中。
 * 3. 检查技能点是否足够。
 * 4. 检查是否已解锁。
 * 5. 扣除技能点，标记 unlocked=true。
 *
 * 新增技能只需在 SKILL_CONFIG 添加，并在角色 skillPool 中引用，本命令无需修改。
 */
export class LearnSkillCommand implements Command {
  constructor(
    public readonly employeeId: string,
    public readonly skillId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit('LEARN_SKILL_REJECTED', {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: '员工不存在',
      });
      return;
    }

    const roleCfg = ROLE_CONFIG[emp.role];
    if (!roleCfg.skillPool.includes(this.skillId)) {
      events.emit('LEARN_SKILL_REJECTED', {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: '该技能不在当前角色的技能池中',
      });
      return;
    }

    const skillCfg = SKILL_CONFIG[this.skillId];
    if (!skillCfg) {
      events.emit('LEARN_SKILL_REJECTED', {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: '未知技能',
      });
      return;
    }

    const skill = emp.skills.find((s) => s.id === this.skillId);
    if (!skill) {
      events.emit('LEARN_SKILL_REJECTED', {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: '员工不持有该技能槽',
      });
      return;
    }

    if (skill.unlocked) {
      events.emit('LEARN_SKILL_REJECTED', {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: '技能已解锁',
      });
      return;
    }

    if (emp.skillPoints < skillCfg.cost) {
      events.emit('LEARN_SKILL_REJECTED', {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: '技能点不足',
        has: emp.skillPoints,
        need: skillCfg.cost,
      });
      return;
    }

    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (!target) return;
      const targetSkill = target.skills.find((s) => s.id === this.skillId);
      if (!targetSkill) return;
      targetSkill.unlocked = true;
      target.skillPoints -= skillCfg.cost;
    });

    events.emit('SKILL_LEARNED', this.employeeId, this.skillId);
  }
}
