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
import { getActiveCloudTFLOPS } from '../utils/cloudComputeUtils';
import { COMPUTE_CARD_SPECS } from '../config/computeCards';
import { getStaffRevenueMultiplier, calcMoraleImpactFromOperations } from '../utils/crossSystemUtils';
import { clamp } from '../utils';
import type { BoardMission } from '../entities/Operations';
import { REGION_MAP } from '../config/regions';

export class OperationsSystem implements System {
  name = 'OperationsSystem';

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();
    const ops = current.operations;
    if (!ops) return;

    // ---- 市场收入 ----
    // ★ 设计 #5/#6：市场收入只计算已发布模型（用户只能调用已上线的模型）
    const publishedModels = current.models.filter((m) => m.published);
    const { dailyRevenue, regionBreakdown } = calcTotalRevenue(
      current.operatingRegionIds,
      publishedModels,
    );

    // 降智影响收入
    const qualityFactor = 1 - ops.deception.downgradeLevel * 0.15;
    const actualRevenue = dailyRevenue * qualityFactor;

    // Token 售卖收入
    const tokenRevenue = calcTokenRevenue(current);

    // 用户流失：只看已发布模型（用户感知的是上线模型的能力）
    const bestCap = publishedModels.length > 0
      ? Math.max(...publishedModels.map((m) => m.baseScore))
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

    // BUG-6 修复：收集 update 内需要发射的事件，update 结束后再统一 emit
    const deferredEvents: Array<() => void> = [];

    state.update((draft) => {
      if (!draft.operations) return;

      // 收入入账
      const staffRevMult = getStaffRevenueMultiplier(draft);
      const totalIncome = (actualRevenue + tokenRevenue) * staffRevMult;
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + totalIncome;
      draft.operations.dailyRevenue = actualRevenue * staffRevMult;
      draft.operations.tokenRevenue = tokenRevenue * staffRevMult; // ★ Bug #4 修复：与入账金额一致

      // ★ 收入影响员工士气（对比今日 vs 昨日）
      const moraleImpact = calcMoraleImpactFromOperations(draft.operations.dailyRevenue, prevDailyRevenue);
      if (moraleImpact !== 0) {
        draft.riskState.employeeMorale = clamp(draft.riskState.employeeMorale + moraleImpact, 0, 100);
      }

      // ★ 设计 #5：已发布模型累计发布天数（社区反馈降噪用）
      for (const m of draft.models) {
        if (m.published) {
          m.daysSincePublished += 1;
        }
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
        const lvl = draft.operations.deception.downgradeLevel;
        deferredEvents.push(() => events.emit('DECEPTION_EXPOSED', lvl));
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
            const investorName = round.investorName;
            const dilution = round.terms.vamDilutionPercent;
            deferredEvents.push(() => events.emit('VAM_FAILED', investorName, dilution));
          }
        }
      }

      // 董事会指令过期
      for (const mission of draft.operations.boardMissions) {
        if (mission.status !== 'accepted') continue;
        if (mission.deadline > 0 && draft.date > mission.deadline) {
          mission.status = 'failed';
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
          const title = mission.title;
          deferredEvents.push(() => events.emit('MISSION_FAILED', title));
        }
      }

      // BUG-13 修复：检查 accepted 任务的完成条件
      for (const mission of draft.operations.boardMissions) {
        if (mission.status !== 'accepted') continue;
        let completed = false;
        switch (mission.type) {
          case 'achieve_revenue': {
            const dailyRev = draft.operations.dailyRevenue + (draft.operations.tokenRevenue ?? 0);
            if (dailyRev >= (mission.targetValue ?? Infinity)) completed = true;
            break;
          }
          case 'hire_staff': {
            const totalStaff = draft.employees.length
              + (draft.resources['staff_researcher'] ?? 0)
              + (draft.resources['staff_data_engineer'] ?? 0)
              + (draft.resources['staff_system_engineer'] ?? 0)
              + (draft.resources['staff_product_manager'] ?? 0)
              + (draft.resources['staff_legal_pr'] ?? 0);
            if (totalStaff >= (mission.targetHeadcount ?? Infinity)) completed = true;
            break;
          }
          case 'enter_market': {
            if (mission.targetRegion && draft.operatingRegionIds.includes(mission.targetRegion)) {
              completed = true;
            }
            break;
          }
          case 'launch_domain_model': {
            const targetCap = mission.targetCapability;
            const targetVal = mission.targetValue ?? Infinity;
            if (targetCap) {
              const best = draft.models
                .filter((m) => m.published)
                .reduce((max, m) => Math.max(max, (m.capabilities as any)[targetCap] ?? 0), 0);
              if (best >= targetVal) completed = true;
            }
            break;
          }
          case 'cut_safety':
            // cut_safety 由欺骗操作触发，不在此自动完成
            break;
        }
        if (completed) {
          mission.status = 'completed';
          draft.resources['funds'] = (draft.resources['funds'] ?? 0) + mission.rewardFunds * 1_000_000;
          draft.riskState.reputation = Math.min(100, draft.riskState.reputation + mission.rewardReputation);
          const title = mission.title;
          const reward = mission.rewardFunds;
          deferredEvents.push(() => events.emit('MISSION_COMPLETED', title, reward));
        }
      }

