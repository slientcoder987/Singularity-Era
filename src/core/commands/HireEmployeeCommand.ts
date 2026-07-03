import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { StaffRole, type Employee, type StaffAttributes } from '../entities/Employee';
import { ROLE_CONFIG, SKILL_CONFIG, HIRE_COST, CORE_EMPLOYEE_CAP_PER_ROLE } from '../config/employees';

/**
 * HireEmployeeCommand
 *
 * 招聘一名员工：
 * 1. 检查资金是否足够支付一次性招聘费（HIRE_COST）。
 * 2. 根据角色权重生成随机属性。
 * 3. 创建 Employee 加入 state.employees。
 * 4. 扣除招聘费。
 *
 * 新增角色只需扩展 ROLE_CONFIG，本命令无需修改。
 */
export class HireEmployeeCommand implements Command {
  constructor(
    public readonly role: StaffRole,
    public readonly name?: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const roleCfg = ROLE_CONFIG[this.role];
    if (!roleCfg) {
      events.emit('HIRE_REJECTED', { role: this.role, reason: '未知角色' });
      return;
    }

    // 检查该角色核心员工数量上限
    const current = state.read();
    const roleCoreCount = current.employees.filter((e) => e.role === this.role).length;
    if (roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE) {
      events.emit('HIRE_REJECTED', {
        role: this.role,
        reason: `核心员工已达上限（${CORE_EMPLOYEE_CAP_PER_ROLE}人）`,
        cap: CORE_EMPLOYEE_CAP_PER_ROLE,
        current: roleCoreCount,
      });
      return;
    }

    const funds = state.getResource('funds');
    if (funds < HIRE_COST) {
      events.emit('HIRE_REJECTED', {
        role: this.role,
        reason: '资金不足',
        cost: HIRE_COST,
        funds,
      });
      return;
    }

    // 生成随机属性：每项 50-100 基础 + 权重加成
    const attributes = this.generateAttributes(roleCfg.attributeWeights);

    // 生成初始技能列表（全部锁定）
    const skills = roleCfg.skillPool.map((skillId) => {
      const cfg = SKILL_CONFIG[skillId];
      if (!cfg) {
        return {
          id: skillId,
          name: skillId,
          description: '',
          effect: { type: 'unknown', value: 0 },
          unlocked: false,
          cost: 1,
        };
      }
      return { ...cfg, unlocked: false };
    });

    const employee: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: this.name ?? this.generateName(),
      role: this.role,
      attributes,
      skills,
      skillPoints: 0,
      level: 1,
      salary: roleCfg.baseSalary,
      loyalty: 70,
      fatigue: 0,
      status: 'idle',
      hireDay: state.read().date,
      experience: 0,
    };

    // 扣招聘费
    state.addResource('funds', -HIRE_COST);

    state.update((draft) => {
      draft.employees.push(employee);
    });

    events.emit('EMPLOYEE_HIRED', employee, HIRE_COST);
  }

  /** 按权重生成随机属性 */
  private generateAttributes(weights: Partial<StaffAttributes>): StaffAttributes {
    const keys: (keyof StaffAttributes)[] = ['intelligence', 'creativity', 'leadership', 'stamina', 'charisma'];
    const result = {} as StaffAttributes;
    for (const key of keys) {
      const weight = weights[key] ?? 0.1;
      // 基础 50-70 + 权重 * 30-50
      const base = 50 + Math.random() * 20;
      const bonus = weight * (30 + Math.random() * 20);
      result[key] = Math.round(base + bonus);
    }
    return result;
  }

  /** 生成随机姓名 */
  private generateName(): string {
    const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'];
    const givenNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '霞', '平', '刚', '桂英'];
    return `${surnames[Math.floor(Math.random() * surnames.length)]}${givenNames[Math.floor(Math.random() * givenNames.length)]}`;
  }
}
