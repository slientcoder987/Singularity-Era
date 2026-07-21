import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { Cluster, DataCenter, TechEffect } from '../entities/Infrastructure';
import type { ParallelConfig } from '../entities/TrainingProject';
import type { GameData } from '../GameState';
import { getCoolingType } from '../config/infrastructure';
import { getCardSpec } from '../config/computeCards';
import { clamp } from '../utils';
import { aggregateMultiplicative, TECH_EFFECT_CAPS } from './techEffectScale';

/**
 * 计算集群所有 online 卡的理论总算力（TFLOPS）
 *
 * PR-B：实验系统使用此函数确定每日可消耗的算力上限。
 * 实验每日占用 = clusterTotalTflops × computeRatio。
 *
 * 注意：此函数返回的是理论总算力（不含利用率折损），
 * 与 calculateEffectiveCompute 返回的 effectiveTflops 不同。
 * 实验占用的是"理论总算力的比例"，而非有效算力的比例，
 * 这样实验进度不受训练阶段利用率波动影响，玩家可预期。
 */
export function calcClusterTotalTflops(data: GameData): number {
  let total = 0;
  for (const modelId of Object.keys(data.resourceMeta)) {
    const pool = data.resourceMeta[modelId];
    if (!pool) continue;
    const spec = getCardSpec(modelId);
    if (!spec) continue;
    if (Array.isArray(pool)) {
      // 旧版扁平数组
      for (const card of pool) {
        if (card.status === 'online') {
          total += spec.tflopsPerCard;
        }
      }
    } else if (Array.isArray((pool as any).aggregates)) {
      // 新版聚合池：按桶 count 累加 online 卡数
      for (const agg of (pool as any).aggregates) {
        if (agg.status === 'online') {
          total += agg.count * spec.tflopsPerCard;
        }
      }
    }
  }
  return total;
}

/**
 * 利用率计算结果
 */
export interface UtilizationResult {
  /** 理论总算力 TFLOPS */
  totalTflops: number;
  /** 有效算力 TFLOPS */
  effectiveTflops: number;
  /** 综合利用率 0~1 */
  utilization: number;
  /** 瓶颈原因（如有） */
  bottleneck?: string;
  /** 是否需要模型并行 */
  requiresParallel: boolean;
  /** 模型并行使用的卡数（1 表示单卡） */
  parallelSize: number;
  /** 互联带宽惩罚 0~1 */
  interconnectPenalty: number;
  /** 跨节点通信惩罚 0~1 */
  crossNodePenalty: number;
  /** 规模惩罚 0~1 */
  scalePenalty: number;
  /** 同构性因子 0~1 */
  homogeneityFactor: number;
  /** 实际功耗 kW（训练负载） */
  actualPowerKW: number;
  /** 电力利用率 0~1（实际/容量） */
  powerUtilization: number;
}

/** 模型参数信息 */
export interface ModelParams {
  /** 参数量（亿，如 7 表示 7B） */
  paramCount: number;
  /** 架构类型 */
  architecture: string;
  /** 并行策略配置（可选，影响模型-显存适配和并行效率） */
  parallelConfig?: ParallelConfig;
}

/** 工作负载类型 */
export type WorkloadType = 'idle' | 'inference' | 'training';

/**
 * 计算 GPU 实际功耗 kW
 *
 * idle:      maxPowerDrawKW × 0.10
 * inference: maxPowerDrawKW × 0.65
 * training:  maxPowerDrawKW × 0.95
 */
export function calcActualPowerDraw(
  cardSpecs: ComputeCardSpec[],
  workload: WorkloadType,
): number {
  const factor = workload === 'idle' ? 0.10 : workload === 'inference' ? 0.65 : 0.95;
  return cardSpecs.reduce((sum, s) => sum + s.maxPowerDrawKW * factor, 0);
}

/**
 * 估算模型所需显存 GB
 *
 * 简化模型：权重 fp16 = params * 2 bytes + 激活内存 + 优化器状态。
 * 7B 模型约需 14GB 权重 + ~16GB 激活/优化器 ≈ 30GB。
 */
