import { useContext } from 'react';
import type { Game } from '../../core/Game';
import { GameContext } from '../context/GameContext';

/**
 * useGame
 *
 * 获取当前 Context 中的 Game 实例。若未在 GameProvider 内使用则抛错。
 */
export function useGame(): Game {
  const game = useContext(GameContext);
  if (!game) {
    throw new Error('useGame 必须在 <GameProvider> 内部使用');
  }
  return game;
}
