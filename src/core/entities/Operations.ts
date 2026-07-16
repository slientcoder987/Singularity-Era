/**
 * 融资轮次实体
 */
export type FundingType = 'seed' | 'strategic' | 'venture_capital' | 'government' | 'ipo';

export interface FundingRound {
  id: string;
  type: FundingType;
  investorName: string;
  amount: number; // 百万美元
  valuationAtRound: number; // 本轮估值（百万美元）
  /** 已使用金额（百万） */
  usedAmount: number;
  terms: FundingTerms;
  /** 第几天完成 */
  completedAt: number;
  /** 是否仍然有效（投资者未退出） */
  active: boolean;
}

export interface FundingTerms {
  // ---- 战略投资 ----
  /** 算力折扣（0-1，如 0.3 = 7折） */
  computeDiscount?: number;
  /** 是否要求排他条款 */
  exclusivityRequired?: boolean;
  /** 技术方向配合要求 */
  techAlignment?: string;

  // ---- 风险投资 ----
  /** 对赌：目标年收入（百万美元），0 = 无对赌 */
  vamRevenueTarget?: number;
  /** 对赌：目标用户数（百万），0 = 无对赌 */
  vamUserTarget?: number;
  /** 对赌截止天数（从融资日起算） */
  vamDeadlineDays?: number;
  /** 对赌失败 → 创始人股权稀释比例 */
  vamDilutionPercent?: number;

  // ---- 政府基金 ----
  /** 禁售市场列表 */
  restrictedMarkets?: string[];
  /** 国家安全审查要求 */
  securityReviewRequired?: boolean;

  // ---- IPO ----
  /** 当前股价（$） */
  stockPrice?: number;
  /** 初始发行价 */
  ipoPrice?: number;
  /** 被做空概率（日） */
  shortSellRisk?: number;
  /** 流通股数（设计-15：用于增发/回购计算） */
  sharesOutstanding?: number;
  /** 设计-19：股价持续低于 $1 的累计天数，达到 30 天触发退市 */
  lowPriceStreak?: number;

  // ---- 通用 ----
  /** 董事会新增席位 */
  boardSeats: number;
}

/**
 * 董事会指令
 */
export type MissionType =
  | 'launch_domain_model'
  | 'enter_market'
  | 'cut_safety'
  | 'achieve_revenue'
  | 'hire_staff';

export interface BoardMission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  /** 发起人（投资者名） */
  from: string;
  /** 发起日期 */
  issuedAt: number;
  /** 截止日期（0 = 无截止） */
  deadline: number;

  // ---- 具体目标 ----
  /** launch_domain_model: 目标能力维度 */
  targetCapability?: string;
  /** launch_domain_model / achieve_revenue: 目标数值 */
  targetValue?: number;
  /** enter_market: 目标地区 id */
  targetRegion?: string;
  /** hire_staff: 目标人数 */
  targetHeadcount?: number;

  // ---- 奖惩 ----
  /** 完成奖励（百万美元） */
  rewardFunds: number;
  /** 完成奖励（声誉） */
  rewardReputation: number;
  /** 拒绝/失败惩罚 */
  penaltyDescription: string;

  /** 状态 */
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'failed';
}

/**
 * Token 售卖策略
 */
export interface TokenPricing {
  /** token 单价（美元/1M tokens） */
  pricePerMillion: number;
  /** 分配给推理的算力比例（0-1） */
  inferenceAllocation: number;
  /** 质量降级档位（0 = 不降级，1-3 逐渐降低） */
  qualityDowngrade: number;
}

/**
 * 欺骗操作追踪
 */
export interface DeceptionState {
  /** 降智档位（0-3） */
  downgradeLevel: number;
  /** 是否偷用全量用户数据 */
  stealUserData: boolean;
  /** 是否跳过安全测试 */
  skipSafetyTesting: boolean;
  /** 被发现概率（日） */
  detectionProbability: number;
  /** 累计欺骗次数（影响一次性风险爆发） */
  totalDeceptions: number;
}
