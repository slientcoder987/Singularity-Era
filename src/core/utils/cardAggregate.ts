/**
 * 计算卡聚合存储（Card Aggregate）
 *
 * 性能背景：
 * 原设计中每张卡为独立 CardInstance 对象（~120 字节 + V8 hidden class 开销）。
 * 100k 卡场景下：
 *   - 内存占用：100k × ~250B = 25 MB（仅卡对象）
 *   - 每日全量遍历：InfrastructureFailureSystem 故障检测 O(N)，
 *     训练系统查算力 O(节点×卡数)，UI 渲染数万行
 *   - Immer 不可变更新：100k 卡数组每次产生 ~100k 个新 Proxy，触发 cardIndex 重建
 *   - GC 压力：每 tick 大量短命对象
 *
 * 核心思路：按 (modelId, ageBucket, location, status) 四元组聚合计数，
 * 100k 卡下聚合条目数 = 7 型号 × 10 ageBucket × ~100 节点 × 3 状态 ≈ 几千条，
 * 比 100k 个对象低两个数量级。
 *
 * 保留单卡 uid 接口（通过 (modelId, idx) 合成）以兼容 Build/采购/UI 日志。
 * 但日 hot path（故障、训练、维护、电费）全部走聚合 O(聚合数)。
 *
 * 关键不变量：
 *   1. 同一聚合桶内的所有卡视为"等价"：相同型号、相同年龄段、相同位置、相同状态
 *   2. 故障检测：按桶统计概率，抽样故障卡（用合成 uid 标记）
 *   3. 训练分配：直接修改 assigned 卡桶，不遍历单卡
 *   4. 老化：每日按桶递增 ageBucket（每桶代表 50 天）
 *   5. 存档：聚合结构紧凑 JSON（远小于原 100k 对象数组）
 */

import type { CardInstance } from '../GameState';
import { getCardSpec } from '../config/computeCards';

/** 状态枚举 */
export type CardStatus = 'online' | 'offline' | 'broken';

/** 年龄桶宽度（天）——每桶覆盖 50 天寿命，1000 天寿命只需 20 桶 */
export const AGE_BUCKET_SIZE = 50;
/** 最大年龄桶索引（代表 1000+ 天） */
export const MAX_AGE_BUCKET = 20;

/** 合成 uid 前缀，用于日志显示（不保证唯一性，仅用于 UI 友好显示） */
export const SYNTHETIC_UID_PREFIX = 'agg';

/**
 * 卡聚合条目
 *
 * 同一 (modelId, ageBucket, location, status) 的所有卡视为等价。
 * ageBucket=N 表示卡已运行 N*50 ~ (N+1)*50 天。
 * location=null 表示未安装（库存/运输中）。
 */
export interface CardAggregate {
  /** 显卡型号 id */
  modelId: string;
  /** 年龄桶（0=新卡，N=运行 N*50~（N+1)*50 天） */
  ageBucket: number;
  /** 所在节点 id（null=未安装） */
  location: string | null;
  /** 状态 */
  status: CardStatus;
  /** 数量 */
  count: number;
  /** 最早购入日（用于估算 age，UI 展示，可选） */
  earliestPurchaseDay?: number;
  /** 自动恢复日（offline 状态时有效，所有卡共享同一恢复日） */
  autoRecoverDay?: number;
}

/**
 * 资源池结构（替代原 CardInstance[]）
 *
 * 每个 modelId 对应一个聚合条目数组。
 * 内部按 (ageBucket, location, status) 排好序，便于二分查找。
 */
export interface CardPool {
  /** 该型号的所有聚合条目（不重复 4-tuple） */
  aggregates: CardAggregate[];
  /** 总卡数（aggregates 缓存） */
  totalCount: number;
  /** 各状态计数缓存（{ online, offline, broken }） */
  statusCounts: Record<CardStatus, number>;
}

/** 类型守卫：判断资源池是否为新聚合格式（兼容旧数组会返回 false） */
export function isCardPool(v: unknown): v is CardPool {
  return !!v && typeof v === 'object' && Array.isArray((v as any).aggregates);
}

/**
 * 池索引键（内部 hash 用）
 */
function poolKey(ageBucket: number, location: string | null, status: CardStatus): string {
  return `${ageBucket}|${location ?? 'null'}|${status}`;
}

/**
 * 创建空池
 */
