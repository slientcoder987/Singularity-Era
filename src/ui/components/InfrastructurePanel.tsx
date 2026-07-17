import { useState, useMemo } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import type { CardInstance } from '../../core/GameState';
import {
  BuyServerNodeCommand,
  InstallCardCommand,
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
}

interface TopologyRowProps {
  rows: TopologyRow[];
}

function TopologyRowComponent({ index, style, rows }: RowComponentProps<TopologyRowProps>) {
  const row = rows[index];
  const paddingLeft = row.depth * 12 + 4;
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
      }}
    >
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

function TopologyTab() {
  const dataCenters = useGameState((s) => s.dataCenters);
  const clusters = useGameState((s) => s.clusters);
  const serverNodes = useGameState((s) => s.serverNodes);
  const resourceMeta = useGameState((s) => s.resourceMeta);
  const infraEventLog = useGameState((s) => s.infraEventLog);

  const cardMap = useMemo(() => {
    const map = new Map<string, { card: CardInstance; modelId: string }>();
    for (const key of Object.keys(resourceMeta)) {
      const pool = resourceMeta[key] as CardInstance[] | undefined;
      if (!pool) continue;
      for (const card of pool) {
        map.set(card.uid, { card, modelId: key });
      }
    }
    return map;
  }, [resourceMeta]);

  const nodeMemoryMap = useMemo(() => {
    const map = new Map<string, { memoryGB: number; bandwidthGBs: number }>();
    for (const node of serverNodes) {
      let memoryGB = 0;
      let bandwidthGBs = 0;
      for (const cardUid of node.installedCards) {
        const entry = cardMap.get(cardUid);
        const spec = entry ? getCardSpec(entry.modelId) : undefined;
        if (spec) {
          memoryGB += spec.memoryGB;
          bandwidthGBs += spec.memoryBandwidth;
        }
      }
      map.set(node.id, { memoryGB, bandwidthGBs });
    }
    return map;
  }, [serverNodes, cardMap]);

  const flattenedRows = useMemo<TopologyRow[]>(() => {
    const rows: TopologyRow[] = [];
    const freeNodes = serverNodes.filter((n) => n.clusterId === null);
    const freeClusters = clusters.filter((c) => c.dataCenterId === null);

    // 数据中心 → 集群 → 节点 → 卡
    for (const dc of dataCenters) {
      rows.push({
        kind: 'dc', depth: 0, icon: '🏢', label: dc.name,
        hint: `${dc.maxPowerMW}MW · PUE ${dc.currentPue.toFixed(3)}(基准${dc.basePue.toFixed(2)}) · ${dc.coolingType} · ${dc.clusters.length}集群 · $${dc.powerCostPerKWh}/kWh${dc.currentPue > dc.basePue * 1.02 ? ' · ⚠️ 需维护' : ''}`,
      });
      for (const clusterId of dc.clusters) {
        const cluster = clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        rows.push({
          kind: 'cluster', depth: 1, icon: '🔗', label: cluster.name,
          hint: `${cluster.network} · ${cluster.nodes.length}/${cluster.maxNodes}节点 · +${(cluster.utilizationBonus * 100).toFixed(0)}% · ${cluster.networkBandwidth}GB/s · TP×${cluster.maxTPDegree}`,
        });
        for (const nodeId of cluster.nodes) {
          const node = serverNodes.find((n) => n.id === nodeId);
          if (!node) continue;
          const mem = nodeMemoryMap.get(nodeId) ?? { memoryGB: 0, bandwidthGBs: 0 };
          const nvGen = node.nvswitchGeneration ? ` · NVSwitch Gen${node.nvswitchGeneration}` : '';
          rows.push({
            kind: 'node', depth: 2, icon: '🖥️', label: node.name,
            hint: `${node.installedCards.length}/${node.slotCount}卡 · ${mem.memoryGB}GB · ${mem.bandwidthGBs}GB/s · ${node.interconnect}(${node.interconnectBandwidth}GB/s) · 可靠性${node.reliability}${nvGen}`,
          });
          for (const cardUid of node.installedCards) {
            const entry = cardMap.get(cardUid);
            const card = entry?.card;
            const spec = entry ? getCardSpec(entry.modelId) : undefined;
            rows.push({
              kind: 'card', depth: 3, icon: '·',
              label: `${spec?.name ?? card?.modelId ?? '未知'} (${card?.status ?? '未知'})`,
              hint: spec ? `${spec.memoryGB}GB · ${spec.memoryBandwidth}GB/s` : '',
            });
          }
        }
      }
    }

    // 未入数据中心的集群
    for (const cluster of freeClusters) {
      rows.push({
        kind: 'freeCluster', depth: 0, icon: '🔗', label: `${cluster.name}（未入数据中心）`,
        hint: `${cluster.network} · ${cluster.nodes.length}/${cluster.maxNodes}节点 · ${cluster.networkBandwidth}GB/s · TP×${cluster.maxTPDegree}`,
      });
      for (const nodeId of cluster.nodes) {
        const node = serverNodes.find((n) => n.id === nodeId);
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
        kind: 'freeNodesHeader', depth: 0, icon: '', label: '独立节点（未加入集群）', hint: '',
      });
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

    return rows;
  }, [dataCenters, clusters, serverNodes, cardMap, nodeMemoryMap]);

  if (dataCenters.length === 0 && clusters.length === 0 && serverNodes.length === 0) {
    return <div className={styles.emptyHint}>尚无基础设施，请前往"建造"标签建设</div>;
  }

  const listHeight = Math.min(flattenedRows.length * 28, 600);

  return (
    <div className={styles.tabBody}>
      <List<TopologyRowProps>
        rowComponent={TopologyRowComponent}
        rowCount={flattenedRows.length}
        rowHeight={28}
        rowProps={{ rows: flattenedRows }}
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
                第{evt.date}天 · {evt.message}
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
  const serverNodes = useGameState((s) => s.serverNodes);
  const resourceMeta = useGameState((s) => s.resourceMeta);
  const clusters = useGameState((s) => s.clusters);
  const dataCenters = useGameState((s) => s.dataCenters);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [selectedCardUid, setSelectedCardUid] = useState<string>('');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(CLUSTER_NETWORKS[0].id);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(DATA_CENTER_LOCATIONS[0].id);
  const [selectedCoolingId, setSelectedCoolingId] = useState<'air' | 'liquid' | 'immersion'>('air');
  const [dcPower, setDcPower] = useState<number>(1);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedDcId, setSelectedDcId] = useState<string>('');
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // 批量买节点
  const [nodeBuyQty, setNodeBuyQty] = useState<Record<string, number>>({});

  // 自动安装
  const [autoInstallNodeIds, setAutoInstallNodeIds] = useState<Set<string>>(new Set());
  const [autoInstallCardModel, setAutoInstallCardModel] = useState<string>('');

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

  const freeNodesForCluster = serverNodes.filter((n) => n.clusterId === null);
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

  const uninstalledCards = useMemo(() => {
    const cards: Array<{ uid: string; modelId: string }> = [];
    for (const key of Object.keys(resourceMeta)) {
      const pool = resourceMeta[key] as CardInstance[] | undefined;
      if (!pool) continue;
      for (const card of pool) {
        if (card.location === null && card.status === 'online') {
          cards.push({ uid: card.uid, modelId: key });
        }
      }
    }
    return cards;
  }, [resourceMeta]);

  const offlineCardUids = useMemo(() => {
    const set = new Set<string>();
    for (const key of Object.keys(resourceMeta)) {
      const pool = resourceMeta[key] as CardInstance[] | undefined;
      if (!pool) continue;
      for (const card of pool) {
        if (card.status === 'offline') set.add(card.uid);
      }
    }
    return set;
  }, [resourceMeta]);

  const brokenNodes = useMemo(
    () => serverNodes.filter((n) => n.installedCards.some((uid) => offlineCardUids.has(uid))),
    [serverNodes, offlineCardUids],
  );

  const faultedCards = useMemo(() => {
    const cards: Array<{ uid: string; modelId: string; status: string; specName: string; repairCost: number }> = [];
    for (const key of Object.keys(resourceMeta)) {
      const pool = resourceMeta[key] as CardInstance[] | undefined;
      if (!pool) continue;
      for (const card of pool) {
        if (card.status === 'offline' || card.status === 'broken') {
          const spec = getCardSpec(key);
          cards.push({
            uid: card.uid,
            modelId: key,
            status: card.status,
            specName: spec?.name ?? key,
            repairCost: spec ? Math.ceil(spec.unitCost * 0.20) : 0,
          });
        }
      }
    }
    return cards;
  }, [resourceMeta]);

  return (
    <div className={styles.tabBody}>
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
                for (let i = 0; i < qty; i++) {
                  game.executeCommand(new BuyServerNodeCommand(tpl.id));
                }
              }}
            >
              买 {qty} 台 · ${totalCost.toLocaleString()}
            </button>
          </div>
        );
      })}

      {/* 安装卡到节点 */}
      {serverNodes.length > 0 && uninstalledCards.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>安装显卡</span>
          </div>
          <div className={styles.devRow}>
            <select
              className={styles.select}
              value={selectedCardUid}
              onChange={(e) => setSelectedCardUid(e.target.value)}
            >
              <option value="">选择显卡...</option>
              {uninstalledCards.map((c) => {
                const spec = getCardSpec(c.modelId);
                return (
                  <option key={c.uid} value={c.uid}>
                    {spec?.name ?? c.modelId} ({c.uid.slice(-6)})
                  </option>
                );
              })}
            </select>
            <select
              className={styles.select}
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
            >
              <option value="">选择节点...</option>
              {serverNodes
                .filter((n) => n.installedCards.length < n.slotCount)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.installedCards.length}/{n.slotCount})
                  </option>
                ))}
            </select>
            <button
              className={styles.btn}
              disabled={!selectedCardUid || !selectedNodeId}
              onClick={() => {
                game.executeCommand(new InstallCardCommand(selectedCardUid, selectedNodeId));
                setSelectedCardUid('');
              }}
            >
              安装
            </button>
          </div>
        </>
      )}

      {/* 自动安装显卡到节点 */}
      {serverNodes.length > 0 && uninstalledCards.length > 0 && (
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
              {Array.from(new Set(uninstalledCards.map((c) => c.modelId))).map((modelId) => {
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
          {serverNodes
            .filter((n) => n.installedCards.length < n.slotCount)
            .map((n) => {
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
          <div className={styles.devRow}>
            <button
              className={styles.btn}
              disabled={autoInstallNodeIds.size === 0}
              onClick={() => {
                const candidates = uninstalledCards.filter(
                  (c) => !autoInstallCardModel || c.modelId === autoInstallCardModel,
                );
                let cardIdx = 0;
                for (const nodeId of autoInstallNodeIds) {
                  const node = serverNodes.find((n) => n.id === nodeId);
                  if (!node) continue;
                  const availableSlots = node.slotCount - node.installedCards.length;
                  const toInstall = candidates.slice(cardIdx, cardIdx + availableSlots);
                  for (const card of toInstall) {
                    game.executeCommand(new InstallCardCommand(card.uid, nodeId));
                  }
                  cardIdx += availableSlots;
                  if (cardIdx >= candidates.length) break;
                }
                setAutoInstallNodeIds(new Set());
                setAutoInstallCardModel('');
              }}
            >
              批量安装 ({uninstalledCards.filter((c) => !autoInstallCardModel || c.modelId === autoInstallCardModel).length} 张可用)
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
              {freeNodesForCluster.map((n) => {
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
                {freeNodesForCluster.slice(0, remainingSlots).map((n) => {
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
              {serverNodes.map((n) => (
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
          {serverNodes.some((n) => n.reliability < n.baseReliability) && (
            <div className={styles.devRow}>
              <select
                className={styles.select}
                value={maintainNodeId}
                onChange={(e) => setMaintainNodeId(e.target.value)}
              >
                <option value="">选择节点...</option>
                {serverNodes.filter((n) => n.reliability < n.baseReliability).map((n) => (
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
                {brokenNodes.map((n) => (
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
                {faultedCards.map((c) => (
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


