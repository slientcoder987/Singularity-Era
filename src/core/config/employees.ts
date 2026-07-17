import { StaffRole, type Skill, type StaffAttributes } from '../entities/Employee';

/**
 * 角色配置
 *
 * 新增角色：只需在 StaffRole 枚举加一项，并在此添加配置。
 * StaffSystem 等逻辑代码无需修改。
 */
export interface RoleConfig {
  /** 基础年薪（美元） */
  baseSalary: number;
  /** 生成随机属性时的权重（影响该属性的平均值） */
  attributeWeights: Partial<StaffAttributes>;
  /** 可学习的技能 id 列表 */
  skillPool: string[];
  /** 角色中文名 */
  displayName: string;
}

export const ROLE_CONFIG: Record<StaffRole, RoleConfig> = {
  [StaffRole.RESEARCHER]: {
    displayName: '研究员',
    baseSalary: 180_000,
    attributeWeights: { intelligence: 0.4, creativity: 0.3, stamina: 0.15, leadership: 0.1, charisma: 0.05 },
    skillPool: ['reduce_training_compute', 'increase_model_cap', 'research_breakthrough'],
  },
  [StaffRole.DATA_ENGINEER]: {
    displayName: '数据工程师',
    baseSalary: 140_000,
    attributeWeights: { intelligence: 0.35, stamina: 0.3, creativity: 0.2, leadership: 0.1, charisma: 0.05 },
    skillPool: ['data_quality_boost', 'pipeline_optimization'],
  },
  [StaffRole.SYSTEM_ENGINEER]: {
    displayName: '系统工程师',
    baseSalary: 130_000,
    attributeWeights: { intelligence: 0.3, stamina: 0.3, leadership: 0.15, creativity: 0.15, charisma: 0.1 },
    skillPool: ['infra_efficiency', 'reduce_card_wear'],
  },
  [StaffRole.PRODUCT_MANAGER]: {
    displayName: '产品经理',
    baseSalary: 120_000,
    attributeWeights: { leadership: 0.35, charisma: 0.3, intelligence: 0.2, creativity: 0.1, stamina: 0.05 },
    skillPool: ['market_insight', 'team_coordination'],
  },
  [StaffRole.LEGAL_PR]: {
    displayName: '法务/公关',
    baseSalary: 110_000,
    attributeWeights: { charisma: 0.4, intelligence: 0.25, leadership: 0.2, stamina: 0.1, creativity: 0.05 },
    skillPool: ['crisis_management', 'compliance_boost'],
  },
  [StaffRole.MANAGER]: {
    displayName: '管理人员',
    baseSalary: 260_000,
    attributeWeights: { leadership: 0.45, charisma: 0.25, intelligence: 0.15, stamina: 0.10, creativity: 0.05 },
    skillPool: ['executive_vision', 'cost_optimization', 'talent_development', 'team_coordination'],
  },
};

/**
 * 技能配置
 *
 * 新增技能：只需在此添加一条，并在 teamEffects 中解析其 effect.type。
 * 不需要修改 StaffSystem 等逻辑代码。
 */