export function createEmptyPool(): CardPool {
  return {
    aggregates: [],
    totalCount: 0,
    statusCounts: { online: 0, offline: 0, broken: 0 },
  };
}

/**
 * 同桶增减：在指定 (ageBucket, location, status) 桶上直接加减 count。
 *
 * @param delta 正数=增加，负数=扣减。扣减至 0 自动移除空桶。
 * @returns 新池；若源桶不存在或扣减不足则原样返回。
 */
export function adjustBucketCount(
  pool: CardPool,
  ageBucket: number,
  location: string | null,
  status: CardStatus,
  delta: number,
): CardPool {
  if (delta === 0) return pool;
  const aggregates = pool.aggregates.slice();
  const idx = aggregates.findIndex(
    (a) => a.ageBucket === ageBucket && a.location === location && a.status === status
  );
  if (idx < 0) return pool; // 源桶不存在
  const agg = aggregates[idx];
  const newCount = agg.count + delta;
  if (newCount < 0) return pool; // 扣减不足
  if (newCount === 0) {
    aggregates.splice(idx, 1);
  } else {
    aggregates[idx] = { ...agg, count: newCount };
  }
  return {
    ...pool,
    aggregates,
    totalCount: pool.totalCount + delta,
    statusCounts: {
      ...pool.statusCounts,
      [status]: pool.statusCounts[status] + delta,
    },
  };
}

/**
 * 异桶转移：将 count 张卡从 (ageBucket, location, fromStatus) 桶转移到
 * (ageBucket, location, toStatus) 桶。totalCount 不变，statusCounts 相应调整。
 *
 * @param count 转移量（正数）
 * @param options 可选 autoRecoverDay / earliestPurchaseDay，写入目标桶
 * @returns 新池；若源桶不存在或 count 不足则原样返回。
 */
export function transferBetweenBuckets(
  pool: CardPool,
  ageBucket: number,
  location: string | null,
  fromStatus: CardStatus,
  toStatus: CardStatus,
  count: number,
  options?: { autoRecoverDay?: number; earliestPurchaseDay?: number }
): CardPool {
  if (count <= 0 || fromStatus === toStatus) return pool;

  const aggregates = pool.aggregates.slice();
  const fromIdx = aggregates.findIndex(
    (a) => a.ageBucket === ageBucket && a.location === location && a.status === fromStatus
  );
  if (fromIdx < 0) return pool; // 源桶不存在
  const fromAgg = aggregates[fromIdx];
  const newFromCount = fromAgg.count - count;
  if (newFromCount < 0) return pool; // 源不足

  // 1. 扣减源桶
  if (newFromCount === 0) {
    aggregates.splice(fromIdx, 1);
  } else {
    aggregates[fromIdx] = { ...fromAgg, count: newFromCount };
  }

  // 2. 增加目标桶
  const toIdx = aggregates.findIndex(
    (a) => a.ageBucket === ageBucket && a.location === location && a.status === toStatus
  );
  if (toIdx < 0) {
    // 创建新桶，保持排序
    const newAgg: CardAggregate = {
      modelId: pool.aggregates[0]?.modelId ?? '',
      ageBucket,
      location,
      status: toStatus,
      count,
    };
    if (options?.autoRecoverDay !== undefined) newAgg.autoRecoverDay = options.autoRecoverDay;
    if (options?.earliestPurchaseDay !== undefined) newAgg.earliestPurchaseDay = options.earliestPurchaseDay;
    const key = poolKey(ageBucket, location, toStatus);
    let insertAt = aggregates.length;
    for (let i = 0; i < aggregates.length; i++) {
      const k = poolKey(aggregates[i].ageBucket, aggregates[i].location, aggregates[i].status);
      if (k > key) {
        insertAt = i;
        break;
      }
    }
    aggregates.splice(insertAt, 0, newAgg);
  } else {
    const toAgg = aggregates[toIdx];
    aggregates[toIdx] = {
      ...toAgg,
      count: toAgg.count + count,
      autoRecoverDay: options?.autoRecoverDay ?? toAgg.autoRecoverDay,
      earliestPurchaseDay: options?.earliestPurchaseDay ?? toAgg.earliestPurchaseDay,
    };
  }

  // 3. 更新 statusCounts 缓存（totalCount 不变）
  return {
    aggregates,
    totalCount: pool.totalCount,
    statusCounts: {
      ...pool.statusCounts,
      [fromStatus]: pool.statusCounts[fromStatus] - count,
      [toStatus]: pool.statusCounts[toStatus] + count,
    },
  };
}

