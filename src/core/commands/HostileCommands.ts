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
import { StaffRole } from '../entities/Employee';

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
      // BUG-20 修复：使用通用算力资源（TFLOPS），而非硬编码 H100
      // 竞争对手硬件未知，收购后折算为等效算力增量
      const tflopsGain = compComputeUnits * 500; // 每 unit ≈ 500 TFLOPS（1 H100）
      draft.resources['compute_power'] = (draft.resources['compute_power'] ?? 0) + tflopsGain;
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

    // 挖角仅获得 1 名核心研究员（对方的关键人才），而非批量低等级员工
    const poachedResearchers = 1;
    const poachedHeadcount = Math.floor(
      comp.headcount * 0.05 * (1 + comp.infiltrationLevel * 0.3),
    );

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - this.budget;
      // 更新竞争对手（draft 内修改）：失去关键人才影响较大
      const competitors = (draft as any).competitorStates as CompetitorState[];
      const c = competitors.find((x) => x.id === this.competitorId);
      if (c) {
        c.coreResearchers = Math.max(1, c.coreResearchers - 1);
        c.headcount = Math.max(1, c.headcount - poachedHeadcount);
        c.trainingProgress = Math.max(0, c.trainingProgress - 15);
      }

      // 检查核心员工上限（每种角色最多 CORE_EMPLOYEE_CAP_PER_ROLE 人）
      const researcherCount = draft.employees.filter((e) => e.role === StaffRole.RESEARCHER).length;
      const CORE_CAP = 10;

      if (researcherCount < CORE_CAP) {
        // 高级人才命名（更有辨识度）
        const eliteNames = ['吴恩远', '陈天石', '李明达', '赵思齐', '刘鸿儒',
          '王知远', '张启明', '杨致新', '黄尚文', 'Rafael'];
        const name = eliteNames[Math.floor(Math.random() * eliteNames.length)];
        const suffix = Math.random().toString(36).slice(2, 5);
        // 8-10 级高级研究员，对应属性上限更高
        const level = 8 + Math.floor(Math.random() * 3);
        draft.employees.push({
          id: `poached-${draft.date}-${suffix}`,
          name: `${name} (${comp.name}挖角)`,
          role: StaffRole.RESEARCHER,
          attributes: {
            intelligence: 65 + Math.floor(Math.random() * 30),
            creativity: 55 + Math.floor(Math.random() * 35),
            leadership: 30 + Math.floor(Math.random() * 40),
            stamina: 40 + Math.floor(Math.random() * 40),
            charisma: 25 + Math.floor(Math.random() * 40),
          },
          skills: [],
          skillPoints: level - 3, // 高等级自带技能点
          level,
          salary: 400_000 + Math.random() * 600_000, // 高级人才薪资
          loyalty: 35 + Math.random() * 25, // 挖来的人忠诚度偏低
          fatigue: 10 + Math.random() * 15,
          status: 'idle',
          hireDay: draft.date,
          experience: 300 + Math.random() * 3000,
        });
      }
      // 普通员工入池（不受核心上限限制）
      if (poachedHeadcount > 0) {
        draft.resources['staff_data_engineer'] = (draft.resources['staff_data_engineer'] ?? 0)
          + Math.floor(poachedHeadcount * 0.4);
        draft.resources['staff_system_engineer'] = (draft.resources['staff_system_engineer'] ?? 0)
          + Math.floor(poachedHeadcount * 0.3);
        draft.resources['staff_product_manager'] = (draft.resources['staff_product_manager'] ?? 0)
          + Math.floor(poachedHeadcount * 0.3);
      }
    });

    events.emit('POACH_SUCCESS', comp.name, poachedResearchers, poachedHeadcount);
  }
}


// ============================================================
// 袭击关键人物（极高风险）
// ============================================================

/** 袭击关键人物单次成本（美元） */
const ASSAULT_KEY_PERSONNEL_COST = 10_000_000;

export class AssaultKeyPersonnelCommand implements Command {
  constructor(private competitorId: string) {}

