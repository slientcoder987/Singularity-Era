import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { StaffRole, type Employee } from '../../core/entities/Employee';
import {
  ROLE_CONFIG,
  CORE_EMPLOYEE_CAP_PER_ROLE,
  ROLE_TO_STAFF_RESOURCE,
  experienceForLevel,
  NORMAL_HIRE_COST,
  RECRUITMENT_CHANNELS,
  BONUS_SALARY_RATIO,
  BONUS_COOLDOWN_DAYS,
  BONUS_LOYALTY_GAIN,
  EQUITY_LOYALTY_GAIN,
  TEAM_BUILDING_COST_PER_HEAD,
  TEAM_BUILDING_COOLDOWN_DAYS,
  TEAM_BUILDING_LOYALTY_GAIN,
  TEAM_BUILDING_FATIGUE_REDUCE,
  PROMOTE_SKILL_POINT_GAIN,
} from '../../core/config/employees';
import { STAFF_TRAINING_CONFIG } from '../../core/entities/StaffTrainingProject';
import { DEPT_HEAD_MIN_LEVEL } from '../../core/entities/Department';
import type { Department } from '../../core/entities/Department';
import type { StaffTrainingProject, StaffTrainingType } from '../../core/entities/StaffTrainingProject';
import type { StaffAttributes } from '../../core/entities/Employee';
import type { Candidate } from '../../core/GameState';
import { RequestRecruitmentCommand, HireCandidateCommand, RejectCandidateCommand } from '../../core/commands/HireEmployeeCommand';
import { HireNormalEmployeeCommand } from '../../core/commands/HireNormalEmployeeCommand';
import { FireEmployeeCommand } from '../../core/commands/FireEmployeeCommand';
import { AdjustSalaryCommand } from '../../core/commands/AdjustSalaryCommand';
import { LearnSkillCommand } from '../../core/commands/LearnSkillCommand';
import { GiveBonusCommand, GrantEquityCommand, TeamBuildingCommand } from '../../core/commands/IncentiveCommands';
import { PromoteEmployeeCommand } from '../../core/commands/PromoteEmployeeCommand';
import { StartStaffTrainingCommand, CancelStaffTrainingCommand } from '../../core/commands/StaffTrainingCommands';
import { AppointDepartmentHeadCommand, TransferDepartmentCommand, AllocateNormalStaffCommand } from '../../core/commands/DepartmentCommands';
import { formatCurrency } from '../../core/utils';
import styles from '../styles/App.module.css';

type StaffTab = 'employees' | 'recruitment' | 'training' | 'departments';

const STAFF_TABS: { key: StaffTab; label: string }[] = [
  { key: 'employees', label: '员工列表' },
  { key: 'recruitment', label: '招聘' },
  { key: 'training', label: '培训' },
  { key: 'departments', label: '部门' },
];

/**
 * EmployeePanel - 员工系统主面板（4 子标签页）
 *
 * 子标签：员工列表 | 招聘 | 培训 | 部门
 */
export function EmployeePanel() {
  const game = useGame();
  const [tab, setTab] = useState<StaffTab>('employees');

  // 全局状态读取
  const employees = useGameState((s) => s.employees);
  const resources = useGameState((s) => s.resources);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const departments = useGameState((s) => s.departments);
  const staffTrainings = useGameState((s) => s.staffTrainings);
  const pendingCandidates = useGameState((s) => s.pendingCandidates);
  const lastTeamBuildingDay = useGameState((s) => s.lastTeamBuildingDay);
  const date = useGameState((s) => s.date);

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>员工系统</h3>

      {/* 子标签 */}
      <div className={styles.empFilter}>
        {STAFF_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.empFilterBtn} ${tab === t.key ? styles.empFilterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabBody}>
        {tab === 'employees' && (
          <EmployeesTab
            game={game}
            employees={employees}
            departments={departments}
            resources={resources}
            funds={funds}
            date={date}
            lastTeamBuildingDay={lastTeamBuildingDay}
          />
        )}
        {tab === 'recruitment' && (
          <RecruitmentTab
            game={game}
            employees={employees}
            pendingCandidates={pendingCandidates}
            resources={resources}
            funds={funds}
          />
        )}
        {tab === 'training' && (
          <TrainingTab
            game={game}
            employees={employees}
            staffTrainings={staffTrainings}
            funds={funds}
          />
        )}
        {tab === 'departments' && (
          <DepartmentsTab
            game={game}
            employees={employees}
            departments={departments}
          />
        )}
      </div>
    </section>
  );
}

