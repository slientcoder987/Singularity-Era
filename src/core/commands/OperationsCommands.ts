import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { FundingType, BoardMission } from '../entities/Operations';
import { calcValuation } from '../utils/marketCalc';

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

    // 计算估值
    const annualRevenue = (current.operations?.dailyRevenue ?? 0) * 365;
    const bestCap = current.models.length > 0
      ? Math.max(...current.models.map((m) => m.baseScore))
      : 0;
    const valuation = calcValuation(annualRevenue, bestCap, current.headquartersRegionId);

    // 各类型金额比例
    const typeMultiplier: Record<FundingType, number> = {
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
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.tokenPricing.pricePerMillion = this.pricePerMillion;
      draft.operations.tokenPricing.inferenceAllocation = this.inferenceAllocation;
    });
    events.emit('TOKEN_PRICING_UPDATED', this.pricePerMillion, this.inferenceAllocation);
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
      inferenceAllocation: 0,
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
