/**
 * 研发流程配置
 *
 * PR-B 变更：实验改为可调用玩家任意比例算力（拉条控制 computeRatio 0.5%~50%）
 * PR-B v2 变更：重新平衡算力/资金公式（16B=640k TFLOPS·天+$100k，翻倍×4）
 * PR-B v2 变更：加入技术难易度，成熟度上限由难易度×参数量共同决定
 * 实验实际占用集群 TFLOPS（与训练竞争算力），所有技术均可通过实验提升
 */

/** @deprecated PR-B 前的实验验证基础参数（旧 small/medium 机制） */
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

// ===== PR-B v2：实验系统重设计 =====

/**
 * 实验系统配置
 *
 * 玩家通过拉条选择 computeRatio（算力投入比例）和 experimentParams（目标参数量）。
 * 实验每日消耗集群总算力的 computeRatio 比例，与训练项目竞争算力。
 * 技术难易度决定该技术的 P100（达到 100% 所需参数量）。
 */
export const EXPERIMENT_CONFIG = {
  /** 算力比例拉条下限（0.5%） */
  minComputeRatio: 0.005,
  /** 算力比例拉条上限（50%） */
  maxComputeRatio: 0.50,
  /** 拉条步进（1%） */
  ratioStep: 0.01,

  /**
   * 实验目标参数量选项（单位：B）
   *
   * 从 0.5B 到 1T，覆盖从简单优化到 AI 自我改进的全部实验规模。
   */
  paramOptions: [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024] as const,

  /** 公式 B 基准：16B 实验的算力预算（TFLOPS·天） */
  budgetBase16B: 640_000,
  /** 公式 C 基准：16B 实验的资金成本（$） */
  costBase16B: 100_000,

  /** 公式 D：基础成熟度增益 */
  baseMaturityGain: 4,
  /** 公式 D：算力因子系数 computeFactor = 1 + log2(ratio×100) × computeFactorCoeff */
  computeFactorCoeff: 0.15,
  /** 公式 D：接近度因子系数 proximityFactor = 1 - 0.5 × (cur/maxCap) */
  proximityFactorCoeff: 0.5,
  /** 公式 D：研究员因子系数 researcherFactor = 1 + sumIntelligence / researcherFactorDenom */
  researcherFactorDenom: 200,

  /** 实验噪声σ（参数量越大，架构效果估计越精确） */
  baseNoiseSigma: 0.06,

  /**
   * 公式 A 参数：技术难易度 → P100（达到 100% 成熟度所需参数量 B）
   *
   * P100(difficulty) = difficulty³ × 0.5
   *
   * 数值表：
   * - diff 1:  0.5B 可达 100%
   * - diff 2:  4B 可达 100%
   * - diff 3:  13.5B 可达 100%
   * - diff 4:  32B 可达 100%
   * - diff 5:  62.5B 可达 100%
   * - diff 6:  108B 可达 100%
   * - diff 7:  171.5B 可达 100%
   * - diff 8:  256B 可达 100%
   * - diff 10: 500B 可达 100%
   * - diff 12: 864B 可达 100%
   * - diff 15: 1687.5B (~1.7T) 可达 100%
   */
  p100DifficultyCoeff: 0.5,
  p100DifficultyPower: 3,
};

/**
 * 公式 A：实验可提升的成熟度上限（v2：依赖技术难易度）
 *
 * P100(difficulty) = difficulty³ × 0.5
 * maxMaturityCap(P, difficulty) = min(100, 100 × √(P / P100))
 *
 * @param params      实验目标参数量（B）
 * @param difficulty  技术难易度 1~15
 * @returns           该参数量+难易度下可达到的成熟度上限 0~100
 *
 * 示例（diff=5, P100=62.5B）：
 * - 0.5B → 100×√(0.5/62.5) = 8.9%
 * - 8B   → 100×√(8/62.5)   = 35.8%
 * - 32B  → 100×√(32/62.5)  = 71.6%
 * - 64B  → 100（√(64/62.5)=1.01>1 封顶）
 *
 * 示例（diff=10, P100=500B）：
 * - 64B  → 100×√(64/500)   = 35.8%
 * - 128B → 100×√(128/500)  = 50.6%
 * - 512B → 100×√(512/500)  = 100%
 */
export function calcMaxMaturityCap(params: number, difficulty: number = 1): number {
  const p100 = Math.pow(difficulty, EXPERIMENT_CONFIG.p100DifficultyPower)
    * EXPERIMENT_CONFIG.p100DifficultyCoeff;
  if (params >= p100) return 100;
  return Math.min(100, 100 * Math.sqrt(params / p100));
}

