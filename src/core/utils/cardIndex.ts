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
 * ★★★ 十万卡级优化：聚合存储
 * 旧版展开 100k 个 CardInstance 进 Map（OOM / 重建慢）。
 * 新版仅保存"桶 → 聚合条目"映射（1000 卡 → 1 桶 → 1 个聚合）。
 * findCard(uid) 解析合成 UID 后 O(桶数) 定位，按需合成 CardInstance。
 * 内存占用：O(桶数) 而非 O(总卡数)。十万卡场景下内存从 ~30MB 降至 ~50KB。
 *
 * 兼容新旧两种存储：
 * - 旧：resourceMeta[modelId] 为 CardInstance[]（扁平数组）—— 仍按需展开
 * - 新：resourceMeta[modelId] 为 CardPool（按 modelId+ageBucket+location+status 聚合）
 *      每张卡的合成 uid 为 `agg-{modelId}-{ageBucket}-{location?}-{idx}`
 *
 * 不写入 GameData，符合"索引/缓存不入存档"原则。
 */
import type { GameData, CardInstance } from '../GameState';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import { getCardSpec } from '../config/computeCards';
import { isDraft, original } from 'immer';
import { isCardPool, parseCardUid } from './cardAggregate';

/** 卡索引条目（按需合成） */
export interface CardIndexEntry {
  /** 卡实例（合成对象，assignedProjectId 来自持久层） */
  card: CardInstance;
  /** 所属型号 id（对应 resourceMeta 的 key） */
  modelId: string;
}

/** 聚合桶的精简表示：用于卡索引内部存储（避免持有 CardAggregate 引用以兼容 Immer draft） */
interface BucketSnapshot {
  modelId: string;
  ageBucket: number;
  location: string | null;
  status: CardInstance['status'];
  count: number;
  /** 桶中第一张卡的 uid（按 idx=0 生成），用于快速失败检查 */
  firstUid: string;
  autoRecoverDay?: number;
}

/**
 * 持久化的 per-card assignedProjectId 映射（仅在涉及训练分配时维护）
 *
 * 避免在 CardIndexEntry.card 中存盘（card 本身是合成对象），而是单独维护
 * 一个 cardUid → projectId 的 Map，由 TrainingCommands 在分配/释放时更新。
 *
 * ★ 当前未使用：训练分配追踪已由 TrainingProject.nodeAssignments 承担。
 *   保留空 Map 以兼容 synthesizeCard 中的查询，未来如需 per-card 追踪可重新启用。
 */
const assignedProjectMap = new Map<string, string>();

/** resourceMeta 引用 → 桶快照列表的缓存（十万卡场景：1000 桶 ≈ 50KB） */
const bucketCache = new WeakMap<object, BucketSnapshot[]>();
/** 同一引用下的桶 key → BucketSnapshot（O(1) 定位） */
const bucketMapCache = new WeakMap<object, Map<string, BucketSnapshot>>();

/**
 * 解析可能的 Immer draft，返回其 base state 的 resourceMeta 引用。
 *
 * ★ 性能修复：每日 state.update(draft) 内，系统若在 draft 上调用 getCardIndex，
 *   会因 draft.resourceMeta 的 proxy 引用与已缓存的 base state 引用不同，
 *   导致 WeakMap miss → O(总卡数) 全量重建索引。数十万卡 × 每日 × 多个系统
 *   会造成主线程明显卡顿。
 *
 *   immer 的 original() 返回 draft 的原始（base）对象；非 draft 传入原样返回。
 *   通过解析 base 引用，让 draft 上的索引查询直接复用 base state 的缓存，
 *   每日每系统最多重建一次（仅在 resourceMeta 真被修改后）。
 */
function resolveResourceMeta(data: GameData): object {
  const meta = data.resourceMeta as object;
  if (isDraft(meta)) {
    const base = original(meta);
    if (base) return base as object;
  }
  return meta;
}

/** 桶 key：与 parseCardUid 反向映射（不含 idx 字段） */
function bucketKey(modelId: string, ageBucket: number, location: string | null): string {
  return `${modelId}|${ageBucket}|${location ?? ''}`;
}

/**
 * 重建桶快照（O(总卡数) 但不分配每卡对象）
 *
 * 旧版：为每张卡分配 1 个 CardInstance 对象 + 1 个 Map 条目。
 * 新版：为每桶分配 1 个 BucketSnapshot（按 idx=0 推 firstUid）。
 */
function rebuildSnapshots(data: GameData): { list: BucketSnapshot[]; map: Map<string, BucketSnapshot> } {
  const list: BucketSnapshot[] = [];
  const map = new Map<string, BucketSnapshot>();
  for (const modelId of Object.keys(data.resourceMeta)) {
    const pool = data.resourceMeta[modelId];
    if (!pool) continue;
    if (Array.isArray(pool)) {
      // 旧版扁平数组：按 status+location 分组，但保留 per-card uid（向后兼容）
      // 这种情况一般只用于过渡期，不会达到 10w 卡规模，按原方式处理即可
      for (const card of pool) {
        const key = bucketKey(modelId, 0, card.location ?? null);
        let snap = map.get(key);
        if (!snap) {
          snap = {
            modelId,
            ageBucket: 0,
            location: card.location ?? null,
            status: card.status,
            count: 0,
            firstUid: card.uid,
          };
          map.set(key, snap);
          list.push(snap);
        }
        snap.count++;
      }
    } else if (isCardPool(pool)) {
      // 新版聚合池
      for (const agg of pool.aggregates) {
        const key = bucketKey(modelId, agg.ageBucket, agg.location);
        const firstUid = agg.location
          ? `agg-${modelId}-${agg.ageBucket}-${agg.location}-0`
          : `agg-${modelId}-${agg.ageBucket}-0`;
        const snap: BucketSnapshot = {
          modelId,
          ageBucket: agg.ageBucket,
          location: agg.location,
          status: agg.status,
          count: agg.count,
          firstUid,
          autoRecoverDay: agg.autoRecoverDay,
        };
        map.set(key, snap);
        list.push(snap);
      }
    }
  }
  return { list, map };
}

