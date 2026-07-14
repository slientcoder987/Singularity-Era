import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { REGIONS, getGridPowerPrice, getGridPowerCap } from '../config/regions';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * BuyGridPowerCommand
 *
 * 从地区电网一次性购买电力容量（kW）。
 * - 价格随地区 energyCostIndex 变化
 * - 可购买总量受地区电网容量限制
 * - 已购电网电量和自建电站共同计入 power_kw
 */
export class BuyGridPowerCommand implements Command {
  constructor(public readonly kw: number) {}

  execute(state: GameState, events: EventBus): void {
    if (this.kw <= 0) {
      events.emit('GRID_POWER_REJECTED', { reason: '购电量必须大于 0' });
      return;
    }

    const current = state.read();
    const hqRegionId = current.headquartersRegionId;
    if (!hqRegionId) {
      events.emit('GRID_POWER_REJECTED', { reason: '未设置总部地区' });
      return;
    }

    const region = REGIONS.find((r) => r.id === hqRegionId);
    if (!region) {
      events.emit('GRID_POWER_REJECTED', { reason: '地区数据不存在' });
      return;
    }

    // 计算该地区已购电网电量
    const gridContracts = (current.resourceMeta['grid_power_contracts'] as Array<{ kw: number }>) ?? [];
    const alreadyBought = gridContracts.reduce((s, c) => s + c.kw, 0);
    const regionCap = getGridPowerCap(region);

    if (alreadyBought + this.kw > regionCap) {
      events.emit('GRID_POWER_REJECTED', {
        reason: `超出地区电网容量上限（已购 ${alreadyBought} kW，上限 ${regionCap} kW）`,
        cap: regionCap,
        bought: alreadyBought,
      });
      return;
    }

    const pricePerKW = getGridPowerPrice(region);
    const totalCost = this.kw * pricePerKW;
    const funds = current.resources['funds'] ?? 0;

    if (funds < totalCost) {
      events.emit('GRID_POWER_REJECTED', {
        reason: '资金不足',
        required: totalCost,
        funds,
      });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= totalCost;
      draft.resources['power_kw'] = (draft.resources['power_kw'] ?? 0) + this.kw;

      const contracts = (draft.resourceMeta['grid_power_contracts'] as any[]) ?? [];
      contracts.push({
        id: genId('grid'),
        kw: this.kw,
        pricePerKW,
        totalCost,
        regionId: hqRegionId,
        purchasedAt: draft.date,
      });
      draft.resourceMeta['grid_power_contracts'] = contracts;
    });

    events.emit('GRID_POWER_PURCHASED', {
      kw: this.kw,
      pricePerKW,
      totalCost,
      region: region.name,
    });
  }
}