/**
 * 公式 B：实验总算力预算（TFLOPS·天）
 *
 * budget(P) = 640000 × (P/16)² = 2500 × P²
 *
 * 基准：16B 实验需要 640,000 TFLOPS·天
 * 每翻倍参数量 → 预算 ×4（二次方增长）
 *
 * 数值表：
 * - 0.5B  → 640000 × (0.5/16)²   = 625 TFLOPS·天
 * - 1B    → 640000 × (1/16)²     = 2,500
 * - 4B    → 640000 × (4/16)²     = 40,000
 * - 8B    → 640000 × (8/16)²     = 160,000
 * - 16B   → 640,000
 * - 32B   → 640000 × 4           = 2,560,000
 * - 64B   → 640000 × 16          = 10,240,000
 * - 128B  → 640000 × 64          = 40,960,000
 * - 256B  → 640000 × 256         = 163,840,000
 * - 512B  → 640000 × 1024        = 655,360,000
 * - 1024B → 640000 × 4096        = 2,621,440,000
 */
export function calcExperimentBudget(params: number): number {
  return EXPERIMENT_CONFIG.budgetBase16B * Math.pow(params / 16, 2);
}

/**
 * 公式 C：实验启动资金成本（$）
 *
 * cost(P) = 100000 × (P/16)² = 390.625 × P²
 *
 * 基准：16B 实验启动成本 $100,000
 * 每翻倍参数量 → 成本 ×4
 *
 * 数值表：
 * - 0.5B  → $100k × (0.5/16)²     ≈ $98
 * - 1B    → $100k × (1/16)²       ≈ $391
 * - 4B    → $100k × (4/16)²       = $6,250
 * - 8B    → $100k × (8/16)²       = $25,000
 * - 16B   → $100,000
 * - 32B   → $400,000
 * - 64B   → $1,600,000
 * - 128B  → $6,400,000
 * - 256B  → $25,600,000
 * - 512B  → $102,400,000
 * - 1024B → $409,600,000
 */
export function calcExperimentFundsCost(params: number): number {
  return Math.ceil(EXPERIMENT_CONFIG.costBase16B * Math.pow(params / 16, 2));
}

/**
 * 公式 D：实验完成时的成熟度增益
 *
 * gain = baseGain × computeFactor × proximityFactor × researcherFactor
 *
 * - computeFactor = 1 + log2(max(0.1, ratio×100)) × computeFactorCoeff
 *   - ratio=0.5% → 1 + log2(0.5)×0.15 = 0.85
 *   - ratio=10%  → 1 + log2(10)×0.15 = 1.50
 *   - ratio=50%  → 1 + log2(50)×0.15 = 1.85
 * - proximityFactor = 1 - proximityFactorCoeff × (cur / maxCap)
 *   - cur=0       → 1.0（初始增益最大）
 *   - cur=maxCap/2 → 0.75
 *   - cur=maxCap   → 0.5（接近上限时增益减半）
 * - researcherFactor = 1 + sumIntelligence / researcherFactorDenom
 *
 * @param params            实验目标参数量（B）
 * @param computeRatio      算力投入比例 0.005~0.5
 * @param currentMaturity   当前成熟度 0~100
 * @param sumIntelligence   参与研究员的有效智力总和
 * @param difficulty        技术难易度（用于计算 maxCap，默认 1）
 * @returns                 成熟度增益（调用方负责 clamp 到 maxMaturityCap）
 */
export function calcMaturityGain(
  params: number,
  computeRatio: number,
  currentMaturity: number,
  sumIntelligence: number,
  difficulty: number = 1,
): number {
  const maxCap = calcMaxMaturityCap(params, difficulty);
  const baseGain = EXPERIMENT_CONFIG.baseMaturityGain;
  // P1-4 修复：改用平方根增长，降低高算力投入的边际收益
  // 原 log2 公式：0.5%→1.85×, 50%→7.4× 增益效率
  // 新 sqrt 公式：0.5%→1.03×, 10%→1.21×, 50%→1.43×
  const computeFactor = 1 + Math.sqrt(computeRatio * 2) * EXPERIMENT_CONFIG.computeFactorCoeff;
  const proximityFactor = 1 - EXPERIMENT_CONFIG.proximityFactorCoeff * (currentMaturity / Math.max(1, maxCap));
  const researcherFactor = 1 + sumIntelligence / EXPERIMENT_CONFIG.researcherFactorDenom;
  // 数值修复：大参数量实验的成熟度增益按规模加权。
  // 原公式大实验与小实验增益几乎相同（仅 maxCap 不同），导致 598 次实验后
  // tensor_parallel/pipeline_parallel 等高技术仍无法 100%。
  // 新增 scaleFactor：7B→1.0×, 16B→1.5×, 32B→2.0×, 64B→2.5×（线性 √(P/7) 上限 2.5×）。
  const scaleFactor = Math.min(2.5, Math.sqrt(Math.max(1, params) / 7));
  return baseGain * computeFactor * proximityFactor * researcherFactor * scaleFactor;
}

/**
 * 计算实验预计完成天数
 *
 * days = budget / (clusterTotalTflops × computeRatio)
 */
export function calcExperimentEstimatedDays(
  params: number,
  computeRatio: number,
  clusterTotalTflops: number,
): number {
  const budget = calcExperimentBudget(params);
  const dailyCompute = clusterTotalTflops * computeRatio;
  return dailyCompute > 0 ? budget / dailyCompute : Infinity;
}
