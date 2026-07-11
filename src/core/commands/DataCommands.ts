/**
 * 数据获取与合成命令
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { PURCHASE_MAP, COLLECTION_MAP, calcCollectionRate, calcCollectionQuality, type PurchaseRouteId, type CollectionRouteId } from '../config/dataAcquisition';
import { CAPABILITIES } from '../config/capabilities';
import { RESEARCH_CONFIG } from '../config/researchConfig';
import { StaffRole } from '../entities/Employee';
import { ROLE_TO_STAFF_RESOURCE } from '../config/employees';
import type { DataDomainId } from '../entities/Dataset';
import type { DataCollectionProject } from '../entities/DataCollectionProject';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 执行数据购买 */
export class AcquireDataCommand implements Command {
  constructor(
    private readonly routeId: PurchaseRouteId,
    private readonly targetDatasetId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const route = PURCHASE_MAP[this.routeId];
    if (!route) {
      events.emit('DATA_ACQUIRE_REJECTED', { reason: '未知数据获取路线' });
      return;
    }

    const current = state.read();
    const dataset = current.datasets.find((d) => d.id === this.targetDatasetId);
    if (!dataset) {
      events.emit('DATA_ACQUIRE_REJECTED', { reason: '目标数据集不存在' });
      return;
    }

    if (route.requiredTech && !current.unlockedTechs.includes(route.requiredTech)) {
      events.emit('DATA_ACQUIRE_REJECTED', { reason: `需要技术：${route.requiredTech}` });
      return;
    }

    const funds = current.resources['funds'] ?? 0;
    if (funds < route.cost) {
      events.emit('DATA_ACQUIRE_REJECTED', { reason: '资金不足', cost: route.cost });
      return;
    }

    // 冷却检查
    const lastUsed = current.dataAcquisitionCooldowns[this.routeId] ?? -999;
    if (current.date - lastUsed < route.cooldownDays) {
      const remaining = route.cooldownDays - (current.date - lastUsed);
      events.emit('DATA_ACQUIRE_REJECTED', { reason: `冷却中，剩余 ${remaining} 天` });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= route.cost;
      draft.dataAcquisitionCooldowns[this.routeId] = draft.date;

      // improve_data_quality 技术效果提升获取数据的质量
      const dataQualityBonus = draft.activeTechEffects
        .filter((e) => e.type === 'improve_data_quality')
        .reduce((s, e) => s + (e.type === 'improve_data_quality' ? e.value : 0), 0);
      const effectiveQuality = Math.min(1, route.quality + dataQualityBonus);

      const ds = draft.datasets.find((d) => d.id === this.targetDatasetId);
      if (ds) {
        for (const domainId of route.targetDomains) {
          const domain = ds.domains[domainId as DataDomainId];
          if (domain) {
            const oldWeight = domain.tokens;
            domain.tokens += route.tokensProduced;
            domain.quality = (domain.quality * oldWeight + effectiveQuality * route.tokensProduced) / domain.tokens;
          }
        }
        ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
        ds.effectiveTokens = Object.values(ds.domains).reduce(
          (s, d) => s + d.tokens * d.quality * (1 - d.duplication), 0,
        );
      }

      if (route.isGrey) {
        draft.riskState.legalDebt = Math.min(100, draft.riskState.legalDebt + route.legalDebtIncrement);
        draft.riskState.trustDebt = Math.min(100, draft.riskState.trustDebt + route.trustDebtIncrement);
        draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - route.moraleLoss);
      }
    });

    events.emit('DATA_ACQUIRED', {
      route: route.name,
      tokens: route.tokensProduced,
      isGrey: route.isGrey,
    });
  }
}

/** 合成数据（需解锁蒸馏技术） */
export class SynthesizeDataCommand implements Command {
  constructor(
    private readonly sourceModelId: string,
    private readonly targetDomain: string,
    private readonly amount: number,
    private readonly targetDatasetId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.sourceModelId);
    if (!model) {
      events.emit('DATA_SYNTH_REJECTED', { reason: '源模型不存在' });
      return;
    }

    if (!current.unlockedTechs.includes('distillation')) {
      events.emit('DATA_SYNTH_REJECTED', { reason: '需要蒸馏技术' });
      return;
    }

