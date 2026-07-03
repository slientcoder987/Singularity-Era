import { EventBus } from './EventBus';
import { GameState, type GameData } from './GameState';
import { GameLoop } from './GameLoop';
import type { System } from './interfaces/System';
import type { Command } from './interfaces/Command';
import { ResourceRegistry } from './resources/ResourceRegistry';
import { INITIAL_RESOURCES } from './config/resources';

/**
 * Game 主控制器
 *
 * 持有 GameState / EventBus / GameLoop / ResourceRegistry / systems。
 *
 * 资源系统：
 * - 构造时根据 INITIAL_RESOURCES 注册所有资源定义。
 * - 同时根据资源定义初始化 state.resources 中的数值。
 * - 系统（如 ComputeHardwareSystem / PowerSystem）通过 registry 查询资源。
 */
export class Game {
  readonly state: GameState;
  readonly events: EventBus;
  readonly registry: ResourceRegistry;
  private readonly loop: GameLoop;
  private readonly systems: System[];

  constructor(
    initialData: GameData,
    systems: System[] = [],
    registry?: ResourceRegistry,
  ) {
    this.events = new EventBus();

    // 1. 注册资源定义（可外部传入，否则内部创建）
    this.registry = registry ?? new ResourceRegistry();
    this.registry.registerAll(INITIAL_RESOURCES);

    // 2. 初始化状态
    this.state = new GameState(initialData);
    this.state.registerResources(INITIAL_RESOURCES);

    // 3. 若 state.resources 中缺少某资源初始值，则补齐
    this.ensureInitialResourceValues();

    this.systems = systems;
    this.loop = new GameLoop(this.state, this.events, this.systems);
  }

  /** 确保所有已注册资源在 state.resources 中有初始值 */
  private ensureInitialResourceValues(): void {
    const current = this.state.read().resources;
    const needsInit: Array<{ id: string; value: number }> = [];
    for (const def of this.registry.getAll()) {
      if (current[def.id] === undefined) {
        needsInit.push({ id: def.id, value: def.initialValue });
      }
    }
    if (needsInit.length > 0) {
      this.state.update((draft) => {
        for (const { id, value } of needsInit) {
          draft.resources[id] = value;
        }
      });
    }
  }

  /** 执行命令 */
  executeCommand(cmd: Command): void {
    cmd.execute(this.state, this.events);
  }

  /** 启动游戏（解除暂停并启动主循环） */
  start(): void {
    this.state.update((draft) => {
      draft.isPaused = false;
    });
    this.loop.start();
  }

  /** 暂停游戏（停止主循环并标记暂停） */
  pause(): void {
    this.loop.stop();
    this.state.update((draft) => {
      draft.isPaused = true;
    });
  }

  /** 恢复游戏（解除暂停并启动主循环） */
  resume(): void {
    this.state.update((draft) => {
      draft.isPaused = false;
    });
    this.loop.start();
  }

  /** 设置游戏速度倍率 */
  setSpeed(speed: number): void {
    this.state.update((draft) => {
      draft.speed = speed;
    });
    this.loop.setSpeed(speed);
  }

  /** 序列化当前状态为 JSON 字符串 */
  save(): string {
    return JSON.stringify(this.state.read());
  }

  /** 从 JSON 字符串读取存档并替换当前状态 */
  load(json: string): void {
    const parsed = JSON.parse(json) as GameData;
    this.state.resetData(parsed);
    this.loop.setSpeed(parsed.speed);
  }
}
