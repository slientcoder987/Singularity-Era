/**
 * OperationsSystem
 *
 * 每日运营系统：
 * - 市场收入计算与入账
 * - 用户流失
 * - 欺骗检测
 * - 董事会指令过期检查
 * - IPO 股价波动
 * - 对赌协议进度检查
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { calcTotalRevenue, calcUserChurn } from '../utils/marketCalc';
import { COMPUTE_CARD_SPECS } from '../config/computeCards';
import { getStaffRevenueMultiplier, calcMoraleImpactFromOperations } from '../utils/crossSystemUtils';
import { clamp } from '../utils';

export class OperationsSystem implements System {
  name = 'OperationsSystem';

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();
    const ops = current.operations;
    if (!ops) return;

    // ---- 市场收入 ----
    const { dailyRevenue, regionBreakdown } = calcTotalRevenue(
      current.operatingRegionIds,
      current.models,
    );

    // 降智影响收入
    const qualityFactor = 1 - ops.deception.downgradeLevel * 0.15;
    const actualRevenue = dailyRevenue * qualityFactor;

    // Token 售卖收入
    const tokenRevenue = calcTokenRevenue(current);

    // 用户流失
    const bestCap = current.models.length > 0
      ? Math.max(...current.models.map((m) => m.baseScore))
      : 0;
    const churnRate = calcUserChurn(ops.deception.downgradeLevel, bestCap);

    // ---- IPO 股价波动 ----
    let stockUpdate = null;
    const ipo = current.fundingRounds.find((r) => r.type === 'ipo' && r.active);
    if (ipo && ipo.terms.stockPrice) {
      const volatility = 0.03;
      const drift = (actualRevenue > 0 ? 0.001 : -0.002);
      const random = (Math.random() - 0.5) * 2 * volatility;
      const newsImpact = ops.deception.detectionProbability > 0.3 ? -0.05 : 0;
      const newPrice = Math.max(0.1, ipo.terms.stockPrice * (1 + drift + random + newsImpact));
      stockUpdate = { old: ipo.terms.stockPrice, new: newPrice };
    }

    // ★ 捕获前日收入（state.update 之前），避免士气对比使用当天值
    const prevDailyRevenue = current.operations?.dailyRevenue ?? 0;

    state.update((draft) => {
      if (!draft.operations) return;

      // 收入入账
      const staffRevMult = getStaffRevenueMultiplier(draft);
      const totalIncome = (actualRevenue + tokenRevenue) * staffRevMult;
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + totalIncome;
      draft.operations.dailyRevenue = actualRevenue * staffRevMult;
      draft.operations.tokenRevenue = tokenRevenue;

      // ★ 收入影响员工士气（对比今日 vs 昨日）
      const moraleImpact = calcMoraleImpactFromOperations(draft.operations.dailyRevenue, prevDailyRevenue);
      if (moraleImpact !== 0) {
        draft.riskState.employeeMorale = clamp(draft.riskState.employeeMorale + moraleImpact, 0, 100);
      }

      draft.operations.userChurnRate = churnRate;
      draft.operations.markets = regionBreakdown.map((r) => ({
        regionId: r.regionId,
        regionName: r.regionName,
        dailyRevenue: r.dailyRevenue * qualityFactor,
        marketShare: r.marketShare,
        pricePerMillion: r.pricePerMillion,
        competitors: r.competitors,
      }));

      // 用户流失 → 声誉损失
      if (churnRate > 0.002) {
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - churnRate * 10);
      }

      // 欺骗检测
      if (draft.operations.deception.downgradeLevel > 0 && Math.random() < draft.operations.deception.detectionProbability) {
        draft.operations.deception.totalDeceptions++;
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 15);
        draft.riskState.trustDebt += 1;
        events.emit('DECEPTION_EXPOSED', draft.operations.deception.downgradeLevel);
      }

      // 偷数据 → 每日累计 legal_debt
      if (draft.operations.deception.stealUserData) {
        draft.riskState.legalDebt += 0.1;
        draft.riskState.trustDebt += 0.05;
        // 自动加到数据集（灰色数据）
        const ds = draft.datasets[0];
        if (ds) {
          ds.totalTokens += 0.5;
          ds.effectiveTokens += 0.5 * 0.9; // 用户数据质量高
        }
      }

      // 股价更新
      if (stockUpdate && ipo) {
        const ipoIndex = draft.fundingRounds.findIndex((r) => r.id === ipo.id);
        if (ipoIndex >= 0 && draft.fundingRounds[ipoIndex].terms.stockPrice) {
          draft.fundingRounds[ipoIndex].terms.stockPrice = stockUpdate.new;
        }
      }

      // 对赌检查
      for (const round of draft.fundingRounds) {
        if (!round.active) continue;
        if (round.type !== 'venture_capital') continue;
        if (!round.terms.vamDeadlineDays) continue;
        const elapsed = draft.date - round.completedAt;
        if (elapsed >= round.terms.vamDeadlineDays) {
          const revenueTarget = round.terms.vamRevenueTarget ?? Infinity;
          const annualRev = draft.operations.dailyRevenue * 365;
          if (annualRev < revenueTarget) {
            round.active = false;
            events.emit('VAM_FAILED', round.investorName, round.terms.vamDilutionPercent);
          }
        }
      }

      // 董事会指令过期
      for (const mission of draft.operations.boardMissions) {
        if (mission.status !== 'accepted') continue;
        if (mission.deadline > 0 && draft.date > mission.deadline) {
          mission.status = 'failed';
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
          events.emit('MISSION_FAILED', mission.title);
        }
      }
    });

    if (stockUpdate) {
      events.emit('STOCK_PRICE_CHANGED', stockUpdate.old, stockUpdate.new);
    }
  }
}

/** 计算 Token 售卖收入 */
function calcTokenRevenue(current: ReturnType<GameState['read']>): number {
  const ops = current.operations;
  if (!ops) return 0;

  const pricing = ops.tokenPricing;
  if (pricing.inferenceAllocation <= 0) return 0;

  // ★ Bug #6 修复：按实际卡型号查询 TFLOPS，而非硬编码 500
  const specMap = new Map(COMPUTE_CARD_SPECS.map((s) => [s.resourceId, s.tflopsPerCard]));
  const totalTFLOPS = current.serverNodes.reduce((sum, node) => {
    let nodeTflops = 0;
    for (const cardUid of node.installedCards) {
      for (const modelId of Object.keys(current.resourceMeta)) {
        const pool = current.resourceMeta[modelId] as any[];
        const card = pool?.find((c: any) => c.uid === cardUid);
        if (card && card.status === 'online') {
          nodeTflops += specMap.get(modelId) ?? 500; // 未知型号回退 500
          break;
        }
      }
    }
    // 如果 installedCards 为空但 slotCount > 0，回退到 slotCount 估算
    if (nodeTflops === 0 && node.slotCount > 0) {
      nodeTflops = node.slotCount * 500;
    }
    return sum + nodeTflops;
  }, 0);

  const inferenceTFLOPS = totalTFLOPS * pricing.inferenceAllocation;
  const tokensPerTFLOPS = 100000; // 1 TFLOPS·天 ≈ 100K tokens
  const dailyTokens = inferenceTFLOPS * tokensPerTFLOPS;
  const dailyRevenue = (dailyTokens / 1_000_000) * pricing.pricePerMillion;

  return dailyRevenue;
}