  execute(state: GameState, events: EventBus): void {
    const found = findComp(state, this.competitorId);
    // BUG-18 修复：竞争对手不存在时给出明确反馈，而非静默返回
    if (!found) {
      events.emit('ASSAULT_FAILED', this.competitorId, '目标已不存在（可能已被收购或破产）');
      return;
    }
    const { comp } = found;

    // BUG-8 修复：袭击需要支付黑市费用，检查资金
    const funds = state.read().resources['funds'] ?? 0;
    if (funds < ASSAULT_KEY_PERSONNEL_COST) {
      events.emit('ASSAULT_REJECTED', `资金不足，需要 $${ASSAULT_KEY_PERSONNEL_COST.toLocaleString()}`);
      return;
    }

    const successChance = 0.05 + comp.infiltrationLevel * 0.03;
    const exposureChance = 0.80 - comp.infiltrationLevel * 0.10;

    const successRoll = Math.random();
    const exposureRoll = Math.random();

    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - ASSAULT_KEY_PERSONNEL_COST;
        draft.riskState.reputation = 0;
        draft.riskState.legalDebt = 20;
        draft.riskState.employeeMorale = 0;
      });
      events.emit('ASSAULT_EXPOSED', comp.name, '创始人面临终身监禁');
      return;
    }

    if (successRoll < successChance) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - ASSAULT_KEY_PERSONNEL_COST;
        const competitors = (draft as any).competitorStates as CompetitorState[];
        const c = competitors.find((x) => x.id === this.competitorId);
        if (c) {
          c.coreResearchers = Math.max(1, c.coreResearchers - Math.floor(c.coreResearchers * 0.5));
          c.trainingProgress = Math.max(0, c.trainingProgress - 50);
        }
      });
      events.emit('ASSAULT_SUCCESS', comp.name);
    } else {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - ASSAULT_KEY_PERSONNEL_COST;
      });
      events.emit('ASSAULT_FAILED', comp.name);
    }
  }
}


// ============================================================
// 黑客窃取参数（极高风险）
// ============================================================

/** 黑客窃取参数单次成本（美元） */
const HACK_PARAMETERS_COST = 15_000_000;
/** BUG-9 修复：偷来的模型能力折扣（蒸馏损失） */
const STOLEN_MODEL_CAPABILITY_DISCOUNT = 0.7;

export class HackParametersCommand implements Command {
  constructor(private competitorId: string) {}

  execute(state: GameState, events: EventBus): void {
    const found = findComp(state, this.competitorId);
    // BUG-18 修复：竞争对手不存在时给出明确反馈，而非静默返回
    if (!found) {
      events.emit('HACK_FAILED', this.competitorId, '目标已不存在（可能已被收购或破产）');
      return;
    }
    const { comp } = found;

    // BUG-8 修复：黑客行动需要支付高额费用，检查资金
    const funds = state.read().resources['funds'] ?? 0;
    if (funds < HACK_PARAMETERS_COST) {
      events.emit('HACK_REJECTED', `资金不足，需要 $${HACK_PARAMETERS_COST.toLocaleString()}`);
      return;
    }

    const successChance = 0.15 + comp.infiltrationLevel * 0.08;
    const exposureChance = 0.70 - comp.infiltrationLevel * 0.10;

    const exposureRoll = Math.random();
    const successRoll = Math.random();

    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - HACK_PARAMETERS_COST;
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 80);
        draft.riskState.legalDebt = 15;
        draft.riskState.trustDebt = 10;
      });
      events.emit('HACK_EXPOSED', comp.name, '国际刑事指控');
      return;
    }

    if (successRoll < successChance) {
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - HACK_PARAMETERS_COST;
        // BUG-9 修复：偷来的模型能力打折扣（蒸馏损失），且标记 stolen 状态
        const stolenScore = Math.max(...Object.values(comp.capabilities)) * STOLEN_MODEL_CAPABILITY_DISCOUNT;
        const discountedCaps = Object.fromEntries(
          Object.entries(comp.capabilities).map(([k, v]) => [k, v * STOLEN_MODEL_CAPABILITY_DISCOUNT]),
        ) as any;
        const newModel = {
          id: `stolen-${comp.id}-${draft.date}`,
          name: `${comp.name} 参数泄漏版`,
          paramCount: 70,
          architecture: 'dense+rmsnorm+rope',
          contextLength: 8192,
          datasetId: 'leaked',
          completedAt: draft.date,
          trainingProjectId: '',
          capabilities: discountedCaps,
          rawCapabilities: discountedCaps,
          baseScore: stolenScore,
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
      state.update((draft) => {
        draft.resources['funds'] = (draft.resources['funds'] ?? 0) - HACK_PARAMETERS_COST;
      });
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
