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
      // 训练过程追踪初始值
      currentLoss: 10.0,
      validationLoss: 10.0,
      lossHistory: [],
      stabilityScore: 1.0,
      lossSpikeCount: 0,
      gradientExplosionCount: 0,
      trainingPhase: 'warmup',
      trainingLog: [],
      spikeRecoveryDays: 0,
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

/* ========================================================================
 * ReallocateTrainingCardsCommand（设计-6）
 * ====================================================================== */

/**
 * 调整训练项目的算力分配，无需取消重训。
 *
 * - deltaCards > 0：从同一集群追加空闲在线卡（需满足训练最低显存要求）
 * - deltaCards < 0：释放部分已分配卡（至少保留 1 张，否则应使用 CancelTrainingCommand）
 *
 * 已投入的训练进度（computeRemaining）保持不变，仅改变每日推进速度。
 */
export class ReallocateTrainingCardsCommand implements Command {
  constructor(
    private readonly projectId: string,
    private readonly deltaCards: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    if (this.deltaCards === 0) {
      events.emit('TRAINING_REALLOC_REJECTED', { reason: '调整数量为 0' });
      return;
    }

    const current = state.read();
    const project = current.trainingProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit('TRAINING_REALLOC_REJECTED', { reason: '项目不存在' });
      return;
    }
    if (project.status !== 'training' && project.status !== 'paused') {
      events.emit('TRAINING_REALLOC_REJECTED', { reason: `项目状态 ${project.status} 不允许调整` });
      return;
    }

    const cluster = current.clusters.find((c) => c.id === project.clusterId);
    if (!cluster) {
      events.emit('TRAINING_REALLOC_REJECTED', { reason: '集群不存在' });
      return;
    }

    // 推断训练最低显存：从现有分配的卡规格取最小值
    let minMemoryPerCard = 0;
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        for (const modelId of Object.keys(current.resourceMeta)) {
          const pool = current.resourceMeta[modelId] as CardInstance[] | undefined;
          const card = pool?.find((c) => c.uid === uid);
          if (card) {
            const spec = getCardSpec(modelId);
            if (spec) {
              minMemoryPerCard = minMemoryPerCard === 0
                ? spec.memoryGB
                : Math.min(minMemoryPerCard, spec.memoryGB);
            }
            break;
          }
        }
      }
    }

    if (this.deltaCards > 0) {
      // ===== 追加卡 =====
      // 收集集群内空闲且满足显存的在线卡
      const freeCards: string[] = [];
      for (const nodeId of cluster.nodes) {
        const node = current.serverNodes.find((n) => n.id === nodeId);
        if (!node) continue;
        for (const cardUid of node.installedCards) {
          for (const modelId of Object.keys(current.resourceMeta)) {
            const pool = current.resourceMeta[modelId] as CardInstance[] | undefined;
            const card = pool?.find((c) => c.uid === cardUid);
            if (card && card.status === 'online' && card.assignedProjectId === null) {
              const spec = getCardSpec(modelId);
              if (spec && spec.memoryGB >= minMemoryPerCard) {
                freeCards.push(cardUid);
              }
            }
          }
        }
      }

      if (freeCards.length === 0) {
        events.emit('TRAINING_REALLOC_REJECTED', { reason: '集群内无可用空闲卡' });
        return;
      }

      const toAdd = freeCards.slice(0, this.deltaCards);

      state.update((draft) => {
        const p = draft.trainingProjects.find((x) => x.id === this.projectId);
        if (!p) return;
        for (const uid of toAdd) {
          // 标记为已分配
          for (const modelId of Object.keys(draft.resourceMeta)) {
            const pool = draft.resourceMeta[modelId] as CardInstance[];
            const card = pool.find((c) => c.uid === uid);
            if (card) {
              card.assignedProjectId = this.projectId;
              break;
            }
          }
          // 加入 nodeAssignments（按卡所在节点归类）
          let placed = false;
          for (const node of draft.serverNodes) {
            if (node.installedCards.includes(uid)) {
              if (!p.nodeAssignments[node.id]) p.nodeAssignments[node.id] = [];
              p.nodeAssignments[node.id].push(uid);
              placed = true;
              break;
            }
          }
          if (!placed) {
            // 兜底：放入任意已有节点组
            const firstKey = Object.keys(p.nodeAssignments)[0];
            if (firstKey) p.nodeAssignments[firstKey].push(uid);
          }
        }
      });

      // BUG-7 修复：update 提交后重新读取 state，确保 totalCards 统计准确
      const updatedProjectAdd = state.read().trainingProjects.find((p) => p.id === this.projectId);
      const actualTotalAdd = updatedProjectAdd
        ? Object.values(updatedProjectAdd.nodeAssignments).reduce((s, a) => s + a.length, 0)
        : 0;
      events.emit('TRAINING_REALLOCATED', {
        projectId: this.projectId,
        delta: toAdd.length,
        totalCards: actualTotalAdd,
      });
    } else {
      // ===== 释放卡 =====
      const releaseCount = Math.min(-this.deltaCards,
        Object.values(project.nodeAssignments).reduce((s, a) => s + a.length, 0) - 1);
      if (releaseCount <= 0) {
        events.emit('TRAINING_REALLOC_REJECTED', { reason: '至少需保留 1 张卡；如需释放全部请取消训练' });
        return;
      }

      // 从尾部释放（优先释放跨节点通信开销大的卡）
      const releaseUids: string[] = [];
      state.update((draft) => {
        const p = draft.trainingProjects.find((x) => x.id === this.projectId);
        if (!p) return;
        let remaining = releaseCount;
        const nodeIds = Object.keys(p.nodeAssignments);
        // 从后向前释放
        for (let i = nodeIds.length - 1; i >= 0 && remaining > 0; i--) {
          const nid = nodeIds[i];
          const arr = p.nodeAssignments[nid];
          while (arr.length > 0 && remaining > 0) {
            const uid = arr.pop()!;
            releaseUids.push(uid);
            remaining--;
          }
          if (arr.length === 0) delete p.nodeAssignments[nid];
        }
        for (const uid of releaseUids) {
          for (const modelId of Object.keys(draft.resourceMeta)) {
            const pool = draft.resourceMeta[modelId] as CardInstance[];
            const card = pool.find((c) => c.uid === uid);
            if (card) {
              card.assignedProjectId = null;
              break;
            }
          }
        }
      });

      // BUG-7 修复：update 提交后重新读取 state，确保 totalCards 统计准确
      const updatedProjectRelease = state.read().trainingProjects.find((p) => p.id === this.projectId);
      const actualTotalRelease = updatedProjectRelease
        ? Object.values(updatedProjectRelease.nodeAssignments).reduce((s, a) => s + a.length, 0)
        : 0;
      events.emit('TRAINING_REALLOCATED', {
        projectId: this.projectId,
        delta: -releaseUids.length,
        totalCards: actualTotalRelease,
      });
    }
  }
}
