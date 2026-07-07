/**
 * 数据集模板配置
 *
 * 新增数据源只需在此添加条目。系统会自动处理采购、衰减、训练加成。
 */

import type { DataDomain } from '../entities/Dataset';

export interface DatasetTemplate {
  id: string;
  name: string;
  domain: DataDomain;
  baseTokensB: number;
  baseQuality: number;
  baseDiversity: number;
  baseCost: number;
  /** 衰减速率（每天 freshness 下降值） */
  decayPerDay: number;
  description: string;
}

export const DATASET_TEMPLATES: DatasetTemplate[] = [
  // ===== 基础数据 =====
  {
    id: 'common_crawl',
    name: 'Common Crawl 网页数据',
    domain: 'web',
    baseTokensB: 500,
    baseQuality: 45,
    baseDiversity: 80,
    baseCost: 50_000,
    decayPerDay: 0.05,
    description: '大规模网页爬虫，量大质杂',
  },
  {
    id: 'github_code',
    name: 'GitHub 代码集',
    domain: 'code',
    baseTokensB: 200,
    baseQuality: 70,
    baseDiversity: 60,
    baseCost: 80_000,
    decayPerDay: 0.02,
    description: '开源代码语料',
  },
  {
    id: 'arxiv_science',
    name: 'ArXiv 论文',
    domain: 'science',
    baseTokensB: 50,
    baseQuality: 85,
    baseDiversity: 40,
    baseCost: 30_000,
    decayPerDay: 0.01,
    description: '学术论文语料',
  },
  {
    id: 'math_corpus',
    name: '数学语料',
    domain: 'math',
    baseTokensB: 30,
    baseQuality: 90,
    baseDiversity: 30,
    baseCost: 100_000,
    decayPerDay: 0.01,
    description: '高质量数学推理语料',
  },
  {
    id: 'book_corpus',
    name: '书籍语料',
    domain: 'book',
    baseTokensB: 100,
    baseQuality: 75,
    baseDiversity: 50,
    baseCost: 60_000,
    decayPerDay: 0.005,
    description: '书籍长文本',
  },
  {
    id: 'dialogue_corpus',
    name: '对话数据',
    domain: 'dialogue',
    baseTokensB: 80,
    baseQuality: 65,
    baseDiversity: 55,
    baseCost: 70_000,
    decayPerDay: 0.03,
    description: '多轮对话语料',
  },
  {
    id: 'safety_corpus',
    name: '安全对齐数据',
    domain: 'safety',
    baseTokensB: 20,
    baseQuality: 80,
    baseDiversity: 35,
    baseCost: 120_000,
    decayPerDay: 0.02,
    description: '安全对齐与红队数据',
  },
  // ===== 高端数据 =====
  {
    id: 'premium_web',
    name: '精选网页',
    domain: 'web',
    baseTokensB: 100,
    baseQuality: 80,
    baseDiversity: 70,
    baseCost: 300_000,
    decayPerDay: 0.04,
    description: '人工筛选的高质量网页',
  },
  {
    id: 'expert_code',
    name: '专家级代码',
    domain: 'code',
    baseTokensB: 50,
    baseQuality: 95,
    baseDiversity: 45,
    baseCost: 500_000,
    decayPerDay: 0.015,
    description: '专家级精标代码',
  },
];

const TEMPLATE_MAP = new Map(DATASET_TEMPLATES.map((t) => [t.id, t]));

export function getDatasetTemplate(id: string): DatasetTemplate | undefined {
  return TEMPLATE_MAP.get(id);
}
