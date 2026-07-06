/**
 * 竞品脚本事件配置
 *
 * P0 使用脚本事件，通过 ICompetitorEngine 接口保留未来升级为模拟的扩展性。
 */

import type { CapabilityDim } from './capabilityDims';

export type CompetitorEventType = 'release' | 'breakthrough' | 'scandal' | 'open_source';

export interface CompetitorEventConfig {
  id: string;
  /** 触发日期（游戏内天数） */
  triggerDate: number;
  /** 竞品公司名 */
  competitorName: string;
  /** 事件类型 */
  type: CompetitorEventType;
  /** 事件描述 */
  description: string;
  /** 竞品模型能力（用于市场压力计算） */
  competitorCapabilities?: Partial<Record<CapabilityDim, number>>;
  /** 对玩家的影响 */
  effects: {
    /** 市场压力增加 0-1 */
    marketPressure?: number;
    /** 用户流失率 0-1 */
    userLossRate?: number;
    /** 融资影响（正/负） */
    fundingImpact?: number;
    /** 开源带来的科技解锁 id */
    techUnlock?: string;
  };
}

export const COMPETITOR_EVENTS: CompetitorEventConfig[] = [
  {
    id: 'comp_1',
    triggerDate: 60,
    competitorName: 'OpenMind',
    type: 'release',
    description: 'OpenMind 发布了 Omni-1，在 MMLU 上达到 75 分',
    competitorCapabilities: { world_knowledge: 75, coding_agent: 60, math_reasoning: 55 },
    effects: { marketPressure: 0.15, userLossRate: 0.05 },
  },
  {
    id: 'comp_2',
    triggerDate: 120,
    competitorName: 'DeepForge',
    type: 'release',
    description: 'DeepForge 发布 Coder-1，HumanEval 达到 70%',
    competitorCapabilities: { coding_agent: 70 },
    effects: { marketPressure: 0.1, userLossRate: 0.03 },
  },
  {
    id: 'comp_3',
    triggerDate: 200,
    competitorName: 'OpenMind',
    type: 'breakthrough',
    description: 'OpenMind 宣布在 latent reasoning 上取得突破',
    competitorCapabilities: { math_reasoning: 80, self_correction: 70 },
    effects: { marketPressure: 0.2, userLossRate: 0.08 },
  },
  {
    id: 'comp_4',
    triggerDate: 280,
    competitorName: 'Community',
    type: 'open_source',
    description: '社区开源了 RLHF 优化技术',
    effects: { techUnlock: 'rlhf' },
  },
];

const EVENT_MAP = new Map(COMPETITOR_EVENTS.map((e) => [e.id, e]));
export function getCompetitorEvent(id: string): CompetitorEventConfig | undefined {
  return EVENT_MAP.get(id);
}