export function estimateRequiredMemory(model: ModelParams): number {
  const paramsInBillions = model.paramCount;
  const weightMemory = paramsInBillions * 2;
  const activationMemory = weightMemory * 2.2;
  return weightMemory + activationMemory;
}

/**
 * 计算互联带宽惩罚（节点内 TP）
 *
 * 所需互联带宽 / 实际互联带宽 < 1: 无惩罚
 * 0.5 ≤ ratio < 1: penalty = (1 - ratio) * 0.15
 * ratio < 0.5: penalty = 0.30
 */
function calcInterconnectPenalty(
  requiresParallel: boolean,
  parallelSize: number,
  cardSpecs: ComputeCardSpec[],
): number {
  if (!requiresParallel || cardSpecs.length === 0) return 0;

  const requiredBW = parallelSize * 50;
  // ★ 修复：Math.min(...spread) 在 10万元素时爆栈，改用循环
  let actualBW = Infinity;
  for (const s of cardSpecs) {
    const bw = s.nvlinkBandwidth > 0 ? s.nvlinkBandwidth : s.memoryBandwidth / 4;
    if (bw < actualBW) actualBW = bw;
  }
  if (actualBW === Infinity) actualBW = 0;

  if (actualBW <= 0) return 0.30;

  const ratio = requiredBW / actualBW;
  if (ratio < 1) return 0;
  if (ratio < 2) return (1 - 1 / ratio) * 0.15;
  return 0.30;
}

/**
 * 计算跨节点通信惩罚
 *
 * topologyFactor:
 *   simple:          1.50
 *   fat_tree:        1.15
 *   dragonfly:       1.05
 *   rail_optimized:  1.00
 *
 * 所需带宽 = parallelSize * 20 GB/s
 * 实际带宽 = cluster.allReduceBandwidth / topologyFactor
 *
 * ratio < 1:   无惩罚
 * 1 ≤ ratio < 2: penalty = (1 - 1/ratio) * 0.20
 * ratio ≥ 2:   penalty = 0.40
 */
function calcCrossNodePenalty(
  requiresParallel: boolean,
  parallelSize: number,
  crossNode: boolean,
  cluster?: Cluster,
): number {
  if (!requiresParallel || !crossNode || !cluster) return 0;

  const topologyFactor =
    cluster.networkTopology === 'simple' ? 1.50 :
    cluster.networkTopology === 'fat_tree' ? 1.15 :
    cluster.networkTopology === 'dragonfly' ? 1.05 :
    1.00; // rail_optimized

  const requiredBW = parallelSize * 20;
  const actualBW = cluster.allReduceBandwidth / topologyFactor;

  if (actualBW <= 0) return 0.40;

  const ratio = requiredBW / actualBW;
  if (ratio < 1) return 0;
  if (ratio < 2) return (1 - 1 / ratio) * 0.20;
  return 0.40;
}

/**
 * 计算规模惩罚（阿姆达尔定律在分布式训练中的应用）
 *
 * 超大规模集群（3D-Torus/光互联）使用更平缓的惩罚曲线，
 * 反映先进拓扑对通信开销的缓解。
 */
function calcScalePenalty(totalGpus: number, topology?: string): number {
  if (totalGpus <= 8) return 1.0;
  if (totalGpus <= 64) return Math.max(1 - Math.log(totalGpus / 8) * 0.02, 0.70);
  if (totalGpus <= 512) return Math.max(1 - Math.log(totalGpus / 64) * 0.04, 0.70);

  // 超大规模：拓扑相关惩罚
  const isAdvanced = topology === '3d_torus' || topology === 'optical_mesh' || topology === 'hybrid_fabric';
  if (isAdvanced) {
    // 先进拓扑：512→32768 卡惩罚 0.70→0.55，32768→1M 卡惩罚 0.55→0.45
    if (totalGpus <= 32768) return Math.max(1 - Math.log(totalGpus / 512) * 0.03, 0.55);
    return Math.max(1 - Math.log(totalGpus / 32768) * 0.02, 0.45);
  }
  // 传统拓扑：保持原惩罚曲线
  return Math.max(1 - Math.log(totalGpus / 512) * 0.06, 0.70);
}

/**
 * 计算同构性因子
 */
