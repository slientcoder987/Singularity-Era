import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { ServerNode, Cluster, DataCenter } from '../entities/Infrastructure';
import {
  getNodeTemplate,
  getClusterNetwork,
  getDataCenterLocation,
  getCoolingType,
  getStorageConfig,
  STORAGE_CONFIGS,
  DATA_CENTER_LOCATIONS,
} from '../config/infrastructure';
import { getCardSpec } from '../config/computeCards';
import {
  adjustBucketCount,
  findCardBucket,
  moveCardBetweenStatuses,
  parseCardUid,
  removeCardByUid,
  transferBetweenBuckets,
} from '../utils/cardAggregate';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ========================================================================
 * BuyServerNodeCommand
 * ====================================================================== */
export class BuyServerNodeCommand implements Command {
  constructor(private readonly templateId: string) {}

  execute(state: GameState, events: EventBus): void {
    const template = getNodeTemplate(this.templateId);
    if (!template) {
      events.emit('NODE_REJECTED', { reason: '未知节点模板', templateId: this.templateId });
      return;
    }

    const funds = state.getResource('funds');
    if (funds < template.cost) {
      events.emit('NODE_REJECTED', { reason: '资金不足', cost: template.cost });
      return;
    }

    const today = state.read().date;
    const node: ServerNode = {
      id: genId('node'),
      name: `${template.name} #${state.read().serverNodes.length + 1}`,
      slotCount: template.slotCount,
      installedCards: [],
      interconnect: template.interconnect,
      powerSupplyKW: template.powerSupplyKW,
      cost: template.cost,
      maintenanceCost: template.maintenanceCost,
      clusterId: null,
      builtAt: today,
      // P0 新增
      interconnectBandwidth: template.interconnectBandwidth,
      maxPowerDrawKW: template.maxPowerDrawKW,
      nvswitchGeneration: template.nvswitchGeneration,
      reliability: template.reliability,
      baseReliability: template.reliability,
      nodeType: template.nodeType,
      lastMaintenanceDay: today,
    };

    state.update((draft) => {
      draft.resources['funds'] -= template.cost;
      draft.serverNodes.push(node);
    });

    events.emit('NODE_BUILT', node.id, node.name);
  }
}

/* ========================================================================
 * BulkBuyNodesCommand
 * ====================================================================== */
/**
 * 批量购买服务器节点（单次 state.update，避免循环 executeCommand 导致 N 次 notify）
 *
 * 10万卡场景：批量购买 1000+ 节点时，原 UI 循环 executeCommand(BuyServerNodeCommand)
 * 产生 1000 次 state.update → 1000 次 notify × 60+ selector = 60000+ 次重算。
 * 批量后降为 1 次 update + 1 次 notify。
 */
export class BulkBuyNodesCommand implements Command {
  constructor(
    private readonly templateId: string,
    private readonly quantity: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    if (this.quantity <= 0) return;

    const template = getNodeTemplate(this.templateId);
    if (!template) {
      events.emit('NODE_REJECTED', { reason: '未知节点模板', templateId: this.templateId });
      return;
    }

    const current = state.read();
    const totalCost = template.cost * this.quantity;
    const funds = current.resources['funds'] ?? 0;
    if (funds < totalCost) {
      events.emit('NODE_REJECTED', { reason: '资金不足', cost: totalCost });
      return;
    }

    const today = current.date;
    const startIdx = current.serverNodes.length;

    state.update((draft) => {
      draft.resources['funds'] -= totalCost;
      for (let i = 0; i < this.quantity; i++) {
        const node: ServerNode = {
          id: genId('node'),
          name: `${template.name} #${startIdx + i + 1}`,
          slotCount: template.slotCount,
          installedCards: [],
          interconnect: template.interconnect,
          powerSupplyKW: template.powerSupplyKW,
          cost: template.cost,
          maintenanceCost: template.maintenanceCost,
          clusterId: null,
          builtAt: today,
          interconnectBandwidth: template.interconnectBandwidth,
          maxPowerDrawKW: template.maxPowerDrawKW,
          nvswitchGeneration: template.nvswitchGeneration,
          reliability: template.reliability,
          baseReliability: template.reliability,
          nodeType: template.nodeType,
          lastMaintenanceDay: today,
        };
        draft.serverNodes.push(node);
      }
    });

    events.emit('NODE_BUILT', '', `${template.name} ×${this.quantity}`);
  }
}

/* ========================================================================
 * InstallCardCommand
 * ====================================================================== */
export class InstallCardCommand implements Command {
  constructor(
    private readonly cardUid: string,
    private readonly nodeId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const node = current.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit('CARD_INSTALL_REJECTED', { reason: '节点不存在' });
      return;
    }
    if (node.installedCards.length >= node.slotCount) {
      events.emit('CARD_INSTALL_REJECTED', { reason: '节点槽位已满' });
      return;
    }

