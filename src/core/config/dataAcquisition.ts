/**
 * 数据获取路线配置
 *
 * 数据获取分为两类：
 * 1. 自收集（持续运行）：需要数据工程师 + 时间，工程师越多收集越快，等级越高质量越好。
 * 2. 购买（即时获取）：立即获得数据，但有冷却时间。
 * 灰色路线短期质量高但积累 legal_debt/trust_debt。
 */

/** 自收集路线 id */
export type CollectionRouteId =
  | 'public_crawl'
  | 'deep_crawl'
  | 'code_collection'
  | 'academic_collection'
  | 'professional_annotation'
  | 'multimodal_annotation'
  | 'rl_synthesis'
  | 'internal_synthesis';

/** 购买路线 id */
export type PurchaseRouteId =
  | 'purchase_open'
  | 'purchase_commercial_a'
  | 'purchase_commercial_b'
  | 'purchase_proprietary'
  | 'distill_competitor'
  | 'user_data_full';

/** 所有数据获取路线 id（自收集 + 购买） */
export type DataAcquisitionId = CollectionRouteId | PurchaseRouteId;

/**
 * 自收集路线配置
 *
 * 收集速率公式：
 *   日产量 = (普通工程师数 × 1.0 + 核心工程师数 × 1.5) × baseRate
 * 质量公式：
 *   有效质量 = min(质量上限, 基础质量 + 核心工程师数 × 5%)
 */
export interface CollectionRouteConfig {
  id: CollectionRouteId;
  name: string;
  description: string;
  /** 基础产出速率（十亿 token / 工程师 / 天） */
  baseRate: number;
  /** 基础数据质量 0-1 */
  baseQuality: number;
  /** 质量上限 0-1（核心工程师加成到此为止） */
  qualityCap: number;
  /** 每日运营成本（美元） */
  dailyCost: number;
  /** 产出的数据领域 */
  targetDomains: string[];
  /** 是否需要解锁技术 */
  requiredTech?: string;
}

/** 购买路线配置（即时获取，带冷却） */
export interface DataAcquisitionRoute {
  id: PurchaseRouteId;
  name: string;
  description: string;
  /** 一次性成本 */
  cost: number;
  /** 产出的数据领域 */
  targetDomains: string[];
  /** 产出 token 数量（十亿） */
  tokensProduced: number;
  /** 产出数据质量 0-1 */
  quality: number;
  /** 是否需要解锁技术 */
  requiredTech?: string;
  /** 是否灰色路线 */
  isGrey: boolean;
  /** 灰色路线的 legal_debt 增量 */
  legalDebtIncrement: number;
  /** 灰色路线的 trust_debt 增量 */
  trustDebtIncrement: number;
  /** 灰色路线的员工士气损失 */
  moraleLoss: number;
  /** 冷却天数 */
  cooldownDays: number;
}

/** 自收集路线列表 */
export const COLLECTION_ROUTES: CollectionRouteConfig[] = [
  {
    id: 'public_crawl', name: '公开爬虫', description: '爬取公开网络内容',
    baseRate: 1.0, baseQuality: 0.50, qualityCap: 0.75, dailyCost: 100,
    targetDomains: ['web', 'multilingual'],
  },
  {
    id: 'deep_crawl', name: '深度爬取', description: '深度爬取书籍、论文、技术文档',
    baseRate: 0.5, baseQuality: 0.60, qualityCap: 0.80, dailyCost: 200,
    targetDomains: ['web', 'books'],
  },
  {
    id: 'code_collection', name: '代码收集', description: '从开源仓库收集代码数据',
    baseRate: 0.3, baseQuality: 0.75, qualityCap: 0.92, dailyCost: 150,
    targetDomains: ['code'],
  },
  {
    id: 'academic_collection', name: '学术收集', description: '收集学术论文和数学公式数据',
    baseRate: 0.2, baseQuality: 0.82, qualityCap: 0.96, dailyCost: 300,
    targetDomains: ['science', 'math'],
  },
  {
    id: 'professional_annotation', name: '专业标注', description: '专业标注团队生成高质量对话数据',
    baseRate: 0.1, baseQuality: 0.85, qualityCap: 0.98, dailyCost: 500,
    targetDomains: ['dialogue', 'user_feedback'],
  },
  {
    id: 'multimodal_annotation', name: '多模态标注', description: '图像、视频、音频多模态数据标注',
    baseRate: 0.05, baseQuality: 0.80, qualityCap: 0.95, dailyCost: 800,
    targetDomains: ['multimodal'],
  },
  {
    id: 'rl_synthesis', name: 'RL合成', description: '通过RL合成可验证任务数据',
    baseRate: 0.2, baseQuality: 0.80, qualityCap: 0.95, dailyCost: 1_000,
    targetDomains: ['rl_data', 'code', 'math'],
    requiredTech: 'rlhf',
  },
  {
    id: 'internal_synthesis', name: '内部模型合成', description: '使用内部模型生成合成数据',
    baseRate: 0.5, baseQuality: 0.65, qualityCap: 0.88, dailyCost: 1_500,
    targetDomains: ['synthetic', 'code'],
    requiredTech: 'distillation',
  },
];

