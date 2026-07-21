import type { IdeaTechNode } from './techTree';

/**
 * 小公司专属技术候选池
 *
 * 收购小公司时，其技术可能来自此池（独有技术）或主技术树。
 * PR-D：收购后初始 maturity 随机 20~80（生成公司时即 roll，玩家收购前可见）。
 */
export const SMALL_COMPANY_TECH_POOL: IdeaTechNode[] = [
  {
    id: 'sc_kv_cache_opt', name: 'KV Cache 极致优化', description: '小公司专利，显存 -8%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_memory', value: 0.08 },
    isArchitecture: false, source: 'small_company', difficulty: 4,
  },
  {
    id: 'sc_dynamic_batching', name: '动态批处理', description: '自适应批处理，利用率 +4%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_utilization', value: 0.04 },
    isArchitecture: false, source: 'small_company', difficulty: 4,
  },
  {
    id: 'sc_grad_accum', name: '梯度累积优化', description: '大 batch 模拟，算力 -7%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.07 },
    isArchitecture: false, source: 'small_company', difficulty: 4,
  },
  {
    id: 'sc_moe_routing', name: 'MoE 路由专利', description: '专有路由算法，编码能力 +6%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'coding_agent', bonus: 0.06 },
    isArchitecture: false, source: 'small_company', difficulty: 5,
  },
  {
    id: 'sc_long_context', name: '长上下文专利', description: '专有长上下文方案，上下文 ×3',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'extend_context', multiplier: 3 },
    isArchitecture: true, source: 'small_company', difficulty: 5,
  },
  {
    id: 'sc_data_dedup', name: '数据去重专利', description: '专有去重算法，数据质量 +6%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_data_quality', value: 0.06 },
    isArchitecture: false, source: 'small_company', difficulty: 3,
  },
  {
    id: 'sc_alignment_fine', name: '精细对齐', description: '专有对齐方法，对齐度 +15%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_alignment', value: 0.15 },
    isArchitecture: false, source: 'small_company', difficulty: 6,
  },
];
