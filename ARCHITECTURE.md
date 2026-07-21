# 奇点纪元 (Singularity Era) — 架构文档

> **版本**：v2.0（基于当前代码现状重新核验）
> **适用代码基线**：`src/` 当前实现（2026-07）
> **读者**：新加入的开发者、维护者、二次开发者
>
> 本文档在《CODE_WIKI.md》基础上核验并扩写，重点补充：① 实际代码与旧文档的差异（17 系统 vs 旧文档 13 系统）；② 研发扩展子系统（Idea / 开源 / 小公司 / 后训练）的设计意图；③ 未在代码中显式说明的设计决策推断。

---

## 目录

- [1. 项目整体架构](#1-项目整体架构)
- [2. 技术选型概览](#2-技术选型概览)
- [3. 目录结构与分层职责](#3-目录结构与分层职责)
- [4. 主要模块职责](#4-主要模块职责)
- [5. 关键类与函数说明](#5-关键类与函数说明)
- [6. 依赖关系](#6-依赖关系)
- [7. 项目运行方式](#7-项目运行方式)
- [8. 系统组成与数据流](#8-系统组成与数据流)
- [9. 系统设计（补全与推断）](#9-系统设计补全与推断)
- [10. 设计原则与约束](#10-设计原则与约束)
- [11. 已知遗留问题与技术债](#11-已知遗留问题与技术债)

---

## 1. 项目整体架构

### 1.1 顶层架构风格

奇点纪元采用 **"分层 + ECS 启发"** 的混合架构：

```
┌────────────────────────────────────────────────────────────┐
│  表现层 (Presentation)   React 18 + CSS Modules             │
│  ─ src/ui/components/*   11 个面板组件                       │
│  ─ src/ui/hooks/*        useGame / useGameState             │
│  ─ src/ui/context/*      GameProvider（唯一耦合点）          │
└──────────────────────────┬─────────────────────────────────┘
                           │ 仅通过 GameContext 注入 Game 实例
┌──────────────────────────▼─────────────────────────────────┐
│  应用层 (Application)                                       │
│  ─ Game            主控制器，对外暴露 executeCommand/start  │
│  ─ GameLoop        主循环（rAF 驱动，按速度倍率累积天数）    │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│  领域层 (Domain)        纯 TypeScript，无 React/DOM 依赖     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Commands(30) │  │ Systems(17)  │  │ EventBus         │  │
│  │ 玩家意图封装  │  │ 每日推进状态  │  │ 系统间解耦通信    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                │
│  ┌──────▼─────────────────▼─────────────────────────────┐  │
│  │  GameState (immer produce 不可变更新)                │  │
│  └──────┬───────────────────────────────────────────────┘  │
│         │                                                  │
│  ┌──────▼──────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Entities(16)│  │ Config(19)   │  │ Utils(14)        │  │
│  │ 领域模型     │  │ 声明式配置    │  │ 纯计算函数        │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 1.2 分层职责一览

| 层 | 目录 | 职责 | 依赖方向 |
|---|------|------|---------|
| 表现层 | `src/ui/` | 渲染、收集用户输入、发送命令 | 仅依赖 core 的 Game 类型与 Command 类 |
| 应用层 | `src/core/Game.ts`、`GameLoop.ts` | 编排命令执行、调度系统更新 | 依赖领域层全部 |
| 领域层 | `src/core/{commands,systems,entities,config,utils,resources}` | 业务规则、状态演化 | 零外部依赖（除 immer） |
| 基础设施层 | `src/core/{EventBus,GameState,GameLoop}.ts` | 状态容器、事件分发、时间推进 | 仅依赖 immer |

### 1.3 架构特征

1. **单向数据流**：UI → Command → GameState → notify → UI 重渲染
2. **时间驱动模拟**：以"天"为最小粒度，`requestAnimationFrame` 累积真实毫秒换算游戏日
3. **ECS 启发**：实体是纯数据（interface），行为收敛在 System；但不同于严格 ECS，本项目的"组件"字段是集中在 `GameData` 单一状态树中，而非分散存储
4. **命令模式**：所有玩家写操作走 `Game.executeCommand`，可追踪、可回放、可扩展撤销
5. **配置驱动**：资源、硬件、地区、科技、员工、风险事件全部声明式注册

---

## 2. 技术选型概览

| 类别 | 选型 | 版本 | 选用理由（推断） |
|------|------|------|----------------|
| 语言 | TypeScript | ~5.8.3 | strict 模式保证大型状态树的类型安全 |
| UI 框架 | React | ^18.3.1 | 生态成熟，配合 CSS Modules 无运行时样式成本 |
| 构建 | Vite | ^6.3.5 | 极快冷启动，与 React 官方插件深度集成 |
| 状态管理 | Immer | ^10.1.1 | `produce` 写可变代码得不可变状态，避免手动 spread 深层嵌套 |
| 样式 | CSS Modules | 内置 | 无需 UI 库，深色科技感主题自定义成本低 |
| 包管理 | pnpm | — | 含 `pnpm-workspace.yaml`，为日后 monorepo 留口 |
| 代码检查 | ESLint 9 + typescript-eslint | ^9.25 | 含 react-hooks / react-refresh 插件 |
| 性能 | react-window | ^2.2.7 | 长列表（员工/模型/日志）虚拟滚动 |
| 路径别名 | vite-tsconfig-paths | ^5.1.4 | `@/*` → `./src/*`，单一来源 |

**刻意不引入的技术**（推断）：
- **无 Redux/Zustand**：状态唯一持有者是 `GameState`，外部 store 会造成双源
- **无 React Router**：单页面 + 面板切换，无路由需求
- **无后端**：纯前端单机模拟，存档为 JSON 字符串（未来可对接 localStorage / 云存档）

---

## 3. 目录结构与分层职责

```
project4/
├── src/
│   ├── core/                              # ★ 领域层（纯 TS，禁止 React/DOM）
│   │   ├── commands/            (30 文件) # 命令模式：玩家写操作封装
│   │   ├── config/              (19 文件) # 声明式配置：资源/硬件/地区/科技/员工/风险
│   │   ├── entities/            (16 文件) # 领域模型（全是 interface，无类）
│   │   ├── interfaces/          (2 文件)  # Command / System 接口
│   │   ├── resources/           (2 文件)  # ResourceRegistry + ResourceTypes
│   │   ├── systems/             (17 文件) # 每日推进的游戏系统
│   │   ├── utils/               (14 文件) # 纯计算与跨系统联动函数
│   │   ├── EventBus.ts                    # 事件总线（Map<string, Set<Handler>>）
│   │   ├── Game.ts                        # 主控制器
│   │   ├── GameLoop.ts                    # rAF 主循环
│   │   ├── GameState.ts                   # immer 状态容器 + GameData 定义
│   │   └── utils.ts                       # clamp 等通用工具
│   ├── ui/
│   │   ├── components/          (11 文件) # 面板组件
│   │   ├── context/                       # GameProvider
│   │   ├── hooks/                         # useGame / useGameState
│   │   └── styles/                        # CSS Modules
│   ├── main.tsx                           # 入口：组装 + 渲染
│   └── vite-env.d.ts
├── docs/                                  # 空目录（预留）
├── simulation/                            # 空目录（预留，未启用）
├── singularity-mvp/                       # 早期 MVP 原型残留，已归档
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── pnpm-workspace.yaml
├── README.md                              # 玩家向介绍
├── CODE_WIKI.md                           # 旧版代码 Wiki（13 系统版本，已过时）
└── ARCHITECTURE.md                        # 本文档
```

> **注意**：`docs/`、`simulation/` 当前为空目录；`singularity-mvp/` 是早期 v2 loop 实验残留，主代码已迁出至 `src/`，仅作历史参考。`.trae/documents/` 不存在。

---

## 4. 主要模块职责

### 4.1 核心层模块

| 模块 | 职责 | 职责边界（不做什么） |
|------|------|------------------|
| **Game** | 游戏入口，持有 state/events/registry/loop/systems；对外暴露 `executeCommand`、`start/pause/resume/setSpeed`、`save/load` | 不直接修改状态，不实现业务规则 |
| **GameState** | 不可变状态容器，提供 `read/update/subscribe/getResource/setResource/addResource`；按 ResourceDefinition 自动 clamp 边界 | 不知道任何业务含义，只做存储与通知 |
| **GameLoop** | rAF 驱动，按 `speed` 累积 `dayAccumulator`，每日触发 `advanceDay` | 不读取 `isPaused`（由 Game 控制 start/stop） |
| **EventBus** | `on/off/emit/clear`，emit 时快照遍历 + 单 handler 错误隔离 | 不持久化事件、不支持优先级 |
| **ResourceRegistry** | 资源蓝图注册中心，提供 `register/get/getByCategory/getTopBarResources` | 不持有数值，数值在 GameState.resources |

### 4.2 领域子层模块

| 子层 | 文件数 | 职责 | 设计意图 |
|------|-------|------|---------|
| **commands/** | 30 | 玩家写操作唯一入口；每个 Command 在 `execute(state, events)` 内完成"校验→变更→发事件"三步 | 让所有状态变更可追踪、可回放、可扩展撤销 |
| **systems/** | 17 | 每日按固定顺序执行 `update(state, events, deltaDays)`；系统间不直接调用，通过 EventBus 解耦 | 把"时间推进"与"玩家操作"分离成两个独立维度 |
| **entities/** | 16 | 纯数据 interface（无方法、无类），定义 GameData 的形状 | 让状态可 JSON 序列化（存档） |
| **config/** | 19 | 声明式配置，导出常量与 `*_MAP` 查找表 | 新增内容零改框架代码 |
| **utils/** | 14 | 纯函数计算（效率/市场/能力/并行/风险）+ 跨系统联动中枢 `crossSystemUtils` | 把"计算"与"状态变更"分离 |
| **resources/** | 2 | 资源蓝图（id/类别/边界/UI 配置） | 让资金、算力、员工等用同一套机制管理 |

### 4.3 UI 层模块

| 模块 | 职责 |
|------|------|
| **GameContext / GameProvider** | React 与 core 唯一耦合点，注入 Game 实例 |
| **useGame** | 取 Game 实例（未包 Provider 则抛错） |
| **useGameState(selector)** | 订阅 GameData 局部字段，`Object.is` 比较跳过未变更，避免全局重渲染 |
| **components/** | 11 个面板：TopBar / GameControls / StartupScreen / SettingsPanel / ResourceDevPanel / InfrastructurePanel / EmployeePanel / BusinessPanel / ModelPanel / ResearchPanel / App |

---

## 5. 关键类与函数说明

### 5.1 顶层类

#### `Game`（src/core/Game.ts，270 行）

```typescript
class Game {
  readonly state: GameState;
  readonly events: EventBus;
  readonly registry: ResourceRegistry;

  constructor(initialData: GameData, systems: System[], registry?: ResourceRegistry);

  executeCommand(cmd: Command): void;     // 唯一状态变更入口
  start(): void;                          // 启动主循环并解除暂停
  pause(): void;
  resume(): void;
  setSpeed(speed: number): void;          // 同步到 state.speed 与 loop.speed
  save(): string;                         // JSON 序列化
  load(json: string): void;               // 反序列化 + migrateOldData
}
```

**关键设计**：
- `migrateOldData(data)`：私有方法，处理历史版本字段缺失。当前包含：`DataCollectionProject.normalEngineerCount` 补算、IPO 轮次 `sharesOutstanding` 补算、早期存档的字段兜底。
- 构造时 `ensureInitialResourceValues()`：为 `INITIAL_RESOURCES` 中定义但 `initialData.resources` 缺失的键填 `initialValue`，幂等。

#### `GameState`（src/core/GameState.ts，386 行）

```typescript
class GameState {
  read(): Readonly<GameData>;
  update(recipe: (draft: GameData) => void): void;   // immer produce
  subscribe(listener: () => void): () => void;
  resetData(data: GameData): void;

  getResource(id: string): number;
  setResource(id: string, value: number, meta?: unknown): void;  // NaN 防护 + clamp
  addResource(id: string, delta: number): void;
}
```

**核心字段**（GameData，约 40 个顶层字段，分 9 组）：

| 组 | 字段 |
|----|------|
| 时间 | `date` / `startDate` / `isPaused` / `speed` |
| 资源 | `resources` / `resourceMeta` / `pendingOrders` |
| 实体集合 | `employees` / `models` / `datasets` / `trainingProjects` / `researchProjects` / `dataCollectionProjects` / `staffTrainings` / `pendingCandidates` |
| 基础设施 | `serverNodes` / `clusters` / `dataCenters` / `infraEventLog` |
| 科技 | `techMaturity` / `researchingTech` / `activeTechEffects` / `archMatrixSeed` / `experimentQueue` / `experimentResults` |
| 运营 | `operations` / `fundingRounds` / `competitorStates` / `externalCorps` |
| 风险 | `riskState` / `dataAcquisitionCooldowns` |
| 地区 | `headquartersRegionId` / `operatingRegionIds` / `publishedRegions` |
| 电力记账 | `lastDayPowerCost` / `lastDayPowerCostDate` |
| 公司治理 | `departments` / `managementMode` / `managementModeChangedDay` / `executives` / `lastTeamBuildingDay` / `lastPerformanceEvalDay` |
| 研发扩展 | `pendingIdeas` / `smallCompanies` / `openSourceOffers` / `acceptedIdeaTechs` / `lastSmallCompanyRefreshDay` / `lastOpenSourceDay` |

#### `GameLoop`（src/core/GameLoop.ts，146 行）

```typescript
class GameLoop {
  constructor(state: GameState, events: EventBus, systems: System[], raf?: RafAdapter);
  start(): void;  stop(): void;  setSpeed(s: number): void;
  private advanceDay(): void;
}
```

- `MS_PER_DAY = 1000`：speed=1 时，1 真实秒 = 1 游戏日
- 单帧最多推进 60 天（防止后台标签页回来后追帧过久）
- `RafAdapter` 接口允许测试时注入虚拟 rAF

#### `EventBus`（src/core/EventBus.ts，57 行）

```typescript
class EventBus {
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  emit(event: string, ...args: any[]): void;   // 快照遍历 + try/catch 隔离
  clear(event?: string): void;
}
```

### 5.2 接口（src/core/interfaces/）

```typescript
// Command.ts —— 所有玩家写操作
interface Command {
  execute(state: GameState, events: EventBus): void;
}

// System.ts —— 所有每日推进系统
interface System {
  name: string;
  update(state: GameState, events: EventBus, deltaDays: number): void;
}
```

### 5.3 关键工具函数（src/core/utils/）

#### `capabilityCalc.ts` —— 模型能力计算（302 行）

| 函数 | 用途 |
|------|------|
| `calcBaseScore(params)` | Chinchilla 缩放定律基础分：`f(params, data, compute)` |
| `calcContextFactor(contextLen, baseScore)` | 长序列修正因子 |
| `calcEmergencePenalty(capability, rawScore)` | 能力涌现非线性惩罚 |
| `calculateCapabilities(model, archMatrix)` | 生成 16 维真实能力向量 |
| `observeWithNoise(true, sigma)` | 玩家可见的带噪声观测值 |
| `calcTrainingCompute(params, tokens, contextLen)` | 训练所需 FLOPs 估算（含长序列修正） |
| `createSeededRng(seed)` | 种子化随机数（archMatrix 复现） |

#### `computeUtilization.ts` —— 算力利用率（540 行）

| 函数 | 用途 |
|------|------|
| `calculateEffectiveCompute(cards, cluster, strategy, tech, power)` | 有效算力 = 理论 × 软件 × 集群 × 冷却 × 电力 × 并行 × 互联 × 跨节点 × 规模 × 同构性 |
| `estimateRequiredMemory(params, strategy, precision)` | 显存估算，决定是否触发模型并行 |
| `calcParallelMaxContext(strategy, cards)` | 当前并行策略下的最大上下文 |
| `calcActualPowerDraw(card, utilization)` | GPU 实际功耗（非 TDP） |

#### `crossSystemUtils.ts` —— 跨系统联动中枢（553 行）

把"员工属性/技能/部门/公司协同"映射为对各系统的加成，是项目里最复杂的工具文件。

| 函数族 | 用途 |
|--------|------|
| `getStaffTrainingSpeedMultiplier / StabilityBonus` | 员工属性 → 训练加速/稳定性 |
| `getStaffResearchSpeedMultiplier` | 员工属性 → 研发加速 |
| `getStaffInfraFailureReduction` | 员工属性 → 故障率降低 |
| `getStaffRevenueMultiplier` | 员工属性 → 收入倍率 |
| `getStaffLegalRiskReductionPerDay` | 法务/公关 → 法律风险衰减 |
| `accumulateResearcherContribution(emp, amount)` | 累积员工贡献（供绩效评估） |
| `getCompanySkillBonus / Max` | 全公司技能加成（取最高/累加） |
| `getCompanyPowerReduction / CardWearReduction` | 公司技能 → 电力/磨损 |
| `getCompanyRevenueBoost / ComplianceBoost / CrisisReduction` | 公司技能 → 收入/合规/危机 |
| `getCompanyTrainingComputeReduction / CollectionSpeed / DataQuality / ResearchSpeed / ModelCap / TeamCoordination` | 公司技能对各子系统的加成 |

#### `employeeUtils.ts` —— 员工计算（223 行）

`calcEmployeeEfficiency(emp, depts, allEmployees)`：基础效率 × 属性 × 疲劳 × 忠诚度 × 部门 × 公司协同
`generateCandidateAttributes(role, level, channel)`：用 Dirichlet 采样生成候选人属性
`resignProbability(emp, company)`：离职概率（忠诚度 < 30 时指数上升）
`calcPerformanceScore(emp, contribution)`：绩效评分（S/A/B/C）

#### `marketCalc.ts` —— 市场计算（397 行）

`calcRegionMarket(region, player, competitors)`：地区市场份额（按能力向量加权）
`calcTotalRevenue(player, regions)`：总收入
`calcValuation(company)`：公司估值（用于融资/IPO）
`calcUserChurn(model, reputation)`：用户流失率

#### `trainingFeasibility.ts` —— 训练可行性（344 行）

`assessTrainingFeasibility(params, cards, tech)`：返回推荐的并行策略与预期利用率
`diagnoseTraining(...)`：返回 `blocker`（无法训练的原因）与 `warning`（可训练但低效）

### 5.4 系统层关键类（17 个系统）

执行顺序（`main.tsx` 第 131–149 行）：

| # | 系统 | 关键职责 | 主要事件 |
|---|------|---------|---------|
| 1 | `ComputeHardwareSystem` | 硬件采购订单到期交付、云租赁到期清理 | `HARDWARE_DELIVERED` / `COMPUTE_POWER_CHANGED` / `CLOUD_RENTAL_EXPIRED` |
| 2 | `PowerSystem` | 电力容量 vs 消耗、超容自动购电 | `GRID_PURCHASE` / `POWER_BALANCE` |
| 3 | `IdeaGenerationSystem` | **每 7 天**为每位研究员独立判定 idea 生成 | `IDEA_GENERATED` |
| 4 | `TechResearchSystem` | 推进 `researchingTech` 进度、处理 idea 验证、解锁效果激活 | `RESEARCH_COMPLETED` / `RESEARCH_PROGRESS` |
| 5 | `ResearchSystem` | 推进实验验证类项目、信任债务每日 -0.05 衰减 | `EXPERIMENT_COMPLETED` |
| 6 | `CollectionSystem` | 数据收集项目进度、按"加权平均"更新数据集质量 | `DATA_COLLECTED` |
| 7 | `InfrastructureFailureSystem` | 卡/节点/网络随机故障、自动恢复、热备池替换 | `CARD_FAILED` / `NODE_FAILED` / `NETWORK_GLITCH` / `TRAINING_PAUSED` |
| 8 | `TrainingSystem` | 训练进度（warmup/main/decay 三阶段）、训练事件、生成 Model | `TRAINING_COMPLETED` / `PLAYER_MODEL_RELEASED` / `TRAINING_EVENT` |
| 9 | `InfraMaintenanceSystem` | 三层基础设施维护成本、PUE 衰减、冷却电费 | `POWER_OVERLOAD` / `INFRA_MAINTENANCE` |
| 10 | `UniqueTechMaintenanceSystem` | **每日**扣独有技术维护费（$50 + $1×maturity）/项 | `UNIQUE_TECH_MAINT_UNDERFUNDED` |
| 11 | `PostTrainingSystem` | 推进 SFT / RLHF / DPO / CoT 后训练阶段 | （阶段完成事件） |
| 12 | `OperationsSystem` | 市场收入、Token 售卖、欺骗检测、IPO 股价、董事会指令 | `DECEPTION_EXPOSED` / `STOCK_DELISTED` / `MISSION_OFFERED` |
| 13 | `CompetitorSystem` | **每 7 天**对手 AI 决策（烧钱/融资/训练/发布/合并/破产） | `COMPETITOR_INTEL` / `COMPETITOR_BANKRUPT` / `COMPETITOR_RELEASE` / `COMPETITOR_MERGER` |
| 14 | `SmallCompanyMarketSystem` | **每 14 天**刷新 2~3 家小公司、清理 30 天到期未收购 | （小公司出现/消失） |
| 15 | `RiskSystem` | 风险事件触发、法务公关降债务、训练崩溃检查 | `RISK_EVENT` / `TRAINING_CRASH` |
| 16 | `RegionSystem` | 地区利润税、监管审查；导出 `getRegionModifiers` | （监管事件） |
| 17 | `StaffSystem` | 士气恢复、员工状态更新、薪资、绩效评估（**必须最后**） | `EMPLOYEE_RESIGNED` / `EMPLOYEE_LEVEL_UP` / `SALARY_PAID` / `PERFORMANCE_EVALUATED` |

> **顺序的设计意图**：
> - **ComputeHardware → Power**：新卡上架后才计算电力
> - **Tech → Research → Collection → Failure → Training**：技术加成生效后，训练才能享受当日新效率
> - **Failure 在 Training 之前**：故障导致的降速当日生效
> - **Operations 在 Competitor 之前**：玩家收入先结算，对手再反应
> - **Risk 在 Region 之前**：风险事件可能影响当日税率计算
> - **Staff 在最后**：绩效评估必须等 Research/Collection/Training 的贡献累积完；morale→loyalty 联动使用 Operations 已更新的当日士气值

### 5.5 命令层关键类（30 个文件，按类别分组）

| 类别 | 关键 Command | 用途 |
|------|-------------|------|
| 资源 | `AddResourceCommand` | 通用资源增减（内部用） |
| 硬件采购 | `PurchaseHardwareCommand` / `RentCloudComputeCommand` | 创建采购订单/云合约 |
| 电力 | `BuildPowerPlantCommand` / `GridPowerCommand` | 电站建造/电网购电 |
| 基础设施 | `InfraCommands.ts`（820 行，含 17 个 Command） | 买节点/装卡/建集群/建 DC/升级/维护/修复/报废 |
| 员工 | `HireEmployeeCommand` / `FireEmployeeCommand` / `AdjustSalaryCommand` / `PromoteEmployeeCommand` / `LearnSkillCommand` | 人事全生命周期 |
| 招聘 | `RequestRecruitmentCommand` / `HireCandidateCommand` / `RejectCandidateCommand` | 候选人三步流程 |
| 激励 | `IncentiveCommands.ts` | 奖金/股权/团建 |
| 部门 | `DepartmentCommands.ts` | 任命负责人/调动/普通员工分配 |
| 训练 | `TrainingCommands.ts`（698 行） | 启动/取消/恢复训练、调整卡分配、3D 并行策略 |
| 数据 | `DataCommands.ts`（644 行） | 购买/合成/自收集/数据集 CRUD |
| 研发 | `TechCommands` / `IdeaCommands` / `ManagementCommands` | 技术研发/idea 接受与拒绝/管理模式 |
| 模型 | `PublishModelCommand` / `OpenSourceCommands` | 发布/下架/开源策略 |
| 运营 | `OperationsCommands.ts` | 融资/Token 定价/欺骗操作/董事会指令 |
| 风险 | `RiskCommands.ts` | 和解/道歉/审计 |
| 敌对 | `HostileCommands.ts`（609 行） | 收购/挖角/袭击/黑客/渗透 |
| 小公司 | `SmallCompanyCommands.ts` | 收购小公司 |
| 知识蒸馏 | `DistillCompetitorCommand.ts` | 从对手模型蒸馏 |

---

## 6. 依赖关系

### 6.1 第三方库依赖

**运行时**（`dependencies`）：

| 包 | 版本 | 用途 | 耦合度 |
|----|------|------|-------|
| `react` | ^18.3.1 | UI 框架 | 仅 `src/ui/` |
| `react-dom` | ^18.3.1 | DOM 渲染 | 仅 `main.tsx` |
| `immer` | ^10.1.1 | 不可变状态 | 仅 `GameState.ts` |
| `react-window` | ^2.2.7 | 长列表虚拟滚动 | 仅部分面板 |

**开发时**（`devDependencies`）：
- `vite ^6.3.5` + `@vitejs/plugin-react ^4.4.1` + `vite-tsconfig-paths ^5.1.4`
- `typescript ~5.8.3`
- `eslint ^9.25.0` + `typescript-eslint ^8.30.1` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- 类型：`@types/react` / `@types/react-dom` / `@types/node`

**无外部服务依赖**：纯前端单机应用，不调用任何后端 API。

### 6.2 模块依赖方向

```
main.tsx
  ├── core/Game ─────────┬─ core/GameState ── immer
  │                      ├─ core/GameLoop ─── rAF (RafAdapter)
  │                      ├─ core/EventBus
  │                      ├─ core/resources/ResourceRegistry
  │                      ├─ core/interfaces/{Command,System}
  │                      └─ core/systems/* (17)
  │                             │ 读取
  │                             ├─ core/entities/*  (类型)
  │                             ├─ core/config/*    (配置)
  │                             └─ core/utils/*     (计算)
  ├── ui/context/GameContext   (注入 Game)
  └── ui/components/*          (useGame/useGameState)
         │ 发命令
         └─ core/commands/* ── 修改 GameState
```

### 6.3 关键依赖约束

| 规则 | 说明 |
|------|------|
| `src/core/` 禁止 import React/DOM | 唯一例外：GameLoop 的 rAF（已封装为 `RafAdapter`） |
| UI 只能通过 `GameContext` 访问 Game | 不允许直接 new Game |
| Command 与 System 不互相调用 | 通过 EventBus 通信 |
| Config 不依赖任何其他模块 | 纯常量与查找表 |
| Utils 不依赖 Systems/Commands | 可被任何层调用 |
| Entities 全是 interface | 无方法、无类，保证可 JSON 序列化 |

### 6.4 路径别名

`tsconfig.json` 配置 `@/*` → `./src/*`，由 `vite-tsconfig-paths` 自动同步给 Vite，无需重复配置。

---

## 7. 项目运行方式

### 7.1 环境要求

- **Node.js**：18+（推荐 20 LTS 或 22 LTS）
- **pnpm**：8+（项目含 `pnpm-workspace.yaml` 与 `pnpm-lock.yaml`）

### 7.2 安装与启动

```bash
# 1. 克隆后安装依赖
pnpm install

# 2. 启动开发服务器（默认 http://localhost:5173）
pnpm dev

# 3. 生产构建（先 tsc 类型检查再 vite build）
pnpm build

# 4. 预览构建产物
pnpm preview

# 5. 代码检查
pnpm lint

# 6. TypeScript 类型检查（不输出文件）
pnpm check
```

### 7.3 配置说明

#### `vite.config.ts`
- 插件：`@vitejs/plugin-react` + `vite-tsconfig-paths`
- 构建：`build.sourcemap: 'hidden'`（生成 sourcemap 但不引用，便于线上排错）

#### `tsconfig.json`
- `strict: true` + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch`
- `jsx: react-jsx`（无需手动 import React）
- `noEmit: true`（Vite 负责打包，tsc 仅类型检查）

#### `eslint.config.js`
- 平铺配置（flat config）
- 启用 `react-hooks/rules-of-hooks` 与 `react-hooks/exhaustive-deps`
- 启用 `react-refresh/only-export-components`（HMR 友好）

### 7.4 游戏开局流程

1. **启动** → `StartupScreen` 显示 3 步向导
2. **第 1 步：选总部** → 33 个地区，推荐 7 个（高经济水平）
3. **第 2 步：选预设** → 3 个内置（bootstrapper / balanced / tech_heavy）或自定义
4. **第 3 步：确认** → 执行 `SetHeadquartersCommand` 初始化运营区/基础设施/资源
5. **进入主界面** → TopBar + GameControls + 7 个可切换面板

---

## 8. 系统组成与数据流

### 8.1 子系统划分

按业务域划分，项目由 8 个子系统组成：

```
┌────────────────────────────────────────────────────────────────┐
│  1. 资源与基础设施子系统                                        │
│     Resources / Power / Hardware / Cloud / DataCenter          │
│     ─ ComputeHardwareSystem, PowerSystem,                      │
│       InfrastructureFailureSystem, InfraMaintenanceSystem      │
├────────────────────────────────────────────────────────────────┤
│  2. 人力资源子系统                                              │
│     Employee / Candidate / Department / Training / Incentive   │
│     ─ StaffSystem                                              │
├────────────────────────────────────────────────────────────────┤
│  3. 研发子系统                                                  │
│     TechTree / Experiment / Idea / UniqueTech                  │
│     ─ IdeaGenerationSystem, TechResearchSystem, ResearchSystem,│
│       UniqueTechMaintenanceSystem                              │
├────────────────────────────────────────────────────────────────┤
│  4. 数据子系统                                                  │
│     Dataset / Collection / Acquisition                         │
│     ─ CollectionSystem                                         │
├────────────────────────────────────────────────────────────────┤
│  5. 训练子系统                                                  │
│     PreTraining / PostTraining(SFT/RLHF/DPO/CoT)               │
│     ─ TrainingSystem, PostTrainingSystem                       │
├────────────────────────────────────────────────────────────────┤
│  6. 市场与运营子系统                                            │
│     Region / Operation / Funding / IPO / Board                 │
│     ─ OperationsSystem, RegionSystem                           │
├────────────────────────────────────────────────────────────────┤
│  7. 竞争子系统                                                  │
│     Competitor / SmallCompany / OpenSource                     │
│     ─ CompetitorSystem, SmallCompanyMarketSystem               │
├────────────────────────────────────────────────────────────────┤
│  8. 风险子系统                                                  │
│     LegalDebt / TrustDebt / Morale / Reputation / Alignment    │
│     ─ RiskSystem                                               │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 组件交互流程（典型一天）

```
06:00:00  GameLoop.tick() 累积满 1000ms × speed
          ↓
06:00:01  emit('DAY_START', date)
          ↓
06:00:02  [1] ComputeHardwareSystem.update
              - 处理到期采购订单 → 新卡入池
              - 清理到期云合约
          ↓
06:00:03  [2] PowerSystem.update
              - 重算电力容量/消耗
              - 超容部分自动购电，累加 lastDayPowerCost
          ↓
06:00:04  [3] IdeaGenerationSystem.update (每 7 天)
              - 每位研究员独立判定 idea 生成
              - 加入 pendingIdeas
          ↓
06:00:05  [4] TechResearchSystem.update
              - 推进 researchingTech 进度
              - 推进 verifying 中的 idea
              - 完成时激活 tech.effect
          ↓
06:00:06  [5] ResearchSystem.update
              - 推进实验验证项目
              - 信任债务 -0.05
          ↓
06:00:07  [6] CollectionSystem.update
              - 推进数据收集项目
              - 按"加权平均"更新数据集质量
          ↓
06:00:08  [7] InfrastructureFailureSystem.update
              - 恢复昨日网络故障
              - offline 卡自动恢复
              - 热备池替换 broken 卡
              - 随机故障判定（卡/节点/网络）
          ↓
06:00:09  [8] TrainingSystem.update
              - 自动恢复风险暂停的训练
              - 推进训练（warmup/main/decay 三阶段修正利用率）
              - 损失更新（期望值 + 高斯噪声）
              - 训练事件判定（spike/explosion，回退 checkpoint）
              - 完成时生成 Model（baseScore × capabilities × stability）
          ↓
06:00:10  [9] InfraMaintenanceSystem.update
              - 扣三层维护成本
              - 计算冷却电费，累加 lastDayPowerCost
              - PUE 衰减
          ↓
06:00:11  [10] UniqueTechMaintenanceSystem.update
              - 扣独有技术维护费
              - 资金不足发 UNDERFUNDED 事件
          ↓
06:00:12  [11] PostTrainingSystem.update
              - 推进 SFT/RLHF/DPO/CoT 阶段
              - 完成时按 maturity/100 缩放增益追加到能力
          ↓
06:00:13  [12] OperationsSystem.update
              - 市场收入（已发布模型）
              - Token 售卖（空闲算力）
              - 用户流失
              - 欺骗检测曝光
              - IPO 股价波动（3%）
              - 对赌检查、董事会指令生成
          ↓
06:00:14  [13] CompetitorSystem.update (每 7 天)
              - 对手烧钱/融资/训练/发布/合并/破产
          ↓
06:00:15  [14] SmallCompanyMarketSystem.update (每 14 天)
              - 刷新 2~3 家小公司
              - 清理 30 天到期未收购
          ↓
06:00:16  [15] RiskSystem.update
              - 扫描模型能力，判定风险事件
              - 法务公关降 legalDebt/trustDebt
              - 训练崩溃检查（基于并行规模与可靠性）
          ↓
06:00:17  [16] RegionSystem.update
              - 计算当日利润税（基于 lastDayPowerCost + 非电力成本）
              - 声誉 <20 触发监管审查
          ↓
06:00:18  [17] StaffSystem.update
              - 士气恢复 +0.1/天
              - 员工培训推进、疲劳累积、经验升级
              - 忠诚度衰减、离职检查
              - 每 30 天发薪
              - 每 30 天绩效评估
          ↓
06:00:19  state.update(draft => draft.date += 1)
          ↓
06:00:20  emit('DAY_END', newDate)
          ↓
06:00:21  GameState.notify() → useGameState 触发 React 重渲染
```

### 8.3 玩家操作数据流

```
用户点击"购买 H100 × 8"
  ↓
PurchaseHardwareCommand 构造（modelId='H100', quantity=8）
  ↓
game.executeCommand(cmd)
  ↓
cmd.execute(state, events):
  ├─ 校验：资金 ≥ 8 × $25k？
  ├─ state.update(draft => {
  │     draft.resources.funds -= 200_000;
  │     draft.pendingOrders.push({ modelId:'H100', quantity:8, deliveryDay:date+7 });
  │   })
  └─ events.emit('HARDWARE_ORDERED', { ... })
  ↓
GameState.notify()
  ↓
useGameState(s => s.resources.funds) 检测到变更
  ↓
TopBar 重渲染，资金显示更新
```

### 8.4 跨系统协作链（关键）

| 链路 | 说明 |
|------|------|
| **电力成本链** | `PowerSystem`(IT 电费) + `InfraMaintenanceSystem`(冷却电费) → 写入 `lastDayPowerCost` → `RegionSystem` 作为利润税基 |
| **故障容错链** | `InfrastructureFailureSystem`(卡/节点故障降速) + `RiskSystem`(训练崩溃回退) → `TrainingSystem`(`autoResumeDay` 自动恢复) |
| **研发加速链** | `TechResearchSystem` 解锁技术 → `CollectionSystem`/`ResearchSystem`/`TrainingSystem`/`RiskSystem` 读取 `activeTechEffects` |
| **员工贡献链** | `CollectionSystem`/`ResearchSystem`/`TrainingSystem` 调用 `accumulateResearcherContribution` → `StaffSystem` 绩效评估 |
| **市场博弈链** | `OperationsSystem`(玩家收入) + `CompetitorSystem`(对手模拟) → 用户流失/声誉/股价联动 |
| **Idea 链** | `IdeaGenerationSystem` 生成 idea → 玩家 `AcceptIdeaCommand` → `TechResearchSystem.processIdeaVerification` 推进 → 成功应用效果 / 失败仅 25% |
| **后训练链** | `TrainingSystem` 完成预训练 → 玩家选择 SFT/RLHF/DPO/CoT → `PostTrainingSystem` 推进 → 按 maturity 缩放追加能力 |

---

## 9. 系统设计（补全与推断）

本节基于代码注释、配置数值与系统行为，**推断并补全**未在文档中显式说明的设计意图。

### 9.1 数值设计的"难度曲线"推断

代码中多处出现"随进度变难"的设计：

```typescript
// IdeaGenerationSystem
difficultyMult = max(0.15, 1.0 - unlockedCount × 0.025 - day × 0.0003)
// 解锁 10 项技术 → -0.25，20 项 → -0.50，30 项 → -0.75
// 每 1000 天额外 -0.30，下限 0.15
```

**设计意图推断**：
- 防止"科技滚雪球"：前期 idea 频繁，后期必须通过收购小公司/开源采纳获得独有技术
- 与 `UniqueTechMaintenanceSystem` 的维护费形成"成本-收益"平衡：拥有 13 项满级独有技术 ≈ $58.5k/月维护费

### 9.2 故障容错的"降速优于崩溃"原则

```typescript
// InfrastructureFailureSystem 容错设计
// 卡故障仅"降速"训练，>30% 卡故障或 >50% 节点故障才暂停回退
```

**设计意图推断**：
- 避免"一次故障毁掉 30 天训练"的挫败感
- 让玩家有"降级运行"的缓冲期来响应（修复卡/调整策略）
- 与 `RiskSystem.calcTrainingCrashProbability` 的 10% 上限形成"双保险"

### 9.3 能力评估的"真实-观测"双层模型

```typescript
// capabilityCalc.ts
trueCapabilities = calculateCapabilities(...)          // 玩家不可见
observedCapabilities = observeWithNoise(true, sigma)   // 玩家可见
```

**设计意图推断**：
- 模拟现实中"模型能力评估有误差"的不确定性
- 让玩家在"是否发布"决策中承担信息不完备的风险
- `archMatrixSeed` 按种子生成本局架构-能力映射，保证同一存档内可复现，不同存档间有探索性

### 9.4 训练的"三阶段利用率修正"

```typescript
// TrainingSystem
if (progress < 0.05) utilization ×= warmupFactor       //  warmup
else if (progress < 0.85) utilization ×= mainFactor    //  main
else utilization ×= decayFactor                        //  decay
```

**设计意图推断**：
- 模拟真实训练：warmup 阶段 GPU 利用率低，main 阶段满负荷，decay 阶段（LR 衰减）利用率下降
- 让玩家对"训练周期"有更真实的预期，不能用"总算力 ÷ 单卡算力"简单估算

### 9.5 训练的"损失函数 + 高斯噪声"模型

```typescript
// TrainingSystem
expectedLoss = 2.5 + 7.5 × exp(-5 × progress)   // 初始 10，渐近 2.5
actualLoss = expectedLoss + gaussianNoise(0, sigma)
// 主训练期噪声更大，模拟 loss spike
```

**设计意图推断**：
- 期望损失曲线参考了 GPT-3 / Chinchilla 论文的 scaling law
- 高斯噪声用 Box-Muller 变换生成，保证统计特性
- "主训练期噪声更大"模拟了真实训练中期的 instability

### 9.6 公司治理的"扁平化 vs 层级化"

```typescript
// GameData
managementMode: 'flat' | 'hierarchical'
executives: { ceoId, cooId, cfoId, ctoId }
```

**设计意图推断**（代码已支持但 UI 暴露有限）：
- `flat`：初创期，部门负责人直接对玩家负责，协同加成高但单点领导力要求高
- `hierarchical`：扩张期，引入 CXO 层，降低单点依赖但增加管理成本
- `managementModeChangedDay` 记录切换日期，用于"切换后 N 天内效率波动"的模拟（代码中 `-999` 初始值表示从未切换）

### 9.7 后训练阶段的"互斥与前置"

```typescript
// PostTrainingSystem
rlhf: { requires: 'sft', mutuallyExclusive: ['dpo'] }
dpo:  { requires: 'sft', mutuallyExclusive: ['rlhf'] }
cot:  { requires: null, mutuallyExclusive: [] }
```

**设计意图推断**：
- `RLHF` 与 `DPO` 互斥：两者都是对齐技术，堆叠收益递减且成本高
- `SFT` 是 `RLHF/DPO` 的前置：符合真实 LLM 训练流水线（先监督微调，再偏好优化）
- `CoT` 独立：思维链训练与对齐技术正交

### 9.8 小公司与开源的"技术获取多样化"

```
技术获取渠道（按成熟度与成本排序）：
1. 自研（techTree）       — maturity 从 0 到 100，时间 + 资金
2. Idea 验证              — 加速已有技术 / 生成独有技术（maturity 5 起步）
3. 开源采纳               — maturity 20~40，成本 $50k~$200k，14 天窗口
4. 收购小公司             — maturity 20~80，成本 $200k~$1.7M
5. 收购大型竞争对手       — 全部技术 + 算力 + 员工，成本最高
```

**设计意图推断**：
- 提供"时间 vs 金钱"的权衡：自研最省钱但最慢，收购最贵但最快
- 小公司 30 天生命周期 + 开源 14 天窗口，制造"机会成本"压力
- 与 `UniqueTechMaintenanceSystem` 的维护费形成"获取容易维护难"的平衡

### 9.9 对手的"7 种策略"

代码中 `CompetitorStrategy` 包含 7 种（推断）：`aggressive` / `balanced` / `conservative` / `tech_focused` / `capital_focused` / `compliance_focused` / `open_source`

**设计意图推断**：
- `open_source` 策略的对手（Menta / Mistral / ShallowFind）会触发 `OpenSourceOffer`，给玩家"免费技术"机会
- 不同策略影响对手的融资/训练/发布节奏，避免"所有对手行为趋同"
- 5% 概率合并事件模拟真实 AI 行业的并购潮

### 9.10 欺骗操作的"风险-收益对"

```typescript
// OperationsCommands.ts
ToggleStealUserDataCommand / ToggleSkipSafetyCommand / SetDowngradeLevelCommand
```

**设计意图推断**：
- 每个欺骗操作都有 `deceptionState` 追踪
- `OperationsSystem` 每日判定是否曝光（声誉 -15、trustDebt +1）
- 形成"短期收入 vs 长期信任"的抉择，与风险系统的 5 维负债联动

### 9.11 资源管理的"蓝图 + 实例"分离

```typescript
// ResourceDefinition（蓝图）        // CardInstance（实例）
{ id, name, category, minValue,      { uid, modelId, status, age,
  maxValue, initialValue, uiConfig }   assignedProjectId, location }
```

**设计意图推断**：
- 蓝图定义"这类资源是什么"，实例定义"这个具体资源在哪、状态如何"
- 让 `resources` 只存数值（`Record<string, number>`），实例状态单独存（`CardInstance[]`）
- 支持"7 种 GPU 型号"作为资源，但每张卡又有独立的故障/老化状态

### 9.12 存档迁移的"向前兼容"

```typescript
// Game.migrateOldData
if (!data.dataCollectionProjects[0].normalEngineerCount) {
  data.dataCollectionProjects.forEach(p => p.normalEngineerCount = 0);
}
if (ipoRound && !ipoRound.sharesOutstanding) {
  ipoRound.sharesOutstanding = ...;
}
```

**设计意图推断**：
- 每次新增字段，都在 `migrateOldData` 中补默认值
- 让玩家旧存档可以无缝升级，避免"版本更新导致存档作废"
- 这种"防御性迁移"是单机游戏存档的最佳实践

---

## 10. 设计原则与约束

### 10.1 核心原则

| # | 原则 | 体现 |
|---|------|------|
| 1 | **核心逻辑与 UI 分离** | `src/core/` 纯 TS，可独立测试；唯一例外 GameLoop 的 rAF 已封装 `RafAdapter` |
| 2 | **配置驱动** | 新资源/硬件/地区/科技通过配置文件添加；系统通过 `*_MAP` 自动接入 |
| 3 | **命令模式** | 所有状态变更走 `Game.executeCommand`，可追踪可回滚（除 SettingsPanel 调试入口） |
| 4 | **系统解耦** | 17 个系统通过 EventBus 通信，按固定顺序每日执行 |
| 5 | **不可变状态** | Immer `produce` 管理更新；`GameState` 自动按 `ResourceDefinition` clamp |
| 6 | **可替换基础设施** | `RafAdapter` 可注入测试/服务端实现；`ResourceRegistry` 可外部传入 |
| 7 | **存档兼容** | `Game.migrateOldData` 处理历史版本字段缺失 |
| 8 | **容错设计** | 故障仅"降速"不直接崩溃；EventBus 单 handler 抛错不中断其他 |

### 10.2 硬性约束（开发时必须遵守）

1. **`src/core/` 禁止 import React/DOM** — 保证核心可独立测试
2. **UI 只能通过 `GameContext` 访问 Game** — 不允许直接 new Game
3. **Command 与 System 不互相调用** — 通过 EventBus 通信
4. **Config 不依赖任何其他模块** — 纯常量与查找表
5. **Entities 全是 interface** — 无方法、无类，保证可 JSON 序列化
6. **新增资源必须 `registry.register`** — 否则 `setResource` 不会 clamp
7. **新增系统必须加到 `main.tsx` systems 数组** — 顺序影响业务正确性
8. **新增字段必须在 `migrateOldData` 中补默认值** — 保证旧存档兼容

---

## 11. 已知遗留问题与技术债

### 11.1 文档与代码不一致

| 项 | 旧文档 | 实际代码 | 建议 |
|----|-------|---------|------|
| 系统数量 | 13 | **17** | 已更新 |
| `.trae/documents/` | 声称存在 | 不存在 | 已删除引用 |
| `docs/` 内容 | 声称有文档 | 空目录 | 已标注 |
| `simulation/` 内容 | 声称有脚本 | 空目录 | 已标注 |
| `singularity-mvp/` 状态 | 未说明 | 早期 MVP 残留 | 已标注 |

### 11.2 代码层面的技术债

| 项 | 位置 | 问题 | 建议 |
|----|------|------|------|
| 配置文件过大 | `config/regions.ts` (904 行) | 33 个地区全部硬编码 | 考虑拆分为 `regions/{asia,europe,americas,...}.ts` |
| 工具文件过大 | `utils/crossSystemUtils.ts` (553 行) | 跨系统联动中枢，函数过多 | 按业务域拆分（training/research/operations/...） |
| 命令文件过大 | `commands/InfraCommands.ts` (820 行) | 17 个 Command 集中在一个文件 | 拆分为 `infra/{node,cluster,datacenter,card}Commands.ts` |
| 训练命令过大 | `commands/TrainingCommands.ts` (698 行) | 训练相关 Command 集中 | 同上 |
| 数据命令过大 | `commands/DataCommands.ts` (644 行) | 数据相关 Command 集中 | 同上 |
| 敌对命令过大 | `commands/HostileCommands.ts` (609 行) | 收购/挖角/袭击/黑客/渗透集中 | 拆分为 `hostile/{acquire,poach,hack,infiltrate}Commands.ts` |
| 旧版兼容文件 | `config/techTreeP1.ts` (7 行) | 仅重导出，已无实际用途 | 删除并更新引用 |

### 11.3 设计层面的待完善点

| 项 | 现状 | 建议方向 |
|----|------|---------|
| **管理模式** | `managementMode` 字段已存在但 UI 暴露有限 | 在 EmployeePanel 增加"管理模式"切换，展示 flat vs hierarchical 的差异 |
| **CXO 系统** | `executives` 字段已存在但无任命 UI | 增加 CXO 任命流程，影响公司协同加成 |
| **撤销/重做** | Command 模式已具备基础 | 实现 Command 历史栈 + undo/redo（需处理副作用如事件发射） |
| **存档槽位** | `save()` 返回 JSON 字符串 | 实现多槽位存档 UI（localStorage / IndexedDB） |
| **云存档** | 无 | 对接后端，实现跨设备同步 |
| **多人模式** | README 提及但未实现 | 需要先抽象出"玩家"概念，当前 Game 是单玩家的 |
| **测试覆盖** | 无单元测试 | `src/core/` 是纯 TS，非常适合 Vitest 覆盖；建议优先覆盖 `capabilityCalc` / `computeUtilization` / `crossSystemUtils` |
| **性能监控** | 无 | `GameLoop` 单帧最多推进 60 天，但未监控实际帧耗时；建议增加性能埋点 |
| **i18n** | 中文硬编码 | 如需国际化，需抽离所有 UI 文案到 locale 文件 |
| **可访问性** | 无 ARIA 标签 | 深色主题 + 大量数值，建议增加键盘导航与屏幕阅读器支持 |

### 11.4 数值平衡待验证

以下数值是代码中的硬编码，**推断为初版平衡性数值，可能需要根据玩家反馈调整**：

| 数值 | 位置 | 当前值 | 影响 |
|------|------|-------|------|
| `MS_PER_DAY` | GameLoop | 1000ms | speed=1 时的游戏节奏 |
| `COMPETITOR_TICK_DAYS` | CompetitorSystem | 7 天 | 对手决策频率 |
| `IDEA_TICK_DAYS` | IdeaGenerationSystem | 7 天 | idea 生成频率 |
| `REFRESH_DAYS` | SmallCompanyMarketSystem | 14 天 | 小公司刷新频率 |
| `LIFESPAN` | SmallCompanyMarketSystem | 30 天 | 小公司生命周期 |
| `PERFORMANCE_EVAL_PERIOD` | StaffSystem | 30 天 | 绩效评估周期 |
| `WORK_FATIGUE_BASE` | StaffSystem | 未读 | 疲劳累积速度 |
| 训练崩溃概率上限 | RiskSystem | 10% | 训练风险上限 |
| IPO 股价波动率 | OperationsSystem | 3% | 股价波动幅度 |
| 欺骗曝光声誉损失 | OperationsSystem | -15 | 欺骗代价 |
| 信任债务每日衰减 | ResearchSystem | -0.05 | 信任恢复速度 |
| 士气每日恢复 | StaffSystem | +0.1 | 士气恢复速度 |
| 忠诚度每日衰减 | StaffSystem | -0.1 | 忠诚度衰减速度 |

---

## 附录 A：事件清单（EventBus）

按事件名分组：

| 事件名 | 发射者 | 负载 | 用途 |
|--------|-------|------|------|
| `DAY_START` | GameLoop | `date` | 每日开始 |
| `DAY_END` | GameLoop | `date` | 每日结束 |
| `HARDWARE_DELIVERED` | ComputeHardwareSystem | `{modelId, quantity}` | 硬件到货 |
| `HARDWARE_ORDERED` | PurchaseHardwareCommand | `{modelId, quantity, cost}` | 下单 |
| `COMPUTE_POWER_CHANGED` | ComputeHardwareSystem | `{newTotal}` | 算力变更 |
| `CLOUD_RENTAL_EXPIRED` | ComputeHardwareSystem | `{contractId}` | 云租赁到期 |
| `GRID_PURCHASE` | PowerSystem | `{kwh, cost}` | 电网购电 |
| `POWER_BALANCE` | PowerSystem | `{capacity, consumption}` | 电力平衡 |
| `POWER_OVERLOAD` | InfraMaintenanceSystem | `{dataCenterId}` | 电力过载 |
| `IDEA_GENERATED` | IdeaGenerationSystem | `{idea}` | idea 生成 |
| `RESEARCH_COMPLETED` | TechResearchSystem | `{techId}` | 技术研发完成 |
| `RESEARCH_PROGRESS` | TechResearchSystem | `{techId, progress}` | 研发进度 |
| `EXPERIMENT_COMPLETED` | ResearchSystem | `{projectId, result}` | 实验完成 |
| `DATA_COLLECTED` | CollectionSystem | `{datasetId, amount}` | 数据收集 |
| `CARD_FAILED` | InfrastructureFailureSystem | `{cardUid, severity}` | 卡故障 |
| `NODE_FAILED` | InfrastructureFailureSystem | `{nodeId}` | 节点故障 |
| `NETWORK_GLITCH` | InfrastructureFailureSystem | `{clusterId}` | 网络故障 |
| `TRAINING_PAUSED` | InfrastructureFailureSystem / RiskSystem | `{projectId, reason}` | 训练暂停 |
| `TRAINING_COMPLETED` | TrainingSystem | `{projectId, modelId}` | 训练完成 |
| `TRAINING_EVENT` | TrainingSystem | `{projectId, eventType}` | 训练事件（spike 等） |
| `TRAINING_CRASH` | RiskSystem | `{projectId, lostFlops}` | 训练崩溃 |
| `PLAYER_MODEL_RELEASED` | TrainingSystem / PublishModelCommand | `{modelId}` | 模型发布 |
| `INFRA_MAINTENANCE` | InfraMaintenanceSystem | `{cost}` | 维护成本 |
| `UNIQUE_TECH_MAINT_UNDERFUNDED` | UniqueTechMaintenanceSystem | `{dailyCost, totalCost}` | 维护费不足 |
| `DECEPTION_EXPOSED` | OperationsSystem | `{type}` | 欺骗曝光 |
| `STOCK_DELISTED` | OperationsSystem | — | 退市 |
| `STOCK_PRICE_CHANGED` | OperationsSystem | `{newPrice}` | 股价变动 |
| `MISSION_OFFERED` | OperationsSystem | `{mission}` | 董事会指令 |
| `VAM_FAILED` | OperationsSystem | `{roundId}` | 对赌失败 |
| `COMPETITOR_INTEL` | CompetitorSystem | `{competitorId, intel}` | 对手情报 |
| `COMPETITOR_RELEASE` | CompetitorSystem | `{competitorId, modelId}` | 对手发布 |
| `COMPETITOR_BANKRUPT` | CompetitorSystem | `{competitorId}` | 对手破产 |
| `COMPETITOR_MERGER` | CompetitorSystem | `{acquirerId, targetId}` | 对手合并 |
| `INDUSTRY_PANIC` | CompetitorSystem | `{trigger}` | 行业恐慌 |
| `RISK_EVENT` | RiskSystem | `{eventId, impact}` | 风险事件 |
| `EMPLOYEE_RESIGNED` | StaffSystem | `{employeeId}` | 员工离职 |
| `EMPLOYEE_LEVEL_UP` | StaffSystem | `{employeeId, newLevel}` | 员工升级 |
| `SALARY_PAID` | StaffSystem | `{totalCost}` | 发薪 |
| `PERFORMANCE_EVALUATED` | StaffSystem | `{results}` | 绩效评估完成 |
| `STAFF_TRAINING_COMPLETED` | StaffSystem | `{trainingId, employeeId}` | 培训完成 |

## 附录 B：资源清单（ResourceRegistry）

`INITIAL_RESOURCES` 注册的资源（按 category 分组）：

| category | 资源 id | 说明 |
|----------|--------|------|
| currency | `funds` | 资金（美元） |
| hardware | `L40S` / `A100_40G` / `A100_80G` / `H100` / `H200` / `B200` / `GB300` | 7 种 GPU 库存 |
| energy | `power_kw` | 电力容量（kW） |
| energy | `compute_power` | 算力（TFLOPS） |
| human | `normal_researcher` / `normal_data_engineer` / `normal_system_engineer` / `normal_pm` / `normal_legal` | 5 种普通员工 |
| asset | （预留） | — |
| custom | （预留） | — |

## 附录 C：科技树概览

| 阶段 | 数量 | 范围 |
|------|------|------|
| P0（基础） | 11 | pretraining / sft / rlhf / dpo / cot_training / ... |
| P1（进阶） | 13 | （合并到 techTree.ts） |
| P2（并行策略） | 4 | dp / pp / tp / ep / cp |
| **独有技术池** | 20+ | 来自 idea / 开源 / 小公司 |

## 附录 D：能力向量（16 维）

| 类别 | 维度 |
|------|------|
| 显性（玩家可见） | 对话流畅 / 指令遵循 / 数学推理 / 逻辑推理 / 编码 / 知识问答 / 多语言 |
| 隐性（影响风险） | 谄媚 / 诚实 / 对齐 / 欺骗倾向 / 工具使用 / 长上下文 / 多模态 / 涌现能力 / 安全性 |

---

## 文档维护说明

- 本文档基于代码现状生成，**反映当前实现**而非设计初衷
- 代码中散布的 `设计-N`、`BUG-N`、`PR-X`、`P0-N` 注释是历史设计决策的锚点，改动时建议先检索对应编号
- 当系统数量、GameData 字段、命令清单发生变化时，**必须同步更新本文档**
- 数值平衡章节（11.4）需根据玩家反馈与测试数据持续调整

---

> **文档版本**：v2.0
> **最后更新**：2026-07-21
> **维护者**：开发团队
