/**
 * 初始数据集配置
 *
 * 定义开局可用的公开数据领域。
 */
import type { Dataset, DataDomainId, DataDomain } from '../entities/Dataset';

/** 初始可用数据领域模板 */
export const INITIAL_DATA_DOMAINS: Record<DataDomainId, Omit<DataDomain, 'id'>> = {
  code:          { tokens: 50,  quality: 0.7,  freshness: 0.8,  duplication: 0.2 },
  math:          { tokens: 20,  quality: 0.8,  freshness: 0.7,  duplication: 0.1 },
  science:       { tokens: 30,  quality: 0.85, freshness: 0.6,  duplication: 0.15 },
  web:           { tokens: 200, quality: 0.5,  freshness: 0.9,  duplication: 0.4 },
  books:         { tokens: 80,  quality: 0.8,  freshness: 0.3,  duplication: 0.1 },
  dialogue:      { tokens: 15,  quality: 0.6,  freshness: 0.85, duplication: 0.2 },
  multilingual:  { tokens: 40,  quality: 0.55, freshness: 0.7,  duplication: 0.25 },
  multimodal:    { tokens: 0,   quality: 0,    freshness: 0,    duplication: 0 },
  user_feedback: { tokens: 0,   quality: 0,    freshness: 0,    duplication: 0 },
  rl_data:       { tokens: 0,   quality: 0,    freshness: 0,    duplication: 0 },
  synthetic:     { tokens: 0,   quality: 0,    freshness: 0,    duplication: 0 },
};

/** 创建初始数据集 */
export function createInitialDataset(): Dataset {
  const domains = {} as Record<DataDomainId, DataDomain>;
  (Object.keys(INITIAL_DATA_DOMAINS) as DataDomainId[]).forEach((id) => {
    domains[id] = { id, ...INITIAL_DATA_DOMAINS[id] };
  });
  const totalTokens = Object.values(domains).reduce((s, d) => s + d.tokens, 0);
  const effectiveTokens = Object.values(domains).reduce(
    (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
    0,
  );
  return {
    id: 'dataset-initial',
    name: '初始公开数据集',
    domains,
    totalTokens,
    effectiveTokens,
    contamination: 0.05,
    legality: 1.0,
    createdAt: 0,
  };
}
