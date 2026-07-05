/**
 * 基础设施配置
 *
 * 所有配置集中管理，新增节点模板/网络/地点/冷却方式只需在此添加。
 */

/** 服务器节点模板 */
export interface NodeTemplate {
  id: string;
  name: string;
  /** GPU 槽位数 */
  slotCount: number;
  /** 内部互联类型 */
  interconnect: string;
  /** 电源供应 kW */
  powerSupplyKW: number;
  /** 购建成本（美元） */
  cost: number;
  /** 每日维护成本（美元） */
  maintenanceCost: number;
}

/** 预定义节点模板 */
export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    id: 'node_8_nvswitch',
    name: '8-GPU NVSwitch 服务器',
    slotCount: 8,
    interconnect: 'NVSwitch',
    powerSupplyKW: 8,
    cost: 50_000,
    maintenanceCost: 50,
  },
  {
    id: 'node_4_pcie5',
    name: '4-GPU PCIe5 服务器',
    slotCount: 4,
    interconnect: 'PCIe5',
    powerSupplyKW: 4,
    cost: 25_000,
    maintenanceCost: 30,
  },
  {
    id: 'node_8_pcie5',
    name: '8-GPU PCIe5 服务器',
    slotCount: 8,
    interconnect: 'PCIe5',
    powerSupplyKW: 8,
    cost: 40_000,
    maintenanceCost: 40,
  },
];

/** 按 id 查找节点模板 */
const NODE_MAP = new Map(NODE_TEMPLATES.map((t) => [t.id, t]));
export function getNodeTemplate(id: string): NodeTemplate | undefined {
  return NODE_MAP.get(id);
}

/** 集群网络选项 */
export interface ClusterNetwork {
  id: string;
  name: string;
  /** 交换机容量 Gbps */
  switchCapacity: number;
  /** 每节点建造成本（交换机分摊，美元） */
  costPerNode: number;
  /** 每日运营成本（美元） */
  operationalCostPerDay: number;
  /** 利用率加成 0~1 */
  utilizationBonus: number;
  /** 最大节点数 */
  maxNodes: number;
}

export const CLUSTER_NETWORKS: ClusterNetwork[] = [
  {
    id: 'ib_hdr',
    name: 'InfiniBand HDR',
    switchCapacity: 200,
    costPerNode: 8_000,
    operationalCostPerDay: 20,
    utilizationBonus: 0.08,
    maxNodes: 64,
  },
  {
    id: 'ib_ndr',
    name: 'InfiniBand NDR',
    switchCapacity: 400,
    costPerNode: 15_000,
    operationalCostPerDay: 30,
    utilizationBonus: 0.12,
    maxNodes: 128,
  },
  {
    id: 'eth_400g',
    name: 'Ethernet 400G',
    switchCapacity: 400,
    costPerNode: 5_000,
    operationalCostPerDay: 15,
    utilizationBonus: 0.05,
    maxNodes: 64,
  },
  {
    id: 'roce_200g',
    name: 'RoCE 200G',
    switchCapacity: 200,
    costPerNode: 4_000,
    operationalCostPerDay: 12,
    utilizationBonus: 0.06,
    maxNodes: 48,
  },
];

const NETWORK_MAP = new Map(CLUSTER_NETWORKS.map((n) => [n.id, n]));
export function getClusterNetwork(id: string): ClusterNetwork | undefined {
  return NETWORK_MAP.get(id);
}

/** 数据中心地点选项 */
export interface DataCenterLocation {
  id: string;
  name: string;
  /** 每千瓦时电价（美元） */
  powerCostPerKWh: number;
  /** 每 MW 建造成本（美元） */
  buildCostPerMW: number;
  /** 每日维护成本（美元） */
  maintenanceCostPerDay: number;
}

export const DATA_CENTER_LOCATIONS: DataCenterLocation[] = [
  {
    id: 'nv_us',
    name: '内华达, 美国',
    powerCostPerKWh: 0.08,
    buildCostPerMW: 8_000_000,
    maintenanceCostPerDay: 500,
  },
  {
    id: 'or_us',
    name: '俄勒冈, 美国',
    powerCostPerKWh: 0.06,
    buildCostPerMW: 7_000_000,
    maintenanceCostPerDay: 400,
  },
  {
    id: 'iceland',
    name: '冰岛',
    powerCostPerKWh: 0.05,
    buildCostPerMW: 9_000_000,
    maintenanceCostPerDay: 600,
  },
  {
    id: 'singapore',
    name: '新加坡',
    powerCostPerKWh: 0.15,
    buildCostPerMW: 12_000_000,
    maintenanceCostPerDay: 800,
  },
];

const LOCATION_MAP = new Map(DATA_CENTER_LOCATIONS.map((l) => [l.id, l]));
export function getDataCenterLocation(id: string): DataCenterLocation | undefined {
  return LOCATION_MAP.get(id);
}

/** 冷却方式配置 */
export interface CoolingTypeConfig {
  id: 'air' | 'liquid' | 'immersion';
  name: string;
  /** PUE 基准值 */
  basePUE: number;
  /** 利用率加成 0~1（液冷/浸没降低温度，允许更高运行效率） */
  utilizationBonus: number;
  /** 每 MW 额外建造成本（美元） */
  extraBuildCostPerMW: number;
}

export const COOLING_TYPES: CoolingTypeConfig[] = [
  {
    id: 'air',
    name: '风冷',
    basePUE: 1.4,
    utilizationBonus: 0,
    extraBuildCostPerMW: 0,
  },
  {
    id: 'liquid',
    name: '液冷',
    basePUE: 1.2,
    utilizationBonus: 0.05,
    extraBuildCostPerMW: 500_000,
  },
  {
    id: 'immersion',
    name: '浸没式冷却',
    basePUE: 1.05,
    utilizationBonus: 0.1,
    extraBuildCostPerMW: 1_500_000,
  },
];

const COOLING_MAP = new Map(COOLING_TYPES.map((c) => [c.id, c]));
export function getCoolingType(id: 'air' | 'liquid' | 'immersion'): CoolingTypeConfig | undefined {
  return COOLING_MAP.get(id);
}
