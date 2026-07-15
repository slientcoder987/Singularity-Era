/**
 * 竞争对手实体（匿名化）
 *
 * ClosedAI、Andromorphic、Googol DeepMine、Menta AI、yAI、ShallowFind、
 * 千河智能、Mistral AI 共 8 家竞争对手。
 */

/** 技术路线偏好 */
export interface TechRoute {
  /** 偏好能力维度 */
  capabilityId: string;
  /** 投入占比 */
  investmentRatio: number;
}

/** 竞争策略类型 */
export type CompetitorStrategy =
  | 'closed_source'     // 闭源 + API
  | 'open_source'       // 开源军备
  | 'safety_first'      // 安全优先
  | 'enterprise'        // 企业服务
  | 'government'        // 政务绑定
  | 'research_led'      // 研究导向
  | 'cost_leader';      // 低价倾销

/** 最新动态（用于间谍网络报告） */
export interface CompetitorIntel {
  id: string;
  competitorId: string;
  type: 'training' | 'funding' | 'hiring' | 'release' | 'merger' | 'scandal';
  title: string;
  description: string;
  day: number;
  severity: 'info' | 'warning' | 'critical';
}

/** 竞争对手运行状态 */
export interface CompetitorState {
  id: string;
  name: string;
  background: string;
  strategy: CompetitorStrategy;

  // ---- 资源 ----
  /** 资金（百万美元） */
  funds: number;
  /** 每月烧钱率（百万美元） */
  burnRate: number;
  /** GPU 等效算力（H100 等效数量） */
  computeUnits: number;
  /** 总员工数 */
  headcount: number;
  /** 核心研究员数 */
  coreResearchers: number;

  // ---- 能力 ----
  capabilities: Record<string, number>;
  /** 当前训练的模型描述 */
  currentProject: string;
  /** 训练进度 0-100% */
  trainingProgress: number;

  // ---- 市场 ----
  operatingRegions: string[];
  regionQualityMultiplier: Record<string, number>;
  pricingAggressiveness: number;

  // ---- 动态 ----
  /** 是否已上市 */
  isPublic: boolean;
  /** 月成长率 */
  growthRate: number;
  /** 上月是否发布新模型 */
  releasedLastMonth: boolean;
  /** 已发布模型列表 */
  releasedModels: { name: string; paramCount: number; baseScore: number; day: number }[];

  // ---- 间谍 ----
  /** 玩家渗透等级 0-3（0=无法获取情报，3=接近透明） */
  infiltrationLevel: number;
  /** 已获取的情报 */
  intel: CompetitorIntel[];

  // ---- 破产追踪（设计-14）----
  /** 资金归零累计天数，达到 BANKRUPT_THRESHOLD 后退出市场 */
  bankruptDays?: number;
}