      // BUG-13 修复：每 30 天生成新董事会指令（仅当 pending 任务 < 3 时）
      const pendingCount = draft.operations.boardMissions.filter((m) => m.status === 'pending').length;
      const lastMissionDay = draft.operations.boardMissions.length > 0
        ? Math.max(...draft.operations.boardMissions.map((m) => m.issuedAt))
        : -999;
      if (pendingCount < 3 && draft.date - lastMissionDay >= 30 && draft.fundingRounds.length > 0) {
        const newMission = this.generateBoardMission(draft);
        if (newMission) {
          draft.operations.boardMissions.push(newMission);
          const title = newMission.title;
          const from = newMission.from;
          deferredEvents.push(() => events.emit('MISSION_OFFERED', title, from));
        }
      }
    });

    // BUG-6 修复：update 提交后再统一发射事件，监听器可读到最新状态
    for (const emit of deferredEvents) emit();

    if (stockUpdate) {
      events.emit('STOCK_PRICE_CHANGED', stockUpdate.old, stockUpdate.new);
    }
  }

  /**
   * BUG-13 修复：根据公司当前状态生成董事会指令。
   * 选择与公司发展阶段相关的使命类型，奖励和惩罚随难度递增。
   */
  private generateBoardMission(draft: import('../GameState').GameData): BoardMission | null {
    // 从活跃融资轮中选取一个投资者作为发起人
    const activeRounds = draft.fundingRounds.filter((r) => r.active);
    if (activeRounds.length === 0) return null;
    const sponsor = activeRounds[Math.floor(Math.random() * activeRounds.length)];

    // 根据公司规模选择使命类型
    const dailyRev = draft.operations?.dailyRevenue ?? 0;
    const totalStaff = draft.employees.length
      + (draft.resources['staff_researcher'] ?? 0)
      + (draft.resources['staff_data_engineer'] ?? 0);

    const missionTypes: Array<'achieve_revenue' | 'hire_staff' | 'enter_market' | 'launch_domain_model'> = [];
    if (dailyRev < 5000) missionTypes.push('achieve_revenue');
    if (totalStaff < 50) missionTypes.push('hire_staff');
    if (draft.operatingRegionIds.length < 3) missionTypes.push('enter_market');
    if (draft.models.filter((m) => m.published).length < 3) missionTypes.push('launch_domain_model');

    // 无可用类型时回退到收入目标
    const chosenType = missionTypes.length > 0
      ? missionTypes[Math.floor(Math.random() * missionTypes.length)]
      : 'achieve_revenue';

    const missionId = `mission-${draft.date}-${Math.random().toString(36).slice(2, 6)}`;
    const deadline = draft.date + 60; // 默认 60 天期限

    switch (chosenType) {
      case 'achieve_revenue': {
        const target = Math.ceil(dailyRev * 2 + 1000);
        return {
          id: missionId,
          type: 'achieve_revenue',
          title: `日收入达到 $${target.toLocaleString()}`,
          description: `提升商业化能力，将日收入提升至 $${target.toLocaleString()}（含 Token 收入）`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline,
          targetValue: target,
          rewardFunds: 5 + Math.floor(target / 1000),
          rewardReputation: 3,
          penaltyDescription: '声誉 -5，投资者信心下降',
          status: 'pending',
        };
      }
      case 'hire_staff': {
        const target = totalStaff + 10;
        return {
          id: missionId,
          type: 'hire_staff',
          title: `团队规模达到 ${target} 人`,
          description: `扩张团队规模至 ${target} 人（核心 + 普通）`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline,
          targetHeadcount: target,
          rewardFunds: 3,
          rewardReputation: 2,
          penaltyDescription: '声誉 -5',
          status: 'pending',
        };
      }
      case 'enter_market': {
        // 选一个尚未进入的地区
        const allRegions = Object.keys(REGION_MAP);
        const candidate = allRegions.find((r) => !draft.operatingRegionIds.includes(r));
        if (!candidate) return null;
        const region = REGION_MAP[candidate];
        return {
          id: missionId,
          type: 'enter_market',
          title: `进入 ${region.name} 市场`,
          description: `在 ${region.name} 设立分支机构并开展业务`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline,
          targetRegion: candidate,
          rewardFunds: 8,
          rewardReputation: 5,
          penaltyDescription: '声誉 -5，错失扩张机会',
          status: 'pending',
        };
      }
      case 'launch_domain_model': {
        const capKeys = ['reasoning', 'coding', 'math', 'language'];
        const cap = capKeys[Math.floor(Math.random() * capKeys.length)];
        const currentBest = draft.models
          .filter((m) => m.published)
          .reduce((max, m) => Math.max(max, (m.capabilities as any)[cap] ?? 0), 0);
        const target = Math.ceil(currentBest + 100);
        return {
          id: missionId,
          type: 'launch_domain_model',
          title: `发布 ${cap} 能力 ≥ ${target} 的模型`,
          description: `训练并发布一个在 ${cap} 维度能力评分达到 ${target} 的模型`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline: draft.date + 90, // 模型训练需要更长时间
          targetCapability: cap,
          targetValue: target,
          rewardFunds: 10,
          rewardReputation: 8,
          penaltyDescription: '声誉 -5，技术落后于市场预期',
          status: 'pending',
        };
      }
    }
  }
}

