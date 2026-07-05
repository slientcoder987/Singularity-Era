import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { StaffRole, type Employee } from '../../core/entities/Employee';
import {
  ROLE_CONFIG,
  HIRE_COST,
  NORMAL_HIRE_COST,
  CORE_EMPLOYEE_CAP_PER_ROLE,
  ROLE_TO_STAFF_RESOURCE,
  experienceForLevel,
} from '../../core/config/employees';
import { HireEmployeeCommand } from '../../core/commands/HireEmployeeCommand';
import { HireNormalEmployeeCommand } from '../../core/commands/HireNormalEmployeeCommand';
import { FireEmployeeCommand } from '../../core/commands/FireEmployeeCommand';
import { AdjustSalaryCommand } from '../../core/commands/AdjustSalaryCommand';
import { LearnSkillCommand } from '../../core/commands/LearnSkillCommand';
import { formatCurrency } from '../../core/utils';
import styles from '../styles/App.module.css';

/**
 * EmployeePanel
 *
 * 员工管理面板：
 * - 顶部：核心员工招聘按钮（按角色，含上限提示）+ 普通员工招聘按钮
 * - 统计行：核心员工数 / 普通员工数 / 每日薪资支出
 * - 列表：核心员工卡片（每张显示属性、技能、薪资、忠诚、疲劳）
 * - 卡片内：解雇、加薪/减薪、学习技能操作
 */
