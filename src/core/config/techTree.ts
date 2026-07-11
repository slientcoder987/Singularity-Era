/**
 * 技术树配置
 *
 * P0 + P1 合并技术树。
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
  | 'pre_ln'
  // P1 新增
  | 'rlhf'
  | 'dpo'
  | 'cot_training'
  | 'data_deduplication'
  | 'data_curation'
  | 'stable_training'
  | 'gradient_clipping'
  | 'distillation'
  | 'quantization'
  | 'long_context_training'
  | 'auto_research'
  | 'alignment_v1'
  | 'cev_alignment';

/** 技术节点 */
export interface TechNode {
  id: string;
  name: string;
  description: string;
  /** 前置技术 */
  prerequisites: string[];
  /** 研发所需天数 */
  researchDays: number;
  /** 研发所需资金 */
  researchCost: number;
  /** 效果 */
  effect: TechEffect;
  /** 是否架构类（影响架构-能力映射） */
  isArchitecture: boolean;
}

/** P0 技术节点 */
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
    description: '稀疏激活提升参数效率，A -200',
    prerequisites: ['pretraining'],
    researchDays: 40,
    researchCost: 300_000,
    effect: { type: 'modify_base_score_A', value: -200 },
    isArchitecture: true,
  },
  {
    id: 'data_cleaning_v1',
    name: '数据清洗v1',
    description: '提升数据效率，B -200',
    prerequisites: ['pretraining'],
    researchDays: 12,
    researchCost: 40_000,
    effect: { type: 'modify_base_score_B', value: -200 },
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
    description: '门控激活函数提升质量，A -60',
    prerequisites: ['pretraining'],
    researchDays: 15,
    researchCost: 60_000,
    effect: { type: 'modify_base_score_A', value: -60 },
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

/** P1 技术节点 */
export const TECH_TREE_P1: TechNode[] = [
  {
    id: 'rlhf', name: 'RLHF', description: '人类反馈强化学习，降低谄媚性',
    prerequisites: ['sft'], researchDays: 30, researchCost: 200_000,
    effect: { type: 'capability_bonus', capability: 'sycophancy', bonus: -0.1 },
    isArchitecture: false,
  },
  {
    id: 'dpo', name: 'DPO', description: '直接偏好优化，简化RLHF',
    prerequisites: ['rlhf'], researchDays: 20, researchCost: 150_000,
    effect: { type: 'improve_utilization', value: 0.02 },
    isArchitecture: false,
  },
  {
    id: 'cot_training', name: 'CoT训练', description: '思维链训练提升推理',
    prerequisites: ['sft'], researchDays: 25, researchCost: 120_000,
    effect: { type: 'capability_bonus', capability: 'math_reasoning', bonus: 0.1 },
    isArchitecture: false,
  },
  {
    id: 'data_deduplication', name: '数据去重', description: '减少冗余提升效率',
    prerequisites: ['data_cleaning_v1'], researchDays: 15, researchCost: 60_000,
    effect: { type: 'improve_data_quality', value: 0.1 },
    isArchitecture: false,
  },
  {
    id: 'data_curation', name: '数据精选', description: '高质量数据筛选',
    prerequisites: ['data_deduplication'], researchDays: 20, researchCost: 100_000,
    effect: { type: 'improve_data_quality', value: 0.15 },
    isArchitecture: false,
  },
  {
    id: 'stable_training', name: '稳定训练', description: '防止训练崩溃，概率-50%',
    prerequisites: ['pre_ln'], researchDays: 25, researchCost: 100_000,
    effect: { type: 'reduce_training_crash_risk', value: 0.5 },
    isArchitecture: false,
  },
  {
    id: 'gradient_clipping', name: '梯度裁剪', description: '防止梯度爆炸，概率-30%',
    prerequisites: ['pre_ln'], researchDays: 15, researchCost: 50_000,
    effect: { type: 'reduce_training_crash_risk', value: 0.3 },
    isArchitecture: false,
  },
  {
    id: 'distillation', name: '蒸馏', description: '大模型蒸馏到小模型',
    prerequisites: ['sft'], researchDays: 25, researchCost: 150_000,
    effect: { type: 'enable_distillation', efficiencyBonus: 0.7 },
    isArchitecture: false,
  },
  {
    id: 'quantization', name: '量化训练', description: '低精度训练加速，算力-15%',
    prerequisites: ['rmsnorm'], researchDays: 20, researchCost: 100_000,
    effect: { type: 'reduce_compute_cost', value: 0.15 },
    isArchitecture: false,
  },
  {
    id: 'long_context_training', name: '长上下文训练', description: '支持超长上下文，×8',
    prerequisites: ['rope', 'flash_attention_2'], researchDays: 35, researchCost: 250_000,
    effect: { type: 'extend_context', multiplier: 8 },
    isArchitecture: false,
  },
  {
    id: 'auto_research', name: '自动科研辅助', description: 'AI辅助研发，速度+50%',
    prerequisites: ['rlhf', 'cot_training'], researchDays: 50, researchCost: 500_000,
    effect: { type: 'improve_research_speed', value: 0.5 },
    isArchitecture: false,
  },
  {
    id: 'alignment_v1', name: '对齐v1', description: '基础对齐技术',
    prerequisites: ['rlhf'], researchDays: 30, researchCost: 200_000,
    effect: { type: 'improve_alignment', value: 0.3 },
    isArchitecture: false,
  },
  {
    id: 'cev_alignment', name: 'CEV对齐', description: '连贯外推意志对齐',
    prerequisites: ['alignment_v1', 'auto_research'], researchDays: 60, researchCost: 800_000,
    effect: { type: 'improve_alignment', value: 0.5 },
    isArchitecture: false,
  },
];

/** P0 + P1 全部技术 */
export const ALL_TECH: TechNode[] = [...TECH_TREE, ...TECH_TREE_P1];

/** 技术映射表 */
export const TECH_MAP: Record<string, TechNode> =
  Object.fromEntries(ALL_TECH.map((t) => [t.id, t]));
