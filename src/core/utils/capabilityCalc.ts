/**
 * 能力向量计算
 *
 * 包含基础性能分、上下文影响、涌现惩罚、数据质量加成、架构加成。
 */
import type { CapabilityId, CapabilityDef } from '../config/capabilities';
import { CAPABILITIES } from '../config/capabilities';
import type { CapabilityVector } from '../entities/Model';
import type { Dataset } from '../entities/Dataset';
import type { TechEffect } from '../entities/Infrastructure';

/** 基础性能分计算参数 */
export interface BaseScoreParams {
  /** E 系数，默认 1 */
  E: number;
  /** A 系数，默认 1500（已按原始参数量标定） */
  A: number;
  /** B 系数，默认 1500（已按原始 token 数标定） */
  B: number;
  /** α 指数，默认 1/3 */
  alpha: number;
  /** β 指数，默认 1/3 */
  beta: number;
}

/** 默认参数（经数值校准：7B+初始数据→约670分） */
export const DEFAULT_BASE_SCORE_PARAMS: BaseScoreParams = {
  E: 1,
  A: 400,
  B: 400,
  alpha: 1 / 3,
  beta: 1 / 3,
};

/**
 * 计算基础性能分（Chinchilla 缩放定律）
 * score = -log(1 - E/(E + A/N^α + B/D^β)) × 1000
 *
 * @param paramCount   N，参数量（原始个数，如 7B → 7000000000）
 * @param effectiveTokens D，有效 token 数（原始个数）
 * @param params 基础性能分参数
 */
export function calcBaseScore(
  paramCount: number,
  effectiveTokens: number,
  params: BaseScoreParams = DEFAULT_BASE_SCORE_PARAMS,
): number {
  const { E, A, B, alpha, beta } = params;
  const nTerm = A / Math.pow(Math.max(paramCount, 1), alpha);
  const dTerm = B / Math.pow(Math.max(effectiveTokens, 1), beta);
  const denom = E + nTerm + dTerm;
  const ratio = E / denom;
  if (ratio >= 1) return 9999;
  if (ratio <= 0) return 0;
  return -Math.log10(1 - ratio) * 1000;
}

/**
 * 从科技效果推导基础性能分参数
 */
export function deriveBaseScoreParams(effects: TechEffect[]): BaseScoreParams {
  let p = { ...DEFAULT_BASE_SCORE_PARAMS };
  for (const eff of effects) {
    switch (eff.type) {
      case 'modify_base_score_E':
        p.E += eff.value;
        break;
      case 'modify_base_score_A':
        p.A += eff.value;
        break;
      case 'modify_base_score_B':
        p.B += eff.value;
        break;
      case 'modify_alpha':
        p.alpha += eff.value;
        break;
      case 'modify_beta':
        p.beta += eff.value;
        break;
    }
  }
  p.E = Math.max(0.1, p.E);
  p.A = Math.max(0.1, p.A);
  p.B = Math.max(0.1, p.B);
  return p;
}

/**
 * 计算上下文长度对能力的影响因子
 *
 * factor = (log(n) / log(n_i))^x
 * x = 1.25 当 n < n_i（未达阈值快速衰减）
 * x = 0.25 当 n >= n_i（达到阈值后缓慢提升）
 */
export function calcContextFactor(contextLength: number, threshold: number): number {
  if (contextLength <= 1) return 0;
  if (threshold <= 1) return 1;
  const x = contextLength < threshold ? 1.25 : 0.25;
  const ratio = Math.log10(contextLength) / Math.log10(threshold);
  return Math.pow(Math.max(ratio, 0), x);
}

/**
 * 计算涌现阈值惩罚
 *
 * 未达阈值时：effectiveBase = baseScore × (baseScore / threshold)^5
 */
export function calcEmergencePenalty(baseScore: number, threshold: number): number {
  if (baseScore >= threshold) return baseScore;
  if (baseScore <= 0) return 0;
  return baseScore * Math.pow(baseScore / threshold, 5);
}

/**
 * 计算数据领域对特定能力的质量加成
 *
 * 返回 0.5-1.5 的乘数
 * - 无相关数据：0.5（严重惩罚）
 * - 平均质量 0.5：1.0（基准）
 * - 平均质量 1.0：1.5（加成）
 */
export function calcDataQualityBonus(capability: CapabilityDef, dataset: Dataset): number {
  let totalTokens = 0;
  let weightedQuality = 0;
  for (const domainId of capability.primaryDataDomains) {
    const domain = dataset.domains[domainId as keyof typeof dataset.domains];
    if (!domain) continue;
    const effectiveTokens = domain.tokens * (1 - domain.duplication);
    totalTokens += effectiveTokens;
    weightedQuality += effectiveTokens * domain.quality;
  }
  if (totalTokens === 0) return 0.5;
  const avgQuality = weightedQuality / totalTokens;
  return 0.5 + avgQuality;
}

/**
 * 从科技效果中收集能力直接加成
 */
