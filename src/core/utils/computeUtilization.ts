import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { Cluster, DataCenter, TechEffect } from '../entities/Infrastructure';
import { getCoolingType } from '../config/infrastructure';
import { clamp } from '../utils';

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
  const actualBW = Math.min(
    ...cardSpecs.map((s) => (s.nvlinkBandwidth > 0 ? s.nvlinkBandwidth : s.memoryBandwidth / 4)),
  );

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
 */
function calcScalePenalty(totalGpus: number): number {
  if (totalGpus <= 8) return 1.0;
  if (totalGpus <= 64) return Math.max(1 - Math.log(totalGpus / 8) * 0.02, 0.70);
  if (totalGpus <= 512) return Math.max(1 - Math.log(totalGpus / 64) * 0.04, 0.70);
  return Math.max(1 - Math.log(totalGpus / 512) * 0.06, 0.70);
}

/**
 * 计算同构性因子
 */
function calcHomogeneityFactor(cardSpecs: ComputeCardSpec[]): number {
  if (cardSpecs.length <= 1) return 1.0;

  const resourceIds = new Set(cardSpecs.map((s) => s.resourceId));
  if (resourceIds.size === 1) return 1.0;

  const powers = cardSpecs.map((s) => s.maxPowerDrawKW);
  const minPower = Math.min(...powers);
  const maxPower = Math.max(...powers);
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
 * 计算有效算力
 *
 * utilization = softwareUtil × clusterUtil × (1 + coolingBonus) × powerFactor
 *               × parallelEfficiency × (1 - interconnectPenalty)
 *               × (1 - crossNodePenalty) × scalePenalty × homogeneityFactor
 */
export function calculateEffectiveCompute(
  cardSpecs: ComputeCardSpec[],
  cluster?: Cluster,
  dc?: DataCenter,
  techEffects: TechEffect[] = [],
  modelParams?: ModelParams,
  /** 单节点最大卡槽数（用于判断是否跨节点，默认 8） */
  maxSlotsPerNode: number = 8,
): UtilizationResult {
  const totalTflops = cardSpecs.reduce((sum, s) => sum + s.tflopsPerCard, 0);

  if (cardSpecs.length === 0 || totalTflops === 0) {
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
  let softwareUtil = 0.4;
  for (const eff of techEffects) {
    if (eff.type === 'improve_utilization') {
      softwareUtil += eff.value;
    }
  }
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
    actualPowerKW = calcActualPowerDraw(cardSpecs, 'training');
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

  if (modelParams) {
    const requiredMem = estimateRequiredMemory(modelParams);
    const minCardMem = Math.min(...cardSpecs.map((s) => s.memoryGB));

    if (requiredMem > minCardMem) {
      requiresParallel = true;
      parallelSize = Math.ceil(requiredMem / minCardMem);
      parallelSize = Math.min(parallelSize, cardSpecs.length);

      let perCardLoss = 0.03;
      for (const eff of techEffects) {
        if (eff.type === 'improve_parallel_efficiency') {
          perCardLoss = Math.max(0.005, perCardLoss - eff.value);
        }
      }
      const extraCards = parallelSize - 1;
      parallelEfficiency = clamp(1 - extraCards * perCardLoss, 0.3, 1);
      bottlenecks.push(`模型并行 (${parallelSize} 卡)`);
    }
  }

  // ===== 5b. 并行效率乘以集群并行效率基础值 =====
  if (cluster) {
    parallelEfficiency *= cluster.parallelEfficiencyBase;
  }

  // ===== 6. 互联带宽检查 =====
  if (requiresParallel && cardSpecs.length > 1) {
    const minBandwidth = Math.min(...cardSpecs.map((s) => s.memoryBandwidth));
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
  const scalePenalty = calcScalePenalty(cardSpecs.length);
  if (scalePenalty < 1.0) {
    bottlenecks.push(`规模惩罚 (${(scalePenalty * 100).toFixed(1)}%)`);
  }

  // ===== 9. 同构性因子 =====
  const homogeneityFactor = calcHomogeneityFactor(cardSpecs);
  if (homogeneityFactor < 1.0) {
    bottlenecks.push('异构集群');
  }

  // ===== 综合利用率 =====
  const utilization = clamp(
    softwareUtil * clusterUtil * (1 + coolingBonus) * powerFactor * parallelEfficiency
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