function calcHomogeneityFactor(cardSpecs: ComputeCardSpec[]): number {
  if (cardSpecs.length <= 1) return 1.0;

  const resourceIds = new Set(cardSpecs.map((s) => s.resourceId));
  if (resourceIds.size === 1) return 1.0;

  // ★ 修复：Math.min/max(...spread) 在 10万元素时爆栈，改用循环
  let minPower = Infinity;
  let maxPower = -Infinity;
  for (const s of cardSpecs) {
    if (s.maxPowerDrawKW < minPower) minPower = s.maxPowerDrawKW;
    if (s.maxPowerDrawKW > maxPower) maxPower = s.maxPowerDrawKW;
  }
  if (minPower === Infinity || maxPower === -Infinity) return 1.0;
  const ratio = minPower / maxPower;

  if (ratio >= 0.8) return 0.98;
  if (ratio >= 0.5) return 0.93;
  return 0.85;
}

/**
 * 计算电力因子（分档公式）
 */
function calcPowerFactor(totalPowerMW: number, maxPowerMW: number): number {
  if (totalPowerMW > maxPowerMW) return 0.50;
  if (totalPowerMW > 0.95 * maxPowerMW) return 1 - (totalPowerMW / maxPowerMW - 0.95) * 8;
  if (totalPowerMW > 0.85 * maxPowerMW) return 1 - (totalPowerMW / maxPowerMW - 0.85) * 2;
  return 1.0;
}

/**
 * ========================================================================
 * 并行策略效率计算
 *
 * 五种并行策略各有不同的收益和代价，可组合使用（3D 混合并行）。
 * 参考 GPT-4 / Llama-3 等实际训练集群的工程数据设计数值。
 * ========================================================================
 */

/**
 * PP 流水线气泡开销
 *
 * 公式：bubbleRatio = (ppStages - 1) / (ppStages × microBatches)
 * 近似 microBatches ≈ ppStages × 2（足够多的 micro-batch 填充流水线）：
 *   → bubbleRatio ≈ (ppStages - 1) / (2 × ppStages²)
 *   → ppEfficiency = 1 - (ppStages - 1) / (2 × ppStages²)
 *     = (2*ppStages² - ppStages + 1) / (2*ppStages²)
 *
 * 简化近似（与 GPT-4 训练模拟对齐）：
 *   ppEfficiency ≈ (ppStages + 1) / (2 × ppStages)
 */
function calcPPEfficiency(ppStages: number): number {
  if (ppStages <= 1) return 1.0;
  return clamp((ppStages + 1) / (2 * ppStages), 0.4, 1.0);
}

/**
 * TP 通信开销
 *
 * 每层前向+反向需要 all-reduce。NVLink 带宽充足时开销较小。
 *
 * NVLink ≥ 4 代:  每次 all-reduce 开销 ≈ 3% → tpOverhead = 1 - (tpSize - 1) × 0.03
 * NVLink 1-3 代:  开销 ≈ 6%       → tpOverhead = 1 - (tpSize - 1) × 0.06
 * 无 NVLink:       开销 ≈ 12%      → tpOverhead = 1 - (tpSize - 1) × 0.12
 */
function calcTPEfficiency(tpSize: number, cardSpecs: ComputeCardSpec[]): number {
  if (tpSize <= 1) return 1.0;
  // ★ 修复：Math.min(...spread) 在 10万元素时爆栈，改用循环
  let minNVLinkGen = Infinity;
  for (const s of cardSpecs) {
    const gen = parseInt((s.interconnect ?? '').replace('NVLink', ''), 10);
    const g = isNaN(gen) ? 0 : gen;
    if (g < minNVLinkGen) minNVLinkGen = g;
  }
  if (minNVLinkGen === Infinity) minNVLinkGen = 0;
  const perCardOverhead = minNVLinkGen >= 4 ? 0.03 : minNVLinkGen >= 1 ? 0.06 : 0.12;
  return clamp(1 - (tpSize - 1) * perCardOverhead, 0.4, 1.0);
}

/**
 * DP 梯度同步开销
 *
 * 每 replica 增加一次 all-reduce 通信，规模越大越明显。
 * dpOverhead = 1 - log₂(dpReplicas) × 0.02
 */
