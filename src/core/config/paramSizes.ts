/**
 * 参数规模档位定义
 *
 * 参数量不是自由滑条，受显存、互联、并行方式约束。
 * 不合理选择会导致无法接受的成本和极高训爆概率。
 */

export interface ParamSizeOption {
  id: string;
  name: string;
  /** 参数量（B） */
  paramCountB: number;
  /** 每步处理的 token 数（batch_size × seq_len），单位 token */
  tokensPerStep: number;
  /** 每步总 FLOPs = 6 × paramCountB × 1e9 × tokensPerStep */
  flopsPerStep: number;
  /** 训练所需最小显存 GB（参数 + 优化器状态 + 激活） */
  minMemoryGB: number;
  /** 训练稳定性基础风险 0-1 */
  baseStabilityRisk: number;
  /** 推理成本因子（1.0 = 70B 基准） */
  inferenceCostFactor: number;
  /** 推荐总训练步数目标（UI 默认值） */
  recommendedStepsTarget: number;
  description: string;
}

export const PARAM_SIZES: ParamSizeOption[] = [
  {
    id: 'small_7b',
    name: '小模型 7B',
    paramCountB: 7,
    tokensPerStep: 0.5e6,
    flopsPerStep: 6 * 7e9 * 0.5e6,
    minMemoryGB: 16,
    baseStabilityRisk: 0.02,
    inferenceCostFactor: 0.1,
    recommendedStepsTarget: 10_000,
    description: '低成本实验与蒸馏',
  },
  {
    id: 'small_13b',
    name: '小模型 13B',
    paramCountB: 13,
    tokensPerStep: 0.65e6,
    flopsPerStep: 6 * 13e9 * 0.65e6,
    minMemoryGB: 28,
    baseStabilityRisk: 0.03,
    inferenceCostFactor: 0.18,
    recommendedStepsTarget: 15_000,
    description: '企业私有部署',
  },
  {
    id: 'small_30b',
    name: '小模型 30B',
    paramCountB: 30,
    tokensPerStep: 1e6,
    flopsPerStep: 6 * 30e9 * 1e6,
    minMemoryGB: 64,
    baseStabilityRisk: 0.05,
    inferenceCostFactor: 0.4,
    recommendedStepsTarget: 20_000,
    description: '中型实验',
  },
  {
    id: 'medium_70b',
    name: '中模型 70B',
    paramCountB: 70,
    tokensPerStep: 1.5e6,
    flopsPerStep: 6 * 70e9 * 1.5e6,
    minMemoryGB: 140,
    baseStabilityRisk: 0.08,
    inferenceCostFactor: 1.0,
    recommendedStepsTarget: 30_000,
    description: '主力 API 早期形态',
  },
  {
    id: 'medium_120b',
    name: '中模型 120B',
    paramCountB: 120,
    tokensPerStep: 2e6,
    flopsPerStep: 6 * 120e9 * 2e6,
    minMemoryGB: 240,
    baseStabilityRisk: 0.10,
    inferenceCostFactor: 1.7,
    recommendedStepsTarget: 50_000,
    description: '主力 API 进阶',
  },
  {
    id: 'large_200b',
    name: '大 Dense 200B',
    paramCountB: 200,
    tokensPerStep: 2.5e6,
    flopsPerStep: 6 * 200e9 * 2.5e6,
    minMemoryGB: 400,
    baseStabilityRisk: 0.15,
    inferenceCostFactor: 3.0,
    recommendedStepsTarget: 75_000,
    description: '需 DP+TP+PP 稳定训练',
  },
  {
    id: 'large_400b',
    name: '大 Dense 400B',
    paramCountB: 400,
    tokensPerStep: 3e6,
    flopsPerStep: 6 * 400e9 * 3e6,
    minMemoryGB: 800,
    baseStabilityRisk: 0.22,
    inferenceCostFactor: 6.0,
    recommendedStepsTarget: 100_000,
    description: 'dense 上限，需成熟 infra',
  },
  {
    id: 'moe_1t',
    name: '超大 MoE 1T+',
    paramCountB: 1000,
    tokensPerStep: 4e6,
    flopsPerStep: 6 * 1000e9 * 4e6,
    minMemoryGB: 2000,
    baseStabilityRisk: 0.35,
    inferenceCostFactor: 12.0,
    recommendedStepsTarget: 150_000,
    description: '需 MoE+EP+负载均衡（P0 暂不可用）',
  },
];

const PARAM_MAP = new Map(PARAM_SIZES.map((p) => [p.id, p]));
export function getParamSize(id: string): ParamSizeOption | undefined {
  return PARAM_MAP.get(id);
}

/** P0 可用的档位（排除 moe_1t） */
export const AVAILABLE_PARAM_SIZES = PARAM_SIZES.filter((p) => p.id !== 'moe_1t');
