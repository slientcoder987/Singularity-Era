import type { GameState } from './GameState';
import type { EventBus } from './EventBus';
import type { System } from './interfaces/System';

/**
 * 可替换的 requestAnimationFrame 适配器
 *
 * 核心层禁止直接依赖浏览器 DOM API，唯一例外是 GameLoop 中的 rAF，
 * 但要求封装成可替换的形式。测试或服务端环境可注入自定义适配器。
 */
export interface RafAdapter {
  requestAnimationFrame(callback: (time: number) => void): number;
  cancelAnimationFrame(handle: number): void;
}

/**
 * 默认 rAF 适配器：使用宿主环境提供的 requestAnimationFrame。
 * 通过 globalThis 间接引用，避免在核心层硬编码 window 全局。
 */
const defaultRaf: RafAdapter = {
  requestAnimationFrame: (cb) => globalThis.requestAnimationFrame(cb),
  cancelAnimationFrame: (handle) => globalThis.cancelAnimationFrame(handle),
};

/** speed=1 时，1000ms 真实时间 = 1 个游戏日 */
const MS_PER_DAY = 1000;

/**
 * GameLoop
 *
 * 使用 requestAnimationFrame 实现主循环：
 * - 每帧计算 deltaMs，按 speed 累积游戏天数
 * - 累积 >= 1 天时执行每日推进：
 *     发射 'DAY_START' → 遍历 systems.update → state.date += 1 → 发射 'DAY_END'
 * - start() 启动循环，stop() 停止循环但保留状态，setSpeed() 调整速度
 *
 * 暂停/恢复由 Game 通过 start()/stop() 控制，循环本身不读取 isPaused。
 */
export class GameLoop {
  private readonly state: GameState;
  private readonly events: EventBus;
  private readonly systems: System[];
  private readonly raf: RafAdapter;

  private speed: number;
  private running = false;
  private rafHandle: number | null = null;
  private lastTime: number | null = null;
  private dayAccumulator = 0;

  constructor(
    state: GameState,
    events: EventBus,
    systems: System[],
    raf: RafAdapter = defaultRaf,
  ) {
    this.state = state;
    this.events = events;
    this.systems = systems;
    this.raf = raf;
    this.speed = state.read().speed;
  }

  /** 启动主循环（若已在运行则忽略） */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.dayAccumulator = 0;
    this.scheduleNextFrame();
  }

  /** 停止主循环，保留当前状态（speed / accumulator 重置） */
  stop(): void {
    this.running = false;
    if (this.rafHandle !== null) {
      this.raf.cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.lastTime = null;
    this.dayAccumulator = 0;
  }

  /** 设置游戏速度倍率 */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /** 是否正在运行 */
  isRunning(): boolean {
    return this.running;
  }

  private scheduleNextFrame(): void {
    if (!this.running) return;
    this.rafHandle = this.raf.requestAnimationFrame(this.tick);
  }

  /** 每帧回调 */
  private tick = (time: number): void => {
    if (!this.running) return;

    if (this.lastTime === null) {
      // 首帧仅记录时间，避免出现巨大的 deltaMs
      this.lastTime = time;
      this.scheduleNextFrame();
      return;
    }

    const deltaMs = time - this.lastTime;
    this.lastTime = time;

    if (deltaMs > 0 && this.speed > 0) {
      this.dayAccumulator += (deltaMs / MS_PER_DAY) * this.speed;
      // 推进所有完整的游戏日（限制单帧最大推进数，避免卡顿后追帧过久）
      let remaining = Math.floor(this.dayAccumulator);
      const maxDaysPerFrame = 60;
      if (remaining > maxDaysPerFrame) {
        this.dayAccumulator -= remaining - maxDaysPerFrame;
        remaining = maxDaysPerFrame;
      }
      for (let i = 0; i < remaining; i++) {
        this.dayAccumulator -= 1;
        this.advanceDay();
      }
    }

    this.scheduleNextFrame();
  };

  /** 推进一个游戏日 */
  private advanceDay(): void {
    const beforeDate = this.state.read().date;
    this.events.emit('DAY_START', beforeDate);

    // ★ 性能优化（核心）：批量更新——在所有系统执行期间抑制 notify，
    //   结束后统一通知 UI 一次。原实现每个系统 update 都 notify，
    //   每天 30+ 次 notify × 60+ 个 useGameState selector = 1800+ 次重算。
    //   批量后降为 1 次 notify，消除 UI 层重复重算。
    this.state.batch(() => {
      // ★ 加固：单系统异常不中断整个游戏循环，避免连锁崩溃
      //   （如 TrainingSystem 栈溢出 → Immer 代理未清理 → RiskSystem "proxy revoked"）
      for (const system of this.systems) {
        try {
          system.update(this.state, this.events, 1);
        } catch (err) {
          // 记录错误但继续执行后续系统，保证 date 递增和其他系统正常运转
          // eslint-disable-next-line no-console
          console.error(`[GameLoop] System "${system.name}" threw on day ${beforeDate}:`, err);
          this.events.emit('SYSTEM_ERROR', { systemName: system.name, error: String(err), day: beforeDate });
        }
      }

      this.state.update((draft) => {
        draft.date += 1;
      });
    });

    this.events.emit('DAY_END', this.state.read().date);
  }
}