    // ★ 修复：使用 parseCardUid 替代手动 split，避免 nodeId 含连字符时解析错误
    const parsed = parseCardUid(this.cardUid);
    if (!parsed || parsed.location !== null) {
      events.emit('CARD_INSTALL_REJECTED', { reason: '无效的卡标识或卡已安装' });
      return;
    }
    const modelId = parsed.modelId;
    const ageBucket = parsed.ageBucket;

    // 查找该 modelId 池中 location=null 且 ageBucket 匹配的桶
    const pool = current.resourceMeta[modelId] as any;
    if (!pool || !pool.aggregates) {
      events.emit('CARD_INSTALL_REJECTED', { reason: '卡池不存在' });
      return;
    }
    const idleAgg = pool.aggregates.find((a: any) =>
      a.location === null && a.ageBucket === ageBucket && a.status === 'online' && a.count > 0
    );
    if (!idleAgg) {
      events.emit('CARD_INSTALL_REJECTED', { reason: '卡未在库存中或状态不可用' });
      return;
    }

    // 检查功耗
    const spec = getCardSpec(modelId);
    if (spec) {
      let installedPower = 0;
      for (const defId of Object.keys(current.resourceMeta)) {
        const p = current.resourceMeta[defId] as any;
        if (!p || !p.aggregates) continue;
        for (const a of p.aggregates) {
          if (a.location === this.nodeId) {
            const s = getCardSpec(defId);
            installedPower += (s?.maxPowerDrawKW ?? 0) * a.count;
          }
        }
      }
      if (installedPower + spec.maxPowerDrawKW > node.powerSupplyKW) {
        events.emit('CARD_INSTALL_REJECTED', { reason: '节点供电不足' });
        return;
      }
    }

    state.update((draft) => {
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      // ★ 修复：推入 installedCards 的 UID 必须包含 nodeId（安装后格式），
      //   否则 cardIndex.get(uid) 按 location=null 查找会失败 → "集群内无在线GPU"
      const installedUid = `agg-${modelId}-${ageBucket}-${this.nodeId}-${n ? n.installedCards.length : 0}`;
      if (n) n.installedCards.push(installedUid);

      const draftPool = draft.resourceMeta[modelId] as any;
      if (draftPool && draftPool.aggregates) {
        // 从 idle 桶扣 1 张，转移到 location=nodeId 桶
        let p = adjustBucketCount(draftPool, ageBucket, null, 'online', -1);
        p = adjustBucketCount(p, ageBucket, this.nodeId, 'online', 1);
        draft.resourceMeta[modelId] = p;
      }
    });

    events.emit('CARD_INSTALLED', this.cardUid, this.nodeId);
  }
}

/* ========================================================================
 * BulkInstallCardsCommand（十万卡级优化：单次 state.update 安装多张卡）
 *
 * 替代循环调用 InstallCardCommand：每次 InstallCardCommand 会产生 1 次 Immer
 * 状态更新 + 1 次 React 通知，10w 张卡时 = 10w 次 update → 5+ 秒主线程阻塞。
 *
 * 本命令在单次 state.update 内对所有 (uid, nodeId) 计划执行：
 *   - 解析每张 uid 找到对应 modelId+ageBucket
 *   - 按 modelId 汇总：从 idle 桶扣 → 加入 nodeId 桶
 *   - 同步更新 serverNodes.installedCards
 *
 * 输入：plan 数组 [{ uid, nodeId }]，顺序填充各 nodeId 的空槽
 * ====================================================================== */
interface InstallPlan {
  uid: string;
  nodeId: string;
}

export class BulkInstallCardsCommand implements Command {
  constructor(private readonly plan: InstallPlan[]) {}

