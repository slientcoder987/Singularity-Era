import type { GameState, CardInstance, GameData } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { TrainingProject } from '../entities/TrainingProject';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { Model, CapabilityVector } from '../entities/Model';
import type { TechEffect } from '../entities/Infrastructure';
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

/** 计算期望损失（基于训练进度 0-1） */
function calcExpectedLoss(progress: number): number {
  // 损失曲线：初始10，渐近2.5
  return 2.5 + 7.5 * Math.exp(-5 * progress);
}

/** Box-Muller 正态分布随机数 */
function gaussianNoise(sigma: number): number {
  const u1 = Math.max(Math.random(), 1e-10);
  const u2 = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** 判定是否有某技术效果 */
function hasTechEffect(effects: TechEffect[], type: string): boolean {
  return effects.some((e) => e.type === type);
}

/** 简易字符串哈希（djb2），用于从模型 ID 生成噪声种子 */
function hashStr(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * TrainingSystem
 *
 * 每日推进训练项目，模拟完整训练过程：
 * 1. 根据进度判定训练阶段（预热/主训练/衰减），应用阶段利用率修正
 * 2. 计算有效算力并扣除
 * 3. 更新训练损失（带噪声）
 * 4. 概率触发训练事件（损失尖峰、梯度爆炸）
 * 5. 定期保存 checkpoint
 * 6. 完成时根据稳定度修正最终能力
 */
export class TrainingSystem implements System {
  name = 'TrainingSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const trainingProjects = current.trainingProjects.filter((p) => p.status === 'training');
    if (trainingProjects.length === 0) return;

    const completed: Array<{ id: string; modelName: string }> = [];
    const progressInfo: Array<{
      id: string; modelName: string; effectiveTflops: number; utilization: number;
      loss: number; valLoss: number; phase: string; stability: number;
    }> = [];
    const events_log: Array<{ id: string; day: number; event: string; severity: 'info' | 'warning' | 'critical' }> = [];

    state.update((draft) => {
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;

        // 收集分配的卡规格
        const cardSpecs = this.collectCardSpecs(draft, project);

        if (cardSpecs.length === 0) {
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

        // 计算集群中单节点最大卡槽数
        let maxSlotsPerNode = 8;
        if (cluster) {
          for (const nid of cluster.nodes) {
            const n = draft.serverNodes.find((x) => x.id === nid);
            if (n && n.slotCount > maxSlotsPerNode) maxSlotsPerNode = n.slotCount;
          }
        }

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
          maxSlotsPerNode,
        );

        // 计算训练进度
        const progressBefore = 1 - project.computeRemaining / project.computeTotal;

        // 判定训练阶段
        const oldPhase = project.trainingPhase;
        if (progressBefore < 0.05) {
          project.trainingPhase = 'warmup';
        } else if (progressBefore < 0.85) {
          project.trainingPhase = 'main';
        } else {
          project.trainingPhase = 'decay';
        }

        // 阶段利用率修正
        const phaseModifier =
          project.trainingPhase === 'warmup' ? 0.7 :
          project.trainingPhase === 'decay' ? 0.95 : 1.0;

        // 阶段切换日志
        if (oldPhase !== project.trainingPhase) {
          const phaseNames: Record<string, string> = {
            warmup: '预热期', main: '主训练期', decay: '衰减期',
          };
          project.trainingLog.push({
            day: draft.date,
            event: `进入${phaseNames[project.trainingPhase]}`,
            severity: 'info',
          });
        }

        // 每日推进 = 有效算力 × 阶段修正 × deltaDays
        const dailyProgress = result.effectiveTflops * phaseModifier * deltaDays;
        project.computeRemaining = Math.max(0, project.computeRemaining - dailyProgress);

        // 计算训练进度
        const progressAfter = 1 - project.computeRemaining / project.computeTotal;

        // ===== 损失更新 =====
        const expectedLoss = calcExpectedLoss(progressAfter);

        // 收集技术效果
        const techEffects = project.techIds
          .map((tid) => TECH_MAP[tid as keyof typeof TECH_MAP])
          .filter(Boolean)
          .map((t) => t.effect) as TechEffect[];

        const hasGradientClipping = hasTechEffect(techEffects, 'reduce_training_crash_risk') ||
          project.techIds.includes('gradient_clipping');
        const hasStableTraining = project.techIds.includes('stable_training');

        // 损失噪声：主训练期噪声较大
        const lossNoiseSigma = project.trainingPhase === 'main' ? 0.15 : 0.08;
        let loss = expectedLoss + gaussianNoise(lossNoiseSigma);

        // 尖峰恢复期：额外衰减
        if (project.spikeRecoveryDays > 0) {
          project.spikeRecoveryDays -= deltaDays;
        }

        // ===== 训练事件判定 =====
        // 损失尖峰概率
        const spikeProb = hasGradientClipping ? 0.01 : 0.05;
        if (Math.random() < spikeProb * deltaDays) {
          const spikeMagnitude = 0.5 + Math.random() * 1.5;
          loss += spikeMagnitude;
          project.lossSpikeCount++;
          project.stabilityScore = Math.max(0.3, project.stabilityScore - 0.02);
          project.spikeRecoveryDays = 2;
          project.trainingLog.push({
            day: draft.date,
            event: `损失尖峰 +${spikeMagnitude.toFixed(2)}`,
            severity: 'warning',
          });
          events_log.push({ id: project.id, day: draft.date, event: '损失尖峰', severity: 'warning' });
        }

        // 梯度爆炸概率
        const explosionProb = hasStableTraining ? 0.001 : 0.005;
        if (Math.random() < explosionProb * deltaDays && progressAfter > 0.05) {
          // 回退到上一个 checkpoint
          const lostSinceCheckpoint = project.lastCheckpointRemaining - project.computeRemaining;
          project.computeRemaining = project.lastCheckpointRemaining;
          project.lostFlops += Math.abs(lostSinceCheckpoint);
          project.gradientExplosionCount++;
          project.stabilityScore = Math.max(0.3, project.stabilityScore - 0.1);
          loss = calcExpectedLoss(1 - project.computeRemaining / project.computeTotal) + 2;
          project.trainingLog.push({
            day: draft.date,
            event: `梯度爆炸！回退到检查点，损失 ${Math.abs(lostSinceCheckpoint).toFixed(0)} TFLOPS·天`,
            severity: 'critical',
          });
          events_log.push({ id: project.id, day: draft.date, event: '梯度爆炸', severity: 'critical' });
        }

        // 验证损失（略高于训练损失，带更大噪声）
        const valLoss = loss + gaussianNoise(0.2) + 0.1;

        project.currentLoss = Math.max(1.5, loss);
        project.validationLoss = Math.max(1.5, valLoss);

        // 记录损失历史（保留最近100个点）
        project.lossHistory.push({
          day: draft.date,
          progress: progressAfter,
          loss: project.currentLoss,
          valLoss: project.validationLoss,
        });
        if (project.lossHistory.length > 100) {
          project.lossHistory.shift();
        }

        // Checkpoint 保存
        const progressSinceCheckpoint = project.lastCheckpointRemaining - project.computeRemaining;
        if (progressSinceCheckpoint >= project.checkpointInterval) {
          project.lastCheckpointRemaining = project.computeRemaining;
          project.lastCheckpointDay = draft.date;
          project.trainingLog.push({
            day: draft.date,
            event: '检查点已保存',
            severity: 'info',
          });
        }

        // 限制日志长度
        if (project.trainingLog.length > 50) {
          project.trainingLog = project.trainingLog.slice(-50);
        }

        // ===== 完成判定 =====
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

          // 生成模型实体
          const dataset = draft.datasets.find((d) => d.id === project.datasetId);
          if (dataset) {
            const scoreParams = deriveBaseScoreParams(techEffects);
            const baseScore = calcBaseScore(
              project.paramCount * 1e9,
              dataset.effectiveTokens * 1e9,
              scoreParams,
            );

            const archMatrix = generateArchMatrix(draft.archMatrixSeed);
            const capResult = calculateCapabilities(
              baseScore,
              project.contextLength,
              dataset,
              archMatrix,
              project.techIds,
              techEffects,
            );

            // 稳定度修正：qualityFactor = 0.7 + 0.3 × stabilityScore
            const qualityFactor = 0.7 + 0.3 * project.stabilityScore;

            // 训练完成日志
            project.trainingLog.push({
              day: draft.date,
              event: `训练完成 · 稳定度 ${(project.stabilityScore * 100).toFixed(0)}% · 质量系数 ${qualityFactor.toFixed(2)}`,
              severity: 'info',
            });

            const model: Model = {
              id: `${project.id}-model`,
              name: project.modelName,
              paramCount: project.paramCount,
              architecture: project.architecture,
              contextLength: project.contextLength,
              datasetId: project.datasetId,
              completedAt: draft.date,
              trainingProjectId: project.id,
              capabilities: Object.fromEntries(
                Object.entries(capResult.capabilities).map(([k, v]) => [k, v * qualityFactor]),
              ) as CapabilityVector,
              rawCapabilities: Object.fromEntries(
                Object.entries(capResult.rawCapabilities).map(([k, v]) => [k, v * qualityFactor]),
              ) as CapabilityVector,
              baseScore: baseScore * qualityFactor,
              daysSincePublished: 0,
              evaluationResearchers: 0,
              published: false,
              version: 1,
              audited: false,
              usedInResearch: false,
              noiseSeed: hashStr(`${project.id}-model` + draft.date + Math.random()),
            };
            draft.models.push(model);
          }
        } else {
          progressInfo.push({
            id: project.id,
            modelName: project.modelName,
            effectiveTflops: result.effectiveTflops,
            utilization: result.utilization,
            loss: project.currentLoss,
            valLoss: project.validationLoss,
            phase: project.trainingPhase,
            stability: project.stabilityScore,
          });
        }
      }
    });

    for (const c of completed) {
      events.emit('TRAINING_COMPLETED', c.id, c.modelName);
    }
    for (const p of progressInfo) {
      events.emit('TRAINING_PROGRESS', p);
    }
    for (const e of events_log) {
      events.emit('TRAINING_EVENT', e);
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
