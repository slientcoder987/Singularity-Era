import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';

/**
 * Command 接口
 *
 * 命令（Command）封装一次性的状态变更操作（如雇佣员工、购买算力卡）。
 * 通过 Game.executeCommand 统一执行，便于记录、撤销（后续扩展）等。
 */
export interface Command {
  execute(state: GameState, events: EventBus): void;
}
