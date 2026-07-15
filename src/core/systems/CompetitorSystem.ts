import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { CompetitorState, CompetitorIntel } from '../entities/Competitor';
import { COMPETITOR_TEMPLATES } from '../entities/Competitor';
import { updateCompetitorStates } from '../utils/marketCalc';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 每 X 天执行一次竞争对手模拟 */
const COMPETITOR_TICK_DAYS = 7;

/**
 * 设计-14：资金归零累计达到此天数后竞争对手破产退出市场。
 * 21 天 = 3 个 tick，给竞争对手充分的融资缓冲机会。
 */
const BANKRUPT_THRESHOLD_DAYS = 21;

/** 市场最少保留的竞争对手数量，避免游戏后期失去竞争 */
const MIN_ACTIVE_COMPETITORS = 2;

/** 资金事件模板 */
const FUNDING_EVENTS = [
  { name: 'SoftBank', amount: [500, 6000] },
  { name: '红杉资本', amount: [200, 2000] },
  { name: 'b16z', amount: [100, 1500] },
  { name: 'Tiger Global', amount: [300, 3000] },
  { name: 'Saudi PIF', amount: [500, 8000] },
  { name: 'Temasek', amount: [200, 2500] },
];

/** 丑闻模板 */
const SCANDAL_EVENTS = [
  { title: '数据泄露事件', desc: '用户对话数据被意外公开', fundsLoss: 100, repLoss: 10 },
  { title: '版权诉讼败诉', desc: '被法院认定训练数据侵权', fundsLoss: 200, repLoss: 15 },
  { title: '关键研究员离职', desc: '联合创始人宣布离开', fundsLoss: 50, repLoss: 8 },
  { title: '虚假宣传调查', desc: '监管机构对其基准测试声明展开调查', fundsLoss: 150, repLoss: 20 },
];

/**
 * CompetitorSystem
 *
 * 设计-5 / BUG-4 修复：系统改为无状态。
 * - 所有竞争对手状态完全由 GameState.competitorStates 承载，参与存档/读档。
 * - 每次 update 从 state 读取工作集（深拷贝避免污染 immer 冻结对象），
 *   模拟后整体写回 state。
 * - 删除私有 this.competitors，避免内存状态与存档不同步导致读档后进度丢失。
 */
export class CompetitorSystem implements System {
  name = 'CompetitorSystem';

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    let current = state.read();

