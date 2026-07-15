import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { FundingType, BoardMission } from '../entities/Operations';
import { calcValuation } from '../utils/marketCalc';
import { getActiveCloudTFLOPS } from '../utils/cloudComputeUtils';

// ============================================================
// 融资命令
// ============================================================

interface FundingParams {
  type: FundingType;
  investorName: string;
  terms: {
    computeDiscount?: number;
    exclusivityRequired?: boolean;
    techAlignment?: string;
    vamRevenueTarget?: number;
    vamUserTarget?: number;
    vamDeadlineDays?: number;
    vamDilutionPercent?: number;
    restrictedMarkets?: string[];
    securityReviewRequired?: boolean;
    stockPrice?: number;
    ipoPrice?: number;
    shortSellRisk?: number;
    boardSeats: number;
  };
}

export class RaiseFundingCommand implements Command {
  constructor(private params: FundingParams) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 计算估值（★ 设计 #8：考虑训练进度、算力、团队）
    const annualRevenue = (current.operations?.dailyRevenue ?? 0) * 365;
    const publishedModels = current.models.filter((m) => m.published);
    const bestCap = publishedModels.length > 0
      ? Math.max(...publishedModels.map((m) => m.baseScore))
      : 0;
    const valuation = calcValuation({
      annualRevenue,
      bestCapability: bestCap,
      headquartersRegionId: current.headquartersRegionId,
      trainingProjects: current.trainingProjects.map((p) => ({
        computeTotal: p.computeTotal,
        computeRemaining: p.computeRemaining,
        paramCount: p.paramCount,
      })),
      // BUG-16 修复：估值包含云算力，让云租赁在融资时也有战略价值
      totalComputeTFLOPS: (current.resources['compute_power'] ?? 0) + getActiveCloudTFLOPS(current),
      employeeCount: current.employees.length,
    });

    // 各类型金额比例
    const typeMultiplier: Record<FundingType, number> = {
      seed: 0.03 + Math.random() * 0.04, // 种子轮：3-7%（低额度，早期专用）
      strategic: 0.05 + Math.random() * 0.10,
      venture_capital: 0.10 + Math.random() * 0.20,
      government: 0.03 + Math.random() * 0.05,
      ipo: 0.20 + Math.random() * 0.20,
    };
    const amount = valuation * typeMultiplier[this.params.type];

    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }

      draft.fundingRounds.push({
        id: `funding-${draft.date}-${this.params.type}-${Math.random().toString(36).slice(2, 6)}`,
        type: this.params.type,
        investorName: this.params.investorName,
        amount,
        valuationAtRound: valuation,
        usedAmount: 0,
        terms: {
          computeDiscount: this.params.terms.computeDiscount,
          exclusivityRequired: this.params.terms.exclusivityRequired,
          techAlignment: this.params.terms.techAlignment,
          vamRevenueTarget: this.params.terms.vamRevenueTarget,
          vamUserTarget: this.params.terms.vamUserTarget,
          vamDeadlineDays: this.params.terms.vamDeadlineDays,
          vamDilutionPercent: this.params.terms.vamDilutionPercent,
          restrictedMarkets: this.params.terms.restrictedMarkets,
          securityReviewRequired: this.params.terms.securityReviewRequired,
          stockPrice: this.params.terms.stockPrice ?? this.params.terms.ipoPrice,
          ipoPrice: this.params.terms.ipoPrice,
          shortSellRisk: this.params.terms.shortSellRisk ?? 0.01,
          // 设计-15：IPO 时根据发行价和融资金额推算初始流通股数
          sharesOutstanding: this.params.type === 'ipo' && (this.params.terms.ipoPrice ?? this.params.terms.stockPrice)
            ? Math.round((amount * 1_000_000) / (this.params.terms.ipoPrice ?? this.params.terms.stockPrice!))
            : undefined,
          boardSeats: this.params.terms.boardSeats,
        },
        completedAt: draft.date,
        active: true,
      });

      // 资金到账（amount 为 M 单位，需转换为实际美元）
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + amount * 1_000_000;
    });

    events.emit('FUNDING_COMPLETED', this.params.type, this.params.investorName, amount);
  }
}

// ============================================================
// Token 定价命令
// ============================================================