  execute(state: GameState, events: EventBus): void {
    if (this.plan.length === 0) return;

    // 校验：每个 (uid, nodeId) 必须存在且 node 有空槽
    const current = state.read();
    const nodeMap = new Map<string, (typeof current.serverNodes)[number]>();
    for (const n of current.serverNodes) nodeMap.set(n.id, n);
    for (const p of this.plan) {
      const node = nodeMap.get(p.nodeId);
      if (!node) {
        events.emit('CARD_INSTALL_REJECTED', { reason: `节点不存在: ${p.nodeId}` });
        return;
      }
    }

    // 聚合到 (modelId, ageBucket, nodeId) → count
    const adjustments = new Map<string, { modelId: string; ageBucket: number; nodeId: string; count: number }>();
    for (const p of this.plan) {
      const parsed = parseCardUid(p.uid);
      if (!parsed) continue;
      const key = `${parsed.modelId}|${parsed.ageBucket}|${p.nodeId}`;
      const cur = adjustments.get(key) ?? { modelId: parsed.modelId, ageBucket: parsed.ageBucket, nodeId: p.nodeId, count: 0 };
      cur.count++;
      adjustments.set(key, cur);
    }

    let installed = 0;
    // ★ 先建 draft 外部用的 id→node 索引（push 阶段用）
    const nodeIndex = new Map<string, (typeof current.serverNodes)[number]>();
    for (const n of current.serverNodes) nodeIndex.set(n.id, n);

    // ★ 校验所有 plan 元素：每个 (uid, nodeId) 必须存在且 node 有空槽
    //   失败则把该 plan 标记为 skipped，update 内不再 push
    //   避免 "pool 未扣但 node 已 push" 的幽灵卡
    const skipped = new Set<number>();
    for (let i = 0; i < this.plan.length; i++) {
      const p = this.plan[i];
      const node = nodeIndex.get(p.nodeId);
      if (!node) {
        skipped.add(i);
        events.emit('CARD_INSTALL_REJECTED', { reason: `节点不存在: ${p.nodeId}` });
        continue;
      }
      if (node.installedCards.length >= node.slotCount) {
        skipped.add(i);
        events.emit('CARD_INSTALL_REJECTED', { reason: `节点槽位已满: ${p.nodeId}` });
        continue;
      }
      const parsed = parseCardUid(p.uid);
      if (!parsed) {
        skipped.add(i);
        continue;
      }
    }

    state.update((draft) => {
      // ★ 关键优化：按 modelId 分组，对每个 modelId 的 pool 做 1 次 O(M + K) 重建
      // 原实现：每个 adjustment 都调 adjustBucket → 每次都 aggregates.slice() 拷贝整个 M 桶数组
      //   10w 卡安装时 adjustments 数量 ~1000，单次拷贝 10w 桶数组
      //   → 总 10^7 次操作 + N 次 state update
      // 新实现：单次遍历 pool.aggregates，O(M) 计算所有 delta；O(K) 更新 + O(M) 写回 1 次
      //   → 总 O(M + K) per modelId
      const byModel = new Map<string, Array<{ ageBucket: number; nodeId: string; count: number; planIndices: number[] }>>();
      for (let i = 0; i < this.plan.length; i++) {
        if (skipped.has(i)) continue;
        const p = this.plan[i];
        const parsed = parseCardUid(p.uid);
        if (!parsed) continue;
        let entry = byModel.get(parsed.modelId);
        if (!entry) {
          entry = [];
          byModel.set(parsed.modelId, entry);
        }
        // 合并 (ageBucket, nodeId) 相同的 plan，累加 count + 记录 planIndices
        let adj = entry.find((a) => a.ageBucket === parsed.ageBucket && a.nodeId === p.nodeId);
        if (!adj) {
          adj = { ageBucket: parsed.ageBucket, nodeId: p.nodeId, count: 0, planIndices: [] };
          entry.push(adj);
        }
        adj.count++;
        adj.planIndices.push(i);
      }

      for (const [modelId, adjList] of byModel) {
        const pool = draft.resourceMeta[modelId];
        if (!pool || !Array.isArray((pool as any).aggregates)) continue;
        const aggregates = (pool as any).aggregates as Array<{
          modelId: string;
          ageBucket: number;
          location: string | null;
          status: string;
          count: number;
        }>;

        // ★ 优化：延迟删除策略——不立即 splice 空桶，只标记 count=0；
        //   新桶 push 到末尾；处理完成后统一 filter + sort。
        //   原 splice 方案每次 O(M) 重建 bucketMap，K 次调整 = O(K×M)；
        //   延迟方案每次 O(1)，最终单次 O(M) filter+sort = O(K + M log M)。
        const bucketKey = (ab: number, loc: string | null, st: string) => `${ab}|${loc ?? 'null'}|${st}`;
        const bucketMap = new Map<string, number>(); // key → aggregates 数组 index
        for (let i = 0; i < aggregates.length; i++) {
          const a = aggregates[i];
          bucketMap.set(bucketKey(a.ageBucket, a.location, a.status), i);
        }

        // 记录每个 plan index 是否成功安装（idle 不足时标记 skipped，避免幽灵卡）
        const planFailed = new Set<number>();

        for (const adj of adjList) {
          // 扣 idle 桶
          const idleKey = bucketKey(adj.ageBucket, null, 'online');
          const idleIdx = bucketMap.get(idleKey);
          if (idleIdx === undefined) {
            for (const i of adj.planIndices) planFailed.add(i);
            continue;
          }
          const idleBucket = aggregates[idleIdx];
          if (idleBucket.count < adj.count) {
            // idle 不足：标记这 (ageBucket, nodeId) 的所有 plan 为失败
            // 简单策略：全部失败（不部分安装）—— 与旧 InstallCardCommand 行为一致
            for (const i of adj.planIndices) planFailed.add(i);
            continue;
          }
          // 同桶扣减（不 splice，只减 count；count=0 时保留索引，后续查找自然失败）
          idleBucket.count -= adj.count;

          // 加 target node 桶
          const tgtKey = bucketKey(adj.ageBucket, adj.nodeId, 'online');
          const tgtIdx = bucketMap.get(tgtKey);
          if (tgtIdx === undefined) {
            // 新桶：push 到末尾（延迟排序，最终统一整理）
            aggregates.push({
              modelId,
              ageBucket: adj.ageBucket,
              location: adj.nodeId,
              status: 'online' as const,
              count: adj.count,
            });
            bucketMap.set(tgtKey, aggregates.length - 1);
          } else {
            aggregates[tgtIdx].count += adj.count;
          }
        }

        // 处理完成后：filter 空桶 + 按 bucketKey 排序（单次 O(M log M)）
        const nonEmpty = aggregates.filter((a) => a.count > 0);
        nonEmpty.sort((a, b) => {
          const ka = bucketKey(a.ageBucket, a.location, a.status);
          const kb = bucketKey(b.ageBucket, b.location, b.status);
          return ka < kb ? -1 : ka > kb ? 1 : 0;
        });
        // 原地替换 aggregates 数组内容（Immer draft 兼容）
        aggregates.length = 0;
        for (const a of nonEmpty) aggregates.push(a);

        // 2. 把这个 modelId 失败的 plan 索引加到全局 skipped
        for (const i of planFailed) skipped.add(i);
      }

      // 3. ★ 修复：只 push pool 实际成功扣减的 plan 卡片到 serverNodes.installedCards
      //    原 bug：每个 modelId 内部都 for (const p of this.plan) push 一遍，
      //    导致每张卡被推 N 次（N=unique modelId 数）—— 灾难性重复 push。
      //    修复：移到外层，每个 plan index 只 push 一次，且仅当 pool 调整成功时 push。
      // ★ 修复 UID 格式：推入 installedCards 的 UID 必须包含 nodeId（安装后格式），
      //    否则 cardIndex.get(uid) 按 location=null 查找会失败 → "集群内无在线GPU"
      const draftNodeIndex = new Map<string, (typeof draft.serverNodes)[number]>();
      for (const n of draft.serverNodes) draftNodeIndex.set(n.id, n);
      for (let i = 0; i < this.plan.length; i++) {
        if (skipped.has(i)) continue;
        const p = this.plan[i];
        const node = draftNodeIndex.get(p.nodeId);
        if (node && node.installedCards.length < node.slotCount) {
          const parsed = parseCardUid(p.uid);
          if (parsed) {
            const installedUid = `agg-${parsed.modelId}-${parsed.ageBucket}-${p.nodeId}-${node.installedCards.length}`;
            node.installedCards.push(installedUid);
            installed++;
          }
        }
      }
    });

    if (installed > 0) {
      events.emit('CARDS_BULK_INSTALLED', installed, this.plan.length);
    }
  }
}

