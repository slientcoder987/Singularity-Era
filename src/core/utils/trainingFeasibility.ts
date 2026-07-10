import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { Cluster, ServerNode } from '../entities/Infrastructure';

/**
 * 训练可行性评估结果
 */
export interface TrainingFeasibility {
  /** 是否可行 */
  feasible: boolean;
  /** 并行策略 */
  strategy: 'dp_only' | 'tp_single_node' | 'tp_cross_node' | 'tp_pp_dp_3d';
  /** 所需 GPU 数量 */
  requiredGpus: number;
  /** 所需节点数量 */
  requiredNodes: number;
  /** 所需最低互联带宽 GB/s */
  minInterconnectBW: number;
  /** 所需最低网络带宽 GB/s */
  minNetworkBW: number;
  /** 所需最低存储IO GB/s */
  minStorageIO: number;
  /** 并行效率损失 0~1 */
  parallelPenalty: number;
  /** 警告信息 */
  warnings: string[];
}

/**
 * 训练模型参数
 */
export interface TrainingModelParams {
  /** 参数量 N（十亿，如 7 表示 7B） */
  paramCount: number;
  /** 上下文长度 n_ctx */
  contextLength: number;
  /** 架构类型（'dense' | 'moe'） */
  architecture: string;
}

/**
 * 估算模型所需显存 GB
 *
 * 权重 fp16: 2 GB/B
 * 优化器状态（Adam FP32 master + 动量 + 方差）: 12 GB/B
 * 激活内存: 与上下文长度成正比
 */
function estimateRequiredMemory(model: TrainingModelParams): number {
  const weightMemory = model.paramCount * 2;
  const optimizerMemory = model.paramCount * 12;
  const activationMemory = model.paramCount * 0.0002 * model.contextLength;
  return weightMemory + optimizerMemory + activationMemory;
}

/**
 * 评估训练可行性
 *
 * 根据模型参数和集群基础设施信息，判断训练是否可行，
 * 确定并行策略，计算并行效率损失和硬件要求。
 */
export function assessTrainingFeasibility(
  model: TrainingModelParams,
  cluster: Cluster,
  nodes: ServerNode[],
  cardSpecs: ComputeCardSpec[],
): TrainingFeasibility {
  const warnings: string[] = [];

  // 步骤 1：计算模型总显存需求
  const totalMemoryPerReplica = estimateRequiredMemory(model);

  // 步骤 2：判断是否需要模型并行
  const minCardMem = cardSpecs.length > 0
    ? Math.min(...cardSpecs.map((s) => s.memoryGB))
    : 0;
  const totalCards = cardSpecs.length;

  let strategy: TrainingFeasibility['strategy'];
  let parallelSize: number;
  let parallelPenalty: number;

  if (totalMemoryPerReplica <= minCardMem) {
    strategy = 'dp_only';
    parallelSize = 1;
    parallelPenalty = 0;
  } else {
    parallelSize = Math.ceil(totalMemoryPerReplica / minCardMem);

    // 单节点最大 TP 度 = 最大槽位数
    const maxIntraNodeTP = nodes.length > 0
      ? Math.max(...nodes.map((n) => n.slotCount))
      : 1;

    // 节点最大互联带宽
    const maxNodeBW = nodes.length > 0
      ? Math.max(...nodes.map((n) => n.interconnectBandwidth))
      : 0;

    if (parallelSize <= maxIntraNodeTP && maxNodeBW >= 200) {
      strategy = 'tp_single_node';
      parallelPenalty = (parallelSize - 1) * 0.03;
    } else if (parallelSize <= cluster.maxTPDegree * maxIntraNodeTP) {
      strategy = 'tp_cross_node';
      const tpSize = Math.min(parallelSize, cluster.maxTPDegree * maxIntraNodeTP);
      parallelPenalty = (tpSize - 1) * 0.03 + (Math.ceil(parallelSize / tpSize) - 1) * 0.05;
    } else {
      strategy = 'tp_pp_dp_3d';
      const tpSize = cluster.maxTPDegree * maxIntraNodeTP;
      const ppStages = Math.ceil(parallelSize / tpSize);
      parallelPenalty = (tpSize - 1) * 0.03 + (ppStages - 1) * 0.08;
    }
  }

  // 步骤 4：计算最低硬件要求
  const minInterconnectBW = strategy === 'dp_only'
    ? 0
    : model.contextLength > 32768
      ? 600
      : 200;

  const minNetworkBW = strategy === 'dp_only'
    ? 0
    : (strategy === 'tp_cross_node' || strategy === 'tp_pp_dp_3d')
      ? 10
      : 0;

  const minStorageIO = totalCards * 0.1;

  // 步骤 5：生成警告
  if (model.contextLength > 32768 && minInterconnectBW < 600) {
    warnings.push('长上下文训练需要 NVSwitch');
  }
  if (model.contextLength > 131072) {
    warnings.push('超长序列需要 NVSwitch Gen2+');
  }
  if (model.contextLength > 1048576) {
    warnings.push('百万级上下文需要 NVSwitch Gen3+ 且 storageIO ≥ 50');
  }
  if (parallelSize > totalCards) {
    warnings.push('GPU 数量不足以满足并行需求');
  }

  // 步骤 6：判定 feasible
  const maxNodeBW = nodes.length > 0
    ? Math.max(...nodes.map((n) => n.interconnectBandwidth))
    : 0;

  const feasible = totalCards >= parallelSize
    && maxNodeBW >= minInterconnectBW
    && cluster.networkBandwidth >= minNetworkBW
    && cluster.storageIO >= minStorageIO;

  // 步骤 7：计算 requiredGpus 和 requiredNodes
  const requiredGpus = Math.max(parallelSize, 1);
  const gpusPerNode = nodes.length > 0
    ? Math.max(...nodes.map((n) => n.installedCards.length), 1)
    : 1;
  const maxIntraNodeTP = nodes.length > 0
    ? Math.max(...nodes.map((n) => n.slotCount))
    : 1;
  const requiredNodes = Math.ceil(requiredGpus / Math.min(gpusPerNode, maxIntraNodeTP));

  return {
    feasible,
    strategy,
    requiredGpus,
    requiredNodes,
    minInterconnectBW,
    minNetworkBW,
    minStorageIO,
    parallelPenalty,
    warnings,
  };
}