function collectCapabilityBonuses(effects: TechEffect[]): Partial<Record<CapabilityId, number>> {
  const bonuses: Partial<Record<CapabilityId, number>> = {};
  for (const eff of effects) {
    if (eff.type === 'capability_bonus') {
      const capId = eff.capability as CapabilityId;
      bonuses[capId] = (bonuses[capId] ?? 0) + eff.bonus;
    }
  }
  return bonuses;
}

/**
 * 计算模型完整能力向量
 *
 * 流程：baseScore → 上下文影响 → 数据质量 → 架构加成 → 技术加成 → 涌现惩罚
 *
 * 返回 { capabilities（涌现惩罚后）, rawCapabilities（涌现惩罚前，用于UI判断涌现） }
 */
export function calculateCapabilities(
  baseScore: number,
  contextLength: number,
  dataset: Dataset,
  archMatrix: Record<string, Partial<Record<CapabilityId, number>>>,
  unlockedTechs: string[],
  techEffects: TechEffect[],
): { capabilities: CapabilityVector; rawCapabilities: CapabilityVector } {
  const capabilities = {} as CapabilityVector;
  const rawCapabilities = {} as CapabilityVector;
  const capabilityBonuses = collectCapabilityBonuses(techEffects);

  for (const def of CAPABILITIES) {
    // 1. 上下文影响
    const ctxFactor = calcContextFactor(contextLength, def.contextThreshold);

    // 2. 数据质量加成
    const dataBonus = calcDataQualityBonus(def, dataset);

    // 3. 架构加成
    let archBonus = 1.0;
    for (const techId of unlockedTechs) {
      const archEntry = archMatrix[techId];
      if (archEntry && archEntry[def.id]) {
        archBonus += archEntry[def.id]!;
      }
    }

    // 4. 技术直接加成
    let techBonus = 1.0;
    if (capabilityBonuses[def.id]) {
      techBonus += capabilityBonuses[def.id]!;
    }

    // 5. 加总后能力（涌现惩罚前）
    const rawCapability = baseScore * ctxFactor * dataBonus * archBonus * techBonus;

    // 6. 涌现惩罚（最后一步，对所有加成之后的总分做惩罚）
    const capability = calcEmergencePenalty(rawCapability, def.emergenceThreshold);
    rawCapabilities[def.id] = Math.max(0, rawCapability);
    capabilities[def.id] = Math.max(0, capability);
  }

  return { capabilities, rawCapabilities };
}

/**
 * Box-Muller 变换生成正态分布噪声
 */
export function observeWithNoise(
  trueValue: number,
  noiseSigma: number,
  rng: () => number = Math.random,
): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return trueValue + z * noiseSigma;
}

/**
 * 计算当前观测噪声 σ
 *
 * baseSigma - 研究员降噪 - 社区反馈降噪
 */
export function calcNoiseSigma(
  def: CapabilityDef,
  evaluationResearchers: number,
  daysSincePublished: number,
): number {
  const researcherReduction = evaluationResearchers * 2;
  const communityReduction = Math.floor(daysSincePublished / 7) * 3;
  return Math.max(def.minNoiseSigma, def.baseNoiseSigma - researcherReduction - communityReduction);
}

/**
 * 简易哈希 RNG（Mulberry32），基于种子生成确定性随机序列。
 * 确保同一模型在每次渲染中展示一致的观测值。
 */
export function createSeededRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 获取所有能力的观测值（带噪声）
 *
 * @param model       模型能力数据
 * @param noiseSeed   噪声种子，基于模型 ID 的确定性值
 */
export function observeCapabilities(
  model: { capabilities: CapabilityVector; evaluationResearchers: number; daysSincePublished: number },
  noiseSeed: number,
): Record<CapabilityId, number> {
  const rng = createSeededRng(noiseSeed);
  const observed = {} as Record<CapabilityId, number>;
  for (const def of CAPABILITIES) {
    const trueValue = model.capabilities[def.id];
    const sigma = calcNoiseSigma(def, model.evaluationResearchers, model.daysSincePublished);
    observed[def.id] = observeWithNoise(trueValue, sigma, rng);
  }
  return observed;
}

/**
 * Chinchilla 缩放定律 — 训练所需算力计算
 *
 * 公式：
 *   d = 2 × N^(1/3)                        (临界序列深度)
 *   FLOPs = 6 × N × D × (1 + n/(4d))        (带长序列修正的总算力)
 *   computeDays = FLOPs / (10^12 × 86400)    (转换为 TFLOPS·天)
 *
 * @param paramCount     N，参数量（原始个数，如 7B → 7,000,000,000）
 * @param trainingTokens D，训练 token 数（原始个数）
 * @param contextLength  n，上下文长度（token 数）
 * @returns 训练所需总算力，单位 TFLOPS·天
 */
export function calcTrainingCompute(
  paramCount: number,
  trainingTokens: number,
  contextLength: number,
): number {
  const d = 2 * Math.pow(paramCount, 1 / 3);
  const flops = 6 * paramCount * trainingTokens * (1 + contextLength / (4 * d));
  return flops / (1e12 * 86400);
}
