/**
 * 数据获取与合成命令
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { ExperimentRepeatMode } from '../entities/ResearchProject';
import { PURCHASE_MAP, COLLECTION_MAP, calcCollectionRate, calcCollectionQuality, type PurchaseRouteId, type CollectionRouteId } from '../config/dataAcquisition';
import { CAPABILITIES } from '../config/capabilities';
import { RESEARCH_CONFIG, EXPERIMENT_CONFIG, calcExperimentBudget, calcExperimentFundsCost } from '../config/researchConfig';
import { StaffRole } from '../entities/Employee';
import { ROLE_TO_STAFF_RESOURCE } from '../config/employees';
import type { DataDomainId, Dataset, DataDomain } from '../entities/Dataset';
import { INITIAL_DATA_DOMAINS } from '../config/datasets';
import type { DataCollectionProject } from '../entities/DataCollectionProject';
import { isTechUnlocked } from '../utils/techLookup';
import { getActiveTechEffects } from '../utils/crossSystemUtils';
import { aggregateMultiplicative, TECH_EFFECT_CAPS } from '../utils/techEffectScale';

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

    if (route.requiredTech && !isTechUnlocked(current, route.requiredTech)) {
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

    // 预计算技术效果（避免在 state.update 内读取 draft.activeTechEffects）
    const techEffects = getActiveTechEffects(current);
    // ★ PR-A 修复：improve_data_quality 改用乘法叠加 + 硬性上限 +50%
    //   原加法累加下，N 个 1% 技术可让数据质量加成无限增长
    const dataQualityBonus = aggregateMultiplicative(
      techEffects,
      'improve_data_quality',
      TECH_EFFECT_CAPS.improve_data_quality,
    );
    const effectiveQuality = Math.min(1, route.quality + dataQualityBonus);

    state.update((draft) => {
      draft.resources['funds'] -= route.cost;
      draft.dataAcquisitionCooldowns[this.routeId] = draft.date;

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

    if (!isTechUnlocked(current, 'distillation')) {
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

/**
 * 开始实验验证项目（PR-B 重设计）
 *
 * 玩家通过拉条选择 computeRatio（算力投入比例 0.5%~50%）和 experimentParams（目标参数量 0.5B~64B）。
 * 实验每日消耗集群总算力的 computeRatio 比例，与训练项目竞争算力。
 * 实验完成时按公式 D 计算成熟度增益，受公式 A 的成熟度上限约束。
 */
export class StartExperimentCommand implements Command {
  constructor(
    private readonly targetArchId: string,
    private readonly researcherIds: string[],
    private readonly experimentParams: number,
    private readonly computeRatio: number,
    private readonly repeatMode: ExperimentRepeatMode = 'once',
    private readonly queueItemId: string | null = null,
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

    // PR-B 参数校验
    const params = this.experimentParams;
    // BUG 修复：computeRatio 缺省/NaN/Infinity 时给默认值，防止 dailyCompute=NaN 实验永不完成
    let ratio = this.computeRatio;
    if (ratio === undefined || ratio === null || !Number.isFinite(ratio)) {
      ratio = EXPERIMENT_CONFIG.minComputeRatio;
    }
    if (params < EXPERIMENT_CONFIG.paramOptions[0] || params > EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]) {
      events.emit('EXPERIMENT_REJECTED', { reason: `参数量必须在 ${EXPERIMENT_CONFIG.paramOptions[0]}~${EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]}B 之间` });
      return;
    }
    if (ratio < EXPERIMENT_CONFIG.minComputeRatio || ratio > EXPERIMENT_CONFIG.maxComputeRatio) {
      events.emit('EXPERIMENT_REJECTED', { reason: `算力比例必须在 ${(EXPERIMENT_CONFIG.minComputeRatio * 100).toFixed(1)}%~${(EXPERIMENT_CONFIG.maxComputeRatio * 100).toFixed(0)}% 之间` });
      return;
    }

