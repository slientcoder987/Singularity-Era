/**
 * 研发项目实体
 *
 * 分为 idea_generation（idea 提出）和 experiment_validation（实验验证）。
 * 技术研发（tech_research）由 P0 的 TechResearchSystem 处理。
 */

/** 研发项目类型 */
export type ResearchType =
  | 'idea_generation'
  | 'experiment_validation';

/** 研发项目状态 */
export type ResearchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

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
  /** 实验规模 */
  experimentScale: 'small' | 'medium' | null;
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
