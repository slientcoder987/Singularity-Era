import type { Command } from '../interfaces/Command';
import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { TrainingProject } from '../entities/TrainingProject';
import type { ModelParams } from '../utils/computeUtilization';
import { getCardSpec } from '../config/computeCards';
import { diagnoseTraining } from '../utils/trainingFeasibility';
import { calcTrainingCompute } from '../utils/capabilityCalc';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 从集群中分配卡用于训练
 *
 * 策略：优先使用同节点的卡以减少通信开销。
 * 返回分配方案：节点 id → 卡 uid 列表。若无法满足返回 null。
 */
export function allocateCardsFromCluster(
  state: GameState,
  clusterId: string,
  minMemoryPerCard: number,
  maxCards?: number,
): Record<string, string[]> | null {
  const current = state.read();
  const cluster = current.clusters.find((c) => c.id === clusterId);
  if (!cluster) return null;

  const assignments: Record<string, string[]> = {};

  for (const nodeId of cluster.nodes) {
    const node = current.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const nodeCards: string[] = [];
    for (const cardUid of node.installedCards) {
      // 查找卡实例
      for (const modelId of Object.keys(current.resourceMeta)) {
        const pool = current.resourceMeta[modelId] as CardInstance[] | undefined;
        const card = pool?.find((c) => c.uid === cardUid);
        if (card && card.status === 'online' && card.assignedProjectId === null) {
          const spec = getCardSpec(modelId);
          if (spec && spec.memoryGB >= minMemoryPerCard) {
            nodeCards.push(cardUid);
          }
        }
      }
    }

    if (nodeCards.length > 0) {
      assignments[nodeId] = nodeCards;
      if (maxCards !== undefined) {
        const total = Object.values(assignments).reduce((s, arr) => s + arr.length, 0);
        if (total >= maxCards) {
          // 截断
          const excess = total - maxCards;
          if (excess > 0) {
            nodeCards.splice(nodeCards.length - excess, excess);
            assignments[nodeId] = nodeCards;
          }
          break;
        }
      }
    }
  }

  const totalAssigned = Object.values(assignments).reduce((s, arr) => s + arr.length, 0);
  return totalAssigned > 0 ? assignments : null;
}

/* ========================================================================
 * StartTrainingCommand
 * ====================================================================== */

/**
 * 启动训练项目
 *
 * 算力需求根据 Chinchilla 缩放定律自动计算，基于参数量、数据集 tokens 和上下文长度。
 */
export class StartTrainingCommand implements Command {
  constructor(
    private readonly modelName: string,
    private readonly paramCount: number,
    private readonly architecture: string,
    private readonly clusterId: string,
    /** 每卡最低显存要求 GB（可选，默认从模型参数推算） */
    private readonly minMemoryPerCard?: number,
    /** 上下文长度（token 数，默认 4096） */
    private readonly contextLength: number = 4096,
    /** 训练数据集 id（默认初始数据集） */
    private readonly datasetId: string = 'dataset-initial',
    /** 使用的技术 id 列表 */
    private readonly techIds: string[] = ['pretraining'],
    /** 是否实验性训练 */
    private readonly isExperimental: boolean = false,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('TRAINING_REJECTED', { reason: '集群不存在' });
      return;
    }

    // 诊断训练可行性
    const issues = diagnoseTraining(
      this.paramCount, this.contextLength, this.architecture,
      this.clusterId, state,
    );
    const blockers = issues.filter((i) => i.severity === 'blocker');
    if (blockers.length > 0) {
      events.emit('TRAINING_REJECTED', {
        reason: blockers.map((i) => i.message).join('；'),
        issues,
      });
      return;
    }

    // 推算最低显存需求
    const modelParams: ModelParams = {
      paramCount: this.paramCount,
      architecture: this.architecture,
    };
    const minMem = this.minMemoryPerCard ?? Math.ceil(modelParams.paramCount * 2);

