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
}

/** 模型参数信息 */
export interface ModelParams {
  /** 参数量（亿，如 7 表示 7B） */
  paramCount: number;
  /** 架构类型 */
  architecture: string;
}

/**
 * 估算模型所需显存 GB
 *
 * 简化模型：权重 fp16 = params * 2 bytes + 激活内存 + 优化器状态。
 * 7B 模型约需 14GB 权重 + ~16GB 激活/优化器 ≈ 30GB。
 */
export function estimateRequiredMemory(model: ModelParams): number {
  const paramsInBillions = model.paramCount;
  // 权重 fp16: 2 GB / B
  const weightMemory = paramsInBillions * 2;
  // 激活 + 优化器状态: 约 2.2x 权重
  const activationMemory = weightMemory * 2.2;
  return weightMemory + activationMemory;
}

/**
 * 计算有效算力
 *
 * 有效算力 = 理论总算力 × 软件利用率 × 集群利用率 × 冷却加成 × 模型效率因子
 *
 * 各因子：
 * 1. 软件利用率：基础 0.4 + 科技改进 + （未来）员工技能
 * 2. 集群利用率：有集群取 cluster.utilizationBonus + 0.9 基数；无集群 0.9
 * 3. 冷却加成：air 0, liquid +0.05, immersion +0.1
 * 4. 电力限制：若数据中心功耗接近上限，利用率衰减
 * 5. 模型效率：显存不足需模型并行，每多一张卡效率损失
 *
 * @param cardSpecs 参与计算的卡规格列表（每张卡一个元素）
 * @param cluster 所属集群（可选）
 * @param dc 所属数据中心（可选）
 * @param techEffects 激活的科技效果
 * @param modelParams 模型参数（可选，用于判断显存和并行）
 */
export function calculateEffectiveCompute(
  cardSpecs: ComputeCardSpec[],
  cluster?: Cluster,
  dc?: DataCenter,
  techEffects: TechEffect[] = [],
  modelParams?: ModelParams,
): UtilizationResult {
  // 理论总算力
  const totalTflops = cardSpecs.reduce((sum, s) => sum + s.tflopsPerCard, 0);

  if (cardSpecs.length === 0 || totalTflops === 0) {
    return {
      totalTflops: 0,
      effectiveTflops: 0,
      utilization: 0,
      requiresParallel: false,
      parallelSize: 0,
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
  let clusterUtil = 0.9; // 单机默认较高
  if (cluster) {
    clusterUtil = 0.9 + cluster.utilizationBonus;
  }
  clusterUtil = clamp(clusterUtil, 0, 1);

  // ===== 3. 冷却加成 =====
  let coolingBonus = 0;
  if (dc) {
    const cooling = getCoolingType(dc.coolingType);
    if (cooling) {
      coolingBonus = cooling.utilizationBonus;
    }
  }

  // ===== 4. 电力限制 =====
  let powerPenalty = 0;
  if (dc) {
    const totalPowerKW = cardSpecs.reduce((sum, s) => sum + s.maxPowerDrawKW, 0);
    const totalPowerMW = totalPowerKW / 1000;
    // 若接近 maxPowerMW 的 90%，开始衰减
    const threshold = dc.maxPowerMW * 0.9;
    if (totalPowerMW > dc.maxPowerMW) {
      // 超过上限，严重衰减
      powerPenalty = 0.5;
      bottlenecks.push('电力过载');
    } else if (totalPowerMW > threshold) {
      // 接近上限，轻微衰减
      const overRatio = (totalPowerMW - threshold) / (dc.maxPowerMW - threshold);
      powerPenalty = overRatio * 0.2;
      bottlenecks.push('电力接近上限');
    }
  }

  // ===== 5. 模型效率（显存与并行） =====
  let parallelEfficiency = 1.0;
  let requiresParallel = false;
  let parallelSize = 1;

  if (modelParams) {
    const requiredMem = estimateRequiredMemory(modelParams);
    // 取所有卡中最小显存作为判断基准
    const minCardMem = Math.min(...cardSpecs.map((s) => s.memoryGB));

    if (requiredMem > minCardMem) {
      // 需要模型并行
      requiresParallel = true;
      // 估算需要多少张卡
      parallelSize = Math.ceil(requiredMem / minCardMem);
      parallelSize = Math.min(parallelSize, cardSpecs.length);

      // 并行效率损失：每多一张卡，效率降低 3%（可被科技缓解）
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

  // ===== 6. 互联带宽检查（简化） =====
  if (requiresParallel && cardSpecs.length > 1) {
    const minBandwidth = Math.min(...cardSpecs.map((s) => s.memoryBandwidth));
    if (minBandwidth < 1000) {
      // 低带宽卡并行效率更差
      parallelEfficiency *= 0.9;
      bottlenecks.push('互联带宽不足');
    }
  }

  // ===== 综合利用率 =====
  const utilization = clamp(
    softwareUtil * clusterUtil * (1 + coolingBonus) * (1 - powerPenalty) * parallelEfficiency,
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
  };
}
