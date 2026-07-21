/**
 * 基础设施实体索引（memoized）
 *
 * 用于消除 `clusters.find(c => c.id === cid)` / `serverNodes.find(n => n.id === nid)`
 * / `dataCenters.find(d => d.id === did)` 在嵌套循环中导致的 O(N²) 查找。
 *
 * 缓存策略（同 cardIndex.ts）：
 * - 模块级 WeakMap 以对应数组对象引用为 key
 * - immer 不可变更新保证数组在修改时产生新引用，缓存自动失效
 * - 仅在引用变化时重建索引（O(数组长度)），其余调用 O(1) 命中缓存
 *
 * 不写入 GameData，符合"索引/缓存不入存档"原则。
 */
import type { GameData } from '../GameState';
import type { ServerNode, Cluster, DataCenter } from '../entities/Infrastructure';
import { isDraft, original } from 'immer';

/** serverNodes 引用 → id 索引的缓存 */
const nodeIndexCache = new WeakMap<object, Map<string, ServerNode>>();
/** clusters 引用 → id 索引的缓存 */
const clusterIndexCache = new WeakMap<object, Map<string, Cluster>>();
/** dataCenters 引用 → id 索引的缓存 */
const dcIndexCache = new WeakMap<object, Map<string, DataCenter>>();

/**
 * 解析可能的 Immer draft 数组 → base state 数组引用。
 *
 * ★ 性能修复：每日 state.update(draft) 内调用 findNode/findCluster 时，
 *   draft.serverNodes/clusters 的 proxy 引用与 base state 不同，导致 WeakMap miss
 *   → O(数组长度) 全量重建索引。节点/集群规模大时每日每系统重复重建会卡顿。
 *   通过 immer 的 original() 解析回原数组，复用 base 缓存。
 */
function resolveArr<T>(arr: T[]): T[] {
  if (isDraft(arr)) {
    const base = original(arr);
    if (base) return base as T[];
  }
  return arr;
}

/**
 * 获取 serverNode id 索引。
 * 若 serverNodes 引用未变则返回缓存，否则重建。
 */
export function getNodeIndex(data: GameData): Map<string, ServerNode> {
  const arr = resolveArr(data.serverNodes) as object;
  let index = nodeIndexCache.get(arr);
  if (index !== undefined) return index;

  index = new Map<string, ServerNode>();
  for (const node of data.serverNodes) {
    index.set(node.id, node);
  }
  nodeIndexCache.set(arr, index);
  return index;
}

/**
 * 获取 cluster id 索引。
 * 若 clusters 引用未变则返回缓存，否则重建。
 */
export function getClusterIndex(data: GameData): Map<string, Cluster> {
  const arr = resolveArr(data.clusters) as object;
  let index = clusterIndexCache.get(arr);
  if (index !== undefined) return index;

  index = new Map<string, Cluster>();
  for (const cluster of data.clusters) {
    index.set(cluster.id, cluster);
  }
  clusterIndexCache.set(arr, index);
  return index;
}

/**
 * 获取 dataCenter id 索引。
 * 若 dataCenters 引用未变则返回缓存，否则重建。
 */
export function getDataCenterIndex(data: GameData): Map<string, DataCenter> {
  const arr = resolveArr(data.dataCenters) as object;
  let index = dcIndexCache.get(arr);
  if (index !== undefined) return index;

  index = new Map<string, DataCenter>();
  for (const dc of data.dataCenters) {
    index.set(dc.id, dc);
  }
  dcIndexCache.set(arr, index);
  return index;
}

/**
 * 按 id 查找 ServerNode。O(1) 命中缓存索引。
 */
export function findNode(data: GameData, nodeId: string): ServerNode | undefined {
  return getNodeIndex(data).get(nodeId);
}

/**
 * 按 id 查找 Cluster。O(1) 命中缓存索引。
 */
export function findCluster(data: GameData, clusterId: string): Cluster | undefined {
  return getClusterIndex(data).get(clusterId);
}

/**
 * 按 id 查找 DataCenter。O(1) 命中缓存索引。
 */
export function findDataCenter(data: GameData, dcId: string): DataCenter | undefined {
  return getDataCenterIndex(data).get(dcId);
}

/**
 * 按 nodeId 查找所属 Cluster。
 * 利用 ServerNode.clusterId 字段 + clusterIndex，O(1) 完成。
 * 未加入集群的节点返回 undefined。
 */
export function findClusterByNode(data: GameData, nodeId: string): Cluster | undefined {
  const node = getNodeIndex(data).get(nodeId);
  if (!node || !node.clusterId) return undefined;
  return getClusterIndex(data).get(node.clusterId);
}