    // P0-1 修复：全局算力比例上限校验，防止实验占用导致训练停滞
    const totalExperimentRatio = current.researchProjects
      .filter((p) => p.status === 'in_progress' && p.computeRatio !== null)
      .reduce((s, p) => s + (p.computeRatio ?? 0), 0);
    if (totalExperimentRatio + ratio > 0.95) {
      events.emit('EXPERIMENT_REJECTED', {
        reason: `实验算力占比将达 ${((totalExperimentRatio + ratio) * 100).toFixed(0)}%，超过 95% 上限`,
        currentRatio: totalExperimentRatio,
      });
      return;
    }

    // 公式 B：实验总算力预算
    const computeBudgetTotal = calcExperimentBudget(params);
    // 公式 C：启动资金成本
    const fundsCost = calcExperimentFundsCost(params);
    const funds = current.resources['funds'] ?? 0;
    if (funds < fundsCost) {
      events.emit('EXPERIMENT_REJECTED', { reason: '资金不足', cost: fundsCost });
      return;
    }

    state.update((draft) => {
      // ★ P0-2 修复：Math.max(0, ...) 保护资金下界
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - fundsCost);

      const projectId = genId('research');
      draft.researchProjects.push({
        id: projectId,
        type: 'experiment_validation',
        status: 'in_progress',
        targetArchId: this.targetArchId,
        researcherIds: [...this.researcherIds],
        // PR-B：旧字段保留兼容（computeBudget 存总算力预算，experimentScale 留 null）
        computeBudget: computeBudgetTotal,
        computeUsed: 0,
        progress: 0,
        startedAt: draft.date,
        completedAt: null,
        experimentResult: null,
        experimentScale: null,
        // PR-B 新字段
        experimentParams: params,
        computeRatio: ratio,
        computeBudgetTotal,
        // 队列扩展字段
        repeatMode: this.repeatMode,
        queueItemId: this.queueItemId,
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

    events.emit('EXPERIMENT_STARTED', {
      archId: this.targetArchId,
      params,
      computeRatio: ratio,
      cost: fundsCost,
      budget: computeBudgetTotal,
    });
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

// ============================================================
// 实验队列命令（PR-F：安排多项实验，自动执行）
// ============================================================

/**
 * 将实验配置加入队列
 *
 * 不立即启动，仅加入 experimentQueue 列表。
 * ResearchSystem 每日检查并发项目空位，自动从队列取出下一项启动。
 */
export class QueueExperimentCommand implements Command {
  constructor(
    private readonly techId: string,
    private readonly researcherIds: string[],
    private readonly experimentParams: number,
    private readonly computeRatio: number,
    private readonly repeatMode: ExperimentRepeatMode,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 参数校验
    const params = this.experimentParams;
    // BUG 修复：computeRatio 缺省/NaN/Infinity 时给默认值，防止后续 dailyCompute=NaN
    let ratio = this.computeRatio;
    if (ratio === undefined || ratio === null || !Number.isFinite(ratio)) {
      ratio = EXPERIMENT_CONFIG.minComputeRatio;
    }
    if (params < EXPERIMENT_CONFIG.paramOptions[0] || params > EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]) {
      events.emit('EXPERIMENT_QUEUE_REJECTED', { reason: `参数量必须在 ${EXPERIMENT_CONFIG.paramOptions[0]}~${EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]}B 之间` });
      return;
    }
    if (ratio < EXPERIMENT_CONFIG.minComputeRatio || ratio > EXPERIMENT_CONFIG.maxComputeRatio) {
      events.emit('EXPERIMENT_QUEUE_REJECTED', { reason: `算力比例必须在 ${(EXPERIMENT_CONFIG.minComputeRatio * 100).toFixed(1)}%~${(EXPERIMENT_CONFIG.maxComputeRatio * 100).toFixed(0)}% 之间` });
      return;
    }

    // 研究员校验
    for (const empId of this.researcherIds) {
      const emp = current.employees.find((e) => e.id === empId);
      if (!emp || emp.role !== StaffRole.RESEARCHER) {
        events.emit('EXPERIMENT_QUEUE_REJECTED', { reason: `员工 ${empId} 不是有效研究员` });
        return;
      }
    }

    // P0-1 修复：入队时校验单期算力比例，启动时由 ResearchSystem 校验全局上限
    const totalExperimentRatio = current.researchProjects
      .filter((p) => p.status === 'in_progress' && p.computeRatio !== null)
      .reduce((s, p) => s + (p.computeRatio ?? 0), 0);
    if (totalExperimentRatio + ratio > 0.95) {
      events.emit('EXPERIMENT_QUEUE_REJECTED', {
        reason: `当前实验算力占比 ${(totalExperimentRatio * 100).toFixed(0)}% + 本项 ${ratio * 100}% 将超过 95% 上限`,
      });
      return;
    }

    state.update((draft) => {
      draft.experimentQueue.push({
        id: genId('expq'),
        techId: this.techId,
        experimentParams: params,
        computeRatio: ratio,
        researcherIds: [...this.researcherIds],
        repeatMode: this.repeatMode,
        queuedAt: draft.date,
      });
    });

    events.emit('EXPERIMENT_QUEUED', { techId: this.techId, repeatMode: this.repeatMode });
  }
}

/**
 * 从队列中移除一项
 */
export class RemoveQueuedExperimentCommand implements Command {
  constructor(private readonly queueItemId: string) {}

  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      draft.experimentQueue = draft.experimentQueue.filter((q) => q.id !== this.queueItemId);
    });
    events.emit('EXPERIMENT_QUEUE_REMOVED', this.queueItemId);
  }
}

