/**
 * 数据集实体
 *
 * 训练数据按领域组成，每个领域有规模、质量、新鲜度、重复率。
 */

/** 数据领域 id */
export type DataDomainId =
  | 'code'
  | 'math'
  | 'science'
  | 'web'
  | 'books'
  | 'dialogue'
  | 'multilingual'
  | 'multimodal'
  | 'user_feedback'
  | 'rl_data'
  | 'synthetic';

/** 单个数据领域 */
export interface DataDomain {
  id: DataDomainId;
  /** token 数量（十亿为单位） */
  tokens: number;
  /** 质量 0-1 */
  quality: number;
  /** 新鲜度 0-1（1=最新） */
  freshness: number;
  /** 重复率 0-1（0=无重复） */
  duplication: number;
}

/** 数据集 */
export interface Dataset {
  id: string;
  name: string;
  /** 各领域数据 */
  domains: Record<DataDomainId, DataDomain>;
  /** 总 token 数（十亿） */
  totalTokens: number;
  /** 质量加权后有效 token 数 */
  effectiveTokens: number;
  /** 污染率 0-1 */
  contamination: number;
  /** 合法性 0-1 */
  legality: number;
  /** 创建日期 */
  createdAt: number;
}
