/**
 * 市场计算工具
 *
 * 计算每个地区的市场份额、收入和竞争定价。
 */
import type { Model } from '../entities/Model';
import type { CompetitorState } from '../entities/Competitor';
import { COMPETITOR_TEMPLATES } from '../entities/Competitor';
import { REGION_MAP, type RegionId } from '../config/regions';

/** 将模板转换为轻量竞争信息（兼容 marketCalc） */
function getActiveCompetitors(
  competitorStates?: CompetitorState[],
): CompetitorState[] {
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

  // 计算该地区活跃竞争者
  const activeCompetitors = getActiveCompetitors().filter((c) =>
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

export function calcValuation(
  annualRevenue: number,
  bestCapability: number,
  headquartersRegionId: string | null,
): number {
  const baseValuation = 100; // $100M 基础
  const revenueMultiple = 1 + annualRevenue / 10;
  const capabilityPremium = 1 + bestCapability / 1000;
  const region = headquartersRegionId ? REGION_MAP[headquartersRegionId] : null;
  const regionPremium = region
    ? 1 + (region.gdpPerCapita / 100000) * 0.5 // 高GDP地区溢价
    : 1.0;

  return baseValuation * revenueMultiple * capabilityPremium * regionPremium;
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

  // 竞争者影响
  const avgCompCap = getActiveCompetitors().reduce((s, c) => {
    const max = Math.max(...Object.values(c.capabilities));
    return s + max;
  }, 0) / getActiveCompetitors().length;

  const competitorDefection = ourBestCap > 0
    ? Math.max(0, 0.005 * (avgCompCap - ourBestCap) / ourBestCap)
    : 0.01;

  return baseChurn + deceptionPenalty + competitorDefection;
}