/**
 * 添加新卡到池（购入后调用）
 */
export function addCards(
  pool: CardPool,
  modelId: string,
  count: number,
  purchaseDay: number
): CardPool {
  if (count <= 0) return pool;
  // 新卡 ageBucket=0, status=online, location=null
  const aggregates = pool.aggregates.slice();
  const idx = aggregates.findIndex(
    (a) => a.ageBucket === 0 && a.location === null && a.status === 'online'
  );
  if (idx < 0) {
    aggregates.push({
      modelId,
      ageBucket: 0,
      location: null,
      status: 'online',
      count,
      earliestPurchaseDay: purchaseDay,
    });
  } else {
    const a = aggregates[idx];
    aggregates[idx] = {
      ...a,
      count: a.count + count,
      earliestPurchaseDay: Math.min(a.earliestPurchaseDay ?? purchaseDay, purchaseDay),
    };
  }
  return {
    aggregates,
    totalCount: pool.totalCount + count,
    statusCounts: {
      online: pool.statusCounts.online + count,
      offline: pool.statusCounts.offline,
      broken: pool.statusCounts.broken,
    },
  };
}

/**
 * 安装卡到节点（location: null → nodeId）
 * 仅转移 online 状态卡
 */
export function installCards(
  pool: CardPool,
  ageBucket: number,
  count: number
): CardPool {
  if (count <= 0) return pool;
  let p = adjustBucketCount(pool, ageBucket, null, 'online', -count);
  p = adjustBucketCount(p, ageBucket, '__pending_install__', 'online', count);
  return p;
}

/**
 * 完成安装：把 __pending_install__ 转移到目标节点
 */
export function finalizeInstall(
  pool: CardPool,
  ageBucket: number,
  targetNodeId: string,
  count: number
): CardPool {
  if (count <= 0) return pool;
  let p = adjustBucketCount(pool, ageBucket, '__pending_install__', 'online', -count);
  p = adjustBucketCount(p, ageBucket, targetNodeId, 'online', count);
  return p;
}

/**
 * 卸载卡（nodeId → null）
 */
export function uninstallCards(
  pool: CardPool,
  ageBucket: number,
  nodeId: string,
  count: number
): CardPool {
  if (count <= 0) return pool;
  let p = adjustBucketCount(pool, ageBucket, nodeId, 'online', -count);
  p = adjustBucketCount(p, ageBucket, null, 'online', count);
  return p;
}

/**
 * 故障：online → offline 或 broken
 */
export function markCardsFailed(
  pool: CardPool,
  ageBucket: number,
  location: string | null,
  isMajor: boolean,
  count: number,
  today: number
): CardPool {
  if (count <= 0) return pool;
  const toStatus: CardStatus = isMajor ? 'broken' : 'offline';
  const options = isMajor
    ? undefined
    : { autoRecoverDay: today + 3 + Math.floor(Math.random() * 5) };
  return transferBetweenBuckets(pool, ageBucket, location, 'online', toStatus, count, options);
}

/**
 * 恢复：offline → online（autoRecoverDay 到期）
 */
export function recoverOfflineCards(
  pool: CardPool,
  today: number
): { pool: CardPool; recovered: Array<{ ageBucket: number; location: string | null; count: number }> } {
  const recovered: Array<{ ageBucket: number; location: string | null; count: number }> = [];
  let p = pool;
  for (const agg of pool.aggregates) {
    if (agg.status === 'offline' && agg.autoRecoverDay !== undefined && agg.autoRecoverDay <= today) {
      const n = agg.count;
      p = transferBetweenBuckets(p, agg.ageBucket, agg.location, 'offline', 'online', n);
      recovered.push({ ageBucket: agg.ageBucket, location: agg.location, count: n });
    }
  }
  return { pool: p, recovered };
}

/**
 * 每日老化：所有 online/offline 桶的 ageBucket += 1（超过 MAX 归到 MAX）
 *
 * 性能：单次遍历所有 aggregates，O(桶数) 而非 O(卡数)。
 * 100k 卡 ≈ 几千桶，< 1ms。
 */
