/**
 * Benchmark 评估与隐性维度信号
 */

import type { CapabilityVector, CapabilityDim } from '../config/capabilityDims';
import { getEffectiveValue, HIDDEN_DIMS } from '../config/capabilityDims';
import type { BenchmarkConfig } from '../config/benchmarks';
import { HIDDEN_DIM_SIGNAL_TEMPLATES, type SignalStrength } from '../config/benchmarks';

/** 单次 benchmark 评估结果 */
export interface BenchmarkResult {
  /** 关联模型 id */
  modelId: string;
  /** 模型名称 */
  modelName: string;
  /** benchmark id */
  benchmarkId: string;
  /** 观测分数（带噪声，0-100） */
  observedScore: number;
  /** 真实值（仅内部，不展示给玩家） */
  trueValue: number;
  /** 评估日期 */
  evalDate: number;
}

/** 简单高斯随机数（Box-Muller） */
function gaussianNoise(mean: number, std: number): number {
  const u1 = Math.random() || 0.0001;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

/**
 * 评估某模型在某 benchmark 上的表现。
 * 观测值 = 真实有效值 + 噪声
 */
export function evaluateBenchmark(
  modelId: string,
  modelName: string,
  capabilities: CapabilityVector,
  benchmark: BenchmarkConfig,
  evalDate: number,
): BenchmarkResult {
  const trueValue = getEffectiveValue(capabilities, benchmark.measuresDim);
  const observedScore = Math.max(0, Math.min(100, gaussianNoise(trueValue, benchmark.noiseStd)));
  return {
    modelId,
    modelName,
    benchmarkId: benchmark.id,
    observedScore,
    trueValue,
    evalDate,
  };
}

/** 隐性维度模糊信号 */
export interface HiddenDimSignal {
  /** 触发日期 */
  date: number;
  /** 关联模型 id */
  modelId: string;
  /** 维度名 */
  dim: CapabilityDim;
  /** 信号强度 */
  strength: SignalStrength;
  /** 信号文本描述 */
  hint: string;
}

/**
 * 根据隐性维度值生成模糊信号。
 * 仅生成"值得注意"的维度（值 > 30 或反向维度值 > 30 表示有问题）。
 */
export function generateHiddenDimSignals(
  modelId: string,
  capabilities: CapabilityVector,
  date: number,
  revealedDims: Set<CapabilityDim>,
): HiddenDimSignal[] {
  const signals: HiddenDimSignal[] = [];

  for (const dim of HIDDEN_DIMS) {
    const effective = getEffectiveValue(capabilities, dim);

    // 已解锁可见的维度：直接给出精确信号
    // 未解锁的：只有值足够高（或反向维度足够差）才给模糊信号
    let threshold: number;
    let strength: SignalStrength;

    if (revealedDims.has(dim)) {
      threshold = 10;
      if (effective >= 70) strength = 'strong';
      else if (effective >= 40) strength = 'medium';
      else strength = 'weak';
    } else {
      threshold = 30;
      if (effective >= 70) strength = 'strong';
      else if (effective >= 50) strength = 'medium';
      else continue; // 太低，不生成信号
    }

    if (effective < threshold) continue;

    const template = HIDDEN_DIM_SIGNAL_TEMPLATES[dim];
    if (!template) continue;

    signals.push({
      date,
      modelId,
      dim,
      strength,
      hint: template[strength],
    });
  }

  return signals;
}