/** 计算 Token 售卖收入 */
function calcTokenRevenue(current: ReturnType<GameState['read']>): number {
  const ops = current.operations;
  if (!ops) return 0;

  const pricing = ops.tokenPricing;
  if (pricing.inferenceAllocation <= 0) return 0;

  // ★ Bug #7 修复 + 设计 #6：只有已发布模型才能提供推理服务
  const publishedModels = current.models.filter((m) => m.published);
  if (publishedModels.length === 0) return 0;

  // 按已发布模型的最大 baseScore 缩放推理能力（模型越强，单价越高）
  const bestScore = Math.max(...publishedModels.map((m) => m.baseScore));
  const scoreFactor = Math.min(1.0, bestScore / 800); // 800 分满

  // ★ Bug #8 修复：排除正在训练的卡（assignedProjectId !== null）
  // 设计-11 说明：推理算力来自"非训练卡的空闲算力"× inferenceAllocation（默认 10%）。
  // 即玩家把所有卡分配给训练时推理收入为 0；空闲卡按比例软分配给推理，剩余算力闲置。
  // 这避免了训练与推理算力重复使用——推理消耗的是训练未占用的卡。
  const specMap = new Map(COMPUTE_CARD_SPECS.map((s) => [s.resourceId, s.tflopsPerCard]));
  const totalTFLOPS = current.serverNodes.reduce((sum, node) => {
    let nodeTflops = 0;
    for (const cardUid of node.installedCards) {
      for (const modelId of Object.keys(current.resourceMeta)) {
        const pool = current.resourceMeta[modelId] as any[];
        const card = pool?.find((c: any) => c.uid === cardUid);
        if (card && card.status === 'online' && card.assignedProjectId === null) {
          nodeTflops += specMap.get(modelId) ?? 500;
          break;
        }
      }
    }
    return sum + nodeTflops;
  }, 0);

  // BUG-2 修复：活跃云算力同样可用于推理
  const cloudTFLOPS = getActiveCloudTFLOPS(current);
  const totalInferenceTFLOPS = totalTFLOPS + cloudTFLOPS;

  const inferenceTFLOPS = totalInferenceTFLOPS * pricing.inferenceAllocation;
  // 1 TFLOPS·天 ≈ 6M tokens（基于 7B 模型推理估算）
  const tokensPerTFLOPS = 6_000_000;
  const dailyTokens = inferenceTFLOPS * tokensPerTFLOPS;
  const dailyRevenue = (dailyTokens / 1_000_000) * pricing.pricePerMillion * scoreFactor;

  return dailyRevenue;
}
