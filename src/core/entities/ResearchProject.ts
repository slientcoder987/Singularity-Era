/**
 * 研发项目实体
 *
 * 分为 idea_generation（idea 提出）和 experiment_validation（实验验证）。
 * PR-C：技术研发（tech_research）机制已废弃，所有技术解锁与提升统一通过实验 + idea 验证完成。
 */

/** 研发项目类型 */
export type ResearchType =
  | 'idea_generation'
  | 'experiment_validation';

/** 研发项目状态 */
export type ResearchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/** 实验重复模式 */
export type ExperimentRepeatMode = 'once' | 'to_cap';

/** 研发项目 */
export interface ResearchProject {
  id: string;
  type: ResearchType;
  status: ResearchStatus;
  /** 目标架构技术 id（实验验证时使用） */
  targetArchId: string | null;
  /** 投入的研究员员工 id 列表 */
  researcherIds: string[];
  /** 投入的算力预算 TFLOPS·天（仅实验验证） */
  computeBudget: number;
  /** 已消耗算力 */
  computeUsed: number;
  /** 进度 0-1 */
  progress: number;
  /** 开始日期 */
  startedAt: number;
  /** 完成日期 */
  completedAt: number | null;
  /** 实验结果（仅实验验证，完成时填充） */
  experimentResult: ExperimentResult | null;
  /** @deprecated PR-B 前的实验规模（旧 small/medium 机制，保留兼容旧存档） */
  experimentScale: 'small' | 'medium' | null;

  // ===== PR-B 新增字段 =====
  /** 实验目标参数量（B），决定成熟度上限（公式 A）。null 表示旧存档未设置。 */
  experimentParams: number | null;
  /** 算力投入比例 0.005~0.5（拉条控制）。null 表示旧存档未设置。 */
  computeRatio: number | null;
  /** 实验总算力预算 TFLOPS·天（公式 B）。null 表示旧存档使用旧 computeBudget。 */
  computeBudgetTotal: number | null;

  // ===== 实验队列扩展 =====
  /** 重复模式：once=进行一次，to_cap=进行到成熟度上限。默认 once。 */
  repeatMode: ExperimentRepeatMode;
  /** 关联的队列项 id（null 表示手动启动，非队列来源） */
  queueItemId: string | null;
}

/** 实验队列项 */
export interface ExperimentQueueItem {
  /** 队列项 id */
  id: string;
  /** 目标技术 id */
  techId: string;
  /** 实验参数量 B */
  experimentParams: number;
  /** 算力投入比例 */
  computeRatio: number;
  /** 研究员 id 列表 */
  researcherIds: string[];
  /** 重复模式 */
  repeatMode: ExperimentRepeatMode;
  /** 加入队列的日期 */
  queuedAt: number;
}

/** 实验结果：推断某架构对某能力的影响 */
export interface ExperimentResult {
  /** 被测试的架构技术 id */
  archTechId: string;
  /** 测试的能力维度 → 估计加成值（带噪声） */
  estimatedBonuses: Partial<Record<string, number>>;
  /** 估计值的置信度 0-1 */
  confidence: number;
  /** 实验用的模型规模（参数量比例 0-1） */
  modelScale: number;
  /** 实验日期 */
  date: number;
}