    // 初始化（仅当 state 中尚无竞争对手时）
    let competitors: CompetitorState[];
    const needsInit = !current.competitorStates || current.competitorStates.length === 0;
    if (needsInit) {
      competitors = COMPETITOR_TEMPLATES.map((t) => ({
        ...t,
        capabilities: { ...t.capabilities },
        operatingRegions: [...t.operatingRegions],
        regionQualityMultiplier: { ...t.regionQualityMultiplier },
        funds: 1000 + Math.random() * 5000,
        computeUnits: 2000 + Math.random() * 15000,
        headcount: 100 + Math.random() * 2000,
        coreResearchers: 10 + Math.random() * 200,
        trainingProgress: 10 + Math.random() * 40,
        releasedModels: [],
        infiltrationLevel: 0,
        intel: [],
        releasedLastMonth: false,
        currentProject: '下一代大语言模型',
      }));

      // 预置初始模型发布
      for (const comp of competitors) {
        const score = Math.max(...Object.values(comp.capabilities));
        comp.releasedModels.push({
          name: `${comp.name}-1`,
          paramCount: 70,
          baseScore: score * 0.9,
          day: -90,
        });
      }

      // BUG-12 修复：初始化后立即写回，但不 return——
      // 继续执行同日首次模拟，避免在非 tick 日初始化时竞争对手停滞到下一个 tick。
      state.update((draft) => {
        draft.competitorStates = competitors.map((c) => ({
          ...c,
          capabilities: { ...c.capabilities },
          operatingRegions: [...c.operatingRegions],
          regionQualityMultiplier: { ...c.regionQualityMultiplier },
          releasedModels: c.releasedModels.map((m) => ({ ...m })),
          intel: c.intel.map((i) => ({ ...i })),
        }));
      });
      updateCompetitorStates(competitors);

      // 初始化日不进行模拟（首次 tick 在下一个 COMPETITOR_TICK_DAYS 倍数日）
      // 但要确保不会因非 tick 日初始化而错过当日应执行的模拟
      if (current.date % COMPETITOR_TICK_DAYS !== 0) return;
      // 若初始化日恰好是 tick 日，继续往下执行模拟
      current = state.read();
      competitors = current.competitorStates.map((c) => ({
        ...c,
        capabilities: { ...c.capabilities },
        operatingRegions: [...c.operatingRegions],
        regionQualityMultiplier: { ...c.regionQualityMultiplier },
        releasedModels: c.releasedModels.map((m) => ({ ...m })),
        intel: c.intel.map((i) => ({ ...i })),
      }));
    } else {
      // 只每 COMPETITOR_TICK_DAYS 执行一次
      if (current.date % COMPETITOR_TICK_DAYS !== 0) return;

      // 从 state 读取深拷贝工作集
      competitors = current.competitorStates.map((c) => ({
        ...c,
        capabilities: { ...c.capabilities },
        operatingRegions: [...c.operatingRegions],
        regionQualityMultiplier: { ...c.regionQualityMultiplier },
        releasedModels: c.releasedModels.map((m) => ({ ...m })),
        intel: c.intel.map((i) => ({ ...i })),
      }));
    }

    for (const comp of competitors) {
      this.simulateCompetitor(comp, current.date, events);
    }

    // ★ 检测玩家模型发布 → 竞争对手加速训练
    const playerBestCap = current.models.length > 0
      ? Math.max(...current.models.map((m) => m.baseScore))
      : 0;
    for (const comp of competitors) {
      const compBestCap = Math.max(...Object.values(comp.capabilities));
      if (playerBestCap > compBestCap * 1.2) {
        comp.trainingProgress = Math.min(100, comp.trainingProgress + 3);
        if (comp.infiltrationLevel > 0) {
          const intel: CompetitorIntel = {
            id: genId(`intel-${comp.id}-${current.date}-push`),
            competitorId: comp.id,
            type: 'training',
            title: `${comp.name} 加速训练`,
            description: `为追赶玩家模型表现，加大训练投入`,
            day: current.date,
            severity: 'warning',
          };
          comp.intel.push(intel);
          events.emit('COMPETITOR_INTEL', intel);
        }
      }
    }

    // 偶尔触发合并
    if (Math.random() < 0.05 && competitors.length >= 2) {
      this.triggerMerger(competitors, events);
    }

    // intel 数组裁剪到最近 200 条，防止无限增长
    for (const comp of competitors) {
      if (comp.intel.length > 200) {
        comp.intel = comp.intel.slice(-200);
      }
    }

    // 设计-14：破产检查——资金归零累计达 BANKRUPT_THRESHOLD_DAYS 的竞争对手退出市场
    const bankrupted: CompetitorState[] = [];
    const survivors: CompetitorState[] = [];
    for (const comp of competitors) {
      if ((comp.bankruptDays ?? 0) >= BANKRUPT_THRESHOLD_DAYS) {
        bankrupted.push(comp);
      } else {
        survivors.push(comp);
      }
    }

