import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { Cluster, ServerNode } from '../entities/Infrastructure';
import type { GameState } from '../GameState';
import type { ParallelConfig } from '../entities/TrainingProject';
import { getCardSpec } from '../config/computeCards';
import { getNodeIndex } from './infraIndex';
import { countOnlineCardsByNode } from './cardAggregate';

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
 * 激活内存: 与上下文长度成正比（数值修复：系数 0.0002 → 0.00005，
 *   原值对 70B×4096ctx 算出 57GB 激活 + 980GB 权重/优化器，总 1037GB/卡，
 *   远超 H100 80GB 显存，使 70B 纯 DP 完全不可行。修正后激活约 14GB，
 *   配合 TP/PP 并行可在多卡间分摊权重/优化器，大模型训练具备可行性路径。）
 */
function estimateRequiredMemory(model: TrainingModelParams): number {
  const weightMemory = model.paramCount * 2;
  const optimizerMemory = model.paramCount * 12;
  const activationMemory = model.paramCount * 0.00005 * model.contextLength;
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

/* ========================================================================
 * diagnoseTraining — 训练可行性诊断
 * ====================================================================== */

/** 单条诊断信息 */
export interface DiagnosisIssue {
  /** 严重性 */
  severity: 'blocker' | 'warning';
  /** 问题分类 */
  category: 'memory' | 'gpu_count' | 'interconnect' | 'network' | 'storage' | 'context' | 'power';
  /** 人类可读描述 */
  message: string;
}

/**
 * 训练可行性诊断
 *
 * 返回诊断问题列表。空列表 = 可行。
 * 用于在 UI 上显示为什么当前参数无法训练。
 */
export function diagnoseTraining(
  paramCount: number,
  contextLength: number,
  _architecture: string,
  clusterId: string,
  state: GameState,
  /** 可选：并行策略配置，用于准确估算每卡显存需求 */
  parallelConfig?: ParallelConfig,
): DiagnosisIssue[] {
  const current = state.read();
  const issues: DiagnosisIssue[] = [];

  // 1. 集群存在？
  const cluster = current.clusters.find((c) => c.id === clusterId);
  if (!cluster) {
    issues.push({ severity: 'blocker', category: 'network', message: '所选集群不存在' });
    return issues;
  }

  // 2. 收集集群内所有在线卡规格
  // ★ 性能优化：用聚合桶 O(桶数) 统计替代 O(卡数) 的 node.installedCards UID 遍历
  //   10万卡场景：O(几千桶) vs O(10万UID+cardIndex.get)
  const nodes: ServerNode[] = [];
  const nodeIdx = getNodeIndex(current);
  const nodeIdSet = new Set(cluster.nodes);
  const onlineByNode = countOnlineCardsByNode(current.resourceMeta, nodeIdSet);
  // 型号 resourceId → { spec, count } 聚合
  const byModel = new Map<string, { spec: ComputeCardSpec; count: number }>();
  let availGpus = 0;
  for (const nodeId of cluster.nodes) {
    const node = nodeIdx.get(nodeId);
    if (!node) continue;
    nodes.push(node);
    const nodeCards = onlineByNode.get(nodeId);
    if (!nodeCards) continue;
    availGpus += nodeCards.total;
    for (const [modelId, count] of nodeCards.byModel) {
      const spec = getCardSpec(modelId);
      if (spec) {
        const agg = byModel.get(spec.resourceId);
        if (agg) agg.count += count;
        else byModel.set(spec.resourceId, { spec, count });
      }
    }
  }

  if (availGpus === 0) {
    issues.push({ severity: 'blocker', category: 'gpu_count', message: '集群内无在线GPU，请先安装计算卡' });
    return issues;
  }

  if (nodes.length === 0) {
    issues.push({ severity: 'blocker', category: 'gpu_count', message: '集群内无可用节点' });
    return issues;
  }

  // 3. 估算显存需求（考虑并行策略的显存缩减）
  const paramB = paramCount; // 十亿
  const weightMem = paramB * 2;
  const activationMem = weightMem * 2.2;
  const rawMemPerReplica = weightMem + activationMem;
  // 并行缩减：PP 切层 + TP 切维度，有效单卡显存需求 = 原始 / (pp×tp)
  const ppReducer = (parallelConfig?.ppStages ?? 1) > 1 ? parallelConfig!.ppStages : 1;
  const tpReducer = (parallelConfig?.tpSize ?? 1) > 1 ? parallelConfig!.tpSize : 1;
  const totalMemPerReplica = rawMemPerReplica / (ppReducer * tpReducer);

  // 4. 检查单卡显存（★ 从聚合 Map O(型号数) 读取，替代 Math.min(...数十万数组)）
  let minCardMem = Infinity;
  let maxCardMem = -Infinity;
  let maxCardName = '未知';
  for (const { spec } of byModel.values()) {
    if (spec.memoryGB < minCardMem) minCardMem = spec.memoryGB;
    if (spec.memoryGB > maxCardMem) { maxCardMem = spec.memoryGB; maxCardName = spec.name; }
  }
  if (!Number.isFinite(minCardMem)) minCardMem = 0;
  if (!Number.isFinite(maxCardMem)) maxCardMem = 0;
  const tpSize = Math.max(1, Math.ceil(totalMemPerReplica / maxCardMem));

  if (totalMemPerReplica > maxCardMem) {
    const needCrossNode = tpSize > Math.max(...nodes.map((n) => n.slotCount));
    issues.push({
      severity: 'warning',
      category: 'memory',
      message: `模型需 ${totalMemPerReplica.toFixed(0)}GB 显存，最大单卡 ${maxCardName} 仅 ${maxCardMem}GB，需至少 ${tpSize} 张卡做张量并行（TP=${tpSize}）${needCrossNode ? '，超出单节点槽位数，需跨节点 TP' : ''}`,
    });
  }

  if (totalMemPerReplica <= minCardMem) {
    issues.push({
      severity: 'warning',
      category: 'memory',
      message: `模型仅需 ${totalMemPerReplica.toFixed(0)}GB 显存，单卡即可装载（仅需 DP）`,
    });
  }

  // 5. 检查并行GPU数量（availGpus 已在上方聚合时统计）
  if (tpSize > availGpus) {
    issues.push({
      severity: 'blocker',
      category: 'gpu_count',
      message: `需要至少 ${tpSize} 张GPU（TP=${tpSize}），但集群仅 ${availGpus} 张在线GPU`,
    });
  }

  // 6. 检查互联带宽
  const maxNodeBW = Math.max(...nodes.map((n) => n.interconnectBandwidth));
  const minIBW = contextLength > 32768 ? 600 : (tpSize > 1 ? 200 : 0);
  if (minIBW > 0 && maxNodeBW < minIBW) {
    const nvGen = nodes[0]?.nvswitchGeneration;
    issues.push({
      severity: 'blocker',
      category: 'interconnect',
      message: `需要节点互联带宽 ≥${minIBW}GB/s${
        contextLength > 32768 ? '（长上下文训练需 NVSwitch）' : '（模型并行通信需求）'
      }，当前最大 ${maxNodeBW}GB/s${nvGen ? `（NVSwitch Gen${nvGen}）` : ''}，请升级节点互联或减少参数量`,
    });
  }

  // 7. 检查网络带宽
  if (tpSize > Math.max(...nodes.map((n) => n.slotCount)) && cluster.networkBandwidth < 10) {
    issues.push({
      severity: 'blocker',
      category: 'network',
      message: `跨节点 TP 需要集群网络带宽 ≥10GB/s，当前 ${cluster.networkBandwidth.toFixed(0)}GB/s（${cluster.networkTopology ?? 'unknown'}），请使用更高带宽网络`,
    });
  }

  // 8. 检查存储IO
  const minStorageIO = availGpus * 0.1;
  if (cluster.storageIO < minStorageIO) {
    issues.push({
      severity: 'warning',
      category: 'storage',
      message: `建议存储 IO ≥${minStorageIO.toFixed(1)}GB/s（按 GPU 数估算），当前 ${cluster.storageIO}GB/s（${cluster.storageType}），可能拖慢数据加载`,
    });
  }

  // 9. 上下文长度与 NVSwitch 代际
  if (contextLength > 131072) {
    const nvGen = nodes[0]?.nvswitchGeneration ?? 0;
    if (nvGen < 2) {
      issues.push({
        severity: 'warning',
        category: 'context',
        message: `超长上下文（≥128K）建议 NVSwitch Gen2+，当前 Gen${nvGen}`,
      });
    }
  }
  if (contextLength > 1048576) {
    const nvGen = nodes[0]?.nvswitchGeneration ?? 0;
    if (nvGen < 3) {
      issues.push({
        severity: 'warning',
        category: 'context',
        message: `百万级上下文需 NVSwitch Gen3+，当前 Gen${nvGen}`,
      });
    }
  }

  return issues;
}

/* ========================================================================
 * 训练前可行性预览（数值修复：让玩家在训练前看到所需技术/硬件清单）
 * ====================================================================== */

export interface TrainingRequirementPreview {
  /** 目标参数量（B） */
  paramCount: number;
  /** 每副本总显存需求 GB（修正后） */
  memoryPerReplicaGB: number;
  /** 推荐并行策略 */
  recommendedStrategy: 'dp_only' | 'tp' | 'tp_pp' | 'tp_pp_3d';
  /** 所需技术（含前置）及说明 */
  requiredTechs: { techId: string; reason: string }[];
  /** 所需硬件清单 */
  requiredHardware: {
    minCardMemoryGB: number;
    minInterconnectBW: number;
    minGpuCount: number;
    recommendedNodeType: string;
  };
  /** 人类可读摘要 */
  summary: string[];
}

/**
 * 在训练前预估所需技术/硬件，避免玩家盲目尝试大模型。
 *
 * 规则（基于修正后的显存模型，单卡 H100=80GB 基准）：
 * - ≤13B：单卡可装载（dp_only），无需并行技术
 * - 13B~40B：需 TP（tensor_parallel），单节点内切分
 * - 40B~80B：需 TP+PP（tensor_parallel + pipeline_parallel），跨节点
 * - >80B：需 TP+PP+高带宽（NVSwitch），3D 并行
 */
export function previewTrainingRequirements(
  paramCount: number,
  contextLength: number,
  cardMemoryGB: number = 80,
): TrainingRequirementPreview {
  const memoryPerReplica = paramCount * 2 + paramCount * 12 + paramCount * 0.00005 * contextLength;
  const requiredTechs: { techId: string; reason: string }[] = [];
  const summary: string[] = [];

  let recommendedStrategy: TrainingRequirementPreview['recommendedStrategy'] = 'dp_only';
  let minInterconnectBW = 0;
  let recommendedNodeType = 'standard (PCIe)';
  let minGpuCount = 1;

  const fitsSingleCard = memoryPerReplica <= cardMemoryGB;

  if (fitsSingleCard) {
    recommendedStrategy = 'dp_only';
    minGpuCount = 1;
    summary.push(`${paramCount}B 模型约需 ${memoryPerReplica.toFixed(0)}GB 显存，单卡 ${cardMemoryGB}GB 可装载，仅需数据并行（DP）。`);
  } else if (paramCount <= 40) {
    recommendedStrategy = 'tp';
    minGpuCount = Math.ceil(memoryPerReplica / cardMemoryGB);
    minInterconnectBW = 200;
    recommendedNodeType = 'NVLink2/NVLink3';
    requiredTechs.push({ techId: 'tensor_parallel', reason: '单卡显存不足，需张量并行在多卡间切分权重' });
    summary.push(`${paramCount}B 模型约需 ${memoryPerReplica.toFixed(0)}GB 显存，超出单卡，需 TP=${minGpuCount}（tensor_parallel 技术）。`);
  } else if (paramCount <= 80) {
    recommendedStrategy = 'tp_pp';
    const tp = Math.min(8, Math.ceil(memoryPerReplica / cardMemoryGB / 2));
    const pp = Math.ceil(memoryPerReplica / cardMemoryGB / tp);
    minGpuCount = tp * pp;
    minInterconnectBW = 600;
    recommendedNodeType = 'NVLink3/NVSwitch Gen1';
    requiredTechs.push({ techId: 'tensor_parallel', reason: '张量并行切分权重维度' });
    requiredTechs.push({ techId: 'pipeline_parallel', reason: '流水线并行切分层，降低单卡显存' });
    summary.push(`${paramCount}B 模型约需 ${memoryPerReplica.toFixed(0)}GB 显存，需 TP=${tp}×PP=${pp}（tensor_parallel + pipeline_parallel）。`);
  } else {
    recommendedStrategy = 'tp_pp_3d';
    const tp = 8;
    const pp = Math.ceil(memoryPerReplica / cardMemoryGB / tp);
    minGpuCount = tp * pp;
    minInterconnectBW = 900;
    recommendedNodeType = 'NVSwitch Gen1+';
    requiredTechs.push({ techId: 'tensor_parallel', reason: '张量并行' });
    requiredTechs.push({ techId: 'pipeline_parallel', reason: '流水线并行' });
    requiredTechs.push({ techId: 'zero_1', reason: '优化器状态分片，进一步降低单卡显存' });
    summary.push(`${paramCount}B 模型约需 ${memoryPerReplica.toFixed(0)}GB 显存，需 3D 并行 TP=${tp}×PP=${pp} + ZeRO，且互联 ≥900GB/s（NVSwitch）。`);
  }

  if (contextLength > 32768) {
    requiredTechs.push({ techId: 'flash_attention_2', reason: '长上下文训练降低激活内存与通信' });
    minInterconnectBW = Math.max(minInterconnectBW, 600);
    summary.push(`长上下文（${contextLength}）建议 flash_attention_2 + NVSwitch。`);
  }

  return {
    paramCount,
    memoryPerReplicaGB: memoryPerReplica,
    recommendedStrategy,
    requiredTechs,
    requiredHardware: {
      minCardMemoryGB: cardMemoryGB,
      minInterconnectBW,
      minGpuCount,
      recommendedNodeType,
    },
    summary,
  };
}
