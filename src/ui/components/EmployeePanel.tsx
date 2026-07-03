import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { StaffRole, type Employee } from '../../core/entities/Employee';
import { ROLE_CONFIG, HIRE_COST, experienceForLevel } from '../../core/config/employees';
import { HireEmployeeCommand } from '../../core/commands/HireEmployeeCommand';
import { FireEmployeeCommand } from '../../core/commands/FireEmployeeCommand';
import { AdjustSalaryCommand } from '../../core/commands/AdjustSalaryCommand';
import { LearnSkillCommand } from '../../core/commands/LearnSkillCommand';
import { formatCurrency } from '../../core/utils';
import styles from '../styles/App.module.css';

/**
 * EmployeePanel
 *
 * 员工管理面板：
 * - 顶部：招聘按钮（按角色）+ 员工统计
 * - 列表：每个员工一张卡片，显示属性、技能、薪资、忠诚、疲劳
 * - 卡片内：解雇、加薪/减薪、学习技能操作
 */
export function EmployeePanel() {
  const game = useGame();
  const employees = useGameState((s) => s.employees);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>员工系统 · 人力管理</h3>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>招聘（一次性 ${HIRE_COST.toLocaleString()}）</span>
        {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => (
          <button
            key={role}
            className={styles.btn}
            onClick={() => game.executeCommand(new HireEmployeeCommand(role))}
            disabled={funds < HIRE_COST}
          >
            招 {ROLE_CONFIG[role].displayName}
          </button>
        ))}
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>统计</span>
        <span className={styles.devHint}>
          在职 {employees.length} 人 · 每日薪资支出{' '}
          {formatCurrency(employees.reduce((sum, e) => sum + e.salary / 365, 0))}
        </span>
      </div>

      {employees.length === 0 ? (
        <div className={styles.emptyHint}>尚无员工，点击上方按钮招聘</div>
      ) : (
        <div className={styles.empList}>
          {employees.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} />
          ))}
        </div>
      )}
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
