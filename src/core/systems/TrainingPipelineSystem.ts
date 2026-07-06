/**
 * TrainingPipelineSystem
 *
 * 每日推进所有训练中的模型：
 * 1. 计算当日有效算力（复用 calculateEffectiveCompute）
 * 2. 按 stageBudgetAllocation 分配 FLOPs 到各阶段
 * 3. 按阶段 capabilityGains × archMatrix 系数 提升能力
 * 4. 更新 loss（越来越平缓）
 * 5. 检查训练稳定性（训爆概率）
 * 6. 生成隐性维度模糊信号
 */

import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import { getCardSpec } from '../config/computeCards';
import {
  calculateEffectiveCompute,
  type ModelParams,
} from '../utils/computeUtilization';
import {
  getStageConfig,
  getNextStage,
} from '../config/trainingStages';
import {
  HIDDEN_DIMS,
  type CapabilityDim,
} from '../config/capabilityDims';
import { getCombinedArchMultiplier, getArchitecture } from '../config/architectures';
import { getParamSize } from '../config/paramSizes';
import { clamp } from '../utils';

export class TrainingPipelineSystem implements System {
  name = 'TrainingPipelineSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const trainingModels = current.models.filter((m) => m.status === 'training');
    if (trainingModels.length === 0) return;

    const matrix = current.archMatrix;
    const crashed: Array<{ id: string; name: string; reason: string }> = [];
    const progress: Array<{ id: string; name: string; step: number; loss: number }> = [];

