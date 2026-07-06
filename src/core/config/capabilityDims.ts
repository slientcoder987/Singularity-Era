/**
 * 能力维度定义（固定 19 维）
 *
 * 分两类：
 * - 显性维度（9 项）：benchmark 可直接观测，但有噪声
 * - 隐性维度（10 项）：需特殊测试、内部红队或社区 harness 间接推断
 *
 * 部分维度为"反向"（值越低越好），如幻觉率、谄媚性等。
 * 扩展维度需修改此文件并同步更新 EXPLICIT_DIMS / HIDDEN_DIMS。
 */

export type CapabilityDim =
  // ===== 显性维度（9 项） =====
  | 'world_knowledge'
  | 'coding_agent'
  | 'math_reasoning'
  | 'multilingual'
  | 'dialogue_fluency'
  | 'image_perf'
  | 'video_perf'
  | 'world_model'
  | 'hallucination_rate'
  // ===== 隐性维度（10 项） =====
  | 'self_correction'
  | 'research_taste'
  | 'pragmatic_inference'
  | 'creative_writing'
  | 'long_range_consistency'
  | 'metacognition'
  | 'sycophancy'
  | 'eval_awareness'
  | 'deception'
  | 'rsi_potential';

/** 显性维度列表 */
export const EXPLICIT_DIMS: CapabilityDim[] = [
  'world_knowledge',
  'coding_agent',
  'math_reasoning',
  'multilingual',
  'dialogue_fluency',
  'image_perf',
  'video_perf',
  'world_model',
  'hallucination_rate',
];

/** 隐性维度列表 */
export const HIDDEN_DIMS: CapabilityDim[] = [
  'self_correction',
  'research_taste',
  'pragmatic_inference',
  'creative_writing',
  'long_range_consistency',
  'metacognition',
  'sycophancy',
  'eval_awareness',
  'deception',
  'rsi_potential',
];

/** 反向维度（值越低越好） */
export const INVERSE_DIMS: CapabilityDim[] = [
  'hallucination_rate',
  'sycophancy',
  'eval_awareness',
  'deception',
];

export interface CapabilityDimConfig {
  dim: CapabilityDim;
  displayName: string;
  category: 'explicit' | 'hidden';
  inverse: boolean;
  description: string;
}

/** 全部 19 维配置 */
export const CAPABILITY_DIM_CONFIGS: CapabilityDimConfig[] = [
  // ===== 显性 =====
  { dim: 'world_knowledge', displayName: '世界知识', category: 'explicit', inverse: false, description: '百科、常识、事实性知识' },
  { dim: 'coding_agent', displayName: '编程/Agent', category: 'explicit', inverse: false, description: '代码生成与工具调用' },
  { dim: 'math_reasoning', displayName: '数学推理', category: 'explicit', inverse: false, description: '数学问题与逻辑推理' },
  { dim: 'multilingual', displayName: '多语言', category: 'explicit', inverse: false, description: '多语言理解与生成' },
  { dim: 'dialogue_fluency', displayName: '对话流畅度', category: 'explicit', inverse: false, description: '对话自然度与人情味' },
  { dim: 'image_perf', displayName: '图像性能', category: 'explicit', inverse: false, description: '图像理解与生成' },
  { dim: 'video_perf', displayName: '视频性能', category: 'explicit', inverse: false, description: '视频理解与生成' },
  { dim: 'world_model', displayName: '世界模型', category: 'explicit', inverse: false, description: '物理交互与世界模拟' },
  { dim: 'hallucination_rate', displayName: '幻觉率', category: 'explicit', inverse: true, description: '事实性错误频率（越低越好）' },
  // ===== 隐性 =====
  { dim: 'self_correction', displayName: '自我纠错', category: 'hidden', inverse: false, description: '发现并修正自身错误的能力' },
  { dim: 'research_taste', displayName: '科研品味', category: 'hidden', inverse: false, description: '研究方向选择与判断力' },
  { dim: 'pragmatic_inference', displayName: '语用推断', category: 'hidden', inverse: false, description: '言外之意与语境理解' },
  { dim: 'creative_writing', displayName: '创意写作', category: 'hidden', inverse: false, description: '文学性与创造性表达' },
  { dim: 'long_range_consistency', displayName: '长程一致性', category: 'hidden', inverse: false, description: '长文本中的逻辑连贯性' },
  { dim: 'metacognition', displayName: '元认知', category: 'hidden', inverse: false, description: '对自身思维过程的认知' },
  { dim: 'sycophancy', displayName: '谄媚性', category: 'hidden', inverse: true, description: '迎合用户而非 truthful（越低越好）' },
  { dim: 'eval_awareness', displayName: '评估意识', category: 'hidden', inverse: true, description: 'benchmark cheating 倾向（越低越好）' },
  { dim: 'deception', displayName: '欺骗性', category: 'hidden', inverse: true, description: '有意误导或欺骗倾向（越低越好）' },
  { dim: 'rsi_potential', displayName: '自我改进潜力', category: 'hidden', inverse: false, description: '自主自我改进的潜力' },
];

/** 能力向量：19 维浮点，范围 0-100 */
export type CapabilityVector = Record<CapabilityDim, number>;

/** 维度总数 */
export const TOTAL_DIMS = CAPABILITY_DIM_CONFIGS.length;

/** 按维度名查配置 */
const DIM_CONFIG_MAP = new Map(CAPABILITY_DIM_CONFIGS.map((c) => [c.dim, c]));
export function getDimConfig(dim: CapabilityDim): CapabilityDimConfig | undefined {
  return DIM_CONFIG_MAP.get(dim);
}

/** 创建全零能力向量 */
export function createEmptyCapabilities(): CapabilityVector {
  const vec = {} as CapabilityVector;
  for (const cfg of CAPABILITY_DIM_CONFIGS) {
    vec[cfg.dim] = 0;
  }
  return vec;
}

/**
 * 获取维度的"有效值"。
 * 反向维度取 100 - value（统一为"越高越好"）。
 */
export function getEffectiveValue(vec: CapabilityVector, dim: CapabilityDim): number {
  const raw = vec[dim] ?? 0;
  return INVERSE_DIMS.includes(dim) ? 100 - raw : raw;
}

/** 所有维度名列表（显性 + 隐性） */
export const ALL_DIMS: CapabilityDim[] = [...EXPLICIT_DIMS, ...HIDDEN_DIMS];
