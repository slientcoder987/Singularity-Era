/**
 * 基础设施实体定义
 *
 * 层级：ServerNode → Cluster → DataCenter
 * - ServerNode: 物理服务器，含若干 GPU 槽位
 * - Cluster: 多个节点通过网络互联，提供利用率加成
 * - DataCenter: 物理机房，提供电力和冷却
 */
import type { NetworkTopology } from '../config/infrastructure';

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
  /** 基准可靠性（建造时确定，维护后恢复） */
  baseReliability: number;
  /** 节点类型 */
  nodeType: 'standard' | 'dgx' | 'hgx';
  /** 购建成本（美元） */
  cost: number;
  /** 每日维护成本（美元） */
  maintenanceCost: number;
  /** 所属集群 id（未加入集群为 null） */
  clusterId: string | null;
  /** 建造日期 */
  builtAt: number;
  /** 上次维护日期 */
  lastMaintenanceDay: number;
}

/** 集群 */
export interface Cluster {
  id: string;
  name: string;
  /** 节点 id 列表 */
  nodes: string[];
  /** 网络类型名称（如 'InfiniBand HDR', 'RoCE', 'Ethernet 400G'） */
  network: string;
  /** 交换机容量 Gbps */
  switchCapacity: number;
  /** 实际网络带宽 GB/s */
  networkBandwidth: number;
  /** 网络拓扑 */
  networkTopology: NetworkTopology;
  /** 最大节点数 */
  maxNodes: number;
  /** 最大跨节点 TP 并行度 */
  maxTPDegree: number;
  /** All-Reduce 有效带宽 GB/s */
  allReduceBandwidth: number;
  /** 分布式训练效率基础值 */
  parallelEfficiencyBase: number;
  /** 建造成本（美元，交换机等） */
  buildCost: number;
  /** 每日运营成本（美元） */
  operationalCostPerDay: number;
  /** 利用率加成系数 0~1（如 0.05 表示 +5%） */
  utilizationBonus: number;
  /** 基础利用率加成（建造时确定，故障时临时降为 0，次日恢复） */
  baseUtilizationBonus: number;
  /** 所属数据中心 id（未迁入为 null） */
  dataCenterId: string | null;
  /** 存储类型 */
  storageType: 'local_ssd' | 'nvme_raid' | 'distributed_fs' | 'all_flash_cluster';
  /** 存储IO吞吐 GB/s */
  storageIO: number;
  /** 存储容量 TB */
  storageCapacity: number;
  /** 存储日运营成本 */
  storageCostPerDay: number;
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
  /** PUE（电能使用效率，越接近 1 越好）—— 保留向后兼容 */
  pue: number;
  /** 基准 PUE（建造时确定 = cooling.basePUE × location.climateFactor） */
  basePue: number;
  /** 当前实际 PUE（随时间衰减，维护后恢复） */
  currentPue: number;
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
  /** 上次维护日期 */
  lastMaintenanceDay: number;
}

/**
 * 科技效果
 *
 * 基础设施效果在利用率计算中读取；训练效果在能力计算中读取。
 */
export type TechEffect =
  | { type: 'improve_utilization'; value: number }
  | { type: 'unlock_cluster_network'; targetId: string }
  | { type: 'reduce_cooling_pue'; value: number }
  | { type: 'improve_parallel_efficiency'; value: number }
  | { type: 'upgrade_storage'; storageType: string; io: number; capacity: number; costPerDay: number }
  | { type: 'upgrade_network_topology'; topology: string; allReduceBandwidth: number; parallelEfficiency: number }
  // 训练相关效果
  | { type: 'modify_base_score_E'; value: number }
  | { type: 'modify_base_score_A'; value: number }
  | { type: 'modify_base_score_B'; value: number }
  | { type: 'modify_alpha'; value: number }
  | { type: 'modify_beta'; value: number }
  | { type: 'reduce_compute_cost'; value: number }
  | { type: 'reduce_memory'; value: number }
  | { type: 'extend_context'; multiplier: number }
  | { type: 'capability_bonus'; capability: string; bonus: number }
  // P1 新增训练相关效果
  | { type: 'improve_research_speed'; value: number }
  | { type: 'improve_experiment_confidence'; value: number }
  | { type: 'reduce_training_crash_risk'; value: number }
  // 并行策略解锁
  | { type: 'unlock_parallel_strategy'; strategy: 'pp' | 'tp' | 'ep' | 'cp' }
  | { type: 'enable_synthetic_data'; qualityBonus: number }
  | { type: 'enable_distillation'; efficiencyBonus: number }
  | { type: 'improve_data_quality'; value: number }
  | { type: 'reduce_legal_risk'; value: number }
  | { type: 'improve_alignment'; value: number };
