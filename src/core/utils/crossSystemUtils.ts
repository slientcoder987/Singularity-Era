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
 * 改进 C：分配状态产生实际差异
 * - 已分配到该项目的核心研究员：× efficiency × 1.5%（定向贡献）
 * - 未分配的核心研究员：× efficiency × 0.3%（被动"公司氛围"贡献）
 *
 * 技能加成：reduce_training_compute 技能额外 +50% 加成权重
 *
 * 递减回报：log(1 + n) / log(11) 使得 10 个满效率研究员 = 1.3x
 */
export function getStaffTrainingSpeedMultiplier(data: GameData, projectId?: string): number {
  const researchers = getActiveStaffByRole(data, StaffRole.RESEARCHER);
  if (researchers.length === 0) return 1.0;

  let totalBonus = 0;
  for (const r of researchers) {
    const eff = calcEmployeeEfficiency(r, data.departments, data.employees);
    const hasOptimizer = r.skills.some((s) => s.unlocked && s.effect.type === 'reduce_training_compute');
    // 改进 C：定向贡献 1.5% vs 被动贡献 0.3%
    const directWeight = r.assignedProjectId === projectId && projectId !== undefined ? 0.015 : 0.003;
    const weight = directWeight * (hasOptimizer ? 1.5 : 1.0);
    totalBonus += eff * weight;
  }
  // 递减回报：log(1 + n) / log(11) 使得 10 个满效率研究员 = 1.3x, 而非 1 + 0.15 = 1.15x
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

/**
 * 数据工程师对数据收集项目的效率加成
 *
 * - 定向加成：已分配到该项目的工程师 × efficiency × 5%
 * - 被动加成：未分配但作为部门成员 × efficiency × 1%
 * - 数据质量加成：数据工程师的 creativity 维度影响收集质量
 *
 * 返回 { speedMultiplier, qualityBonus }
 * - speedMultiplier: 1.0~2.0
 * - qualityBonus: 0~0.15 (与 route.baseQuality 相加)
 */
export function getDataEngineerBonus(
  data: GameData,
  _projectId: string,
  assignedIds: string[],
): { speedMultiplier: number; qualityBonus: number } {
  const allDataEngineers = getActiveStaffByRole(data, StaffRole.DATA_ENGINEER);
  if (allDataEngineers.length === 0) return { speedMultiplier: 1.0, qualityBonus: 0 };

  let directBonus = 0;
  let passiveBonus = 0;
  let qualityBonus = 0;
  const assignedSet = new Set(assignedIds);

  for (const eng of allDataEngineers) {
    const eff = calcEmployeeEfficiency(eng, data.departments, data.employees);
    if (assignedSet.has(eng.id)) {
      // 定向：大幅加成采集速度
      directBonus += eff * 0.05;
    } else {
      // 被动：仅作为部门成员小幅加成（"团队氛围"）
      passiveBonus += eff * 0.01;
    }
    // 数据工程师的 creativity 影响质量（数据清洗/标注能力）
    qualityBonus += (eng.attributes.creativity / 100) * 0.005;
  }
  return {
    speedMultiplier: 1.0 + directBonus + passiveBonus,
    qualityBonus: Math.min(0.15, qualityBonus),
  };
}

/**
 * 收集所有员工解锁技能对某系统的加成
 *
 * 用法：
 *   const bonus = getCompanySkillBonus(data, 'reduce_training_compute');
 *   trainingCost *= 1 - bonus;
 *
 * 性能：O(n)，n=员工数，每日调用一次可接受
 */
export function getCompanySkillBonus(data: GameData, effectType: string): number {
  let total = 0;
  for (const emp of data.employees) {
    if (emp.status === 'training') continue;
    for (const skill of emp.skills) {
      if (skill.unlocked && skill.effect.type === effectType) {
        total += skill.effect.value;
      }
    }
  }
  return total;
}

/**
 * 收集所有员工解锁技能的最大值（用于"团队协调"等"取最大"型技能）
 */
export function getCompanySkillMax(data: GameData, effectType: string): number {
  let max = 0;
  for (const emp of data.employees) {
    if (emp.status === 'training') continue;
    for (const skill of emp.skills) {
      if (skill.unlocked && skill.effect.type === effectType) {
        if (skill.effect.value > max) max = skill.effect.value;
      }
    }
  }
  return max;
}

/**
 * 计算公司范围的电力消耗降低（系统工程师的 infra_efficiency 技能）
 */
export function getCompanyPowerReduction(data: GameData): number {
  return Math.min(0.5, getCompanySkillBonus(data, 'reduce_power_consumption'));
}

/**
 * 计算公司范围的卡故障率降低（系统工程师的 reduce_card_wear 技能）
 */
export function getCompanyCardWearReduction(data: GameData): number {
  return Math.min(0.5, getCompanySkillBonus(data, 'reduce_card_wear'));
}

/**
 * 计算公司范围的收入加成（产品经理的 market_insight 技能）
 */
export function getCompanyRevenueBoost(data: GameData): number {
  return getCompanySkillBonus(data, 'revenue_boost');
}

/**
 * 计算公司范围的合规度加成（法务的 compliance_boost 技能）
 */
export function getCompanyComplianceBoost(data: GameData): number {
  return getCompanySkillMax(data, 'compliance');
}

/**
 * 计算公司范围的危机削减（法务的 crisis_management 技能）
 */
export function getCompanyCrisisReduction(data: GameData): number {
  return Math.min(0.7, getCompanySkillMax(data, 'crisis_reduction'));
}

/**
 * 计算训练算力减少（研究员的 reduce_training_compute 技能）
 */
export function getCompanyTrainingComputeReduction(data: GameData): number {
  return Math.min(0.5, getCompanySkillBonus(data, 'reduce_training_compute'));
}

/**
 * 计算采集速度加成（数据工程师的 pipeline_optimization 技能）
 */
export function getCompanyCollectionSpeed(data: GameData): number {
  return getCompanySkillBonus(data, 'data_speed');
}

/**
 * 计算数据质量加成（数据工程师的 data_quality_boost 技能，叠加）
 */
export function getCompanyDataQuality(data: GameData): number {
  return getCompanySkillBonus(data, 'data_quality');
}

/**
 * 计算研发速度加成（研究员的 research_breakthrough 技能）
 */
export function getCompanyResearchSpeed(data: GameData): number {
  return getCompanySkillBonus(data, 'research_speed');
}

/**
 * 计算额外可同时训练模型数（研究员的 increase_model_cap 技能）
 */
export function getCompanyModelCap(data: GameData): number {
  return getCompanySkillBonus(data, 'increase_model_cap');
}

/**
 * 计算团队协调加成（产品经理的 team_coordination 技能）
 */
export function getCompanyTeamCoordination(data: GameData): number {
  return Math.min(0.3, getCompanySkillBonus(data, 'team_efficiency'));
}
