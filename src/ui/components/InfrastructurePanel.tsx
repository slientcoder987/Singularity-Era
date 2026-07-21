import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import {
  BulkBuyNodesCommand,
  BulkInstallCardsCommand,
  CreateClusterCommand,
  BuildDataCenterCommand,
  MoveClusterCommand,
  AddNodeToClusterCommand,
  UpgradeNodeInterconnectCommand,
  UpgradeClusterStorageCommand,
  MaintainDataCenterCommand,
  RepairCardCommand,
  ScrapCardCommand,
  RepairNodeCommand,
  MaintainNodeCommand,
} from '../../core/commands/InfraCommands';
import {
  NODE_TEMPLATES,
  CLUSTER_NETWORKS,
  DATA_CENTER_LOCATIONS,
  COOLING_TYPES,
  STORAGE_CONFIGS,
} from '../../core/config/infrastructure';
import { getCardSpec } from '../../core/config/computeCards';
import { useFormatDate } from '../hooks/useFormatDate';
import { expandAggregateUids, collectNodeCardStats } from '../../core/utils/cardAggregate';
import styles from '../styles/App.module.css';

type InfraTab = 'topology' | 'build';

const INFRA_TABS: { key: InfraTab; label: string; icon: string }[] = [
  { key: 'topology', label: '拓扑', icon: '🏗️' },
  { key: 'build', label: '建造', icon: '🔨' },
];

export function InfrastructurePanel() {
  const game = useGame();
  const [tab, setTab] = useState<InfraTab>('topology');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>基础设施系统</h3>

      <div className={styles.empFilter}>
        {INFRA_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.empFilterBtn} ${tab === t.key ? styles.empFilterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: tab === 'topology' ? 'block' : 'none' }}>
        <TopologyTab />
      </div>
      <div style={{ display: tab === 'build' ? 'block' : 'none' }}>
        <BuildTab game={game} />
      </div>
    </section>
  );
}

/* ============== 拓扑视图 ============== */

interface TopologyRow {
  kind: 'dc' | 'cluster' | 'node' | 'card' | 'freeCluster' | 'freeNode' | 'freeNodesHeader';
  depth: number;
  icon: string;
  label: string;
  hint: string;
  /** 可折叠行的唯一 id（点击切换折叠状态） */
  collapsibleId?: string;
  /** 当前是否折叠（仅 collapsibleId 存在时有意义） */
  isCollapsed?: boolean;
}

interface TopologyRowProps {
  rows: TopologyRow[];
  onToggleCollapse?: (id: string) => void;
}

function TopologyRowComponent({ index, style, rows, onToggleCollapse }: RowComponentProps<TopologyRowProps>) {
  const row = rows[index];
  const paddingLeft = row.depth * 12 + 4;
  const isCollapsible = !!row.collapsibleId;
  const arrow = isCollapsible ? (row.isCollapsed ? '▶' : '▼') : '';
  return (
    <div
      className={row.depth === 0 ? styles.treeNode : styles.treeChild}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: `${paddingLeft}px`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        flexWrap: 'nowrap',
        cursor: isCollapsible ? 'pointer' : 'default',
      }}
      onClick={isCollapsible && onToggleCollapse ? () => onToggleCollapse(row.collapsibleId!) : undefined}
    >
      {arrow && <span style={{ marginRight: '4px', color: '#888', flexShrink: 0 }}>{arrow}</span>}
      <span className={styles.devRowLabel} style={{ minWidth: 0, flexShrink: 0 }}>
        {row.icon} {row.label}
      </span>
      <span
        className={styles.devHint}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {row.hint}
      </span>
    </div>
  );
}

/** 集群聚合信息（折叠时显示） */
interface ClusterAgg {
  totalCards: number;
  totalMemoryGB: number;
  faultedCards: number;
  onlineCards: number;
  totalNodes: number;
}

