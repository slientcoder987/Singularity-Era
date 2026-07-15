/**
 * 激进操作命令
 *
 * 收购、挖角风暴、袭击、黑客、股权渗透等高风险高回报操作。
 * 所有操作都有暴露风险，暴露后法律毁灭/声望归零甚至强制结束。
 *
 * 金额约定：命令构造函数的金额参数均为「实际美元」，
 * 竞争对手的 funds/burnRate 则存储为「百万美元 (M)」。
 * 本文件内部统一换算。
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { CompetitorState } from '../entities/Competitor';
import type { ExternalCorp } from '../entities/Competitor';

/** 1M = 1,000,000 */
const M = 1_000_000;

/**
 * 读取 competitorStates 的本地可变副本索引。
 * 注意：不能直接修改 state.read() 返回的 frozen 对象，
 * 所有变更必须通过 state.update(draft => ...) 执行。
 */
function findComp(state: GameState, competitorId: string): { comp: CompetitorState; idx: number } | null {
  const current = state.read();
  const competitors = (current as any).competitorStates as CompetitorState[] | undefined;
  if (!competitors) return null;
  const idx = competitors.findIndex((c) => c.id === competitorId);
  if (idx < 0) return null;
  return { comp: competitors[idx], idx };
}

/**
 * 读取 externalCorps 的本地可变副本索引。
 */
function findCorp(state: GameState, corpId: string): { corp: ExternalCorp; idx: number } | null {
  const current = state.read();
  const corps = (current as any).externalCorps as ExternalCorp[] | undefined;
  if (!corps) return null;
  const idx = corps.findIndex((c) => c.id === corpId);
  if (idx < 0) return null;
  return { corp: corps[idx], idx };
}


// ============================================================
// 收购竞争对手
// ============================================================

export class AcquireCompetitorCommand implements Command {
  constructor(
    private competitorId: string,
    private offerPrice: number, // 实际美元
  ) {}

  execute(state: GameState, events: EventBus): void {
    const found = findComp(state, this.competitorId);
    if (!found) {
      events.emit('ACQUIRE_FAILED', this.competitorId, '竞争对手不存在');
      return;
    }
    const { comp } = found;

    // 估值 (comp.funds 单位为 M)
    const avgCap = Object.values(comp.capabilities).reduce((s, v) => s + v, 0) / 16;
    const valuation = (comp.funds * 10 + comp.computeUnits * 0.5 + comp.headcount * 0.2 + avgCap * 2) * M;
    const priceRatio = this.offerPrice / valuation;
    const infiltrationBonus = comp.infiltrationLevel * 0.1;
    const successChance = Math.min(0.95, 0.2 + priceRatio * 0.5 + infiltrationBonus);

    const current = state.read();
    const funds = current.resources['funds'] ?? 0;
    if (funds < this.offerPrice) {
      events.emit('ACQUIRE_FAILED', this.competitorId, '资金不足');
      return;
    }

    const roll = Math.random();
    if (roll > successChance) {
      // 尽调费不退
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.offerPrice * 0.1;
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 2);
      });
      events.emit('ACQUIRE_FAILED', this.competitorId, '目标拒绝报价');
      return;
    }

    // 成功 — comp.funds 是 M，需要 × M
    const compFundsActual = comp.funds * M;
    const compComputeUnits = Math.floor(comp.computeUnits * 0.8);

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.offerPrice + compFundsActual;
      draft.resources['compute_h100'] = (draft.resources['compute_h100'] ?? 0) + compComputeUnits;
      // 从竞争列表移除
      const competitors = (draft as any).competitorStates as CompetitorState[];
      const idx = competitors.findIndex((c) => c.id === this.competitorId);
      if (idx >= 0) competitors.splice(idx, 1);
    });

    events.emit('ACQUIRE_SUCCESS', comp.name, this.offerPrice);
  }
}


// ============================================================
// 挖角风暴
// ============================================================

export class PoachTalentCommand implements Command {
  constructor(
    private competitorId: string,
    private budget: number, // 实际美元
  ) {}

