/**
 * 科技树配置
 *
 * 玩家通过研发投入解锁科技，影响训练效率、稳定性，并解锁隐性维度精确显示。
 * 新增科技只需在此添加条目。
 */

import type { TechEffect } from '../entities/Infrastructure';
import type { CapabilityDim } from '../config/capabilityDims';
import type { TrainingStageId } from '../config/trainingStages';

export type TechCategory =
  | 'training'
  | 'parallel'
  | 'stability'
  | 'evaluation'
  | 'architecture'
  | 'data';

/** 并行策略类型 */
export type ParallelStrategy = 'dp' | 'tp' | 'pp' | 'dp_tp' | 'dp_pp' | 'tp_pp' | 'dp_tp_pp';

export interface TechNode {
  id: string;
  name: string;
  description: string;
  category: TechCategory;
  /** 前置科技 id */
  prerequisites: string[];
  /** 研发成本（科技点） */
  researchCost: number;
  /** 研发所需天数 */
  researchDays: number;
  /** 解锁效果 */
  effects: TechEffect[];
  /** 解锁的隐性维度精确显示（可选） */
  revealsHiddenDims?: CapabilityDim[];
  /** 解锁的并行策略（可选） */
  unlocksParallelStrategy?: ParallelStrategy;
  /** 解锁的训练阶段（可选） */
  unlocksStage?: TrainingStageId;
  /** 解锁的架构（可选） */
  unlocksArchitecture?: string;
}

export const TECH_TREE: TechNode[] = [
  // ===== 训练效率 =====
  {
    id: 'efficient_optimizer',
    name: '高效优化器',
    description: 'AdamW 改进，提升训练利用率 5%',
    category: 'training',
    prerequisites: [],
    researchCost: 100,
    researchDays: 30,
    effects: [{ type: 'improve_utilization', value: 0.05 }],
  },
  {
    id: 'flash_attention',
    name: 'Flash Attention',
    description: '注意力计算优化，利用率 +8%',
    category: 'training',
    prerequisites: ['efficient_optimizer'],
    researchCost: 200,
    researchDays: 45,
    effects: [{ type: 'improve_utilization', value: 0.08 }],
  },
  {
    id: 'curriculum_learning',
    name: '课程学习',
    description: '按难度排序训练数据，数据质量 +15%',
    category: 'training',
    prerequisites: ['efficient_optimizer'],
    researchCost: 150,
    researchDays: 40,
    effects: [{ type: 'improve_data_quality', value: 0.15 }],
  },
  // ===== 并行策略 =====
  {
    id: 'tensor_parallel_basic',
    name: '张量并行基础',
    description: '解锁 TP，减少大模型显存压力',
    category: 'parallel',
    prerequisites: [],
    researchCost: 150,
    researchDays: 35,
    effects: [{ type: 'improve_parallel_efficiency', value: 0.02 }],
    unlocksParallelStrategy: 'tp',
  },
  {
    id: 'pipeline_parallel',
    name: '流水线并行',
    description: '解锁 PP，支持超大模型训练',
    category: 'parallel',
    prerequisites: ['tensor_parallel_basic'],
    researchCost: 300,
    researchDays: 60,
    effects: [{ type: 'improve_parallel_efficiency', value: 0.03 }],
    unlocksParallelStrategy: 'pp',
  },
  {
    id: '3d_parallel',
    name: '3D 并行',
    description: 'DP+TP+PP 联合，极致扩展性',
    category: 'parallel',
    prerequisites: ['pipeline_parallel'],
    researchCost: 500,
    researchDays: 90,
    effects: [{ type: 'improve_parallel_efficiency', value: 0.05 }],
    unlocksParallelStrategy: 'dp_tp_pp',
  },
  // ===== 稳定性 =====
  {
    id: 'gradient_clipping',
    name: '梯度裁剪',
    description: '训练崩溃概率 -30%',
    category: 'stability',
    prerequisites: [],
    researchCost: 80,
    researchDays: 20,
    effects: [{ type: 'reduce_crash_probability', value: 0.3 }],
  },
  {
    id: 'numerical_stability',
    name: '数值稳定性',
    description: 'BF16 训练稳定性提升',
    category: 'stability',
    prerequisites: ['gradient_clipping'],
    researchCost: 200,
    researchDays: 50,
    effects: [{ type: 'reduce_crash_probability', value: 0.2 }],
  },
  // ===== 评测 =====
  {
    id: 'eval_precision_math',
    name: '数学评测精化',
    description: '解锁 math_reasoning 精确数值',
    category: 'evaluation',
    prerequisites: [],
    researchCost: 100,
    researchDays: 25,
    effects: [],
    revealsHiddenDims: ['math_reasoning'],
  },
  {
    id: 'eval_precision_safety',
    name: '安全评测精化',
    description: '解锁 safety_alignment 精确数值',
    category: 'evaluation',
    prerequisites: ['eval_precision_math'],
    researchCost: 150,
    researchDays: 30,
    effects: [],
    revealsHiddenDims: ['sycophancy', 'deception'],
  },
  // ===== 架构 =====
  {
    id: 'moe_arch',
    name: 'MoE 架构',
    description: '解锁 MoE 架构，支持更大模型',
    category: 'architecture',
    prerequisites: ['tensor_parallel_basic'],
    researchCost: 400,
    researchDays: 80,
    effects: [],
    unlocksArchitecture: 'moe',
  },
  {
    id: 'long_context',
    name: '长上下文',
    description: '解锁长上下文架构',
    category: 'architecture',
    prerequisites: ['flash_attention'],
    researchCost: 300,
    researchDays: 60,
    effects: [],
    unlocksArchitecture: 'long_context',
  },
  // ===== 数据 =====
  {
    id: 'data_dedup',
    name: '数据去重',
    description: '数据质量 +10',
    category: 'data',
    prerequisites: [],
    researchCost: 80,
    researchDays: 20,
    effects: [{ type: 'improve_data_quality', value: 0.1 }],
  },
  {
    id: 'data_filtering',
    name: '数据过滤',
    description: '数据质量 +15',
    category: 'data',
    prerequisites: ['data_dedup'],
    researchCost: 150,
    researchDays: 35,
    effects: [{ type: 'improve_data_quality', value: 0.15 }],
  },
];

const TECH_MAP = new Map(TECH_TREE.map((t) => [t.id, t]));

export function getTechNode(id: string): TechNode | undefined {
  return TECH_MAP.get(id);
}

/** 获取某科技是否可研究（前置已满足且未完成） */
export function canResearch(
  techId: string,
  completedTechs: string[],
): boolean {
  if (completedTechs.includes(techId)) return false;
  const node = getTechNode(techId);
  if (!node) return false;
  return node.prerequisites.every((p) => completedTechs.includes(p));
}
