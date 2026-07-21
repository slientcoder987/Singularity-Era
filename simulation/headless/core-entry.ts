// Headless 模拟入口：导出 Game、系统、命令、配置，以及手动推进天数的能力
export { Game } from '../../src/core/Game';
export { GameState } from '../../src/core/GameState';
export type { GameData } from '../../src/core/GameState';
export { EventBus } from '../../src/core/EventBus';
export { ResourceRegistry } from '../../src/core/resources/ResourceRegistry';

// 系统
export { ComputeHardwareSystem } from '../../src/core/systems/ComputeHardwareSystem';
export { PowerSystem } from '../../src/core/systems/PowerSystem';
export { StaffSystem } from '../../src/core/systems/StaffSystem';
export { TrainingSystem } from '../../src/core/systems/TrainingSystem';
export { InfraMaintenanceSystem } from '../../src/core/systems/InfraMaintenanceSystem';
export { InfrastructureFailureSystem } from '../../src/core/systems/InfrastructureFailureSystem';
export { IdeaGenerationSystem } from '../../src/core/systems/IdeaGenerationSystem';
export { TechResearchSystem } from '../../src/core/systems/TechResearchSystem';
export { ResearchSystem } from '../../src/core/systems/ResearchSystem';
export { RiskSystem } from '../../src/core/systems/RiskSystem';
export { CollectionSystem } from '../../src/core/systems/CollectionSystem';
export { RegionSystem } from '../../src/core/systems/RegionSystem';
export { OperationsSystem } from '../../src/core/systems/OperationsSystem';
export { CompetitorSystem } from '../../src/core/systems/CompetitorSystem';
export { SmallCompanyMarketSystem } from '../../src/core/systems/SmallCompanyMarketSystem';
export { UniqueTechMaintenanceSystem } from '../../src/core/systems/UniqueTechMaintenanceSystem';
export { PostTrainingSystem } from '../../src/core/systems/PostTrainingSystem';

// 配置
export { INITIAL_RESOURCES } from '../../src/core/config/resources';
export { createInitialDataset } from '../../src/core/config/datasets';
export { EXTERNAL_CORPS } from '../../src/core/entities/Competitor';
export { DEPARTMENT_ROLE_MAP, DEPARTMENT_NAMES } from '../../src/core/entities/Department';

// 全部命令
export * from '../../src/core/commands/AddResourceCommand';
export * from '../../src/core/commands/AdjustSalaryCommand';
export * from '../../src/core/commands/AssignEmployeeCommand';
export * from '../../src/core/commands/BuildPowerPlantCommand';
export * from '../../src/core/commands/DataCommands';
export * from '../../src/core/commands/DataOperationCommands';
export * from '../../src/core/commands/DepartmentCommands';
export * from '../../src/core/commands/DistillCompetitorCommand';
export * from '../../src/core/commands/FireEmployeeCommand';
export * from '../../src/core/commands/GridPowerCommand';
export * from '../../src/core/commands/HireEmployeeCommand';
export * from '../../src/core/commands/HireNormalEmployeeCommand';
export * from '../../src/core/commands/HostileCommands';
export * from '../../src/core/commands/IdeaCommands';
export * from '../../src/core/commands/IncentiveCommands';
export * from '../../src/core/commands/InfraCommands';
export * from '../../src/core/commands/LearnSkillCommand';
export * from '../../src/core/commands/ManagementCommands';
export * from '../../src/core/commands/OpenSourceCommands';
export * from '../../src/core/commands/OperationsCommands';
export * from '../../src/core/commands/PromoteEmployeeCommand';
export * from '../../src/core/commands/PublishModelCommand';
export * from '../../src/core/commands/PurchaseHardwareCommand';
export * from '../../src/core/commands/RegionCommands';
export * from '../../src/core/commands/RentComputeCommand';
export * from '../../src/core/commands/RiskCommands';
export * from '../../src/core/commands/SmallCompanyCommands';
export * from '../../src/core/commands/StaffTrainingCommands';
export * from '../../src/core/commands/TechCommands';
export * from '../../src/core/commands/TrainingCommands';
