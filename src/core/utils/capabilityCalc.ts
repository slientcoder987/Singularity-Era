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
  /** A 系数，默认 1.5 */
  A: number;
  /** B 系数，默认 1.5 */
  B: number;
  /** α 指数，默认 0.3 */
  alpha: number;
  /** β 指数，默认 0.3 */
  beta: number;
}

/** 默认参数（经数值校准：7B+初始数据→约650分） */
export const DEFAULT_BASE_SCORE_PARAMS: BaseScoreParams = {
  E: 1,
  A: 1.5,
  B: 1.5,
  alpha: 0.333,
  beta: 0.333,
};

/**
 * 计算基础性能分
 * score = -log(1 - E/(E + A/N^α + B/D^β)) × 1000
 *
 * @param paramCount N，参数量（亿）
 * @param effectiveTokens D，有效 token 数（十亿）
 * @param params 基础性能分参数
 */
export function calcBaseScore(
  paramCount: number,
  effectiveTokens: number,
  params: BaseScoreParams = DEFAULT_BASE_SCORE_PARAMS,
): number {
  const { E, A, B, alpha, beta } = params;
  const nTerm = A / Math.pow(Math.max(paramCount, 0.01), alpha);
  const dTerm = B / Math.pow(Math.max(effectiveTokens, 0.01), beta);
  const denom = E + nTerm + dTerm;
  const ratio = E / denom;
  if (ratio >= 1) return 9999;
  if (ratio <= 0) return 0;
  return -Math.log(1 - ratio) * 1000;
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
  const ratio = Math.log(contextLength) / Math.log(threshold);
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
 * 流程：baseScore → 涌现惩罚 → 上下文影响 → 数据质量 → 架构加成 → 技术加成
 */
export function calculateCapabilities(
  baseScore: number,
  contextLength: number,
  dataset: Dataset,
  archMatrix: Record<string, Partial<Record<CapabilityId, number>>>,
  unlockedTechs: string[],
  techEffects: TechEffect[],
): CapabilityVector {
  const result = {} as CapabilityVector;
  const capabilityBonuses = collectCapabilityBonuses(techEffects);

  for (const def of CAPABILITIES) {
    // 1. 涌现惩罚
    const effectiveBase = calcEmergencePenalty(baseScore, def.emergenceThreshold);

    // 2. 上下文影响
    const ctxFactor = calcContextFactor(contextLength, def.contextThreshold);

    // 3. 数据质量加成
    const dataBonus = calcDataQualityBonus(def, dataset);

    // 4. 架构加成
    let archBonus = 1.0;
    for (const techId of unlockedTechs) {
      const archEntry = archMatrix[techId];
      if (archEntry && archEntry[def.id]) {
        archBonus += archEntry[def.id]!;
      }
    }

    // 5. 技术直接加成
    let techBonus = 1.0;
    if (capabilityBonuses[def.id]) {
      techBonus += capabilityBonuses[def.id]!;
    }

    // 6. 最终能力
    const capability = effectiveBase * ctxFactor * dataBonus * archBonus * techBonus;
    result[def.id] = Math.max(0, capability);
  }

  return result;
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
 * 获取所有能力的观测值（带噪声）
 */
export function observeCapabilities(
  model: { capabilities: CapabilityVector; evaluationResearchers: number; daysSincePublished: number },
  rng: () => number = Math.random,
): Record<CapabilityId, number> {
  const observed = {} as Record<CapabilityId, number>;
  for (const def of CAPABILITIES) {
    const trueValue = model.capabilities[def.id];
    const sigma = calcNoiseSigma(def, model.evaluationResearchers, model.daysSincePublished);
    observed[def.id] = observeWithNoise(trueValue, sigma, rng);
  }
  return observed;
}