/** 购买路线列表 */
export const PURCHASE_ROUTES: DataAcquisitionRoute[] = [
  {
    id: 'purchase_open', name: '公开数据集', description: '购买公开可售数据集',
    cost: 50_000, targetDomains: ['web', 'books'], tokensProduced: 20,
    quality: 0.70, isGrey: false, legalDebtIncrement: 0, trustDebtIncrement: 0,
    moraleLoss: 0, cooldownDays: 7,
  },
  {
    id: 'purchase_commercial_a', name: '商业数据包A', description: '购买代码和科技领域商业数据',
    cost: 200_000, targetDomains: ['code', 'science'], tokensProduced: 30,
    quality: 0.88, isGrey: false, legalDebtIncrement: 0, trustDebtIncrement: 0,
    moraleLoss: 0, cooldownDays: 10,
  },
  {
    id: 'purchase_commercial_b', name: '商业数据包B', description: '购买对话和多语言商业数据',
    cost: 500_000, targetDomains: ['dialogue', 'multilingual'], tokensProduced: 50,
    quality: 0.92, isGrey: false, legalDebtIncrement: 0, trustDebtIncrement: 0,
    moraleLoss: 0, cooldownDays: 14,
  },
  {
    id: 'purchase_proprietary', name: '专有数据集', description: '购买高质量全领域专有数据',
    cost: 1_000_000, targetDomains: ['web', 'books', 'code', 'science', 'dialogue', 'multilingual'], tokensProduced: 100,
    quality: 0.96, isGrey: false, legalDebtIncrement: 0, trustDebtIncrement: 0,
    moraleLoss: 0, cooldownDays: 30,
  },
  {
    id: 'distill_competitor', name: '蒸馏竞品', description: '蒸馏竞争对手模型',
    cost: 20_000, targetDomains: ['synthetic', 'dialogue'], tokensProduced: 15,
    quality: 0.75, isGrey: true, legalDebtIncrement: 0.5, trustDebtIncrement: 0.3,
    moraleLoss: 2, cooldownDays: 14,
  },
  {
    id: 'user_data_full', name: '用户数据(全部)', description: '违反政策使用全部用户数据',
    cost: 0, targetDomains: ['user_feedback', 'dialogue'], tokensProduced: 30,
    quality: 0.95, isGrey: true, legalDebtIncrement: 2.0, trustDebtIncrement: 1.5,
    moraleLoss: 8, cooldownDays: 1,
  },
];

/** 自收集路线映射表 */
export const COLLECTION_MAP: Record<CollectionRouteId, CollectionRouteConfig> =
  Object.fromEntries(COLLECTION_ROUTES.map((r) => [r.id, r])) as Record<CollectionRouteId, CollectionRouteConfig>;

/** 购买路线映射表 */
export const PURCHASE_MAP: Record<PurchaseRouteId, DataAcquisitionRoute> =
  Object.fromEntries(PURCHASE_ROUTES.map((r) => [r.id, r])) as Record<PurchaseRouteId, DataAcquisitionRoute>;

/**
 * 计算自收集日产量
 *
 * @param normalEngineerCount 普通数据工程师数
 * @param coreEngineerCount 核心数据工程师数
 * @param route 收集路线配置
 * @returns 每日产出 token 数（十亿）
 */
export function calcCollectionRate(
  normalEngineerCount: number,
  coreEngineerCount: number,
  route: CollectionRouteConfig,
): number {
  return (normalEngineerCount * 1.0 + coreEngineerCount * 1.5) * route.baseRate;
}

/**
 * 计算自收集有效质量
 *
 * @param coreEngineerCount 核心数据工程师数
 * @param route 收集路线配置
 * @returns 有效数据质量 0-1
 */
export function calcCollectionQuality(
  coreEngineerCount: number,
  route: CollectionRouteConfig,
): number {
  return Math.min(route.qualityCap, route.baseQuality + coreEngineerCount * 0.05);
}
