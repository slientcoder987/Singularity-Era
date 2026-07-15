import type { Command } from '../interfaces/Command';
import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { ServerNode, Cluster, DataCenter } from '../entities/Infrastructure';
import {
  getNodeTemplate,
  getClusterNetwork,
  getDataCenterLocation,
  getCoolingType,
  getStorageConfig,
  STORAGE_CONFIGS,
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
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) n.installedCards.push(this.cardUid);

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
      const n = draft.serverNodes.find((x) => x.id === nodeId);
      if (n) {
        n.installedCards = n.installedCards.filter((uid) => uid !== this.cardUid);
      }
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

    let modelId: string | null = null;
    let card: CardInstance | undefined;
    for (const key of Object.keys(current.resourceMeta)) {
      const pool = current.resourceMeta[key] as CardInstance[] | undefined;
      card = pool?.find((c) => c.uid === this.cardUid);
      if (card) { modelId = key; break; }
    }

    if (!card || !modelId) {
      events.emit('CARD_REPAIR_REJECTED', { reason: '卡不存在' });
      return;
    }

    if (card.status === 'online') {
      events.emit('CARD_REPAIR_REJECTED', { reason: '卡已在线，无需修复' });
      return;
    }

    if (card.status === 'broken') {
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
      draft.resources['funds'] -= cost;
      const pool = draft.resourceMeta[modelId!] as CardInstance[];
      const c = pool.find((x) => x.uid === this.cardUid);
      if (c) c.status = 'online';
      draft.infraEventLog.push({
        date: draft.date,
        type: 'CARD_REPAIRED',
        message: `计算卡 ${card!.uid.slice(-6)} 已修复`,
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

    let modelId: string | null = null;
    let card: CardInstance | undefined;
    for (const key of Object.keys(current.resourceMeta)) {
      const pool = current.resourceMeta[key] as CardInstance[] | undefined;
      card = pool?.find((c) => c.uid === this.cardUid);
      if (card) { modelId = key; break; }
    }

    if (!card || !modelId) {
      events.emit('CARD_SCRAP_REJECTED', { reason: '卡不存在' });
      return;
    }

    const spec = getCardSpec(modelId);
    if (!spec) return;

    const salvage = Math.ceil(spec.unitCost * 0.05);

    state.update((draft) => {
      // 从节点移除
      if (card!.location) {
        const node = draft.serverNodes.find((n) => n.id === card!.location);
        if (node) {
          node.installedCards = node.installedCards.filter((uid) => uid !== this.cardUid);
        }
      }
      // 从 resourceMeta pool 中删除
      const pool = draft.resourceMeta[modelId!] as CardInstance[];
      draft.resourceMeta[modelId!] = pool.filter((c) => c.uid !== this.cardUid);
      draft.resources[modelId!] = (draft.resources[modelId!] ?? 0) - 1;
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + salvage;
      draft.infraEventLog.push({
        date: draft.date,
        type: 'CARD_SCRAPPED',
        message: `计算卡 ${card!.uid.slice(-6)} 已报废，回收 $${salvage}`,
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
      draft.resources['funds'] -= cost;
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) {
        // 恢复该节点所有 offline 卡为 online
        for (const cardUid of n.installedCards) {
          for (const modelId of Object.keys(draft.resourceMeta)) {
            const pool = draft.resourceMeta[modelId] as CardInstance[];
            const card = pool?.find((c) => c.uid === cardUid);
            if (card && card.status === 'offline') {
              card.status = 'online';
            }
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
