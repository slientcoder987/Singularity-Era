import type { Command } from '../interfaces/Command';
import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { TrainingProject } from '../entities/TrainingProject';
import type { ModelParams } from '../utils/computeUtilization';
import { getCardSpec } from '../config/computeCards';

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
 * 不再直接指定 cardIds，而是指定 clusterId 和资源规格。
 * 系统从集群中分配满足显存要求的卡组。
 */
export class StartTrainingCommand implements Command {
  constructor(
    private readonly modelName: string,
    private readonly paramCount: number,
    private readonly architecture: string,
    private readonly clusterId: string,
    /** 训练所需总算力 TFLOPS·天 */
    private readonly computeTotal: number,
    /** 每卡最低显存要求 GB（可选，默认从模型参数推算） */
    private readonly minMemoryPerCard?: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('TRAINING_REJECTED', { reason: '集群不存在' });
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

    const today = current.date;
    const project: TrainingProject = {
      id: genId('train'),
      modelName: this.modelName,
      paramCount: this.paramCount,
      architecture: this.architecture,
      status: 'training',
      computeRemaining: this.computeTotal,
      computeTotal: this.computeTotal,
      clusterId: this.clusterId,
      nodeAssignments: assignments,
      startedAt: today,
      completedAt: null,
      pauseReason: null,
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
