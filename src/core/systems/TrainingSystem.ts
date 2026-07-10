import type { GameState, CardInstance, GameData } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { TrainingProject } from '../entities/TrainingProject';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { Model } from '../entities/Model';
import { getCardSpec } from '../config/computeCards';
import { TECH_MAP } from '../config/techTree';
import { generateArchMatrix } from '../config/archEffects';
import {
  calculateEffectiveCompute,
  type ModelParams,
} from '../utils/computeUtilization';
import {
  calcBaseScore,
  deriveBaseScoreParams,
  calculateCapabilities,
} from '../utils/capabilityCalc';

/**
 * TrainingSystem
 *
 * 每日推进训练项目：
 * 1. 遍历所有 training 状态的项目
 * 2. 收集分配的卡规格
 * 3. 调用 calculateEffectiveCompute 计算当日有效算力
 * 4. 从 computeRemaining 中扣除当日有效算力
 * 5. 若 computeRemaining <= 0，标记为 completed
 *
 * 利用率受集群、数据中心、科技效果、模型参数影响。
 */
export class TrainingSystem implements System {
  name = 'TrainingSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const trainingProjects = current.trainingProjects.filter((p) => p.status === 'training');
    if (trainingProjects.length === 0) return;

    const completed: Array<{ id: string; modelName: string }> = [];
    const progress: Array<{ id: string; modelName: string; effectiveTflops: number; utilization: number }> = [];

    state.update((draft) => {
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;

        // 收集分配的卡规格
        const cardSpecs = this.collectCardSpecs(draft, project);

        if (cardSpecs.length === 0) {
          // 无可用卡，暂停训练
          project.status = 'paused';
          project.pauseReason = '无可用计算卡';
          events.emit('TRAINING_PAUSED', project.id, project.pauseReason);
          continue;
        }

        // 查找集群和数据中心
        const cluster = draft.clusters.find((c) => c.id === project.clusterId) ?? undefined;
        const dc = cluster?.dataCenterId
          ? draft.dataCenters.find((d) => d.id === cluster.dataCenterId)
          : undefined;

        const modelParams: ModelParams = {
          paramCount: project.paramCount,
          architecture: project.architecture,
        };

        const result = calculateEffectiveCompute(
          cardSpecs,
          cluster,
          dc,
          draft.activeTechEffects,
          modelParams,
        );

        // 每日推进 = 有效算力 × deltaDays
        const dailyProgress = result.effectiveTflops * deltaDays;
        project.computeRemaining = Math.max(0, project.computeRemaining - dailyProgress);

        // Checkpoint 保存
        const progressSinceCheckpoint = project.lastCheckpointRemaining - project.computeRemaining;
        if (progressSinceCheckpoint >= project.checkpointInterval) {
          project.lastCheckpointRemaining = project.computeRemaining;
          project.lastCheckpointDay = draft.date;
        }

        if (project.computeRemaining <= 0) {
          project.status = 'completed';
          project.completedAt = draft.date;
          completed.push({ id: project.id, modelName: project.modelName });

          // 释放卡分配
          for (const cardUids of Object.values(project.nodeAssignments)) {
            for (const uid of cardUids) {
              for (const modelId of Object.keys(draft.resourceMeta)) {
                const pool = draft.resourceMeta[modelId] as CardInstance[];
                const card = pool.find((c) => c.uid === uid);
                if (card) {
                  card.assignedProjectId = null;
                  break;
                }
              }
            }
          }

          // 生成模型实体（训练完成 → 计算能力向量）
          const dataset = draft.datasets.find((d) => d.id === project.datasetId);
          if (dataset) {
            // 收集已解锁技术的效果
            const techEffects = project.techIds
              .map((tid) => TECH_MAP[tid as keyof typeof TECH_MAP])
              .filter(Boolean)
              .map((t) => t.effect);

            // 计算基础性能分参数
            const scoreParams = deriveBaseScoreParams(techEffects);
            const baseScore = calcBaseScore(
              project.paramCount,
              dataset.effectiveTokens,
              scoreParams,
            );

            // 生成架构-能力映射矩阵
            const archMatrix = generateArchMatrix(draft.archMatrixSeed);

            // 计算完整能力向量
            const capabilities = calculateCapabilities(
              baseScore,
              project.contextLength,
              dataset,
              archMatrix,
              project.techIds,
              techEffects,
            );

            const model: Model = {
              id: `${project.id}-model`,
              name: project.modelName,
              paramCount: project.paramCount,
              architecture: project.architecture,
              contextLength: project.contextLength,
              datasetId: project.datasetId,
              completedAt: draft.date,
              trainingProjectId: project.id,
              capabilities,
              baseScore,
              daysSincePublished: 0,
              evaluationResearchers: 0,
              published: false,
              version: 1,
            };
            draft.models.push(model);
          }
        } else {
          progress.push({
            id: project.id,
            modelName: project.modelName,
            effectiveTflops: result.effectiveTflops,
            utilization: result.utilization,
          });
        }
      }
    });

    for (const c of completed) {
      events.emit('TRAINING_COMPLETED', c.id, c.modelName);
    }
    for (const p of progress) {
      events.emit('TRAINING_PROGRESS', p);
    }
  }

  /** 从项目分配方案中收集卡规格 */
  private collectCardSpecs(data: GameData, project: TrainingProject): ComputeCardSpec[] {
    const specs: ComputeCardSpec[] = [];
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        for (const modelId of Object.keys(data.resourceMeta)) {
          const pool = data.resourceMeta[modelId] as CardInstance[] | undefined;
          const card = pool?.find((c) => c.uid === uid);
          if (card && card.status === 'online') {
            const spec = getCardSpec(modelId);
            if (spec) specs.push(spec);
            break;
          }
        }
      }
    }
    return specs;
  }
}
