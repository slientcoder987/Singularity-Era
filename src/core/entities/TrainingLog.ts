/**
 * 训练日志实体
 *
 * 记录训练过程中的关键事件，供玩家回看训练曲线和决策历史。
 */

import type { CapabilityVector } from '../config/capabilityDims';

/** 日志类型 */
export type TrainingLogType =
  | 'daily_progress'
  | 'stage_transition'
  | 'checkpoint'
  | 'crash'
  | 'emergence'
  | 'release';

/** 日志条目 */
export interface TrainingLogEntry {
  /** 游戏日期 */
  date: number;
  /** 模型 id */
  modelId: string;
  /** 日志类型 */
  type: TrainingLogType;
  /** 当日步数（仅 daily_progress） */
  steps?: number;
  /** 当前 loss */
  loss?: number;
  /** 能力快照（关键节点） */
  capabilitiesSnapshot?: CapabilityVector;
  /** 描述 */
  description: string;
}

/** 创建日志条目 */
export function createLogEntry(
  date: number,
  modelId: string,
  type: TrainingLogType,
  description: string,
  extra?: Partial<TrainingLogEntry>,
): TrainingLogEntry {
  return { date, modelId, type, description, ...extra };
}