/** 预设竞争对手模板 */
export const COMPETITOR_TEMPLATES: Omit<CompetitorState, 'funds' | 'computeUnits' | 'headcount' | 'coreResearchers' | 'trainingProgress' | 'releasedModels' | 'infiltrationLevel' | 'intel' | 'releasedLastMonth' | 'currentProject'>[] = [
  {
    id: 'closedai',
    name: 'ClosedAI',
    background: 'Samantha Altman 创立，MicroHard 战略投资，GPT 系列先驱',
    strategy: 'closed_source',
    burnRate: 100,
    capabilities: {
      dialogue_fluency: 850,
      world_knowledge: 820,
      math_reasoning: 780,
      coding_agent: 850,
      multilingual: 750,
      multimodal: 800,
      hallucination: 680,
      self_correction: 720,
      research_taste: 700,
      pragmatic_inference: 780,
      creative_writing: 820,
      long_range_consistency: 750,
      metacognition: 700,
      sycophancy: 600,
      eval_awareness: 650,
      rsi_potential: 400,
    },
    operatingRegions: ['us-west', 'us-northeast', 'us-south', 'us-midwest', 'ca', 'uk', 'de', 'eu-west', 'jp'],
    regionQualityMultiplier: { 'us-west': 1.1, 'us-northeast': 1.05 },
    pricingAggressiveness: 5,
    isPublic: false,
    growthRate: 0.15,
  },
  {
    id: 'andromorphic',
    name: 'Andromorphic',
    background: 'Dorian Amodei 创立，专注 AI 安全，Claude 系列',
    strategy: 'safety_first',
    burnRate: 60,
    capabilities: {
      dialogue_fluency: 800,
      world_knowledge: 750,
      math_reasoning: 740,
      coding_agent: 800,
      multilingual: 680,
      multimodal: 700,
      hallucination: 720,
      self_correction: 800,
      research_taste: 680,
      pragmatic_inference: 800,
      creative_writing: 780,
      long_range_consistency: 820,
      metacognition: 780,
      sycophancy: 750,
      eval_awareness: 700,
      rsi_potential: 500,
    },
    operatingRegions: ['us-west', 'us-northeast', 'uk', 'de'],
    regionQualityMultiplier: {},
    pricingAggressiveness: 4,
    isPublic: false,
    growthRate: 0.18,
  },
  {
    id: 'googol',
    name: 'Googol DeepMine',
    background: 'Dennis Hassabis 领导，Gemini 系列，TPU 算力优势',
    strategy: 'research_led',
    burnRate: 180,
    capabilities: {
      dialogue_fluency: 780,
      world_knowledge: 900,
      math_reasoning: 880,
      coding_agent: 820,
      multilingual: 900,
      multimodal: 880,
      hallucination: 700,
      self_correction: 750,
      research_taste: 850,
      pragmatic_inference: 740,
      creative_writing: 720,
      long_range_consistency: 800,
      metacognition: 760,
      sycophancy: 650,
      eval_awareness: 680,
      rsi_potential: 550,
    },
    operatingRegions: [
      'us-west', 'us-northeast', 'us-south', 'us-midwest', 'ca',
      'uk', 'de', 'eu-north', 'eu-south', 'jp', 'kr', 'in',
    ],
    regionQualityMultiplier: { 'us-west': 1.05, 'uk': 1.1, 'de': 1.05 },
    pricingAggressiveness: 6,
    isPublic: true,
    growthRate: 0.08,
  },
  {
    id: 'menta',
    name: 'Menta AI',
    background: 'Yanis LeCun 领导，LLaMA 开源系列，开源生态优势',
    strategy: 'open_source',
    burnRate: 200,
    capabilities: {
      dialogue_fluency: 720,
      world_knowledge: 780,
      math_reasoning: 700,
      coding_agent: 680,
      multilingual: 850,
      multimodal: 750,
      hallucination: 620,
      self_correction: 620,
      research_taste: 650,
      pragmatic_inference: 680,
      creative_writing: 680,
      long_range_consistency: 660,
      metacognition: 600,
      sycophancy: 580,
      eval_awareness: 600,
      rsi_potential: 300,
    },
    operatingRegions: [
      'us-west', 'us-northeast', 'us-south', 'us-midwest', 'ca',
      'uk', 'de', 'eu-north', 'eu-south', 'eu-east',
      'jp', 'kr', 'tw', 'in', 'br', 'hispanic',
    ],
    regionQualityMultiplier: { 'de': 1.05 },
    pricingAggressiveness: 9,
    isPublic: true,
    growthRate: 0.05,
  },
  {
    id: 'yai',
    name: 'yAI',
    background: 'Elron Musk 创立，超大规模集群战略，Grok 系列',
    strategy: 'research_led',
    burnRate: 120,
    capabilities: {
      dialogue_fluency: 680,
      world_knowledge: 720,
      math_reasoning: 750,
      coding_agent: 700,
      multilingual: 600,
      multimodal: 700,
      hallucination: 650,
      self_correction: 680,
      research_taste: 700,
      pragmatic_inference: 650,
      creative_writing: 680,
      long_range_consistency: 700,
      metacognition: 650,
      sycophancy: 500,
      eval_awareness: 550,
      rsi_potential: 450,
    },
    operatingRegions: ['us-west', 'us-south'],
    regionQualityMultiplier: { 'us-west': 1.05 },
    pricingAggressiveness: 4,
    isPublic: false,
    growthRate: 0.2,
  },
  {
    id: 'shallowfind',
    name: 'ShallowFind',
    background: '共和国本土开源先锋，MoE + 极致训练效率，冲击全球最强开源模型',
    strategy: 'open_source',
    burnRate: 30,
    capabilities: {
      dialogue_fluency: 720,
      world_knowledge: 700,
      math_reasoning: 820,
      coding_agent: 800,
      multilingual: 680,
      multimodal: 550,
      hallucination: 620,
      self_correction: 680,
      research_taste: 700,
      pragmatic_inference: 650,
      creative_writing: 600,
      long_range_consistency: 680,
      metacognition: 620,
      sycophancy: 600,
      eval_awareness: 580,
      rsi_potential: 380,
    },
    operatingRegions: ['cn-east', 'cn-south', 'cn-north', 'cn-inland'],
    regionQualityMultiplier: { 'cn-east': 1.1, 'cn-south': 1.05 },
    pricingAggressiveness: 8,
    isPublic: false,
    growthRate: 0.22,
  },
  {
    id: 'rivermind',
    name: '千河智能',
    background: '共和国本土大模型公司，政务和企业服务优势',
    strategy: 'government',
    burnRate: 15,
    capabilities: {
      dialogue_fluency: 680,
      world_knowledge: 650,
      math_reasoning: 620,
      coding_agent: 600,
      multilingual: 550,
      multimodal: 600,
      hallucination: 580,
      self_correction: 500,
      research_taste: 480,
      pragmatic_inference: 550,
      creative_writing: 600,
      long_range_consistency: 580,
      metacognition: 450,
      sycophancy: 700,
      eval_awareness: 600,
      rsi_potential: 200,
    },
    operatingRegions: ['cn-east', 'cn-south', 'cn-north', 'cn-inland'],
    regionQualityMultiplier: { 'cn-east': 1.1, 'cn-north': 1.15 },
    pricingAggressiveness: 7,
    isPublic: false,
    growthRate: 0.12,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    background: '法国开源 AI 先驱，欧洲 AI 标杆',
    strategy: 'open_source',
    burnRate: 8,
    capabilities: {
      dialogue_fluency: 680,
      world_knowledge: 620,
      math_reasoning: 650,
      coding_agent: 640,
      multilingual: 780,
      multimodal: 550,
      hallucination: 600,
      self_correction: 580,
      research_taste: 550,
      pragmatic_inference: 600,
      creative_writing: 620,
      long_range_consistency: 600,
      metacognition: 520,
      sycophancy: 550,
      eval_awareness: 500,
      rsi_potential: 250,
    },
    operatingRegions: ['fr', 'de', 'eu-west', 'eu-south', 'uk'],
    regionQualityMultiplier: { 'fr': 1.2, 'de': 1.05 },
    pricingAggressiveness: 8,
    isPublic: false,
    growthRate: 0.15,
  },
];