    // 保证市场最少保留 MIN_ACTIVE_COMPETITORS 家活跃竞争对手：
    // 当破产会让存活数低于下限时，对"排队破产"中相对健康（burnRate 较低）的几家
    // 注入紧急融资使其续命，而非真的破产。
    if (bankrupted.length > 0 && survivors.length < MIN_ACTIVE_COMPETITORS) {
      // 按 burnRate 升序（烧钱慢的更易救活），保留前若干家
      bankrupted.sort((a, b) => a.burnRate - b.burnRate);
      const needToRevive = MIN_ACTIVE_COMPETITORS - survivors.length;
      for (let i = 0; i < needToRevive && i < bankrupted.length; i++) {
        const comp = bankrupted[i];
        comp.bankruptDays = 0;
        comp.funds = comp.burnRate * 12; // 紧急注入 12 个月运营资金
        // 记录"紧急救援"情报
        comp.intel.push({
          id: genId(`intel-${comp.id}-${current.date}-bailout`),
          competitorId: comp.id,
          type: 'funding',
          title: `${comp.name} 获得紧急救助`,
          description: `通过秘密渠道获得紧急融资，避免破产`,
          day: current.date,
          severity: 'warning',
        });
        survivors.push(comp);
      }
      // 剩余真正破产的
      for (let i = needToRevive; i < bankrupted.length; i++) {
        // 真正退出，不加入 survivors
      }
    }

    // 发射破产事件（仅对真正退出市场的竞争对手）
    const trulyBankrupted = bankrupted.filter((c) => !survivors.includes(c));
    for (const comp of trulyBankrupted) {
      events.emit('COMPETITOR_BANKRUPT', comp.name, current.date);
    }

    // 写回 state（已深拷贝，安全；破产的竞争对手不写回，等同于退出市场）
    state.update((draft) => {
      draft.competitorStates = survivors.map((c) => ({
        ...c,
        capabilities: { ...c.capabilities },
        operatingRegions: [...c.operatingRegions],
        regionQualityMultiplier: { ...c.regionQualityMultiplier },
        releasedModels: c.releasedModels.map((m) => ({ ...m })),
        intel: c.intel.map((i) => ({ ...i })),
      }));
    });

