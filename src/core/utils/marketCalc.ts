/**
 * 市场计算工具
 *
 * 计算每个地区的市场份额、收入和竞争定价。
 */
import type { Model } from '../entities/Model';
import type { CompetitorState } from '../entities/Competitor';
import { COMPETITOR_TEMPLATES } from '../entities/Competitor';
import { REGION_MAP, type RegionId } from '../config/regions';

/** 获取活跃竞争对手列表（优先使用实际状态） */
function getActiveCompetitors(competitorStates?: CompetitorState[]): CompetitorState[] {
  if (competitorStates && competitorStates.length > 0) return competitorStates;
  // 降级：使用预设模板
  return COMPETITOR_TEMPLATES.map((t) => ({
    ...t,
    funds: 10000,
    computeUnits: 5000,
    headcount: 500,
    coreResearchers: 50,
    trainingProgress: 30,
    releasedModels: [],
    infiltrationLevel: 0,
    intel: [],
    releasedLastMonth: false,
    currentProject: '下一代大语言模型',
  }));
}

/** 当前竞争对手状态缓存（由 CompetitorSystem 每日更新） */
let currentCompetitorStates: CompetitorState[] = [];

/** 由 CompetitorSystem 调用，更新市场计算可访问的竞争对手状态 */
export function updateCompetitorStates(states: CompetitorState[]): void {
  currentCompetitorStates = states;
}

// ============================================================
// 细分市场定义
// ============================================================

interface MarketSegment {
  id: string;
  name: string;
  /** 能力权重：capabilityId → weight */
  capabilityWeights: Record<string, number>;
  /** 市场渗透率（占可寻址用户的比例） */
  penetrationRate: number;
  /** 付费意愿（占人均GDP的比例） */
  willingnessToPay: number;
}

const MARKET_SEGMENTS: MarketSegment[] = [
  {
    id: 'customer_service',
    name: '客服市场',
    capabilityWeights: { dialogue_fluency: 0.6, multilingual: 0.4 },
    penetrationRate: 0.15,
    willingnessToPay: 0.0005,
  },
  {
    id: 'coding',
    name: '编程助手',
    capabilityWeights: { coding_agent: 1.0 },
    penetrationRate: 0.08,
    willingnessToPay: 0.003,
  },
  {
    id: 'content',
    name: '内容生成',
    capabilityWeights: { creative_writing: 0.5, multimodal: 0.5 },
    penetrationRate: 0.10,
    willingnessToPay: 0.001,
  },
  {
    id: 'data_analysis',
    name: '数据分析',
    capabilityWeights: { math_reasoning: 1.0 },
    penetrationRate: 0.05,
    willingnessToPay: 0.004,
  },
  {
    id: 'translation',
    name: '翻译',
    capabilityWeights: { multilingual: 1.0 },
    penetrationRate: 0.06,
    willingnessToPay: 0.0003,
  },
  {
    id: 'research',
    name: '科研助手',
    capabilityWeights: { research_taste: 0.5, world_knowledge: 0.5 },
    penetrationRate: 0.02,
    willingnessToPay: 0.008,
  },
];

// ============================================================
// 玩家能力评分
// ============================================================

/** 获取玩家在某个能力维度的最佳得分 */
export function getPlayerBestCapability(capId: string, models: Model[]): number {
  let best = 0;
  for (const m of models) {
    const val = (m.capabilities as Record<string, number>)[capId] ?? 0;
    if (val > best) best = val;
  }
  return best;
}