/* ============================================================
   标签一：员工列表
   ============================================================ */

interface EmployeesTabProps {
  game: ReturnType<typeof useGame>;
  employees: Employee[];
  departments: Department[];
  resources: Record<string, number>;
  funds: number;
  date: number;
  lastTeamBuildingDay: number;
}

function EmployeesTab({ game, employees, departments, resources, funds, date, lastTeamBuildingDay }: EmployeesTabProps) {
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');

  // 统计
  const coreDailySalary = employees.reduce((sum, e) => sum + e.salary / 365, 0);
  // 普通员工资源
  const normalRoles = Object.values(ROLE_TO_STAFF_RESOURCE);
  const normalTotal = normalRoles.reduce((sum, id) => sum + (resources[id] ?? 0), 0);
  const normalDailySalary = normalTotal * (50000 / 365);

  return (
    <div>
      {/* 统计行 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>统计</span>
        <span className={styles.devHint}>
          核心 {employees.length} 人 · 普通 {normalTotal} 人 · 合计 {employees.length + normalTotal} 人
          {' · 日薪 '}{formatCurrency(coreDailySalary + normalDailySalary)}
        </span>
      </div>

      {/* 团建按钮 */}
      <div className={styles.devRow}>
        <button
          className={styles.btn}
          onClick={() => game.executeCommand(new TeamBuildingCommand())}
          disabled={
            date - lastTeamBuildingDay < TEAM_BUILDING_COOLDOWN_DAYS ||
            funds < employees.length * TEAM_BUILDING_COST_PER_HEAD ||
            employees.length === 0
          }
          title={
            date - lastTeamBuildingDay < TEAM_BUILDING_COOLDOWN_DAYS
              ? `冷却中（剩余 ${TEAM_BUILDING_COOLDOWN_DAYS - (date - lastTeamBuildingDay)} 天）`
              : '团建提升全员忠诚度和疲劳度'
          }
        >
          团建活动
          <span className={styles.devHint}>
            {' '}({formatCurrency(employees.length * TEAM_BUILDING_COST_PER_HEAD)}, 全员 +{TEAM_BUILDING_LOYALTY_GAIN} 忠诚 -{TEAM_BUILDING_FATIGUE_REDUCE} 疲劳)
          </span>
        </button>
      </div>

      {/* 角色筛选 */}
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

      {/* 员工卡片列表 */}
      {employees.length === 0 ? (
        <div className={styles.emptyHint}>尚无核心员工</div>
      ) : (() => {
        const filtered = employees.filter((emp) => roleFilter === 'all' || emp.role === roleFilter);
        return filtered.length === 0 ? (
          <div className={styles.emptyHint}>该分类暂无员工</div>
        ) : (
          <div className={styles.empList}>
            {filtered.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                game={game}
                departments={departments}
                date={date}
                funds={funds}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

/* ============================================================
   员工卡片（增强版：含绩效、部门、股权、奖金等）
   ============================================================ */

interface EmployeeCardProps {
  emp: Employee;
  game: ReturnType<typeof useGame>;
  departments: Department[];
  date: number;
  funds: number;
}

function EmployeeCard({ emp, game, departments, date, funds }: EmployeeCardProps) {
  const [showSkills, setShowSkills] = useState(false);
  const roleCfg = ROLE_CONFIG[emp.role];
  const expNeeded = experienceForLevel(emp.level);
  const dept = departments.find((d) => d.id === emp.departmentId);
  const isDeptHead = dept ? dept.headId === emp.id : false;

  // 奖金冷却
  const bonusCooldown = emp.lastBonusDay != null ? BONUS_COOLDOWN_DAYS - (date - emp.lastBonusDay) : 0;
  const canBonus = bonusCooldown <= 0;

  // 晋升条件
  const canPromote = emp.level < 10 && (emp.lastPerformance?.grade === 'A' || emp.lastPerformance?.grade === 'S');

  const attrKeys: (keyof StaffAttributes)[] = ['intelligence', 'creativity', 'leadership', 'stamina', 'charisma'];
  const attrLabels: Record<keyof StaffAttributes, string> = {
    intelligence: '智',
    creativity: '创',
    leadership: '领',
    stamina: '体',
    charisma: '魅',
  };

  return (
    <div className={styles.empCard}>
      {/* 头部：姓名 + 角色 + 等级 + 部门 + 绩效 */}
      <div className={styles.empHeader}>
        <span className={styles.empName}>{emp.name}</span>
        <span className={styles.empRole}>{roleCfg.displayName}</span>
        <span className={styles.empLevel}>Lv.{emp.level}</span>
        {dept && <span className={styles.devHint}>{dept.name}{isDeptHead ? '·负责人' : ''}</span>}
        <span className={styles.empStatus} data-status={emp.status}>
          {emp.status === 'assigned' ? `项目:${emp.assignedProjectId?.slice(0, 8)}` : emp.status === 'training' ? '培训中' : '空闲'}
        </span>
        {emp.lastPerformance && (
          <span className={`${styles.perfGrade} ${styles[`perf${emp.lastPerformance.grade}`]}`} title={`得分: ${emp.lastPerformance.score}`}>
            {emp.lastPerformance.grade}
          </span>
        )}
        {emp.hasEquity && <span className={styles.equityBadge} title="已授股权">股权</span>}
      </div>

      {/* 属性条 */}
      <div className={styles.empAttrs}>
        {attrKeys.map((k) => (
          <span key={k}>{attrLabels[k]}{emp.attributes[k]}</span>
        ))}
      </div>

      {/* 进度条：忠诚 / 疲劳 / 经验 */}
      <div className={styles.empBars}>
        <Bar label="忠诚" value={emp.loyalty} color="#7af0c0" />
        <Bar label="疲劳" value={emp.fatigue} color="#ffb454" />
        <Bar label="经验" value={(emp.experience / expNeeded) * 100} color="#56dce6" />
      </div>

      {/* 信息行 */}
      <div className={styles.empInfo}>
        <span>年薪 {formatCurrency(emp.salary)}</span>
        <span>技能点 {emp.skillPoints}</span>
        <span>入职第 {date - emp.hireDay} 天</span>
      </div>

      {/* 操作按钮区：激励 + 晋升 + 调薪 + 解雇 */}
      <div className={styles.empActions}>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => game.executeCommand(new GiveBonusCommand(emp.id))}
          disabled={!canBonus || funds < emp.salary * BONUS_SALARY_RATIO}
          title={canBonus ? `发放 ${formatCurrency(emp.salary * BONUS_SALARY_RATIO)} 奖金，忠诚度 +${BONUS_LOYALTY_GAIN}` : `冷却剩余 ${Math.ceil(bonusCooldown)} 天`}
        >
          奖金
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => game.executeCommand(new GrantEquityCommand(emp.id))}
          disabled={emp.hasEquity}
          title={emp.hasEquity ? '已持有股权' : `授予股权，忠诚度 +${EQUITY_LOYALTY_GAIN}，2年内不可离职`}
        >
          股权
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => game.executeCommand(new PromoteEmployeeCommand(emp.id))}
          disabled={!canPromote}
          title={canPromote ? `晋升到 Lv.${emp.level + 1}，技能点 +${PROMOTE_SKILL_POINT_GAIN}` : '绩效不满足晋升条件'}
        >
          晋升
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => game.executeCommand(new AdjustSalaryCommand(emp.id, Math.round(emp.salary * 1.1)))}
        >
          加薪10%
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
          onClick={() => game.executeCommand(new AdjustSalaryCommand(emp.id, Math.round(emp.salary * 0.9)))}
        >
          减薪10%
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => setShowSkills((v) => !v)}
        >
          {showSkills ? '收起技能' : '技能'}
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
          onClick={() => game.executeCommand(new FireEmployeeCommand(emp.id))}
        >
          解雇
        </button>
      </div>

      {/* 技能列表 */}
      {showSkills && (
        <div className={styles.empSkills}>
          {emp.skills.length === 0 && <div className={styles.emptyHint}>无可用技能槽</div>}
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

      {/* 绩效详情（若有） */}
      {emp.lastPerformance && (
        <div className={styles.empInfo}>
          <span>
            绩效: <PerfGrade grade={emp.lastPerformance.grade} />
            {' '}（{emp.lastPerformance.score} 分，出勤 {(emp.lastPerformance.attendance * 100).toFixed(0)}%）
          </span>
        </div>
      )}
    </div>
  );
}

/** 绩效等级颜色标签 */
function PerfGrade({ grade }: { grade: string }) {
  const colors: Record<string, string> = { S: '#ffb454', A: '#7af0c0', B: '#56dce6', C: '#ff6b6b' };
  return <span style={{ color: colors[grade] ?? '#8aa0c2', fontWeight: 700 }}>{grade}</span>;
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

/* ============================================================
   标签二：招聘
   ============================================================ */

interface RecruitmentTabProps {
  game: ReturnType<typeof useGame>;
  employees: Employee[];
  pendingCandidates: Candidate[];
  resources: Record<string, number>;
  funds: number;
}

function RecruitmentTab({ game, employees, pendingCandidates, resources, funds }: RecruitmentTabProps) {
  const [role, setRole] = useState<StaffRole>(StaffRole.RESEARCHER);

  const activeCandidates = pendingCandidates.filter((c) => c.status === 'pending');
  const roleCandidates = activeCandidates.filter((c) => c.role === role);

  return (
    <div>
      {/* 选择角色 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>目标角色</span>
        {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((r) => {
          const roleCoreCount = employees.filter((e) => e.role === r).length;
          const isFull = roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE;
          return (
            <button
              key={r}
              className={`${styles.btn} ${role === r ? styles.btnActive : ''}`}
              onClick={() => setRole(r)}
              disabled={isFull}
            >
              {ROLE_CONFIG[r].displayName}
              <span className={styles.devHint}> ({roleCoreCount}/{CORE_EMPLOYEE_CAP_PER_ROLE})</span>
            </button>
          );
        })}
      </div>

      {/* 招聘渠道 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>招聘渠道</span>
        {(Object.values(RECRUITMENT_CHANNELS)).map((ch) => {
          if (ch.id === 'internal_promote') return null;
          const isFull = employees.filter((e) => e.role === role).length >= CORE_EMPLOYEE_CAP_PER_ROLE;
          return (
            <button
              key={ch.id}
              className={styles.btn}
              onClick={() => game.executeCommand(new RequestRecruitmentCommand(role, ch.id))}
              disabled={funds < ch.cost || isFull}
              title={ch.name}
            >
              {ch.name}
              <span className={styles.devHint}>
                {' '}({formatCurrency(ch.cost)}, {ch.deliveryDays}天, Lv.{ch.levelRange[0]}-{ch.levelRange[1]})
              </span>
            </button>
          );
        })}
      </div>

      {/* 普通员工招聘 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>普通员工</span>
        {(Object.values(StaffRole)).map((r) => {
          const staffId = ROLE_TO_STAFF_RESOURCE[r];
          const count = resources[staffId] ?? 0;
          return (
            <button
              key={`normal-${r}`}
              className={styles.btn}
              onClick={() => game.executeCommand(new HireNormalEmployeeCommand(r))}
              disabled={funds < NORMAL_HIRE_COST}
            >
              招 {ROLE_CONFIG[r].displayName}
              <span className={styles.devHint}> ({count})</span>
            </button>
          );
        })}
      </div>

      {/* 候选人列表 */}
      <div className={styles.empFilter}>
        {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((r) => {
          const count = activeCandidates.filter((c) => c.role === r).length;
          return (
            <button
              key={r}
              className={`${styles.empFilterBtn} ${role === r ? styles.empFilterBtnActive : ''}`}
              onClick={() => setRole(r)}
            >
              {ROLE_CONFIG[r].displayName} ({count})
            </button>
          );
        })}
      </div>

      {activeCandidates.length === 0 ? (
        <div className={styles.emptyHint}>暂无待选候选人，选择上方的渠道发起招聘</div>
      ) : roleCandidates.length === 0 ? (
        <div className={styles.emptyHint}>该角色暂无候选人</div>
      ) : (
        <div className={styles.empList}>
          {roleCandidates.map((cand) => (
            <CandidateCard
              key={cand.id}
              candidate={cand}
              game={game}
              employees={employees}
              role={role}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 候选人卡片 */
function CandidateCard({ candidate, game, employees, role }: {
  candidate: Candidate;
  game: ReturnType<typeof useGame>;
  employees: Employee[];
  role: StaffRole;
}) {
  const roleCoreCount = employees.filter((e) => e.role === role).length;
  const isFull = roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE;
  const channelCfg = RECRUITMENT_CHANNELS[candidate.channel];
  const attrKeys: (keyof StaffAttributes)[] = ['intelligence', 'creativity', 'leadership', 'stamina', 'charisma'];
  const attrLabels: Record<keyof StaffAttributes, string> = {
    intelligence: '智', creativity: '创', leadership: '领', stamina: '体', charisma: '魅',
  };

  return (
    <div className={styles.empCard}>
      <div className={styles.empHeader}>
        <span className={styles.empName}>{candidate.name}</span>
        <span className={styles.empRole}>{ROLE_CONFIG[candidate.role].displayName}</span>
        <span className={styles.empLevel}>Lv.{candidate.level}</span>
        <span className={styles.devHint}>{channelCfg?.name ?? candidate.channel}</span>
      </div>

      <div className={styles.empAttrs}>
        {attrKeys.map((k) => (
          <span key={k}>{attrLabels[k]}{candidate.attributes[k]}</span>
        ))}
      </div>

      <div className={styles.empInfo}>
        <span>期望薪资 {formatCurrency(candidate.expectedSalary)}</span>
        <span>第 {candidate.generatedDay} 天生成</span>
      </div>

      <div className={styles.empActions}>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => game.executeCommand(new HireCandidateCommand(candidate.id))}
          disabled={isFull}
        >
          {isFull ? '已满员' : '录用'}
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
          onClick={() => game.executeCommand(new RejectCandidateCommand(candidate.id))}
        >
          拒绝
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   标签三：培训
   ============================================================ */

interface TrainingTabProps {
  game: ReturnType<typeof useGame>;
  employees: Employee[];
  staffTrainings: StaffTrainingProject[];
  funds: number;
}

function TrainingTab({ game, employees, staffTrainings, funds }: TrainingTabProps) {
  const [trainRole, setTrainRole] = useState<StaffRole | 'all'>('all');
  const [trainType, setTrainType] = useState<StaffTrainingType>('skill');
  const [targetAttr, setTargetAttr] = useState<keyof StaffAttributes>('intelligence');

  // 可用员工：空闲且非培训中的员工
  const availableEmps = employees.filter(
    (e) => e.status !== 'training' && e.status !== 'assigned' && (trainRole === 'all' || e.role === trainRole),
  );

  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const onStartTraining = () => {
    if (!selectedEmpId) return;
    const cfg = STAFF_TRAINING_CONFIG[trainType];
    game.executeCommand(new StartStaffTrainingCommand(selectedEmpId, trainType, cfg.allAttributes ? null : targetAttr));
    setSelectedEmpId(null);
  };

  const activeTrainings = staffTrainings.filter((t) => t.status === 'in_progress');

  return (
    <div>
      {/* 发起培训 */}
      <h4 className={styles.devRowLabel}>发起培训</h4>

      {/* 培训类型选择 */}
      <div className={styles.devRow}>
        {(Object.entries(STAFF_TRAINING_CONFIG) as [StaffTrainingType, typeof STAFF_TRAINING_CONFIG['skill']][]).map(([type, cfg]) => (
          <button
            key={type}
            className={`${styles.btn} ${trainType === type ? styles.btnActive : ''}`}
            onClick={() => setTrainType(type)}
          >
            {cfg.name}
            <span className={styles.devHint}>
              {' '}({formatCurrency(cfg.cost)}, {cfg.durationDays}天, 经验 +{cfg.expGain})
            </span>
          </button>
        ))}
      </div>

      {/* 目标属性（非 overseas） */}
      {!STAFF_TRAINING_CONFIG[trainType].allAttributes && (
        <div className={styles.devRow}>
          <span className={styles.devRowLabel}>目标属性</span>
          {(['intelligence', 'creativity', 'leadership', 'stamina', 'charisma'] as (keyof StaffAttributes)[]).map((k) => (
            <button
              key={k}
              className={`${styles.btn} ${styles.btnSm} ${targetAttr === k ? styles.btnActive : ''}`}
              onClick={() => setTargetAttr(k)}
            >
              {({ intelligence: '智力', creativity: '创造力', leadership: '领导力', stamina: '体力', charisma: '魅力' })[k]} +{STAFF_TRAINING_CONFIG[trainType].attributeGain}
            </button>
          ))}
        </div>
      )}

      {/* 选择员工 */}
      <div className={styles.empFilter}>
        <button
          className={`${styles.empFilterBtn} ${trainRole === 'all' ? styles.empFilterBtnActive : ''}`}
          onClick={() => { setTrainRole('all'); setSelectedEmpId(null); }}
        >
          全部
        </button>
        {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((r) => (
          <button
            key={r}
            className={`${styles.empFilterBtn} ${trainRole === r ? styles.empFilterBtnActive : ''}`}
            onClick={() => { setTrainRole(r); setSelectedEmpId(null); }}
          >
            {ROLE_CONFIG[r].displayName}
          </button>
        ))}
      </div>

      {availableEmps.length === 0 ? (
        <div className={styles.emptyHint}>无空闲员工可培训</div>
      ) : (
        <div className={styles.devRow}>
          <select
            className={styles.select}
            value={selectedEmpId ?? ''}
            onChange={(e) => setSelectedEmpId(e.target.value || null)}
          >
            <option value="">-- 选择员工 --</option>
            {availableEmps.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} (Lv.{e.level} {ROLE_CONFIG[e.role].displayName})
              </option>
            ))}
          </select>
          <button
            className={styles.btn}
            onClick={onStartTraining}
            disabled={!selectedEmpId || funds < STAFF_TRAINING_CONFIG[trainType].cost}
          >
            开始培训 ({formatCurrency(STAFF_TRAINING_CONFIG[trainType].cost)})
          </button>
        </div>
      )}

      {/* 进行中的培训 */}
      <h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>
        进行中的培训 ({activeTrainings.length})
      </h4>

      {activeTrainings.length === 0 ? (
        <div className={styles.emptyHint}>无进行中的培训</div>
      ) : (
        <div className={styles.empList}>
          {activeTrainings.map((t) => {
            const emp = employees.find((e) => e.id === t.employeeId);
            const cfg = STAFF_TRAINING_CONFIG[t.type];
            const progress = (t.elapsedDays / t.totalDays) * 100;
            return (
              <div key={t.id} className={styles.empCard}>
                <div className={styles.empHeader}>
                  <span className={styles.empName}>{emp?.name ?? t.employeeId}</span>
                  <span className={styles.empRole}>{cfg.name}</span>
                  <span className={styles.devHint}>
                    第 {t.elapsedDays}/{t.totalDays} 天
                  </span>
                </div>
                <div className={styles.empBars}>
                  <Bar label="进度" value={progress} color="#7af0c0" />
                </div>
                <div className={styles.empInfo}>
                  <span>经验 +{cfg.expGain}</span>
                  {cfg.skillPointGain > 0 && <span>技能点 +{cfg.skillPointGain}</span>}
                  <span>
                    属性{' '}
                    {cfg.allAttributes
                      ? '全 +' + cfg.attributeGain
                      : t.targetAttribute + ' +' + cfg.attributeGain}
                  </span>
                </div>
                <div className={styles.empActions}>
                  <button
                    className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
                    onClick={() => game.executeCommand(new CancelStaffTrainingCommand(t.id))}
                  >
                    取消（不退款）
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   标签四：部门
   ============================================================ */

interface DepartmentsTabProps {
  game: ReturnType<typeof useGame>;
  employees: Employee[];
  departments: Department[];
}

function DepartmentsTab({ game, employees, departments }: DepartmentsTabProps) {
  return (
    <div>
      <div className={styles.devRow}>
        <span className={styles.devHint}>
          5 个固定部门，每部门 1 名负责人（L{ DEPT_HEAD_MIN_LEVEL }+），负责人领导力影响部门效率
        </span>
      </div>

      <div className={styles.empList}>
        {departments.map((dept) => {
          const head = dept.headId ? (employees.find((e) => e.id === dept.headId) ?? null) : null;
          const members = dept.memberIds.map((id) => employees.find((e) => e.id === id)).filter(Boolean) as Employee[];
          const idleMembers = members.filter((e) => !head || e.id !== head.id);

          // 可选负责人：该部门对应角色 L7+ 的员工
          const eligibleHeads = employees.filter(
            (e) => e.role === dept.role && e.level >= DEPT_HEAD_MIN_LEVEL && e.status !== 'training',
          );

          return (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              head={head}
              members={idleMembers}
              eligibleHeads={eligibleHeads}
              allEmployees={employees}
              game={game}
            />
          );
        })}
      </div>
    </div>
  );
}

function DepartmentCard({
  dept, head, members, eligibleHeads, allEmployees, game,
}: {
  dept: Department;
  head: Employee | null;
  members: Employee[];
  eligibleHeads: Employee[];
  allEmployees: Employee[];
  game: ReturnType<typeof useGame>;
}) {
  const [showManage, setShowManage] = useState(false);

  // 可指派成员：该部门对应角色且未加入该部门的员工
  const assignableMembers = allEmployees.filter(
    (e) => e.role === dept.role && !dept.memberIds.includes(e.id),
  );

  return (
    <div className={styles.deptCard}>
      <div className={styles.empHeader}>
        <span className={styles.empName}>{dept.name}</span>
        <span className={styles.empRole}>{ROLE_CONFIG[dept.role].displayName}部</span>
        {head ? (
          <span style={{ color: '#7af0c0', fontSize: 12 }}>
            负责人: {head.name} Lv.{head.level} 领导力 {head.attributes.leadership}
          </span>
        ) : (
          <span style={{ color: '#ff6b6b', fontSize: 12 }}>无负责人</span>
        )}
        <span className={styles.devHint}>
          核心 {dept.memberIds.length} 人 · 普通 {dept.normalHeadcount} 人
        </span>
      </div>

      <div className={styles.empInfo}>
        <span>
          效率加成: +{(((head?.attributes.leadership ?? 0) / 100) * 0.3 * 100).toFixed(1)}%
        </span>
      </div>

      {/* 成员列表 */}
      {members.length > 0 && (
        <div className={styles.empInfo}>
          <span>成员: {members.map((m) => `${m.name}(Lv.${m.level})`).join(', ')}</span>
        </div>
      )}

      {!showManage && (
        <div className={styles.empActions}>
          <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => setShowManage(true)}>
            管理
          </button>
        </div>
      )}

      {showManage && (
        <div style={{ marginTop: 8 }}>
          {/* 任命负责人 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>负责人</span>
            <select
              className={styles.select}
              value={head?.id ?? ''}
              onChange={(e) => {
                if (e.target.value) {
                  game.executeCommand(new AppointDepartmentHeadCommand(dept.id, e.target.value));
                }
              }}
            >
              <option value="">-- 选择 --</option>
              {eligibleHeads.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} Lv.{e.level} 领{e.attributes.leadership}
                </option>
              ))}
            </select>
          </div>

          {/* 添加/移除成员 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>成员</span>
            {assignableMembers.length > 0 && (
              <select
                className={styles.select}
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    game.executeCommand(new TransferDepartmentCommand(e.target.value, dept.id));
                  }
                }}
              >
                <option value="">-- 加入成员 --</option>
                {assignableMembers.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} Lv.{e.level}
                  </option>
                ))}
              </select>
            )}
            {members.length > 0 && members.map((m) => (
              <button
                key={m.id}
                className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
                onClick={() => game.executeCommand(new TransferDepartmentCommand(m.id, null))}
              >
                {m.name} 移出
              </button>
            ))}
          </div>

          {/* 普通员工分配 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>普通员工</span>
            <span className={styles.devHint}>当前 {dept.normalHeadcount} 人</span>
            <button
              className={`${styles.btn} ${styles.btnSm}`}
              onClick={() => game.executeCommand(new AllocateNormalStaffCommand(dept.type, 1))}
            >
              +1
            </button>
            <button
              className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
              disabled={dept.normalHeadcount <= 0}
              onClick={() => game.executeCommand(new AllocateNormalStaffCommand(dept.type, -1))}
            >
              -1
            </button>
          </div>

          <div className={styles.empActions}>
            <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => setShowManage(false)}>
              收起
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
