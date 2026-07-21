import type { Command } from '../interfaces/Command';
import type { GameState, CardInstance } from '../GameState';
import type { EventBus } from '../EventBus';
import type { RegionId } from '../config/regions';
import { REGION_MAP } from '../config/regions';
import { createDefaultOperations } from './OperationsCommands';
import { StaffRole } from '../entities/Employee';
import { HARDWARE_SPECS } from '../config/resources';
import type { StartupPreset } from '../config/startupPresets';
import { DEPARTMENT_ROLE_MAP } from '../entities/Department';
import { ROLE_CONFIG } from '../config/employees';
import { generateCandidateAttributes } from '../utils/employeeUtils';

/** 生成随机姓名（根据地区语言） */
function generateName(regionId: string): string {
  const region = REGION_MAP[regionId];
  const langs = region?.primaryLanguages ?? ['en'];
  const isChinese = langs.some((l) => l.startsWith('zh'));

  if (isChinese) {
    const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'];
    const givenNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '霞', '平', '刚', '桂英'];
    return `${surnames[Math.floor(Math.random() * surnames.length)]}${givenNames[Math.floor(Math.random() * givenNames.length)]}`;
  }
  const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Emily'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

/**
 * 设置总部地区并初始化运营区域 + 基础设施 + 初始员工 + 开局预设。
 *
 * 基础设施（数据中心/集群/节点）固定创建，不随预设变化。
 * 资金、算力卡、员工由预设决定。
 */
export class SetHeadquartersCommand implements Command {
  constructor(
    readonly regionId: RegionId,
    readonly preset: StartupPreset,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const region = REGION_MAP[this.regionId];
    if (!region) return;

    // 硬件规格查找表
    const specMap = new Map(HARDWARE_SPECS.map((s) => [s.resourceId, s]));

    state.update((draft) => {
      draft.headquartersRegionId = this.regionId;
      draft.operatingRegionIds = [this.regionId];
      draft.publishedRegions = [this.regionId];

      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }

      // ===== 基础设施（固定） =====
      // 计算需要的节点数（每节点 8 卡槽）
      const totalCardCount = this.preset.cards.reduce((s, c) => s + c.count, 0);
      const nodeCount = Math.max(1, Math.ceil(totalCardCount / 8));

      const nodeIds: string[] = [];
      for (let i = 0; i < nodeCount; i++) {
        nodeIds.push(`node-initial-${i}`);
      }

      draft.dataCenters = [{
        id: 'dc-initial',
        name: '初始数据中心',
        location: region.name,
        maxPowerMW: Math.max(0.1, nodeCount * 0.05), // 按节点数扩展电力容量
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

      draft.clusters = [{
        id: 'cluster-initial',
        name: '初始训练集群',
        nodes: nodeIds,
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

      draft.serverNodes = nodeIds.map((nid, i) => ({
        id: nid,
        name: `训练节点 ${i + 1}`,
        slotCount: 8,
        installedCards: [] as string[],
        interconnect: 'NVLink3',
        interconnectBandwidth: 600,
        powerSupplyKW: 4,
        maxPowerDrawKW: 3.2,
        nvswitchGeneration: 1,
        reliability: 95,
        baseReliability: 95,
        nodeType: 'hgx' as const,
        cost: 80000,
        maintenanceCost: 100,
        clusterId: 'cluster-initial',
        builtAt: draft.date,
        lastMaintenanceDay: draft.date,
      }));

      // ===== 资金 =====
      const baseFunds = draft.resources['funds'] ?? 1_000_000;
      draft.resources['funds'] = baseFunds + this.preset.bonusFunds;

      // ===== 算力卡 + CardInstance =====
      let totalTFlops = 0;
      let cardIdx = 0;
      for (const card of this.preset.cards) {
        const spec = specMap.get(card.modelId);
        if (!spec) continue;

        // 增加资源计数
        draft.resources[card.modelId] = (draft.resources[card.modelId] ?? 0) + card.count;

        // 创建 CardInstance 并按顺序安装到节点
        const rawPool = draft.resourceMeta[card.modelId];
        const pool: CardInstance[] = Array.isArray(rawPool) ? rawPool : [];
        for (let i = 0; i < card.count; i++) {
          const targetNode = draft.serverNodes[cardIdx % nodeCount];
          const uid = `${card.modelId}-init-${cardIdx}`;
          const inst: CardInstance = {
            uid,
            modelId: card.modelId,
            status: 'online',
            age: 0,
            assignedProjectId: null,
            purchasedAt: 0,
            location: targetNode.id,
          };
          pool.push(inst);
          targetNode.installedCards.push(uid);
          totalTFlops += spec.tflopsPerCard;
          cardIdx++;
        }
        draft.resourceMeta[card.modelId] = pool;
      }
      draft.resources['compute_power'] = totalTFlops;

      // ===== 员工 =====
      const baseSalaryMultiplier = 0.5 + (region.talentIndex / 100) * 0.5;
      const roleBaseSalary: Record<StaffRole, number> = {
        [StaffRole.RESEARCHER]: 120000,
        [StaffRole.DATA_ENGINEER]: 80000,
        [StaffRole.SYSTEM_ENGINEER]: 90000,
        [StaffRole.PRODUCT_MANAGER]: 100000,
        [StaffRole.LEGAL_PR]: 85000,
        [StaffRole.MANAGER]: 150000,
      };

      const employees: any[] = [];
      let empIdx = 0;

      for (const empCfg of this.preset.employees) {
        for (let i = 0; i < empCfg.count; i++) {
          const empId = `emp-init-${empIdx++}`;
          employees.push({
            id: empId,
            name: generateName(this.regionId),
            role: empCfg.role,
            status: 'idle',
            level: empCfg.level,
            experience: 0,
            skillPoints: 0,
            skills: [],
            salary: Math.round(roleBaseSalary[empCfg.role] * baseSalaryMultiplier),
            loyalty: 75,
            fatigue: 0,
            hireDay: draft.date,
            attributes: generateCandidateAttributes(
              ROLE_CONFIG[empCfg.role].displayName === '研究员' ? 75 : 65,
              ROLE_CONFIG[empCfg.role].attributeWeights,
              empCfg.level,
            ),
            departmentId: null,
            trainingId: null,
            hasEquity: false,
            equityGrantedDay: null,
            lastBonusDay: null,
            monthlyWorkDays: 0,
            monthlyContribution: 0,
            lastPerformance: null,
          });
        }
      }

      draft.employees = employees;

      // 注意：核心员工与普通员工（staff_* 资源）是两套独立体系。
      // 此处不更新 staff_* 资源计数，避免凭空增加可分配的普通员工。
      // 普通员工只能通过 HireNormalEmployeeCommand 招聘。

      // 自动将员工加入对应部门
      for (const emp of employees) {
        const deptType = (Object.entries(DEPARTMENT_ROLE_MAP).find(
          ([, role]) => role === emp.role,
        )?.[0]) as string | undefined;
        if (deptType) {
          const dept = draft.departments.find((d) => d.type === deptType);
          if (dept) {
            dept.memberIds.push(emp.id);
            emp.departmentId = dept.id;
          }
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
    // BUG 修复：未知 regionId 不再静默 return，发出失败事件让玩家可感知
    if (!region) {
      events.emit('REGION_ENTRY_FAILED', this.regionId, `未知地区: ${String(this.regionId)}`);
      return;
    }
    if (current.operatingRegionIds.includes(this.regionId)) {
      events.emit('REGION_ENTRY_FAILED', this.regionId, '已进入该地区');
      return;
    }

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