function TopologyTab() {
  const dataCenters = useGameState((s) => s.dataCenters);
  const clusters = useGameState((s) => s.clusters);
  const serverNodes = useGameState((s) => s.serverNodes);
  const resourceMeta = useGameState((s) => s.resourceMeta);
  const infraEventLog = useGameState((s) => s.infraEventLog);
  const formatDay = useFormatDate();

  // ★ 性能优化：用 Map 替代 find，O(N) → O(1)
  const clusterMap = useMemo(() => {
    const m = new Map<string, typeof clusters[number]>();
    for (const c of clusters) m.set(c.id, c);
    return m;
  }, [clusters]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, typeof serverNodes[number]>();
    for (const n of serverNodes) m.set(n.id, n);
    return m;
  }, [serverNodes]);

  // ★ 性能优化：用聚合桶 O(桶数) 统计每节点显存/带宽/状态分布，
  //   替代原 O(卡数) 遍历 installedCards + cardIndex.get（10万卡场景数百 ms → <1ms）
  const nodeStatsMap = useMemo(
    () => collectNodeCardStats(resourceMeta),
    [resourceMeta],
  );

  const nodeMemoryMap = useMemo(() => {
    const map = new Map<string, { memoryGB: number; bandwidthGBs: number }>();
    for (const node of serverNodes) {
      const stats = nodeStatsMap.get(node.id);
      map.set(node.id, {
        memoryGB: stats?.memoryGB ?? 0,
        bandwidthGBs: stats?.bandwidthGBs ?? 0,
      });
    }
    return map;
  }, [serverNodes, nodeStatsMap]);

  // ★ 性能优化：per-cluster 聚合，用 nodeStatsMap 累加替代 O(卡数) UID 遍历
  const clusterAggMap = useMemo(() => {
    const map = new Map<string, ClusterAgg>();
    for (const cluster of clusters) {
      let totalCards = 0;
      let totalMemoryGB = 0;
      let faultedCards = 0;
      let onlineCards = 0;
      for (const nodeId of cluster.nodes) {
        const stats = nodeStatsMap.get(nodeId);
        if (!stats) continue;
        totalCards += stats.total;
        totalMemoryGB += stats.memoryGB;
        faultedCards += stats.offline + stats.broken;
        onlineCards += stats.online;
      }
      map.set(cluster.id, {
        totalCards, totalMemoryGB, faultedCards, onlineCards,
        totalNodes: cluster.nodes.length,
      });
    }
    return map;
  }, [clusters, nodeStatsMap]);

  // ★ 折叠状态：默认所有集群折叠（万卡场景下避免行数爆炸）
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(() => new Set());
  const [collapsedDCs, setCollapsedDCs] = useState<Set<string>>(() => new Set());
  const [collapsedFreeClusters, setCollapsedFreeClusters] = useState<Set<string>>(() => new Set());
  // ★ 性能：独立节点默认折叠（10万卡场景 12500 独立节点全量生成行对象会卡顿）
  const [freeNodesCollapsed, setFreeNodesCollapsed] = useState(true);
  // ★ S2-3 修复：原用 useMemo 做副作用（setCollapsedClusters）是 React 反模式，
  //   每次 clusters 引用变化都会覆盖用户手动展开状态。改为 useRef + useEffect 仅在首次挂载执行。
  const initialFoldDone = useRef(false);
  useEffect(() => {
    if (initialFoldDone.current) return;
    initialFoldDone.current = true;
    if (clusters.length >= 5) {
      setCollapsedClusters(new Set(clusters.map((c) => c.id)));
    }
  }, [clusters]);

  const toggleCluster = useCallback((id: string) => {
    setCollapsedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDC = useCallback((id: string) => {
    setCollapsedDCs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleFreeCluster = useCallback((id: string) => {
    setCollapsedFreeClusters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const flattenedRows = useMemo<TopologyRow[]>(() => {
    const rows: TopologyRow[] = [];
    const freeNodes = serverNodes.filter((n) => n.clusterId === null);
    const freeClusters = clusters.filter((c) => c.dataCenterId === null);

    // 数据中心 → 集群 → 节点 → 卡
    for (const dc of dataCenters) {
      const dcCollapsed = collapsedDCs.has(dc.id);
      // 聚合 dc 信息
      let dcNodes = 0;
      let dcCards = 0;
      let dcFaulted = 0;
      for (const clusterId of dc.clusters) {
        const agg = clusterAggMap.get(clusterId);
        if (agg) {
          dcNodes += agg.totalNodes;
          dcCards += agg.totalCards;
          dcFaulted += agg.faultedCards;
        }
      }
      rows.push({
        kind: 'dc', depth: 0, icon: '🏢', label: dc.name,
        hint: `${dc.maxPowerMW}MW · PUE ${dc.currentPue.toFixed(3)}(基准${dc.basePue.toFixed(2)}) · ${dc.coolingType} · ${dc.clusters.length}集群 · ${dcNodes}节点 · ${dcCards}卡${dcFaulted > 0 ? ` · ⚠️${dcFaulted}故障` : ''} · $${dc.powerCostPerKWh}/kWh${dc.currentPue > dc.basePue * 1.02 ? ' · ⚠️ 需维护' : ''}`,
        collapsibleId: `dc:${dc.id}`,
        isCollapsed: dcCollapsed,
      });
      if (dcCollapsed) continue;

      for (const clusterId of dc.clusters) {
        const cluster = clusterMap.get(clusterId);
        if (!cluster) continue;
        const clusterCollapsed = collapsedClusters.has(cluster.id);
        const agg = clusterAggMap.get(cluster.id);
        const aggHint = agg ? ` · ${agg.totalNodes}节点 · ${agg.totalCards}卡 · ${(agg.totalMemoryGB / 1024).toFixed(1)}TB${agg.faultedCards > 0 ? ` · ⚠️${agg.faultedCards}故障` : ''}` : '';
        rows.push({
          kind: 'cluster', depth: 1, icon: '🔗', label: cluster.name,
          hint: `${cluster.network} · ${cluster.nodes.length}/${cluster.maxNodes}节点 · +${(cluster.utilizationBonus * 100).toFixed(0)}% · ${cluster.networkBandwidth}GB/s · TP×${cluster.maxTPDegree}${aggHint}`,
          collapsibleId: `cluster:${cluster.id}`,
          isCollapsed: clusterCollapsed,
        });
        if (clusterCollapsed) continue;

        for (const nodeId of cluster.nodes) {
          const node = nodeMap.get(nodeId);
          if (!node) continue;
          const mem = nodeMemoryMap.get(nodeId) ?? { memoryGB: 0, bandwidthGBs: 0 };
          const nvGen = node.nvswitchGeneration ? ` · NVSwitch Gen${node.nvswitchGeneration}` : '';
          rows.push({
            kind: 'node', depth: 2, icon: '🖥️', label: node.name,
            hint: `${node.installedCards.length}/${node.slotCount}卡 · ${mem.memoryGB}GB · ${mem.bandwidthGBs}GB/s · ${node.interconnect}(${node.interconnectBandwidth}GB/s) · 可靠性${node.reliability}${nvGen}`,
          });
          // ★ 性能优化：原为每张卡生成一行（10万卡节点 → 10万行 React 渲染崩溃），
          //   改为按"型号×状态"聚合显示，每节点最多 7型号×3状态 ≈ 21 行
          const stats = nodeStatsMap.get(nodeId);
          if (stats) {
            for (const [modelId, statusMap] of stats.byModelStatus) {
              const spec = getCardSpec(modelId);
              const parts: string[] = [];
              const online = statusMap.get('online') ?? 0;
              const offline = statusMap.get('offline') ?? 0;
              const broken = statusMap.get('broken') ?? 0;
              if (online > 0) parts.push(`online×${online}`);
              if (offline > 0) parts.push(`offline×${offline}`);
              if (broken > 0) parts.push(`broken×${broken}`);
              rows.push({
                kind: 'card', depth: 3, icon: '·',
                label: `${spec?.name ?? modelId}`,
                hint: `${parts.join(' ')}${spec ? ` · ${spec.memoryGB}GB · ${spec.memoryBandwidth}GB/s` : ''}`,
              });
            }
          }
        }
      }
    }

    // 未入数据中心的集群
    for (const cluster of freeClusters) {
      const clusterCollapsed = collapsedFreeClusters.has(cluster.id);
      const agg = clusterAggMap.get(cluster.id);
      const aggHint = agg ? ` · ${agg.totalNodes}节点 · ${agg.totalCards}卡 · ${(agg.totalMemoryGB / 1024).toFixed(1)}TB${agg.faultedCards > 0 ? ` · ⚠️${agg.faultedCards}故障` : ''}` : '';
      rows.push({
        kind: 'freeCluster', depth: 0, icon: '🔗', label: `${cluster.name}（未入数据中心）`,
        hint: `${cluster.network} · ${cluster.nodes.length}/${cluster.maxNodes}节点 · ${cluster.networkBandwidth}GB/s · TP×${cluster.maxTPDegree}${aggHint}`,
        collapsibleId: `freeCluster:${cluster.id}`,
        isCollapsed: clusterCollapsed,
      });
      if (clusterCollapsed) continue;
      for (const nodeId of cluster.nodes) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;
        const mem = nodeMemoryMap.get(nodeId) ?? { memoryGB: 0, bandwidthGBs: 0 };
        const nvGen = node.nvswitchGeneration ? ` · NVSwitch Gen${node.nvswitchGeneration}` : '';
        rows.push({
          kind: 'node', depth: 1, icon: '🖥️', label: node.name,
          hint: `${node.installedCards.length}/${node.slotCount}卡 · ${mem.memoryGB}GB · ${mem.bandwidthGBs}GB/s · ${node.interconnect}(${node.interconnectBandwidth}GB/s) · 可靠性${node.reliability}${nvGen}`,
        });
      }
    }

    // 独立节点
    if (freeNodes.length > 0) {
      rows.push({
        kind: 'freeNodesHeader', depth: 0, icon: freeNodesCollapsed ? '▶' : '▼',
        label: `独立节点（未加入集群 · ${freeNodes.length}）`, hint: '',
        collapsibleId: 'freeNodes',
        isCollapsed: freeNodesCollapsed,
      });
      // ★ 性能：折叠时跳过 12500 节点的行对象生成
      if (!freeNodesCollapsed) {
        for (const node of freeNodes) {
          const mem = nodeMemoryMap.get(node.id) ?? { memoryGB: 0, bandwidthGBs: 0 };
          const nvGen = node.nvswitchGeneration ? ` · NVSwitch Gen${node.nvswitchGeneration}` : '';
          const installHint = node.installedCards.length < node.slotCount
            ? ` · 可安装 ${node.slotCount - node.installedCards.length} 张卡`
            : '';
          rows.push({
            kind: 'freeNode', depth: 1, icon: '🖥️', label: node.name,
            hint: `${node.installedCards.length}/${node.slotCount}卡 · ${mem.memoryGB}GB · ${mem.bandwidthGBs}GB/s · ${node.interconnect}(${node.interconnectBandwidth}GB/s) · 可靠性${node.reliability}${nvGen}${installHint}`,
          });
        }
      }
    }

    return rows;
  }, [dataCenters, clusters, serverNodes, clusterMap, nodeMap, nodeMemoryMap, clusterAggMap, nodeStatsMap, collapsedClusters, collapsedDCs, collapsedFreeClusters, freeNodesCollapsed]);

  const handleToggle = useCallback((rawId: string) => {
    const [type, id] = rawId.split(':');
    if (type === 'dc') toggleDC(id);
    else if (type === 'cluster') toggleCluster(id);
    else if (type === 'freeCluster') toggleFreeCluster(id);
    else if (type === 'freeNodes') setFreeNodesCollapsed((v) => !v);
  }, [toggleDC, toggleCluster, toggleFreeCluster]);

  if (dataCenters.length === 0 && clusters.length === 0 && serverNodes.length === 0) {
    return <div className={styles.emptyHint}>尚无基础设施，请前往"建造"标签建设</div>;
  }

  const listHeight = Math.min(flattenedRows.length * 28, 600);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devHint} style={{ color: '#888' }}>
          点击 ▶/▼ 图标可折叠/展开 · 共 {dataCenters.length} 数据中心 · {clusters.length} 集群 · {serverNodes.length} 节点
        </span>
      </div>
      <List<TopologyRowProps>
        rowComponent={TopologyRowComponent}
        rowCount={flattenedRows.length}
        rowHeight={28}
        rowProps={{ rows: flattenedRows, onToggleCollapse: handleToggle }}
        style={{ height: listHeight }}
        overscanCount={5}
      />

      {/* 事件日志 */}
      {infraEventLog.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>事件日志</span>
          </div>
          {infraEventLog.slice(-20).reverse().map((evt, i) => (
            <div key={i} className={styles.devRow}>
              <span className={styles.devHint} style={{
                color: evt.severity === 'critical' ? '#ff6b6b' :
                       evt.severity === 'warning' ? '#ffb454' : '#e6f0ff',
              }}>
                {formatDay(evt.date)} · {evt.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuildTab({ game }: { game: ReturnType<typeof useGame> }) {
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const resources = useGameState((s) => s.resources);
  const serverNodes = useGameState((s) => s.serverNodes);
  const resourceMeta = useGameState((s) => s.resourceMeta);
  const clusters = useGameState((s) => s.clusters);
  const dataCenters = useGameState((s) => s.dataCenters);

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(CLUSTER_NETWORKS[0].id);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(DATA_CENTER_LOCATIONS[0].id);
  const [selectedCoolingId, setSelectedCoolingId] = useState<'air' | 'liquid' | 'immersion'>('air');
  const [dcPower, setDcPower] = useState<number>(1);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedDcId, setSelectedDcId] = useState<string>('');

  // 批量买节点
  const [nodeBuyQty, setNodeBuyQty] = useState<Record<string, number>>({});

  // 自动安装
  const [autoInstallNodeIds, setAutoInstallNodeIds] = useState<Set<string>>(new Set());
  const [autoInstallCardModel, setAutoInstallCardModel] = useState<string>('');

  // 数量+型号安装（十万卡场景：避免逐张选择）
  const [installModelId, setInstallModelId] = useState<string>('');
  const [installQty, setInstallQty] = useState<number>(1000);
  const [installNodeFilter, setInstallNodeFilter] = useState<string>('');

  // 集群追加节点
  const [addNodeClusterId, setAddNodeClusterId] = useState<string>('');
  const [addNodeIds, setAddNodeIds] = useState<Set<string>>(new Set());

  // 升级与维护
  const [upgradeNodeId, setUpgradeNodeId] = useState<string>('');
  const [upgradeTargetTpl, setUpgradeTargetTpl] = useState<string>('');
  const [upgradeStorageClusterId, setUpgradeStorageClusterId] = useState<string>('');
  const [upgradeStorageTarget, setUpgradeStorageTarget] = useState<string>('');
  const [maintainDcId, setMaintainDcId] = useState<string>('');

  // 节点维护 + 卡修复
  const [maintainNodeId, setMaintainNodeId] = useState<string>('');
  const [repairNodeId, setRepairNodeId] = useState<string>('');
  const [repairCardUid, setRepairCardUid] = useState<string>('');

  // ★ 性能：缓存 freeNodesForCluster，避免每次 serverNodes 引用变化（如其他命令 update）都重 filter
  const freeNodesForCluster = useMemo(
    () => serverNodes.filter((n) => n.clusterId === null),
    [serverNodes],
  );
  const selectedNetwork = CLUSTER_NETWORKS.find((n) => n.id === selectedNetworkId) ?? CLUSTER_NETWORKS[0];
  const clusterBuildCost = selectedNetwork.costPerNode * selectedNodeIds.size;

  const selectedLocation = DATA_CENTER_LOCATIONS.find((l) => l.id === selectedLocationId) ?? DATA_CENTER_LOCATIONS[0];
  const selectedCooling = COOLING_TYPES.find((c) => c.id === selectedCoolingId) ?? COOLING_TYPES[0];
  const dcBuildCost = selectedLocation.buildCostPerMW * dcPower + selectedCooling.extraBuildCostPerMW * dcPower;
  const actualPue = selectedCooling.basePUE;

  const toggleNodeId = (id: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ★ 性能优化：单次遍历卡池，统计真实 idle/online/faulted 卡数。
  //   十万卡场景下不再为 UI 逐张展开 uid 数组（SELECT_LIMIT 误导显示），
  //   改为直接累加桶 count：totalUninstalledCount + idleByModel 用于统计与下拉。
  const SELECT_LIMIT = 200;
  const CHECKBOX_LIMIT = 100;
  const { offlineCardUids, faultedCards, totalCards, onlineCards, faultedCardCount, totalUninstalledCount, idleByModel } = useMemo(() => {
    const offlineSet = new Set<string>();
    const faulted: Array<{ uid: string; modelId: string; status: string; specName: string; repairCost: number }> = [];
    const idleMap: Record<string, number> = {};
    let total = 0;
    let online = 0;
    let faultedCount = 0;
    let totalUninstalled = 0;
    for (const key of Object.keys(resourceMeta)) {
      const pool = resourceMeta[key];
      if (!pool) continue;
      const isLegacyArray = Array.isArray(pool);
      const isPool = !isLegacyArray && Array.isArray((pool as any)?.aggregates);
      if (!isLegacyArray && !isPool) continue;
      const spec = getCardSpec(key);

      if (isPool) {
        // ★ 聚合池：直接按桶统计（O(桶数)）
        let modelIdle = 0;
        for (const agg of (pool as any).aggregates) {
          total += agg.count;
          if (agg.status === 'online') online += agg.count;
          if (agg.location === null && agg.status === 'online') {
            // ★ 真实空闲数（不被 SELECT_LIMIT 截断）—— 用于统计与下拉显示
            modelIdle += agg.count;
            totalUninstalled += agg.count;
          }
          // ★ 性能：offline/broken 桶的代表 uid 直接按合成格式拼字符串，
          //   不再调 expandAggregateUids（每次都遍历所有桶找匹配）
          // ★ 修复：UID 必须包含 location，否则同型号同 ageBucket 但不同节点
          //   的多个 offline/broken 桶会产生相同 key → React "same key" 警告。
          if (agg.status === 'offline') {
            faultedCount += agg.count;
            const repUid = `__offline__${key}:${agg.ageBucket}:${agg.location ?? 'null'}`;
            offlineSet.add(repUid);
            faulted.push({
              uid: repUid,
              modelId: key,
              status: 'offline',
              specName: spec?.name ?? key,
              repairCost: spec ? Math.ceil(spec.unitCost * 0.20) : 0,
            });
          }
          if (agg.status === 'broken') {
            faultedCount += agg.count;
            const repUid = `__broken__${key}:${agg.ageBucket}:${agg.location ?? 'null'}`;
            faulted.push({
              uid: repUid,
              modelId: key,
              status: 'broken',
              specName: spec?.name ?? key,
              repairCost: spec ? Math.ceil(spec.unitCost * 0.20) : 0,
            });
          }
        }
        if (modelIdle > 0) idleMap[key] = modelIdle;
      } else {
        // 旧版扁平数组（向下兼容旧存档）
        let modelIdle = 0;
        for (const card of pool as any[]) {
          total++;
          if (card.status === 'online') online++;
          if (card.location === null && card.status === 'online') {
            modelIdle++;
            totalUninstalled++;
          }
          if (card.status === 'offline') {
            offlineSet.add(card.uid);
          }
          if (card.status === 'offline' || card.status === 'broken') {
            faultedCount++;
            faulted.push({
              uid: card.uid,
              modelId: key,
              status: card.status,
              specName: spec?.name ?? key,
              repairCost: spec ? Math.ceil(spec.unitCost * 0.20) : 0,
            });
          }
        }
        if (modelIdle > 0) idleMap[key] = modelIdle;
      }
    }
    return {
      offlineCardUids: offlineSet,
      faultedCards: faulted,
      totalCards: total,
      onlineCards: online,
      faultedCardCount: faultedCount,
      totalUninstalledCount: totalUninstalled,
      idleByModel: idleMap,
    };
  }, [resourceMeta]);

  const brokenNodes = useMemo(
    () => serverNodes.filter((n) => n.installedCards.some((uid) => offlineCardUids.has(uid))),
    [serverNodes, offlineCardUids],
  );

  const eligibleNodesForInstall = useMemo(
    () => serverNodes.filter((n) => n.installedCards.length < n.slotCount),
    [serverNodes],
  );

  // ★ 数量+型号安装：按 modelId 聚合 idle 卡数（直接用 resources[modelId] 与已装卡数之差近似）
  //   准确值需要遍历 pool.aggregates，但 for 100w 卡场景下此近似 O(1) 即可
  const installModelMaxQty = useMemo(() => {
    if (!installModelId) return 0;
    // 优先使用 resources 字段（最准确）
    const total = resources[installModelId] ?? 0;
    // 计算已装卡数（按 modelId 过滤，遍历所有 serverNodes.installedCards 不现实）
    // 改用：遍历 resourceMeta 该型号桶，统计 location !== null 的 count
    const pool = resourceMeta[installModelId];
    let idleCount = 0;
    if (Array.isArray(pool)) {
      idleCount = pool.filter((c: any) => c.location === null && c.status === 'online').length;
    } else if (pool && Array.isArray((pool as any).aggregates)) {
      for (const a of (pool as any).aggregates) {
        if (a.location === null && a.status === 'online') idleCount += a.count;
      }
    }
    return idleCount > 0 ? idleCount : total;
  }, [installModelId, resources, resourceMeta]);

  // ★ 节点搜索：按名称/类型/TAG 模糊匹配
  const installTargetNodes = useMemo(() => {
    const q = installNodeFilter.trim().toLowerCase();
    if (!q) return eligibleNodesForInstall;
    return eligibleNodesForInstall.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.nodeType.toLowerCase().includes(q) ||
        n.interconnect.toLowerCase().includes(q),
    );
  }, [eligibleNodesForInstall, installNodeFilter]);
  const maintainableNodes = useMemo(
    () => serverNodes.filter((n) => n.reliability < n.baseReliability),
    [serverNodes],
  );
  // select 选项限制版本（仅给剩余的少量下拉用：DC 位置、升级等）
  const allNodesForUpgradeSelect = serverNodes.slice(0, SELECT_LIMIT);
  const maintainableNodesSelect = maintainableNodes.slice(0, SELECT_LIMIT);
  const brokenNodesSelect = brokenNodes.slice(0, SELECT_LIMIT);
  const faultedCardsSelect = faultedCards.slice(0, SELECT_LIMIT);
  // checkbox 列表限制版本
  const autoInstallNodesLimited = eligibleNodesForInstall.slice(0, CHECKBOX_LIMIT);
  const createClusterNodesLimited = freeNodesForCluster.slice(0, CHECKBOX_LIMIT);

  /**
   * ★ 核心：按数量+型号安装到节点
   *
   * 不再逐张选 uid，而是从目标 modelId 的 idle 池中取前 N 个合成 uid，
   * 按节点空槽分配。
   *
   * 性能：使用 BulkInstallCardsCommand 单次 state.update 安装所有卡，
   * 避免 10w 次单独 update 阻塞主线程。
   */
  const installToNodes = useCallback(
    (targetNodes: typeof serverNodes, modelId: string, qty: number) => {
      if (!modelId || qty <= 0 || targetNodes.length === 0) return;
      const pool = resourceMeta[modelId];
      const uids = expandAggregateUids(
        modelId,
        pool,
        (a) => a.location === null && a.status === 'online',
        qty,
      );
      if (uids.length === 0) return;

      // 按节点空槽分配
      const plan: { uid: string; nodeId: string }[] = [];
      let uidIdx = 0;
      for (const node of targetNodes) {
        const empty = node.slotCount - node.installedCards.length;
        for (let s = 0; s < empty && uidIdx < uids.length; s++) {
          plan.push({ uid: uids[uidIdx++], nodeId: node.id });
        }
        if (uidIdx >= uids.length) break;
      }
      if (plan.length === 0) return;

      // ★ 关键：单次命令完成全部安装（10w 卡也只 1 次 state.update）
      game.executeCommand(new BulkInstallCardsCommand(plan));
    },
    [resourceMeta, game],
  );

  return (
    <div className={styles.tabBody}>
      {/* ★ 统计概览：让用户在万卡场景下快速掌握全局状态 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>基础设施概览</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devHint} style={{ minWidth: 0 }}>
          节点 <span style={{ color: '#e6f0ff' }}>{serverNodes.length}</span>
          {' · '}集群 <span style={{ color: '#e6f0ff' }}>{clusters.length}</span>
          {' · '}数据中心 <span style={{ color: '#e6f0ff' }}>{dataCenters.length}</span>
          {' · '}总卡 <span style={{ color: '#e6f0ff' }}>{totalCards}</span>
          {' · '}在线 <span style={{ color: '#5cb85c' }}>{onlineCards}</span>
          {faultedCardCount > 0 && (
            <>
              {' · '}故障 <span style={{ color: '#ff6b6b' }}>{faultedCardCount}</span>
            </>
          )}
          {' · '}空闲 <span style={{ color: '#7ab8e0' }}>{totalUninstalledCount.toLocaleString()}</span>
          {brokenNodes.length > 0 && (
            <>
              {' · '}故障节点 <span style={{ color: '#ff6b6b' }}>{brokenNodes.length}</span>
            </>
          )}
        </span>
      </div>

      {/* 买服务器节点 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>服务器节点</span>
      </div>
      {NODE_TEMPLATES.map((tpl) => {
        const qty = nodeBuyQty[tpl.id] ?? 1;
        const totalCost = tpl.cost * qty;
        return (
          <div key={tpl.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {tpl.name}
            </span>
            <span className={styles.devHint}>
              {tpl.slotCount}槽 · {tpl.interconnect}({tpl.interconnectBandwidth}GB/s) · {tpl.powerSupplyKW}kW · {tpl.nodeType} · ${tpl.cost.toLocaleString()}
            </span>
            <input
              className={styles.input}
              type="number"
              min={1}
              step={1}
              value={qty}
              onChange={(e) => setNodeBuyQty((prev) => ({ ...prev, [tpl.id]: Math.max(1, Number(e.target.value) || 1) }))}
              style={{ width: '50px' }}
            />
            <button
              className={styles.btn}
              disabled={funds < totalCost}
              onClick={() => {
                // ★ 性能优化：用 BulkBuyNodesCommand 单次 update 替代循环 executeCommand，
                //   避免 N 次 notify × 60+ selector 的通知风暴
                game.executeCommand(new BulkBuyNodesCommand(tpl.id, qty));
              }}
            >
              买 {qty} 台 · ${totalCost.toLocaleString()}
            </button>
          </div>
        );
      })}

      {/* 安装显卡 - 型号 + 数量 + 目标节点（十万卡场景：按数量+型号而非逐张选） */}
      {serverNodes.length > 0 && totalUninstalledCount > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>安装显卡（按数量）</span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>型号</span>
            <select
              className={styles.select}
              value={installModelId}
              onChange={(e) => setInstallModelId(e.target.value)}
            >
              <option value="">选择型号...</option>
              {Array.from(
                new Set(
                  // ★ 使用真实 idle 桶的 modelId 列表（不受 SELECT_LIMIT 截断）
                  Object.keys(idleByModel),
                ),
              ).map((modelId) => {
                const spec = getCardSpec(modelId);
                const realIdle = idleByModel[modelId] ?? 0;
                return (
                  <option key={modelId} value={modelId}>
                    {spec?.name ?? modelId} ({realIdle.toLocaleString()} 张可用)
                  </option>
                );
              })}
            </select>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>数量</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              step={1}
              value={installQty}
              onChange={(e) => setInstallQty(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: '80px' }}
            />
            <button
              className={styles.btn}
              style={{ fontSize: 12, padding: '2px 8px' }}
              onClick={() => setInstallQty(installModelMaxQty)}
            >
              最大 ({installModelMaxQty.toLocaleString()})
            </button>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>目标节点</span>
            <input
              className={styles.input}
              type="text"
              placeholder="搜索节点名（如 'Node #1' / 'HGX H100'）"
              value={installNodeFilter}
              onChange={(e) => setInstallNodeFilter(e.target.value)}
              style={{ width: '220px' }}
            />
            <span className={styles.devHint}>
              匹配 {installTargetNodes.length} 节点 (共 {eligibleNodesForInstall.length} 个空槽)
            </span>
          </div>
          <div className={styles.devRow}>
            <button
              className={styles.btn}
              disabled={!installModelId || installQty <= 0 || installTargetNodes.length === 0}
              onClick={() => installToNodes(installTargetNodes, installModelId, installQty)}
              title="将指定数量的卡分散安装到匹配的节点"
            >
              安装 {Math.min(installQty, installModelMaxQty).toLocaleString()} 张
            </button>
            <button
              className={styles.btn}
              disabled={!installModelId}
              onClick={() => installToNodes(eligibleNodesForInstall, installModelId, installQty)}
              title="将指定数量的卡分散安装到所有空槽节点"
            >
              装到所有空槽 ({eligibleNodesForInstall.length} 节点)
            </button>
          </div>
        </>
      )}

      {/* 自动安装显卡到节点 */}
      {serverNodes.length > 0 && totalUninstalledCount > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>自动安装显卡</span>
          </div>
          <div className={styles.devRow}>
            <select
              className={styles.select}
              value={autoInstallCardModel}
              onChange={(e) => setAutoInstallCardModel(e.target.value)}
            >
              <option value="">所有型号</option>
              {Object.keys(idleByModel).map((modelId) => {
                const spec = getCardSpec(modelId);
                return (
                  <option key={modelId} value={modelId}>
                    {spec?.name ?? modelId}
                  </option>
                );
              })}
            </select>
            <span className={styles.devHint}>
              已选 {autoInstallNodeIds.size} 节点
            </span>
          </div>
          <div className={styles.devRow}>
            <button
              className={styles.btn}
              style={{ fontSize: 12, padding: '2px 10px' }}
              onClick={() => {
                const eligibleIds = serverNodes
                  .filter((n) => n.installedCards.length < n.slotCount)
                  .map((n) => n.id);
                setAutoInstallNodeIds(new Set(eligibleIds));
              }}
            >
              全选
            </button>
            <button
              className={styles.btn}
              style={{ fontSize: 12, padding: '2px 10px' }}
              onClick={() => setAutoInstallNodeIds(new Set())}
            >
              取消全选
            </button>
          </div>
          {autoInstallNodesLimited.map((n) => {
              const checked = autoInstallNodeIds.has(n.id);
              const empty = n.slotCount - n.installedCards.length;
              return (
                <label key={n.id} className={styles.devRow} style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setAutoInstallNodeIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(n.id)) next.delete(n.id);
                        else next.add(n.id);
                        return next;
                      });
                    }}
                    style={{ marginRight: '6px' }}
                  />
                  <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                    {n.name} ({n.installedCards.length}/{n.slotCount} · 空{empty}槽)
                  </span>
                </label>
              );
            })}
          {eligibleNodesForInstall.length > CHECKBOX_LIMIT && (
            <div className={styles.devRow}>
              <span className={styles.devHint} style={{ color: '#ffb454' }}>
                ⚠️ 仅显示前 {CHECKBOX_LIMIT} 个节点（共 {eligibleNodesForInstall.length} 个），请使用"全选"按钮批量选择
              </span>
            </div>
          )}
          <div className={styles.devRow}>
            <button
              className={styles.btn}
              disabled={autoInstallNodeIds.size === 0}
              onClick={() => {
                // ★ 关键：使用 BulkInstallCardsCommand 一次性安装所有卡，
                //   避免循环 InstallCardCommand 产生 10w 次 state.update 导致主线程阻塞。
                // 1. 计算总空槽数
                let totalEmptySlots = 0;
                const nodeEmptyList: { nodeId: string; empty: number }[] = [];
                for (const nodeId of autoInstallNodeIds) {
                  const node = serverNodes.find((n) => n.id === nodeId);
                  if (!node) continue;
                  const empty = node.slotCount - node.installedCards.length;
                  if (empty > 0) {
                    nodeEmptyList.push({ nodeId, empty });
                    totalEmptySlots += empty;
                  }
                }
                if (totalEmptySlots === 0) return;

                // 2. 收集目标 modelId 的真实 idle uid（绕过 SELECT_LIMIT 截断）
                //    注：使用 for-of 累加而非 arr.push(...uids)，避免 spread 大数组爆 V8 调用栈
                const allUids: string[] = [];
                if (autoInstallCardModel) {
                  // 指定型号：取该型号 idle 桶
                  const uids = expandAggregateUids(
                    autoInstallCardModel,
                    resourceMeta[autoInstallCardModel],
                    (a) => a.location === null && a.status === 'online',
                    totalEmptySlots,
                  );
                  for (const u of uids) {
                    if (allUids.length >= totalEmptySlots) break;
                    allUids.push(u);
                  }
                } else {
                  // 任意型号：按 modelId 顺序轮询
                  for (const mid of Object.keys(idleByModel)) {
                    if (allUids.length >= totalEmptySlots) break;
                    const uids = expandAggregateUids(
                      mid,
                      resourceMeta[mid],
                      (a) => a.location === null && a.status === 'online',
                      totalEmptySlots - allUids.length,
                    );
                    for (const u of uids) {
                      if (allUids.length >= totalEmptySlots) break;
                      allUids.push(u);
                    }
                  }
                }
                if (allUids.length === 0) return;

                // 3. 按节点空槽分配 uid
                const plan: { uid: string; nodeId: string }[] = [];
                let uidIdx = 0;
                for (const { nodeId, empty } of nodeEmptyList) {
                  for (let s = 0; s < empty && uidIdx < allUids.length; s++) {
                    plan.push({ uid: allUids[uidIdx++], nodeId });
                  }
                  if (uidIdx >= allUids.length) break;
                }
                if (plan.length > 0) {
                  game.executeCommand(new BulkInstallCardsCommand(plan));
                }
                setAutoInstallNodeIds(new Set());
                setAutoInstallCardModel('');
              }}
            >
              批量安装 ({autoInstallCardModel
                ? (idleByModel[autoInstallCardModel] ?? 0).toLocaleString()
                : totalUninstalledCount.toLocaleString()} 张可用)
            </button>
          </div>
        </>
      )}

      {/* 创建集群 */}
      {serverNodes.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>创建集群</span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>网络</span>
            <select
              className={styles.select}
              value={selectedNetworkId}
              onChange={(e) => {
                setSelectedNetworkId(e.target.value);
                setSelectedNodeIds(new Set());
              }}
            >
              {CLUSTER_NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} · {n.networkBandwidth}GB/s · TP×{n.maxTPDegree} · +{(n.utilizationBonus * 100).toFixed(0)}% · ${n.costPerNode.toLocaleString()}/节点
                </option>
              ))}
            </select>
          </div>
          {freeNodesForCluster.length === 0 ? (
            <div className={styles.devHint}>没有可用的独立节点</div>
          ) : (
            <>
              <div className={styles.devRow}>
                <button
                  className={styles.btn}
                  style={{ fontSize: 12, padding: '2px 10px' }}
                  onClick={() => {
                    const limit = Math.min(freeNodesForCluster.length, selectedNetwork.maxNodes);
                    setSelectedNodeIds(new Set(freeNodesForCluster.slice(0, limit).map((n) => n.id)));
                  }}
                >
                  全选
                </button>
                <button
                  className={styles.btn}
                  style={{ fontSize: 12, padding: '2px 10px' }}
                  onClick={() => setSelectedNodeIds(new Set())}
                >
                  取消全选
                </button>
              </div>
              {createClusterNodesLimited.map((n) => {
                const checked = selectedNodeIds.has(n.id);
                return (
                  <label key={n.id} className={styles.devRow} style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleNodeId(n.id)}
                      style={{ marginRight: '6px' }}
                    />
                    <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                      {n.name} ({n.installedCards.length}/{n.slotCount}卡 · {n.interconnect} · {n.interconnectBandwidth}GB/s)
                    </span>
                  </label>
                );
              })}
              {freeNodesForCluster.length > CHECKBOX_LIMIT && (
                <div className={styles.devRow}>
                  <span className={styles.devHint} style={{ color: '#ffb454' }}>
                    ⚠️ 仅显示前 {CHECKBOX_LIMIT} 个节点（共 {freeNodesForCluster.length} 个），请使用"全选"按钮批量选择
                  </span>
                </div>
              )}
            </>
          )}
          <div className={styles.devRow}>
            <span className={styles.devHint}>
              已选 {selectedNodeIds.size} 节点 · 费用 ${clusterBuildCost.toLocaleString()} · 上限 {selectedNetwork.maxNodes} 节点
            </span>
            <button
              className={styles.btn}
              disabled={selectedNodeIds.size === 0 || funds < clusterBuildCost}
              onClick={() => {
                game.executeCommand(
                  new CreateClusterCommand(Array.from(selectedNodeIds), selectedNetworkId),
                );
                setSelectedNodeIds(new Set());
              }}
            >
              创建集群
            </button>
          </div>
        </>
      )}

      {/* 集群追加节点 */}
      {clusters.length > 0 && freeNodesForCluster.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>集群追加节点</span>
          </div>
          <div className={styles.devRow}>
            <select
              className={styles.select}
              value={addNodeClusterId}
              onChange={(e) => {
                setAddNodeClusterId(e.target.value);
                setAddNodeIds(new Set());
              }}
            >
              <option value="">选择集群...</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.nodes.length}/{c.maxNodes} 节点)
                </option>
              ))}
            </select>
          </div>
          {addNodeClusterId && (() => {
            const targetCluster = clusters.find((c) => c.id === addNodeClusterId);
            if (!targetCluster) return null;
            const remainingSlots = targetCluster.maxNodes - targetCluster.nodes.length;
            if (remainingSlots <= 0) {
              return <div className={styles.devHint}>该集群已满</div>;
            }
            return (
              <>
                <div className={styles.devRow}>
                  <button
                    className={styles.btn}
                    style={{ fontSize: 12, padding: '2px 10px' }}
                    onClick={() => {
                      const limit = Math.min(freeNodesForCluster.length, remainingSlots);
                      setAddNodeIds(new Set(freeNodesForCluster.slice(0, limit).map((n) => n.id)));
                    }}
                  >
                    全选
                  </button>
                  <button
                    className={styles.btn}
                    style={{ fontSize: 12, padding: '2px 10px' }}
                    onClick={() => setAddNodeIds(new Set())}
                  >
                    取消全选
                  </button>
                </div>
                {freeNodesForCluster.slice(0, Math.min(remainingSlots, CHECKBOX_LIMIT)).map((n) => {
                  const checked = addNodeIds.has(n.id);
                  return (
                    <label key={n.id} className={styles.devRow} style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setAddNodeIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(n.id)) next.delete(n.id);
                            else next.add(n.id);
                            return next;
                          });
                        }}
                        style={{ marginRight: '6px' }}
                      />
                      <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                        {n.name} ({n.installedCards.length}/{n.slotCount}卡 · {n.interconnect} · {n.interconnectBandwidth}GB/s)
                      </span>
                    </label>
                  );
                })}
                {Math.min(remainingSlots, freeNodesForCluster.length) > CHECKBOX_LIMIT && (
                  <div className={styles.devRow}>
                    <span className={styles.devHint} style={{ color: '#ffb454' }}>
                      ⚠️ 仅显示前 {CHECKBOX_LIMIT} 个节点（可用 {Math.min(remainingSlots, freeNodesForCluster.length)} 个），请使用"全选"按钮批量选择
                    </span>
                  </div>
                )}
                <div className={styles.devRow}>
                  <span className={styles.devHint}>
                    已选 {addNodeIds.size} 节点 · 集群剩余 {remainingSlots} 槽位
                  </span>
                  <button
                    className={styles.btn}
                    disabled={addNodeIds.size === 0}
                    onClick={() => {
                      for (const nid of addNodeIds) {
                        game.executeCommand(new AddNodeToClusterCommand(addNodeClusterId, nid));
                      }
                      setAddNodeIds(new Set());
                    }}
                  >
                    追加 {addNodeIds.size} 节点
                  </button>
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* 升级与维护 */}
      {serverNodes.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>升级与维护</span>
          </div>

          {/* 节点互联升级 */}
          <div className={styles.devRow}>
            <select
              className={styles.select}
              value={upgradeNodeId}
              onChange={(e) => setUpgradeNodeId(e.target.value)}
            >
              <option value="">选择节点...</option>
              {allNodesForUpgradeSelect.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.interconnect} {n.interconnectBandwidth}GB/s)
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={upgradeTargetTpl}
              onChange={(e) => setUpgradeTargetTpl(e.target.value)}
            >
              <option value="">选择目标互联...</option>
              {(() => {
                const node = serverNodes.find((n) => n.id === upgradeNodeId);
                if (!node) return null;
                return NODE_TEMPLATES
                  .filter((t) => t.interconnectBandwidth > node.interconnectBandwidth)
                  .map((t) => {
                    const cost = (t.interconnectBandwidth - node.interconnectBandwidth) * 50;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.interconnect}({t.interconnectBandwidth}GB/s) · ${cost.toLocaleString()}
                      </option>
                    );
                  });
              })()}
            </select>
            <button
              className={styles.btn}
              disabled={!upgradeNodeId || !upgradeTargetTpl}
              onClick={() => {
                game.executeCommand(new UpgradeNodeInterconnectCommand(upgradeNodeId, upgradeTargetTpl));
                setUpgradeNodeId('');
                setUpgradeTargetTpl('');
              }}
            >
              升级互联
            </button>
          </div>

          {/* 集群存储升级 */}
          {clusters.length > 0 && (
            <div className={styles.devRow}>
              <select
                className={styles.select}
                value={upgradeStorageClusterId}
                onChange={(e) => setUpgradeStorageClusterId(e.target.value)}
              >
                <option value="">选择集群...</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({STORAGE_CONFIGS.find((s) => s.id === c.storageType)?.name ?? c.storageType} {c.storageIO}GB/s)
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={upgradeStorageTarget}
                onChange={(e) => setUpgradeStorageTarget(e.target.value)}
              >
                <option value="">选择目标存储...</option>
                {(() => {
                  const cluster = clusters.find((c) => c.id === upgradeStorageClusterId);
                  if (!cluster) return null;
                  const currentIdx = STORAGE_CONFIGS.findIndex((s) => s.id === cluster.storageType);
                  return STORAGE_CONFIGS
                    .filter((_s, idx) => idx > currentIdx)
                    .map((s) => {
                      const cost = s.upgradeCostPerNode * cluster.nodes.length;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name}({s.io}GB/s) · ${cost.toLocaleString()}
                        </option>
                      );
                    });
                })()}
              </select>
              <button
                className={styles.btn}
                disabled={!upgradeStorageClusterId || !upgradeStorageTarget}
                onClick={() => {
                  game.executeCommand(new UpgradeClusterStorageCommand(upgradeStorageClusterId, upgradeStorageTarget as 'nvme_raid' | 'distributed_fs' | 'all_flash_cluster'));
                  setUpgradeStorageClusterId('');
                  setUpgradeStorageTarget('');
                }}
              >
                升级存储
              </button>
            </div>
          )}

          {/* 数据中心维护 */}
          {dataCenters.length > 0 && (
            <div className={styles.devRow}>
              <select
                className={styles.select}
                value={maintainDcId}
                onChange={(e) => setMaintainDcId(e.target.value)}
              >
                <option value="">选择数据中心...</option>
                {dataCenters.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (PUE {d.currentPue.toFixed(3)})
                  </option>
                ))}
              </select>
              <button
                className={styles.btn}
                disabled={!maintainDcId}
                onClick={() => {
                  game.executeCommand(new MaintainDataCenterCommand(maintainDcId));
                  setMaintainDcId('');
                }}
              >
                维护 · $5,000
              </button>
            </div>
          )}

          {/* 节点维护 */}
          {maintainableNodes.length > 0 && (
            <div className={styles.devRow}>
              <select
                className={styles.select}
                value={maintainNodeId}
                onChange={(e) => setMaintainNodeId(e.target.value)}
              >
                <option value="">选择节点...</option>
                {maintainableNodesSelect.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} (可靠性 {n.reliability}/{n.baseReliability} · ${(n.maintenanceCost * 5).toLocaleString()})
                  </option>
                ))}
              </select>
              <button
                className={styles.btn}
                disabled={!maintainNodeId}
                onClick={() => {
                  game.executeCommand(new MaintainNodeCommand(maintainNodeId));
                  setMaintainNodeId('');
                }}
              >
                维护节点
              </button>
              {maintainableNodes.length > SELECT_LIMIT && (
                <span className={styles.devHint} style={{ color: '#ffb454' }}>
                  ⚠️ 共 {maintainableNodes.length} 个待维护节点
                </span>
              )}
            </div>
          )}

          {/* 节点修复（节点故障后所有卡离线） */}
          {brokenNodes.length > 0 && (
            <div className={styles.devRow}>
              <select
                className={styles.select}
                value={repairNodeId}
                onChange={(e) => setRepairNodeId(e.target.value)}
              >
                <option value="">选择故障节点...</option>
                {brokenNodesSelect.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} · 修复 ${(n.maintenanceCost * 10).toLocaleString()}
                  </option>
                ))}
              </select>
              <button
                className={styles.btn}
                disabled={!repairNodeId}
                onClick={() => {
                  game.executeCommand(new RepairNodeCommand(repairNodeId));
                  setRepairNodeId('');
                }}
              >
                修复节点
              </button>
              {brokenNodes.length > SELECT_LIMIT && (
                <span className={styles.devHint} style={{ color: '#ffb454' }}>
                  ⚠️ 共 {brokenNodes.length} 个故障节点
                </span>
              )}
            </div>
          )}

          {/* 卡修复/报废 */}
          {faultedCards.length > 0 && (
            <div className={styles.devRow}>
              <select
                className={styles.select}
                value={repairCardUid}
                onChange={(e) => setRepairCardUid(e.target.value)}
              >
                <option value="">选择故障卡...</option>
                {faultedCardsSelect.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.specName} ({c.status}) · {c.uid.slice(-6)} · {c.status === 'offline' ? `修复 $${c.repairCost}` : '报废回收'}
                  </option>
                ))}
              </select>
              <button
                className={styles.btn}
                disabled={!repairCardUid}
                onClick={() => {
                  const card = faultedCards.find((c) => c.uid === repairCardUid);
                  if (card?.status === 'offline') {
                    game.executeCommand(new RepairCardCommand(repairCardUid));
                  } else {
                    game.executeCommand(new ScrapCardCommand(repairCardUid));
                  }
                  setRepairCardUid('');
                }}
              >
                {faultedCards.find((c) => c.uid === repairCardUid)?.status === 'broken' ? '报废' : '修复'}
              </button>
              {faultedCards.length > SELECT_LIMIT && (
                <span className={styles.devHint} style={{ color: '#ffb454' }}>
                  ⚠️ 共 {faultedCards.length} 张故障卡
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* 建数据中心 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>数据中心</span>
      </div>
      <div className={styles.devRow}>
        <select
          className={styles.select}
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
        >
          {DATA_CENTER_LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} · ${l.powerCostPerKWh}/kWh
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={selectedCoolingId}
          onChange={(e) => setSelectedCoolingId(e.target.value as 'air' | 'liquid' | 'immersion')}
        >
          {COOLING_TYPES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · PUE {c.basePUE} · +${c.extraBuildCostPerMW.toLocaleString()}/MW
            </option>
          ))}
        </select>
        <input
          className={styles.input}
          type="number"
          min={0.5}
          step={0.5}
          value={dcPower}
          onChange={(e) => setDcPower(Number(e.target.value))}
          style={{ width: '60px' }}
        />
        <span className={styles.devHint}>MW</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devHint}>
          实际 PUE {actualPue.toFixed(3)} · 建造费用 ${dcBuildCost.toLocaleString()} · 日维护 ${selectedLocation.maintenanceCostPerDay}
        </span>
        <button
          className={styles.btn}
          disabled={funds < dcBuildCost || dcPower <= 0}
          onClick={() => {
            game.executeCommand(
              new BuildDataCenterCommand(selectedLocationId, dcPower, selectedCoolingId),
            );
          }}
        >
          建造数据中心
        </button>
      </div>

      {/* 迁移集群到数据中心 */}
      {clusters.length > 0 && dataCenters.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>迁移集群</span>
          </div>
          <div className={styles.devRow}>
            <select
              className={styles.select}
              value={selectedClusterId}
              onChange={(e) => setSelectedClusterId(e.target.value)}
            >
              <option value="">选择集群...</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.dataCenterId ? '(已入DC)' : ''}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedDcId}
              onChange={(e) => setSelectedDcId(e.target.value)}
            >
              <option value="">选择数据中心...</option>
              {dataCenters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.maxPowerMW}MW · PUE {d.pue.toFixed(2)})
                </option>
              ))}
            </select>
            <button
              className={styles.btn}
              disabled={!selectedClusterId || !selectedDcId}
              onClick={() => {
                game.executeCommand(new MoveClusterCommand(selectedClusterId, selectedDcId));
                setSelectedClusterId('');
                setSelectedDcId('');
              }}
            >
              迁入
            </button>
          </div>
        </>
      )}
    </div>
  );
}


