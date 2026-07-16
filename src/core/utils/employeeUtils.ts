/**
 * 员工效率与薪资计算工具
 */
import type { Employee, StaffAttributes } from '../entities/Employee';
import type { Department } from '../entities/Department';
import type { Region } from '../config/regions';
import { ROLE_CONFIG, ROLE_PRIMARY_ATTR, levelMultiplier } from '../config/employees';
import { clamp } from '../utils';

/** 等级基础效率：L1=0.5, L5=1.18, L10=2.03 */
export function baseEfficiency(level: number): number {
  return 0.5 + (level - 1) * 0.17;
}

/** 属性因子：0.7 ~ 1.3 */
export function attributeFactor(emp: Employee): number {
  const primaryAttr = ROLE_PRIMARY_ATTR[emp.role];
  const value = emp.attributes[primaryAttr];
  return 0.7 + (value / 100) * 0.6;
}

/** 疲劳因子：0 疲劳=1.0，100 疲劳=0.5 */
export function fatigueFactor(fatigue: number): number {
  return 1.0 - (fatigue / 100) * 0.5;
}

/** 忠诚度因子：<50 衰减，>80 加成 */
export function loyaltyFactor(loyalty: number): number {
  if (loyalty < 50) return 0.8 + (loyalty / 50) * 0.2;
  return 1.0 + Math.max(0, (loyalty - 80) / 20) * 0.05;
}

/** 部门加成：负责人领导力 × 0.3%，最高 +30% */
export function departmentBonus(dept: Department | undefined, employees: Employee[]): number {
  if (!dept || !dept.headId) return 1.0;
  const head = employees.find((e) => e.id === dept.headId);
  if (!head) return 1.0;
  return 1.0 + (head.attributes.leadership / 100) * 0.3;
}

/** 全公司协同加成：所有部门负责人领导力平均 × 0.1%，最高 +10% */
export function companyCoordination(departments: Department[], employees: Employee[]): number {
  const heads = departments
    .map((d) => employees.find((e) => e.id === d.headId))
    .filter((e): e is Employee => e !== undefined);
  if (heads.length === 0) return 1.0;
  const avgLeadership = heads.reduce((s, e) => s + e.attributes.leadership, 0) / heads.length;
  return 1.0 + (avgLeadership / 100) * 0.1;
}

/** 计算核心员工综合效率 */
export function calcEmployeeEfficiency(
  emp: Employee,
  departments: Department[],
  employees: Employee[],
): number {
  const dept = departments.find((d) => d.id === emp.departmentId);
  return (
    baseEfficiency(emp.level) *
    attributeFactor(emp) *
    fatigueFactor(emp.fatigue) *
    loyaltyFactor(emp.loyalty) *
    departmentBonus(dept, employees) *
    companyCoordination(departments, employees)
  );
}

/** 普通员工效率：1.0 × 部门加成 × 协同加成 × 地区人才加成 */
export function calcNormalEfficiency(
  dept: Department | undefined,
  departments: Department[],
  employees: Employee[],
  region: Region | null,
): number {
  const talentBonus = region ? (region.talentIndex - 50) / 100 : 0;
  return (
    (1.0 + talentBonus) *
    departmentBonus(dept, employees) *
    companyCoordination(departments, employees)
  );
}

/**
 * 市场薪资：基础年薪 × 地区薪资倍率
 * regionSalaryMultiplier = 0.5 + (talentIndex / 100) × 0.5
 */
export function marketSalary(role: Employee['role'], region: Region | null): number {
  const base = ROLE_CONFIG[role].baseSalary;
  if (!region) return base;
  const multiplier = 0.5 + (region.talentIndex / 100) * 0.5;
  return Math.round(base * multiplier);
}

/** 薪资竞争力：employee.salary / marketSalary */
export function salaryCompetitiveness(emp: Employee, region: Region | null): number {
  const market = marketSalary(emp.role, region);
  if (market === 0) return 1;
  return emp.salary / market;
}

/**
 * 根据薪资竞争力计算每日忠诚度变化
 * - < 0.7: -0.5
 * - 0.7-1.0: -0.1
 * - 1.0-1.3: 0
 * - > 1.3: +0.2
 */
export function salaryLoyaltyDelta(competitiveness: number): number {
  if (competitiveness < 0.7) return -0.5;
  if (competitiveness < 1.0) return -0.1;
  if (competitiveness < 1.3) return 0;
  return 0.2;
}