export class SetTokenPricingCommand implements Command {
  constructor(
    private pricePerMillion: number,
    private inferenceAllocation: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    // BUG-14 修复：参数校验，防止负数或超界值绕过利润税或获得超物理上限的产能
    const safePrice = Math.max(0, this.pricePerMillion);
    const safeAlloc = Math.max(0, Math.min(1, this.inferenceAllocation));

    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.tokenPricing.pricePerMillion = safePrice;
      draft.operations.tokenPricing.inferenceAllocation = safeAlloc;
    });
    events.emit('TOKEN_PRICING_UPDATED', safePrice, safeAlloc);
  }
}

// ============================================================
// 欺骗操作命令
// ============================================================

export class SetDowngradeLevelCommand implements Command {
  constructor(private level: number) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.deception.downgradeLevel = Math.max(0, Math.min(3, this.level));
      draft.operations.deception.detectionProbability = 0.02 * this.level;
      draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - this.level * 3);
    });
    events.emit('DOWNGRADE_CHANGED', this.level);
  }
}

export class ToggleStealUserDataCommand implements Command {
  constructor(private enable: boolean) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.deception.stealUserData = this.enable;
      if (this.enable) {
        draft.operations.deception.detectionProbability += 0.05;
      } else {
        draft.operations.deception.detectionProbability = Math.max(0.02 * draft.operations.deception.downgradeLevel, draft.operations.deception.detectionProbability - 0.05);
      }
    });
    events.emit('DATA_THEFT_TOGGLED', this.enable);
  }
}

export class ToggleSkipSafetyCommand implements Command {
  constructor(private enable: boolean) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.deception.skipSafetyTesting = this.enable;
      if (this.enable) {
        draft.operations.deception.detectionProbability += 0.03;
      } else {
        draft.operations.deception.detectionProbability = Math.max(0.02 * draft.operations.deception.downgradeLevel, draft.operations.deception.detectionProbability - 0.03);
      }
    });
    events.emit('SAFETY_TOGGLED', this.enable);
  }
}

// ============================================================
// 董事会指令命令
// ============================================================

export class RespondToMissionCommand implements Command {
  constructor(
    private missionId: string,
    private action: 'accept' | 'reject',
  ) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      if (!draft.operations) return;
      const mission = draft.operations.boardMissions.find((m) => m.id === this.missionId);
      if (!mission || mission.status !== 'pending') return;

      if (this.action === 'accept') {
        mission.status = 'accepted';
      } else {
        mission.status = 'rejected';
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 3);
        draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - 5);
      }
    });
    events.emit('MISSION_RESPONSE', this.missionId, this.action);
  }
}

// ============================================================
// 设计-15：IPO 后股票增发 / 回购
// ============================================================

/**
 * 二级市场增发（Secondary Offering）
 *
 * 玩家在 IPO 后可增发新股以筹集资金。
 * - 增发股数 = Math.round(amount * 1_000_000 / currentStockPrice)
 * - 实际入账资金 = 增发股数 * 当前股价 * (1 - DISCOUNT)（折价发行保证认购）
 * - 股价即时下跌 1-3%（稀释效应）
 * - 单次增发上限：当前流通股的 20%，防止恶意稀释
 */
const SECONDARY_OFFER_MAX_RATIO = 0.2;
const SECONDARY_OFFER_DISCOUNT = 0.05; // 5% 折价

export class IssueSecondaryOfferingCommand implements Command {
  /**
   * @param amountMillions 希望筹集的资金（百万美元）
   */
  constructor(private amountMillions: number) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 必须已 IPO
    const ipoIdx = current.fundingRounds.findIndex((r) => r.type === 'ipo' && r.active);
    if (ipoIdx < 0) {
      events.emit('SECONDARY_OFFER_REJECTED', { reason: '尚未 IPO，无法增发' });
      return;
    }
    const ipo = current.fundingRounds[ipoIdx];
    if (!ipo.terms.stockPrice || !ipo.terms.sharesOutstanding) {
      events.emit('SECONDARY_OFFER_REJECTED', { reason: 'IPO 数据异常，缺少股价或流通股信息' });
      return;
    }
    if (this.amountMillions <= 0) {
      events.emit('SECONDARY_OFFER_REJECTED', { reason: '增发金额必须 > 0' });
      return;
    }

    const price = ipo.terms.stockPrice;
    const shares = ipo.terms.sharesOutstanding;
    const newShares = Math.round((this.amountMillions * 1_000_000) / price);

