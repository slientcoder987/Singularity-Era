/**
 * 模型实体
 *
 * 训练完成后生成的模型，包含16维真实能力向量。
 * 玩家通过 UI 看到的是带噪声的投影。
 */
import type { CapabilityId } from '../config/capabilities';

/** 能力向量：维度 id → 真实能力值（无上限实数） */
export type CapabilityVector = Record<CapabilityId, number>;

/** 模型实体 */
export interface Model {
  id: string;
  /** 模型名称 */
  name: string;
  /** 参数量（亿，如 7 = 7B） */
  paramCount: number;
  /** 架构标识（如 'transformer', 'moe'） */
  architecture: string;
  /** 上下文长度（token 数） */
  contextLength: number;
  /** 训练数据集 id */
  datasetId: string;
  /** 训练完成日期 */
  completedAt: number;
  /** 训练项目 id */
  trainingProjectId: string;
  /** 真实能力向量（完整精度，玩家不可直接见） */
  capabilities: CapabilityVector;
  /** 基础性能分（所有维度共享） */
  baseScore: number;
  /** 已发布的天数（用于社区反馈降噪） */
  daysSincePublished: number;
  /** 玩家累计投入的评估研究员数量 */
  evaluationResearchers: number;
  /** 是否已发布到市场 */
  published: boolean;
  /** 模型版本号 */
  version: number;
}
