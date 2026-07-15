import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './core/Game';
import type { GameData } from './core/GameState';
import { ResourceRegistry } from './core/resources/ResourceRegistry';
import { ComputeHardwareSystem } from './core/systems/ComputeHardwareSystem';
import { PowerSystem } from './core/systems/PowerSystem';
import { StaffSystem } from './core/systems/StaffSystem';
import { TrainingSystem } from './core/systems/TrainingSystem';
import { InfraMaintenanceSystem } from './core/systems/InfraMaintenanceSystem';
import { InfrastructureFailureSystem } from './core/systems/InfrastructureFailureSystem';
import { TechResearchSystem } from './core/systems/TechResearchSystem';
import { ResearchSystem } from './core/systems/ResearchSystem';
import { RiskSystem } from './core/systems/RiskSystem';
import { CollectionSystem } from './core/systems/CollectionSystem';
import { RegionSystem } from './core/systems/RegionSystem';
import { OperationsSystem } from './core/systems/OperationsSystem';
import { CompetitorSystem } from './core/systems/CompetitorSystem';
import { INITIAL_RESOURCES } from './core/config/resources';
import { createInitialDataset } from './core/config/datasets';
import { EXTERNAL_CORPS } from './core/entities/Competitor';
import { DEPARTMENT_ROLE_MAP, DEPARTMENT_NAMES } from './core/entities/Department';
import { GameProvider } from './ui/context/GameContext';
import { App } from './ui/components/App';

/**
 * 初始资源数值：从 INITIAL_RESOURCES 的 initialValue 自动生成。
 * 调整初始值只需改 config/resources.ts，无需改这里。
 */
function buildInitialResources(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const def of INITIAL_RESOURCES) {
    map[def.id] = def.initialValue;
  }
  return map;
}

/** 创建 5 个初始部门 */
function buildInitialDepartments() {
  return (Object.keys(DEPARTMENT_NAMES) as Array<keyof typeof DEPARTMENT_NAMES>).map((type) => ({
    id: `dept-${type}`,
    type,
    name: DEPARTMENT_NAMES[type],
    role: DEPARTMENT_ROLE_MAP[type],
    headId: null,
    memberIds: [],
    normalHeadcount: 0,
    budget: 0,
  }));
}

const initialData: GameData = {
  date: 0,
  startDate: '2023-01-01',
  isPaused: true,
  speed: 1,
  resources: buildInitialResources(),
  resourceMeta: {},
  pendingOrders: [],
  employees: [],
  models: [],
  serverNodes: [],
  clusters: [],
  dataCenters: [],
  trainingProjects: [],
  activeTechEffects: [],
  infraEventLog: [],
  // P0 大模型训练机制
  datasets: [createInitialDataset()],
  unlockedTechs: ['pretraining'],
  researchingTech: null,
  archMatrixSeed: Math.floor(Math.random() * 1e9),
  // P1 研发流程与风险系统
  researchProjects: [],
  experimentResults: [],
  riskState: {
    legalDebt: 0,
    trustDebt: 0,
    employeeMorale: 80,
    reputation: 50,
    alignmentLevel: 0,
    triggeredEvents: [],
  },
  dataAcquisitionCooldowns: {},
  dataCollectionProjects: [],
  // P2 市场地区系统
  headquartersRegionId: null,
  operatingRegionIds: [],
  publishedRegions: [],
  // P2 运营系统
  fundingRounds: [],
  operations: null,
  competitorStates: [],
  externalCorps: [...EXTERNAL_CORPS],
  // 员工系统扩展
  departments: buildInitialDepartments(),
  staffTrainings: [],
  pendingCandidates: [],
  lastTeamBuildingDay: -999,
  lastPerformanceEvalDay: 0,
  // 设计-2：电力成本统一记账初始值
  lastDayPowerCost: 0,
  lastDayPowerCostDate: -1,
};

// 1. 先创建 registry 并注册资源
const registry = new ResourceRegistry();
registry.registerAll(INITIAL_RESOURCES);

// 系统执行顺序（按每日依赖关系排列）：
// ComputeHardware → Power → TechResearch → Research → Collection → InfraFailure → Training → InfraMaintenance → Operations → Competitor → Risk → Region → Staff
// StaffSystem 放在最后：确保绩效评估在 Research/Collection/Training 贡献累积之后执行，
// 同时确保 morale→loyalty 联动使用 Operations 已更新的当日士气值。
const systems = [
  new ComputeHardwareSystem(registry),
  new PowerSystem(registry),
  new TechResearchSystem(),
  new ResearchSystem(),
  new CollectionSystem(),
  new InfrastructureFailureSystem(),
  new TrainingSystem(),
  new InfraMaintenanceSystem(),
  new OperationsSystem(),
  new CompetitorSystem(),
  new RiskSystem(),
  new RegionSystem(),
  new StaffSystem(),
];

// 3. 创建 Game，传入 registry（Game 内部会再次 registerAll，幂等）
const game = new Game(initialData, systems, registry);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider game={game}>
      <App />
    </GameProvider>
  </StrictMode>,
);
