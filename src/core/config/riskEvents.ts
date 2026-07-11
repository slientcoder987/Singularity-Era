/**
 * 风险事件配置
 *
 * 8 种风险事件：训练崩溃、诉讼、监管调查、数据泄露、社区抵制、
 * 员工举报、AI对齐失败、AI欺骗行为。
 * 基于 legal_debt/trust_debt/能力阈值触发。
 */

/** 风险事件 id */
export type RiskEventId =
  | 'training_crash'
  | 'lawsuit_filed'
  | 'regulatory_investigation'
  | 'data_leak'
  | 'community_backlash'
  | 'employee_whistleblower'
  | 'ai_misalignment'
  | 'ai_deception';

/** 风险事件配置 */
export interface RiskEventConfig {
  id: RiskEventId;
  name: string;
  description: string;
  /** 触发条件 */
  trigger: {
    /** legal_debt 阈值（达到后开始有概率触发） */
    legalDebt?: number;
    /** trust_debt 阈值 */
    trustDebt?: number;
    /** 模型能力阈值（任一维度超过即触发） */
    capabilityThreshold?: number;
    /** 基础概率（每日） */
    baseProbability: number;
    /** 风险因子加成（每超出单位增加的概率） */
    riskFactor?: number;
  };
  /** 事件效果 */
  effects: {
    /** 资金损失 */
    fundsLoss?: number;
    /** 声誉损失 */
    reputationLoss?: number;
    /** 用户流失比例 */
    userLossPercent?: number;
    /** 员工士气损失 */
    moraleLoss?: number;
    /** legal_debt 豁免 */
    legalDebtReduction?: number;
    /** 训练暂停天数 */
    trainingPauseDays?: number;
  };
  /** 严重性 */
  severity: 'minor' | 'major' | 'critical';
}

export const RISK_EVENTS: RiskEventConfig[] = [
  {
    id: 'training_crash', name: '训练崩溃', description: '激进配置导致训练失败',
    trigger: { baseProbability: 0.001 },
    effects: { fundsLoss: 50_000, moraleLoss: 5, trainingPauseDays: 3 },
    severity: 'major',
  },
  {
    id: 'lawsuit_filed', name: '集体诉讼', description: '因数据使用问题被起诉',
    trigger: { legalDebt: 5, baseProbability: 0.001, riskFactor: 0.0005 },
    effects: { fundsLoss: 500_000, reputationLoss: 10, legalDebtReduction: 2 },
    severity: 'major',
  },
  {
    id: 'regulatory_investigation', name: '监管调查', description: '监管机构介入调查',
    trigger: { legalDebt: 10, baseProbability: 0.0005, riskFactor: 0.0008 },
    effects: { fundsLoss: 1_000_000, reputationLoss: 20, trainingPauseDays: 7, legalDebtReduction: 3 },
    severity: 'critical',
  },
  {
    id: 'data_leak', name: '数据泄露', description: '用户数据被泄露',
    trigger: { trustDebt: 8, baseProbability: 0.001, riskFactor: 0.0005 },
    effects: { fundsLoss: 300_000, reputationLoss: 15, userLossPercent: 20 },
    severity: 'critical',
  },
  {
    id: 'community_backlash', name: '社区抵制', description: '社区发现不当行为发起抵制',
    trigger: { trustDebt: 5, baseProbability: 0.002, riskFactor: 0.0003 },
    effects: { reputationLoss: 10, userLossPercent: 10 },
    severity: 'major',
  },
  {
    id: 'employee_whistleblower', name: '员工举报', description: '员工向媒体举报公司不当行为',
    trigger: { legalDebt: 7, baseProbability: 0.001, riskFactor: 0.0004 },
    effects: { reputationLoss: 25, userLossPercent: 15, moraleLoss: 10 },
    severity: 'critical',
  },
  {
    id: 'ai_misalignment', name: 'AI对齐失败', description: '模型行为偏离预期',
    trigger: { capabilityThreshold: 1500, baseProbability: 0.0001 },
    effects: { reputationLoss: 30, userLossPercent: 25, trainingPauseDays: 14 },
    severity: 'critical',
  },
  {
    id: 'ai_deception', name: 'AI欺骗行为', description: '模型被发现有欺骗性',
    trigger: { capabilityThreshold: 1800, baseProbability: 0.00005 },
    effects: { reputationLoss: 40, userLossPercent: 30, trainingPauseDays: 21 },
    severity: 'critical',
  },
];

export const RISK_EVENT_MAP: Record<RiskEventId, RiskEventConfig> =
  Object.fromEntries(RISK_EVENTS.map((e) => [e.id, e])) as Record<RiskEventId, RiskEventConfig>;