/** 计算升级后的新薪资：baseSalary × levelMultiplier × regionSalaryMultiplier */
export function calcSalaryForLevel(
  role: Employee['role'],
  level: number,
  region: Region | null,
): number {
  const base = ROLE_CONFIG[role].baseSalary;
  const multiplier = levelMultiplier(level);
  const regionMult = region ? 0.5 + (region.talentIndex / 100) * 0.5 : 1;
  return Math.round(base * multiplier * regionMult);
}

/**
 * 按招聘渠道生成候选人属性
 *
 * 属性分布设计（修复满分员工易得 + 初始员工太弱两个问题）：
 * 1. 5 维属性值总和受「属性池」约束，与渠道 baseAttr 和等级挂钩，0 维直接溢出。
 *    - Lv1 总池 200~250（均值 50/维）
 *    - Lv3 总池 280~320（均值 60/维）
 *    - Lv5 总池 350~400（均值 75/维）
 *    - Lv7 总池 410~460（均值 85/维）
 * 2. 各维度按角色权重采样（带偏置的 Dirichlet）。
 * 3. 极高分（≥90）极稀有——单维度 ≥ 90 的概率 < 12%。
 * 4. 最低分不低于 25，避免出现废人。
 * 5. 校招/社招直接生成；猎头有"明星条款"——候选人中 1 个为 8~10 级。
 */
export function generateCandidateAttributes(
  baseAttr: number,
  roleWeights: Partial<StaffAttributes>,
  /** 候选人等级（影响属性池总上限） */
  level: number = 1,
): StaffAttributes {
  const keys: (keyof StaffAttributes)[] = ['intelligence', 'creativity', 'leadership', 'stamina', 'charisma'];

  // 1. 计算总属性池（等级越高，总池越大）
  const tierMin = level <= 2 ? 200 : level <= 4 ? 280 : level <= 6 ? 350 : 410;
  const tierMax = level <= 2 ? 250 : level <= 4 ? 320 : level <= 6 ? 400 : 460;
  const totalPool = tierMin + Math.random() * (tierMax - tierMin) + (baseAttr - 65) * 0.5;

  // 2. 用带权重的 Dirichlet 采样分配池子
  //    权重归一化后用 Gamma 分布采样得到 5 个分量
  const rawWeights = keys.map((k) => (roleWeights[k] ?? 0.1) * 2 + 0.3);
  const samples: number[] = rawWeights.map((w) => {
    // Gamma(k=2, θ=w/2) 简化采样
    const u1 = Math.random() || 0.001;
    const u2 = Math.random() || 0.001;
    const gamma = -2 * Math.log(u1) * Math.cos(2 * Math.PI * u2) + 2;
    return Math.max(0.01, w * gamma);
  });
  const sumSamples = samples.reduce((s, v) => s + v, 0);
  const proportions = samples.map((v) => v / sumSamples);

  // 3. 按比例分配总池，再加少量噪声
  const result = {} as StaffAttributes;
  keys.forEach((k, i) => {
    const noise = (Math.random() - 0.5) * 8; // ±4 噪声
    const raw = totalPool * proportions[i] + noise;
    // 4. 截断到 [25, 99]——避免极端值
    result[k] = clamp(Math.round(raw), 25, 99);
  });

  return result;
}

/**
 * 按等级获取默认属性池（用于命令创建员工时无 baseAttr 的情况）
 */
export function getDefaultAttributePool(level: number): number {
  if (level <= 2) return 220 + Math.random() * 30;
  if (level <= 4) return 290 + Math.random() * 30;
  if (level <= 6) return 360 + Math.random() * 40;
  if (level <= 8) return 410 + Math.random() * 50;
  return 440 + Math.random() * 50;
}

/** 离职概率 */
export function resignProbability(loyalty: number, fatigue: number): number {
  let p = Math.max(0, (30 - loyalty) / 100);
  if (fatigue > 90) p += 0.05;
  return p;
}

/** 绩效分数 */
export function calcPerformanceScore(
  workDays: number,
  contribution: number,
  skillCount: number,
  loyalty: number,
): { score: number; grade: 'S' | 'A' | 'B' | 'C' } {
  const attendance = clamp(workDays / 30, 0, 1);
  const score =
    attendance * 50 +
    clamp(contribution, 0, 100) * 0.3 +
    Math.min(skillCount, 5) * 10 +
    (loyalty > 70 ? 10 : 0);

  let grade: 'S' | 'A' | 'B' | 'C' = 'C';
  if (score >= 85) grade = 'S';
  else if (score >= 70) grade = 'A';
  else if (score >= 50) grade = 'B';

  return { score: Math.round(score), grade };
}