/**
 * 清空实验队列
 */
export class ClearExperimentQueueCommand implements Command {
  execute(state: GameState, events: EventBus): void {
    state.update((draft) => {
      draft.experimentQueue = [];
    });
    events.emit('EXPERIMENT_QUEUE_CLEARED', {});
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
    if (route.requiredTech && !isTechUnlocked(current, route.requiredTech)) {
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
        // 设计-4：直接存储普通工程师数，停止时无需反推
        normalEngineerCount: this.normalEngineerCount,
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

    // 设计-4 修复：直接读取项目存储的 normalEngineerCount，不再依赖 dailyRate 反推
    const normalCount = project.normalEngineerCount ?? 0;

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

/**
 * 创建新数据集（空数据集，玩家可自行收集/购买数据填充）
 */
export class CreateDatasetCommand implements Command {
  constructor(private readonly name: string) {}

  execute(state: GameState, events: EventBus): void {
    const name = this.name.trim();
    if (!name) {
      events.emit('DATASET_CREATE_REJECTED', { reason: '数据集名称不能为空' });
      return;
    }

    const current = state.read();
    if (current.datasets.some((d) => d.name === name)) {
      events.emit('DATASET_CREATE_REJECTED', { reason: '数据集名称已存在' });
      return;
    }

    // 创建空数据集（所有领域初始为 0）
    const domains = {} as Record<DataDomainId, DataDomain>;
    (Object.keys(INITIAL_DATA_DOMAINS) as DataDomainId[]).forEach((id) => {
      domains[id] = { id, tokens: 0, quality: 0, freshness: 0, duplication: 0 };
    });

    const dataset: Dataset = {
      id: genId('dataset'),
      name,
      domains,
      totalTokens: 0,
      effectiveTokens: 0,
      contamination: 0,
      legality: 1.0,
      createdAt: current.date,
    };

    state.update((draft) => {
      draft.datasets.push(dataset);
    });

    events.emit('DATASET_CREATED', { id: dataset.id, name });
  }
}

/**
 * 删除数据集（初始数据集不可删除）
 */
export class DeleteDatasetCommand implements Command {
  constructor(private readonly datasetId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const dataset = current.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit('DATASET_DELETE_REJECTED', { reason: '数据集不存在' });
      return;
    }
    if (dataset.id === 'dataset-initial') {
      events.emit('DATASET_DELETE_REJECTED', { reason: '初始数据集不可删除' });
      return;
    }

    // 检查是否有进行中的收集项目引用此数据集
    const hasActiveCollection = current.dataCollectionProjects.some(
      (p) => p.targetDatasetId === this.datasetId && p.status === 'active',
    );
    if (hasActiveCollection) {
      events.emit('DATASET_DELETE_REJECTED', { reason: '有进行中的收集项目引用此数据集' });
      return;
    }

    state.update((draft) => {
      draft.datasets = draft.datasets.filter((d) => d.id !== this.datasetId);
    });

    events.emit('DATASET_DELETED', { id: this.datasetId });
  }
}
