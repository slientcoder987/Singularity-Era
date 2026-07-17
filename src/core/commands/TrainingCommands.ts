import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { TrainingProject, ParallelConfig } from '../entities/TrainingProject';
import { createDefaultParallelConfig } from '../entities/TrainingProject';
import type { ModelParams } from '../utils/computeUtilization';
import { getCardSpec } from '../config/computeCards';
import { diagnoseTraining } from '../utils/trainingFeasibility';
import { calcTrainingCompute } from '../utils/capabilityCalc';
import { getCardIndex } from '../utils/cardIndex';
import { getActiveTechEffects } from '../utils/crossSystemUtils';

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
  const allocIndex = getCardIndex(current);

  for (const nodeId of cluster.nodes) {
    const node = current.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const nodeCards: string[] = [];
    for (const cardUid of node.installedCards) {
      // 查找卡实例（O(1) 索引）
      const entry = allocIndex.get(cardUid);
      if (entry && entry.card.status === 'online' && entry.card.assignedProjectId === null) {
        const spec = getCardSpec(entry.modelId);
        if (spec && spec.memoryGB >= minMemoryPerCard) {
          nodeCards.push(cardUid);
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
 * 自动检测最优并行策略。
 *
 * 当玩家未手动指定 parallelConfig 时，根据：
 * 1. 模型参数规模与所需显存 (paramCount × 2 GB)
 * 2. 集群中 GPU 的单卡显存
 * 3. 已解锁的并行策略（从 activeTechEffects 中推断）
 *
 * 自动计算 PP/TP 组合以让大模型（40B+）能在有限显存上训练。
 */
function autoDetectParallelConfig(
  current: ReturnType<GameState['read']>,
  paramCount: number,
  clusterId: string,
): ParallelConfig {
  const cluster = current.clusters.find((c) => c.id === clusterId);
  if (!cluster) return createDefaultParallelConfig();

  // BUG-27 修复：原实现硬编码 getCardSpec('compute_h100')，导致使用 B200/GB300
  // 等大显存卡的集群仍按 80GB 估算显存，错误地启用不必要的 PP/TP，降低训练效率。
  // 修复：扫描集群实际安装的卡，取最小显存作为基准。
  // 同时统计集群可用卡数（online 且未占用）。
  let gpuMemory = 0;
  let totalCards = 0;
  const detectIndex = getCardIndex(current);
  for (const nodeId of cluster.nodes) {
    const node = current.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;
    for (const cardUid of node.installedCards) {
      const entry = detectIndex.get(cardUid);
      if (entry && entry.card.status === 'online' && entry.card.assignedProjectId === null) {
        totalCards++;
        const spec = getCardSpec(entry.modelId);
        if (spec) {
          gpuMemory = gpuMemory === 0 ? spec.memoryGB : Math.min(gpuMemory, spec.memoryGB);
        }
      }
    }
  }
  // 兜底：集群无可用卡时退回 H100 默认值（让 diagnoseTraining 报阻塞）
  if (gpuMemory === 0) gpuMemory = getCardSpec('compute_h100')?.memoryGB ?? 80;

  const rawMem = paramCount * 2; // GB, FP16 参数体量

  // 如果能放入单卡，无需并行
  if (rawMem <= gpuMemory) {
    return createDefaultParallelConfig();
  }

  // 计算所需缩减因子
  const reductionNeeded = Math.ceil(rawMem / gpuMemory);

  // 获取解锁策略（通过派生技术效果，按 maturity 缩放后判定）
  // 解锁型 effect 不缩放，maturity≥1 即生效
  const activeTechEffects = getActiveTechEffects(current);
  const hasPP = activeTechEffects.some(
    (e) => e.type === 'unlock_parallel_strategy' && e.strategy === 'pp',
  );
  const hasTP = activeTechEffects.some(
    (e) => e.type === 'unlock_parallel_strategy' && e.strategy === 'tp',
  );

  let ppStages = 1;
  let tpSize = 1;

  if (hasPP && hasTP) {
    // 两者都有：平分，sqrt 取整，不超过可用卡数
    const half = Math.min(Math.ceil(Math.sqrt(reductionNeeded)), Math.floor(Math.sqrt(totalCards)));
    ppStages = Math.max(1, half);
    tpSize = Math.max(1, Math.min(half, Math.ceil(reductionNeeded / ppStages)));
  } else if (hasPP) {
    // 仅 PP：全用 PP，上限 8
    ppStages = Math.min(8, Math.max(1, Math.ceil(reductionNeeded)));
  } else if (hasTP) {
    // 仅 TP：全用 TP，上限 8
    tpSize = Math.min(8, Math.max(1, Math.ceil(reductionNeeded)));
  }
  // 都不解锁 → 退回纯 DP（会被 diagnoseTraining 报 blocker）

  return {
    strategies: ['dp'],
    dpReplicas: Math.max(1, Math.floor(totalCards / (ppStages * tpSize))),
    ppStages,
    tpSize,
    epGroups: 1,
    cpSize: 1,
  };
}

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
    /** 每卡最低显存要求 GB（可选，默认从模型参数推算，已考虑并行缩减） */
    private readonly minMemoryPerCard?: number,
    /** 上下文长度（token 数，默认 4096） */
    private readonly contextLength: number = 4096,
    /** 训练数据集 id（默认初始数据集） */
    private readonly datasetId: string = 'dataset-initial',
    /** 使用的技术 id 列表 */
    private readonly techIds: string[] = ['pretraining'],
    /** 是否实验性训练 */
    private readonly isExperimental: boolean = false,
    /**
     * 并行策略配置（可选）。
     *
     * Bug Fix：大模型（40B+）必须通过 PP/TP 降低单卡显存需求才能启动训练。
     * 若未指定则使用默认纯 DP，此时单卡显存 = 模型总需求。
     * 指定 PP×TP > 1 后，minMemoryPerCard 自动除以并行缩减因子。
     */
    private readonly parallelConfig?: ParallelConfig,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('TRAINING_REJECTED', { reason: '集群不存在' });
      return;
    }

    // ★ 自动检测并行策略（如果未手动指定）
    // 大模型（40B+）无法放入单卡 H100 (80GB)，即使玩家解锁了 TP 也会因为
    // UI 不传 parallelConfig 而被默认纯 DP 拦截。此处自动检测解锁的策略
    // 并计算所需 PP/TP 组合。
    const autoPC = this.parallelConfig ?? autoDetectParallelConfig(
      current, this.paramCount, this.clusterId,
    );
    const pc = autoPC;

    // 诊断训练可行性（传入并行策略以准确估算显存）
    const issues = diagnoseTraining(
      this.paramCount, this.contextLength, this.architecture,
      this.clusterId, state, pc,
    );
    const blockers = issues.filter((i) => i.severity === 'blocker');
    if (blockers.length > 0) {
      events.emit('TRAINING_REJECTED', {
        reason: blockers.map((i) => i.message).join('；'),
        issues,
      });
      return;
    }

    // 推算最低显存需求（考虑并行策略的显存缩减）
    const ppReduction = pc.ppStages > 1 ? pc.ppStages : 1;
    const tpReduction = pc.tpSize > 1 ? pc.tpSize : 1;
    const memDivisor = ppReduction * tpReduction;
    const modelParams: ModelParams = {
      paramCount: this.paramCount,
      architecture: this.architecture,
      parallelConfig: pc,
    };
    const rawMemPerCard = this.minMemoryPerCard ?? Math.ceil(modelParams.paramCount * 2);
    // 并行策略降低单卡显存需求：PP 切层、TP 切维度
    const minMem = Math.max(1, Math.ceil(rawMemPerCard / memDivisor));

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
      parallelConfig: pc,
    };

    state.update((draft) => {
      draft.trainingProjects.push(project);
      // 标记卡为已分配
      const markIndex = getCardIndex(draft);
      for (const cardUids of Object.values(assignments)) {
        for (const uid of cardUids) {
          const entry = markIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = project.id;
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
      const cancelIndex = getCardIndex(draft);
      for (const cardUids of Object.values(project.nodeAssignments)) {
        for (const uid of cardUids) {
          const entry = cancelIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = null;
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
    const resumeIndex = getCardIndex(current);
    let hasOnlineCard = false;
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        const entry = resumeIndex.get(uid);
        if (entry && entry.card.status === 'online') {
          hasOnlineCard = true;
          break;
        }
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
    const reallocIndex = getCardIndex(current);
    let minMemoryPerCard = 0;
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        const entry = reallocIndex.get(uid);
        if (entry) {
          const spec = getCardSpec(entry.modelId);
          if (spec) {
            minMemoryPerCard = minMemoryPerCard === 0
              ? spec.memoryGB
              : Math.min(minMemoryPerCard, spec.memoryGB);
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
          const entry = reallocIndex.get(cardUid);
          if (entry && entry.card.status === 'online' && entry.card.assignedProjectId === null) {
            const spec = getCardSpec(entry.modelId);
            if (spec && spec.memoryGB >= minMemoryPerCard) {
              freeCards.push(cardUid);
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
        const addIndex = getCardIndex(draft);
        for (const uid of toAdd) {
          // 标记为已分配
          const entry = addIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = this.projectId;
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
        const releaseIndex = getCardIndex(draft);
        for (const uid of releaseUids) {
          const entry = releaseIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = null;
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

/* ========================================================================
 * SetParallelStrategyCommand
 * 
 * 为训练项目设置并行策略，影响训练效率和模型规模上限。
 * 策略需通过技术研发解锁（DP 默认可用）。
 *
 * 约束规则：
 * - PP × TP × DP = 总卡数（3D 并行一致性）
 * - EP 仅 MoE 架构有效
 * - CP 需要 RoPE + FlashAttention v2
 * - TP ≥ 2 时要求集群内存在 NVLink 节点
 * ====================================================================== */
export class SetParallelStrategyCommand implements Command {
  constructor(
    private readonly projectId: string,
    /** 各维度切分数（未指定的维度保持原值） */
    private readonly config: {
      ppStages?: number;
      tpSize?: number;
      dpReplicas?: number;
      epGroups?: number;
      cpSize?: number;
    },
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const project = current.trainingProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit('PARALLEL_CONFIG_REJECTED', { reason: '训练项目不存在' });
      return;
    }
    if (project.status === 'completed' || project.status === 'failed') {
      events.emit('PARALLEL_CONFIG_REJECTED', { reason: '已完成/失败的项目不能修改策略' });
      return;
    }

    // 检查技术解锁（通过派生技术效果）
    const unlockedStrategies = new Set<string>(['dp']); // DP 始终可用
    const techEffects = getActiveTechEffects(current);
    for (const eff of techEffects) {
      if (eff.type === 'unlock_parallel_strategy') {
        unlockedStrategies.add(eff.strategy);
      }
    }

    const pc = { ...project.parallelConfig };
    if (this.config.ppStages !== undefined) pc.ppStages = this.config.ppStages;
    if (this.config.tpSize !== undefined) pc.tpSize = this.config.tpSize;
    if (this.config.dpReplicas !== undefined) pc.dpReplicas = this.config.dpReplicas;
    if (this.config.epGroups !== undefined) pc.epGroups = this.config.epGroups;
    if (this.config.cpSize !== undefined) pc.cpSize = this.config.cpSize;

    // 合法性校验
    const newStrategies: string[] = ['dp'];
    if (pc.ppStages > 1) {
      if (!unlockedStrategies.has('pp')) {
        events.emit('PARALLEL_CONFIG_REJECTED', { reason: '流水线并行 (PP) 未解锁，需研发 pipeline_parallel' });
        return;
      }
      newStrategies.push('pp');
    }
    if (pc.tpSize > 1) {
      if (!unlockedStrategies.has('tp')) {
        events.emit('PARALLEL_CONFIG_REJECTED', { reason: '张量并行 (TP) 未解锁，需研发 tensor_parallel' });
        return;
      }
      newStrategies.push('tp');
    }
    if (pc.epGroups > 1) {
      if (!unlockedStrategies.has('ep')) {
        events.emit('PARALLEL_CONFIG_REJECTED', { reason: '专家并行 (EP) 未解锁，需研发 expert_parallel' });
        return;
      }
      if (project.architecture !== 'moe') {
        events.emit('PARALLEL_CONFIG_REJECTED', { reason: '专家并行 (EP) 仅支持 MoE 架构' });
        return;
      }
      newStrategies.push('ep');
    }
    if (pc.cpSize > 1) {
      if (!unlockedStrategies.has('cp')) {
        events.emit('PARALLEL_CONFIG_REJECTED', { reason: '上下文并行 (CP) 未解锁，需研发 context_parallel' });
        return;
      }
      newStrategies.push('cp');
    }

    // 3D 并行一致性检查：总卡数 = dp × pp × tp
    const totalCards = Object.values(project.nodeAssignments).reduce((s, a) => s + a.length, 0);
    const requiredCards = pc.dpReplicas * pc.ppStages * pc.tpSize;
    if (requiredCards !== totalCards) {
      events.emit('PARALLEL_CONFIG_REJECTED', {
        reason: `3D 并行不匹配：DP(${pc.dpReplicas}) × PP(${pc.ppStages}) × TP(${pc.tpSize}) = ${requiredCards} ≠ 总卡数 ${totalCards}`,
      });
      return;
    }

    // TP ≥ 2 时要求 NVLink
    if (pc.tpSize > 1) {
      const cluster = current.clusters.find((c) => c.id === project.clusterId);
      if (cluster) {
        const hasNVLink = cluster.nodes.some((nid) => {
          const node = current.serverNodes.find((n) => n.id === nid);
          return node ? (node.nvswitchGeneration ?? 0) >= 1 : false;
        });
        if (!hasNVLink) {
          events.emit('PARALLEL_CONFIG_REJECTED', { reason: '张量并行 (TP) 要求集群至少包含 NVSwitch 节点' });
          return;
        }
      }
    }

    pc.strategies = newStrategies as typeof pc.strategies;

    state.update((draft) => {
      const p = draft.trainingProjects.find((x) => x.id === this.projectId);
      if (p) {
        p.parallelConfig = pc as any;
      }
    });

    events.emit('PARALLEL_CONFIG_UPDATED', {
      projectId: this.projectId,
      strategies: pc.strategies,
      dpReplicas: pc.dpReplicas,
      ppStages: pc.ppStages,
      tpSize: pc.tpSize,
      epGroups: pc.epGroups,
      cpSize: pc.cpSize,
    });
  }
}
