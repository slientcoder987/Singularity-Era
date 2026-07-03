import { createContext, type ReactNode } from 'react';
import type { Game } from '../../core/Game';

/**
 * GameContext
 *
 * 持有一个 Game 实例（或 null）。UI 层通过 useGame / useGameState 订阅。
 */
export const GameContext = createContext<Game | null>(null);

/**
 * GameProvider
 *
 * 在组件树顶层包裹，将 game 实例注入 Context。
 */
export function GameProvider({
  game,
  children,
}: {
  game: Game;
  children: ReactNode;
}) {
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}
