/**
 * TrainingPipelineSystem
 *
 * 每日推进所有训练中的模型：
 * 1. 计算当日有效算力（含并行效率）
 * 2. 按阶段分配 FLOPs，推进步数
 * 3. 能力提升（受数据质量/多样性/时效性/领域覆盖加成）
 * 4. 更新 loss
 * 5. 检查涌现规则
 * 6. 检查训练稳定性（含科技崩溃减免）
 * 7. 记录训练日志
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
  computeParallelEfficiency,
} from '../utils/parallelStrategy';
import {
  computeDataFactor,
  getDimDomainBoost,
} from '../utils/dataFactor';
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
import { EMERGENCE_RULES, checkEmergence } from '../config/emergence';
import { createLogEntry } from '../entities/TrainingLog';
import type { ParallelStrategy } from '../config/techTree';
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
    const emerged: Array<{ modelId: string; ruleId: string; description: string }> = [];

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

        // ===== 并行效率 =====
        const unlockedStrategies = this.getUnlockedStrategies(draft.completedTechs);
        const parallelResult = computeParallelEfficiency(
          model.config.parallelConfig,
          cardSpecs.length,
          unlockedStrategies,
        );

        // 有效算力（含并行效率）
        const result = calculateEffectiveCompute(
          cardSpecs,
          cluster,
          dc,
          draft.activeTechEffects,
          modelParams,
        );

        // 当日有效算力（乘以并行效率）
        const effectiveTflops = result.effectiveTflops * parallelResult.efficiency;
        const dailyTflopsDays = effectiveTflops * deltaDays;
        const dailyFlops = dailyTflopsDays * 1e12 * 86400;

        // ===== 训练步数推进 =====
        const paramSizeCfg = getParamSize(model.config.paramSizeId);
        const flopsPerStep = paramSizeCfg?.flopsPerStep ?? 42e9;
        const stepsAdvanced = Math.max(1, Math.floor(dailyFlops / flopsPerStep));
        model.currentStep += stepsAdvanced;
        model.flopsInvested += dailyFlops;

        // ===== 数据因子 =====
        const modelDatasets = draft.datasets.filter((d) => model.config.datasetIds.includes(d.id));
        const dataFactor = computeDataFactor(modelDatasets, model.currentStage);
        // 科技数据质量加成
        let dataQualityBonus = 0;
        for (const eff of draft.activeTechEffects) {
          if (eff.type === 'improve_data_quality') dataQualityBonus += eff.value;
        }
        const qualityFactor = clamp(dataFactor.qualityFactor + dataQualityBonus, 0.3, 2.0);

        // ===== 能力提升 =====
        const stageConfig = getStageConfig(model.currentStage);
        if (stageConfig) {
          const CAP_PER_DIM = 80;
          const dayProgressRatio = stepsAdvanced / Math.max(1, model.config.totalStepsTarget);

          for (const [dimStr, baseGain] of Object.entries(stageConfig.capabilityGains)) {
            const dim = dimStr as CapabilityDim;
            const archMul = getCombinedArchMultiplier(matrix, model.config.architectureIds, dim);
            const isHidden = HIDDEN_DIMS.includes(dim);
            const hiddenWeight = isHidden ? stageConfig.hiddenDimWeight : 1.0;
            const domainBoost = getDimDomainBoost(dataFactor, dim);
            // 隐性维度额外乘 diversityFactor
            const diversityMul = isHidden ? dataFactor.diversityFactor : 1.0;

            const delta =
              (baseGain ?? 0) *
              archMul *
              hiddenWeight *
              CAP_PER_DIM *
              dayProgressRatio *
              deltaDays *
              qualityFactor *
              dataFactor.freshnessFactor *
              domainBoost *
              diversityMul;
            model.capabilities[dim] = clamp(model.capabilities[dim] + delta, 0, 100);
          }
        }

        // ===== loss 更新 =====
        const convergenceRate = stageConfig?.lossConvergenceRate ?? 1.0;
        const progressRatio = model.currentStep / model.config.totalStepsTarget;
        const baseLoss = stageConfig?.baseLoss ?? 4.0;
        model.currentLoss = baseLoss * Math.exp(-convergenceRate * progressRatio * 3);

        // ===== 阶段切换 =====
        const lossThreshold = (stageConfig?.baseLoss ?? 4.0) * 0.15;
        if (model.currentLoss < lossThreshold) {
          const nextStage = getNextStage(model.currentStage);
          if (nextStage) {
            model.currentStage = nextStage;
            const nextConfig = getStageConfig(nextStage);
            if (nextConfig) model.currentLoss = nextConfig.baseLoss;
            events.emit('STAGE_CHANGED', model.id, nextStage);
            draft.trainingLogs.push(
              createLogEntry(draft.date, model.id, 'stage_transition', `进入阶段：${nextStage}`),
            );
          }
        }

        // ===== 涌现检测 =====
        const paramB = paramSizeCfg?.paramCountB ?? 7;
        for (const rule of EMERGENCE_RULES) {
          if (model.triggeredEmergenceRules.includes(rule.id)) continue;
          if (checkEmergence(rule, paramB, model.currentStep, model.currentStage, model.capabilities)) {
            model.triggeredEmergenceRules.push(rule.id);
            // 应用涌现效果
            if (rule.effect.capabilityBoost) {
              for (const [dim, boost] of Object.entries(rule.effect.capabilityBoost)) {
                const d = dim as CapabilityDim;
                model.capabilities[d] = clamp(model.capabilities[d] + (boost ?? 0), 0, 100);
              }
            }
            if (rule.effect.revealHiddenDim) {
              const revealedSet = new Set(draft.revealedHiddenDims);
              revealedSet.add(rule.effect.revealHiddenDim);
              draft.revealedHiddenDims = Array.from(revealedSet);
            }
            emerged.push({ modelId: model.id, ruleId: rule.id, description: rule.description });
            draft.trainingLogs.push(
              createLogEntry(draft.date, model.id, 'emergence', rule.description),
            );
          }
        }

        // ===== 训练稳定性检查 =====
        let stabilityImpactSum = 0;
        for (const archId of model.config.architectureIds) {
          const arch = getArchitecture(archId);
          if (arch) stabilityImpactSum += arch.stabilityImpact;
        }
        const paramRisk = paramSizeCfg?.baseStabilityRisk ?? 0.05;
        let crashProbability = clamp(
          paramRisk * (1 + stabilityImpactSum) * (1 + progressRatio * 0.5),
          0,
          0.5,
        );
        // 科技减免
        for (const eff of draft.activeTechEffects) {
          if (eff.type === 'reduce_crash_probability') {
            crashProbability *= (1 - eff.value);
          }
        }
        crashProbability = clamp(crashProbability, 0, 0.5);
        model.stabilityRisk = crashProbability;

        if (Math.random() < crashProbability * deltaDays) {
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
            crashed.push({ id: model.id, name: model.name, reason: '训练不稳定（训爆）' });
            draft.trainingLogs.push(
              createLogEntry(draft.date, model.id, 'crash', '训练崩溃，回退到上个 checkpoint'),
            );
          } else {
            model.flopsInvested *= 0.5;
            model.hasCrashed = true;
            model.status = 'paused';
            model.pauseReason = '训练不稳定且无 checkpoint，损失 50% FLOPs';
            crashed.push({ id: model.id, name: model.name, reason: '训练不稳定（无 checkpoint）' });
            draft.trainingLogs.push(
              createLogEntry(draft.date, model.id, 'crash', '训练崩溃，无 checkpoint，损失 50%'),
            );
          }
          continue;
        }

        // ===== 记录每日训练日志（每 5 天记一次以减少日志量） =====
        if (draft.date % 5 === 0) {
          draft.trainingLogs.push(
            createLogEntry(draft.date, model.id, 'daily_progress', `步数 ${model.currentStep}，loss ${model.currentLoss.toFixed(3)}`, {
              steps: model.currentStep,
              loss: model.currentLoss,
            }),
          );
        }

        progress.push({ id: model.id, name: model.name, step: model.currentStep, loss: model.currentLoss });
      }
    });

    for (const c of crashed) events.emit('MODEL_CRASHED', c.id, c.name, c.reason);
    for (const p of progress) events.emit('MODEL_TRAINING_PROGRESS', p.id, p.name, p.step, p.loss);
    for (const e of emerged) events.emit('EMERGENCE_TRIGGERED', e.modelId, e.ruleId, e.description);
  }

  /** 从已完成科技推断解锁的并行策略 */
  private getUnlockedStrategies(completedTechs: string[]): ParallelStrategy[] {
    const strategies: ParallelStrategy[] = ['dp']; // DP 默认解锁
    if (completedTechs.includes('tensor_parallel_basic')) strategies.push('tp');
    if (completedTechs.includes('pipeline_parallel')) strategies.push('pp');
    if (completedTechs.includes('3d_parallel')) {
      strategies.push('dp_tp', 'dp_pp', 'tp_pp', 'dp_tp_pp');
    }
    return strategies;
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
