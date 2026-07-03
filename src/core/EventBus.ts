/**
 * 泛型事件总线
 *
 * 内部使用 Map<string, Set<Handler>> 存储事件监听器。
 * 允许任意事件名与参数，初期采用简单实现，保证类型安全的同时不限制灵活性。
 */

export type EventHandler = (...args: any[]) => void;

export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  /** 订阅指定事件，返回的 handler 可用于 off 取消订阅 */
  on(event: string, handler: EventHandler): void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set<EventHandler>();
      this.handlers.set(event, set);
    }
    set.add(handler);
  }

  /** 取消订阅指定事件处理器 */
  off(event: string, handler: EventHandler): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  /** 触发指定事件，所有订阅器按注册顺序被调用 */
  emit(event: string, ...args: any[]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // 复制一份以避免在回调中增删监听器导致迭代异常
    const snapshot = Array.from(set);
    for (const handler of snapshot) {
      try {
        handler(...args);
      } catch (err) {
        // 单个监听器抛错不应中断其他监听器
        console.error(`[EventBus] handler for "${event}" threw:`, err);
      }
    }
  }

  /** 移除某事件的所有监听器，或全部事件（不传参时清空所有） */
  clear(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}
