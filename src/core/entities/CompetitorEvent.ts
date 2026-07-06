/**
 * 竞品事件实体与引擎接口
 */

import { COMPETITOR_EVENTS, type CompetitorEventConfig } from '../config/competitorEvents';

/** 已触发的竞品事件实例 */
export interface TriggeredCompetitorEvent {
  eventId: string;
  triggeredAt: number;
  config: CompetitorEventConfig;
}

/**
 * 竞品引擎接口
 *
 * P0 使用 ScriptedCompetitorEngine 基于配置触发。
 * 未来可替换为模拟系统，实现此接口即可。
 */
export interface ICompetitorEngine {
  /** 每日检查是否有应触发的竞品事件 */
  checkEvents(
    date: number,
    triggeredIds: Set<string>,
  ): CompetitorEventConfig[];
}

/** 脚本式竞品引擎 */
export class ScriptedCompetitorEngine implements ICompetitorEngine {
  checkEvents(
    date: number,
    triggeredIds: Set<string>,
  ): CompetitorEventConfig[] {
    return COMPETITOR_EVENTS.filter(
      (e) => e.triggerDate <= date && !triggeredIds.has(e.id),
    );
  }
}