    // 上限检查
    if (newShares > shares * SECONDARY_OFFER_MAX_RATIO) {
      events.emit('SECONDARY_OFFER_REJECTED', {
        reason: `增发股数 ${newShares.toLocaleString()} 超过流通股的 ${SECONDARY_OFFER_MAX_RATIO * 100}% 上限`,
      });
      return;
    }

    const proceeds = newShares * price * (1 - SECONDARY_OFFER_DISCOUNT);
    // 稀释导致股价下跌：跌幅 = newShares / (shares + newShares) * 0.5（部分消化）
    const priceDropRatio = (newShares / (shares + newShares)) * 0.5;
    const newPrice = Math.max(0.1, price * (1 - priceDropRatio));

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + proceeds;
      draft.fundingRounds[ipoIdx].terms.sharesOutstanding = shares + newShares;
      draft.fundingRounds[ipoIdx].terms.stockPrice = newPrice;
    });

    events.emit(
      'SECONDARY_OFFER_COMPLETED',
      newShares,
      proceeds,
      newPrice,
    );
  }
}

/**
 * 股票回购（Stock Buyback）
 *
 * 玩家在 IPO 后可使用资金回购股票，提升每股收益与股价。
 * - 回购股数 = Math.round(amount * 1_000_000 / currentStockPrice)
 * - 股价即时上涨 1-3%（供需 + 每股收益提升）
 * - 单次回购上限：流通股的 10%
 * - 需要资金充足
 */
const BUYBACK_MAX_RATIO = 0.1;

export class BuybackStockCommand implements Command {
  /**
   * @param amountMillions 回购预算（百万美元）
   */
  constructor(private amountMillions: number) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    const ipoIdx = current.fundingRounds.findIndex((r) => r.type === 'ipo' && r.active);
    if (ipoIdx < 0) {
      events.emit('BUYBACK_REJECTED', { reason: '尚未 IPO，无法回购' });
      return;
    }
    const ipo = current.fundingRounds[ipoIdx];
    if (!ipo.terms.stockPrice || !ipo.terms.sharesOutstanding) {
      events.emit('BUYBACK_REJECTED', { reason: 'IPO 数据异常，缺少股价或流通股信息' });
      return;
    }
    if (this.amountMillions <= 0) {
      events.emit('BUYBACK_REJECTED', { reason: '回购金额必须 > 0' });
      return;
    }

    const price = ipo.terms.stockPrice;
    const shares = ipo.terms.sharesOutstanding;
    const cost = this.amountMillions * 1_000_000;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('BUYBACK_REJECTED', { reason: '资金不足', cost, funds });
      return;
    }

    const buybackShares = Math.round(cost / price);
    if (buybackShares > shares * BUYBACK_MAX_RATIO) {
      events.emit('BUYBACK_REJECTED', {
        reason: `回购股数 ${buybackShares.toLocaleString()} 超过流通股的 ${BUYBACK_MAX_RATIO * 100}% 上限`,
      });
      return;
    }
    if (buybackShares >= shares) {
      events.emit('BUYBACK_REJECTED', { reason: '回购后流通股不得为 0' });
      return;
    }

    // 回购导致股价上涨：涨幅 = buybackShares / shares * 0.6（每股收益提升的折现效应）
    const priceGainRatio = (buybackShares / shares) * 0.6;
    const newPrice = price * (1 + priceGainRatio);

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - cost;
      draft.fundingRounds[ipoIdx].terms.sharesOutstanding = shares - buybackShares;
      draft.fundingRounds[ipoIdx].terms.stockPrice = newPrice;
    });

    events.emit(
      'BUYBACK_COMPLETED',
      buybackShares,
      cost,
      newPrice,
    );
  }
}

// ============================================================
// 辅助
// ============================================================

export function createDefaultOperations() {
  return {
    dailyRevenue: 0,
    tokenRevenue: 0,
    userChurnRate: 0.0007,
    markets: [] as {
      regionId: string;
      regionName: string;
      dailyRevenue: number;
      marketShare: number;
      pricePerMillion: number;
      competitors: { name: string; share: number; capabilityScore: number }[];
    }[],
    tokenPricing: {
      pricePerMillion: 0.01,
      inferenceAllocation: 0.1, // 设计 #2：默认 10% 算力用于推理，提供早期小额收入
      qualityDowngrade: 0,
    },
    deception: {
      downgradeLevel: 0,
      stealUserData: false,
      skipSafetyTesting: false,
      detectionProbability: 0,
      totalDeceptions: 0,
    },
    boardMissions: [] as BoardMission[],
  };
}
