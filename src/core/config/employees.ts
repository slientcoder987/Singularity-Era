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
};

/** 招聘费用（一次性） */
export const HIRE_COST = 10_000;

/** 发薪周期（天） */
export const PAY_PERIOD_DAYS = 30;

/** 升级所需经验阈值（按等级递增） */
export function experienceForLevel(level: number): number {
  return 100 * level * level;
}

/** 升级时属性提升范围 */
export const LEVEL_UP_ATTRIBUTE_GAIN = 3;

/** 升级时获得的技能点 */
export const LEVEL_UP_SKILL_POINTS = 1;