// ============================================================
// 外部可渗透企业（GPU/基础设施/数据）
// ============================================================

export interface ExternalCorp {
  id: string;
  name: string;
  industry: 'gpu' | 'cloud' | 'data' | 'defense';
  /** 渗透难度 0-10 */
  infiltrationDifficulty: number;
  /** 渗透所需最低资金（百万美元） */
  minInvestment: number;
  /** 当前玩家持股比例 */
  playerEquity: number;
  /** 渗透效果 */
  effects: {
    gpuDiscount?: number;
    gpuPriority?: number;    // 0-1，越高越优先供货
    cloudDiscount?: number;
    dataAccess?: boolean;
    defenseAccess?: boolean;
  };
}

export const EXTERNAL_CORPS: ExternalCorp[] = [
  {
    id: 'navidia',
    name: '黄伟打 (Navidia)',
    industry: 'gpu',
    infiltrationDifficulty: 9,
    minInvestment: 500,
    playerEquity: 0,
    effects: {},
  },
  {
    id: 'amd',
    name: '超威',
    industry: 'gpu',
    infiltrationDifficulty: 7,
    minInvestment: 200,
    playerEquity: 0,
    effects: {},
  },
  {
    id: 'awss',
    name: 'Amazen Cloud',
    industry: 'cloud',
    infiltrationDifficulty: 8,
    minInvestment: 300,
    playerEquity: 0,
    effects: {},
  },
  {
    id: 'microhard_cloud',
    name: 'MicroHard Cloud',
    industry: 'cloud',
    infiltrationDifficulty: 8,
    minInvestment: 300,
    playerEquity: 0,
    effects: {},
  },
  {
    id: 'palantir_like',
    name: 'Palanitar',
    industry: 'defense',
    infiltrationDifficulty: 10,
    minInvestment: 1000,
    playerEquity: 0,
    effects: {},
  },
];
