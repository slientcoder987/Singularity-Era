/**
 * 数据因子计算
 *
 * 根据数据集组合与训练阶段，计算对训练的影响因子。
 */

import type { Dataset, DataDomain } from '../entities/Dataset';
import type { TrainingStageId } from '../config/trainingStages';
import type { CapabilityDim } from '../config/capabilityDims';

/** 数据因子计算结果 */
export interface DataFactorResult {
  /** 质量因子 0.5-1.5（影响能力提升速率） */
  qualityFactor: number;
  /** 多样性因子 0.5-1.5（影响隐性维度提升） */
  diversityFactor: number;
  /** 时效性因子 0.7-1.0（旧数据效率降低） */
  freshnessFactor: number;
  /** 各领域覆盖权重（影响对应维度加成） */
  domainCoverage: Partial<Record<DataDomain, number>>;
}

/** 阶段-领域权重表：不同阶段对不同领域数据有偏好 */
const STAGE_DOMAIN_WEIGHTS: Record<TrainingStageId, Partial<Record<DataDomain, number>>> = {
  pretrain: { web: 1.2, code: 1.1, book: 1.1, science: 1.0, math: 1.0, dialogue: 0.8, safety: 0.5 },
  sft: { dialogue: 1.5, safety: 1.3, code: 1.0, web: 0.9, book: 0.8, math: 0.9, science: 0.9 },
  rlhf: { dialogue: 1.4, safety: 1.5, web: 0.9, code: 1.0, book: 0.8, math: 0.9, science: 0.9 },
  rl_cot: { math: 1.5, science: 1.3, code: 1.2, dialogue: 0.9, web: 0.8, book: 0.9, safety: 0.9 },
  latent_reasoning: { math: 1.4, science: 1.3, code: 1.1, web: 0.9, book: 1.0, dialogue: 0.9, safety: 0.9 },
  looped_reasoning: { math: 1.3, science: 1.2, code: 1.1, web: 0.9, book: 1.0, dialogue: 0.9, safety: 0.9 },
};

/** 能力维度 → 对应数据领域映射（用于 domainBoost） */
export const DIM_TO_DOMAIN: Partial<Record<CapabilityDim, DataDomain>> = {
  world_knowledge: 'web',
  coding_agent: 'code',
  math_reasoning: 'math',
  multilingual: 'web',
  dialogue_fluency: 'dialogue',
  creative_writing: 'book',
  pragmatic_inference: 'dialogue',
  long_range_consistency: 'book',
  research_taste: 'science',
  self_correction: 'math',
  metacognition: 'science',
};

/** 计算数据集组合的综合因子 */
export function computeDataFactor(
  datasets: Dataset[],
  stage: TrainingStageId,
): DataFactorResult {
  if (datasets.length === 0) {
    return { qualityFactor: 0.5, diversityFactor: 0.5, freshnessFactor: 0.7, domainCoverage: {} };
  }

  // 按 token 数加权平均
  const totalTokens = datasets.reduce((s, d) => s + d.tokensB, 0);
  const w = (d: Dataset) => d.tokensB / totalTokens;

  const quality = datasets.reduce((s, d) => s + d.quality * w(d), 0);
  const diversity = datasets.reduce((s, d) => s + d.diversity * w(d), 0);
  const freshness = datasets.reduce((s, d) => s + d.freshness * w(d), 0);

  // 领域覆盖
  const stageWeights = STAGE_DOMAIN_WEIGHTS[stage];
  const domainCoverage: Partial<Record<DataDomain, number>> = {};
  for (const d of datasets) {
    const weight = stageWeights[d.domain] ?? 1.0;
    domainCoverage[d.domain] = (domainCoverage[d.domain] ?? 0) + weight * w(d);
  }

  return {
    qualityFactor: 0.5 + (quality / 100) * 1.0, // 0.5-1.5
    diversityFactor: 0.5 + (diversity / 100) * 1.0,
    freshnessFactor: 0.7 + (freshness / 100) * 0.3,
    domainCoverage,
  };
}

/** 获取某维度对应的领域 boost（默认 1.0） */
export function getDimDomainBoost(
  factor: DataFactorResult,
  dim: CapabilityDim,
): number {
  const domain = DIM_TO_DOMAIN[dim];
  if (!domain) return 1.0;
  return factor.domainCoverage[domain] ?? 1.0;
}