export const SKILL_CONFIG: Record<string, Omit<Skill, 'unlocked'>> = {
  reduce_training_compute: {
    id: 'reduce_training_compute',
    name: '算力优化',
    description: '训练消耗算力减少 5%',
    effect: { type: 'reduce_training_compute', value: 0.05 },
    cost: 1,
  },
  increase_model_cap: {
    id: 'increase_model_cap',
    name: '模型容量扩展',
    description: '可同时训练的模型数 +1',
    effect: { type: 'increase_model_cap', value: 1 },
    cost: 2,
  },
  research_breakthrough: {
    id: 'research_breakthrough',
    name: '研究突破',
    description: '研究速度 +10%',
    effect: { type: 'research_speed', value: 0.1 },
    cost: 2,
  },
  data_quality_boost: {
    id: 'data_quality_boost',
    name: '数据质量提升',
    description: '训练数据质量 +8%',
    effect: { type: 'data_quality', value: 0.08 },
    cost: 1,
  },
  pipeline_optimization: {
    id: 'pipeline_optimization',
    name: '流水线优化',
    description: '数据处理速度 +15%',
    effect: { type: 'data_speed', value: 0.15 },
    cost: 1,
  },
  infra_efficiency: {
    id: 'infra_efficiency',
    name: '基础设施效率',
    description: '电力消耗 -5%',
    effect: { type: 'reduce_power_consumption', value: 0.05 },
    cost: 1,
  },
  reduce_card_wear: {
    id: 'reduce_card_wear',
    name: '硬件保养',
    description: '计算卡故障率 -20%',
    effect: { type: 'reduce_card_wear', value: 0.2 },
    cost: 2,
  },
  market_insight: {
    id: 'market_insight',
    name: '市场洞察',
    description: '模型商业化收入 +10%',
    effect: { type: 'revenue_boost', value: 0.1 },
    cost: 2,
  },
  team_coordination: {
    id: 'team_coordination',
    name: '团队协调',
    description: '团队整体效率 +5%',
    effect: { type: 'team_efficiency', value: 0.05 },
    cost: 1,
  },
  crisis_management: {
    id: 'crisis_management',
    name: '危机管理',
    description: '负面事件影响 -30%',
    effect: { type: 'crisis_reduction', value: 0.3 },
    cost: 2,
  },
  compliance_boost: {
    id: 'compliance_boost',
    name: '合规增益',
    description: '合规度 +15',
    effect: { type: 'compliance', value: 15 },
    cost: 1,
  },
  // ===== 管理人员专属技能 =====
  executive_vision: {
    id: 'executive_vision',
    name: '战略视野',
    description: '公司管理效率 +2%（多个 manager 解锁可叠加）',
    effect: { type: 'management_efficiency', value: 0.02 },
    cost: 2,
  },
  cost_optimization: {
    id: 'cost_optimization',
    name: '成本优化',
    description: '全公司薪资支出 -3%（多个解锁可叠加）',
    effect: { type: 'salary_reduction', value: 0.03 },
    cost: 2,
  },
  talent_development: {
    id: 'talent_development',
    name: '人才发展',
    description: '员工培训速度 +10%（多个解锁可叠加）',
    effect: { type: 'training_speed', value: 0.10 },
    cost: 1,
  },
};

/** 招聘费用（一次性） */
export const HIRE_COST = 10_000;

/** 普通员工招聘费用（一次性，每人） */
export const NORMAL_HIRE_COST = 3_000;

/** 普通员工年薪（美元） */
export const NORMAL_EMPLOYEE_SALARY = 50_000;

/** 核心员工每角色数量上限 */
export const CORE_EMPLOYEE_CAP_PER_ROLE = 10;

/** 发薪周期（天） */
export const PAY_PERIOD_DAYS = 30;

/** 普通员工发薪周期（天），可与核心不同 */
export const NORMAL_PAY_PERIOD_DAYS = 30;

/** 升级所需经验阈值（按等级递增） */
export function experienceForLevel(level: number): number {
  return 100 * level * level;
}

/** 升级时属性提升范围 */
export const LEVEL_UP_ATTRIBUTE_GAIN = 3;

/** 升级时获得的技能点 */
export const LEVEL_UP_SKILL_POINTS = 1;

/** StaffRole 到普通员工资源 ID 的映射 */
export const ROLE_TO_STAFF_RESOURCE: Record<StaffRole, string> = {
  [StaffRole.RESEARCHER]: 'staff_researcher',
  [StaffRole.DATA_ENGINEER]: 'staff_data_engineer',
  [StaffRole.SYSTEM_ENGINEER]: 'staff_system_engineer',
  [StaffRole.PRODUCT_MANAGER]: 'staff_product_manager',
  [StaffRole.LEGAL_PR]: 'staff_legal_pr',
  [StaffRole.MANAGER]: 'staff_manager',
};

// ============================================================
// 招聘渠道
// ============================================================

/** 招聘渠道 id */
export type RecruitmentChannelId = 'campus' | 'job_site' | 'headhunter' | 'internal_promote' | 'executive_search';

/** 招聘渠道配置 */
export interface RecruitmentChannelConfig {
  id: RecruitmentChannelId;
  name: string;
  /** 一次性招聘费（美元） */
  cost: number;
  /** 交付天数（候选人出现所需时间） */
  deliveryDays: number;
  /** 候选人属性均值（50-100） */
  baseAttribute: number;
  /** 候选人等级范围 [min, max] */
  levelRange: [number, number];
  /** 生成的候选人数 */
  candidateCount: number;
}

/** 招聘渠道表 */
export const RECRUITMENT_CHANNELS: Record<RecruitmentChannelId, RecruitmentChannelConfig> = {
  campus: {
    id: 'campus',
    name: '校园招聘',
    cost: 5_000,
    deliveryDays: 14,
    baseAttribute: 55,
    levelRange: [1, 2],
    candidateCount: 3,
  },
  job_site: {
    id: 'job_site',
    name: '招聘网站',
    cost: 10_000,
    deliveryDays: 3,
    baseAttribute: 65,
    levelRange: [2, 4],
    candidateCount: 3,
  },
  headhunter: {
    id: 'headhunter',
    name: '猎头',
    cost: 50_000,
    deliveryDays: 7,
    baseAttribute: 80,
    levelRange: [4, 7],
    candidateCount: 3,
  },
  internal_promote: {
    id: 'internal_promote',
    name: '内部晋升',
    cost: 0,
    deliveryDays: 0,
    baseAttribute: 0, // 内部晋升使用员工原属性
    levelRange: [1, 10],
    candidateCount: 0, // 内部晋升不生成候选人
  },
  executive_search: {
    id: 'executive_search',
    name: '高管猎聘',
    cost: 200_000,           // 4 倍于普通猎头
    deliveryDays: 14,
    baseAttribute: 85,
    levelRange: [7, 10],     // 仅高管候选
    candidateCount: 2,
  },
};

