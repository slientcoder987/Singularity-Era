/**
 * 训练阶段定义
 *
 * 管线：预训练 → SFT → RLHF → RL+CoT → Latent Reasoning → Looped Reasoning
 * 后四个阶段需科技解锁（P0 暂时全部解锁便于测试）。
 *
 * 关键设计：
 * - 显性维度比隐性维度收敛快（loss 平缓更早），这是发布时机博弈核心
 * - hiddenDimWeight > 1 表示该阶段隐性提升相对更多
 */

export type TrainingStageId =
  | 'pretrain'
  | 'sft'
  | 'rlhf'
  | 'rl_cot'
  | 'latent_reasoning'
  | 'looped_reasoning';

export interface TrainingStageConfig {
  id: TrainingStageId;
  name: string;
  description: string;
  /** 该阶段主要提升的能力维度及基础提升速率（每 TFLOPS·天 提升值） */
  capabilityGains: Partial<Record<string, number>>;
  /** 阶段顺序（数字越大越靠后） */
  order: number;
  /** 解锁所需科技 id（P0 暂为 undefined 表示已解锁） */
  requiredTech?: string;
  /** loss 收敛速率（越大收敛越快） */
  lossConvergenceRate: number;
  /** 对隐性维度的相对提升权重（>1 表示隐性提升比显性多） */
  hiddenDimWeight: number;
  /** 该阶段的初始 loss 基准 */
  baseLoss: number;
}

export const TRAINING_STAGES: TrainingStageConfig[] = [
  {
    id: 'pretrain',
    name: '预训练',
    description: '大规模无监督预训练，建立基础语言能力',
    order: 0,
    capabilityGains: {
      world_knowledge: 0.8,
      multilingual: 0.6,
      dialogue_fluency: 0.5,
      math_reasoning: 0.3,
      coding_agent: 0.3,
    },
    lossConvergenceRate: 1.0,
    hiddenDimWeight: 0.3,
    baseLoss: 4.0,
  },
  {
    id: 'sft',
    name: 'SFT',
    description: '监督微调，学习指令跟随能力',
    order: 1,
    capabilityGains: {
      dialogue_fluency: 1.2,
      coding_agent: 0.8,
      multilingual: 0.5,
      creative_writing: 0.4,
      pragmatic_inference: 0.3,
    },
    lossConvergenceRate: 1.5,
    hiddenDimWeight: 0.5,
    baseLoss: 2.5,
  },
  {
    id: 'rlhf',
    name: 'RLHF',
    description: '基于人类反馈的强化学习，对齐人类偏好',
    order: 2,
    capabilityGains: {
      dialogue_fluency: 0.6,
      hallucination_rate: 0.8,
      sycophancy: 0.7,
      pragmatic_inference: 0.3,
      creative_writing: 0.2,
    },
    lossConvergenceRate: 1.2,
    hiddenDimWeight: 0.7,
    baseLoss: 1.8,
  },
  {
    id: 'rl_cot',
    name: 'RL+CoT',
    description: '结合思维链的强化学习，提升推理能力',
    order: 3,
    capabilityGains: {
      math_reasoning: 1.5,
      coding_agent: 1.0,
      self_correction: 0.6,
      metacognition: 0.4,
    },
    lossConvergenceRate: 0.9,
    hiddenDimWeight: 0.8,
    baseLoss: 1.5,
  },
  {
    id: 'latent_reasoning',
    name: 'Latent Reasoning',
    description: '隐空间推理，在潜变量层面进行多步推理',
    order: 4,
    capabilityGains: {
      math_reasoning: 0.8,
      self_correction: 1.0,
      metacognition: 0.8,
      research_taste: 0.5,
    },
    lossConvergenceRate: 0.7,
    hiddenDimWeight: 1.2,
    baseLoss: 1.2,
  },
  {
    id: 'looped_reasoning',
    name: 'Looped Reasoning',
    description: '循环推理，支持长程自我迭代',
    order: 5,
    capabilityGains: {
      long_range_consistency: 1.2,
      self_correction: 0.8,
      rsi_potential: 0.3,
      metacognition: 0.3,
    },
    lossConvergenceRate: 0.5,
    hiddenDimWeight: 1.0,
    baseLoss: 1.0,
  },
];

const STAGE_MAP = new Map(TRAINING_STAGES.map((s) => [s.id, s]));
export function getStageConfig(id: TrainingStageId): TrainingStageConfig | undefined {
  return STAGE_MAP.get(id);
}

/** 按顺序排列的阶段 */
export const ORDERED_STAGES = [...TRAINING_STAGES].sort((a, b) => a.order - b.order);

/** 获取某阶段之后的下一阶段 */
export function getNextStage(current: TrainingStageId): TrainingStageId | null {
  const cfg = getStageConfig(current);
  if (!cfg) return null;
  const next = ORDERED_STAGES.find((s) => s.order > cfg.order);
  return next?.id ?? null;
}
