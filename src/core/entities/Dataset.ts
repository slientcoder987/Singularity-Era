/**
 * 数据集实体
 *
 * 数据是训练的核心输入。P1 让数据质量、数量、多样性影响训练效果。
 * - quality 影响能力提升速率
 * - diversity 影响隐性维度提升
 * - freshness 随时间衰减（旧数据效率降低）
 */

/** 数据领域 */
export type DataDomain =
  | 'web'
  | 'code'
  | 'math'
  | 'science'
  | 'book'
  | 'dialogue'
  | 'safety';

/** 数据集获取方式 */
export type DatasetSource = 'purchased' | 'self_built' | 'synthetic' | 'open';

/** 数据集实体 */
export interface Dataset {
  id: string;
  name: string;
  /** 数据领域 */
  domain: DataDomain;
  /** 数据量（token 数，单位 B） */
  tokensB: number;
  /** 质量 0-100 */
  quality: number;
  /** 多样性 0-100 */
  diversity: number;
  /** 时效性 0-100（随时间衰减） */
  freshness: number;
  /** 每日衰减速率 */
  decayPerDay: number;
  /** 获取方式 */
  source: DatasetSource;
  /** 采购成本（已支付） */
  purchaseCost: number;
  /** 获取日期（游戏天数） */
  acquiredAt: number;
  /** 是否标注 */
  isLabeled: boolean;
  /** 标注质量 0-100（未标注为 0） */
  labelQuality: number;
}

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 从模板创建数据集实例 */
export function createDataset(
  name: string,
  domain: DataDomain,
  tokensB: number,
  quality: number,
  diversity: number,
  source: DatasetSource,
  cost: number,
  date: number,
  decayPerDay: number,
  isLabeled = false,
  labelQuality = 0,
): Dataset {
  return {
    id: genId('ds'),
    name,
    domain,
    tokensB,
    quality,
    diversity,
    freshness: 100,
    decayPerDay,
    source,
    purchaseCost: cost,
    acquiredAt: date,
    isLabeled,
    labelQuality,
  };
}