/** 计算玩家在指定细分市场的能力评分 */
export function calcSegmentCapabilityScore(
  segment: MarketSegment,
  models: Model[],
): number {
  let score = 0;
  let totalWeight = 0;
  for (const [capId, weight] of Object.entries(segment.capabilityWeights)) {
    score += getPlayerBestCapability(capId, models) * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? score / totalWeight : 0;
}

// ============================================================
// 竞争计算
// ============================================================

/** 获取某竞争者在某地区的质量因子 */
function getCompetitorRegionQuality(competitor: CompetitorState, regionId: string): number {
  const base = competitor.regionQualityMultiplier[regionId] ?? 1.0;
  // 本地语言加分
  const region = REGION_MAP[regionId];
  if (!region) return base;
  const competitorHasLocalLang = competitor.capabilities['multilingual'] > 700;
  return competitorHasLocalLang ? base * 1.05 : base;
}

/** 计算竞争者在某个细分市场的得分（考虑渗透削弱） */
function calcCompetitorSegmentScore(
  competitor: CompetitorState,
  segment: MarketSegment,
  regionId: string,
): number {
  let rawScore = 0;
  let totalWeight = 0;
  for (const [capId, weight] of Object.entries(segment.capabilityWeights)) {
    rawScore += (competitor.capabilities[capId] ?? 0) * weight;
    totalWeight += weight;
  }
  const baseScore = totalWeight > 0 ? rawScore / totalWeight : 0;
  const qualityMult = getCompetitorRegionQuality(competitor, regionId);
  // ★ 渗透削弱：渗透等级 1→-5%, 2→-10%, 3→-15%
  const infiltrationPenalty = 1 - competitor.infiltrationLevel * 0.05;
  return baseScore * qualityMult * infiltrationPenalty;
}

// ============================================================
// 市场份额与收入
// ============================================================

export interface RegionMarketResult {
  regionId: string;
  regionName: string;
  /** 可寻址用户（百万） */
  addressableUsers: number;
  /** 总 TAM（百万美元/天） */
  totalTAM: number;
  /** 玩家市场份额 */
  marketShare: number;
  /** 玩家日收入（美元） */
  dailyRevenue: number;
  /** 竞争对手列表及份额 */
  competitors: { name: string; share: number; capabilityScore: number }[];
  /** token 单价（美元/1M tokens） */
  pricePerMillion: number;
}

export function calcRegionMarket(
  regionId: RegionId,
  models: Model[],
  operatingRegionIds: string[],
): RegionMarketResult | null {
  const region = REGION_MAP[regionId];
  if (!region) return null;

  // 只在已运营地区有收入
  if (!operatingRegionIds.includes(regionId)) {
    return {
      regionId,
      regionName: region.name,
      addressableUsers: 0,
      totalTAM: 0,
      marketShare: 0,
      dailyRevenue: 0,
      competitors: [],
      pricePerMillion: 0,
    };
  }

  const addressableUsers = region.population * (region.internetPenetration / 100);
  let totalTAM = 0;
  let playerWeightedScore = 0;
  let competitorWeightedScores: { name: string; score: number; share: number }[] = [];

  // 计算该地区活跃竞争者（使用实际状态）
  const activeCompetitors = getActiveCompetitors(currentCompetitorStates).filter((c) =>
    c.operatingRegions.includes(regionId),
  );

  for (const seg of MARKET_SEGMENTS) {
    const segTAM =
      addressableUsers *
      seg.penetrationRate *
      seg.willingnessToPay *
      region.gdpPerCapita;
    totalTAM += segTAM;

    const playerScore = calcSegmentCapabilityScore(seg, models);
    playerWeightedScore += playerScore;

    for (const comp of activeCompetitors) {
      const compScore = calcCompetitorSegmentScore(comp, seg, regionId);
      // 累加到竞争者总分（稍后用于份额计算）
      const existing = competitorWeightedScores.find((c) => c.name === comp.name);
      if (existing) {
        existing.score += compScore;
      } else {
        competitorWeightedScores.push({ name: comp.name, score: compScore, share: 0 });
      }
    }
  }

  // 市场份额 = AI质量 / (AI质量 + Σ竞争者质量)
  const totalCompetitorScore = competitorWeightedScores.reduce((s, c) => s + c.score, 0);
  const denom = playerWeightedScore + totalCompetitorScore;
  const marketShare = denom > 0 ? playerWeightedScore / denom : 0;

  for (const c of competitorWeightedScores) {
    c.share = denom > 0 ? c.score / denom : 0;
  }

  const dailyRevenue = totalTAM * marketShare;

  // 竞争定价
  const maxCompAggression = activeCompetitors.reduce(
    (max, c) => Math.max(max, c.pricingAggressiveness),
    0,
  );
  const competitionFactor = 1 / (1 + 0.02 * activeCompetitors.length);
  const bestCap = models.length > 0
    ? Math.max(...models.map((m) => m.baseScore))
    : 100;
  const basePrice = Math.max(0.001, 0.05 - 0.0005 * Math.max(bestCap, maxCompAggression * 100));
  const pricePerMillion = basePrice * competitionFactor;

  return {
    regionId,
    regionName: region.name,
    addressableUsers,
    totalTAM,
    marketShare,
    dailyRevenue,
    competitors: competitorWeightedScores
      .map((c) => ({ name: c.name, share: c.share, capabilityScore: c.score }))
      .sort((a, b) => b.share - a.share),
    pricePerMillion,
  };
}

/** 计算所有已运营地区的总收入 */
export function calcTotalRevenue(
  operatingRegionIds: string[],
  models: Model[],
): { dailyRevenue: number; regionBreakdown: RegionMarketResult[] } {
  let dailyRevenue = 0;
  const regionBreakdown: RegionMarketResult[] = [];

  for (const rid of operatingRegionIds) {
    const result = calcRegionMarket(rid, models, operatingRegionIds);
    if (result) {
      dailyRevenue += result.dailyRevenue;
      regionBreakdown.push(result);
    }
  }

  return { dailyRevenue, regionBreakdown };
}

// ============================================================
// 公司估值
// ============================================================

/** 估值输入参数（设计 #8：前期主要靠融资，估值应反映"潜力"而非仅收入） */
export interface ValuationInput {
  /** 年收入（百万美元） */
  annualRevenue: number;
  /** 已发布模型的最佳能力分 */
  bestCapability: number;
  /** 总部地区 id */
  headquartersRegionId: string | null;
  /** 训练项目列表（含进度） */
  trainingProjects?: Array<{ computeTotal: number; computeRemaining: number; paramCount: number }>;
  /** 算力卡总 TFLOPS（resources['compute_power']） */
  totalComputeTFLOPS?: number;
  /** 员工总数 */
  employeeCount?: number;
}

/**
 * 计算公司估值（百万美元）
 *
 * ★ 设计 #8：前期主要靠融资
 *
 * 现实中 AI 初创公司估值主要基于：
 * 1. 已发布模型能力（capabilityPremium）
 * 2. 训练管线进度（trainingPipelinePremium）— 训练中的项目也是资产
 * 3. 算力规模（computePremium）— 反映公司硬实力
 * 4. 团队规模（teamPremium）— 人才是核心资产
 * 5. 年收入（revenueMultiple）— 后期才重要
 * 6. 地区溢价（regionPremium）— 高 GDP 地区融资环境好
 *
 * 前期收入为 0 时，估值仍可基于训练进度和算力规模达到合理水平，
 * 让玩家可以通过种子轮/VC 融资获得扩张资金。
 */
export function calcValuation(input: ValuationInput): number {
  const baseValuation = 50; // $50M 基础（降低，避免前期估值虚高）
  const revenueMultiple = 1 + input.annualRevenue / 10;
  const capabilityPremium = 1 + input.bestCapability / 1000;

  // 训练管线溢价：每个训练项目按进度贡献，参数量越大溢价越高
  let trainingPipelinePremium = 1.0;
  if (input.trainingProjects && input.trainingProjects.length > 0) {
    let pipelineBonus = 0;
    for (const proj of input.trainingProjects) {
      const progress = proj.computeTotal > 0
        ? Math.max(0, 1 - proj.computeRemaining / proj.computeTotal)
        : 0;
      // 70B 模型满进度贡献 +30%，按进度线性
      const projBonus = (proj.paramCount / 70) * 0.3 * progress;
      pipelineBonus += projBonus;
    }
    trainingPipelinePremium = 1 + Math.min(0.8, pipelineBonus); // 上限 +80%
  }

  // 算力规模溢价：每 1000 TFLOPS 贡献 +5%，上限 +50%
  const computePremium = input.totalComputeTFLOPS !== undefined
    ? 1 + Math.min(0.5, input.totalComputeTFLOPS / 1000 * 0.05)
    : 1.0;

  // 团队规模溢价：每人 +1%，上限 +30%
  const teamPremium = input.employeeCount !== undefined
    ? 1 + Math.min(0.3, input.employeeCount * 0.01)
    : 1.0;

  const region = input.headquartersRegionId ? REGION_MAP[input.headquartersRegionId] : null;
  const regionPremium = region
    ? 1 + (region.gdpPerCapita / 100000) * 0.5
    : 1.0;

  return baseValuation
    * revenueMultiple
    * capabilityPremium
    * trainingPipelinePremium
    * computePremium
    * teamPremium
    * regionPremium;
}

// ============================================================
// 用户流失计算
// ============================================================

export function calcUserChurn(
  downgradeLevel: number,
  ourBestCap: number,
): number {
  const baseChurn = 0.0007; // ~2% 月流失 / 30天
  const deceptionPenalty = 0.01 * downgradeLevel;

  // 竞争者影响（使用实际状态）
  const comps = getActiveCompetitors(currentCompetitorStates);
  const avgCompCap = comps.length > 0
    ? comps.reduce((s, c) => {
        const max = Math.max(...Object.values(c.capabilities));
        return s + max;
      }, 0) / comps.length
    : 500;

  // BUG-3 修复：clamp 上限 5%，防止 ourBestCap 极小时出现 >100% 流失率
  const competitorDefection = ourBestCap > 0
    ? Math.min(0.05, Math.max(0, 0.005 * (avgCompCap - ourBestCap) / ourBestCap))
    : 0.01;

  return baseChurn + deceptionPenalty + competitorDefection;
}