function calcDPEfficiency(dpReplicas: number): number {
  if (dpReplicas <= 1) return 1.0;
  return clamp(1 - Math.log2(dpReplicas) * 0.02, 0.6, 1.0);
}

/**
 * EP 专家并行效率
 *
 * MoE 路由：token → expert 的分配不均匀（load imbalance）导致部分 GPU 闲置。
 * 基础负载不均 5%，每增加一组 expert 额外 2%。
 */
function calcEPEfficiency(epGroups: number): number {
  if (epGroups <= 1) return 1.0;
  return clamp(1 - 0.05 - (epGroups - 1) * 0.02, 0.6, 1.0);
}

/**
 * CP 上下文并行通信开销
 *
 * Ring Attention / Ulysses 需要跨序列维度通信。
 * overhead = log₂(cpSize) × 0.03
 */
function calcCPEfficiency(cpSize: number): number {
  if (cpSize <= 1) return 1.0;
  return clamp(1 - Math.log2(cpSize) * 0.03, 0.5, 1.0);
}

/**
 * 计算并行策略的综合效率乘数
 *
 * 返回 0-1 的值，乘到总利用率上。
 */
function calcParallelStrategyEfficiency(
  parallelConfig: ParallelConfig,
  cardSpecs: ComputeCardSpec[],
  architecture: string,
): number {
  const pp = parallelConfig.ppStages > 1 ? calcPPEfficiency(parallelConfig.ppStages) : 1.0;
  const tp = parallelConfig.tpSize > 1 ? calcTPEfficiency(parallelConfig.tpSize, cardSpecs) : 1.0;
  const dp = parallelConfig.dpReplicas > 1 ? calcDPEfficiency(parallelConfig.dpReplicas) : 1.0;
  const ep = (parallelConfig.epGroups > 1 && architecture === 'moe')
    ? calcEPEfficiency(parallelConfig.epGroups) : 1.0;
  const cp = parallelConfig.cpSize > 1 ? calcCPEfficiency(parallelConfig.cpSize) : 1.0;

  return pp * tp * dp * ep * cp;
}

/**
 * 并行策略减少的有效显存需求
 *
 * PP 把模型层切分到多个阶段 → 每阶段只需 1/ppStages
 * TP 把每层参数沿维度切分   → 每 rank 只需 1/tpSize
 *
 * 组合后：effectiveMem = totalMem / (ppStages × tpSize)
 */
function calcParallelMemoryReduction(parallelConfig: ParallelConfig): number {
  const pp = parallelConfig.ppStages > 1 ? parallelConfig.ppStages : 1;
  const tp = parallelConfig.tpSize > 1 ? parallelConfig.tpSize : 1;
  return pp * tp;
}

/**
 * 并行策略支持的最大上下文长度乘数
 *
 * CP 按序列维度切分注意力，线性扩展最大上下文。
 */
