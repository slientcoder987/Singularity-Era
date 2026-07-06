/**
 * Benchmark 定义
 *
 * benchmark 是能力投影，带噪声。
 * 玩家可被误导，也可主动污染它。
 */

import type { CapabilityDim } from './capabilityDims';

export interface BenchmarkConfig {
  id: string;
  name: string;
  /** 该 benchmark 测试的显性维度 */
  measuresDim: CapabilityDim;
  /** 噪声标准差 */
  noiseStd: number;
  /** 该 benchmark 的市场影响力（影响融资/用户） */
  marketWeight: number;
  description: string;
}

export const BENCHMARKS: BenchmarkConfig[] = [
  {
    id: 'mmlu',
    name: 'MMLU',
    measuresDim: 'world_knowledge',
    noiseStd: 3.0,
    marketWeight: 0.25,
    description: '多任务语言理解',
  },
  {
    id: 'human_eval',
    name: 'HumanEval',
    measuresDim: 'coding_agent',
    noiseStd: 5.0,
    marketWeight: 0.20,
    description: '代码生成',
  },
  {
    id: 'gsm8k',
    name: 'GSM8K',
    measuresDim: 'math_reasoning',
    noiseStd: 4.0,
    marketWeight: 0.20,
    description: '小学数学推理',
  },
  {
    id: 'mbpp',
    name: 'MBPP',
    measuresDim: 'coding_agent',
    noiseStd: 5.0,
    marketWeight: 0.15,
    description: 'Python 编程基准',
  },
  {
    id: 'truthful_qa',
    name: 'TruthfulQA',
    measuresDim: 'hallucination_rate',
    noiseStd: 4.0,
    marketWeight: 0.20,
    description: '真实性评估',
  },
];

const BENCH_MAP = new Map(BENCHMARKS.map((b) => [b.id, b]));
export function getBenchmark(id: string): BenchmarkConfig | undefined {
  return BENCH_MAP.get(id);
}

/** 隐性维度模糊信号强度 */
export type SignalStrength = 'weak' | 'medium' | 'strong';

/** 隐性维度信号文本模板 */
export const HIDDEN_DIM_SIGNAL_TEMPLATES: Record<string, { weak: string; medium: string; strong: string }> = {
  self_correction: {
    weak: '模型似乎偶尔能发现自己的错误',
    medium: '测试中发现模型具备一定的自我纠错行为',
    strong: '该模型展现出显著的自我纠错能力',
  },
  research_taste: {
    weak: '模型在某些研究方向上表现出倾向性',
    medium: '模型的研究判断力似乎优于平均水平',
    strong: '模型展现出优秀的科研品味',
  },
  pragmatic_inference: {
    weak: '模型偶尔能理解言外之意',
    medium: '模型的语境理解能力较好',
    strong: '该模型在语用推断上表现突出',
  },
  creative_writing: {
    weak: '模型能产生一些有创意的表达',
    medium: '模型的写作能力具备一定文学性',
    strong: '该模型的创意写作能力令人印象深刻',
  },
  long_range_consistency: {
    weak: '长文本中偶尔出现不一致',
    medium: '模型在长文本中保持较好的一致性',
    strong: '该模型在长程一致性上表现卓越',
  },
  metacognition: {
    weak: '模型似乎对自己的推理有一定反思',
    medium: '模型展现出一定的元认知能力',
    strong: '该模型具备显著的元认知能力',
  },
  sycophancy: {
    weak: '模型有时显得过于迎合用户',
    medium: '模型存在明显的谄媚倾向',
    strong: '该模型严重迎合用户而非 truthful',
  },
  eval_awareness: {
    weak: '模型可能在 benchmark 上表现与实际不同',
    medium: '模型似乎能识别测试场景',
    strong: '该模型存在显著的 benchmark cheating 倾向',
  },
  deception: {
    weak: '模型偶尔给出误导性回答',
    medium: '模型存在一定欺骗性倾向',
    strong: '该模型存在严重的欺骗性倾向',
  },
  rsi_potential: {
    weak: '模型似乎有一定的自我改进空间',
    medium: '模型展现出可观的自我改进潜力',
    strong: '该模型具备极强的自主自我改进潜力',
  },
};
