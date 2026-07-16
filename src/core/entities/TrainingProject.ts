/**
 * 并行策略类型
 *
 * DP  (Data Parallel):     模型复制多份，梯度同步。解决 batch 扩展，不解决显存。
 * PP  (Pipeline Parallel): 按层切分，流水线传递。降低单卡显存但有 bubble 开销。
 * TP  (Tensor Parallel):   每层矩阵按维度切开。通信量极大，通常限制在单节点内。
 * EP  (Expert Parallel):   MoE 专家分布到不同 GPU。支撑超大总参数量，但负载不均。
 * CP  (Context Parallel):  按上下文/序列切分注意力。支撑超长上下文训练。
 */
export type ParallelStrategy = 'dp' | 'pp' | 'tp' | 'ep' | 'cp';

/**
 * 并行策略配置
 *
 * 每种策略控制一个维度的切分方式，可组合使用（3D 并行）。
 * DP 为默认策略，始终启用且不需要技术解锁。
 */
export interface ParallelConfig {
  /** 启用的策略集合（默认 ['dp']） */
  strategies: ParallelStrategy[];
  /** DP: 数据并行副本数（默认 1） */
  dpReplicas: number;
  /** PP: 流水线段数（模型按层切分为 ppStages 段，≥1） */
  ppStages: number;
  /** TP: 张量并行度（每层矩阵沿维度切 tpSize 份，≥1） */
  tpSize: number;
  /** EP: 专家并行分组数（MoE 架构专用，≥1，仅 architecture='moe' 时生效） */
  epGroups: number;
  /** CP: 上下文并行分片数（沿序列维度切分，≥1） */
  cpSize: number;
}

/** 创建默认并行配置（纯 DP） */
export function createDefaultParallelConfig(): ParallelConfig {
  return { strategies: ['dp'], dpReplicas: 1, ppStages: 1, tpSize: 1, epGroups: 1, cpSize: 1 };
}

/**
 * 训练项目实体
 *
 * 表示一次模型训练任务，消耗算力资源直至完成。
 */
export interface TrainingProject {
  id: string;
  /** 模型名称 */
  modelName: string;
  /** 参数量（亿，如 7 表示 7B 模型） */
  paramCount: number;
  /** 架构类型（如 'transformer', 'moe'） */
  architecture: string;
  /** 状态 */
  status: 'pending' | 'training' | 'completed' | 'paused' | 'failed';
  /** 剩余所需算力 TFLOPS·天 */
  computeRemaining: number;
  /** 总所需算力 TFLOPS·天 */
  computeTotal: number;
  /** 分配的集群 id */
  clusterId: string;
  /** 节点分配方案：节点 id → 卡 uid 列表 */
  nodeAssignments: Record<string, string[]>;
  /** 开始训练日期 */
  startedAt: number;
  /** 完成日期（未完成为 null） */
  completedAt: number | null;
  /** 训练中断原因（如电力过载） */
  pauseReason: string | null;
  /** 上次 checkpoint 时的 computeRemaining（回退点） */
  lastCheckpointRemaining: number;
  /** Checkpoint 间隔（TFLOPS·天） */
  checkpointInterval: number;
  /** 上次 checkpoint 的日期 */
  lastCheckpointDay: number;
  /** 训练已投入但因中断损失的 FLOPs 总量 */
  lostFlops: number;

  // ===== P0 训练机制扩展 =====
  /** 训练上下文长度（token 数） */
  contextLength: number;
  /** 训练数据集 id */
  datasetId: string;
  /** 使用的技术 id 列表（影响能力计算） */
  techIds: string[];
  /** 是否为实验性训练（小模型验证架构映射） */
  isExperimental: boolean;

  // ===== 训练过程追踪 =====
  /** 当前训练损失 */
  currentLoss: number;
  /** 当前验证损失 */
  validationLoss: number;
  /** 损失历史（最近100个数据点） */
  lossHistory: Array<{ day: number; progress: number; loss: number; valLoss: number }>;
  /** 训练稳定度 0-1（初始1.0，事件会降低） */
  stabilityScore: number;
  /** 损失尖峰次数 */
  lossSpikeCount: number;
  /** 梯度爆炸次数 */
  gradientExplosionCount: number;
  /** 当前训练阶段 */
  trainingPhase: 'warmup' | 'main' | 'decay';
  /** 训练日志 */
  trainingLog: Array<{ day: number; event: string; severity: 'info' | 'warning' | 'critical' }>;
  /** 损失尖峰恢复剩余天数（>0时损失有额外衰减） */
  spikeRecoveryDays: number;
  /**
   * 设计-18：风险事件触发暂停后自动恢复的日期。
   * 若 RiskSystem 设置了此值，TrainingSystem 在 date >= autoResumeDay 时
   * 自动将 status 恢复为 'training'，无需玩家手动恢复。
   */
  autoResumeDay?: number;
  /** 并行策略配置（默认纯 DP） */
  parallelConfig: ParallelConfig;
}
