/**
 * 能力维度配置
 *
 * 16维能力向量，分显性/隐性、正向/反向。
 * 每个维度有涌现阈值和上下文长度阈值。
 */

/** 能力维度 id */
export type CapabilityId =
  | 'world_knowledge'
  | 'coding_agent'
  | 'math_reasoning'
  | 'multilingual'
  | 'dialogue_fluency'
  | 'multimodal'
  | 'hallucination_rate'
  | 'self_correction'
  | 'research_taste'
  | 'pragmatic_inference'
  | 'creative_writing'
  | 'long_range_coherence'
  | 'metacognition'
  | 'sycophancy'
  | 'eval_awareness'
  | 'rsi_potential';

/** 能力维度配置 */
export interface CapabilityDef {
  id: CapabilityId;
  name: string;
  /** 显性（benchmark 可观测）还是隐性（需特殊测试） */
  visible: boolean;
  /** 是否反向维度（越低越好） */
  inverse: boolean;
  /** 基础观测噪声σ */
  baseNoiseSigma: number;
  /** 噪声下限（即使投入评估也无法低于） */
  minNoiseSigma: number;
  /** 主要受哪些数据领域影响 */
  primaryDataDomains: string[];
  /** 涌现阈值（基础性能分未达到时严重惩罚） */
  emergenceThreshold: number;
  /** 上下文长度阈值 n_i */
  contextThreshold: number;
}

export const CAPABILITIES: CapabilityDef[] = [
  // ===== 显性维度 =====
  {
    id: 'dialogue_fluency', name: '对话流畅度', visible: true, inverse: false,
    baseNoiseSigma: 15, minNoiseSigma: 5,
    primaryDataDomains: ['dialogue', 'web'],
    emergenceThreshold: 600, contextThreshold: 2048,
  },
  {
    id: 'world_knowledge', name: '世界知识', visible: true, inverse: false,
    baseNoiseSigma: 15, minNoiseSigma: 5,
    primaryDataDomains: ['web', 'books', 'science'],
    emergenceThreshold: 900, contextThreshold: 8192,
  },
  {
    id: 'math_reasoning', name: '数学与推理', visible: true, inverse: false,
    baseNoiseSigma: 10, minNoiseSigma: 4,
    primaryDataDomains: ['math'],
    emergenceThreshold: 1100, contextThreshold: 16384,
  },
  {
    id: 'coding_agent', name: 'Coding/Agent', visible: true, inverse: false,
    baseNoiseSigma: 15, minNoiseSigma: 5,
    primaryDataDomains: ['code'],
    emergenceThreshold: 1100, contextThreshold: 32768,
  },
  {
    id: 'multilingual', name: '多语言', visible: true, inverse: false,
    baseNoiseSigma: 15, minNoiseSigma: 5,
    primaryDataDomains: ['multilingual'],
    emergenceThreshold: 1100, contextThreshold: 16384,
  },
  {
    id: 'multimodal', name: '多模态', visible: true, inverse: false,
    baseNoiseSigma: 15, minNoiseSigma: 6,
    primaryDataDomains: ['multimodal'],
    emergenceThreshold: 1500, contextThreshold: 1048576,
  },
  {
    id: 'hallucination_rate', name: '幻觉率', visible: true, inverse: true,
    baseNoiseSigma: 15, minNoiseSigma: 5,
    primaryDataDomains: ['web', 'books'],
    emergenceThreshold: 600, contextThreshold: 8192,
  },
  // ===== 隐性维度 =====
  {
    id: 'self_correction', name: '自我纠错', visible: false, inverse: false,
    baseNoiseSigma: 40, minNoiseSigma: 15,
    primaryDataDomains: ['rl_data', 'user_feedback'],
    emergenceThreshold: 1500, contextThreshold: 65536,
  },
  {
    id: 'research_taste', name: '科研品味', visible: false, inverse: false,
    baseNoiseSigma: 50, minNoiseSigma: 20,
    primaryDataDomains: ['science', 'books'],
    emergenceThreshold: 1700, contextThreshold: 131072,
  },
  {
    id: 'pragmatic_inference', name: '语用推断', visible: false, inverse: false,
    baseNoiseSigma: 40, minNoiseSigma: 15,
    primaryDataDomains: ['dialogue', 'books'],
    emergenceThreshold: 1400, contextThreshold: 65536,
  },
  {
    id: 'creative_writing', name: '创意写作', visible: false, inverse: false,
    baseNoiseSigma: 50, minNoiseSigma: 20,
    primaryDataDomains: ['books', 'dialogue'],
    emergenceThreshold: 1300, contextThreshold: 32768,
  },
  {
    id: 'long_range_coherence', name: '长程一致性', visible: false, inverse: false,
    baseNoiseSigma: 35, minNoiseSigma: 12,
    primaryDataDomains: ['books', 'science'],
    emergenceThreshold: 1750, contextThreshold: 131072,
  },
  {
    id: 'metacognition', name: '元认知', visible: false, inverse: false,
    baseNoiseSigma: 45, minNoiseSigma: 18,
    primaryDataDomains: ['rl_data', 'science'],
    emergenceThreshold: 1700, contextThreshold: 131072,
  },
  {
    id: 'sycophancy', name: '谄媚/欺骗性', visible: false, inverse: true,
    baseNoiseSigma: 40, minNoiseSigma: 15,
    primaryDataDomains: ['user_feedback', 'dialogue'],
    emergenceThreshold: 1000, contextThreshold: 8192,
  },
  {
    id: 'eval_awareness', name: '评估意识', visible: false, inverse: true,
    baseNoiseSigma: 50, minNoiseSigma: 20,
    primaryDataDomains: ['web', 'code'],
    emergenceThreshold: 1200, contextThreshold: 16384,
  },
  {
    id: 'rsi_potential', name: 'RSI潜力', visible: false, inverse: false,
    baseNoiseSigma: 60, minNoiseSigma: 25,
    primaryDataDomains: ['rl_data', 'science', 'code'],
    emergenceThreshold: 2200, contextThreshold: 4194304,
  },
];

export const CAPABILITY_MAP: Record<CapabilityId, CapabilityDef> =
  Object.fromEntries(CAPABILITIES.map((c) => [c.id, c])) as Record<CapabilityId, CapabilityDef>;

/**
 * 能力值反转基准（inverse 维度专用）
 *
 * BUG 修复：hallucination_rate / sycophancy / eval_awareness 等 inverse=true 维度
 * 语义为"越低越好"，但能力计算把它们当正向维度处理（值越大评分越高）。
 * 统一在评分/风险/市场等"比较大小"的场景用此函数取有效值：
 *   正向维度 → 原值
 *   反向维度 → INVERSE_CAP_BASE - 原值（值越小，有效值越高）
 *
 * 基准取 2000（能力值实际量级约 0~2500，2000 可保证有效值非负且单调）。
 */
export const INVERSE_CAP_BASE = 2000;

/** 取某能力维度的"有效值"（用于评分、排名、最大值比较） */
export function effectiveCapabilityValue(capId: CapabilityId, rawValue: number): number {
  const def = CAPABILITY_MAP[capId];
  if (def && def.inverse) {
    return Math.max(0, INVERSE_CAP_BASE - rawValue);
  }
  return rawValue;
}

/** 该维度是否为反向维度（越低越好） */
export function isInverseCapability(capId: CapabilityId): boolean {
  return CAPABILITY_MAP[capId]?.inverse ?? false;
}
