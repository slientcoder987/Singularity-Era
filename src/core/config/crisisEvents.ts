/**
 * 危机事件配置
 *
 * 训练崩溃、数据泄露、合规风险等。玩家选择处理方式，影响资源/声誉。
 */

export type CrisisType =
  | 'training_crash'
  | 'data_leak'
  | 'compliance'
  | 'hardware_failure'
  | 'pr_disaster';

/** 危机触发条件 */
export interface CrisisTrigger {
  /** 稳定性风险下限 */
  minStabilityRisk?: number;
  /** 参数规模下限（B） */
  minParamSizeB?: number;
  /** 随机触发概率（每天） */
  randomProbability?: number;
}

/** 危机处理选项 */
export interface CrisisOption {
  id: string;
  label: string;
  /** 处理成本 */
  cost?: number;
  /** 处理效果 */
  effects: {
    reputation?: number;
    funds?: number;
    marketPressure?: number;
    /** 损失的训练进度比例 */
    trainingProgress?: number;
    /** 用户损失 */
    userLoss?: number;
  };
  description: string;
}

export interface CrisisEventConfig {
  id: string;
  type: CrisisType;
  trigger: CrisisTrigger;
  options: CrisisOption[];
  description: string;
}

export const CRISIS_EVENTS: CrisisEventConfig[] = [
  {
    id: 'major_crash',
    type: 'training_crash',
    trigger: { minStabilityRisk: 0.3, minParamSizeB: 100 },
    options: [
      {
        id: 'rollback',
        label: '回滚到上个 checkpoint',
        effects: { trainingProgress: -0.1 },
        description: '损失 10% 训练进度',
      },
      {
        id: 'debug',
        label: '投入研发调试（$50k）',
        cost: 50_000,
        effects: { funds: -50_000, trainingProgress: -0.02 },
        description: '损失 2% 进度，花费 $50k',
      },
      {
        id: 'ignore',
        label: '继续训练（高风险）',
        effects: { trainingProgress: -0.05, reputation: -5 },
        description: '损失 5% 进度，声誉 -5',
      },
    ],
    description: '大模型训练崩溃！',
  },
  {
    id: 'data_leak',
    type: 'data_leak',
    trigger: { randomProbability: 0.001 },
    options: [
      {
        id: 'settle',
        label: '私下和解（$200k）',
        cost: 200_000,
        effects: { funds: -200_000, reputation: -2 },
        description: '花费 $200k，声誉小损',
      },
      {
        id: 'public',
        label: '公开道歉',
        effects: { reputation: -15, marketPressure: 10 },
        description: '声誉 -15，市场压力 +10',
      },
      {
        id: 'deny',
        label: '否认（高风险）',
        effects: { reputation: -30, marketPressure: 20 },
        description: '若被发现声誉 -30',
      },
    ],
    description: '训练数据泄露事件！',
  },
  {
    id: 'compliance_audit',
    type: 'compliance',
    trigger: { randomProbability: 0.0008 },
    options: [
      {
        id: 'cooperate',
        label: '配合审计（$100k）',
        cost: 100_000,
        effects: { funds: -100_000 },
        description: '花费 $100k，无其他损失',
      },
      {
        id: 'delay',
        label: '拖延应对',
        effects: { reputation: -10, marketPressure: 5 },
        description: '声誉 -10，市场压力 +5',
      },
    ],
    description: '监管机构发起合规审计',
  },
];

const CRISIS_MAP = new Map(CRISIS_EVENTS.map((c) => [c.id, c]));

export function getCrisisEvent(id: string): CrisisEventConfig | undefined {
  return CRISIS_MAP.get(id);
}