/* ========================================================================
 * UninstallCardCommand（聚合版：通过 modelId+ageBucket+nodeId 寻址）
 * ====================================================================== */
export class UninstallCardCommand implements Command {
  constructor(private readonly cardUid: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // ★ 修复：使用 parseCardUid 正确解析含连字符的 nodeId
    //   原实现 parts[3] 只取到 'node'，丢失了 'node-{ts36}-{rand6}' 的后两段
    const parsed = parseCardUid(this.cardUid);
    if (!parsed || !parsed.location) {
      events.emit('CARD_UNINSTALL_REJECTED', { reason: '无效的卡标识或卡未安装' });
      return;
    }
    const modelId = parsed.modelId;
    const ageBucket = parsed.ageBucket;
    const nodeId = parsed.location;

    const pool = current.resourceMeta[modelId] as any;
    if (!pool || !pool.aggregates) {
      events.emit('CARD_UNINSTALL_REJECTED', { reason: '卡池不存在' });
      return;
    }
    const installedAgg = pool.aggregates.find((a: any) =>
      a.location === nodeId && a.ageBucket === ageBucket && a.count > 0
    );
    if (!installedAgg) {
      events.emit('CARD_UNINSTALL_REJECTED', { reason: '卡未安装在该节点' });
      return;
    }

    state.update((draft) => {
      const n = draft.serverNodes.find((x) => x.id === nodeId);
      if (n) {
        n.installedCards = n.installedCards.filter((uid: string) => uid !== this.cardUid);
      }
      const draftPool = draft.resourceMeta[modelId] as any;
      if (draftPool && draftPool.aggregates) {
        let p = adjustBucketCount(draftPool, ageBucket, nodeId, 'online', -1);
        p = adjustBucketCount(p, ageBucket, null, 'online', 1);
        draft.resourceMeta[modelId] = p;
      }
    });

    events.emit('CARD_UNINSTALLED', this.cardUid);
  }
}

/* ========================================================================
 * CreateClusterCommand
 * ====================================================================== */
