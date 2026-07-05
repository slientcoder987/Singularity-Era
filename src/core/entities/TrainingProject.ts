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
}