    state.update((draft) => {
      const ds = draft.datasets.find((d) => d.id === this.targetDatasetId);
      if (!ds) return;
      const domain = ds.domains[this.targetDomain as DataDomainId];
      if (!domain) return;

      const relevantCaps = CAPABILITIES
        .filter((c) => c.primaryDataDomains.includes(this.targetDomain))
        .map((c) => model.capabilities[c.id]);
      const avgCap = relevantCaps.length > 0
        ? relevantCaps.reduce((s, v) => s + v, 0) / relevantCaps.length
        : 0;
      const quality = Math.min(0.95, 0.3 + avgCap / 2000);

      const oldWeight = domain.tokens;
      domain.tokens += this.amount;
      domain.quality = (domain.quality * oldWeight + quality * this.amount) / domain.tokens;

      ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication), 0,
      );
    });

    events.emit('DATA_SYNTHESIZED', { amount: this.amount, domain: this.targetDomain });
  }
}

/** 开始实验验证项目 */
export class StartExperimentCommand implements Command {
  constructor(
    private readonly targetArchId: string,
    private readonly researcherIds: string[],
    private readonly scale: 'small' | 'medium',
    private readonly mainModelParams: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 检查并发项目上限（使用配置而非硬编码）
    const activeCount = current.researchProjects.filter((p) => p.status === 'in_progress').length;
    if (activeCount >= RESEARCH_CONFIG.maxConcurrentProjects) {
      events.emit('EXPERIMENT_REJECTED', { reason: '并发研发项目已达上限' });
      return;
    }

    // 检查研究员是否存在、是否空闲、是否为研究员角色
    for (const empId of this.researcherIds) {
      const emp = current.employees.find((e) => e.id === empId);
      if (!emp) {
        events.emit('EXPERIMENT_REJECTED', { reason: `员工 ${empId} 不存在` });
        return;
      }
      if (emp.role !== StaffRole.RESEARCHER) {
        events.emit('EXPERIMENT_REJECTED', { reason: `${emp.name} 不是研究员` });
        return;
      }
      if (emp.status === 'assigned') {
        events.emit('EXPERIMENT_REJECTED', { reason: `员工 ${emp.name} 已被分配` });
        return;
      }
    }

    // 实验算力成本（TFLOPS·天），转化为资金成本扣除
    const computeCost = this.mainModelParams * (this.scale === 'small' ? 0.05 : 0.15);
    const fundsCost = Math.ceil(computeCost * 100_000); // 1 TFLOPS·天 ≈ $100,000
    const funds = current.resources['funds'] ?? 0;
    if (funds < fundsCost) {
      events.emit('EXPERIMENT_REJECTED', { reason: '资金不足', cost: fundsCost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= fundsCost;

      const projectId = genId('research');
      draft.researchProjects.push({
        id: projectId,
        type: 'experiment_validation',
        status: 'in_progress',
        targetArchId: this.targetArchId,
        researcherIds: [...this.researcherIds],
        computeBudget: computeCost,
        computeUsed: 0,
        progress: 0,
        startedAt: draft.date,
        completedAt: null,
        experimentResult: null,
        experimentScale: this.scale,
      });

      // 标记研究员为已分配
      for (const empId of this.researcherIds) {
        const emp = draft.employees.find((e) => e.id === empId);
        if (emp) {
          emp.status = 'assigned';
          emp.assignedProjectId = projectId;
        }
      }
    });

    events.emit('EXPERIMENT_STARTED', { archId: this.targetArchId, scale: this.scale, cost: fundsCost });
  }
}

/** 取消研发项目 */
export class CancelResearchProjectCommand implements Command {
  constructor(private readonly projectId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const project = current.researchProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit('RESEARCH_CANCEL_REJECTED', { reason: '项目不存在' });
      return;
    }

    state.update((draft) => {
      // 释放研究员
      for (const empId of project.researcherIds) {
        const emp = draft.employees.find((e) => e.id === empId);
        if (emp) {
          emp.status = 'idle';
          emp.assignedProjectId = undefined;
        }
      }
      draft.researchProjects = draft.researchProjects.filter((p) => p.id !== this.projectId);
    });

    events.emit('RESEARCH_PROJECT_CANCELLED', this.projectId);
  }
}

/**
 * 启动数据收集项目（持续运行）
 *
 * 普通数据工程师（资源 staff_data_engineer）+ 核心数据工程师（Employee 列表）共同参与。
 * 工程师数量影响日产量，核心工程师等级影响质量。
 */
