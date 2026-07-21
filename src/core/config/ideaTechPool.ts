/**
 * 独有技术候选池（员工 idea 生成时随机选取）
 *
 * 这些技术不在主技术树中，只能通过员工 idea 获得。
 * 接受后初始 maturity=30，可通过训练使用 / 主动打磨 / idea 加速提升。
 *
 * 池中技术一旦被玩家接受，会注册到 IDEA_TECH_MAP 运行时表，
 * 并通过 GameData.acceptedIdeaTechs 持久化，加载存档时重建。
 */
import type { IdeaTechNode } from './techTree';

export const IDEA_TECH_POOL: IdeaTechNode[] = [
  {
    id: 'mixture_of_depths', name: 'MoD 混合深度', description: '动态跳过部分层计算，算力 -8%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.08 },
    isArchitecture: false, source: 'idea', difficulty: 4,
  },
  {
    id: 'sparse_attention_v2', name: '稀疏注意力 v2', description: '更高效的稀疏模式，上下文 ×2',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'extend_context', multiplier: 2 },
    isArchitecture: true, source: 'idea', difficulty: 4,
  },
  {
    id: 'dynamic_routing', name: '动态路由', description: '自适应计算路径，实用推理 +5%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'pragmatic_inference', bonus: 0.05 },
    isArchitecture: false, source: 'idea', difficulty: 4,
  },
  {
    id: 'kv_cache_compression', name: 'KV Cache 压缩', description: '压缩 KV 缓存，显存 -10%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_memory', value: 0.10 },
    isArchitecture: false, source: 'idea', difficulty: 3,
  },
  {
    id: 'token_pruning', name: 'Token 剪枝', description: '动态剪枝无效 token，算力 -6%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.06 },
    isArchitecture: false, source: 'idea', difficulty: 3,
  },
  {
    id: 'contrastive_decoding', name: '对比解码', description: '多模型对比提升创意写作 +8%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'creative_writing', bonus: 0.08 },
    isArchitecture: false, source: 'idea', difficulty: 4,
  },
  {
    id: 'self_consistency', name: '自一致性', description: '多采样投票提升数学推理 +6%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'math_reasoning', bonus: 0.06 },
    isArchitecture: false, source: 'idea', difficulty: 3,
  },
  {
    id: 'retrieval_augmented', name: '检索增强', description: '外挂知识库，世界知识 +10%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'world_knowledge', bonus: 0.10 },
    isArchitecture: false, source: 'idea', difficulty: 4,
  },
  {
    id: 'long_rope', name: '长程 RoPE', description: '改进的位置编码外推，上下文 ×6',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'extend_context', multiplier: 6 },
    isArchitecture: true, source: 'idea', difficulty: 5,
  },
  {
    id: 'moe_routing_v2', name: 'MoE 路由 v2', description: '更均衡的专家路由，编码能力 +6%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'coding_agent', bonus: 0.06 },
    isArchitecture: false, source: 'idea', difficulty: 5,
  },
];