export class CreateClusterCommand implements Command {
  constructor(
    private readonly nodeIds: string[],
    private readonly networkId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const network = getClusterNetwork(this.networkId);
    if (!network) {
      events.emit('CLUSTER_REJECTED', { reason: '未知网络类型' });
      return;
    }

    const current = state.read();
    const funds = current.resources['funds'] ?? 0;
    const buildCost = network.costPerNode * this.nodeIds.length;

    if (funds < buildCost) {
      events.emit('CLUSTER_REJECTED', { reason: '资金不足', cost: buildCost });
      return;
    }

    if (this.nodeIds.length > network.maxNodes) {
      events.emit('CLUSTER_REJECTED', { reason: '节点数超过网络容量' });
      return;
    }

    // ★ 性能优化：用 Map 索引替代循环内 find，O(N×M) → O(N+M)
    const nodeIndex = new Map(current.serverNodes.map((n) => [n.id, n]));
    for (const nid of this.nodeIds) {
      const node = nodeIndex.get(nid);
      if (!node) {
        events.emit('CLUSTER_REJECTED', { reason: `节点 ${nid} 不存在` });
        return;
      }
      if (node.clusterId !== null) {
        events.emit('CLUSTER_REJECTED', { reason: `节点 ${nid} 已属于其它集群` });
        return;
      }
    }

    const cluster: Cluster = {
      id: genId('cluster'),
      name: `${network.name} 集群 #${current.clusters.length + 1}`,
      nodes: [...this.nodeIds],
      network: network.name,
      switchCapacity: network.switchCapacity,
      maxNodes: network.maxNodes,
      buildCost,
      operationalCostPerDay: network.operationalCostPerDay,
      utilizationBonus: network.utilizationBonus,
      baseUtilizationBonus: network.utilizationBonus,
      dataCenterId: null,
      createdAt: current.date,
      // P0 新增
      networkBandwidth: network.networkBandwidth,
      networkTopology: network.networkTopology,
      storageType: 'local_ssd',
      storageIO: 1,
      storageCapacity: 10,
      storageCostPerDay: 5,
      parallelEfficiencyBase: network.parallelEfficiencyBase,
      maxTPDegree: network.maxTPDegree,
      allReduceBandwidth: network.allReduceBandwidth,
    };

    state.update((draft) => {
      draft.resources['funds'] -= buildCost;
      draft.clusters.push(cluster);
      // ★ 性能优化：用 Map 索引替代 find，O(N×M) → O(N+M)
      //   10万卡场景：选 10000 节点建集群，原 find 1.25 亿次调用 → Map O(1) 查找
      const nodeMap = new Map(draft.serverNodes.map((n) => [n.id, n]));
      for (const nid of this.nodeIds) {
        const n = nodeMap.get(nid);
        if (n) n.clusterId = cluster.id;
      }
    });

    events.emit('CLUSTER_CREATED', cluster.id, cluster.name);
  }
}

/* ========================================================================
 * AddNodeToClusterCommand
 * ====================================================================== */
export class AddNodeToClusterCommand implements Command {
  constructor(
    private readonly clusterId: string,
    private readonly nodeId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('CLUSTER_ADD_NODE_REJECTED', { reason: '集群不存在' });
      return;
    }
    if (cluster.nodes.length >= cluster.maxNodes) {
      events.emit('CLUSTER_ADD_NODE_REJECTED', { reason: '集群已满' });
      return;
    }

    const node = current.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit('CLUSTER_ADD_NODE_REJECTED', { reason: '节点不存在' });
      return;
    }
    if (node.clusterId !== null) {
      events.emit('CLUSTER_ADD_NODE_REJECTED', { reason: '节点已属于其它集群' });
      return;
    }

    state.update((draft) => {
      const c = draft.clusters.find((x) => x.id === this.clusterId);
      if (c) c.nodes.push(this.nodeId);
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) n.clusterId = this.clusterId;
    });

    events.emit('NODE_ADDED_TO_CLUSTER', this.clusterId, this.nodeId);
  }
}

/* ========================================================================
 * BuildDataCenterCommand
 * ====================================================================== */
export class BuildDataCenterCommand implements Command {
  constructor(
    private readonly locationId: string,
    private readonly maxPowerMW: number,
    private readonly coolingTypeId: 'air' | 'liquid' | 'immersion',
  ) {}

