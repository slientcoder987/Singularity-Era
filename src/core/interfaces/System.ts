import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';

/**
 * System 接口
 *
 * 系统（System）负责在每个游戏日推进时对状态进行读写。
 * GameLoop 在每日推进时会遍历所有已注册的 System 并调用 update。
 */
export interface System {
  /** 系统名称，便于调试与日志 */
  name: string;
  /**
   * 每日推进时调用
   * @param state 游戏状态（可通过 state.update 修改）
   * @param events 事件总线
   * @param deltaDays 推进的天数（目前固定为 1）
   */
  update(state: GameState, events: EventBus, deltaDays: number): void;
}