export function EmployeePanel() {
  const game = useGame();
  const employees = useGameState((s) => s.employees);
  const resources = useGameState((s) => s.resources);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  // 当前筛选角色：'all' 表示全部，否则按 StaffRole 筛选
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');

  // 普通员工总数
  const humanResources = game.registry.getByCategory('human');
  const normalCount = humanResources.reduce((sum, def) => sum + (resources[def.id] ?? 0), 0);

  // 每日薪资支出
  const coreDailySalary = employees.reduce((sum, e) => sum + e.salary / 365, 0);
  const normalDailySalary = humanResources.reduce((sum, def) => {
    const count = resources[def.id] ?? 0;
    return sum + count * (50000 / 365); // 普通员工年薪 $50,000
  }, 0);

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>员工系统 · 人力管理</h3>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>核心员工</span>
        <span className={styles.devHint}>
          上限 {CORE_EMPLOYEE_CAP_PER_ROLE} 人/角色 · 招聘费 ${HIRE_COST.toLocaleString()}/人
        </span>
      </div>

      <div className={styles.devRow}>
        {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => {
          const roleCoreCount = employees.filter((e) => e.role === role).length;
          const isFull = roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE;
          return (
            <button
              key={role}
              className={styles.btn}
              onClick={() => game.executeCommand(new HireEmployeeCommand(role))}
              disabled={funds < HIRE_COST || isFull}
              title={isFull ? '已达上限' : undefined}
            >
              招 {ROLE_CONFIG[role].displayName}
              <span className={styles.devHint}>
                ({roleCoreCount}/{CORE_EMPLOYEE_CAP_PER_ROLE})
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>普通员工</span>
        <span className={styles.devHint}>
          无上限 · 招聘费 ${NORMAL_HIRE_COST.toLocaleString()}/人 · 年薪 $50,000
        </span>
      </div>

      <div className={styles.devRow}>
        {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => {
          const staffId = ROLE_TO_STAFF_RESOURCE[role];
          const count = resources[staffId] ?? 0;
          return (
            <button
              key={`normal-${role}`}
              className={styles.btn}
              onClick={() => game.executeCommand(new HireNormalEmployeeCommand(role))}
              disabled={funds < NORMAL_HIRE_COST}
            >
              招 {ROLE_CONFIG[role].displayName}（普通）
              <span className={styles.devHint}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>统计</span>
        <span className={styles.devHint}>
          核心 {employees.length} 人 · 普通 {normalCount} 人 · 合计 {employees.length + normalCount} 人
          {' · '}每日薪资 {formatCurrency(coreDailySalary + normalDailySalary)}
        </span>
      </div>

      {/* 按角色筛选标签 */}
      <div className={styles.empFilter}>
        <button
          className={`${styles.empFilterBtn} ${roleFilter === 'all' ? styles.empFilterBtnActive : ''}`}
          onClick={() => setRoleFilter('all')}
        >
          全部 ({employees.length})
        </button>
        {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => {
          const count = employees.filter((e) => e.role === role).length;
          return (
            <button
              key={role}
              className={`${styles.empFilterBtn} ${roleFilter === role ? styles.empFilterBtnActive : ''}`}
              onClick={() => setRoleFilter(role)}
            >
              {ROLE_CONFIG[role].displayName} ({count})
            </button>
          );
        })}
      </div>

      {employees.length === 0 ? (
        <div className={styles.emptyHint}>尚无核心员工，点击上方按钮招聘</div>
      ) : (() => {
        const filtered = employees.filter((emp) => roleFilter === 'all' || emp.role === roleFilter);
        return filtered.length === 0 ? (
          <div className={styles.emptyHint}>该分类暂无员工</div>
        ) : (
          <div className={styles.empList}>
            {filtered.map((emp) => (
              <EmployeeCard key={emp.id} emp={emp} />
            ))}
          </div>
        );
      })()}
    </section>
  );
}

/** 单个员工卡片 */
function EmployeeCard({ emp }: { emp: Employee }) {
  const game = useGame();
  const [showSkills, setShowSkills] = useState(false);

  const roleCfg = ROLE_CONFIG[emp.role];
  const expNeeded = experienceForLevel(emp.level);

  return (
    <div className={styles.empCard}>
      <div className={styles.empHeader}>
        <span className={styles.empName}>{emp.name}</span>
        <span className={styles.empRole}>{roleCfg.displayName}</span>
        <span className={styles.empLevel}>Lv.{emp.level}</span>
        <span className={styles.empStatus} data-status={emp.status}>
          {emp.status === 'assigned' ? `项目:${emp.assignedProjectId}` : '空闲'}
        </span>
      </div>

      <div className={styles.empAttrs}>
        <span>智{emp.attributes.intelligence}</span>
        <span>创{emp.attributes.creativity}</span>
        <span>领{emp.attributes.leadership}</span>
        <span>体{emp.attributes.stamina}</span>
        <span>魅{emp.attributes.charisma}</span>
      </div>

      <div className={styles.empBars}>
        <Bar label="忠诚" value={emp.loyalty} color="#7af0c0" />
        <Bar label="疲劳" value={emp.fatigue} color="#ffb454" />
        <Bar label="经验" value={(emp.experience / expNeeded) * 100} color="#56dce6" />
      </div>

      <div className={styles.empInfo}>
        <span>年薪 {formatCurrency(emp.salary)}</span>
        <span>技能点 {emp.skillPoints}</span>
        <span>入职第 {emp.hireDay} 天</span>
      </div>

      <div className={styles.empActions}>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => game.executeCommand(new AdjustSalaryCommand(emp.id, Math.round(emp.salary * 1.1)))}
        >
          加薪 10%
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
          onClick={() => game.executeCommand(new AdjustSalaryCommand(emp.id, Math.round(emp.salary * 0.9)))}
        >
          减薪 10%
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => setShowSkills((v) => !v)}
        >
          {showSkills ? '收起技能' : '查看技能'}
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
          onClick={() => game.executeCommand(new FireEmployeeCommand(emp.id))}
        >
          解雇
        </button>
      </div>

      {showSkills && (
        <div className={styles.empSkills}>
          {emp.skills.map((skill) => (
            <div key={skill.id} className={styles.skillRow} data-unlocked={skill.unlocked}>
              <div className={styles.skillInfo}>
                <span className={styles.skillName}>{skill.name}</span>
                <span className={styles.skillDesc}>{skill.description}</span>
              </div>
              {skill.unlocked ? (
                <span className={styles.skillBadge}>已学</span>
              ) : (
                <button
                  className={`${styles.btn} ${styles.btnSm}`}
                  onClick={() => game.executeCommand(new LearnSkillCommand(emp.id, skill.id))}
                  disabled={emp.skillPoints < skill.cost}
                >
                  学习（{skill.cost} 点）
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 进度条 */
function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={styles.bar}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