  execute(state: GameState, events: EventBus): void {
    const loc = getDataCenterLocation(this.locationId);
    if (!loc) {
      events.emit('DC_REJECTED', {
        reason: `未知地点: ${String(this.locationId)}`,
        validLocations: DATA_CENTER_LOCATIONS.map((l) => ({ id: l.id, name: l.name })),
      });
      return;
    }
    const cooling = getCoolingType(this.coolingTypeId);
    if (!cooling) {
      events.emit('DC_REJECTED', { reason: '未知冷却方式' });
      return;
    }

    const buildCost = loc.buildCostPerMW * this.maxPowerMW + cooling.extraBuildCostPerMW * this.maxPowerMW;
    const current = state.read();
    const funds = current.resources['funds'] ?? 0;
    if (funds < buildCost) {
      events.emit('DC_REJECTED', { reason: '资金不足', cost: buildCost });
      return;
    }

    // PUE = cooling.basePUE × location.climateFactor
    const actualPue = cooling.basePUE * loc.climateFactor;

    const dc: DataCenter = {
      id: genId('dc'),
      name: `${loc.name} 数据中心 #${current.dataCenters.length + 1}`,
      location: loc.name,
      maxPowerMW: this.maxPowerMW,
      usedPowerMW: 0,
      coolingType: this.coolingTypeId,
      pue: actualPue,
      basePue: actualPue,
      currentPue: actualPue,
      clusters: [],
      buildCost,
      maintenanceCostPerDay: loc.maintenanceCostPerDay,
      powerCostPerKWh: loc.powerCostPerKWh,
      builtAt: current.date,
      lastMaintenanceDay: current.date,
    };

    state.update((draft) => {
      draft.resources['funds'] -= buildCost;
      draft.dataCenters.push(dc);
    });

    events.emit('DC_BUILT', dc.id, dc.name);
  }
}

/* ========================================================================
 * MoveClusterCommand
 * ====================================================================== */
export class MoveClusterCommand implements Command {
  constructor(
    private readonly clusterId: string,
    private readonly dataCenterId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('CLUSTER_MOVE_REJECTED', { reason: '集群不存在' });
      return;
    }
    const dc = current.dataCenters.find((d) => d.id === this.dataCenterId);
    if (!dc) {
      events.emit('CLUSTER_MOVE_REJECTED', { reason: '数据中心不存在' });
      return;
    }

    // ★ 性能优化：用聚合桶 O(桶数) 累计功耗，替代 O(卡数) 遍历 installedCards + parseCardUid
    //   10万卡场景从数百 ms 降至 <1ms（MoveCluster 为用户手动触发，但仍避免大集群卡顿）
    const clusterNodeSet = new Set(cluster.nodes);
    let clusterPowerMW = 0;
    for (const modelId of Object.keys(current.resourceMeta)) {
      const pool = current.resourceMeta[modelId];
      if (!pool || !Array.isArray((pool as any).aggregates)) continue;
      const spec = getCardSpec(modelId);
      if (!spec) continue;
      for (const agg of (pool as any).aggregates) {
        if (agg.count > 0 && agg.location && clusterNodeSet.has(agg.location)) {
          // 已安装卡均计入功耗（online/offline/broken 同样占用电容配额）
          clusterPowerMW += (agg.count * spec.maxPowerDrawKW) / 1000;
        }
      }
    }

    const oldDcId = cluster.dataCenterId;
    const oldDcPower = clusterPowerMW;

    state.update((draft) => {
      if (oldDcId) {
        const oldDc = draft.dataCenters.find((d) => d.id === oldDcId);
        if (oldDc) {
          oldDc.usedPowerMW = Math.max(0, oldDc.usedPowerMW - oldDcPower);
          oldDc.clusters = oldDc.clusters.filter((id) => id !== this.clusterId);
        }
      }
      const newDc = draft.dataCenters.find((d) => d.id === this.dataCenterId);
      if (newDc) {
        newDc.clusters.push(this.clusterId);
        newDc.usedPowerMW += clusterPowerMW;
      }
      const c = draft.clusters.find((x) => x.id === this.clusterId);
      if (c) c.dataCenterId = this.dataCenterId;
    });

    events.emit('CLUSTER_MOVED', this.clusterId, this.dataCenterId);
  }
}

/* ========================================================================
 * UpgradeNodeInterconnectCommand
 * ====================================================================== */
export class UpgradeNodeInterconnectCommand implements Command {
  constructor(
    private readonly nodeId: string,
    private readonly targetTemplateId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const node = current.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit('NODE_UPGRADE_REJECTED', { reason: '节点不存在' });
      return;
    }

    const target = getNodeTemplate(this.targetTemplateId);
    if (!target) {
      events.emit('NODE_UPGRADE_REJECTED', { reason: '未知节点模板' });
      return;
    }

    if (target.interconnectBandwidth <= node.interconnectBandwidth) {
      events.emit('NODE_UPGRADE_REJECTED', { reason: '目标互联带宽不高于当前' });
      return;
    }

    const bwDiff = target.interconnectBandwidth - node.interconnectBandwidth;
    const cost = bwDiff * 50; // $50/GBps

    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('NODE_UPGRADE_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) {
        n.interconnect = target.interconnect;
        n.interconnectBandwidth = target.interconnectBandwidth;
        n.nvswitchGeneration = target.nvswitchGeneration;
        n.maxPowerDrawKW = target.maxPowerDrawKW;
        n.powerSupplyKW = target.powerSupplyKW;
        n.maintenanceCost = target.maintenanceCost;
      }
    });

    events.emit('NODE_UPGRADED', this.nodeId, target.interconnect, cost);
  }
}

/* ========================================================================
 * UpgradeClusterStorageCommand
 * ====================================================================== */
