/**
 * 能力涌现规则配置
 *
 * 大模型的涌现能力：参数规模或训练深度超过阈值时触发能力跃升。
 */

import type { CapabilityDim } from '../config/capabilityDims';
import type { TrainingStageId } from '../config/trainingStages';

/** 涌现触发条件 */
export interface EmergenceTrigger {
  /** 参数规模下限（B） */
  minParamSizeB?: number;
  /** 训练步数下限 */
  minSteps?: number;
  /** 训练阶段 */
  stage?: TrainingStageId;
  /** 某维度达到阈值 */
  minCapability?: { dim: CapabilityDim; value: number };
}

/** 涌现效果 */
export interface EmergenceEffect {
  /** 能力跃升（指定维度 +N） */
  capabilityBoost?: Partial<Record<CapabilityDim, number>>;
  /** 解锁隐性维度信号 */
  revealHiddenDim?: CapabilityDim;
}

/** 涌现规则 */
export interface EmergenceRule {
  id: string;
  trigger: EmergenceTrigger;
  effect: EmergenceEffect;
  description: string;
}

export const EMERGENCE_RULES: EmergenceRule[] = [
  {
    id: 'in_context_learning',
    trigger: { minParamSizeB: 60, minSteps: 5000 },
    effect: { capabilityBoost: { dialogue_fluency: 10, multilingual: 8 } },
    description: '上下文学习涌现',
  },
  {
    id: 'cot_emergence',
    trigger: { minParamSizeB: 100, minSteps: 10000, stage: 'rl_cot' },
    effect: { capabilityBoost: { math_reasoning: 15, research_taste: 12 } },
    description: '思维链能力涌现',
  },
  {
    id: 'code_understanding',
    trigger: { minParamSizeB: 30, minSteps: 8000, minCapability: { dim: 'coding_agent', value: 30 } },
    effect: { capabilityBoost: { coding_agent: 12 } },
    description: '代码理解能力涌现',
  },
  {
    id: 'safety_awareness',
    trigger: { minParamSizeB: 70, minSteps: 12000, stage: 'rlhf' },
    effect: { revealHiddenDim: 'sycophancy', capabilityBoost: { sycophancy: -10 } },
    description: '安全意识涌现（降低谄媚性）',
  },
  {
    id: 'latent_reasoning',
    trigger: { minParamSizeB: 200, minSteps: 20000, stage: 'latent_reasoning' },
    effect: { capabilityBoost: { metacognition: 20 }, revealHiddenDim: 'metacognition' },
    description: '潜在推理能力涌现',
  },
];

/** 检查涌现规则是否触发 */
export function checkEmergence(
  rule: EmergenceRule,
  paramSizeB: number,
  currentStep: number,
  stage: TrainingStageId,
  capabilities: Record<CapabilityDim, number>,
): boolean {
  const t = rule.trigger;
  if (t.minParamSizeB !== undefined && paramSizeB < t.minParamSizeB) return false;
  if (t.minSteps !== undefined && currentStep < t.minSteps) return false;
  if (t.stage !== undefined && stage !== t.stage) return false;
  if (t.minCapability && (capabilities[t.minCapability.dim] ?? 0) < t.minCapability.value) return false;
  return true;
}
