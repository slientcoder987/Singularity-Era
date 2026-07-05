/**
 * 基础设施实体定义
 *
 * 层级：ServerNode → Cluster → DataCenter
 * - ServerNode: 物理服务器，含若干 GPU 槽位
 * - Cluster: 多个节点通过网络互联，提供利用率加成
 * - DataCenter: 物理机房，提供电力和冷却
 */

/** 服务器节点 */
export interface ServerNode {
  id: string;
  name: string;
  /** 最大 GPU 槽位数 */
  slotCount: number;
  /** 已安装的卡实例 uid 列表 */
  installedCards: string[];
  /** 节点内部互联类型（如 'NVSwitch', 'PCIe5'） */
  interconnect: string;
  /** 电源供应 kW */
  powerSupplyKW: number;
  /** 购建成本（美元） */
  cost: number;
  /** 每日维护成本（美元） */
  maintenanceCost: number;
  /** 所属集群 id（未加入集群为 null） */
  clusterId: string | null;
  /** 建造日期 */
  builtAt: number;
}

/** 集群 */
export interface Cluster {
  id: string;
  name: string;
  /** 节点 id 列表 */
  nodes: string[];
  /** 网络类型（如 'InfiniBand HDR', 'RoCE', 'Ethernet 400G'） */
  network: string;
  /** 交换机容量 Gbps */
  switchCapacity: number;
  /** 最大节点数 */
  maxNodes: number;
  /** 建造成本（美元，交换机等） */
  buildCost: number;
  /** 每日运营成本（美元） */
  operationalCostPerDay: number;
  /** 利用率加成系数 0~1（如 0.05 表示 +5%） */
  utilizationBonus: number;
  /** 所属数据中心 id（未迁入为 null） */
  dataCenterId: string | null;
  /** 创建日期 */
  createdAt: number;
}

/** 数据中心 */
export interface DataCenter {
  id: string;
  name: string;
  /** 地理位置 */
  location: string;
  /** 最大电力容量 MW */
  maxPowerMW: number;
  /** 已用电力 MW */
  usedPowerMW: number;
  /** 冷却方式 */
  coolingType: 'air' | 'liquid' | 'immersion';
  /** PUE（电能使用效率，越接近 1 越好） */
  pue: number;
  /** 集群 id 列表 */
  clusters: string[];
  /** 建造成本（美元） */
  buildCost: number;
  /** 每日维护成本（美元） */
  maintenanceCostPerDay: number;
  /** 每千瓦时电价（美元） */
  powerCostPerKWh: number;
  /** 建造日期 */
  builtAt: number;
}

/**
 * 科技效果（预留接口，后续科研系统实现）
 *
 * 当前仅在利用率计算中读取 activeTechEffects 数组。
 */
export type TechEffect =
  | { type: 'improve_utilization'; value: number }
  | { type: 'unlock_cluster_network'; targetId: string }
  | { type: 'reduce_cooling_pue'; value: number }
  | { type: 'improve_parallel_efficiency'; value: number };
