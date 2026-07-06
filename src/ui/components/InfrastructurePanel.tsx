import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import type { CardInstance } from '../../core/GameState';
import {
  BuyServerNodeCommand,
  InstallCardCommand,
  CreateClusterCommand,
  BuildDataCenterCommand,
  MoveClusterCommand,
} from '../../core/commands/InfraCommands';
import {
  NODE_TEMPLATES,
  CLUSTER_NETWORKS,
  DATA_CENTER_LOCATIONS,
  COOLING_TYPES,
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

      {tab === 'topology' && <TopologyTab />}
      {tab === 'build' && <BuildTab game={game} />}
    </section>
  );
}

/* ============== 拓扑视图 ============== */

function TopologyTab() {
  const dataCenters = useGameState((s) => s.dataCenters);
  const clusters = useGameState((s) => s.clusters);
  const serverNodes = useGameState((s) => s.serverNodes);
  const resourceMeta = useGameState((s) => s.resourceMeta);

  // 未加入集群的节点
  const freeNodes = serverNodes.filter((n) => n.clusterId === null);
  // 未加入数据中心的集群
  const freeClusters = clusters.filter((c) => c.dataCenterId === null);

  // 获取卡实例
  const getCard = (uid: string): CardInstance | undefined => {
    for (const key of Object.keys(resourceMeta)) {
      const pool = resourceMeta[key] as CardInstance[] | undefined;
      const card = pool?.find((c) => c.uid === uid);
      if (card) return card;
    }
    return undefined;
  };

  // 计算节点聚合显存/带宽
  const getNodeMemory = (nodeId: string): { memoryGB: number; bandwidthGBs: number } => {
    const node = serverNodes.find((n) => n.id === nodeId);
    if (!node) return { memoryGB: 0, bandwidthGBs: 0 };
    let memoryGB = 0;
    let bandwidthGBs = 0;
    for (const cardUid of node.installedCards) {
      const card = getCard(cardUid);
      const spec = card ? getCardSpec(card.modelId) : undefined;
      if (spec) {
        memoryGB += spec.memoryGB;
        bandwidthGBs += spec.memoryBandwidth;
      }
    }
    return { memoryGB, bandwidthGBs };
  };

  if (dataCenters.length === 0 && clusters.length === 0 && serverNodes.length === 0) {
    return <div className={styles.emptyHint}>尚无基础设施，请前往"建造"标签建设</div>;
  }

  return (
    <div className={styles.tabBody}>
      {/* 数据中心 → 集群 → 节点 → 卡 */}
      {dataCenters.map((dc) => (
        <div key={dc.id} className={styles.treeNode}>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>🏢 {dc.name}</span>
            <span className={styles.devHint}>
              {dc.maxPowerMW} MW · PUE {dc.pue} · {dc.coolingType} · {dc.clusters.length} 集群
            </span>
          </div>
          {dc.clusters.map((clusterId) => {
            const cluster = clusters.find((c) => c.id === clusterId);
            if (!cluster) return null;
            return (
              <div key={clusterId} className={styles.treeChild}>
                <div className={styles.devRow}>
                  <span className={styles.devRowLabel}>🔗 {cluster.name}</span>
                  <span className={styles.devHint}>
                    {cluster.network} · {cluster.nodes.length}/{cluster.maxNodes} 节点 · +{(cluster.utilizationBonus * 100).toFixed(0)}%
                  </span>
                </div>
                {cluster.nodes.map((nodeId) => {
                  const node = serverNodes.find((n) => n.id === nodeId);
                  if (!node) return null;
                  const { memoryGB, bandwidthGBs } = getNodeMemory(nodeId);
                  return (
                    <div key={nodeId} className={styles.treeChild}>
                      <div className={styles.devRow}>
                        <span className={styles.devRowLabel}>🖥️ {node.name}</span>
                        <span className={styles.devHint}>
                          {node.installedCards.length}/{node.slotCount} 卡 · {memoryGB}GB · {bandwidthGBs}GB/s · {node.interconnect}
                        </span>
                      </div>
                      {node.installedCards.map((cardUid) => {
                        const card = getCard(cardUid);
                        const spec = card ? getCardSpec(card.modelId) : undefined;
                        return (
                          <div key={cardUid} className={styles.treeChild}>
                            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                              · {spec?.name ?? card?.modelId} ({card?.status})
                              {spec && ` · ${spec.memoryGB}GB · ${spec.memoryBandwidth}GB/s`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}

      {/* 游离集群 */}
      {freeClusters.map((cluster) => (
        <div key={cluster.id} className={styles.treeNode}>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>🔗 {cluster.name}（未入数据中心）</span>
            <span className={styles.devHint}>
              {cluster.network} · {cluster.nodes.length}/{cluster.maxNodes} 节点
            </span>
          </div>
          {cluster.nodes.map((nodeId) => {
            const node = serverNodes.find((n) => n.id === nodeId);
            if (!node) return null;
            const { memoryGB, bandwidthGBs } = getNodeMemory(nodeId);
            return (
              <div key={nodeId} className={styles.treeChild}>
                <div className={styles.devRow}>
                  <span className={styles.devRowLabel}>🖥️ {node.name}</span>
                  <span className={styles.devHint}>
                    {node.installedCards.length}/{node.slotCount} 卡 · {memoryGB}GB · {bandwidthGBs}GB/s · {node.interconnect}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* 游离节点 */}
      {freeNodes.length > 0 && (
        <div className={styles.treeNode}>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>独立节点（未加入集群）</span>
          </div>
          {freeNodes.map((node) => {
            const { memoryGB, bandwidthGBs } = getNodeMemory(node.id);
            return (
              <div key={node.id} className={styles.treeChild}>
                <div className={styles.devRow}>
                  <span className={styles.devRowLabel}>🖥️ {node.name}</span>
                  <span className={styles.devHint}>
                    {node.installedCards.length}/{node.slotCount} 卡 · {memoryGB}GB · {bandwidthGBs}GB/s · {node.interconnect}
                  </span>
                </div>
                {node.installedCards.length < node.slotCount && (
                  <div className={styles.devHint} style={{ paddingLeft: '20px' }}>
                    可安装 {node.slotCount - node.installedCards.length} 张卡
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============== 建造视图 ============== */

function BuildTab({ game }: { game: ReturnType<typeof useGame> }) {
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const serverNodes = useGameState((s) => s.serverNodes);
  const resourceMeta = useGameState((s) => s.resourceMeta);
  const clusters = useGameState((s) => s.clusters);
  const dataCenters = useGameState((s) => s.dataCenters);

  // 选中的节点（用于安装卡/创建集群）
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [selectedCardUid, setSelectedCardUid] = useState<string>('');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(CLUSTER_NETWORKS[0].id);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(DATA_CENTER_LOCATIONS[0].id);
  const [selectedCoolingId, setSelectedCoolingId] = useState<'air' | 'liquid' | 'immersion'>('air');
  const [dcPower, setDcPower] = useState<number>(1);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [selectedDcId, setSelectedDcId] = useState<string>('');
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // 未加入集群的节点
  const freeNodesForCluster = serverNodes.filter((n) => n.clusterId === null);
  const selectedNetwork = CLUSTER_NETWORKS.find((n) => n.id === selectedNetworkId) ?? CLUSTER_NETWORKS[0];
  const clusterBuildCost = selectedNetwork.costPerNode * selectedNodeIds.size;

  const selectedLocation = DATA_CENTER_LOCATIONS.find((l) => l.id === selectedLocationId) ?? DATA_CENTER_LOCATIONS[0];
  const selectedCooling = COOLING_TYPES.find((c) => c.id === selectedCoolingId) ?? COOLING_TYPES[0];
  const dcBuildCost = selectedLocation.buildCostPerMW * dcPower + selectedCooling.extraBuildCostPerMW * dcPower;

  const toggleNodeId = (id: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 获取未安装的卡
  const getUninstalledCards = (): Array<{ uid: string; modelId: string }> => {
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
  };

  const uninstalledCards = getUninstalledCards();

  return (
    <div className={styles.tabBody}>
      {/* 买服务器节点 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>服务器节点</span>
      </div>
      {NODE_TEMPLATES.map((tpl) => (
        <div key={tpl.id} className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
            · {tpl.name}
          </span>
          <span className={styles.devHint}>
            {tpl.slotCount} 卡槽 · {tpl.powerSupplyKW} kW · ${tpl.cost.toLocaleString()}
          </span>
          <button
            className={styles.btn}
            disabled={funds < tpl.cost}
            onClick={() => game.executeCommand(new BuyServerNodeCommand(tpl.id))}
          >
            购买
          </button>
        </div>
      ))}

      {/* 安装卡到节点（批量） */}
      {serverNodes.length > 0 && uninstalledCards.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>批量安装显卡</span>
          </div>

          {/* 单卡安装（保留原能力） */}
          <div className={styles.devRow}>
            <select
              className={styles.select}
              value={selectedCardUid}
              onChange={(e) => setSelectedCardUid(e.target.value)}
            >
              <option value="">选择单张显卡...</option>
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

          {/* 批量安装：按型号填数量，自动分配到指定节点 */}
          <BatchInstallCards game={game} />
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
                  {n.name} (+{(n.utilizationBonus * 100).toFixed(0)}% · ${n.costPerNode.toLocaleString()}/节点 · 上限 {n.maxNodes} 节点)
                </option>
              ))}
            </select>
          </div>
          {freeNodesForCluster.length === 0 ? (
            <div className={styles.devHint}>没有可用的独立节点</div>
          ) : (
            freeNodesForCluster.map((n) => {
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
                    {n.name} ({n.installedCards.length}/{n.slotCount} 卡 · {n.interconnect})
                  </span>
                </label>
              );
            })
          )}
          <div className={styles.devRow}>
            <span className={styles.devHint}>
              已选 {selectedNodeIds.size} 节点 · 费用 ${clusterBuildCost.toLocaleString()}
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
              {l.name} · ${l.powerCostPerKWh}/kWh · ${l.buildCostPerMW.toLocaleString()}/MW
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
          建造费用 ${dcBuildCost.toLocaleString()}
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
                  {d.name}
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

/* ============== 批量安装显卡 ============== */

function BatchInstallCards({ game }: { game: ReturnType<typeof useGame> }) {
  const serverNodes = useGameState((s) => s.serverNodes);
  const resourceMeta = useGameState((s) => s.resourceMeta);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [installQty, setInstallQty] = useState(1);
  const [targetNodeId, setTargetNodeId] = useState('');

  // 未安装的卡按型号分组
  const uninstalledByModel: Record<string, CardInstance[]> = {};
  for (const modelId of Object.keys(resourceMeta)) {
    const pool = resourceMeta[modelId] as CardInstance[] | undefined;
    if (!pool) continue;
    for (const card of pool) {
      if (card.location === null && card.status === 'online') {
        if (!uninstalledByModel[modelId]) uninstalledByModel[modelId] = [];
        uninstalledByModel[modelId].push(card);
      }
    }
  }

  const targetNode = serverNodes.find((n) => n.id === targetNodeId);
  const availableSlots = targetNode ? targetNode.slotCount - targetNode.installedCards.length : 0;
  const availableCards = uninstalledByModel[selectedModelId]?.length ?? 0;
  const actualQty = Math.min(installQty, availableCards, availableSlots > 0 ? availableSlots : 0);

  const handleBatchInstall = () => {
    if (!targetNode) return;
    const cards = uninstalledByModel[selectedModelId] ?? [];
    for (let i = 0; i < actualQty; i++) {
      game.executeCommand(new InstallCardCommand(cards[i].uid, targetNodeId));
    }
    setInstallQty(1);
  };

  return (
    <div className={styles.devRow} style={{ flexWrap: 'wrap', gap: '8px' }}>
      <select
        className={styles.select}
        value={selectedModelId}
        onChange={(e) => setSelectedModelId(e.target.value)}
      >
        <option value="">选择型号...</option>
        {Object.keys(uninstalledByModel).map((modelId) => (
          <option key={modelId} value={modelId}>
            {getCardSpec(modelId)?.name ?? modelId}（闲置 {uninstalledByModel[modelId].length} 张）
          </option>
        ))}
      </select>

      <input
        className={styles.input}
        type="number"
        min={1}
        step={1}
        value={installQty}
        onChange={(e) => setInstallQty(Math.max(1, Number(e.target.value)))}
        style={{ width: '60px' }}
      />
      <span className={styles.devHint}>张</span>

      <select
        className={styles.select}
        value={targetNodeId}
        onChange={(e) => setTargetNodeId(e.target.value)}
      >
        <option value="">选择目标节点...</option>
        {serverNodes
          .filter((n) => n.installedCards.length < n.slotCount)
          .map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}（空 {n.slotCount - n.installedCards.length}/{n.slotCount}）
            </option>
          ))}
      </select>

      <button
        className={styles.btn}
        disabled={actualQty <= 0}
        onClick={handleBatchInstall}
      >
        批量安装
        {actualQty > 0 && actualQty !== installQty && (
          <span className={styles.devHint}>（实际可装 {actualQty} 张）</span>
        )}
      </button>
    </div>
  );
}