    // 分配卡
    const assignments = allocateCardsFromCluster(state, this.clusterId, minMem);
    if (!assignments) {
      events.emit('TRAINING_REJECTED', { reason: '集群中无满足显存要求的可用卡' });
      return;
    }

    // 根据 Chinchilla 缩放定律自动计算训练所需总算力
    const dataset = current.datasets.find((d) => d.id === this.datasetId);
    const trainingTokens = dataset ? dataset.totalTokens : 1;  // 十亿单位
    const computeTotal = calcTrainingCompute(
      this.paramCount * 1e9,
      trainingTokens * 1e9,
      this.contextLength,
    );

    const today = current.date;
    const project: TrainingProject = {
      id: genId('train'),
      modelName: this.modelName,
      paramCount: this.paramCount,
      architecture: this.architecture,
      status: 'training',
      computeRemaining: computeTotal,
      computeTotal,
      clusterId: this.clusterId,
      nodeAssignments: assignments,
      startedAt: today,
      completedAt: null,
      pauseReason: null,
      lastCheckpointRemaining: computeTotal,
      checkpointInterval: Math.max(computeTotal * 0.05, 1),
      lastCheckpointDay: today,
      lostFlops: 0,
      contextLength: this.contextLength,
      datasetId: this.datasetId,
      techIds: [...this.techIds],
      isExperimental: this.isExperimental,
    };

    state.update((draft) => {
      draft.trainingProjects.push(project);
      // 标记卡为已分配
      for (const cardUids of Object.values(assignments)) {
        for (const uid of cardUids) {
          for (const modelId of Object.keys(draft.resourceMeta)) {
            const pool = draft.resourceMeta[modelId] as CardInstance[];
            const card = pool.find((c) => c.uid === uid);
            if (card) {
              card.assignedProjectId = project.id;
              break;
            }
          }
        }
      }
    });

    events.emit('TRAINING_STARTED', project.id, project.modelName);
  }
}

/* ========================================================================
 * CancelTrainingCommand
 * ====================================================================== */
export class CancelTrainingCommand implements Command {
  constructor(private readonly projectId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const project = current.trainingProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit('TRAINING_CANCEL_REJECTED', { reason: '项目不存在' });
      return;
    }

    state.update((draft) => {
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
      // 移除项目
      draft.trainingProjects = draft.trainingProjects.filter((p) => p.id !== this.projectId);
    });

    events.emit('TRAINING_CANCELLED', this.projectId);
  }
}

/* ========================================================================
 * ResumeTrainingCommand
 * ====================================================================== */
export class ResumeTrainingCommand implements Command {
  constructor(private readonly projectId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const project = current.trainingProjects.find((p) => p.id === this.projectId);

    if (!project) {
      events.emit('TRAINING_RESUME_REJECTED', { reason: '项目不存在' });
      return;
    }

    if (project.status !== 'paused') {
      events.emit('TRAINING_RESUME_REJECTED', { reason: '项目未暂停' });
      return;
    }

    // 检查是否有可用卡
    let hasOnlineCard = false;
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        for (const modelId of Object.keys(current.resourceMeta)) {
          const pool = current.resourceMeta[modelId] as CardInstance[] | undefined;
          const card = pool?.find((c) => c.uid === uid);
          if (card && card.status === 'online') {
            hasOnlineCard = true;
            break;
          }
        }
        if (hasOnlineCard) break;
      }
      if (hasOnlineCard) break;
    }

    if (!hasOnlineCard) {
      events.emit('TRAINING_RESUME_REJECTED', { reason: '无在线计算卡，请先修复故障' });
      return;
    }

    state.update((draft) => {
      const p = draft.trainingProjects.find((x) => x.id === this.projectId);
      if (p) {
        p.status = 'training';
        p.pauseReason = null;
      }
    });

    events.emit('TRAINING_RESUMED', this.projectId);
  }
}
