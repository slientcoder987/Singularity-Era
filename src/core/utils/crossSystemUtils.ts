/**
 * 跨系统联动工具
 *
 * 各系统通过此模块查询员工/部门对其他系统的加成效果。
 * 避免各系统重复写相同的 staff→system 查询逻辑。
 */
import type { GameData } from '../GameState';
import type { Employee } from '../entities/Employee';
import { StaffRole } from '../entities/Employee';
import type { Department, DepartmentType } from '../entities/Department';
import { calcEmployeeEfficiency, departmentBonus, companyCoordination } from './employeeUtils';

/** 获取某角色的所有空闲或在职核心员工（排除 training 中） */
function getActiveStaffByRole(data: GameData, role: StaffRole): Employee[] {
  return data.employees.filter(
    (e) => e.role === role && e.status !== 'training',
  );
}

/** 获取部门对象（含负责人和成员） */
function getDepartment(data: GameData, type: DepartmentType): { dept: Department | undefined; head: Employee | undefined; members: Employee[] } {
  const dept = data.departments.find((d) => d.type === type);
  if (!dept) return { dept: undefined, head: undefined, members: [] };
  const head = dept.headId ? data.employees.find((e) => e.id === dept.headId) : undefined;
  const members = dept.memberIds
    .map((id) => data.employees.find((e) => e.id === id))
    .filter((e): e is Employee => e !== undefined);
  return { dept, head, members };
}

/**
 * 研究员对训练项目的加速倍率
 *
 * 每位研究员（无论是否分配到此项目）贡献：
 *   efficiency × 0.5% → 总加速倍率
 *
 * 如果研究员有 learning_rate_optimizer 技能，额外 +1%
 */
export function getStaffTrainingSpeedMultiplier(data: GameData): number {
  const researchers = getActiveStaffByRole(data, StaffRole.RESEARCHER);
  if (researchers.length === 0) return 1.0;

  let totalBonus = 0;
  for (const r of researchers) {
    const eff = calcEmployeeEfficiency(r, data.departments, data.employees);
    const hasOptimizer = r.skills.some((s) => s.unlocked && s.effect.type === 'reduce_training_compute');
    totalBonus += eff * 0.005 * (hasOptimizer ? 1.5 : 1.0);
  }
  // 递减回报：log(1 + n) / log(11) 使得 10 个满效率研究员 = 1.3x, 而非 1 + 0.05 = 1.5x
  const diminishing = Math.log(1 + researchers.length) / Math.log(11);
  return 1.0 + totalBonus * diminishing;
}

/**
 * 研究员对训练稳定度的提升
 *
 * 每位高级研究员（L5+）降低训练崩溃概率：
 *   (intelligence / 100) × 0.3% × count
 */
export function getStaffTrainingStabilityBonus(data: GameData): number {
  const researchers = getActiveStaffByRole(data, StaffRole.RESEARCHER)
    .filter((r) => r.level >= 5);
  if (researchers.length === 0) return 0;

  const avgIntelligence = researchers.reduce((s, r) => s + r.attributes.intelligence, 0) / researchers.length;
  return Math.min(0.5, (avgIntelligence / 100) * 0.003 * researchers.length);
}

/**
 * 研究员对研发实验的加速倍率
 *
 * 每位研究员 efficiency × creativity/100 → 加速
 */
export function getStaffResearchSpeedMultiplier(data: GameData): number {
  const researchers = getActiveStaffByRole(data, StaffRole.RESEARCHER);
  if (researchers.length === 0) return 1.0;

  let totalBonus = 0;
  for (const r of researchers) {
    const eff = calcEmployeeEfficiency(r, data.departments, data.employees);
    totalBonus += eff * (r.attributes.creativity / 100) * 0.03;
  }
  return 1.0 + Math.min(totalBonus, 1.0); // 最高 +100%
}

/**
 * 系统工程师对基础设施故障率的降低
 *
 * 每位系统工程师降低故障率:
 *   efficiency × 2% → 累计降低
 *
 * 部门加成额外加成
 */
export function getStaffInfraFailureReduction(data: GameData): number {
  const engineers = getActiveStaffByRole(data, StaffRole.SYSTEM_ENGINEER);
  if (engineers.length === 0) return 1.0;

  const { dept } = getDepartment(data, 'infrastructure');
  const deptBonus = dept ? departmentBonus(dept, data.employees) : 1.0;
  const coordination = companyCoordination(data.departments, data.employees);

  let totalReduction = 0;
  for (const eng of engineers) {
    const eff = calcEmployeeEfficiency(eng, data.departments, data.employees);
    totalReduction += eff * 0.02;
  }
  return Math.max(0.3, 1.0 - totalReduction * deptBonus * coordination); // 最低降至 30% 故障率
}

/**
 * 产品经理对运营收入的倍率
 *
 * 每位产品经理：efficiency × 3% 收入加成
 * 部门加成额外影响
 */
export function getStaffRevenueMultiplier(data: GameData): number {
  const pms = getActiveStaffByRole(data, StaffRole.PRODUCT_MANAGER);
  if (pms.length === 0) return 1.0;

  const { dept } = getDepartment(data, 'product');
  const deptBonus = dept ? departmentBonus(dept, data.employees) : 1.0;

  let totalBonus = 0;
  for (const pm of pms) {
    const eff = calcEmployeeEfficiency(pm, data.departments, data.employees);
    totalBonus += eff * 0.03;
  }
  return 1.0 + totalBonus * deptBonus;
}

/**
 * 法务/公关对法律风险的日降低量
 *
 * 每位法务：efficiency × 0.3 点/天 (legalDebt 和 trustDebt)
 */
export function getStaffLegalRiskReductionPerDay(data: GameData): number {
  const legalStaff = getActiveStaffByRole(data, StaffRole.LEGAL_PR);
  if (legalStaff.length === 0) return 0;

  const { dept } = getDepartment(data, 'legal_pr');
  const deptBonus = dept ? departmentBonus(dept, data.employees) : 1.0;

  let total = 0;
  for (const l of legalStaff) {
    const eff = calcEmployeeEfficiency(l, data.departments, data.employees);
    total += eff * 0.3;
  }
  return total * deptBonus;
}

/**
 * 运营收入/亏损对员工士气的反向影响（供 StaffSystem 消费）
 *
 * 每日收入/支出的变化影响 riskState.employeeMorale
 */
export function calcMoraleImpactFromOperations(dailyRevenue: number, previousRevenue: number): number {
  if (previousRevenue <= 0) return 0;
  const ratio = dailyRevenue / previousRevenue;
  if (ratio > 1.2) return 0.5;   // 收入大涨 → 士气提升
  if (ratio > 1.05) return 0.2;
  if (ratio < 0.8) return -0.5;  // 收入大跌 → 士气下降
  if (ratio < 0.95) return -0.2;
  return 0;
}

/**
 * 收集所有对某训练有贡献的研究员，为其累积 monthlyContribution
 */
export function accumulateResearcherContribution(
  data: GameData,
  researcherIds: string[],
  contributionPerDay: number,
): void {
  for (const rid of researcherIds) {
    const emp = data.employees.find((e) => e.id === rid);
    if (emp) {
      emp.monthlyContribution = (emp.monthlyContribution ?? 0) + contributionPerDay;
    }
  }
}
