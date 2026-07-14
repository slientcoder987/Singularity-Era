import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { RegionId } from '../config/regions';
import { REGION_MAP } from '../config/regions';
import { createDefaultOperations } from './OperationsCommands';
import { StaffRole } from '../entities/Employee';

/**
 * 设置总部地区并初始化运营区域 + 初始基础设施 + 初始员工。
 *
 * ★ Bug #5 修复：选择总部时自动创建基础基础设施和初始员工。
 */
export class SetHeadquartersCommand implements Command {
  constructor(readonly regionId: RegionId) {}

  execute(state: GameState, events: EventBus): void {
    const region = REGION_MAP[this.regionId];
    if (!region) return;

    state.update((draft) => {
      draft.headquartersRegionId = this.regionId;
      draft.operatingRegionIds = [this.regionId];
      draft.publishedRegions = [this.regionId];

      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }

      // 小型数据中心（100 kW 电力）
      draft.dataCenters = [{
        id: 'dc-initial',
        name: '初始数据中心',
        location: region.name,
        maxPowerMW: 0.1,
        usedPowerMW: 0,
        coolingType: 'air',
        pue: 1.2,
        basePue: 1.2,
        currentPue: 1.2,
        clusters: ['cluster-initial'],
        buildCost: 50000,
        maintenanceCostPerDay: 200,
        powerCostPerKWh: 0.08 + region.energyCostIndex * 0.001,
        builtAt: draft.date,
        lastMaintenanceDay: draft.date,
      }];

      // 基础集群
      draft.clusters = [{
        id: 'cluster-initial',
        name: '初始训练集群',
        nodes: ['node-initial'],
        network: 'InfiniBand HDR',
        switchCapacity: 200,
        networkBandwidth: 200,
        networkTopology: 'fat_tree',
        maxNodes: 16,
        maxTPDegree: 8,
        allReduceBandwidth: 200,
        parallelEfficiencyBase: 0.95,
        buildCost: 30000,
        operationalCostPerDay: 150,
        utilizationBonus: 1.0,
        baseUtilizationBonus: 1.0,
        dataCenterId: 'dc-initial',
        storageType: 'nvme_raid',
        storageIO: 10,
        storageCapacity: 100,
        storageCostPerDay: 50,
        createdAt: draft.date,
      }];

      // 1 台 8 槽服务器节点
      draft.serverNodes = [{
        id: 'node-initial',
        name: '初始训练节点',
        slotCount: 8,
        installedCards: [],
        interconnect: 'NVLink3',
        interconnectBandwidth: 600,
        powerSupplyKW: 4,
        maxPowerDrawKW: 3.2,
        nvswitchGeneration: 1,
        reliability: 95,
        baseReliability: 95,
        nodeType: 'hgx',
        cost: 80000,
        maintenanceCost: 100,
        clusterId: 'cluster-initial',
        builtAt: draft.date,
        lastMaintenanceDay: draft.date,
      }];

      // 初始员工（3 研究员 + 2 数据工程师）
      const baseSalaryMultiplier = 0.5 + (region.talentIndex / 100) * 0.5;
      draft.employees = [
        {
          id: 'emp-res-1',
          name: '张明',
          role: StaffRole.RESEARCHER,
          status: 'idle',
          level: 3,
          experience: 0,
          skillPoints: 0,
          skills: [],
          salary: Math.round(120000 * baseSalaryMultiplier),
          loyalty: 70,
          fatigue: 0,
          hireDay: draft.date,
          attributes: { intelligence: 75, creativity: 65, leadership: 40, stamina: 60, charisma: 50 },
        },
        {
          id: 'emp-res-2',
          name: 'Sarah Chen',
          role: StaffRole.RESEARCHER,
          status: 'idle',
          level: 3,
          experience: 0,
          skillPoints: 0,
          skills: [],
          salary: Math.round(120000 * baseSalaryMultiplier),
          loyalty: 75,
          fatigue: 0,
          hireDay: draft.date,
          attributes: { intelligence: 80, creativity: 70, leadership: 35, stamina: 55, charisma: 45 },
        },
        {
          id: 'emp-res-3',
          name: '田中太郎',
          role: StaffRole.RESEARCHER,
          status: 'idle',
          level: 2,
          experience: 0,
          skillPoints: 0,
          skills: [],
          salary: Math.round(95000 * baseSalaryMultiplier),
          loyalty: 80,
          fatigue: 0,
          hireDay: draft.date,
          attributes: { intelligence: 70, creativity: 60, leadership: 30, stamina: 65, charisma: 55 },
        },
        {
          id: 'emp-de-1',
          name: '李明',
          role: StaffRole.DATA_ENGINEER,
          status: 'idle',
          level: 2,
          experience: 0,
          skillPoints: 0,
          skills: [],
          salary: Math.round(80000 * baseSalaryMultiplier),
          loyalty: 75,
          fatigue: 0,
          hireDay: draft.date,
          attributes: { intelligence: 60, creativity: 50, leadership: 35, stamina: 70, charisma: 45 },
        },
        {
          id: 'emp-de-2',
          name: 'Alice Wang',
          role: StaffRole.DATA_ENGINEER,
          status: 'idle',
          level: 2,
          experience: 0,
          skillPoints: 0,
          skills: [],
          salary: Math.round(80000 * baseSalaryMultiplier),
          loyalty: 70,
          fatigue: 0,
          hireDay: draft.date,
          attributes: { intelligence: 65, creativity: 55, leadership: 30, stamina: 65, charisma: 50 },
        },
      ];

      draft.resources['staff_researcher'] = 3;
      draft.resources['staff_data_engineer'] = 2;

      // 自动将初始员工加入对应部门
      const researchDept = draft.departments.find((d) => d.type === 'research');
      const dataDept = draft.departments.find((d) => d.type === 'data');
      if (researchDept) {
        researchDept.memberIds = ['emp-res-1', 'emp-res-2', 'emp-res-3'];
        for (const emp of draft.employees) {
          if (emp.role === StaffRole.RESEARCHER) emp.departmentId = researchDept.id;
        }
      }
      if (dataDept) {
        dataDept.memberIds = ['emp-de-1', 'emp-de-2'];
        for (const emp of draft.employees) {
          if (emp.role === StaffRole.DATA_ENGINEER) emp.departmentId = dataDept.id;
        }
      }
    });

    events.emit('HEADQUARTERS_SET', this.regionId, region.name);
  }
}

export class EnterRegionCommand implements Command {
  constructor(readonly regionId: RegionId) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const region = REGION_MAP[this.regionId];
    if (!region) return;
    if (current.operatingRegionIds.includes(this.regionId)) return;

    const entryCost = 100_000 + region.marketEntryDifficulty * 50_000;
    if (current.resources['funds'] < entryCost) {
      events.emit('REGION_ENTRY_FAILED', this.regionId, '资金不足');
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= entryCost;
      draft.operatingRegionIds = [...draft.operatingRegionIds, this.regionId];
    });

    events.emit('REGION_ENTERED', this.regionId, region.name);
  }
}

export class PublishInRegionCommand implements Command {
  constructor(readonly regionId: RegionId) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const region = REGION_MAP[this.regionId];
    if (!region) return;
    if (current.publishedRegions.includes(this.regionId)) return;
    if (!current.operatingRegionIds.includes(this.regionId)) {
      events.emit('PUBLISH_FAILED', this.regionId, '尚未进入该地区');
      return;
    }

    state.update((draft) => {
      draft.publishedRegions = [...draft.publishedRegions, this.regionId];
    });

    events.emit('REGION_PUBLISHED', this.regionId, region.name);
  }
}