    state.update((draft) => {
      for (const model of draft.models) {
        if (model.status !== 'training') continue;

        // 收集集群中的卡规格
        const cardSpecs = this.collectCardSpecs(draft, model.clusterId);
        if (cardSpecs.length === 0) {
          model.status = 'paused';
          model.pauseReason = '无可用计算卡';
          events.emit('TRAINING_PAUSED', model.id, model.pauseReason);
          continue;
        }

        const cluster = draft.clusters.find((c) => c.id === model.clusterId) ?? undefined;
        const dc = cluster?.dataCenterId
          ? draft.dataCenters.find((d) => d.id === cluster.dataCenterId)
          : undefined;

        const paramSize = getParamSize(model.config.paramSizeId);
        const modelParams: ModelParams = {
          paramCount: paramSize?.paramCountB ?? 7,
          architecture: model.config.architectureIds.join('+'),
          precision: model.config.precision,
        };

        const result = calculateEffectiveCompute(
          cardSpecs,
          cluster,
          dc,
          draft.activeTechEffects,
          modelParams,
        );

        // 当日有效算力（TFLOPS·天）
        const dailyTflopsDays = result.effectiveTflops * deltaDays;
        // 转换为 FLOPs（1 TFLOPS = 1e12 FLOPS，1 天 = 86400 秒）
        const dailyFlops = dailyTflopsDays * 1e12 * 86400;

        // ===== 训练步数推进 =====
        const paramSizeCfg = getParamSize(model.config.paramSizeId);
        const flopsPerStep = paramSizeCfg?.flopsPerStep ?? 42e9;
        const stepsAdvanced = Math.max(1, Math.floor(dailyFlops / flopsPerStep));
        model.currentStep += stepsAdvanced;
        model.flopsInvested += dailyFlops;

        // ===== 能力提升 =====
        const stageConfig = getStageConfig(model.currentStage);
        if (stageConfig) {
          // 整个训练周期内单维度的目标提升上限
          // 与绝对 FLOPs 解耦：无论算力多大，总提升有上限；大算力只是更快达到上限
          const CAP_PER_DIM = 80;
          // 当日步数占总训练目标的比例（即当日训练进度）
          const dayProgressRatio = stepsAdvanced / Math.max(1, model.config.totalStepsTarget);

          for (const [dimStr, baseGain] of Object.entries(stageConfig.capabilityGains)) {
            const dim = dimStr as CapabilityDim;
            const archMul = getCombinedArchMultiplier(matrix, model.config.architectureIds, dim);
            const isHidden = HIDDEN_DIMS.includes(dim);
            const hiddenWeight = isHidden ? stageConfig.hiddenDimWeight : 1.0;

            // 能力提升 = baseGain × archMul × hiddenWeight × CAP × 当日进度比例
            const delta = (baseGain ?? 0) * archMul * hiddenWeight * CAP_PER_DIM * dayProgressRatio * deltaDays;
            model.capabilities[dim] = clamp(model.capabilities[dim] + delta, 0, 100);
          }
        }

        // ===== loss 更新（指数衰减） =====
        const convergenceRate = stageConfig?.lossConvergenceRate ?? 1.0;
        const progressRatio = model.currentStep / model.config.totalStepsTarget;
        const baseLoss = stageConfig?.baseLoss ?? 4.0;
        model.currentLoss = baseLoss * Math.exp(-convergenceRate * progressRatio * 3);

        // ===== 阶段切换：当 loss 低于阈值时自动进入下一阶段 =====
        const lossThreshold = (stageConfig?.baseLoss ?? 4.0) * 0.15;
        if (model.currentLoss < lossThreshold) {
          const nextStage = getNextStage(model.currentStage);
          if (nextStage) {
            model.currentStage = nextStage;
            const nextConfig = getStageConfig(nextStage);
            if (nextConfig) model.currentLoss = nextConfig.baseLoss;
            events.emit('STAGE_CHANGED', model.id, nextStage);
          }
        }

        // ===== 训练稳定性检查 =====
        let stabilityImpactSum = 0;
        for (const archId of model.config.architectureIds) {
          const arch = getArchitecture(archId);
          if (arch) stabilityImpactSum += arch.stabilityImpact;
        }
        const paramRisk = paramSizeCfg?.baseStabilityRisk ?? 0.05;
        const crashProbability = clamp(
          paramRisk * (1 + stabilityImpactSum) * (1 + progressRatio * 0.5),
          0,
          0.5,
        );

        model.stabilityRisk = crashProbability;

        if (Math.random() < crashProbability * deltaDays) {
          // 训爆！回退到上一个 checkpoint
          const lastCheckpoint = model.checkpoints[model.checkpoints.length - 1];
          if (lastCheckpoint) {
            model.capabilities = { ...lastCheckpoint.capabilities };
            model.currentStage = lastCheckpoint.stage;
            model.currentStep = lastCheckpoint.createdAtStep;
            model.flopsInvested = lastCheckpoint.flopsInvested;
            model.currentLoss = lastCheckpoint.loss;
            model.stabilityRisk = lastCheckpoint.stabilityRisk;
            model.hasCrashed = true;
            model.status = 'paused';
            model.pauseReason = '训练不稳定，已回退到上一个 checkpoint';
            crashed.push({
              id: model.id,
              name: model.name,
              reason: '训练不稳定（训爆）',
            });
          } else {
            // 无 checkpoint，严重损失
            model.flopsInvested *= 0.5;
            model.hasCrashed = true;
            model.status = 'paused';
            model.pauseReason = '训练不稳定且无 checkpoint，损失 50% FLOPs';
            crashed.push({
              id: model.id,
              name: model.name,
              reason: '训练不稳定（无 checkpoint 回退）',
            });
          }
          continue;
        }

        progress.push({
          id: model.id,
          name: model.name,
          step: model.currentStep,
          loss: model.currentLoss,
        });
      }
    });

    for (const c of crashed) {
      events.emit('MODEL_CRASHED', c.id, c.name, c.reason);
    }
    for (const p of progress) {
      events.emit('MODEL_TRAINING_PROGRESS', p.id, p.name, p.step, p.loss);
    }
  }

  /** 从集群中收集所有在线卡的规格 */
  private collectCardSpecs(data: any, clusterId: string): ComputeCardSpec[] {
    const cluster = data.clusters.find((c: any) => c.id === clusterId);
    if (!cluster) return [];
    const specs: ComputeCardSpec[] = [];
    for (const nodeId of cluster.nodes) {
      const node = data.serverNodes.find((n: any) => n.id === nodeId);
      if (!node) continue;
      for (const cardUid of node.installedCards) {
        for (const modelId of Object.keys(data.resourceMeta)) {
          const pool = data.resourceMeta[modelId] as CardInstance[] | undefined;
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
}
