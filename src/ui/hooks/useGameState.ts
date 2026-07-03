import { useEffect, useRef, useState } from 'react';
import type { GameData } from '../../core/GameState';
import { useGame } from './useGame';

/**
 * useGameState
 *
 * 通过选择器订阅 GameData 的局部状态。
 * 简化实现：使用 useState 初始值为 selector(state.read())，
 * 在 useEffect 中调用 state.subscribe 更新；当选择结果（Object.is）未变时跳过更新。
 *
 * @param selector 从 GameData 中选取需要订阅的字段
 */
export function useGameState<T>(selector: (state: GameData) => T): T {
  const game = useGame();

  // 始终使用最新的 selector，避免闭包陈旧
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const [value, setValue] = useState<T>(() => selectorRef.current(game.state.read()));

  useEffect(() => {
    // 订阅后立即用最新状态校正一次，防止初始值与订阅间隙的状态漂移
    setValue((prev) => {
      const next = selectorRef.current(game.state.read());
      return Object.is(prev, next) ? prev : next;
    });

    const unsubscribe = game.state.subscribe((state) => {
      const next = selectorRef.current(state);
      setValue((prev) => (Object.is(prev, next) ? prev : next));
    });

    return unsubscribe;
  }, [game]);

  return value;
}
