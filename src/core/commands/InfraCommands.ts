import type { Command } from '../interfaces/Command';
import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { ServerNode, Cluster, DataCenter } from '../entities/Infrastructure';
import {
  getNodeTemplate,
  getClusterNetwork,
  getDataCenterLocation,
  getCoolingType,
} from '../config/infrastructure';
import { getCardSpec } from '../config/computeCards';

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
    };

    state.update((draft) => {
      draft.resources['funds'] -= template.cost;
      draft.serverNodes.push(node);
    });

    events.emit('NODE_BUILT', node.id, node.name);
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

    // 查找卡实例
    let cardFound: { modelId: string; card: CardInstance } | null = null;
    for (const defKey of Object.keys(current.resourceMeta)) {
      const pool = current.resourceMeta[defKey] as CardInstance[] | undefined;
      if (!pool) continue;
      const card = pool.find((c) => c.uid === this.cardUid);
      if (card) {
        cardFound = { modelId: defKey, card };
        break;
      }
    }

    if (!cardFound) {
      events.emit('CARD_INSTALL_REJECTED', { reason: '卡实例不存在' });
      return;
    }

    if (cardFound.card.location !== null) {
      events.emit('CARD_INSTALL_REJECTED', { reason: '卡已安装在其它节点' });
      return;
    }

    // 检查功耗
    const spec = getCardSpec(cardFound.modelId);
    if (spec) {
      const installedPower = node.installedCards.reduce((sum, uid) => {
        // 查找已安装卡的功耗
        for (const defId of Object.keys(current.resourceMeta)) {
          const pool = current.resourceMeta[defId] as CardInstance[] | undefined;
          const c = pool?.find((x) => x.uid === uid);
          if (c) {
            const s = getCardSpec(defId);
            return sum + (s?.maxPowerDrawKW ?? 0);
          }
        }
        return sum;
      }, 0);
      if (installedPower + spec.maxPowerDrawKW > node.powerSupplyKW) {
        events.emit('CARD_INSTALL_REJECTED', { reason: '节点供电不足' });
        return;
      }
    }

    state.update((draft) => {
      // 更新节点
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) n.installedCards.push(this.cardUid);

      // 更新卡实例 location
      const pool = draft.resourceMeta[cardFound!.modelId] as CardInstance[];
      const card = pool.find((c) => c.uid === this.cardUid);
      if (card) card.location = this.nodeId;
    });

    events.emit('CARD_INSTALLED', this.cardUid, this.nodeId);
  }
}

/* ========================================================================
 * UninstallCardCommand
 * ====================================================================== */
export class UninstallCardCommand implements Command {
  constructor(private readonly cardUid: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 查找卡实例及其所在节点
    let modelId = '';
    let nodeId: string | null = null;
    for (const def of Object.keys(current.resourceMeta)) {
      const pool = current.resourceMeta[def] as CardInstance[] | undefined;
      if (!pool) continue;
      const card = pool.find((c) => c.uid === this.cardUid);
      if (card) {
        modelId = def;
        nodeId = card.location;
        break;
      }
    }

    if (!modelId || nodeId === null) {
      events.emit('CARD_UNINSTALL_REJECTED', { reason: '卡未安装在任何节点' });
      return;
    }

    state.update((draft) => {
      // 从节点移除
      const n = draft.serverNodes.find((x) => x.id === nodeId);
      if (n) {
        n.installedCards = n.installedCards.filter((uid) => uid !== this.cardUid);
      }
      // 清空卡 location
      const pool = draft.resourceMeta[modelId] as CardInstance[];
      const card = pool.find((c) => c.uid === this.cardUid);
      if (card) card.location = null;
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

    // 验证节点存在且未加入其它集群
    for (const nid of this.nodeIds) {
      const node = current.serverNodes.find((n) => n.id === nid);
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
      dataCenterId: null,
      createdAt: current.date,
    };

    state.update((draft) => {
      draft.resources['funds'] -= buildCost;
      draft.clusters.push(cluster);
      for (const nid of this.nodeIds) {
        const n = draft.serverNodes.find((x) => x.id === nid);
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
      events.emit('DC_REJECTED', { reason: '未知地点' });
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

    const dc: DataCenter = {
      id: genId('dc'),
      name: `${loc.name} 数据中心 #${current.dataCenters.length + 1}`,
      location: loc.name,
      maxPowerMW: this.maxPowerMW,
      usedPowerMW: 0,
      coolingType: this.coolingTypeId,
      pue: cooling.basePUE,
      clusters: [],
      buildCost,
      maintenanceCostPerDay: loc.maintenanceCostPerDay,
      powerCostPerKWh: loc.powerCostPerKWh,
      builtAt: current.date,
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

    // 计算集群功耗
    let clusterPowerMW = 0;
    for (const nid of cluster.nodes) {
      const node = current.serverNodes.find((n) => n.id === nid);
      if (!node) continue;
      for (const cardUid of node.installedCards) {
        for (const defId of Object.keys(current.resourceMeta)) {
          const pool = current.resourceMeta[defId] as CardInstance[] | undefined;
          const card = pool?.find((c) => c.uid === cardUid);
          if (card) {
            const spec = getCardSpec(defId);
            clusterPowerMW += (spec?.maxPowerDrawKW ?? 0) / 1000;
            break;
          }
        }
      }
    }

    // 若从旧 DC 迁出，先释放电力
    const oldDcId = cluster.dataCenterId;
    const oldDcPower = clusterPowerMW;

    state.update((draft) => {
      // 从旧 DC 移除
      if (oldDcId) {
        const oldDc = draft.dataCenters.find((d) => d.id === oldDcId);
        if (oldDc) {
          oldDc.usedPowerMW = Math.max(0, oldDc.usedPowerMW - oldDcPower);
          oldDc.clusters = oldDc.clusters.filter((id) => id !== this.clusterId);
        }
      }
      // 加入新 DC
      const newDc = draft.dataCenters.find((d) => d.id === this.dataCenterId);
      if (newDc) {
        newDc.clusters.push(this.clusterId);
        newDc.usedPowerMW += clusterPowerMW;
      }
      // 更新集群
      const c = draft.clusters.find((x) => x.id === this.clusterId);
      if (c) c.dataCenterId = this.dataCenterId;
    });

    events.emit('CLUSTER_MOVED', this.clusterId, this.dataCenterId);
  }
}
