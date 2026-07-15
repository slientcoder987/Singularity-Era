import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { REGIONS } from '../config/regions';
import {
  CLOUD_PROVIDER_MAP,
  calcCloudRentalPrice,
  calcCloudMaxTFLOPS,
  type CloudProviderId,
} from '../config/cloudProviders';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 租赁合约记录 */
export interface CloudRentalContract {
  id: string;
  providerId: CloudProviderId;
  /** 租用 TFLOPS */
  tflops: number;
  /** 日租金（$/天） */
  dailyCost: number;
  /** 总天数 */
  totalDays: number;
  /** 已过天数 */
  elapsedDays: number;
  /** 开始日期 */
  startedAt: number;
  /** 结束日期 */
  expiresAt: number;
  /** 所在地区 id */
  regionId: string;
  /** 总费用 */
  totalPaid: number;
}

/**
 * RentCloudComputeCommand
 *
 * 从云服务商租用算力（TFLOPS），按天计费，到期自动释放。
 * - 不同服务商在不同地区价格不同
 * - 可租用总量受地区 + 服务商供给上限限制
 */
export class RentCloudComputeCommand implements Command {
  constructor(
    public readonly providerId: CloudProviderId,
    /** 租用 TFLOPS 数量 */
    public readonly tflops: number,
    /** 租用天数 */
    public readonly days: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const provider = CLOUD_PROVIDER_MAP[this.providerId];
    if (!provider) {
      events.emit('CLOUD_RENTAL_REJECTED', { reason: '未知云服务商' });
      return;
    }

    if (this.tflops <= 0) {
      events.emit('CLOUD_RENTAL_REJECTED', { reason: '算力必须大于 0' });
      return;
    }

    if (this.days < provider.minRentalDays || this.days > provider.maxRentalDays) {
      events.emit('CLOUD_RENTAL_REJECTED', {
        reason: `租用天数需在 ${provider.minRentalDays}-${provider.maxRentalDays} 天之间`,
      });
      return;
    }

    if (this.tflops % provider.unitTFLOPS !== 0) {
      events.emit('CLOUD_RENTAL_REJECTED', {
        reason: `租用量需为 ${provider.unitTFLOPS} TFLOPS 的整数倍`,
      });
      return;
    }

    const current = state.read();
    const hqRegionId = current.headquartersRegionId;
    if (!hqRegionId) {
      events.emit('CLOUD_RENTAL_REJECTED', { reason: '未设置总部地区' });
      return;
    }

    const region = REGIONS.find((r) => r.id === hqRegionId);
    if (!region) {
      events.emit('CLOUD_RENTAL_REJECTED', { reason: '地区数据不存在' });
      return;
    }

    // 检查该服务商在当前地区的已租用量
    const activeContracts = (current.resourceMeta['cloud_rental_contracts'] as CloudRentalContract[]) ?? [];
    const existingTFLOPS = activeContracts
      .filter((c) => c.providerId === this.providerId && c.regionId === hqRegionId)
      .reduce((s, c) => s + c.tflops, 0);
    const maxTFLOPS = calcCloudMaxTFLOPS(provider, region);

    if (existingTFLOPS + this.tflops > maxTFLOPS) {
      events.emit('CLOUD_RENTAL_REJECTED', {
        reason: `超出该服务商可用算力上限（已租 ${existingTFLOPS} TFLOPS，上限 ${maxTFLOPS} TFLOPS）`,
      });
      return;
    }

    const dailyPrice = calcCloudRentalPrice(provider, region);
    const totalCost = Math.round(dailyPrice * this.tflops * this.days);

    const funds = current.resources['funds'] ?? 0;
    if (funds < totalCost) {
      events.emit('CLOUD_RENTAL_REJECTED', {
        reason: '资金不足',
        required: totalCost,
        funds,
      });
      return;
    }

    const contract: CloudRentalContract = {
      id: genId('cloud'),
      providerId: this.providerId,
      tflops: this.tflops,
      dailyCost: Math.round(dailyPrice * this.tflops * 100) / 100,
      totalDays: this.days,
      elapsedDays: 0,
      startedAt: current.date,
      expiresAt: current.date + this.days,
      regionId: hqRegionId,
      totalPaid: totalCost,
    };

    state.update((draft) => {
      draft.resources['funds'] -= totalCost;
      // 设计-3 修复：不再把云算力计入 compute_power 资源（避免与本地卡混淆）。
      // 云算力统一通过 getActiveCloudTFLOPS() 查询，训练/推理系统已支持。

      const contracts = (draft.resourceMeta['cloud_rental_contracts'] as CloudRentalContract[]) ?? [];
      contracts.push(contract);
      draft.resourceMeta['cloud_rental_contracts'] = contracts;
    });

    events.emit('CLOUD_RENTAL_STARTED', {
      provider: provider.name,
      tflops: this.tflops,
      days: this.days,
      dailyCost: contract.dailyCost,
      totalCost,
      region: region.name,
    });
  }
}