export function ageAllBuckets(pool: CardPool): CardPool {
  // 按 (新 ageBucket, location, status) 合并
  const merged = new Map<string, CardAggregate>();
  for (const a of pool.aggregates) {
    const newBucket = Math.min(a.ageBucket + 1, MAX_AGE_BUCKET);
    const key = `${newBucket}|${a.location ?? 'null'}|${a.status}`;
    const existing = merged.get(key);
    if (existing) {
      existing.count += a.count;
    } else {
      merged.set(key, {
        modelId: a.modelId,
        ageBucket: newBucket,
        location: a.location,
        status: a.status,
        count: a.count,
        autoRecoverDay: a.autoRecoverDay,
        earliestPurchaseDay: a.earliestPurchaseDay,
      });
    }
  }
  const aggregates = Array.from(merged.values()).sort((a, b) => {
    const ka = poolKey(a.ageBucket, a.location, a.status);
    const kb = poolKey(b.ageBucket, b.location, b.status);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  return {
    aggregates,
    totalCount: pool.totalCount,
    statusCounts: pool.statusCounts,
  };
}

/**
 * 统计某节点的卡数（所有状态）
 */
export function countCardsAtLocation(pool: CardPool, location: string): number {
  let n = 0;
  for (const a of pool.aggregates) {
    if (a.location === location) n += a.count;
  }
  return n;
}

/**
 * 统计某节点某状态的卡数
 */
export function countCardsByStatusAtLocation(pool: CardPool, location: string, status: CardStatus): number {
  let n = 0;
  for (const a of pool.aggregates) {
    if (a.location === location && a.status === status) n += a.count;
  }
  return n;
}

/**
 * 统计总可用算力（online + installed, TFLOPS）
 */
export function computeTotalTflops(pool: CardPool, modelId: string): { online: number; total: number } {
  const spec = getCardSpec(modelId);
  if (!spec) return { online: 0, total: 0 };
  let online = 0, total = 0;
  for (const a of pool.aggregates) {
    if (a.modelId && a.modelId !== modelId) continue;
    if (a.status === 'online') online += a.count * spec.tflopsPerCard;
    total += a.count * spec.tflopsPerCard;
  }
  return { online, total };
}

/**
 * 计算池中所有 online 卡的数量（跨所有 location）
 *
 * 用于电力消耗、UI 统计等需要"全部在线卡数"的场景。
 * 兼容旧数组格式：传入数组时按原逻辑返回 online 计数。
 */
export function countOnlineCards(pool: CardPool | unknown): number {
  if (!pool) return 0;
  if (Array.isArray(pool)) {
    let n = 0;
    for (const c of pool) {
      if ((c as any)?.status === 'online') n++;
    }
    return n;
  }
  const aggregates = (pool as CardPool)?.aggregates;
  if (!Array.isArray(aggregates)) return 0;
  let n = 0;
  for (const a of aggregates) {
    if (a.status === 'online') n += a.count;
  }
  return n;
}

/**
 * 计算池中"已安装到节点"的 online 卡数（location !== null）。
 *
 * 用途：电力消耗只算真正上电的卡；库存/运输中的卡不耗电。
 * 兼容旧数组格式：按 location 非空 + status==='online' 计数。
 */
export function countInstalledOnlineCards(pool: CardPool | unknown): number {
  if (!pool) return 0;
  if (Array.isArray(pool)) {
    let n = 0;
    for (const c of pool) {
      if ((c as any)?.status === 'online' && (c as any)?.location) n++;
    }
    return n;
  }
  const aggregates = (pool as CardPool)?.aggregates;
  if (!Array.isArray(aggregates)) return 0;
  let n = 0;
  for (const a of aggregates) {
    if (a.status === 'online' && a.location !== null) n += a.count;
  }
  return n;
}

/**
 * 抽样 N 张卡（按比例从各桶随机选，返回 N 个合成 uid 供日志/事件使用）
 *
 * 性能：N 通常很小（每日故障数），遍历桶累加 weight 直到 N 选完。
 */
export function sampleCards(
  pool: CardPool,
  n: number,
  filter?: (agg: CardAggregate) => boolean
): Array<{ uid: string; modelId: string; ageBucket: number; location: string | null }> {
  if (n <= 0) return [];
  // 1. 收集候选桶
  const candidates: CardAggregate[] = [];
  let total = 0;
  for (const a of pool.aggregates) {
    if (filter && !filter(a)) continue;
    candidates.push(a);
    total += a.count;
  }
  if (total === 0) return [];
  // 2. 按权重抽样 N 次（带放回，但 distinct uid）
  const out: Array<{ uid: string; modelId: string; ageBucket: number; location: string | null }> = [];
  const usedKeys = new Set<string>();
  let attempts = 0;
  while (out.length < n && attempts < n * 4) {
    attempts++;
    const r = Math.random() * total;
    let cum = 0;
    for (const a of candidates) {
      cum += a.count;
      if (r < cum) {
        const key = `${a.ageBucket}|${a.location ?? 'null'}|${a.status}|${out.length}`;
        if (usedKeys.has(key)) continue;
        usedKeys.add(key);
        // ★ 修复：uid 必须包含 location 信息，否则 parseCardUid 无法正确解析已装卡
        const uid = a.location
          ? `${SYNTHETIC_UID_PREFIX}-${a.modelId}-${a.ageBucket}-${a.location}-${out.length}`
          : `${SYNTHETIC_UID_PREFIX}-${a.modelId}-${a.ageBucket}-${out.length}`;
        out.push({
          uid,
          modelId: a.modelId || (pool.aggregates[0]?.modelId ?? ''),
          ageBucket: a.ageBucket,
          location: a.location,
        });
        break;
      }
    }
  }
  return out;
}

/**
 * 从旧 CardInstance[] 迁移到新 CardPool
 *
 * 用于存档兼容：检测到 resourceMeta[modelId] 是数组时自动迁移。
 */
export function migrateFromCards(cards: CardInstance[], modelId: string): CardPool {
  const pool = createEmptyPool();
  // 按 (ageBucket, location, status) 分组
  const groups = new Map<string, { ageBucket: number; location: string | null; status: CardStatus; count: number; earliest?: number; recoverDay?: number }>();
  for (const c of cards) {
    if (c.modelId !== modelId) continue; // 防御性：旧数据偶有 modelId 不一致
    const ageBucket = Math.min(Math.floor((c.age ?? 0) / AGE_BUCKET_SIZE), MAX_AGE_BUCKET);
    const status: CardStatus = c.status;
    const loc = c.location;
    const key = `${ageBucket}|${loc ?? 'null'}|${status}`;
    const g = groups.get(key);
    if (g) {
      g.count++;
      if (c.purchasedAt !== undefined) g.earliest = Math.min(g.earliest ?? c.purchasedAt, c.purchasedAt);
    } else {
      groups.set(key, {
        ageBucket,
        location: loc,
        status,
        count: 1,
        earliest: c.purchasedAt,
        recoverDay: c.autoRecoverDay,
      });
    }
  }
  // 转为有序 aggregates
  const sorted = Array.from(groups.entries()).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  for (const [, g] of sorted) {
    const agg: CardAggregate = {
      modelId,
      ageBucket: g.ageBucket,
      location: g.location,
      status: g.status,
      count: g.count,
    };
    if (g.earliest !== undefined) agg.earliestPurchaseDay = g.earliest;
    if (g.recoverDay !== undefined) agg.autoRecoverDay = g.recoverDay;
    pool.aggregates.push(agg);
    pool.totalCount += g.count;
    pool.statusCounts[g.status] += g.count;
  }
  return pool;
}

/**
 * 池是否为空
 */
export function isEmptyPool(pool: CardPool): boolean {
  return pool.totalCount === 0;
}

/**
 * 调试：聚合条目数（健康度指标）
 */
export function poolHealth(pool: CardPool): { aggregates: number; totalCards: number; ratio: number } {
  return {
    aggregates: pool.aggregates.length,
    totalCards: pool.totalCount,
    ratio: pool.aggregates.length / Math.max(1, pool.totalCount),
  };
}

/**
 * 解析合成 UID 返回桶定位信息
 *
 * UID 格式: agg-{modelId}-{ageBucket}-{location?}-{idx}
 *   - 库存卡 location 为 null，UID 中无该段
 *   - 已装卡 location 为 nodeId
 */
export interface ParsedCardUid {
  modelId: string;
  ageBucket: number;
  location: string | null;
  /** 桶内索引（0..count-1） */
  idx: number;
}

/** 解析合成 UID；若非合成 UID 格式返回 null。
 *
 * ★ 重要：nodeId 由 genId('node') 生成，格式 `node-{ts36}-{rand6}`，**含 2 个 '-'**。
 *   已装卡 uid 形如 `agg-{modelId}-{ageBucket}-{nodeId}-{idx}`，按 '-' 拆分后是 7 段：
 *     ['agg', modelId, ageBucket, 'node', '{ts36}', '{rand6}', idx]
 *   解析时 location 必须用 `parts.slice(3, -1).join('-')` 拼回完整的 nodeId，
 *   不可直接取 parts[3]（会丢失 'node-{ts36}-{rand6}' 中后两段）。
 *
 * 库存卡 uid 形如 `agg-{modelId}-{ageBucket}-{idx}`，4 段，location=null。
 */
export function parseCardUid(uid: string): ParsedCardUid | null {
  const parts = uid.split('-');
  if (parts[0] !== 'agg' || parts.length < 3) return null;
  const modelId = parts[1];
  const ageBucket = Number(parts[2]);
  if (!modelId || isNaN(ageBucket)) return null;

  // 库存卡：4 段（agg-modelId-ageBucket-idx），location=null
  if (parts.length === 4) {
    return { modelId, ageBucket, location: null, idx: Number(parts[3]) || 0 };
  }
  // 已装卡：≥5 段（agg-modelId-ageBucket-nodeId...-idx），location 拼回 nodeId
  if (parts.length >= 5) {
    const location = parts.slice(3, -1).join('-');
    const idxStr = parts[parts.length - 1];
    return { modelId, ageBucket, location, idx: Number(idxStr) || 0 };
  }
  return null;
}

/**
 * 按合成 UID 查找卡所在的桶。
 *
 * 返回 matching aggregate（可能为 undefined 当 count=0 时）。
 * 注意：idx 用于在桶内的身份识别；不同 status 的桶互不影响。
 */
export function findCardBucket(
  pool: CardPool,
  uid: string,
): { bucket: CardAggregate; index: number } | null {
  const parsed = parseCardUid(uid);
  if (!parsed) return null;
  for (let i = 0; i < pool.aggregates.length; i++) {
    const a = pool.aggregates[i];
    if (
      a.ageBucket === parsed.ageBucket &&
      a.location === parsed.location &&
      a.modelId === parsed.modelId &&
      a.count > 0
    ) {
      return { bucket: a, index: i };
    }
  }
  return null;
}

/**
 * 将一张卡从 (fromStatus) 桶移动到 (toStatus) 桶。
 *
 * 由 modelId/ageBucket/location 定位源桶，再向目标桶 +1。
 * 若源桶扣减后为 0，自动移除空桶。
 *
 * @param autoRecoverDay 仅在目标为 offline 时使用
 */
export function moveCardBetweenStatuses(
  pool: CardPool,
  parsed: ParsedCardUid,
  toStatus: CardStatus,
  autoRecoverDay?: number,
): CardPool {
  let fromBucket: CardAggregate | null = null;
  let fromIndex = -1;
  for (let i = 0; i < pool.aggregates.length; i++) {
    const a = pool.aggregates[i];
    if (
      a.ageBucket === parsed.ageBucket &&
      a.location === parsed.location &&
      a.modelId === parsed.modelId &&
      a.status !== toStatus &&
      a.count > 0
    ) {
      fromBucket = a;
      fromIndex = i;
      break;
    }
  }
  if (!fromBucket) return pool;

  const newAggregates = pool.aggregates.slice();
  // 1. 源桶 -1
  const newFrom: CardAggregate = { ...fromBucket, count: fromBucket.count - 1 };
  if (newFrom.count <= 0) {
    newAggregates.splice(fromIndex, 1);
  } else {
    newAggregates[fromIndex] = newFrom;
  }
  // 2. 目标桶 +1（查找/创建）
  let toBucket: CardAggregate | null = null;
  let toIndex = -1;
  for (let i = 0; i < newAggregates.length; i++) {
    const a = newAggregates[i];
    if (
      a.ageBucket === parsed.ageBucket &&
      a.location === parsed.location &&
      a.modelId === parsed.modelId &&
      a.status === toStatus
    ) {
      toBucket = a;
      toIndex = i;
      break;
    }
  }
  if (toBucket) {
    newAggregates[toIndex] = { ...toBucket, count: toBucket.count + 1 };
  } else {
    newAggregates.push({
      modelId: parsed.modelId,
      ageBucket: parsed.ageBucket,
      location: parsed.location,
      status: toStatus,
      count: 1,
      autoRecoverDay: toStatus === 'offline' ? autoRecoverDay : undefined,
    });
  }
  // ★ 修复：必须更新 statusCounts 缓存（fromStatus -= 1, toStatus += 1），
  //   否则 PowerSystem / countOnlineCards 统计会与 pool 实际状态漂移
  return {
    ...pool,
    aggregates: newAggregates,
    totalCount: pool.totalCount,
    statusCounts: {
      ...pool.statusCounts,
      [fromBucket.status]: Math.max(0, pool.statusCounts[fromBucket.status] - 1),
      [toStatus]: (pool.statusCounts[toStatus] ?? 0) + 1,
    },
  };
}

/**
 * 从池中按 UID 移除一张卡（不区分 status，匹配 modelId+ageBucket+location 即可）。
 *
 * 返回新池；若卡不存在则原样返回。
 */
export function removeCardByUid(pool: CardPool, uid: string): CardPool {
  const parsed = parseCardUid(uid);
  if (!parsed) return pool;
  for (let i = 0; i < pool.aggregates.length; i++) {
    const a = pool.aggregates[i];
    if (
      a.ageBucket === parsed.ageBucket &&
      a.location === parsed.location &&
      a.modelId === parsed.modelId &&
      a.count > 0
    ) {
      const newAggregates = pool.aggregates.slice();
      const newA = { ...a, count: a.count - 1 };
      if (newA.count <= 0) {
        newAggregates.splice(i, 1);
      } else {
        newAggregates[i] = newA;
      }
      // ★ 修复：必须按桶当前 status 递减对应计数，否则 PowerSystem / countOnlineCards
      //   统计会与 pool 实际状态漂移（删除 offline/broken 卡后 online 计数不变没问题，
      //   但 offline/broken 计数会偏高 → 反复删除卡会导致计数偏差累积）
      return {
        ...pool,
        aggregates: newAggregates,
        totalCount: Math.max(0, pool.totalCount - 1),
        statusCounts: {
          ...pool.statusCounts,
          [a.status]: Math.max(0, (pool.statusCounts[a.status] ?? 0) - 1),
        },
      };
    }
  }
  return pool;
}

/**
 * 将 (modelId, pool) 展开为合成 uid 列表（按桶生成）。
 *
 * 接受旧数组或新 CardPool；返回的 uid 形如 `agg-{modelId}-{ageBucket}-{location?}-{idx}`。
 * UI 列表展示（"空闲卡"、型号筛选）使用此函数避免硬编码旧数组结构。
 *
 * @param filter 可选过滤函数：返回 true 才包含该卡
 * @param limit 可选上限：超过则截断（避免 100k 卡时返回 10 万条目）
 */
export function expandAggregateUids(
  modelId: string,
  pool: unknown,
  filter?: (agg: CardAggregate) => boolean,
  limit?: number,
): string[] {
  if (!pool) return [];
  if (Array.isArray(pool)) {
    // 旧版数组
    const out: string[] = [];
    for (let i = 0; i < pool.length; i++) {
      if (limit !== undefined && out.length >= limit) break;
      const c: any = pool[i];
      const fakeBucket: CardAggregate = {
        modelId,
        ageBucket: 0,
        location: c.location ?? null,
        status: c.status,
        count: 1,
      };
      if (filter && !filter(fakeBucket)) continue;
      out.push(c.uid);
    }
    return out;
  }
  const aggregates = (pool as any)?.aggregates as CardAggregate[] | undefined;
  if (!Array.isArray(aggregates)) return [];
  const out: string[] = [];
  for (const agg of aggregates) {
    if (filter && !filter(agg)) continue;
    if (agg.count <= 0) continue;
    const remaining = limit !== undefined ? Math.min(agg.count, limit - out.length) : agg.count;
    for (let i = 0; i < remaining; i++) {
      const uid = agg.location
        ? `agg-${modelId}-${agg.ageBucket}-${agg.location}-${i}`
        : `agg-${modelId}-${agg.ageBucket}-${i}`;
      out.push(uid);
    }
    if (limit !== undefined && out.length >= limit) break;
  }
  return out;
}

/**
 * ★ 性能优化：按节点统计在线卡数及型号分布（O(桶数) 替代 O(卡数)）
 *
 * 遍历所有 modelId 池的聚合桶，按 location（=nodeId）聚合 online 卡数量。
 * 返回 Map<nodeId, { total: number; byModel: Map<modelId, { spec, count }> }>。
 *
 * 用于：
 * - diagnoseTraining：替代 O(卡数) 的 node.installedCards UID 遍历
 * - ModelPanel clusterStateKey：替代 O(卡数) 的 UID 遍历
 * - InfraMaintenanceSystem：替代 O(卡数) 的功耗计算
 */
export function countOnlineCardsByNode(
  resourceMeta: Record<string, unknown>,
  nodeIds?: Set<string>,
): Map<string, { total: number; byModel: Map<string, number> }> {
  const result = new Map<string, { total: number; byModel: Map<string, number> }>();
  for (const modelId of Object.keys(resourceMeta)) {
    const pool = resourceMeta[modelId];
    if (!pool || !Array.isArray((pool as any).aggregates)) continue;
    for (const agg of (pool as any).aggregates) {
      if (agg.status !== 'online' || agg.count <= 0 || !agg.location) continue;
      if (nodeIds && !nodeIds.has(agg.location)) continue;
      let entry = result.get(agg.location);
      if (!entry) {
        entry = { total: 0, byModel: new Map() };
        result.set(agg.location, entry);
      }
      entry.total += agg.count;
      entry.byModel.set(modelId, (entry.byModel.get(modelId) ?? 0) + agg.count);
    }
  }
  return result;
}

/**
 * 按节点统计所有状态卡数 + 显存/带宽累计（替代 O(卡数) UID 遍历）
 *
 * 返回 Map<nodeId, {
 *   total, online, offline, broken,
 *   memoryGB, bandwidthGBs,
 *   byModel: Map<modelId, count>,
 *   byModelStatus: Map<modelId, Map<status, count>>
 * }>
 *
 * 用于 UI 拓扑/集群摘要、InfraMaintenanceSystem 等需要"每节点卡规格累计"的场景。
 * O(桶数) 单次扫描，10万卡场景从数百 ms 降至 <1ms。
 */
export interface NodeCardStats {
  total: number;
  online: number;
  offline: number;
  broken: number;
  memoryGB: number;
  bandwidthGBs: number;
  byModel: Map<string, number>;
  /** 型号 × 状态分布（UI 节点展开聚合显示用） */
  byModelStatus: Map<string, Map<CardStatus, number>>;
}

export function collectNodeCardStats(
  resourceMeta: Record<string, unknown>,
  nodeIds?: Set<string>,
): Map<string, NodeCardStats> {
  const result = new Map<string, NodeCardStats>();
  for (const modelId of Object.keys(resourceMeta)) {
    const pool = resourceMeta[modelId];
    if (!pool || !Array.isArray((pool as any).aggregates)) continue;
    // 卡规格只与 modelId 相关，桶外查询一次
    const spec = getCardSpec(modelId);
    const memGB = spec?.memoryGB ?? 0;
    const bwGBs = spec?.memoryBandwidth ?? 0;
    for (const agg of (pool as any).aggregates) {
      if (agg.count <= 0 || !agg.location) continue;
      if (nodeIds && !nodeIds.has(agg.location)) continue;
      let entry = result.get(agg.location);
      if (!entry) {
        entry = {
          total: 0, online: 0, offline: 0, broken: 0,
          memoryGB: 0, bandwidthGBs: 0,
          byModel: new Map(), byModelStatus: new Map(),
        };
        result.set(agg.location, entry);
      }
      entry.total += agg.count;
      entry.memoryGB += agg.count * memGB;
      entry.bandwidthGBs += agg.count * bwGBs;
      if (agg.status === 'online') entry.online += agg.count;
      else if (agg.status === 'offline') entry.offline += agg.count;
      else if (agg.status === 'broken') entry.broken += agg.count;
      entry.byModel.set(modelId, (entry.byModel.get(modelId) ?? 0) + agg.count);
      let statusMap = entry.byModelStatus.get(modelId);
      if (!statusMap) {
        statusMap = new Map();
        entry.byModelStatus.set(modelId, statusMap);
      }
      statusMap.set(agg.status, (statusMap.get(agg.status) ?? 0) + agg.count);
    }
  }
  return result;
}