    // 同步到 marketCalc 缓存
    updateCompetitorStates(survivors);
  }

  private simulateCompetitor(comp: CompetitorState, day: number, events: EventBus): void {
    comp.releasedLastMonth = false;

    // ---- 1. 自动烧钱 ----
    comp.funds -= comp.burnRate * (COMPETITOR_TICK_DAYS / 30);
    comp.funds = Math.max(0, comp.funds);

    // 设计-14：累计资金归零天数，用于触发破产退出
    if (comp.funds <= 0) {
      comp.bankruptDays = (comp.bankruptDays ?? 0) + COMPETITOR_TICK_DAYS;
    } else {
      comp.bankruptDays = 0;
    }

    // ---- 2. 融资 ----
    if (comp.funds < comp.burnRate * 12) {
      const funder = FUNDING_EVENTS[Math.floor(Math.random() * FUNDING_EVENTS.length)];
      const amount = funder.amount[0] + Math.random() * (funder.amount[1] - funder.amount[0]);
      comp.funds += amount;

      const intel: CompetitorIntel = {
        id: genId(`intel-${comp.id}-${day}-funding`),
        competitorId: comp.id,
        type: 'funding',
        title: `${comp.name} 获得融资`,
        description: `${funder.name} 领投，融资金额约 $${amount.toFixed(0)}M`,
        day,
        severity: amount > 3000 ? 'critical' : amount > 1000 ? 'warning' : 'info',
      };
      comp.intel.push(intel);
      if (comp.infiltrationLevel > 0) events.emit('COMPETITOR_INTEL', intel);
    }

    // ---- 3. 训练进度 ----
    const progressScale = COMPETITOR_TICK_DAYS / 30;
    const computeFactor = Math.log10(comp.computeUnits + 1) / Math.log10(10000);
    const researcherFactor = 1 + comp.coreResearchers / 200;
    const progressPerTick = 5 * computeFactor * researcherFactor * (0.8 + Math.random() * 0.4) * progressScale;
    comp.trainingProgress = Math.min(100, comp.trainingProgress + progressPerTick);

    if (Math.random() < 0.08 * progressScale) {
      const scandal = SCANDAL_EVENTS[Math.floor(Math.random() * SCANDAL_EVENTS.length)];
      comp.trainingProgress = Math.max(0, comp.trainingProgress - 10 * progressScale);
      comp.funds = Math.max(0, comp.funds - scandal.fundsLoss * progressScale);

      const intel: CompetitorIntel = {
        id: genId(`intel-${comp.id}-${day}-scandal`),
        competitorId: comp.id,
        type: 'scandal',
        title: `${comp.name}: ${scandal.title}`,
        description: scandal.desc,
        day,
        severity: 'warning',
      };
      comp.intel.push(intel);
      if (comp.infiltrationLevel > 0) events.emit('COMPETITOR_INTEL', intel);
    }

    // ---- 4. 模型发布 ----
    if (comp.trainingProgress >= 100) {
      const improvement = 1.05 + Math.random() * 0.10;
      for (const capId of Object.keys(comp.capabilities)) {
        comp.capabilities[capId] = Math.min(2000, comp.capabilities[capId] * improvement);
      }

      const newScore = Math.max(...Object.values(comp.capabilities));
      const modelName = `${comp.name}-${comp.releasedModels.length + 1}`;
      comp.releasedModels.push({
        name: modelName,
        paramCount: 70 + Math.floor(Math.random() * 400),
        baseScore: newScore,
        day,
      });
      comp.trainingProgress = 0;
      comp.releasedLastMonth = true;

      const intel: CompetitorIntel = {
        id: `intel-${comp.id}-${day}-release`,
        competitorId: comp.id,
        type: 'release',
        title: `${comp.name} 发布新模型 ${modelName}`,
        description: `能力评分 ${newScore.toFixed(0)}，约 ${comp.releasedModels[comp.releasedModels.length - 1].paramCount}B 参数`,
        day,
        severity: newScore > 1500 ? 'critical' : 'warning',
      };
      comp.intel.push(intel);
      events.emit('COMPETITOR_RELEASE', modelName, newScore, day);
    }

    // ---- 5. 动态成长 ----
    const growthScale = COMPETITOR_TICK_DAYS / 30;
    comp.computeUnits *= (1 + comp.growthRate * growthScale);
    comp.headcount = Math.floor(comp.headcount * (1 + comp.growthRate / 2 * growthScale));
    comp.coreResearchers = Math.floor(comp.coreResearchers * (1 + comp.growthRate * growthScale));

    // ---- 6. 间谍渗透自动衰减 ----
    if (comp.infiltrationLevel > 0 && Math.random() < 0.03) {
      comp.infiltrationLevel = Math.max(0, comp.infiltrationLevel - 1);
    }
  }

  /** 合并事件（操作传入的 competitors 数组） */
  private triggerMerger(competitors: CompetitorState[], events: EventBus): void {
    const idx1 = Math.floor(Math.random() * competitors.length);
    let idx2: number;
    do { idx2 = Math.floor(Math.random() * competitors.length); } while (idx2 === idx1);

    const a = competitors[idx1];
    const b = competitors[idx2];

    const aAvgCap = Object.values(a.capabilities).reduce((s, v) => s + v, 0) / 16;
    const bAvgCap = Object.values(b.capabilities).reduce((s, v) => s + v, 0) / 16;

    if (aAvgCap > bAvgCap) {
      this.absorb(a, b, idx2, competitors);
    } else {
      this.absorb(b, a, idx1, competitors);
    }

    events.emit('COMPETITOR_MERGER', a.name, b.name);
  }

  private absorb(
    strong: CompetitorState,
    weak: CompetitorState,
    weakIdx: number,
    competitors: CompetitorState[],
  ): void {
    strong.funds += weak.funds * 0.7;
    strong.computeUnits += weak.computeUnits;
    strong.headcount += Math.floor(weak.headcount * 0.6);
    strong.coreResearchers += Math.floor(weak.coreResearchers * 0.5);
    competitors.splice(weakIdx, 1);
  }
}
