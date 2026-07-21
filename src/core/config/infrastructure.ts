/**
 * 基础设施配置
 *
 * 所有配置集中管理，新增节点模板/网络/地点/冷却方式只需在此添加。
 */

/** 网络拓扑类型 */
export type NetworkTopology =
  | 'simple'
  | 'fat_tree'
  | 'dragonfly'
  | 'rail_optimized'
  | '3d_torus'        // 3D-Torus 拓扑，万卡级
  | 'optical_mesh'    // 光互联全互联，十万卡级
  | 'hybrid_fabric';  // 混合光电架构，百万卡级

/** 服务器节点模板 */
export interface NodeTemplate {
  id: string;
  name: string;
  /** GPU 槽位数 */
  slotCount: number;
  /** 内部互联类型 */
  interconnect: string;
  /** 互联带宽 GB/s（GPU-GPU 双向） */
  interconnectBandwidth: number;
  /** 电源供应 kW */
  powerSupplyKW: number;
  /** 节点满载实际功耗 kW */
  maxPowerDrawKW: number;
  /** NVSwitch 代数（0=无NVSwitch, 1/2/3） */
  nvswitchGeneration: number;
  /** 节点可靠性 0-100 */
  reliability: number;
  /** 节点类型 */
  nodeType: 'standard' | 'dgx' | 'hgx';
  /** 购建成本（美元） */
  cost: number;
  /** 每日维护成本（美元） */
  maintenanceCost: number;
}