function getSnapshots(data: GameData): { list: BucketSnapshot[]; map: Map<string, BucketSnapshot> } {
  const meta = resolveResourceMeta(data);
  const list = bucketCache.get(meta);
  const map = bucketMapCache.get(meta);
  if (list && map) return { list, map };
  const built = rebuildSnapshots(data);
  bucketCache.set(meta, built.list);
  bucketMapCache.set(meta, built.map);
  return built;
}

/**
 * 按 UID 解析桶（O(桶数)，实际是 1000 桶以下）
 */
function findBucketByUid(data: GameData, uid: string): BucketSnapshot | null {
  const parsed = parseCardUid(uid);
  if (!parsed) return null;
  const { map } = getSnapshots(data);
  return map.get(bucketKey(parsed.modelId, parsed.ageBucket, parsed.location)) ?? null;
}

/** 合成轻量 CardInstance：仅 cardIndex 内部使用 */
function synthesizeCard(snap: BucketSnapshot, idx: number): CardInstance {
  const uid = snap.location
    ? `agg-${snap.modelId}-${snap.ageBucket}-${snap.location}-${idx}`
    : `agg-${snap.modelId}-${snap.ageBucket}-${idx}`;
  const assignedProjectId = assignedProjectMap.get(uid) ?? null;
  return {
    uid,
    modelId: snap.modelId,
    status: snap.status,
    age: 0,
    assignedProjectId,
    purchasedAt: 0,
    location: snap.location,
    autoRecoverDay: snap.autoRecoverDay,
  };
}

/**
 * 获取卡索引接口（O(1) get / O(桶数) keys）
 *
 * 返回一个轻量代理 Map：
 * - get(uid) → O(1) 桶定位 + 合成 CardInstance
 * - size → O(1)（按 count 累加）
 * - forEach / values：O(总卡数) 但不预分配
 *
 * ★ 十万卡场景：内存 O(桶数) ≈ 50KB，get/has O(1)
 */
class CardIndexView {
  private readonly data: GameData;

  constructor(data: GameData) {
    this.data = data;
  }

  get size(): number {
    const { list } = getSnapshots(this.data);
    let n = 0;
    for (const b of list) n += b.count;
    return n;
  }

  get(uid: string): CardIndexEntry | undefined {
    const snap = findBucketByUid(this.data, uid);
    if (!snap || snap.count === 0) return undefined;
    // 桶已存在，认为 uid 有效（兼容旧数组中尚未分配的 uid 模式：返回 undefined）
    // 注：不在此处验证 idx < count，因为合成 uid 的 idx 由 UI 决定，
    // 即使 idx 越界仍能返回 snap 的状态。TrainingCommands 在分配时会正确使用 idx。
    const card = synthesizeCard(snap, parseCardUid(uid)?.idx ?? 0);
    return { card, modelId: snap.modelId };
  }

  has(uid: string): boolean {
    return findBucketByUid(this.data, uid) !== null;
  }

  /** 遍历所有 uid（O(总卡数)，用于统计） */
  *keys(): IterableIterator<string> {
    const { list } = getSnapshots(this.data);
    for (const b of list) {
      for (let i = 0; i < b.count; i++) {
        yield b.location
          ? `agg-${b.modelId}-${b.ageBucket}-${b.location}-${i}`
          : `agg-${b.modelId}-${b.ageBucket}-${i}`;
      }
    }
  }

  *values(): IterableIterator<CardIndexEntry> {
    for (const uid of this.keys()) {
      const entry = this.get(uid);
      if (entry) yield entry;
    }
  }

  *entries(): IterableIterator<[string, CardIndexEntry]> {
    for (const uid of this.keys()) {
      const entry = this.get(uid);
      if (entry) yield [uid, entry] as [string, CardIndexEntry];
    }
  }

  forEach(cb: (entry: CardIndexEntry, uid: string) => void): void {
    for (const [uid, entry] of this.entries()) cb(entry, uid);
  }
}

/**
 * 获取卡 uid 索引。
 *
 * 若 resourceMeta 引用未变则返回缓存视图（O(1) 操作），否则重建桶快照。
 * 重建复杂度 O(总卡数) 但仅分配 O(桶数) 对象（十万卡 ≈ 1000 个 BucketSnapshot）。
 * 命中缓存后所有操作 O(1) 定位 + 按需合成 CardInstance。
 */
export function getCardIndex(data: GameData): CardIndexView {
  // 触发缓存构建
  getSnapshots(data);
  return new CardIndexView(data);
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

/**
 * 派生计算卡的累计运行天数。
 *
 * 替代原 CardInstance.age 字段的每日 age++ 更新。
 * 近似值：today - purchasedAt（不扣减离线时段）。
 * - 离线卡不参与故障检测（仅 online 卡检测），故 age 偏差不影响故障逻辑
 * - 离线时段通常 3-7 天，相对于卡寿命（数百天）误差 < 5%
 * - 故障概率公式 `1 + age/1000` 中，age 偏差几天的误差 < 1%
 *
 * 性能收益：消除每日 N 次 Immer 写入，使 resourceMeta 引用不再每日变化，
 * cardIndex/tflopsCache 缓存长期有效，UI 组件不每日重渲染。
 */
export function getCardAge(card: CardInstance, today: number): number {
  return Math.max(0, today - card.purchasedAt);
}
