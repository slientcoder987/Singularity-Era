/**
 * 云算力工具
 *
 * 统一查询活跃云租赁合约的算力，供 TrainingSystem / OperationsSystem / 估值使用。
 * 解决 BUG-2：云算力租赁原本只增加 compute_power 数值但无法被训练/推理消费。
 */
import type { GameData } from '../GameState';
import type { CloudRentalContract } from '../commands/RentComputeCommand';

/** 获取所有活跃云租赁合约 */
export function getActiveCloudContracts(data: GameData): CloudRentalContract[] {
  const contracts = data.resourceMeta['cloud_rental_contracts'] as CloudRentalContract[] | undefined;
  if (!Array.isArray(contracts)) return [];
  return contracts.filter((c) => c.expiresAt > data.date);
}

/** 获取活跃云算力总和（TFLOPS） */
export function getActiveCloudTFLOPS(data: GameData): number {
  return getActiveCloudContracts(data).reduce((s, c) => s + c.tflops, 0);
}
