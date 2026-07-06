/**
 * 计算卡规格定义
 *
 * 扩展自基础 HardwareSpec，增加显存、带宽、互联等物理属性。
 * 所有规格配置化，新增型号只需在 config/computeCards.ts 添加条目。
 */

/** 计算精度档位（不同精度下单卡算力不同） */
export type ComputePrecision = 'fp32' | 'bf16' | 'fp8' | 'int4';

export interface ComputeCardSpec {
  /** 对应资源 id（如 'compute_h100'） */
  resourceId: string;
  /** 显示名称 */
  name: string;
  /** 各精度下的单卡算力 TFLOPS（稠密） */
  tflopsByPrecision: Record<ComputePrecision, number>;
  /** 单卡典型功耗 kW（用于电力系统计算） */
  powerPerCard: number;
  /** 单卡最大功耗 kW（用于节点供电容量检查） */
  maxPowerDrawKW: number;
  /** 单卡采购价（美元） */
  unitCost: number;
  /** 交付周期（天） */
  deliveryDays: number;
  /** 每日磨损率（0~1，0.001 表示每天 0.1% 概率故障） */
  wearPerDay: number;

  // ===== 新增物理属性 =====
  /** 显存容量 GB */
  memoryGB: number;
  /** 显存带宽 GB/s */
  memoryBandwidth: number;
  /** 互联类型（如 'NVLink4', 'NVLink3', 'PCIe5', 'PCIe4'） */
  interconnect: string;
}

/**
 * 获取指定精度下的单卡算力。
 * 若该精度未配置，回退到 BF16（训练通用基准）。
 */
export function getCardTflops(spec: ComputeCardSpec, precision: ComputePrecision): number {
  return spec.tflopsByPrecision[precision] ?? spec.tflopsByPrecision.bf16;
}

/**
 * 计算卡实例（运行时单卡状态）
 *
 * 存储在 state.resourceMeta[modelId] 数组中。
 * location 字段指向所在服务器节点 id（未安装则为 null）。
 */
export interface ComputeCardInstance {
  uid: string;
  modelId: string;
  status: 'online' | 'offline' | 'broken';
  /** 累计运行天数 */
  age: number;
  /** 已分配的项目 id（未分配为 null） */
  assignedProjectId: string | null;
  /** 购入日期 */
  purchasedAt: number;
  /** 所在服务器节点 id（未安装为 null） */
  location: string | null;
}