/** 预定义节点模板 */
export const NODE_TEMPLATES: NodeTemplate[] = [
  // ===== Tier 1：入门 =====
  {
    id: 'node_4_pcie4',
    name: '4-GPU PCIe4 服务器',
    slotCount: 4,
    interconnect: 'PCIe4',
    interconnectBandwidth: 64,
    powerSupplyKW: 3,
    maxPowerDrawKW: 2.4,
    nvswitchGeneration: 0,
    reliability: 90,
    nodeType: 'standard',
    cost: 18_000,
    maintenanceCost: 25,
  },
  {
    id: 'node_8_pcie4',
    name: '8-GPU PCIe4 服务器',
    slotCount: 8,
    interconnect: 'PCIe4',
    interconnectBandwidth: 64,
    powerSupplyKW: 6,
    maxPowerDrawKW: 4.8,
    nvswitchGeneration: 0,
    reliability: 88,
    nodeType: 'standard',
    cost: 35_000,
    maintenanceCost: 40,
  },

  // ===== Tier 2：中端 =====
  {
    id: 'node_4_pcie5',
    name: '4-GPU PCIe5 服务器',
    slotCount: 4,
    interconnect: 'PCIe5',
    interconnectBandwidth: 128,
    powerSupplyKW: 4,
    maxPowerDrawKW: 3.2,
    nvswitchGeneration: 0,
    reliability: 88,
    nodeType: 'standard',
    cost: 25_000,
    maintenanceCost: 30,
  },
  {
    id: 'node_8_pcie5',
    name: '8-GPU PCIe5 服务器',
    slotCount: 8,
    interconnect: 'PCIe5',
    interconnectBandwidth: 128,
    powerSupplyKW: 8,
    maxPowerDrawKW: 6.4,
    nvswitchGeneration: 0,
    reliability: 88,
    nodeType: 'standard',
    cost: 40_000,
    maintenanceCost: 40,
  },

  // ===== 数值修复：带宽过渡档（填补 PCIe5 128 → NVLink3 600 的 4.7 倍鸿沟） =====
  {
    id: 'node_8_pcie6',
    name: '8-GPU PCIe6 服务器',
    slotCount: 8,
    interconnect: 'PCIe6',
    interconnectBandwidth: 256,
    powerSupplyKW: 8,
    maxPowerDrawKW: 6.8,
    nvswitchGeneration: 0,
    reliability: 90,
    nodeType: 'standard',
    cost: 55_000,
    maintenanceCost: 55,
  },
  {
    id: 'node_8_nvlink2',
    name: '8-GPU NVLink2 服务器',
    slotCount: 8,
    interconnect: 'NVLink2',
    interconnectBandwidth: 300,
    powerSupplyKW: 6,
    maxPowerDrawKW: 4.8,
    nvswitchGeneration: 0,
    reliability: 91,
    nodeType: 'dgx',
    cost: 65_000,
    maintenanceCost: 65,
  },

  // ===== Tier 3：高端 =====
  {
    id: 'node_8_nvlink3',
    name: '8-GPU NVLink3 服务器',
    slotCount: 8,
    interconnect: 'NVLink3',
    interconnectBandwidth: 600,
    powerSupplyKW: 6.5,
    maxPowerDrawKW: 5.0,
    nvswitchGeneration: 0,
    reliability: 92,
    nodeType: 'dgx',
    cost: 80_000,
    maintenanceCost: 80,
  },
  {
    id: 'node_8_nvswitch1',
    name: '8-GPU NVSwitch Gen1 服务器',
    slotCount: 8,
    interconnect: 'NVSwitch',
    interconnectBandwidth: 900,
    powerSupplyKW: 10,
    maxPowerDrawKW: 8.0,
    nvswitchGeneration: 1,
    reliability: 94,
    nodeType: 'hgx',
    cost: 120_000,
    maintenanceCost: 120,
  },

  // ===== Tier 4：旗舰 =====
  {
    id: 'node_8_nvswitch2',
    name: '8-GPU NVSwitch Gen2 服务器',
    slotCount: 8,
    interconnect: 'NVSwitch',
    interconnectBandwidth: 1800,
    powerSupplyKW: 12,
    maxPowerDrawKW: 10.0,
    nvswitchGeneration: 2,
    reliability: 95,
    nodeType: 'hgx',
    cost: 200_000,
    maintenanceCost: 200,
  },
  {
    id: 'node_8_nvswitch3',
    name: '8-GPU NVSwitch Gen3 服务器',
    slotCount: 8,
    interconnect: 'NVSwitch',
    interconnectBandwidth: 3600,
    powerSupplyKW: 15,
    maxPowerDrawKW: 12.0,
    nvswitchGeneration: 3,
    reliability: 96,
    nodeType: 'hgx',
    cost: 350_000,
    maintenanceCost: 350,
  },
  {
    id: 'node_16_hgx',
    name: '16-GPU NVSwitch 超级节点',
    slotCount: 16,
    interconnect: 'NVSwitch',
    interconnectBandwidth: 3600,
    powerSupplyKW: 30,
    maxPowerDrawKW: 28.8,
    nvswitchGeneration: 3,
    reliability: 95,
    nodeType: 'hgx',
    cost: 600_000,
    maintenanceCost: 550,
  },

  // ===== Tier 5：超大规模集群专用节点 =====
  {
    id: 'node_72_nvswitch4',
    name: '72-GPU NVSwitch Gen4 机柜',
    slotCount: 72,
    interconnect: 'NVSwitch',
    interconnectBandwidth: 7200,
    powerSupplyKW: 120,
    maxPowerDrawKW: 115.2,
    nvswitchGeneration: 4,
    reliability: 96,
    nodeType: 'hgx',
    cost: 3_500_000,
    maintenanceCost: 3_000,
  },
  {
    id: 'node_256_optical',
    name: '256-GPU 光互联超级节点',
    slotCount: 256,
    interconnect: 'OpticalFabric',
    interconnectBandwidth: 25600,
    powerSupplyKW: 400,
    maxPowerDrawKW: 384,
    nvswitchGeneration: 4,
    reliability: 97,
    nodeType: 'hgx',
    cost: 15_000_000,
    maintenanceCost: 12_000,
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
  /** 实际网络带宽 GB/s */
  networkBandwidth: number;
  /** 每节点建造成本（交换机分摊，美元） */
  costPerNode: number;
  /** 每日运营成本（美元） */
  operationalCostPerDay: number;
  /** 利用率加成 0~1 */
  utilizationBonus: number;
  /** 最大节点数 */
  maxNodes: number;
  /** 最大跨节点 TP 并行度 */
  maxTPDegree: number;
  /** 网络拓扑 */
  networkTopology: NetworkTopology;
  /** All-Reduce 有效带宽 GB/s */
  allReduceBandwidth: number;
  /** 分布式训练效率基础值 */
  parallelEfficiencyBase: number;
}

export const CLUSTER_NETWORKS: ClusterNetwork[] = [
  // ===== 以太网路线 =====
  {
    id: 'eth_100g',
    name: 'Ethernet 100G',
    switchCapacity: 100,
    networkBandwidth: 12.5,
    costPerNode: 2_000,
    operationalCostPerDay: 8,
    utilizationBonus: 0.02,
    maxNodes: 32,
    maxTPDegree: 1,
    networkTopology: 'simple',
    allReduceBandwidth: 8,
    parallelEfficiencyBase: 0.92,
  },
  {
    id: 'eth_400g',
    name: 'Ethernet 400G',
    switchCapacity: 400,
    networkBandwidth: 50,
    costPerNode: 5_000,
    operationalCostPerDay: 15,
    utilizationBonus: 0.05,
    maxNodes: 64,
    maxTPDegree: 1,
    networkTopology: 'simple',
    allReduceBandwidth: 32,
    parallelEfficiencyBase: 0.93,
  },

  // ===== RoCE 路线 =====
  {
    id: 'roce_200g',
    name: 'RoCE 200G',
    switchCapacity: 200,
    networkBandwidth: 25,
    costPerNode: 4_000,
    operationalCostPerDay: 12,
    utilizationBonus: 0.06,
    maxNodes: 48,
    maxTPDegree: 1,
    networkTopology: 'fat_tree',
    allReduceBandwidth: 18,
    parallelEfficiencyBase: 0.94,
  },
  {
    id: 'roce_400g',
    name: 'RoCE 400G',
    switchCapacity: 400,
    networkBandwidth: 50,
    costPerNode: 8_000,
    operationalCostPerDay: 20,
    utilizationBonus: 0.08,
    maxNodes: 96,
    maxTPDegree: 2,
    networkTopology: 'fat_tree',
    allReduceBandwidth: 36,
    parallelEfficiencyBase: 0.95,
  },

  // ===== InfiniBand 路线 =====
  {
    id: 'ib_hdr',
    name: 'InfiniBand HDR',
    switchCapacity: 200,
    networkBandwidth: 25,
    costPerNode: 8_000,
    operationalCostPerDay: 20,
    utilizationBonus: 0.08,
    maxNodes: 64,
    maxTPDegree: 2,
    networkTopology: 'fat_tree',
    allReduceBandwidth: 20,
    parallelEfficiencyBase: 0.955,
  },
  {
    id: 'ib_ndr',
    name: 'InfiniBand NDR',
    switchCapacity: 400,
    networkBandwidth: 50,
    costPerNode: 15_000,
    operationalCostPerDay: 30,
    utilizationBonus: 0.12,
    maxNodes: 128,
    maxTPDegree: 4,
    networkTopology: 'dragonfly',
    allReduceBandwidth: 44,
    parallelEfficiencyBase: 0.965,
  },
  {
    id: 'ib_xdr',
    name: 'InfiniBand XDR',
    switchCapacity: 800,
    networkBandwidth: 100,
    costPerNode: 30_000,
    operationalCostPerDay: 55,
    utilizationBonus: 0.16,
    maxNodes: 256,
    maxTPDegree: 8,
    networkTopology: 'dragonfly',
    allReduceBandwidth: 90,
    parallelEfficiencyBase: 0.975,
  },
  {
    id: 'ib_gdr',
    name: 'InfiniBand GDR',
    switchCapacity: 1600,
    networkBandwidth: 200,
    costPerNode: 55_000,
    operationalCostPerDay: 100,
    utilizationBonus: 0.20,
    maxNodes: 512,
    maxTPDegree: 16,
    networkTopology: 'rail_optimized',
    allReduceBandwidth: 185,
    parallelEfficiencyBase: 0.985,
  },

  // ===== 超大规模集群路线（10万~百万卡级） =====
  {
    id: '3d_torus_ib',
    name: '3D-Torus InfiniBand',
    switchCapacity: 3200,
    networkBandwidth: 400,
    costPerNode: 120_000,
    operationalCostPerDay: 200,
    utilizationBonus: 0.25,
    maxNodes: 2048,           // 2048 节点 × 16 卡 = 32767 卡
    maxTPDegree: 32,
    networkTopology: '3d_torus',
    allReduceBandwidth: 380,
    parallelEfficiencyBase: 0.99,
  },
  {
    id: 'optical_mesh',
    name: '光互联全互联网络',
    switchCapacity: 6400,
    networkBandwidth: 800,
    costPerNode: 250_000,
    operationalCostPerDay: 400,
    utilizationBonus: 0.30,
    maxNodes: 8192,          // 8192 节点 × 72 卡 = 589824 卡（10万卡级）
    maxTPDegree: 64,
    networkTopology: 'optical_mesh',
    allReduceBandwidth: 760,
    parallelEfficiencyBase: 0.995,
  },
  {
    id: 'optical_mesh_plus',
    name: '高级光互联全互联网络',
    switchCapacity: 12800,
    networkBandwidth: 1600,
    costPerNode: 500_000,
    operationalCostPerDay: 800,
    utilizationBonus: 0.35,
    maxNodes: 16384,          // 16384 节点 × 256 卡 = 4194304 卡（百万卡级）
    maxTPDegree: 128,
    networkTopology: 'hybrid_fabric',
    allReduceBandwidth: 1500,
    parallelEfficiencyBase: 0.998,
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
  /** 气候系数 0.95~1.10（影响 PUE，寒冷地区 <1，炎热地区 >1） */
  climateFactor: number;
}

export const DATA_CENTER_LOCATIONS: DataCenterLocation[] = [
  {
    id: 'nv_us',
    name: '内华达, 合众国',
    powerCostPerKWh: 0.08,
    buildCostPerMW: 8_000_000,
    maintenanceCostPerDay: 500,
    climateFactor: 1.02,
  },
  {
    id: 'or_us',
    name: '俄勒冈, 合众国',
    powerCostPerKWh: 0.06,
    buildCostPerMW: 7_000_000,
    maintenanceCostPerDay: 400,
    climateFactor: 0.99,
  },
  {
    id: 'iceland',
    name: '冰岛',
    powerCostPerKWh: 0.05,
    buildCostPerMW: 9_000_000,
    maintenanceCostPerDay: 600,
    climateFactor: 0.97,
  },
  {
    id: 'singapore',
    name: '新加坡',
    powerCostPerKWh: 0.15,
    buildCostPerMW: 12_000_000,
    maintenanceCostPerDay: 800,
    climateFactor: 1.08,
  },
];

const LOCATION_MAP = new Map(DATA_CENTER_LOCATIONS.map((l) => [l.id, l]));

/**
 * 地区 id → DC 地点 id 别名映射
 *
 * BUG 修复：DC 地点 id 体系（nv_us/or_us/iceland/singapore）与地区 id 体系
 * （us-west/us-northeast/cn-east/jp/sg/uk/fr/de）不一致，导致玩家用地区 id 建 DC
 * 触发"未知地点"。此处提供映射，让玩家可用任一 id 定位 DC 地点。
 */
const REGION_TO_DC_LOCATION: Record<string, string> = {
  // 美国
  'us-west': 'nv_us',        // 美西 → 内华达
  'us-northeast': 'or_us',   // 美东北 → 俄勒冈
  'us-east': 'or_us',
  // 欧洲
  'uk': 'iceland',           // 英国 → 冰岛（就近低电价）
  'fr': 'iceland',
  'de': 'iceland',
  'eu-west': 'iceland',
  // 亚太
  'sg': 'singapore',         // 新加坡 → 新加坡
  'ap-sg': 'singapore',
  'jp': 'singapore',         // 日本 → 新加坡（就近）
  'cn-east': 'singapore',    // 中国华东 → 新加坡（就近海外节点）
};

export function getDataCenterLocation(id: string): DataCenterLocation | undefined {
  // 先按 DC 地点 id 直查， miss 时按地区 id 别名映射
  const direct = LOCATION_MAP.get(id);
  if (direct) return direct;
  const alias = REGION_TO_DC_LOCATION[id];
  return alias ? LOCATION_MAP.get(alias) : undefined;
}

/** 返回所有可用 DC 地点 id 列表（用于错误提示/UI 选项） */
export function listDataCenterLocationIds(): string[] {
  return DATA_CENTER_LOCATIONS.map((l) => l.id);
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

/** 存储类型配置 */
export interface StorageTypeConfig {
  id: 'local_ssd' | 'nvme_raid' | 'distributed_fs' | 'all_flash_cluster';
  name: string;
  /** IO 吞吐 GB/s */
  io: number;
  /** 容量 TB */
  capacity: number;
  /** 每日运营成本（美元） */
  costPerDay: number;
  /** 升级费用/节点（美元） */
  upgradeCostPerNode: number;
}

export const STORAGE_CONFIGS: StorageTypeConfig[] = [
  { id: 'local_ssd', name: '本地 SSD', io: 1, capacity: 10, costPerDay: 5, upgradeCostPerNode: 0 },
  { id: 'nvme_raid', name: 'NVMe RAID', io: 5, capacity: 50, costPerDay: 10, upgradeCostPerNode: 5_000 },
  { id: 'distributed_fs', name: '分布式文件系统', io: 100, capacity: 500, costPerDay: 30, upgradeCostPerNode: 10_000 },
  { id: 'all_flash_cluster', name: '全闪存集群', io: 500, capacity: 2000, costPerDay: 80, upgradeCostPerNode: 20_000 },
];

const STORAGE_MAP = new Map(STORAGE_CONFIGS.map((s) => [s.id, s]));
export function getStorageConfig(id: string): StorageTypeConfig | undefined {
  return STORAGE_MAP.get(id as StorageTypeConfig['id']);
}
