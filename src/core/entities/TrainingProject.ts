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
}
