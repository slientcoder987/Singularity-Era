import { EventBus } from './EventBus';
import { GameState, type GameData } from './GameState';
import { GameLoop } from './GameLoop';
import type { System } from './interfaces/System';
import type { Command } from './interfaces/Command';
import { ResourceRegistry } from './resources/ResourceRegistry';
import { INITIAL_RESOURCES } from './config/resources';
import { COLLECTION_MAP } from './config/dataAcquisition';
import { IDEA_TECH_MAP } from './config/techTree';
import { IDEA_TECH_POOL } from './config/ideaTechPool';
import { OPEN_SOURCE_TECH_POOL } from './config/openSourcePool';
import { SMALL_COMPANY_TECH_POOL } from './config/smallCompanyTech';
import { COMPUTE_CARD_SPECS } from './config/computeCards';
import { createEmptyPool, migrateFromCards } from './utils/cardAggregate';

/**
 * Game 主控制器
 *
 * 持有 GameState / EventBus / GameLoop / ResourceRegistry / systems。
 *
 * 资源系统：
 * - 构造时根据 INITIAL_RESOURCES 注册所有资源定义。
 * - 同时根据资源定义初始化 state.resources 中的数值。
 * - 系统（如 ComputeHardwareSystem / PowerSystem）通过 registry 查询资源。
 */
export class Game {
  readonly state: GameState;
  readonly events: EventBus;
  readonly registry: ResourceRegistry;
  private readonly loop: GameLoop;
  private readonly systems: System[];

  constructor(
    initialData: GameData,
    systems: System[] = [],
    registry?: ResourceRegistry,
  ) {
    this.events = new EventBus();

    // 1. 注册资源定义（可外部传入，否则内部创建）
    this.registry = registry ?? new ResourceRegistry();
    this.registry.registerAll(INITIAL_RESOURCES);

    // 2. 初始化状态
    this.state = new GameState(initialData);
    this.state.registerResources(INITIAL_RESOURCES);

    // 3. 若 state.resources 中缺少某资源初始值，则补齐
    this.ensureInitialResourceValues();

    this.systems = systems;
    this.loop = new GameLoop(this.state, this.events, this.systems);
  }

  /** 确保所有已注册资源在 state.resources 中有初始值 */
  private ensureInitialResourceValues(): void {
    const current = this.state.read().resources;
    const needsInit: Array<{ id: string; value: number }> = [];
    const cardPoolsNeeded: string[] = [];
    for (const def of this.registry.getAll()) {
      if (current[def.id] === undefined) {
        needsInit.push({ id: def.id, value: def.initialValue });
      }
      // 计算卡资源需要初始化空 CardPool（聚合存储）
      if (def.id.startsWith('compute_') && def.id !== 'compute_power') {
        const existing = this.state.read().resourceMeta[def.id];
        const isPool = existing && typeof existing === 'object' && (existing as any).aggregates !== undefined;
        if (!isPool) {
          cardPoolsNeeded.push(def.id);
        }
      }
    }
    if (needsInit.length > 0 || cardPoolsNeeded.length > 0) {
      this.state.update((draft) => {
        for (const { id, value } of needsInit) {
          draft.resources[id] = value;
        }
        for (const id of cardPoolsNeeded) {
          const existing = draft.resourceMeta[id];
          if (!existing || (existing as any).aggregates === undefined) {
            draft.resourceMeta[id] = createEmptyPool();
          }
        }
      });
    }
  }

  /** 执行命令 */
  executeCommand(cmd: Command): void {
    cmd.execute(this.state, this.events);
  }

  /** 启动游戏（解除暂停并启动主循环） */
  start(): void {
    this.state.update((draft) => {
      draft.isPaused = false;
    });
    this.loop.start();
  }

  /** 暂停游戏（停止主循环并标记暂停） */
  pause(): void {
    this.loop.stop();
    this.state.update((draft) => {
      draft.isPaused = true;
    });
  }

  /** 恢复游戏（解除暂停并启动主循环） */
  resume(): void {
    this.state.update((draft) => {
      draft.isPaused = false;
    });
    this.loop.start();
  }

  /** 设置游戏速度倍率 */
  setSpeed(speed: number): void {
    this.state.update((draft) => {
      draft.speed = speed;
    });
    this.loop.setSpeed(speed);
  }

  /** 序列化当前状态为 JSON 字符串 */
  save(): string {
    // ★ 存档优化：node.installedCards 是 10万 UID 字符串的冗余数据（≈4.5MB），
    //   聚合桶的 location 字段已记录每张卡所属节点，可在加载时重建。
    //   序列化前清空 installedCards，加载时由 rebuildInstalledCards 重建。
    const snapshot = this.state.read();
    const slim = {
      ...snapshot,
      serverNodes: snapshot.serverNodes.map((n) => ({
        ...n,
        installedCards: [] as string[],
      })),
    };
    return JSON.stringify(slim);
  }

