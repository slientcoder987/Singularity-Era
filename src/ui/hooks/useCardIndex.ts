import { useMemo } from 'react';
import { useGameState } from './useGameState';
import { getCardIndex, type CardIndexEntry } from '../../core/utils/cardIndex';

/**
 * useCardIndex
 *
 * 返回当前 GameData 的卡索引视图（基于 resourceMeta 引用 WeakMap 缓存）。
 *
 * 关键优化：
 * - 仅当 resourceMeta 引用变化时返回新视图（其他系统更新不会触发重渲染）
 * - cardIndex.get(uid) 为 O(1) 桶定位 + 按需合成 CardInstance
 * - 内存占用 O(桶数)（十万卡 ≈ 1000 桶 ≈ 50KB）
 *
 * 用于在 UI 组件中按 uid 高效查询卡信息（状态、规格、assignedProjectId）。
 */
export function useCardIndex(): { get: (uid: string) => CardIndexEntry | undefined; size: number } {
  // 订阅 resourceMeta 引用变化；仅在 CardPool 结构变化时重建视图
  const resourceMeta = useGameState((s) => s.resourceMeta);
  return useMemo(() => {
    const view = getCardIndex({ resourceMeta } as any);
    return {
      get: (uid: string) => view.get(uid),
      get size() {
        return view.size;
      },
    };
  }, [resourceMeta]);
}
