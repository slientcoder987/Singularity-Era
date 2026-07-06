/**
 * 架构选项与架构-能力映射矩阵
 *
 * 每局生成随机的"架构-能力映射矩阵"。
 * 同样的架构改动在不同局可能提升不同维度。
 * 玩家需通过实验、社区反馈推断本局映射。
 *
 * 设计：部分固定 + 部分随机
 */

import type { CapabilityDim } from './capabilityDims';

/** 架构选项 */
export interface ArchitectureOption {
  id: string;
  name: string;
  category: 'dense' | 'moe' | 'attention' | 'precision' | 'multimodal';
  description: string;
  /** 固定效果（每局相同）：维度 → 乘数 0.5-2.0 */
  fixedEffects: Partial<Record<CapabilityDim, number>>;
  /** 是否有随机效果（每局随机生成） */
  hasRandomEffects: boolean;
  /** 随机效果的候选维度池 */
  randomEffectPool?: CapabilityDim[];
  /** 参数量影响因子（1.0 = 标准） */
  paramScaleFactor: number;
  /** 显存开销因子（1.0 = 标准） */
  memoryOverhead: number;
  /** 训练稳定性影响（-0.2 ~ +0.2） */
  stabilityImpact: number;
  /** 前置科技（P0 为 undefined 表示无前置） */
  requiredTech?: string;
}

export const ARCHITECTURES: ArchitectureOption[] = [
  {
    id: 'dense_standard',
    name: '标准 Dense',
    category: 'dense',
    description: '标准密集 Transformer 架构',
    fixedEffects: {},
    hasRandomEffects: false,
    paramScaleFactor: 1.0,
    memoryOverhead: 1.0,
    stabilityImpact: 0,
  },
  {
    id: 'dense_gqa',
    name: 'GQA 注意力',
    category: 'attention',
    description: '分组查询注意力，降低 KV cache 开销',
    fixedEffects: { multilingual: 1.1 },
    hasRandomEffects: true,
    randomEffectPool: ['coding_agent', 'math_reasoning', 'dialogue_fluency'],
    paramScaleFactor: 0.95,
    memoryOverhead: 0.9,
    stabilityImpact: 0.02,
  },
  {
    id: 'moe_standard',
    name: '标准 MoE',
    category: 'moe',
    description: '混合专家模型，稀疏激活提升总参数量',
    fixedEffects: { world_knowledge: 1.3 },
    hasRandomEffects: true,
    randomEffectPool: ['coding_agent', 'math_reasoning', 'creative_writing'],
    paramScaleFactor: 1.5,
    memoryOverhead: 1.3,
    stabilityImpact: -0.05,
    requiredTech: 'moe',
  },
  {
    id: 'long_context',
    name: '长上下文优化',
    category: 'attention',
    description: '优化注意力机制以支持更长上下文',
    fixedEffects: { long_range_consistency: 1.2 },
    hasRandomEffects: false,
    paramScaleFactor: 1.1,
    memoryOverhead: 1.2,
    stabilityImpact: -0.03,
  },
  {
    id: 'linear_attn',
    name: '线性注意力',
    category: 'attention',
    description: '线性注意力降低长序列计算开销',
    fixedEffects: { multilingual: 0.9 },
    hasRandomEffects: true,
    randomEffectPool: ['math_reasoning', 'world_model', 'pragmatic_inference'],
    paramScaleFactor: 0.85,
    memoryOverhead: 0.7,
    stabilityImpact: -0.08,
  },
];

const ARCH_MAP = new Map(ARCHITECTURES.map((a) => [a.id, a]));
export function getArchitecture(id: string): ArchitectureOption | undefined {
  return ARCH_MAP.get(id);
}

/** P0 可用架构（排除需前置科技的） */
export const AVAILABLE_ARCHITECTURES = ARCHITECTURES.filter((a) => !a.requiredTech);

/**
 * 每局生成的架构-能力映射矩阵
 * key = architectureId, value = 该架构对每维的乘数
 */
export type ArchCapabilityMatrix = Record<string, Partial<Record<CapabilityDim, number>>>;

/** 简单确定性随机数生成器（基于 seed） */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}

/**
 * 生成新局的随机架构-能力映射矩阵。
 * 固定效果直接使用，随机效果从候选池随机选 1-2 个维度并赋乘数。
 */
export function generateArchMatrix(seed?: number): ArchCapabilityMatrix {
  const rng = seededRandom(seed ?? Date.now() % 1000000);
  const matrix: ArchCapabilityMatrix = {};

  for (const arch of ARCHITECTURES) {
    const effects: Partial<Record<CapabilityDim, number>> = { ...arch.fixedEffects };

    if (arch.hasRandomEffects && arch.randomEffectPool && arch.randomEffectPool.length > 0) {
      // 从候选池随机选 1-2 个维度
      const pool = [...arch.randomEffectPool];
      const count = Math.min(pool.length, 1 + Math.floor(rng() * 2));
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(rng() * pool.length);
        const dim = pool.splice(idx, 1)[0];
        // 随机乘数：0.7 ~ 1.5
        const multiplier = 0.7 + rng() * 0.8;
        effects[dim] = multiplier;
      }
    }

    matrix[arch.id] = effects;
  }

  return matrix;
}

/**
 * 获取某架构对某维度的乘数。
 * 未在矩阵中记录的维度默认 1.0。
 */
export function getArchMultiplier(
  matrix: ArchCapabilityMatrix,
  archId: string,
  dim: CapabilityDim,
): number {
  return matrix[archId]?.[dim] ?? 1.0;
}

/**
 * 获取多个架构叠加后对某维度的总乘数。
 * 简化：直接相乘。
 */
export function getCombinedArchMultiplier(
  matrix: ArchCapabilityMatrix,
  archIds: string[],
  dim: CapabilityDim,
): number {
  let mul = 1.0;
  for (const id of archIds) {
    mul *= getArchMultiplier(matrix, id, dim);
  }
  return mul;
}
