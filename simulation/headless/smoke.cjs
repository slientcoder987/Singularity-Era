// 冒烟测试：验证 bundle 加载、Game 初始化、手动推进天数
const C = require('./core.bundle.cjs');

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

const initialData = {
  date: 0, startDate: '2023-01-01', isPaused: true, speed: 1,
  resources: buildInitialResources(), resourceMeta: {}, pendingOrders: [],
  employees: [], models: [], serverNodes: [], clusters: [], dataCenters: [],
  trainingProjects: [], activeTechEffects: [], infraEventLog: [],
  datasets: [C.createInitialDataset()],
  techMaturity: { pretraining: 100 }, researchingTech: null,
  archMatrixSeed: 12345,
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

// 手动推进 N 天：直接调用内部 advanceDay 等价逻辑
function advanceDays(n) {
  const state = game.state, events = game.events;
  for (let i = 0; i < n; i++) {
    events.emit('DAY_START', state.read().date);
    for (const s of systems) s.update(state, events, 1);
    state.update((d) => { d.date += 1; });
    events.emit('DAY_END', state.read().date);
  }
}

console.log('初始资金 funds =', game.state.getResource('funds'));
console.log('初始资源 keys 数量 =', Object.keys(game.state.read().resources).length);
advanceDays(10);
console.log('推进 10 天后 date =', game.state.read().date);
console.log('funds =', game.state.getResource('funds'));
console.log('SMOKE OK');