export function calcParallelMaxContext(parallelConfig: ParallelConfig): number {
  return parallelConfig.cpSize > 1 ? parallelConfig.cpSize : 1;
}
export function calculateEffectiveCompute(
  cardSpecs: ComputeCardSpec[],
  cluster?: Cluster,
  dc?: DataCenter,
  techEffects: TechEffect[] = [],
  modelParams?: ModelParams,
  /** 单节点最大卡槽数（用于判断是否跨节点，默认 8） */
  maxSlotsPerNode: number = 8,
  /**
   * 可选覆盖：当 cardSpecs 已去重（每型号一个 spec）时，
   * 传入真实总卡数/总算力/总功耗，避免按去重后数组长度误算规模。
   */
  overrides?: { totalCardCount?: number; totalTflops?: number; actualPowerKW?: number },
): UtilizationResult {
  const totalCardCount = overrides?.totalCardCount ?? cardSpecs.length;
  const totalTflops = overrides?.totalTflops ?? cardSpecs.reduce((sum, s) => sum + s.tflopsPerCard, 0);

  if (totalCardCount === 0 || totalTflops === 0) {
    return {
      totalTflops: 0,
      effectiveTflops: 0,
      utilization: 0,
      requiresParallel: false,
      parallelSize: 0,
      interconnectPenalty: 0,
      crossNodePenalty: 0,
      scalePenalty: 1.0,
      homogeneityFactor: 1.0,
      actualPowerKW: 0,
      powerUtilization: 0,
    };
  }

  const bottlenecks: string[] = [];

  // ===== 1. 软件利用率 =====
  // ★ PR-A 修复：原 Σ value 加法累加，100 个 +1% 技术即可推至 95% 利用率上限
  //   改用乘法叠加 1 - Π(1-v)，硬性上限 +30%（max softwareUtil = 0.4 + 0.30 = 0.70）
  //   示例：10 个 +3% 技术 → 旧 30%，新 1-0.97^10 = 26.3%
  let softwareUtil = 0.4 + aggregateMultiplicative(
    techEffects,
    'improve_utilization',
    TECH_EFFECT_CAPS.improve_utilization,
  );
  softwareUtil = clamp(softwareUtil, 0, 0.95);

  // ===== 2. 集群利用率 =====
  let clusterUtil = 0.9;
  if (cluster) {
    clusterUtil = 0.9 + cluster.utilizationBonus;
  }
  clusterUtil = clamp(clusterUtil, 0, 1);

  // ===== 3. 冷却加成（含 PUE 衰减惩罚） =====
  let coolingBonus = 0;
  if (dc) {
    const cooling = getCoolingType(dc.coolingType);
    if (cooling) {
      coolingBonus = cooling.utilizationBonus;
    }
    // PUE 衰减惩罚：currentPue 每超出 basePue 0.01，利用率降 0.5%
    const pueDegradation = dc.currentPue - dc.basePue;
    if (pueDegradation > 0) {
      coolingBonus -= pueDegradation * 0.5;
    }
  }

  // ===== 4. 电力因子（基于训练负载功耗） =====
  let powerFactor = 1.0;
  let actualPowerKW = 0;
  let powerUtilization = 0;
  if (dc) {
    // ★ 修复：当 cardSpecs 已去重时，用 override 传入的真实总功耗；
    //   否则按原逻辑从 cardSpecs 计算
    actualPowerKW = overrides?.actualPowerKW ?? calcActualPowerDraw(cardSpecs, 'training');
    const actualPowerMW = actualPowerKW / 1000;
    powerUtilization = dc.maxPowerMW > 0 ? actualPowerMW / dc.maxPowerMW : 0;
    powerFactor = calcPowerFactor(actualPowerMW, dc.maxPowerMW);
    if (powerFactor < 1.0) {
      if (powerFactor <= 0.5) {
        bottlenecks.push('电力过载');
      } else {
        bottlenecks.push('电力接近上限');
      }
    }
  }

  // ===== 5. 模型效率（显存与并行） =====
  let parallelEfficiency = 1.0;
  let requiresParallel = false;
  let parallelSize = 1;
  let strategyEfficiency = 1.0;
  let parallelMemReduction = 1;

  if (modelParams) {
    // 并行策略减少有效显存需求
    const pc = modelParams.parallelConfig;
    if (pc) {
      parallelMemReduction = calcParallelMemoryReduction(pc);
      strategyEfficiency = calcParallelStrategyEfficiency(pc, cardSpecs, modelParams.architecture);
    }

    // 实际每卡需要承载的显存 = 总需求 / 并行内存缩减
    const requiredMem = estimateRequiredMemory(modelParams) / parallelMemReduction;
    // ★ 修复：Math.min(...spread) 在 10万元素时爆栈，改用循环
    let minCardMem = Infinity;
    for (const s of cardSpecs) {
      if (s.memoryGB < minCardMem) minCardMem = s.memoryGB;
    }
    if (minCardMem === Infinity) minCardMem = 0;

    if (requiredMem > minCardMem) {
      requiresParallel = true;
      parallelSize = Math.ceil(requiredMem / minCardMem);
      parallelSize = Math.min(parallelSize, totalCardCount);

      let perCardLoss = 0.03;
      // ★ PR-A 修复：improve_parallel_efficiency 改用乘法叠加 + 硬性上限 +50%
      //   原加法累加下，N 个 1% 技术可让 perCardLoss 趋近 0.005 下限（并行几乎无损耗）
      //   新乘法叠加下，效果按 1 - Π(1-v) 聚合，100 个 1% 技术最多降 63.4%（被 cap 50%）
      const parallelEffBonus = aggregateMultiplicative(
        techEffects,
        'improve_parallel_efficiency',
        TECH_EFFECT_CAPS.improve_parallel_efficiency,
      );
      perCardLoss = Math.max(0.005, perCardLoss - parallelEffBonus);
      const extraCards = parallelSize - 1;
      parallelEfficiency = clamp(1 - extraCards * perCardLoss, 0.3, 1);
      if (pc && (pc.ppStages > 1 || pc.tpSize > 1)) {
        bottlenecks.push(`${pc.ppStages > 1 ? `PP×${pc.ppStages}` : ''}${pc.ppStages > 1 && pc.tpSize > 1 ? '+' : ''}${pc.tpSize > 1 ? `TP×${pc.tpSize}` : ''}并行 (${parallelSize} 卡)`);
      } else {
        bottlenecks.push(`模型并行 (${parallelSize} 卡)`);
      }
    } else if (pc && (pc.ppStages > 1 || pc.tpSize > 1 || pc.epGroups > 1 || pc.cpSize > 1)) {
      // 模型能放进单卡但仍启用了高级并行策略 → 冗余配置，收益仅来自策略效率
      bottlenecks.push(`高级并行（显存充裕，仅效率影响）`);
    }
  }

  // ===== 5b. 并行效率乘以集群并行效率基础值 =====
  if (cluster) {
    parallelEfficiency *= cluster.parallelEfficiencyBase;
  }

  // ===== 6. 互联带宽检查 =====
  if (requiresParallel && totalCardCount > 1) {
    // ★ 修复：Math.min(...spread) 在 10万元素时爆栈，改用循环
    let minBandwidth = Infinity;
    for (const s of cardSpecs) {
      if (s.memoryBandwidth < minBandwidth) minBandwidth = s.memoryBandwidth;
    }
    if (minBandwidth === Infinity) minBandwidth = 0;
    if (minBandwidth < 1000) {
      parallelEfficiency *= 0.9;
      bottlenecks.push('互联带宽不足');
    }
  }

  // ===== 7. 互联带宽惩罚（节点内） =====
  const interconnectPenalty = calcInterconnectPenalty(requiresParallel, parallelSize, cardSpecs);
  if (interconnectPenalty > 0) {
    bottlenecks.push('互联带宽瓶颈');
  }

  // ===== 7b. 跨节点通信惩罚 =====
  const crossNode = requiresParallel && parallelSize > maxSlotsPerNode;
  const crossNodePenalty = calcCrossNodePenalty(requiresParallel, parallelSize, crossNode, cluster);
  if (crossNodePenalty > 0) {
    bottlenecks.push('跨节点通信瓶颈');
  }

  // ===== 8. 规模惩罚 =====
  // ★ 修复：用 totalCardCount（真实卡数）替代 cardSpecs.length（去重后仅型号数）
  const scalePenalty = calcScalePenalty(totalCardCount, cluster?.networkTopology);
  if (scalePenalty < 1.0) {
    bottlenecks.push(`规模惩罚 (${(scalePenalty * 100).toFixed(1)}%)`);
  }

  // ===== 9. 同构性因子 =====
  const homogeneityFactor = calcHomogeneityFactor(cardSpecs);
  if (homogeneityFactor < 1.0) {
    bottlenecks.push('异构集群');
  }

  // ===== 综合利用率 =====
  // 并行策略效率乘数 (strategyEfficiency) 计入总利用率
  const utilization = clamp(
    softwareUtil * clusterUtil * (1 + coolingBonus) * powerFactor * parallelEfficiency
      * strategyEfficiency
      * (1 - interconnectPenalty) * (1 - crossNodePenalty) * scalePenalty * homogeneityFactor,
    0,
    0.98,
  );

  const effectiveTflops = totalTflops * utilization;

  return {
    totalTflops,
    effectiveTflops,
    utilization,
    bottleneck: bottlenecks.length > 0 ? bottlenecks.join('; ') : undefined,
    requiresParallel,
    parallelSize,
    interconnectPenalty,
    crossNodePenalty,
    scalePenalty,
    homogeneityFactor,
    actualPowerKW,
    powerUtilization,
  };
}