  execute(state: GameState, events: EventBus): void {
    const found = findComp(state, this.competitorId);
    if (!found) {
      events.emit('POACH_FAILED', this.competitorId, '目标不存在');
      return;
    }
    const { comp } = found;

    const current = state.read();
    const funds = current.resources['funds'] ?? 0;
    if (funds < this.budget) {
      events.emit('POACH_FAILED', this.competitorId, '资金不足');
      return;
    }

    const budgetM = this.budget / M;
    const baseChance = Math.min(0.8, budgetM / 100);
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

    const poachedResearchers = Math.floor(
      comp.coreResearchers * 0.15 * (1 + comp.infiltrationLevel * 0.5),
    );
    const poachedHeadcount = Math.floor(
      comp.headcount * 0.05 * (1 + comp.infiltrationLevel * 0.3),
    );

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.budget;
      // 更新竞争对手（draft 内修改）
      const competitors = (draft as any).competitorStates as CompetitorState[];
      const c = competitors.find((x) => x.id === this.competitorId);
      if (c) {
        c.coreResearchers = Math.max(1, c.coreResearchers - poachedResearchers);
        c.headcount = Math.max(1, c.headcount - poachedHeadcount);
        c.trainingProgress = Math.max(0, c.trainingProgress - 15);
      }
    });

    events.emit('POACH_SUCCESS', comp.name, poachedResearchers, poachedHeadcount);
  }
}


// ============================================================
// 袭击关键人物（极高风险）
// ============================================================

export class AssaultKeyPersonnelCommand implements Command {
  constructor(private competitorId: string) {}

  execute(state: GameState, events: EventBus): void {
    const found = findComp(state, this.competitorId);
    if (!found) return;
    const { comp } = found;

    const successChance = 0.05 + comp.infiltrationLevel * 0.03;
    const exposureChance = 0.80 - comp.infiltrationLevel * 0.10;

    const successRoll = Math.random();
    const exposureRoll = Math.random();

    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.riskState.reputation = 0;
        draft.riskState.legalDebt = 20;
        draft.riskState.employeeMorale = 0;
      });
      events.emit('ASSAULT_EXPOSED', comp.name, '创始人面临终身监禁');
      return;
    }

    if (successRoll < successChance) {
      state.update((draft) => {
        const competitors = (draft as any).competitorStates as CompetitorState[];
        const c = competitors.find((x) => x.id === this.competitorId);
        if (c) {
          c.coreResearchers = Math.max(1, c.coreResearchers - Math.floor(c.coreResearchers * 0.5));
          c.trainingProgress = Math.max(0, c.trainingProgress - 50);
        }
      });
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
    const found = findComp(state, this.competitorId);
    if (!found) return;
    const { comp } = found;

    const successChance = 0.15 + comp.infiltrationLevel * 0.08;
    const exposureChance = 0.70 - comp.infiltrationLevel * 0.10;

    const exposureRoll = Math.random();
    const successRoll = Math.random();

    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 80);
        draft.riskState.legalDebt = 15;
        draft.riskState.trustDebt = 10;
      });
      events.emit('HACK_EXPOSED', comp.name, '国际刑事指控');
      return;
    }

    if (successRoll < successChance) {
      state.update((draft) => {
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
    private investment: number, // 实际美元
  ) {}

  execute(state: GameState, events: EventBus): void {
    const found = findCorp(state, this.corpId);
    if (!found) {
      events.emit('INFILTRATE_FAILED', this.corpId, '企业不存在');
      return;
    }
    const { corp } = found;

    const current = state.read();
    const funds = current.resources['funds'] ?? 0;
    if (funds < this.investment) {
      events.emit('INFILTRATE_FAILED', this.corpId, '资金不足');
      return;
    }

    // 渗透难度：每个 difficulty 点需要 $50M = 50_000_000 投资才能升 1% 股权
    const equityGained = this.investment / (50 * M * corp.infiltrationDifficulty);
    const newEquity = Math.min(1, corp.playerEquity + equityGained);

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.investment;
      // 更新外部企业
      const corps = (draft as any).externalCorps as ExternalCorp[];
      const c = corps.find((x) => x.id === this.corpId);
      if (c) {
        c.playerEquity = newEquity;
        if (c.industry === 'gpu') {
          c.effects.gpuDiscount = Math.min(0.5, newEquity * 0.5);
          c.effects.gpuPriority = Math.min(1, newEquity * 2);
        } else if (c.industry === 'cloud') {
          c.effects.cloudDiscount = Math.min(0.5, newEquity * 0.5);
        } else if (c.industry === 'defense') {
          c.effects.defenseAccess = newEquity > 0.15;
        }
      }
    });

    events.emit('INFILTRATE_SUCCESS', corp.name, this.investment, newEquity);
  }
}
