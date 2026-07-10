/**
 * 架构-能力映射矩阵
 *
 * 每局开始时根据种子生成，主流架构有固定效果范围，
 * 玩家通过实验训练来推断映射。
 */
import type { CapabilityId } from './capabilities';

/** 架构对能力的加成矩阵 */
export type ArchMatrix = Record<string, Partial<Record<CapabilityId, number>>>;

/** 简单种子伪随机 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 生成一局的架构-能力映射矩阵
 *
 * 主流架构（RoPE, MoE, SwiGLU）有固定效果范围（局间随机具体值）
 */
export function generateArchMatrix(seed: number): ArchMatrix {
  const rng = mulberry32(seed);
  const matrix: ArchMatrix = {};

  // RoPE：长程能力大幅提升
  matrix['rope'] = {
    long_range_coherence: 0.2 + rng() * 0.1,
    metacognition: 0.1 + rng() * 0.05,
  };

  // MoE：知识容量类提升
  matrix['moe'] = {
    world_knowledge: 0.15 + rng() * 0.1,
    multilingual: 0.1 + rng() * 0.08,
  };

  // SwiGLU：轻微整体质量提升
  matrix['swiglu'] = {
    dialogue_fluency: 0.03 + rng() * 0.02,
    creative_writing: 0.02 + rng() * 0.02,
  };

  return matrix;
}
