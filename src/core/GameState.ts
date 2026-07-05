import { produce } from 'immer';
import { clamp } from './utils';
import type { ResourceDefinition } from './resources/ResourceTypes';
import type { Employee } from './entities/Employee';
import type { ServerNode, Cluster, DataCenter, TechEffect } from './entities/Infrastructure';
import type { TrainingProject } from './entities/TrainingProject';

/**
 * 硬件采购订单
 */
export interface HardwareOrder {
  id: string;
  modelId: string;
  quantity: number;
  deliveryDay: number;
  createdAt: number;
}

/**
 * 计算卡实例（单张卡的运行时状态）
 *
 * 兼容 ComputeCardInstance：location 指向所在节点 id。
 */
export interface CardInstance {
  uid: string;
  modelId: string;
  status: 'online' | 'offline' | 'broken';
  /** 累计运行天数 */
  age: number;
  /** 已分配的项目 id（未分配为 null） */
  assignedProjectId: string | null;
  /** 购入日期 */
  purchasedAt: number;
  /** 所在服务器节点 id（未安装为 null） */
  location: string | null;
}

/**
 * 游戏状态定义
 *
 * 资源相关字段：
 * - resources: 资源 id → 数值（如 funds、compute_h100 数量等）
 * - resourceMeta: 资源 id → 附加元数据（如硬件实例池、电站列表等）
 * - pendingOrders: 待交付的硬件采购订单
 */
export interface GameData {
  date: number;                              // 距起始日期的天数
  startDate: string;                         // 起始日期，格式 'YYYY-MM-DD'
  isPaused: boolean;                         // 是否暂停
  speed: number;                             // 游戏速度倍率

  /** 通用资源映射：资源 id → 当前数值 */
  resources: Record<string, number>;
  /** 资源附加元数据：资源 id → 任意结构（如硬件实例池） */
  resourceMeta: Record<string, any>;
  /** 待交付的硬件采购订单 */
  pendingOrders: HardwareOrder[];

  /** 员工列表 */
  employees: Employee[];
  /** 模型列表（占位，后续扩展） */
  models: any[];

  // ===== 基础设施层级 =====
  /** 服务器节点列表 */
  serverNodes: ServerNode[];
  /** 集群列表 */
  clusters: Cluster[];
  /** 数据中心列表 */
  dataCenters: DataCenter[];

  // ===== 训练系统 =====
  /** 训练项目列表 */
  trainingProjects: TrainingProject[];

  // ===== 科技效果（预留，后续科研系统填充） =====
  /** 当前激活的科技效果列表 */
  activeTechEffects: TechEffect[];
}

/** 状态变更监听器 */
export type GameStateListener = (state: GameData) => void;

/**
 * GameState
 *
 * 基于 immer 的 produce 实现不可变更新。
 * 资源相关方法（getResource / setResource / addResource）会自动按
 * 注册器中的 ResourceDefinition 进行边界限制。
 */
export class GameState {
  private data: GameData;
  private readonly listeners = new Set<GameStateListener>();
  private readonly resourceDefs = new Map<string, ResourceDefinition>();

  constructor(initial: GameData) {
    this.data = produce(initial, () => {
      /* 冻结 */
    });
  }

  /** 注册资源定义（由 Game 在构造时统一注入）。 */
  registerResource(def: ResourceDefinition): void {
    this.resourceDefs.set(def.id, def);
  }

  /** 批量注册资源定义。 */
  registerResources(defs: ResourceDefinition[]): void {
    for (const def of defs) {
      this.registerResource(def);
    }
  }

  /** 返回当前状态只读引用 */
  read(): Readonly<GameData> {
    return this.data;
  }

  /** 使用 immer produce 生成新状态并通知监听器 */
  update(recipe: (draft: GameData) => void): void {
    this.data = produce(this.data, recipe);
    this.notify();
  }

  /** 订阅状态变更，返回取消订阅函数 */
  subscribe(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 用新数据替换内部状态（用于存档读取），并通知监听器 */
  resetData(data: GameData): void {
    this.data = produce(data, () => {
      /* 冻结传入数据 */
    });
    this.notify();
  }

  // ===== 资源操作 =====

  /** 读取某资源当前数值。未注册或未初始化返回 0。 */
  getResource(id: string): number {
    return this.data.resources[id] ?? 0;
  }

  /** 读取某资源的附加元数据。 */
  getResourceMeta<T = any>(id: string): T | undefined {
    return this.data.resourceMeta[id] as T | undefined;
  }

  /**
   * 设置某资源数值，并按其 ResourceDefinition 限制边界。
   * 可选传入 meta，合并到该资源的元数据。
   */
  setResource(id: string, value: number, meta?: any): void {
    const def = this.resourceDefs.get(id);
    const clamped = def ? clamp(value, def.minValue, def.maxValue) : value;
    this.data = produce(this.data, (draft) => {
      draft.resources[id] = clamped;
      if (meta !== undefined) {
        draft.resourceMeta[id] = meta;
      }
    });
    this.notify();
  }

  /**
   * 增减某资源数值（delta 可为负），自动限制边界。
   */
  addResource(id: string, delta: number): void {
    const def = this.resourceDefs.get(id);
    const current = this.data.resources[id] ?? 0;
    const next = def ? clamp(current + delta, def.minValue, def.maxValue) : current + delta;
    this.data = produce(this.data, (draft) => {
      draft.resources[id] = next;
    });
    this.notify();
  }

  private notify(): void {
    const snapshot = Array.from(this.listeners);
    for (const listener of snapshot) {
      listener(this.data);
    }
  }
}
