/**
 * 技术树配置
 *
 * P0 包含基础预训练、SFT、FlashAttention、RoPE、MoE 等核心技术。
 * 技术效果通过 TechEffect 类型表达。
 */
import type { TechEffect } from '../entities/Infrastructure';

/** 技术 id */
export type TechId =
  | 'pretraining'
  | 'sft'
  | 'flash_attention'
  | 'flash_attention_2'
  | 'rope'
  | 'moe'
  | 'data_cleaning_v1'
  | 'zero_1'
  | 'swiglu'
  | 'rmsnorm'
  | 'pre_ln';

/** 技术节点 */
export interface TechNode {
  id: TechId;
  name: string;
  description: string;
  /** 前置技术 */
  prerequisites: TechId[];
  /** 研发所需天数 */
  researchDays: number;
  /** 研发所需资金 */
  researchCost: number;
  /** 效果 */
  effect: TechEffect;
  /** 是否架构类（影响架构-能力映射） */
  isArchitecture: boolean;
}

export const TECH_TREE: TechNode[] = [
  {
    id: 'pretraining',
    name: '预训练',
    description: '基础语言模型预训练',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'modify_base_score_E', value: 0 },
    isArchitecture: false,
  },
  {
    id: 'sft',
    name: '监督微调(SFT)',
    description: '指令微调提升对话能力',
    prerequisites: ['pretraining'],
    researchDays: 15,
    researchCost: 50_000,
    effect: { type: 'capability_bonus', capability: 'dialogue_fluency', bonus: 0.15 },
    isArchitecture: false,
  },
  {
    id: 'flash_attention',
    name: 'FlashAttention',
    description: 'IO 感知注意力，降低显存占用 20%',
    prerequisites: ['pretraining'],
    researchDays: 20,
    researchCost: 80_000,
    effect: { type: 'reduce_memory', value: 0.2 },
    isArchitecture: false,
  },
  {
    id: 'flash_attention_2',
    name: 'FlashAttention v2',
    description: '进一步提升效率，训练算力 -10%',
    prerequisites: ['flash_attention'],
    researchDays: 25,
    researchCost: 120_000,
    effect: { type: 'reduce_compute_cost', value: 0.1 },
    isArchitecture: false,
  },
  {
    id: 'rope',
    name: '旋转位置编码(RoPE)',
    description: '优异的长度外推性，上下文 ×4',
    prerequisites: ['pretraining'],
    researchDays: 18,
    researchCost: 60_000,
    effect: { type: 'extend_context', multiplier: 4 },
    isArchitecture: true,
  },
  {
    id: 'moe',
    name: '混合专家(MoE)',
    description: '稀疏激活扩大参数规模，A +150',
    prerequisites: ['pretraining'],
    researchDays: 40,
    researchCost: 300_000,
    effect: { type: 'modify_base_score_A', value: 150 },
    isArchitecture: true,
  },
  {
    id: 'data_cleaning_v1',
    name: '数据清洗v1',
    description: '提升数据质量，B +100',
    prerequisites: ['pretraining'],
    researchDays: 12,
    researchCost: 40_000,
    effect: { type: 'modify_base_score_B', value: 100 },
    isArchitecture: false,
  },
  {
    id: 'zero_1',
    name: 'ZeRO-1',
    description: '优化器状态分片，显存 -15%',
    prerequisites: ['pretraining'],
    researchDays: 15,
    researchCost: 50_000,
    effect: { type: 'reduce_memory', value: 0.15 },
    isArchitecture: false,
  },
  {
    id: 'swiglu',
    name: 'SwiGLU',
    description: '门控激活函数提升质量，A +50',
    prerequisites: ['pretraining'],
    researchDays: 15,
    researchCost: 60_000,
    effect: { type: 'modify_base_score_A', value: 50 },
    isArchitecture: true,
  },
  {
    id: 'rmsnorm',
    name: 'RMSNorm',
    description: '高效归一化，训练算力 -5%',
    prerequisites: ['pretraining'],
    researchDays: 10,
    researchCost: 30_000,
    effect: { type: 'reduce_compute_cost', value: 0.05 },
    isArchitecture: false,
  },
  {
    id: 'pre_ln',
    name: 'Pre-LN',
    description: '前置归一化提升训练稳定性，E +0.2',
    prerequisites: ['pretraining'],
    researchDays: 12,
    researchCost: 40_000,
    effect: { type: 'modify_base_score_E', value: 0.2 },
    isArchitecture: false,
  },
];

export const TECH_MAP: Record<TechId, TechNode> =
  Object.fromEntries(TECH_TREE.map((t) => [t.id, t])) as Record<TechId, TechNode>;
