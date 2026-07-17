/**
 * 公司管理系统配置
 *
 * 包含：
 * - 4 种管理模式（flat/matrix/divisional/holding）
 * - 4 个高管职位（CEO/COO/CFO/CTO）
 * - 规模分档（small/medium/large/huge）
 * - 高管加成计算
 *
 * 注意：管理效率核心公式 getManagementEfficiency 定义在
 * utils/crossSystemUtils.ts 中，避免循环依赖。
 *
 * 设计原则：所有数值集中在此文件，逻辑代码不写硬编码。
 */
import type { GameData } from '../GameState';
import { StaffRole } from '../entities/Employee';

// ============================================================
// 管理模式
// ============================================================

export type ManagementMode = 'flat' | 'matrix' | 'divisional' | 'holding';

export interface ManagementModeConfig {
  id: ManagementMode;
  displayName: string;
  description: string;
  /** 适合的普通员工规模范围 [min, max]，max=Infinity */
  scaleRange: [number, number];
  /** 该模式需要的核心管理人员数（达到则 staffingRatio=1.0） */
  requiredManagers: number;
  /** 模式基础效率 */
  baseEfficiency: number;
  /** 切换到此模式的基础成本（美元） */
  switchCostBase: number;
  /** 切换成本随在职 manager 数递增（美元/人） */
  switchCostPerManager: number;
}

export const MANAGEMENT_MODES: Record<ManagementMode, ManagementModeConfig> = {
  flat: {
    id: 'flat',
    displayName: '扁平',
    description: 'CEO 直接管理所有人，决策快，适合小团队（< 30 人）',
    scaleRange: [0, 30],
    requiredManagers: 1,
    baseEfficiency: 1.00,
    switchCostBase: 100_000,
    switchCostPerManager: 5_000,
  },
  matrix: {
    id: 'matrix',
    displayName: '矩阵',
    description: '职能 + 项目双线管理，适合中等规模（30-100 人）',
    scaleRange: [30, 100],
    requiredManagers: 3,
    baseEfficiency: 1.05,
    switchCostBase: 300_000,
    switchCostPerManager: 10_000,
  },
  divisional: {
    id: 'divisional',
    displayName: '事业部',
    description: '按业务线划分，自治性强，适合大规模（100-300 人）',
    scaleRange: [100, 300],
    requiredManagers: 6,
    baseEfficiency: 1.10,
    switchCostBase: 600_000,
    switchCostPerManager: 15_000,
  },
  holding: {
    id: 'holding',
    displayName: '控股集团',
    description: '多地区/多业务，最大规模支持（> 300 人）',
    scaleRange: [300, Infinity],
    requiredManagers: 10,
    baseEfficiency: 1.15,
    switchCostBase: 1_000_000,
    switchCostPerManager: 20_000,
  },
};

/** 模式切换冷却期（天） */
export const MODE_SWITCH_COOLDOWN_DAYS = 60;

// ============================================================
// 公司规模分档
// ============================================================

export type CompanyScale = 'small' | 'medium' | 'large' | 'huge';

/** 根据普通员工总数判定公司规模档位 */
export function getCompanyScale(normalHeadcountTotal: number): CompanyScale {
  if (normalHeadcountTotal < 30) return 'small';
  if (normalHeadcountTotal < 100) return 'medium';
  if (normalHeadcountTotal < 300) return 'large';
  return 'huge';
}

/** 根据规模档位推荐管理模式 */
export function getRecommendedMode(scale: CompanyScale): ManagementMode {
  const map: Record<CompanyScale, ManagementMode> = {
    small: 'flat',
    medium: 'matrix',
    large: 'divisional',
    huge: 'holding',
  };
  return map[scale];
}

/**
 * 模式匹配度系数（当前模式与实际规模的契合度）
 *
 * 模式与规模档位按顺序排列，差距越大惩罚越重：
 *   0 档差 = 1.00（完美匹配）
 *   1 档差 = 0.85
 *   2 档差 = 0.70
 *   3 档差 = 0.55
 */
export function getModeMatchFactor(currentMode: ManagementMode, scale: CompanyScale): number {
  const modeOrder: ManagementMode[] = ['flat', 'matrix', 'divisional', 'holding'];
  const scaleOrder: CompanyScale[] = ['small', 'medium', 'large', 'huge'];
  const modeIdx = modeOrder.indexOf(currentMode);
  const scaleIdx = scaleOrder.indexOf(scale);
  const diff = Math.abs(modeIdx - scaleIdx);
  return [1.00, 0.85, 0.70, 0.55][Math.min(diff, 3)];
}

// ============================================================
// 高管职位
// ============================================================

export type ExecutiveRole = 'ceo' | 'coo' | 'cfo' | 'cto';