/**
 * ★ 聚合版卡规格摘要（十万卡场景性能优化）
 *
 * 替代直接展开为 ComputeCardSpec[]，避免为每张卡分配独立对象。
 * 100k 卡 → 1k 桶 → 1k 摘要项，而非 100k 个 spec 对象。
 */
export interface CardSpecSummary {
  /** 资源 id → 该型号规格与总卡数 */
  entries: Array<{ spec: ComputeCardSpec; count: number }>;
  /** 所有卡的总 TFlops */
  totalTflops: number;
  /** 实际卡数（按 count 累加） */
  totalCards: number;
  /** 是否存在任意卡 */
  hasCards: boolean;
  /** 用于计算 maxSlotsPerNode 的最大卡数（按单节点分组时可填充） */
  maxCardsInSingleGroup?: number;
}

/**
 * 从 (resourceId → {spec, count}) Map 构建 CardSpecSummary
 *
 * @param byResource 按资源分组的卡规格与数量
 * @param _workload 负载类型（保留参数以备扩展，当前不影响摘要构建）
 */
export function summarizeCardSpecsFromMap(
  byResource: Map<string, { spec: ComputeCardSpec; count: number }>,
  _workload: WorkloadType = 'training',
): CardSpecSummary {
  const entries: Array<{ spec: ComputeCardSpec; count: number }> = [];
  let totalTflops = 0;
  let totalCards = 0;
  for (const { spec, count } of byResource.values()) {
    if (count <= 0) continue;
    entries.push({ spec, count });
    totalTflops += spec.tflopsPerCard * count;
    totalCards += count;
  }
  return {
    entries,
    totalTflops,
    totalCards,
    hasCards: totalCards > 0,
  };
}