  /** 从 JSON 字符串读取存档并替换当前状态 */
  load(json: string): void {
    const parsed = JSON.parse(json) as GameData;
    // BUG-15 修复：旧存档迁移——为 DataCollectionProject 补 normalEngineerCount 字段
    this.migrateOldData(parsed);
    // ★ 存档优化：从聚合桶 location 重建 node.installedCards
    this.rebuildInstalledCards(parsed);
    this.state.resetData(parsed);
    this.loop.setSpeed(parsed.speed);
  }

  /**
   * 从聚合桶的 location 字段重建 node.installedCards。
   *
   * 存档时 installedCards 被清空以减小文件体积（10万 UID ≈4.5MB）。
   * 加载时遍历 resourceMeta 的所有聚合桶，按 location 分组生成 UID。
   *
   * UID 格式：agg-{modelId}-{ageBucket}-{nodeId}-{idx}
   * 与 InstallCardCommand 生成的格式一致，确保运行时兼容。
   */
  private rebuildInstalledCards(data: GameData): void {
    // 先清空所有节点的 installedCards（防御性）
    for (const node of data.serverNodes) {
      node.installedCards = [];
    }
    // 按节点 id 索引
    const nodeMap = new Map(data.serverNodes.map((n) => [n.id, n]));
    // 遍历所有聚合桶，按 location 分配 UID
    for (const [modelId, pool] of Object.entries(data.resourceMeta)) {
      if (!pool || !Array.isArray((pool as any).aggregates)) continue;
      for (const agg of (pool as any).aggregates) {
        // 只处理有 location（已安装）且非空桶的卡
        if (!agg.location || agg.count <= 0) continue;
        const node = nodeMap.get(agg.location);
        if (!node) continue;
        // 为该桶生成 count 个 UID（格式与 InstallCardCommand 一致）
        const startIdx = node.installedCards.length;
        for (let i = 0; i < agg.count; i++) {
          node.installedCards.push(`agg-${modelId}-${agg.ageBucket}-${agg.location}-${startIdx + i}`);
        }
      }
    }
  }