export class StartDataCollectionCommand implements Command {
  constructor(
    private readonly routeId: string,
    private readonly coreEngineerIds: string[],
    private readonly normalEngineerCount: number,
    private readonly targetDatasetId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const route = COLLECTION_MAP[this.routeId as CollectionRouteId];
    if (!route) {
      events.emit('DATA_COLLECTION_REJECTED', { reason: '未知收集路线' });
      return;
    }

    const current = state.read();

    // 技术解锁检查
    if (route.requiredTech && !current.unlockedTechs.includes(route.requiredTech)) {
      events.emit('DATA_COLLECTION_REJECTED', { reason: `需要技术：${route.requiredTech}` });
      return;
    }

    // 目标数据集存在检查
    const dataset = current.datasets.find((d) => d.id === this.targetDatasetId);
    if (!dataset) {
      events.emit('DATA_COLLECTION_REJECTED', { reason: '目标数据集不存在' });
      return;
    }

    // 核心工程师校验：存在、角色为 DATA_ENGINEER、空闲
    for (const empId of this.coreEngineerIds) {
      const emp = current.employees.find((e) => e.id === empId);
      if (!emp) {
        events.emit('DATA_COLLECTION_REJECTED', { reason: `员工 ${empId} 不存在` });
        return;
      }
      if (emp.role !== StaffRole.DATA_ENGINEER) {
        events.emit('DATA_COLLECTION_REJECTED', { reason: `${emp.name} 不是数据工程师` });
        return;
      }
      if (emp.status === 'assigned') {
        events.emit('DATA_COLLECTION_REJECTED', { reason: `员工 ${emp.name} 已被分配` });
        return;
      }
    }

    // 普通工程师资源检查
    const normalStaffId = ROLE_TO_STAFF_RESOURCE[StaffRole.DATA_ENGINEER];
    const availableNormal = current.resources[normalStaffId] ?? 0;
    if (this.normalEngineerCount > availableNormal) {
      events.emit('DATA_COLLECTION_REJECTED', {
        reason: `普通数据工程师不足：需要 ${this.normalEngineerCount}，可用 ${availableNormal}`,
      });
      return;
    }

    if (this.coreEngineerIds.length === 0 && this.normalEngineerCount === 0) {
      events.emit('DATA_COLLECTION_REJECTED', { reason: '未分配任何工程师' });
      return;
    }

    // 计算日产量和质量
    const dailyRate = calcCollectionRate(
      this.normalEngineerCount,
      this.coreEngineerIds.length,
      route,
    );
    const currentQuality = calcCollectionQuality(this.coreEngineerIds.length, route);

    state.update((draft) => {
      const projectId = genId('collection');
      const project: DataCollectionProject = {
        id: projectId,
        routeId: this.routeId,
        engineerIds: [...this.coreEngineerIds],
        targetDatasetId: this.targetDatasetId,
        startedAt: draft.date,
        collectedTokens: 0,
        status: 'active',
        dailyRate,
        currentQuality,
      };
      draft.dataCollectionProjects.push(project);

      // 标记核心工程师为已分配
      for (const empId of this.coreEngineerIds) {
        const emp = draft.employees.find((e) => e.id === empId);
        if (emp) {
          emp.status = 'assigned';
          emp.assignedProjectId = projectId;
        }
      }

      // 扣除普通工程师资源（占用）
      draft.resources[normalStaffId] -= this.normalEngineerCount;
    });

    events.emit('DATA_COLLECTION_STARTED', {
      routeId: this.routeId,
      coreEngineerCount: this.coreEngineerIds.length,
      normalEngineerCount: this.normalEngineerCount,
      dailyRate,
      quality: currentQuality,
      targetDatasetId: this.targetDatasetId,
    });
  }
}

/** 停止数据收集项目 */
export class StopDataCollectionCommand implements Command {
  constructor(private readonly projectId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const project = current.dataCollectionProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit('DATA_COLLECTION_STOP_REJECTED', { reason: '收集项目不存在' });
      return;
    }

    // 需要知道分配了多少普通工程师，但 DataCollectionProject 只存了核心工程师 ids
    // 普通工程师数需从 dailyRate 反推
    const route = COLLECTION_MAP[project.routeId as CollectionRouteId];
    const coreCount = project.engineerIds.length;
    let normalCount = 0;
    if (route) {
      // dailyRate = (normalCount × 1.0 + coreCount × 1.5) × baseRate
      normalCount = Math.round((project.dailyRate / route.baseRate - coreCount * 1.5) / 1.0);
      normalCount = Math.max(0, normalCount);
    }

    state.update((draft) => {
      const proj = draft.dataCollectionProjects.find((p) => p.id === this.projectId);
      if (proj) {
        proj.status = 'stopped';
        // 释放核心工程师
        for (const empId of proj.engineerIds) {
          const emp = draft.employees.find((e) => e.id === empId);
          if (emp) {
            emp.status = 'idle';
            emp.assignedProjectId = undefined;
          }
        }
      }
      // 归还普通工程师资源
      if (normalCount > 0) {
        const staffId = ROLE_TO_STAFF_RESOURCE[StaffRole.DATA_ENGINEER];
        draft.resources[staffId] = (draft.resources[staffId] ?? 0) + normalCount;
      }
    });

    events.emit('DATA_COLLECTION_STOPPED', { projectId: this.projectId });
  }
}
