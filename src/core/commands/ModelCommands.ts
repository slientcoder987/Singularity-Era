/**
 * 大模型训练命令
 *
 * 封装模型创建、checkpoint、回滚、发布等操作。
 */

import type { Command } from '../interfaces/Command';
import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { ModelTrainingConfig } from '../entities/ModelEntity';
import { createModel, createCheckpoint } from '../entities/ModelEntity';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import { getCardSpec } from '../config/computeCards';
import { getParamSize } from '../config/paramSizes';
import { getArchitecture } from '../config/architectures';
import { getStageConfig } from '../config/trainingStages';
import { evaluateBenchmark, generateHiddenDimSignals } from '../entities/Benchmark';
import { BENCHMARKS } from '../config/benchmarks';

/**
 * 计算集群可用总显存
 */
function getClusterMemoryGB(state: GameState, clusterId: string): number {
  const current = state.read();
  const cluster = current.clusters.find((c) => c.id === clusterId);
  if (!cluster) return 0;
  let total = 0;
  for (const nodeId of cluster.nodes) {
    const node = current.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;
    for (const cardUid of node.installedCards) {
      for (const key of Object.keys(current.resourceMeta)) {
        const pool = current.resourceMeta[key] as CardInstance[] | undefined;
        const card = pool?.find((c) => c.uid === cardUid);
        if (card) {
          const spec = getCardSpec(card.modelId);
          if (spec) total += spec.memoryGB;
          break;
        }
      }
    }
  }
  return total;
}

/**
 * 计算集群中所有卡的规格列表
 */
function getClusterCardSpecs(state: GameState, clusterId: string): ComputeCardSpec[] {
  const current = state.read();
  const cluster = current.clusters.find((c) => c.id === clusterId);
  if (!cluster) return [];
  const specs: ComputeCardSpec[] = [];
  for (const nodeId of cluster.nodes) {
    const node = current.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;
    for (const cardUid of node.installedCards) {
      for (const key of Object.keys(current.resourceMeta)) {
        const pool = current.resourceMeta[key] as CardInstance[] | undefined;
        const card = pool?.find((c) => c.uid === cardUid);
        if (card && card.status === 'online') {
          const spec = getCardSpec(card.modelId);
          if (spec) specs.push(spec);
          break;
        }
      }
    }
  }
  return specs;
}

/* ========================================================================
 * CreateModelCommand
 * ====================================================================== */
export class CreateModelCommand implements Command {
  constructor(
    private name: string,
    private config: ModelTrainingConfig,
    private clusterId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 验证集群存在
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('MODEL_REJECTED', { reason: '集群不存在' });
      return;
    }

    // 验证参数规模
    const paramSize = getParamSize(this.config.paramSizeId);
    if (!paramSize) {
      events.emit('MODEL_REJECTED', { reason: '未知参数规模' });
      return;
    }

    // 验证架构
    for (const archId of this.config.architectureIds) {
      const arch = getArchitecture(archId);
      if (!arch) {
        events.emit('MODEL_REJECTED', { reason: `未知架构: ${archId}` });
        return;
      }
    }

    // 计算显存需求（参数规模基础 × 架构开销因子）
    let memoryOverhead = 1.0;
    for (const archId of this.config.architectureIds) {
      const arch = getArchitecture(archId);
      if (arch) memoryOverhead *= arch.memoryOverhead;
    }
    const requiredMemory = paramSize.minMemoryGB * memoryOverhead;
    const availableMemory = getClusterMemoryGB(state, this.clusterId);

    if (requiredMemory > availableMemory) {
      events.emit('MODEL_REJECTED', {
        reason: `显存不足：需要 ${Math.round(requiredMemory)}GB，可用 ${availableMemory}GB`,
      });
      return;
    }

    // 计算稳定性基础风险
    let stabilityImpactSum = 0;
    for (const archId of this.config.architectureIds) {
      const arch = getArchitecture(archId);
      if (arch) stabilityImpactSum += arch.stabilityImpact;
    }
    const baseStabilityRisk = Math.max(
      0.01,
      Math.min(0.8, paramSize.baseStabilityRisk * (1 + stabilityImpactSum)),
    );

