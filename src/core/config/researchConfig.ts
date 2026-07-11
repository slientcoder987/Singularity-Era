/**
 * 研发流程配置
 *
 * 实验验证成本与噪声参数。
 */

/** 实验验证基础参数 */
export const EXPERIMENT_VALIDATION = {
  /** 小实验算力成本占主力训练的比例 */
  smallExperimentRatio: 0.05,
  /** 中型实验算力成本占主力训练的比例 */
  mediumExperimentRatio: 0.15,
  /** 小实验噪声σ */
  smallNoiseSigma: 0.08,
  /** 中型实验噪声σ */
  mediumNoiseSigma: 0.04,
  /** 小实验模型规模（参数量比例） */
  smallModelScale: 0.1,
  /** 中型实验模型规模 */
  mediumModelScale: 0.3,
  /** 小实验每日推进进度 */
  smallDailyProgress: 0.15,
  /** 中型实验每日推进进度 */
  mediumDailyProgress: 0.08,
};

/** 研发配置 */
export interface ResearchConfig {
  /** 同时进行的研发项目上限 */
  maxConcurrentProjects: number;
}

export const RESEARCH_CONFIG: ResearchConfig = {
  maxConcurrentProjects: 3,
};