export interface ExecutiveConfig {
  role: ExecutiveRole;
  displayName: string;
  /** 最低等级要求 */
  minLevel: number;
  /** 最低 leadership 要求 */
  minLeadership: number;
  /** 最低 charisma 要求（0 表示不要求） */
  minCharisma: number;
  /** 加到 (1 + executiveBonus) 的效率加成 */
  efficiencyBonus: number;
  /** CEO 专属：员工士气下限（不跌破此值） */
  moraleFloor?: number;
  /** COO 专属：基础设施故障率额外减少（乘算） */
  infraFailureReduction?: number;
  /** CFO 专属：全员薪资支出折扣（乘算） */
  salaryDiscount?: number;
  /** CTO 专属：研发速度额外加成（乘算） */
  researchSpeedBonus?: number;
}

export const EXECUTIVE_CONFIGS: Record<ExecutiveRole, ExecutiveConfig> = {
  ceo: {
    role: 'ceo',
    displayName: 'CEO',
    minLevel: 8,
    minLeadership: 75,
    minCharisma: 70,
    efficiencyBonus: 0.030,
    moraleFloor: 5,
  },
  coo: {
    role: 'coo',
    displayName: 'COO',
    minLevel: 7,
    minLeadership: 70,
    minCharisma: 60,
    efficiencyBonus: 0.020,
    infraFailureReduction: 0.05,
  },
  cfo: {
    role: 'cfo',
    displayName: 'CFO',
    minLevel: 7,
    minLeadership: 65,
    minCharisma: 65,
    efficiencyBonus: 0.015,
    salaryDiscount: 0.03,
  },
  cto: {
    role: 'cto',
    displayName: 'CTO',
    minLevel: 8,
    minLeadership: 70,
    minCharisma: 0,
    efficiencyBonus: 0.025,
    researchSpeedBonus: 0.05,
  },
};

/** 高管任命结构 */
export interface ExecutiveAssignment {
  ceoId: string | null;
  cooId: string | null;
  cfoId: string | null;
  ctoId: string | null;
}

/** 所有高管职位列表（用于遍历） */
export const EXECUTIVE_ROLES: ExecutiveRole[] = ['ceo', 'coo', 'cfo', 'cto'];

// ============================================================
// 高管加成计算
// ============================================================

export interface ExecutiveBonusSummary {
  /** 累加的效率加成（0~0.09） */
  efficiencyBonus: number;
  /** CEO 士气下限（0 或 5） */
  moraleFloor: number;
  /** COO 基础设施故障率减少（0 或 0.05） */
  infraFailureReduction: number;
  /** CFO 薪资折扣（0 或 0.03） */
  salaryDiscount: number;
  /** CTO 研发速度加成（0 或 0.05） */
  researchSpeedBonus: number;
  /** 已任命的高管数（0~4） */
  appointedCount: number;
}

/**
 * 计算高管加成汇总
 *
 * 性能：O(1) per executive，最多 4 次查表
 */
export function getExecutiveBonus(data: GameData): ExecutiveBonusSummary {
  const exec = data.executives;
  const empMap = new Map(data.employees.map((e) => [e.id, e]));

  let efficiencyBonus = 0;
  let moraleFloor = 0;
  let infra = 0;
  let salary = 0;
  let research = 0;
  let appointedCount = 0;

  for (const role of EXECUTIVE_ROLES) {
    const slotKey = `${role}Id` as keyof ExecutiveAssignment;
    const id = exec[slotKey];
    if (id && empMap.has(id)) {
      const cfg = EXECUTIVE_CONFIGS[role];
      efficiencyBonus += cfg.efficiencyBonus;
      if (cfg.moraleFloor) moraleFloor = Math.max(moraleFloor, cfg.moraleFloor);
      if (cfg.infraFailureReduction) infra += cfg.infraFailureReduction;
      if (cfg.salaryDiscount) salary += cfg.salaryDiscount;
      if (cfg.researchSpeedBonus) research += cfg.researchSpeedBonus;
      appointedCount++;
    }
  }

  return {
    efficiencyBonus,
    moraleFloor,
    infraFailureReduction: infra,
    salaryDiscount: salary,
    researchSpeedBonus: research,
    appointedCount,
  };
}

// ============================================================
// 模式切换成本
// ============================================================

/**
 * 计算切换管理模式的成本
 *
 * 公式：switchCostBase + switchCostPerManager × 在职 core manager 数
 */
export function calcModeSwitchCost(targetMode: ManagementMode, currentManagers: number): number {
  const cfg = MANAGEMENT_MODES[targetMode];
  return cfg.switchCostBase + cfg.switchCostPerManager * currentManagers;
}

/**
 * 计算当前模式下的"管理跨度比"（staffingRatio）
 *
 * = min(coreManagers / requiredManagers, 1.0)
 * 用于 crossSystemUtils.getManagementEfficiency 公式
 */
export function getManagerStaffingRatio(data: GameData): number {
  const modeCfg = MANAGEMENT_MODES[data.managementMode];
  const requiredManagers = modeCfg.requiredManagers;
  if (requiredManagers === 0) return 1.0;
  const coreManagers = data.employees.filter(
    (e) => e.role === StaffRole.MANAGER && e.status !== 'training',
  ).length;
  return Math.min(coreManagers / requiredManagers, 1.0);
}