export class UpgradeClusterStorageCommand implements Command {
  constructor(
    private readonly clusterId: string,
    private readonly targetStorageType: 'nvme_raid' | 'distributed_fs' | 'all_flash_cluster',
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const cluster = current.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit('STORAGE_UPGRADE_REJECTED', { reason: '集群不存在' });
      return;
    }

    const targetConfig = getStorageConfig(this.targetStorageType);
    if (!targetConfig) {
      events.emit('STORAGE_UPGRADE_REJECTED', { reason: '未知存储类型' });
      return;
    }

    const currentIdx = STORAGE_CONFIGS.findIndex((s) => s.id === cluster.storageType);
    const targetIdx = STORAGE_CONFIGS.findIndex((s) => s.id === this.targetStorageType);
    if (targetIdx <= currentIdx) {
      events.emit('STORAGE_UPGRADE_REJECTED', { reason: '目标存储级别不高于当前' });
      return;
    }

    const cost = targetConfig.upgradeCostPerNode * cluster.nodes.length;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('STORAGE_UPGRADE_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      const c = draft.clusters.find((x) => x.id === this.clusterId);
      if (c) {
        c.storageType = this.targetStorageType;
        c.storageIO = targetConfig.io;
        c.storageCapacity = targetConfig.capacity;
        c.storageCostPerDay = targetConfig.costPerDay;
      }
    });

    events.emit('STORAGE_UPGRADED', this.clusterId, this.targetStorageType, cost);
  }
}

/* ========================================================================
 * MaintainDataCenterCommand
 * ====================================================================== */
export class MaintainDataCenterCommand implements Command {
  constructor(private readonly dcId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const dc = current.dataCenters.find((d) => d.id === this.dcId);
    if (!dc) {
      events.emit('DC_MAINTAIN_REJECTED', { reason: '数据中心不存在' });
      return;
    }

    const cost = 5_000;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('DC_MAINTAIN_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      const d = draft.dataCenters.find((x) => x.id === this.dcId);
      if (d) {
        d.currentPue = d.basePue;
        // BUG-5 修复：直接用 draft.date，避免在 update 回调中调用 state.read() 拿到旧快照
        d.lastMaintenanceDay = draft.date;
      }
    });

    events.emit('DC_MAINTAINED', this.dcId);
  }
}

/* ========================================================================
 * RepairCardCommand
 * ====================================================================== */
export class RepairCardCommand implements Command {
  constructor(private readonly cardUid: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    const parsed = parseCardUid(this.cardUid);
    if (!parsed) {
      events.emit('CARD_REPAIR_REJECTED', { reason: '无效的卡标识' });
      return;
    }
    const pool = current.resourceMeta[parsed.modelId] as any;
    if (!pool || !Array.isArray(pool?.aggregates)) {
      events.emit('CARD_REPAIR_REJECTED', { reason: '卡不存在' });
      return;
    }
    const bucketHit = findCardBucket(pool, this.cardUid);
    if (!bucketHit) {
      events.emit('CARD_REPAIR_REJECTED', { reason: '卡不存在' });
      return;
    }
    const modelId = parsed.modelId;
    const cardStatus = bucketHit.bucket.status;

    if (cardStatus === 'online') {
      events.emit('CARD_REPAIR_REJECTED', { reason: '卡已在线，无需修复' });
      return;
    }

    if (cardStatus === 'broken') {
      events.emit('CARD_REPAIR_REJECTED', { reason: '卡已报废，无法修复' });
      return;
    }

    const spec = getCardSpec(modelId);
    if (!spec) return;

    const cost = Math.ceil(spec.unitCost * 0.20);
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('CARD_REPAIR_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      // ★ P1-2 修复：Math.max(0, ...) 保护资金下界
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - cost);
      const draftPool = draft.resourceMeta[modelId!] as any;
      if (draftPool && Array.isArray(draftPool.aggregates)) {
        const newPool = moveCardBetweenStatuses(draftPool, parsed!, 'online');
        draft.resourceMeta[modelId!] = newPool;
      }
      draft.infraEventLog.push({
        date: draft.date,
        type: 'CARD_REPAIRED',
        message: `计算卡 ${this.cardUid.slice(-6)} 已修复`,
        severity: 'info',
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });

    events.emit('CARD_REPAIRED', this.cardUid, modelId, cost);
  }
}

/* ========================================================================
 * ScrapCardCommand
 * ====================================================================== */
