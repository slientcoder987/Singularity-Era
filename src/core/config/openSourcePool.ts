import type { IdeaTechNode } from './techTree';

/**
 * 开源技术候选池
 *
 * 由 open_source 策略竞争对手（Menta / Mistral / ShallowFind）触发开源事件。
 * 采纳后初始 maturity=30，需本地化适配。
 * 60% 概率从此池随机选；40% 概率从主技术树未解锁技术中选。
 */
export const OPEN_SOURCE_TECH_POOL: IdeaTechNode[] = [
  {
    id: 'open_gqa',
    name: '开源 GQA',
    description: '分组查询注意力，算力 -5%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.05 },
    isArchitecture: false,
    source: 'open_source',
  },
  {
    id: 'open_quant_v2',
    name: '开源量化方案 v2',
    description: '社区优化的 INT8 量化，算力 -10%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.10 },
    isArchitecture: false,
    source: 'open_source',
  },
  {
    id: 'open_flash_attn_v3',
    name: '开源 FlashAttention v3',
    description: '社区改进版，显存 -12%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'reduce_memory', value: 0.12 },
    isArchitecture: false,
    source: 'open_source',
  },
  {
    id: 'open_long_rope',
    name: '开源长程 RoPE',
    description: '社区外推方案，上下文 ×5',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'extend_context', multiplier: 5 },
    isArchitecture: true,
    source: 'open_source',
  },
  {
    id: 'open_dpo_v2',
    name: '开源 DPO v2',
    description: '改进的偏好优化，利用率 +3%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'improve_utilization', value: 0.03 },
    isArchitecture: false,
    source: 'open_source',
  },
  {
    id: 'open_data_cleaning',
    name: '开源数据清洗',
    description: '社区清洗工具链，数据质量 +8%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'improve_data_quality', value: 0.08 },
    isArchitecture: false,
    source: 'open_source',
  },
  {
    id: 'open_swiglu_v2',
    name: '开源 SwiGLU v2',
    description: '改进的激活函数，A -40',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'modify_base_score_A', value: -40 },
    isArchitecture: true,
    source: 'open_source',
  },
];