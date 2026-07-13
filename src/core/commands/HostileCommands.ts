/**
 * 激进操作命令
 *
 * 收购、挖角风暴、袭击、黑客、股权渗透等高风险高回报操作。
 * 所有操作都有暴露风险，暴露后法律毁灭/声望归零甚至强制结束。
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { CompetitorState } from '../entities/Competitor';

// ============================================================
// 收购竞争对手
// ============================================================

export class AcquireCompetitorCommand implements Command {
  constructor(
    private competitorId: string,
    private offerPrice: number, // 百万美元
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const competitorState = (current as any).competitorStates as CompetitorState[] | undefined;
    const comp = competitorState?.find((c) => c.id === this.competitorId);
    if (!comp) {
      events.emit('ACQUIRE_FAILED', this.competitorId, '竞争对手不存在');
      return;
    }

    // 检测成功率 = f(offerPrice / comp估值, 渗透等级)
    const avgCap = Object.values(comp.capabilities).reduce((s, v) => s + v, 0) / 16;
    const valuation = comp.funds * 10 + comp.computeUnits * 0.5 + comp.headcount * 0.2 + avgCap * 2;
    const priceRatio = this.offerPrice / valuation;
    const infiltrationBonus = comp.infiltrationLevel * 0.1;
    const successChance = Math.min(0.95, 0.2 + priceRatio * 0.5 + infiltrationBonus);

    const funds = current.resources['funds'] ?? 0;
    if (funds < this.offerPrice) {
      events.emit('ACQUIRE_FAILED', this.competitorId, '资金不足');
      return;
    }

    const roll = Math.random();
    if (roll > successChance) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - (this.offerPrice * 0.1); // 尽调费不退
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 2);
      });
      events.emit('ACQUIRE_FAILED', this.competitorId, '目标拒绝报价');
      return;
    }

    // 成功
    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.offerPrice;
      // 获得对方资金、算力
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + comp.funds;
      // 算力类型按通用处理
      draft.resources['compute_h100'] = (draft.resources['compute_h100'] ?? 0) + Math.floor(comp.computeUnits * 0.8);
    });

    // 从竞争列表移除
    if (competitorState) {
      const idx = competitorState.indexOf(comp);
      if (idx >= 0) competitorState.splice(idx, 1);
    }

    events.emit('ACQUIRE_SUCCESS', comp.name, this.offerPrice);
  }
}

// ============================================================
// 挖角风暴
// ============================================================

export class PoachTalentCommand implements Command {
  constructor(
    private competitorId: string,
    private budget: number, // 百万美元
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const competitorState = (current as any).competitorStates as CompetitorState[] | undefined;
    const comp = competitorState?.find((c) => c.id === this.competitorId);
    if (!comp) {
      events.emit('POACH_FAILED', this.competitorId, '目标不存在');
      return;
    }

    if ((current.resources['funds'] ?? 0) < this.budget) {
      events.emit('POACH_FAILED', this.competitorId, '资金不足');
      return;
    }

    // 成功率：预算越高，渗透等级越高，越容易
    const baseChance = Math.min(0.8, this.budget / 100);
    const infiltrationBonus = comp.infiltrationLevel * 0.15;
    const successChance = Math.min(0.95, baseChance + infiltrationBonus);

    const roll = Math.random();
    if (roll > successChance) {
      const detectionChance = 0.3;
      if (Math.random() < detectionChance) {
        state.update((draft) => {
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
          draft.riskState.legalDebt += 0.5;
        });
        events.emit('POACH_EXPOSED', comp.name);
      }
      events.emit('POACH_FAILED', comp.name, '对方反制措施成功');
      return;
    }

    // 获取研究员
    const poachedResearchers = Math.floor(
      comp.coreResearchers * 0.15 * (1 + comp.infiltrationLevel * 0.5),
    );
    const poachedHeadcount = Math.floor(
      comp.headcount * 0.05 * (1 + comp.infiltrationLevel * 0.3),
    );

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.budget;
    });

    // 减少竞争对手
    comp.coreResearchers = Math.max(1, comp.coreResearchers - poachedResearchers);
    comp.headcount = Math.max(1, comp.headcount - poachedHeadcount);
    // 内部动荡 → 训练进度倒退
    comp.trainingProgress = Math.max(0, comp.trainingProgress - 15);

    events.emit('POACH_SUCCESS', comp.name, poachedResearchers, poachedHeadcount);
  }
}

// ============================================================
// 袭击关键人物（极高风险）
// ============================================================

export class AssaultKeyPersonnelCommand implements Command {
  constructor(private competitorId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const competitorState = (current as any).competitorStates as CompetitorState[] | undefined;
    const comp = competitorState?.find((c) => c.id === this.competitorId);
    if (!comp) return;

    // 成功率极低：5% + 渗透等级×3%
    const successChance = 0.05 + comp.infiltrationLevel * 0.03;
    // 暴露率极高：80% - 渗透等级×10%
    const exposureChance = 0.80 - comp.infiltrationLevel * 0.10;

    const successRoll = Math.random();
    const exposureRoll = Math.random();

    // 暴露 → 游戏有可能强制结束
    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.riskState.reputation = 0;
        draft.riskState.legalDebt = 20; // 触发致命法律事件
        draft.riskState.employeeMorale = 0;
      });
      events.emit('ASSAULT_EXPOSED', comp.name, '创始人面临终身监禁');
      // 强制结束由事件处理决定
      return;
    }

    // 成功（未被发现）
    if (successRoll < successChance) {
      comp.coreResearchers = Math.max(1, comp.coreResearchers - Math.floor(comp.coreResearchers * 0.5));
      comp.trainingProgress = Math.max(0, comp.trainingProgress - 50);
      events.emit('ASSAULT_SUCCESS', comp.name);
    } else {
      events.emit('ASSAULT_FAILED', comp.name);
    }
  }
}

// ============================================================
// 黑客窃取参数（极高风险）
// ============================================================

export class HackParametersCommand implements Command {
  constructor(private competitorId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const competitorState = (current as any).competitorStates as CompetitorState[] | undefined;
    const comp = competitorState?.find((c) => c.id === this.competitorId);
    if (!comp) return;

    // 成功率：15% + 渗透等级×8%
    const successChance = 0.15 + comp.infiltrationLevel * 0.08;
    // 暴露率：70% - 渗透等级×10%
    const exposureChance = 0.70 - comp.infiltrationLevel * 0.10;

    const exposureRoll = Math.random();
    const successRoll = Math.random();

    // 暴露 → 法律毁灭
    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 80);
        draft.riskState.legalDebt = 15;
        draft.riskState.trustDebt = 10;
      });
      events.emit('HACK_EXPOSED', comp.name, '国际刑事指控');
      return;
    }

    // 成功 → 直接获得完整模型权重
    if (successRoll < successChance) {
      state.update((draft) => {
        // 创建一个新模型，能力 = 竞争对手的能力
        const newModel = {
          id: `stolen-${comp.id}-${draft.date}`,
          name: `${comp.name} 参数泄漏版`,
          paramCount: 70,
          architecture: 'dense+rmsnorm+rope',
          contextLength: 8192,
          datasetId: 'leaked',
          completedAt: draft.date,
          trainingProjectId: '',
          capabilities: { ...comp.capabilities } as any,
          rawCapabilities: { ...comp.capabilities } as any,
          baseScore: Math.max(...Object.values(comp.capabilities)),
          daysSincePublished: 0,
          evaluationResearchers: 0,
          published: false,
          version: 1,
          audited: false,
          usedInResearch: false,
          noiseSeed: Math.floor(Math.random() * 2147483647),
        };
        draft.models.push(newModel);
      });
      events.emit('HACK_SUCCESS', comp.name);
    } else {
      events.emit('HACK_FAILED', comp.name);
    }
  }
}

// ============================================================
// 股权渗透（外部企业）
// ============================================================

export class InfiltrateCorpCommand implements Command {
  constructor(
    private corpId: string,
    private investment: number, // 百万美元
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const externalCorps = (current as any).externalCorps as any[] | undefined;
    const corp = externalCorps?.find((c: any) => c.id === this.corpId);
    if (!corp) {
      events.emit('INFILTRATE_FAILED', this.corpId, '企业不存在');
      return;
    }

    if ((current.resources['funds'] ?? 0) < this.investment) {
      events.emit('INFILTRATE_FAILED', this.corpId, '资金不足');
      return;
    }

    // 渗透难度：每个 difficulty 点需要 $50M 投资才能升 1% 股权
    const equityGained = this.investment / (50 * corp.infiltrationDifficulty);
    const newEquity = Math.min(1, corp.playerEquity + equityGained);

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.investment;
    });

    // 更新外部企业
    if (externalCorps) {
      const idx = externalCorps.indexOf(corp);
      if (idx >= 0) {
        externalCorps[idx].playerEquity = newEquity;

        // 根据行业提供效果
        if (corp.industry === 'gpu') {
          externalCorps[idx].effects.gpuDiscount = Math.min(0.5, newEquity * 0.5);
          externalCorps[idx].effects.gpuPriority = Math.min(1, newEquity * 2);
        } else if (corp.industry === 'cloud') {
          externalCorps[idx].effects.cloudDiscount = Math.min(0.5, newEquity * 0.5);
        } else if (corp.industry === 'defense') {
          externalCorps[idx].effects.defenseAccess = newEquity > 0.15;
        }
      }
    }

    events.emit('INFILTRATE_SUCCESS', corp.name, this.investment, newEquity);
  }
}