/**
 * 从 CardSpecSummary 提取去重的 ComputeCardSpec[]（每型号一个 spec）
 *
 * ★ 修复：原 expandSummary 按 count 复制 spec（10万卡 → 10万元素数组），
 *   导致 Math.min(...cardSpecs.map(...)) 爆栈。
 *   去重后仅 ~7 个元素（型号数），helper 函数只需型号属性，无需每卡一份。
 *   总卡数/总算力/总功耗通过 overrides 传入。
 */
function deduplicateSummary(summary: CardSpecSummary): ComputeCardSpec[] {
  return summary.entries.map((e) => e.spec);
}

/**
 * 聚合存储版的有效算力计算
 *
 * 接受 CardSpecSummary 而非 ComputeCardSpec[]，避免上游为十万卡分配中间数组。
 * 内部去重后传给 calculateEffectiveCompute，并通过 overrides 传入真实总卡数/总算力/总功耗。
 */
export function calculateEffectiveComputeFromSummary(
  summary: CardSpecSummary,
  cluster?: Cluster,
  dc?: DataCenter,
  techEffects: TechEffect[] = [],
  modelParams?: ModelParams,
  maxSlotsPerNode: number = 8,
): UtilizationResult {
  if (!summary.hasCards) {
    return {
      totalTflops: 0,
      effectiveTflops: 0,
      utilization: 0,
      requiresParallel: false,
      parallelSize: 0,
      interconnectPenalty: 0,
      crossNodePenalty: 0,
      scalePenalty: 1.0,
      homogeneityFactor: 1.0,
      actualPowerKW: 0,
      powerUtilization: 0,
    };
  }
  // ★ 修复：去重（每型号一个 spec）替代按 count 展开，避免 10万元素数组 + Math.min 爆栈
  const uniqueSpecs = deduplicateSummary(summary);
  // 从 summary 直接计算真实总功耗（training 负载因子 0.95）
  let actualPowerKW = 0;
  for (const { spec, count } of summary.entries) {
    actualPowerKW += count * spec.maxPowerDrawKW * 0.95;
  }
  return calculateEffectiveCompute(
    uniqueSpecs,
    cluster,
    dc,
    techEffects,
    modelParams,
    maxSlotsPerNode,
    {
      totalCardCount: summary.totalCards,
      totalTflops: summary.totalTflops,
      actualPowerKW,
    },
  );
}
