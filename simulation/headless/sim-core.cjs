// ============================================================================
// Headless 长期游戏模拟器（500+ 天）
// 模拟正常玩家：扩张公司、建设基础设施、科研、训练迭代模型、商业运营
// 全程覆盖 17 系统与 30 命令，采集数据并检测漏洞/数值问题
// ============================================================================
const C = require('./core.bundle.cjs');

// ---------- 初始化（复刻 main.tsx） ----------
function buildInitialResources() {
  const map = {};
  for (const def of C.INITIAL_RESOURCES) map[def.id] = def.initialValue;
  return map;
}
function buildInitialDepartments() {
  return Object.keys(C.DEPARTMENT_NAMES).map((type) => ({
    id: `dept-${type}`, type, name: C.DEPARTMENT_NAMES[type],
    role: C.DEPARTMENT_ROLE_MAP[type], headId: null, memberIds: [], normalHeadcount: 0, budget: 0,
  }));
}

const SEED = 20260721;
const initialData = {
  date: 0, startDate: '2023-01-01', isPaused: true, speed: 1,
  resources: buildInitialResources(), resourceMeta: {}, pendingOrders: [],
  employees: [], models: [], serverNodes: [], clusters: [], dataCenters: [],
  trainingProjects: [], activeTechEffects: [], infraEventLog: [],
  datasets: [C.createInitialDataset()],
  techMaturity: { pretraining: 100 }, researchingTech: null,
  archMatrixSeed: SEED,
  researchProjects: [], experimentQueue: [], experimentResults: [],
  riskState: { legalDebt: 0, trustDebt: 0, employeeMorale: 80, reputation: 50, alignmentLevel: 0, triggeredEvents: [] },
  dataAcquisitionCooldowns: {}, dataCollectionProjects: [],
  headquartersRegionId: null, operatingRegionIds: [], publishedRegions: [],
  fundingRounds: [], operations: null, competitorStates: [], externalCorps: [...C.EXTERNAL_CORPS],
  departments: buildInitialDepartments(), staffTrainings: [], pendingCandidates: [],
  lastTeamBuildingDay: -999, lastPerformanceEvalDay: 0,
  managementMode: 'flat', managementModeChangedDay: -999,
  executives: { ceoId: null, cooId: null, cfoId: null, ctoId: null },
  lastDayPowerCost: 0, lastDayPowerCostDate: -1,
  pendingIdeas: [], smallCompanies: [], openSourceOffers: [], acceptedIdeaTechs: [],
  lastSmallCompanyRefreshDay: -999, lastOpenSourceDay: {},
};

const registry = new C.ResourceRegistry();
registry.registerAll(C.INITIAL_RESOURCES);
const systems = [
  new C.ComputeHardwareSystem(registry), new C.PowerSystem(registry),
  new C.IdeaGenerationSystem(), new C.TechResearchSystem(), new C.ResearchSystem(),
  new C.CollectionSystem(), new C.InfrastructureFailureSystem(), new C.TrainingSystem(),
  new C.InfraMaintenanceSystem(), new C.UniqueTechMaintenanceSystem(), new C.PostTrainingSystem(),
  new C.OperationsSystem(), new C.CompetitorSystem(), new C.SmallCompanyMarketSystem(),
  new C.RiskSystem(), new C.RegionSystem(), new C.StaffSystem(),
];
const game = new C.Game(initialData, systems, registry);
const S = () => game.state.read();

// ---------- 数据采集与问题检测 ----------
const metrics = [];          // 每日快照
const opLog = [];            // 操作日志
const issues = [];           // 检测到的问题
const eventCounts = {};      // 事件统计
const cmdCoverage = new Set(); // 覆盖的命令
const rejectedLog = [];      // 被拒绝的操作（用于发现设计问题）

// 注意：EventBus 不支持通配符 on('*')。这里 monkey-patch emit 以拦截所有事件。
const _origEmit = game.events.emit.bind(game.events);
game.events.emit = function (name, ...args) {
  eventCounts[name] = (eventCounts[name] ?? 0) + 1;
  // 捕获所有拒绝类事件，发现设计/数值问题
  if (/REJECTED|FAILED|INSUFFICIENT/i.test(name)) {
    rejectedLog.push({ day: S().date, event: name, payload: summarize(args[0]) });
  }
  return _origEmit(name, ...args);
};
function summarize(p) {
  try { const s = JSON.stringify(p); return s.length > 200 ? s.slice(0, 200) + '…' : s; }
  catch { return String(p); }
}

function log(op, detail) {
  opLog.push({ day: S().date, op, detail });
}
function issue(category, severity, desc, data) {
  issues.push({ day: S().date, category, severity, desc, data });
}

function exec(cmdName, cmdObj, detail) {
  cmdCoverage.add(cmdName);
  try {
    const before = S().resources.funds;
    game.executeCommand(cmdObj);
    log(cmdName, detail ?? '');
    return true;
  } catch (e) {
    issue('exception', 'critical', `命令 ${cmdName} 抛异常: ${e.message}`, e.stack?.slice(0, 300));
    return false;
  }
}

