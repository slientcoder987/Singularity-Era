/**
 * 云服务商配置（匿名化处理）
 *
 * 模拟真实云服务商的算力租赁市场，每家在不同地区有不同价格和供应上限。
 * 价格和上限由地区 computeIndex 决定。
 */

import type { Region } from './regions';

/** 云服务商 id */
export type CloudProviderId = 'nimbus' | 'stratus' | 'cirrus' | 'nova' | 'aurora' | 'tenji';

/** 云服务商定义 */
export interface CloudProvider {
  id: CloudProviderId;
  /** 匿名化名称 */
  name: string;
  /** 一句话描述 */
  description: string;
  /** 基础单价（$/TFLOPS·天），地区修正前 */
  basePricePerTFLOPSDay: number;
  /** 单单位 TFLOPS（每次租用单位，如 100 TFLOPS 为一个单位） */
  unitTFLOPS: number;
  /** 最低租用天数 */
  minRentalDays: number;
  /** 最长租用天数 */
  maxRentalDays: number;
}

/** 匿名化云服务商列表 */
export const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: 'nimbus',
    name: 'Nimbus Cloud',
    description: '全球最大的云计算平台，GPU 实例丰富，覆盖最广',
    basePricePerTFLOPSDay: 1.8,
    unitTFLOPS: 100,
    minRentalDays: 7,
    maxRentalDays: 365,
  },
  {
    id: 'stratus',
    name: 'Stratus AI',
    description: 'TPU 专精，训练优化出色，价格略低但供应有限',
    basePricePerTFLOPSDay: 1.5,
    unitTFLOPS: 200,
    minRentalDays: 14,
    maxRentalDays: 180,
  },
  {
    id: 'cirrus',
    name: 'Cirrus Compute',
    description: '企业级混合云，GPU + FPGA 方案，价格较高',
    basePricePerTFLOPSDay: 2.0,
    unitTFLOPS: 150,
    minRentalDays: 7,
    maxRentalDays: 365,
  },
  {
    id: 'nova',
    name: 'Nova Cloud',
    description: '新兴 AI 训练云，专注大模型训练，性价比高',
    basePricePerTFLOPSDay: 1.2,
    unitTFLOPS: 50,
    minRentalDays: 30,
    maxRentalDays: 90,
  },
  {
    id: 'aurora',
    name: 'Aurora AI',
    description: '亚洲最大云平台，东亚地区供应充足，价格有竞争力',
    basePricePerTFLOPSDay: 1.0,
    unitTFLOPS: 100,
    minRentalDays: 7,
    maxRentalDays: 365,
  },
  {
    id: 'tenji',
    name: 'Tenji Compute',
    description: '亚太区云主力，新加坡/东京节点质量高',
    basePricePerTFLOPSDay: 1.1,
    unitTFLOPS: 100,
    minRentalDays: 7,
    maxRentalDays: 180,
  },
];

/** 根据地区和云服务商计算实际日租价格 */
export function calcCloudRentalPrice(provider: CloudProvider, region: Region): number {
  // computeIndex 越高 → 供应越充足 → 价格越低（0.6~1.2 倍率）
  const supplyMultiplier = 1.2 - (region.computeIndex / 100) * 0.6;
  return Math.round(provider.basePricePerTFLOPSDay * supplyMultiplier * 100) / 100;
}

/** 根据地区和云服务商计算最大可租 TFLOPS */
export function calcCloudMaxTFLOPS(provider: CloudProvider, region: Region): number {
  // computeIndex 越高 → 可用算力越多
  // 基础池 + computeIndex 线性映射
  const basePool = 500;
  const indexPool = region.computeIndex * 50;
  // 不同服务商有不同的供给弹性
  const providerMultiplier: Record<CloudProviderId, number> = {
    nimbus: 1.5,
    stratus: 0.8,
    cirrus: 1.2,
    nova: 0.4,
    aurora: 1.0,
    tenji: 0.9,
  };
  return Math.round((basePool + indexPool) * (providerMultiplier[provider.id] ?? 1.0));
}

/** 获取某地区可用的云服务商（所有服务商在所有地区都可用，但容量不同） */
export function getAvailableProviders(): CloudProvider[] {
  return CLOUD_PROVIDERS;
}

export const CLOUD_PROVIDER_MAP: Record<CloudProviderId, CloudProvider> = Object.fromEntries(
  CLOUD_PROVIDERS.map((p) => [p.id, p]),
) as Record<CloudProviderId, CloudProvider>;