    // 获取预训练阶段 baseLoss
    const pretrainConfig = getStageConfig('pretrain');
    const baseLoss = pretrainConfig?.baseLoss ?? 4.0;

    // 创建模型
    const model = createModel(
      this.name,
      this.config,
      this.clusterId,
      current.date,
      baseLoss,
      baseStabilityRisk,
    );

    state.update((draft) => {
      draft.models.push(model);
    });

    events.emit('MODEL_CREATED', model.id, model.name);
  }
}

/* ========================================================================
 * CreateCheckpointCommand
 * ====================================================================== */
export class CreateCheckpointCommand implements Command {
  constructor(
    private modelId: string,
    private label?: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('CHECKPOINT_REJECTED', { reason: '模型不存在' });
      return;
    }
    if (model.status !== 'training' && model.status !== 'paused') {
      events.emit('CHECKPOINT_REJECTED', { reason: '模型不在可 checkpoint 状态' });
      return;
    }

    const ckpt = createCheckpoint(model, this.label);
    ckpt.createdAtDate = current.date;

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m) m.checkpoints.push(ckpt);
    });

    events.emit('CHECKPOINT_CREATED', this.modelId, ckpt.id);
  }
}

/* ========================================================================
 * RollbackToCheckpointCommand
 * ====================================================================== */
export class RollbackToCheckpointCommand implements Command {
  /** 回滚效率损失（10% 的已投入 FLOPs 浪费） */
  private static readonly ROLLBACK_LOSS_RATE = 0.1;

  constructor(
    private modelId: string,
    private checkpointId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('ROLLBACK_REJECTED', { reason: '模型不存在' });
      return;
    }

    const ckpt = model.checkpoints.find((c) => c.id === this.checkpointId);
    if (!ckpt) {
      events.emit('ROLLBACK_REJECTED', { reason: 'checkpoint 不存在' });
      return;
    }

    // 损失计算
    const flopsDiff = model.flopsInvested - ckpt.flopsInvested;
    const lostFlops = flopsDiff * RollbackToCheckpointCommand.ROLLBACK_LOSS_RATE;

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.capabilities = { ...ckpt.capabilities };
      m.currentStage = ckpt.stage;
      m.currentStep = ckpt.createdAtStep;
      m.flopsInvested = ckpt.flopsInvested + lostFlops; // 损失部分效率
      m.currentLoss = ckpt.loss;
      m.stabilityRisk = ckpt.stabilityRisk;
      m.status = 'paused';
      m.hasCrashed = false;
      m.pauseReason = null;
    });

    events.emit('MODEL_ROLLED_BACK', this.modelId, this.checkpointId);
  }
}

/* ========================================================================
 * ReleaseModelCommand
 * ====================================================================== */
export class ReleaseModelCommand implements Command {
  constructor(
    private modelId: string,
    private checkpointId?: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('RELEASE_REJECTED', { reason: '模型不存在' });
      return;
    }

    // 如果指定了 checkpoint，从 checkpoint 发布
    let releaseCapabilities = model.capabilities;
    if (this.checkpointId) {
      const ckpt = model.checkpoints.find((c) => c.id === this.checkpointId);
      if (!ckpt) {
        events.emit('RELEASE_REJECTED', { reason: 'checkpoint 不存在' });
        return;
      }
      releaseCapabilities = ckpt.capabilities;
    }

    const evalDate = current.date;

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.status = 'released';
      m.releasedAt = evalDate;
      m.releasedCapabilities = { ...releaseCapabilities };

      // 运行所有 benchmark
      const revealedSet = new Set(draft.revealedHiddenDims);
      for (const bench of BENCHMARKS) {
        const result = evaluateBenchmark(
          m.id,
          m.name,
          releaseCapabilities,
          bench,
          evalDate,
        );
        draft.benchmarkResults.push(result);
        events.emit('BENCHMARK_EVALUATED', m.id, bench.id, result.observedScore);
      }

      // 生成隐性维度信号
      const signals = generateHiddenDimSignals(
        m.id,
        releaseCapabilities,
        evalDate,
        revealedSet,
      );
      draft.hiddenDimSignals.push(...signals);
      for (const sig of signals) {
        events.emit('HIDDEN_SIGNAL', sig.dim, sig.strength, sig.hint);
      }