// 直接 state.update（用于无命令的后训练阶段添加，复刻 UI 行为）
function addPostTraining(modelId, stage, computeCost) {
  cmdCoverage.add('AddPostTrainingStage(直接state)');
  game.state.update((draft) => {
    const m = draft.models.find((x) => x.id === modelId);
    if (!m) return;
    m.postTraining.push({ stage, status: 'pending', computeRemaining: computeCost, computeTotal: computeCost, startedAt: 0, completedAt: null });
  });
}

// ---------- 数值健康检查（每日） ----------
function healthCheck() {
  const d = S();
  const res = d.resources;
  for (const [k, v] of Object.entries(res)) {
    if (typeof v === 'number') {
      if (Number.isNaN(v)) issue('numeric', 'critical', `资源 ${k} 为 NaN`);
      if (!Number.isFinite(v)) issue('numeric', 'critical', `资源 ${k} 为 Infinity`);
    }
  }
  if (res.funds < 0) issue('numeric', 'warning', `资金为负: ${res.funds}`);
  // 员工属性检查
  for (const e of d.employees) {
    for (const [a, v] of Object.entries(e.attributes)) {
      if (Number.isNaN(v)) issue('numeric', 'warning', `员工 ${e.name} 属性 ${a} NaN`);
    }
    if (e.salary < 0) issue('numeric', 'warning', `员工 ${e.name} 薪资为负`);
  }
  // 模型能力检查（能力值 = baseScore × 因子，正常范围 0~数百，类似 benchmark 分数）
  for (const m of d.models) {
    if (Number.isNaN(m.baseScore)) issue('numeric', 'critical', `模型 ${m.name} baseScore NaN`);
    if (m.baseScore < 0) issue('numeric', 'warning', `模型 ${m.name} baseScore 为负`);
    for (const [c, v] of Object.entries(m.capabilities ?? {})) {
      if (Number.isNaN(v)) issue('numeric', 'warning', `模型 ${m.name} 能力 ${c} NaN`);
      if (v < 0) issue('numeric', 'warning', `模型 ${m.name} 能力 ${c} 为负 (${v})`);
    }
  }
  // 风险状态
  const rs = d.riskState;
  if (rs.employeeMorale < 0 || rs.employeeMorale > 100) issue('numeric', 'warning', `士气越界 ${rs.employeeMorale}`);
  if (rs.reputation < 0 || rs.reputation > 100) issue('numeric', 'warning', `声誉越界 ${rs.reputation}`);
}

// ---------- 每日快照 ----------
function snapshot() {
  const d = S();
  const res = d.resources;
  const totalCards = Object.keys(res).filter((k) => k.startsWith('compute_')).reduce((s, k) => s + (res[k] ?? 0), 0);
  const bestModel = d.models.length ? Math.max(...d.models.map((m) => m.baseScore)) : 0;
  const maxParam = d.models.length ? Math.max(...d.models.map((m) => m.paramCount)) : 0;
  metrics.push({
    day: d.date, funds: Math.round(res.funds), cards: totalCards,
    employees: d.employees.length, researchers: d.employees.filter((e) => e.role === 'researcher').length,
    models: d.models.length, maxParam, bestModel: Math.round(bestModel),
    dailyRevenue: Math.round(d.operations?.dailyRevenue ?? 0),
    reputation: Math.round(d.riskState.reputation), morale: Math.round(d.riskState.employeeMorale),
    legalDebt: Math.round(d.riskState.legalDebt),
    techs: Object.values(d.techMaturity).filter((v) => v >= 1).length,
    regions: d.operatingRegionIds.length,
    clusters: d.clusters.length, dcs: d.dataCenters.length,
    training: d.trainingProjects.filter((p) => p.status === 'training').length,
    research: d.researchProjects.filter((p) => p.status === 'in_progress').length,
  });
}

// ---------- 工具：查找实体 ----------
const funds = () => S().resources.funds;
const researchers = () => S().employees.filter((e) => e.role === 'researcher');
const idleResearchers = () => researchers().filter((e) => e.status === 'idle');
const mainCluster = () => S().clusters[0];
const techMat = (id) => S().techMaturity[id] ?? 0;
const unlocked = (id) => techMat(id) >= 1;

// ---------- 推进一天（含健康检查与快照） ----------
let crashed = false;
function advanceDay() {
  const state = game.state, events = game.events;
  try {
    events.emit('DAY_START', state.read().date);
    for (const s of systems) s.update(state, events, 1);
    state.update((d) => { d.date += 1; });
    events.emit('DAY_END', state.read().date);
  } catch (e) {
    crashed = true;
    issue('exception', 'critical', `第 ${S().date} 天系统更新抛异常: ${e.message}`, e.stack?.slice(0, 500));
    throw e;
  }
  healthCheck();
  snapshot();
}

module.exports = { C, game, S, systems, metrics, opLog, issues, eventCounts, cmdCoverage, rejectedLog,
  log, issue, exec, addPostTraining, advanceDay, funds, researchers, idleResearchers, mainCluster, techMat, unlocked,
  helpers: { isCrashed: () => crashed } };
