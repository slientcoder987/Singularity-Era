/**
 * CompetitorSystem
 *
 * 每 7 天模拟一次所有竞争对手的决策：
 * - 融资
 * - 训练进度推进
 * - 模型发布
 * - 合并可能
 * - 生成情报
 * - 同步到 GameState 供 UI/市场计算使用
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { CompetitorState, CompetitorIntel } from '../entities/Competitor';
import { COMPETITOR_TEMPLATES } from '../entities/Competitor';

/** 每 X 天执行一次竞争对手模拟 */
const COMPETITOR_TICK_DAYS = 7;

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

export class CompetitorSystem implements System {
  name = 'CompetitorSystem';

  /** 初始化的竞争对手实例 */
  private competitors: CompetitorState[] = [];
  private initialized = false;

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();

    // 初始化
    if (!this.initialized) {
      this.competitors = COMPETITOR_TEMPLATES.map((t) => ({
        ...t,
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
      this.initialized = true;

      // 预置初始模型发布
      for (const comp of this.competitors) {
        const score = Math.max(...Object.values(comp.capabilities));
        comp.releasedModels.push({
          name: `${comp.name}-1`,
          paramCount: 70,
          baseScore: score * 0.9,
          day: -90,
        });
      }
    }

    // 只每 COMPETITOR_TICK_DAYS 执行一次
    if (current.date % COMPETITOR_TICK_DAYS !== 0) return;

    for (const comp of this.competitors) {
      this.simulateCompetitor(comp, current.date, events);
    }

    // ★ 检测玩家模型发布 → 竞争对手加速训练
    const playerBestCap = current.models.length > 0
      ? Math.max(...current.models.map((m) => m.baseScore))
      : 0;
    for (const comp of this.competitors) {
      const compBestCap = Math.max(...Object.values(comp.capabilities));
      // 玩家领先显著 → 竞争对手加快训练
      if (playerBestCap > compBestCap * 1.2) {
        comp.trainingProgress = Math.min(100, comp.trainingProgress + 3);
        if (comp.infiltrationLevel > 0) {
          const intel: CompetitorIntel = {
            id: `intel-${comp.id}-${current.date}-push`,
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
    if (Math.random() < 0.05 && this.competitors.length >= 2) {
      this.triggerMerger(events);
    }

    // ★ Bug #1 修复：同步到 GameState，供 UI 和 marketCalc 使用
    const snapshot = this.competitors.map((c) => ({ ...c, capabilities: { ...c.capabilities }, intel: c.intel.slice(-50) }));
    state.update((draft) => {
      draft.competitorStates = snapshot;
    });
  }

  private simulateCompetitor(comp: CompetitorState, day: number, events: EventBus): void {
    comp.releasedLastMonth = false;

    // ---- 1. 自动烧钱 ----
    comp.funds -= comp.burnRate * (COMPETITOR_TICK_DAYS / 30); // 按实际天数为单位
    comp.funds = Math.max(0, comp.funds);

    // ---- 2. 融资 ----
    if (comp.funds < comp.burnRate * 12) {
      const funder = FUNDING_EVENTS[Math.floor(Math.random() * FUNDING_EVENTS.length)];
      const amount = funder.amount[0] + Math.random() * (funder.amount[1] - funder.amount[0]);
      comp.funds += amount;

      const intel: CompetitorIntel = {
        id: `intel-${comp.id}-${day}-funding`,
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

    // ---- 3. 训练进度（按实际天数比例缩放）----
    const progressScale = COMPETITOR_TICK_DAYS / 30;
    const computeFactor = Math.log10(comp.computeUnits + 1) / Math.log10(10000);
    const researcherFactor = 1 + comp.coreResearchers / 200;
    const progressPerTick = 5 * computeFactor * researcherFactor * (0.8 + Math.random() * 0.4) * progressScale;
    comp.trainingProgress = Math.min(100, comp.trainingProgress + progressPerTick);

    // 偶尔出丑闻卡进度
    if (Math.random() < 0.08 * progressScale) {
      const scandal = SCANDAL_EVENTS[Math.floor(Math.random() * SCANDAL_EVENTS.length)];
      comp.trainingProgress = Math.max(0, comp.trainingProgress - 10 * progressScale);
      comp.funds = Math.max(0, comp.funds - scandal.fundsLoss * progressScale);

      const intel: CompetitorIntel = {
        id: `intel-${comp.id}-${day}-scandal`,
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

    // ---- 5. 动态成长（按实际天数缩放）----
    const growthScale = COMPETITOR_TICK_DAYS / 30;
    comp.computeUnits *= (1 + comp.growthRate * growthScale);
    comp.headcount = Math.floor(comp.headcount * (1 + comp.growthRate / 2 * growthScale));
    comp.coreResearchers = Math.floor(comp.coreResearchers * (1 + comp.growthRate * growthScale));

    // ---- 6. 间谍渗透自动衰减 ----
    if (comp.infiltrationLevel > 0 && Math.random() < 0.03) {
      comp.infiltrationLevel = Math.max(0, comp.infiltrationLevel - 1);
    }
  }

  /** 合并事件 */
  private triggerMerger(events: EventBus): void {
    const idx1 = Math.floor(Math.random() * this.competitors.length);
    let idx2: number;
    do { idx2 = Math.floor(Math.random() * this.competitors.length); } while (idx2 === idx1);

    const a = this.competitors[idx1];
    const b = this.competitors[idx2];

    const aAvgCap = Object.values(a.capabilities).reduce((s, v) => s + v, 0) / 16;
    const bAvgCap = Object.values(b.capabilities).reduce((s, v) => s + v, 0) / 16;

    if (aAvgCap > bAvgCap) {
      this.absorb(a, b, idx2);
    } else {
      this.absorb(b, a, idx1);
    }

    events.emit('COMPETITOR_MERGER', a.name, b.name);
  }

  private absorb(strong: CompetitorState, weak: CompetitorState, weakIdx: number): void {
    strong.funds += weak.funds * 0.7;
    strong.computeUnits += weak.computeUnits;
    strong.headcount += Math.floor(weak.headcount * 0.6);
    strong.coreResearchers += Math.floor(weak.coreResearchers * 0.5);
    this.competitors.splice(weakIdx, 1);
  }

  getCompetitors(): CompetitorState[] {
    return this.competitors;
  }

  infiltrate(competitorId: string, level: number): boolean {
    const comp = this.competitors.find((c) => c.id === competitorId);
    if (!comp) return false;
    comp.infiltrationLevel = Math.max(comp.infiltrationLevel, level);
    return true;
  }
}
