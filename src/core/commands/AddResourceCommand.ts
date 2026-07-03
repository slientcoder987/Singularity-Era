import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';

/**
 * AddResourceCommand
 *
 * 通用资源增减命令。
 * 通常不直接由玩家调用，而是内部逻辑使用（如事件奖励、罚款等）。
 */
export class AddResourceCommand implements Command {
  constructor(
    public readonly resourceId: string,
    public readonly amount: number,
    public readonly reason?: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    state.addResource(this.resourceId, this.amount);
    events.emit('RESOURCE_CHANGED', this.resourceId, this.amount, this.reason);
  }
}