      // 简化市场反馈：能力越高，用户增长越多
      const avgExplicit =
        releaseCapabilities.world_knowledge +
        releaseCapabilities.coding_agent +
        releaseCapabilities.math_reasoning +
        releaseCapabilities.dialogue_fluency;
      const userGain = Math.round(avgExplicit * 100);
      draft.totalUsers += userGain;

      // 品牌声誉微调
      const reputationGain = Math.round((avgExplicit / 400) * 10);
      draft.brandReputation = Math.min(100, draft.brandReputation + reputationGain);
    });

    events.emit('MODEL_RELEASED', this.modelId, model.name);
  }
}

/* ========================================================================
 * PauseTrainingCommand
 * ====================================================================== */
export class PauseTrainingCommand implements Command {
  constructor(private modelId: string) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m && m.status === 'training') {
        m.status = 'paused';
      }
    });
    events.emit('TRAINING_PAUSED', this.modelId);
  }
}

/* ========================================================================
 * ResumeTrainingCommand
 * ====================================================================== */
export class ResumeTrainingCommand implements Command {
  constructor(private modelId: string) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m && m.status === 'paused') {
        m.status = 'training';
        m.pauseReason = null;
      }
    });
    events.emit('TRAINING_RESUMED', this.modelId);
  }
}

/* ========================================================================
 * AbandonModelCommand
 * ====================================================================== */
export class AbandonModelCommand implements Command {
  constructor(private modelId: string) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m) m.status = 'abandoned';
    });
    events.emit('MODEL_ABANDONED', this.modelId);
  }
}

/* ========================================================================
 * UpdateTrainingConfigCommand
 * ====================================================================== */
export class UpdateTrainingConfigCommand implements Command {
  constructor(
    private modelId: string,
    private stageBudgetAllocation: Record<string, number>,
  ) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m) {
        m.config.stageBudgetAllocation = {
          ...m.config.stageBudgetAllocation,
          ...this.stageBudgetAllocation,
        } as ModelTrainingConfig['stageBudgetAllocation'];
      }
    });
    events.emit('TRAINING_CONFIG_UPDATED', this.modelId);
  }
}

/* ========================================================================
 * RunExperimentModelCommand
 *
 * 训练小规模实验模型，推断架构矩阵系数。
 * 返回带噪声的推断结果（置信区间形式）。
 * ====================================================================== */
export class RunExperimentModelCommand implements Command {
  constructor(
    private architectureId: string,
    private paramSizeId: string,
    private clusterId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 验证集群存在
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('EXPERIMENT_REJECTED', { reason: '集群不存在' });
      return;
    }

    // 验证
    const arch = getArchitecture(this.architectureId);
    if (!arch) {
      events.emit('EXPERIMENT_REJECTED', { reason: '未知架构' });
      return;
    }
    const paramSize = getParamSize(this.paramSizeId);
    if (!paramSize) {
      events.emit('EXPERIMENT_REJECTED', { reason: '未知参数规模' });
      return;
    }

    // 实验成本
    const experimentCost = paramSize.paramCountB * 1000;
    const funds = current.resources['funds'] ?? 0;
    if (funds < experimentCost) {
      events.emit('EXPERIMENT_REJECTED', { reason: '资金不足', cost: experimentCost });
      return;
    }

    // 从矩阵中获取真实系数，添加噪声
    const matrix = current.archMatrix;
    const trueEffects = matrix[this.architectureId] ?? {};
    const inferredEffects: Record<string, { estimate: number; confidence: number }> = {};

    for (const [dim, trueMul] of Object.entries(trueEffects)) {
      // 噪声：±15%
      const noise = (Math.random() - 0.5) * 0.3;
      const estimate = Math.max(0.5, Math.min(2.0, trueMul! * (1 + noise)));
      const confidence = 0.6 + Math.random() * 0.3; // 60-90% 置信度
      inferredEffects[dim] = { estimate, confidence };
    }

    state.update((draft) => {
      draft.resources['funds'] -= experimentCost;
    });

    events.emit('EXPERIMENT_COMPLETED', this.architectureId, inferredEffects);
  }
}

/** 导出辅助函数供系统层使用 */
export { getClusterCardSpecs, getClusterMemoryGB };
