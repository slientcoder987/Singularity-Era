/**
 * 研发流程计算工具
 *
 * 实验验证成本与噪声、实验结果聚合。
 */
import type { ExperimentResult } from '../entities/ResearchProject';
import type { CapabilityId } from '../config/capabilities';
import type { ArchMatrix } from '../config/archEffects';
import { EXPERIMENT_VALIDATION } from '../config/researchConfig';

/**
 * 计算实验验证的算力成本
 */
export function calcExperimentCost(mainModelParams: number, scale: 'small' | 'medium'): number {
  const ratio = scale === 'small'
    ? EXPERIMENT_VALIDATION.smallExperimentRatio
    : EXPERIMENT_VALIDATION.mediumExperimentRatio;
  return mainModelParams * ratio;
}

/**
 * 运行实验，推断架构-能力映射
 *
 * 返回带噪声的估计值。多次实验可收敛到真实值。
 *
 * @param techMaturity 该架构技术的当前成熟度（0~100）
 *   - 已解锁技术复测：噪声降低（最高 -50%），代表对已验证架构的实验更精确
 *   - maturity ≥ 50：置信度 +0.1；maturity ≥ 100：置信度 +0.2
 */
export function runExperiment(
  archTechId: string,
  archMatrix: ArchMatrix,
  scale: 'small' | 'medium',
  confidenceBonus: number = 0,
  techMaturity: number = 0,
): ExperimentResult {
  const trueBonuses = archMatrix[archTechId] ?? {};
  const baseNoiseSigma = scale === 'small'
    ? EXPERIMENT_VALIDATION.smallNoiseSigma
    : EXPERIMENT_VALIDATION.mediumNoiseSigma;
  // 已解锁技术做实验：噪声降低（最高 -50%），代表"对已验证架构的复测更精确"
  const noiseSigma = baseNoiseSigma * (1 - Math.min(0.5, techMaturity / 200));
  const modelScale = scale === 'small'
    ? EXPERIMENT_VALIDATION.smallModelScale
    : EXPERIMENT_VALIDATION.mediumModelScale;

  const estimatedBonuses: Partial<Record<string, number>> = {};
  for (const capId of Object.keys(trueBonuses) as CapabilityId[]) {
    const trueValue = trueBonuses[capId] ?? 0;
    // Box-Muller 正态分布噪声
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    estimatedBonuses[capId] = trueValue + z * noiseSigma;
  }

  // maturity 加成置信度：已成熟技术做实验结论更可靠
  let matConfBonus = 0;
  if (techMaturity >= 100) matConfBonus = 0.2;
  else if (techMaturity >= 50) matConfBonus = 0.1;

  return {
    archTechId,
    estimatedBonuses,
    confidence: Math.max(0.1, Math.min(1, (1 - noiseSigma) + confidenceBonus + matConfBonus)),
    modelScale,
    date: 0,
  };
}

/**
 * 聚合同一架构的多次实验结果，返回加权平均估计
 */
export function aggregateExperiments(
  experiments: ExperimentResult[],
  archTechId: string,
): Partial<Record<string, number>> {
  const exps = experiments.filter((e) => e.archTechId === archTechId);
  if (exps.length === 0) return {};

  const capIds = new Set(exps.flatMap((e) => Object.keys(e.estimatedBonuses)));
  const result: Partial<Record<string, number>> = {};

  for (const capId of capIds) {
    let weightedSum = 0;
    let weightSum = 0;
    for (const exp of exps) {
      const val = exp.estimatedBonuses[capId];
      if (val !== undefined) {
        weightedSum += val * exp.confidence;
        weightSum += exp.confidence;
      }
    }
    if (weightSum > 0) {
      result[capId] = weightedSum / weightSum;
    }
  }

  return result;
}