// ============================================================
// 等级倍率与角色主属性
// ============================================================

/** 等级 → 年薪倍率 */
export function levelMultiplier(level: number): number {
  if (level <= 2) return 1.0;
  if (level <= 4) return 1.3;
  if (level <= 6) return 1.7;
  if (level <= 8) return 2.2;
  return 3.0;
}

/** 角色 → 主属性映射（用于效率计算） */
export const ROLE_PRIMARY_ATTR: Record<StaffRole, keyof import('../entities/Employee').StaffAttributes> = {
  [StaffRole.RESEARCHER]: 'intelligence',
  [StaffRole.DATA_ENGINEER]: 'intelligence',
  [StaffRole.SYSTEM_ENGINEER]: 'intelligence',
  [StaffRole.PRODUCT_MANAGER]: 'leadership',
  [StaffRole.LEGAL_PR]: 'charisma',
  [StaffRole.MANAGER]: 'leadership',
};

// ============================================================
// 激励手段配置
// ============================================================

/** 奖金冷却天数 */
export const BONUS_COOLDOWN_DAYS = 30;
/** 奖金金额占年薪比例 */
export const BONUS_SALARY_RATIO = 0.1;
/** 奖金忠诚度提升 */
export const BONUS_LOYALTY_GAIN = 15;

/** 股权冷却天数 */
export const EQUITY_COOLDOWN_DAYS = 90;
/** 股权忠诚度提升 */
export const EQUITY_LOYALTY_GAIN = 30;
/** 股权锁定期（天，2 年 = 730 天） */
export const EQUITY_LOCK_DAYS = 730;

/** 团建成本（美元/人） */
export const TEAM_BUILDING_COST_PER_HEAD = 10_000;
/** 团建冷却天数 */
export const TEAM_BUILDING_COOLDOWN_DAYS = 30;
/** 团建忠诚度提升 */
export const TEAM_BUILDING_LOYALTY_GAIN = 5;
/** 团建疲劳度降低 */
export const TEAM_BUILDING_FATIGUE_REDUCE = 20;

// ============================================================
// 晋升配置
// ============================================================

/** 主动晋升所需经验阈值比例（达到本级阈值的 80%） */
export const PROMOTE_EXP_RATIO = 0.8;
/** 主动晋升所需最低绩效等级 */
export const PROMOTE_MIN_GRADE: 'S' | 'A' | 'B' | 'C' = 'A';
/** 主动晋升冷却天数 */
export const PROMOTE_COOLDOWN_DAYS = 90;
/** 主动晋升奖励技能点 */
export const PROMOTE_SKILL_POINT_GAIN = 2;

// ============================================================
// 普通员工招聘递增
// ============================================================

/** 普通员工招聘费递增起点 */
export const NORMAL_HIRE_TIER_THRESHOLD = 50;
/** 每超 1 人递增比例 */
export const NORMAL_HIRE_TIER_INCREMENT = 0.05;

/** 计算普通员工实际招聘费 */
export function calcNormalHireCost(currentCount: number): number {
  const extra = Math.max(0, currentCount - NORMAL_HIRE_TIER_THRESHOLD);
  return Math.round(NORMAL_HIRE_COST * (1 + extra * NORMAL_HIRE_TIER_INCREMENT));
}

// ============================================================
// 绩效评估配置
// ============================================================

/** 绩效评估周期（天） */
export const PERFORMANCE_EVAL_PERIOD = 30;

/** 绩效等级阈值 */
export const PERFORMANCE_GRADE_THRESHOLDS = {
  S: 85,
  A: 70,
  B: 50,
  // C: < 50
};

/** 绩效奖励：S 级技能点 */
export const PERFORMANCE_S_SKILL_POINT = 1;
/** 绩效奖励：A 级经验倍率 */
export const PERFORMANCE_A_EXP_MULTIPLIER = 1.5;
/** 绩效惩罚：C 级忠诚度扣减 */
export const PERFORMANCE_C_LOYALTY_PENALTY = 5;