  /**
   * 旧存档数据迁移。
   * 当前迁移：
   * - DataCollectionProject.normalEngineerCount（设计-4 引入）
   * - FundingRound.terms.sharesOutstanding（设计-15 引入）
   */
  private migrateOldData(data: GameData): void {
    if (Array.isArray(data.dataCollectionProjects)) {
      for (const proj of data.dataCollectionProjects) {
        if (proj.normalEngineerCount === undefined) {
          const route = COLLECTION_MAP[proj.routeId as keyof typeof COLLECTION_MAP];
          // 使用历史反推公式计算迁移值
          proj.normalEngineerCount = route
            ? Math.max(0, Math.round(proj.dailyRate / route.baseRate - proj.engineerIds.length * 1.5))
            : 0;
        }
      }
    }
    // 设计-15 迁移：为已 IPO 的旧存档补算 sharesOutstanding
    if (Array.isArray(data.fundingRounds)) {
      for (const round of data.fundingRounds) {
        if (round.type === 'ipo' && round.terms.sharesOutstanding === undefined) {
          const price = round.terms.ipoPrice ?? round.terms.stockPrice;
          if (price && price > 0) {
            // 反推：流通股 = 融资金额(美元) / 发行价
            round.terms.sharesOutstanding = Math.round((round.amount * 1_000_000) / price);
          }
        }
      }
    }

    // 公司管理系统迁移（v2.x 引入）：补齐 managementMode / executives 等字段
    if (data.managementMode === undefined) {
      data.managementMode = 'flat';
    }
    if (data.managementModeChangedDay === undefined) {
      data.managementModeChangedDay = -999;
    }
    if (data.executives === undefined) {
      data.executives = { ceoId: null, cooId: null, cfoId: null, ctoId: null };
    } else {
      // 防御性补齐（万一未来加第 5 个高管职位）
      data.executives.ceoId ??= null;
      data.executives.cooId ??= null;
      data.executives.cfoId ??= null;
      data.executives.ctoId ??= null;
    }

    // ★ I2 迁移：Model.publishedAt 字段引入
    //   旧存档没有 publishedAt，但 daysSincePublished 仍存在。
    //   如果模型曾发布过（published===true 或 daysSincePublished>0），
    //   推断 publishedAt = today - daysSincePublished；否则 -1。
    if (Array.isArray(data.models)) {
      for (const m of data.models) {
        if (m.publishedAt === undefined) {
          const dsp = m.daysSincePublished ?? 0;
          m.publishedAt = dsp > 0 ? (data.date ?? 0) - dsp : -1;
        }
      }
    }

    // ===== 研发系统扩展迁移（技术成熟度 / idea / 小公司 / 开源） =====
    // 1. unlockedTechs: string[] → techMaturity: Record<string, number>
    //    旧 unlockedTechs 中每个 techId 迁移为 maturity=50；pretraining 特殊置 100
    if (!data.techMaturity) {
      const oldUnlocked = (data as any).unlockedTechs;
      const newMat: Record<string, number> = {};
      if (Array.isArray(oldUnlocked)) {
        for (const techId of oldUnlocked) newMat[techId] = 50;
      }
      // pretraining 始终视为初始已解锁，maturity=100
      newMat['pretraining'] = 100;
      data.techMaturity = newMat;
      delete (data as any).unlockedTechs;
    } else {
      // 防御性：确保 pretraining 在 techMaturity 中
      data.techMaturity['pretraining'] ??= 100;
    }

    // 2. researchingTech 字段已废弃（PR-C：技术树研发机制删除）
    //    旧存档中可能存在非 null 值，强制清空以避免 IdeaGenerationSystem 等系统误读
    if (data.researchingTech) {
      data.researchingTech = null;
    }

    // 3. 新增字段防御性补齐
    data.pendingIdeas ??= [];
    data.smallCompanies ??= [];
    data.openSourceOffers ??= [];
    data.acceptedIdeaTechs ??= [];
    data.lastSmallCompanyRefreshDay ??= -999;
    data.lastOpenSourceDay ??= {};
    data.experimentQueue ??= [];

    // ★ R1 迁移：基础设施维护成本统一记账字段
    data.lastDayInfraCost ??= 0;
    data.lastDayInfraCostDate ??= -999;

    // 3.0 迁移：旧 ResearchProject 没有 repeatMode / queueItemId 字段
    if (Array.isArray(data.researchProjects)) {
      for (const proj of data.researchProjects) {
        if (proj.repeatMode === undefined) {
          (proj as any).repeatMode = 'once';
        }
        if (proj.queueItemId === undefined) {
          (proj as any).queueItemId = null;
        }
      }
    }

    // 3.1 PR-D 迁移：旧 SmallCompany 没有 techMaturities 字段
    //     - 已收购的：技术早已应用，无需追溯，补空对象即可
    //     - 未收购的：按 20~80 随机 roll，让玩家在收购前可见成熟度
    for (const sc of data.smallCompanies) {
      if (sc.techMaturities === undefined) {
        sc.techMaturities = {};
        if (!sc.acquired) {
          for (const tid of sc.technologies) {
            sc.techMaturities[tid] = 20 + Math.floor(Math.random() * 61); // 20~80
          }
        }
      }
    }

    // 3.2 PR-B v2 迁移：旧 acceptedIdeaTechs 没有 difficulty 字段
    //     从原始池中匹配恢复难度；找不到则默认 4（中等偏上复杂度）
    const allPools = [...IDEA_TECH_POOL, ...OPEN_SOURCE_TECH_POOL, ...SMALL_COMPANY_TECH_POOL];
    for (const tech of data.acceptedIdeaTechs) {
      if (tech.difficulty === undefined) {
        const match = allPools.find((p) => p.id === tech.id);
        tech.difficulty = match?.difficulty ?? 4;
      }
    }

    // 3.3 PR-B v3 迁移：旧模型没有 postTraining 字段
    for (const model of data.models) {
      if (model.postTraining === undefined) {
        (model as any).postTraining = [];
      }
    }

    // 3.4 迁移：修复被 { ...array } 展平为对象的 resourceMeta 数组
    //     旧版 setResource 会把 power_plants / grid_power_contracts 等数组变成
    //     {0: item1, 1: item2, ...} 普通对象，导致 for-of 遍历崩溃
    for (const key of Object.keys(data.resourceMeta)) {
      const val: unknown = (data.resourceMeta as Record<string, unknown>)[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const obj = val as Record<string, unknown>;
        const entries = Object.entries(obj);
        // 所有 key 均为数字字符串 → 确认为被展平的数组，恢复
        if (entries.length > 0 && entries.every(([k]) => /^\d+$/.test(k))) {
          // 按数字索引排序后取 values
          entries.sort(([a], [b]) => Number(a) - Number(b));
          (data.resourceMeta as Record<string, unknown>)[key] = entries.map(([, v]) => v);
        }
      }
    }

    // 3.5 迁移：旧 CardInstance[] → 新 CardPool（聚合存储）
    //     旧版本每张卡独立对象，100k 卡场景下内存与遍历性能不可接受
    //     聚合后：100k 卡 ≈ 几千桶，遍历从 O(N) 降为 O(桶数)
    const cardModelIds = new Set(COMPUTE_CARD_SPECS.map((s) => s.resourceId));
    for (const key of Object.keys(data.resourceMeta)) {
      if (!cardModelIds.has(key)) continue;
      const val = (data.resourceMeta as Record<string, unknown>)[key];
      if (Array.isArray(val) && val.length > 0 && (val[0] as any)?.uid !== undefined) {
        // 旧 CardInstance[] 格式
        const cards = val as any[];
        (data.resourceMeta as Record<string, unknown>)[key] = migrateFromCards(cards, key);
      } else if (val && typeof val === 'object' && (val as any).aggregates !== undefined) {
        // 已是新 CardPool 格式，无需迁移
        continue;
      } else if (val === undefined || val === null) {
        // 未初始化，标记为新池
        (data.resourceMeta as Record<string, unknown>)[key] = createEmptyPool();
      }
    }

    // 4. 加载已接受的独有技术，重建运行时 IDEA_TECH_MAP
    if (data.acceptedIdeaTechs.length > 0) {
      for (const techNode of data.acceptedIdeaTechs) {
        IDEA_TECH_MAP[techNode.id] = techNode;
      }
    }
  }
}