export class ScrapCardCommand implements Command {
  constructor(private readonly cardUid: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    const parsed = parseCardUid(this.cardUid);
    if (!parsed) {
      events.emit('CARD_SCRAP_REJECTED', { reason: '无效的卡标识' });
      return;
    }
    const pool = current.resourceMeta[parsed.modelId] as any;
    if (!pool || !Array.isArray(pool?.aggregates)) {
      events.emit('CARD_SCRAP_REJECTED', { reason: '卡不存在' });
      return;
    }
    const bucketHit = findCardBucket(pool, this.cardUid);
    if (!bucketHit) {
      events.emit('CARD_SCRAP_REJECTED', { reason: '卡不存在' });
      return;
    }
    const modelId = parsed.modelId;
    const cardLocation = bucketHit.bucket.location;

    const spec = getCardSpec(modelId);
    if (!spec) return;

    const salvage = Math.ceil(spec.unitCost * 0.05);

    state.update((draft) => {
      // ★ P1-11 修复：从所有训练项目的 nodeAssignments 中移除该 cardUid
      //   防止悬空引用（卡已报废但 project.nodeAssignments 仍引用）
      for (const project of draft.trainingProjects) {
        for (const [nodeId, uids] of Object.entries(project.nodeAssignments)) {
          if (uids.includes(this.cardUid)) {
            project.nodeAssignments[nodeId] = uids.filter((u) => u !== this.cardUid);
          }
        }
        // 清空后删除空数组键，保持结构整洁
        for (const nodeId of Object.keys(project.nodeAssignments)) {
          if (project.nodeAssignments[nodeId].length === 0) {
            delete project.nodeAssignments[nodeId];
          }
        }
      }

      // 从节点移除
      if (cardLocation) {
        const node = draft.serverNodes.find((n) => n.id === cardLocation);
        if (node) {
          node.installedCards = node.installedCards.filter((uid) => uid !== this.cardUid);
        }
      }
      // 从 resourceMeta pool 中删除
      const draftPool = draft.resourceMeta[modelId!] as any;
      if (draftPool && Array.isArray(draftPool.aggregates)) {
        const newPool = removeCardByUid(draftPool, this.cardUid);
        draft.resourceMeta[modelId!] = newPool;
      }
      draft.resources[modelId!] = Math.max(0, (draft.resources[modelId!] ?? 0) - 1);
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) + salvage);
      draft.infraEventLog.push({
        date: draft.date,
        type: 'CARD_SCRAPPED',
        message: `计算卡 ${this.cardUid.slice(-6)} 已报废，回收 $${salvage}`,
        severity: 'warning',
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });

    events.emit('CARD_SCRAPPED', this.cardUid, salvage);
  }
}

/* ========================================================================
 * RepairNodeCommand
 * ====================================================================== */
export class RepairNodeCommand implements Command {
  constructor(private readonly nodeId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const node = current.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit('NODE_REPAIR_REJECTED', { reason: '节点不存在' });
      return;
    }

    const cost = node.maintenanceCost * 10;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('NODE_REPAIR_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      // ★ P0-2 修复：Math.max(0, ...) 保护资金下界
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - cost);
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) {
        // ★ 性能优化：用聚合桶 O(桶数) 批量迁移 offline → online，
        //   替代原 O(卡数) 遍历 installedCards + 逐张 moveCardBetweenStatuses
        //   10万卡节点修复从数百 ms 降至 <1ms
        for (const modelId of Object.keys(draft.resourceMeta)) {
          const draftPool = draft.resourceMeta[modelId] as any;
          if (!draftPool || !Array.isArray(draftPool.aggregates)) continue;
          // 收集该节点上所有 offline 桶（不同 ageBucket 各一个桶）
          const offlineBuckets: Array<{ ageBucket: number; count: number }> = [];
          for (const agg of draftPool.aggregates) {
            if (agg.status === 'offline' && agg.count > 0 && agg.location === this.nodeId) {
              offlineBuckets.push({ ageBucket: agg.ageBucket, count: agg.count });
            }
          }
          // 每个桶批量迁移到 online
          for (const ob of offlineBuckets) {
            draft.resourceMeta[modelId] = transferBetweenBuckets(
              draftPool, ob.ageBucket, this.nodeId, 'offline', 'online', ob.count,
            );
          }
        }
        n.reliability = n.baseReliability;
        n.lastMaintenanceDay = draft.date;
      }
      draft.infraEventLog.push({
        date: draft.date,
        type: 'NODE_REPAIRED',
        message: `节点 ${node.name} 已修复`,
        severity: 'info',
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });

    events.emit('NODE_REPAIRED', this.nodeId, cost);
  }
}

/* ========================================================================
 * MaintainNodeCommand
 * ====================================================================== */
export class MaintainNodeCommand implements Command {
  constructor(private readonly nodeId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const node = current.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit('NODE_MAINTAIN_REJECTED', { reason: '节点不存在' });
      return;
    }

    const cost = node.maintenanceCost * 5;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('NODE_MAINTAIN_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) {
        n.reliability = n.baseReliability;
        n.lastMaintenanceDay = draft.date;
      }
      draft.infraEventLog.push({
        date: draft.date,
        type: 'NODE_MAINTAINED',
        message: `节点 ${node.name} 已维护，可靠性恢复至 ${node.baseReliability}`,
        severity: 'info',
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });

    events.emit('NODE_MAINTAINED', this.nodeId, cost);
  }
}
