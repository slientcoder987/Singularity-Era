/**
 * 模型实体
 *
 * 模型真实能力是高维向量；玩家看到的是带噪声的投影。
 * 模型生命周期：创建 → 训练 → 创建 checkpoint → 发布/继续训练 → 发布/放弃
 */

import type { CapabilityVector } from '../config/capabilityDims';
import type { TrainingStageId } from '../config/trainingStages';
import type { ParallelConfig } from '../utils/parallelStrategy';

/** Checkpoint 快照 */
export interface Checkpoint {
  id: string;
  /** 创建时的训练步数 */
  createdAtStep: number;
  /** 创建时的游戏日期 */
  createdAtDate: number;
  /** 创建时所处的训练阶段 */
  stage: TrainingStageId;
  /** 此 checkpoint 的能力快照 */
  capabilities: CapabilityVector;
  /** 已投入 FLOPs */
  flopsInvested: number;
  /** 此 checkpoint 的 loss 值 */
  loss: number;
  /** 稳定性风险快照 */
  stabilityRisk: number;
  /** 标签 */
  label?: string;
}

/** 模型训练配置 */
export interface ModelTrainingConfig {
  /** 参数规模档位 id */
  paramSizeId: string;
  /** 架构选项 id 列表（可叠加） */
  architectureIds: string[];
  /** 精度 */
  precision: 'fp32' | 'bf16' | 'fp8' | 'int4';
  /** 最大上下文长度（tokens） */
  maxContextLength: number;
  /** 各阶段 FLOPs 预算分配（比例 0-1，归一化） */
  stageBudgetAllocation: Record<TrainingStageId, number>;
  /** 总训练步数目标 */
  totalStepsTarget: number;
  /** 训练使用的数据集 id 列表 */
  datasetIds: string[];
  /** 并行配置 */
  parallelConfig: ParallelConfig;
}

/** 模型状态 */
export type ModelStatus = 'training' | 'paused' | 'released' | 'abandoned';

/** 模型实体 */
export interface ModelEntity {
  id: string;
  name: string;
  config: ModelTrainingConfig;
  /** 当前真实能力（内部值，玩家不完全可见） */
  capabilities: CapabilityVector;
  /** 当前训练阶段 */
  currentStage: TrainingStageId;
  /** 当前训练步数 */
  currentStep: number;
  /** 已投入 FLOPs */
  flopsInvested: number;
  /** 当前 loss */
  currentLoss: number;
  /** 当前稳定性风险 0-1 */
  stabilityRisk: number;
  /** 所属集群 id */
  clusterId: string;
  /** checkpoint 列表 */
  checkpoints: Checkpoint[];
  /** 模型状态 */
  status: ModelStatus;
  /** 创建日期 */
  createdAt: number;
  /** 发布日期（未发布为 null） */
  releasedAt: number | null;
  /** 发布时的能力快照（用于市场评估） */
  releasedCapabilities: CapabilityVector | null;
  /** 是否已训爆过 */
  hasCrashed: boolean;
  /** 训练中断原因 */
  pauseReason: string | null;
  /** 已触发的涌现规则 id 列表（每规则每模型只触发一次） */
  triggeredEmergenceRules: string[];
}

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 默认阶段预算分配（均匀） */
export function defaultStageBudgetAllocation(): Record<TrainingStageId, number> {
  return {
    pretrain: 0.4,
    sft: 0.2,
    rlhf: 0.15,
    rl_cot: 0.1,
    latent_reasoning: 0.1,
    looped_reasoning: 0.05,
  };
}

/** 创建新模型（全零能力） */
export function createModel(
  name: string,
  config: ModelTrainingConfig,
  clusterId: string,
  date: number,
  baseLoss: number,
  baseStabilityRisk: number,
): ModelEntity {
  return {
    id: genId('model'),
    name,
    config,
    capabilities: createEmptyCaps(),
    currentStage: 'pretrain',
    currentStep: 0,
    flopsInvested: 0,
    currentLoss: baseLoss,
    stabilityRisk: baseStabilityRisk,
    clusterId,
    checkpoints: [],
    status: 'training',
    createdAt: date,
    releasedAt: null,
    releasedCapabilities: null,
    hasCrashed: false,
    pauseReason: null,
    triggeredEmergenceRules: [],
  };
}

/** 创建全零能力向量（内联以避免循环依赖） */
function createEmptyCaps(): CapabilityVector {
  // 直接构造，不引入 config 层
  const dims = [
    'world_knowledge', 'coding_agent', 'math_reasoning', 'multilingual',
    'dialogue_fluency', 'image_perf', 'video_perf', 'world_model', 'hallucination_rate',
    'self_correction', 'research_taste', 'pragmatic_inference', 'creative_writing',
    'long_range_consistency', 'metacognition', 'sycophancy', 'eval_awareness',
    'deception', 'rsi_potential',
  ] as const;
  const vec = {} as CapabilityVector;
  for (const d of dims) vec[d] = 0;
  return vec;
}

/** 创建 checkpoint */
export function createCheckpoint(
  model: ModelEntity,
  label?: string,
): Checkpoint {
  return {
    id: genId('ckpt'),
    createdAtStep: model.currentStep,
    createdAtDate: 0, // 由调用方填充
    stage: model.currentStage,
    capabilities: { ...model.capabilities },
    flopsInvested: model.flopsInvested,
    loss: model.currentLoss,
    stabilityRisk: model.stabilityRisk,
    label,
  };
}
