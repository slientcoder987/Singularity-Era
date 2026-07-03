import type { ResourceDefinition } from '../resources/ResourceTypes';

/**
 * 初始资源定义清单
 *
 * 在此添加新条目即可注册新资源，无需修改框架代码。
 * 资源会自动出现在状态初始化、顶部栏（若 showInTopBar）、命令系统中。
 */
export const INITIAL_RESOURCES: ResourceDefinition[] = [
  {
    id: 'funds',
    name: '资金',
    category: 'currency',
    isContinuous: true,
    minValue: -Infinity,
    maxValue: Infinity,
    initialValue: 1_000_000,
    uiConfig: { icon: '💰', color: '#ffd76b', showInTopBar: true, format: 'currency' },
  },
  {
    id: 'compute_h100',
    name: 'H100 计算卡',
    category: 'hardware',
    isContinuous: false,
    minValue: 0,
    maxValue: 10000,
    initialValue: 0,
    uiConfig: { icon: '🖥️', color: '#56dce6', showInTopBar: true, format: 'number' },
  },
  {
    id: 'compute_a100',
    name: 'A100 计算卡',
    category: 'hardware',
    isContinuous: false,
    minValue: 0,
    maxValue: 10000,
    initialValue: 1,
    uiConfig: { icon: '🖥️', color: '#56dce6', showInTopBar: true, format: 'number' },
  },
  {
    id: 'power_kw',
    name: '电力容量',
    category: 'energy',
    isContinuous: true,
    minValue: 0,
    maxValue: 1_000_000,
    initialValue: 100,
    uiConfig: { icon: '⚡', color: '#ffb454', showInTopBar: true, format: 'number' },
  },
];

/**
 * 硬件型号属性表
 *
 * key 为资源 id（即硬件型号）。新增型号只需在此添加配置。
 */
export interface HardwareSpec {
  /** 对应资源 id */
  resourceId: string;
  /** 单卡功耗 kW */
  powerPerCard: number;
  /** 单卡算力 TFLOPS */
  tflopsPerCard: number;
  /** 单卡采购价（美元） */
  unitCost: number;
  /** 交付周期（天） */
  deliveryDays: number;
  /** 每日磨损率（0~1，0.001 表示每天 0.1% 概率故障） */
  wearPerDay: number;
}

export const HARDWARE_SPECS: HardwareSpec[] = [
  {
    resourceId: 'compute_h100',
    powerPerCard: 0.7,
    tflopsPerCard: 1979,
    unitCost: 30_000,
    deliveryDays: 7,
    wearPerDay: 0.0005,
  },
  {
    resourceId: 'compute_a100',
    powerPerCard: 0.4,
    tflopsPerCard: 624,
    unitCost: 10_000,
    deliveryDays: 3,
    wearPerDay: 0.0008,
  },
];

/** 电力相关配置 */
export const POWER_CONFIG = {
  /** 每千瓦时电价（美元） */
  pricePerKWh: 0.12,
  /** 基础设施日耗电 kW（机房、照明、冷却） */
  baseConsumptionKW: 5,
  /** 建造电站每 kW 造价（美元） */
  powerPlantCostPerKW: 800,
};
