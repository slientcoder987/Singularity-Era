/**
 * 卡 uid → CardInstance 索引（memoized）
 *
 * 用于消除 `pool?.find(c => c.uid === uid)` 反模式导致的 O(卡数²) 嵌套查找。
 * 1000+ 张卡场景下，将每次查找从 O(poolSize) 降为 O(1)。
 *
 * 缓存策略：
 * - 模块级 WeakMap 以 `data.resourceMeta` 对象引用为 key
 * - immer 不可变更新保证 resourceMeta 在修改时产生新引用，缓存自动失效
 * - 仅在引用变化时重建索引（O(总卡数)），其余调用 O(1) 命中缓存
 *
 * 不写入 GameData，符合"索引/缓存不入存档"原则。
 */
import type { GameData, CardInstance } from '../GameState';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import { getCardSpec } from '../config/computeCards';

/** 卡索引条目 */
export interface CardIndexEntry {
  /** 卡实例 */
  card: CardInstance;
  /** 所属型号 id（对应 resourceMeta 的 key） */
  modelId: string;
}

/** resourceMeta 引用 → uid 索引的缓存 */
const indexCache = new WeakMap<object, Map<string, CardIndexEntry>>();

/**
 * 获取卡 uid 索引。
 *
 * 若 resourceMeta 引用未变则返回缓存，否则重建。
 * 重建复杂度 O(总卡数)，命中缓存 O(1)。
 */
export function getCardIndex(data: GameData): Map<string, CardIndexEntry> {
  const meta = data.resourceMeta as object;
  let index = indexCache.get(meta);
  if (index !== undefined) return index;

  index = new Map<string, CardIndexEntry>();
  for (const modelId of Object.keys(data.resourceMeta)) {
    const pool = data.resourceMeta[modelId] as CardInstance[] | undefined;
    if (!pool) continue;
    for (const card of pool) {
      index.set(card.uid, { card, modelId });
    }
  }
  indexCache.set(meta, index);
  return index;
}

/**
 * 按 uid 查找单张卡实例与所属型号。
 * O(1) 命中缓存索引。
 */
export function findCard(data: GameData, uid: string): CardIndexEntry | undefined {
  return getCardIndex(data).get(uid);
}

/**
 * 按 uid 查找单张卡的规格定义。
 * O(1) 命中缓存索引 + O(1) Map 查询规格表。
 */
export function findCardSpec(data: GameData, uid: string): ComputeCardSpec | undefined {
  const entry = getCardIndex(data).get(uid);
  if (!entry) return undefined;
  // 仅返回在线卡的规格（与历史行为一致：find 模式只在 status === 'online' 时返回 spec）
  if (entry.card.status !== 'online') return undefined;
  return getCardSpec(entry.modelId) ?? undefined;
}
