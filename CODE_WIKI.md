# 奇点纪元 (Singularity Era) — Code Wiki

> AI 公司模拟经营游戏。玩家从零创建一家 AI 公司，经历研发、训练、发布、市场竞争的完整流程，最终打造通用人工智能。
>
> 本文档为项目代码 Wiki，覆盖整体架构、模块职责、关键类与函数、依赖关系及运行方式。

---

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 目录结构](#3-目录结构)
- [4. 整体架构](#4-整体架构)
- [5. 核心层 (src/core/)](#5-核心层-srccore)
  - [5.1 Game 主控制器](#51-game-主控制器)
  - [5.2 GameState 状态管理](#52-gamestate-状态管理)
  - [5.3 GameLoop 主循环](#53-gameloop-主循环)
  - [5.4 EventBus 事件总线](#54-eventbus-事件总线)
  - [5.5 资源系统](#55-资源系统)
  - [5.6 Command / System 接口](#56-command--system-接口)
- [6. 实体层 (entities/)](#6-实体层-entities)
- [7. 系统层 (systems/)](#7-系统层-systems)
- [8. 命令层 (commands/)](#8-命令层-commands)
- [9. 配置层 (config/)](#9-配置层-config)
- [10. 工具层 (utils/)](#10-工具层-utils)
- [11. UI 层 (src/ui/)](#11-ui-层-srcui)
- [12. 依赖关系](#12-依赖关系)
- [13. 项目运行方式](#13-项目运行方式)
- [14. 设计原则](#14-设计原则)

---

## 1. 项目概述

奇点纪元是一款单页面 AI 公司模拟经营游戏。玩家管理资金、算力卡、员工、数据集与模型，以"天"为最小时间单位推进游戏。游戏覆盖完整的 AI 公司生命周期：开局选址 → 资源积累 → 模型训练 → 市场发布 → 融资扩张 → 与 8 家 AI 竞争对手博弈 → 迈向 AGI。

核心玩法维度：
- **算力基础设施**：4 级层级（数据中心→集群→节点→计算卡），7 种 GPU 型号，自建电站 + 电网购电 + 云算力租赁
- **人力资源**：5 种核心员工角色 + 5 种普通员工，等级/属性/技能/绩效/激励/培训体系
- **模型训练**：Chinchilla 缩放定律算力估算、5 种并行策略（DP/PP/TP/EP/CP）、训练事件、能力评估
- **研发体系**：两阶段科技树（28 项技术）+ 实验验证研发 + 架构-能力映射矩阵
- **市场与竞争**：33 个全球地区、5 种融资方式、8 家竞争对手 AI、激进操作（收购/挖角/黑客/渗透）
- **风险系统**：法律/信任/士气/声誉/对齐 5 维负债、8 种风险事件

## 2. 技术栈

| 类别 | 选型 |
|------|------|
| 前端框架 | React 18 |
| 编程语言 | TypeScript 5.8（strict 严格模式） |
| 构建工具 | Vite 6 |
| 状态管理 | Immer（不可变更新） |
| 样式方案 | CSS Modules（无 UI 库） |
| 架构模式 | ECS 启发式设计（Entity-Component-System） |
| 包管理 | pnpm |
| 代码检查 | ESLint 9 + typescript-eslint |
| 路径别名 | `@/*` → `./src/*` |

## 3. 目录结构

```
project4/
├── src/
│   ├── core/                          # 游戏核心逻辑（纯 TS，禁止 React/DOM 依赖）
│   │   ├── commands/                  # 命令模式：24 个文件，玩家操作封装为 Command
│   │   ├── config/                    # 配置文件：15 个文件，资源/硬件/地区/科技树等
│   │   ├── entities/                  # 实体定义：13 个文件，领域模型
│   │   ├── interfaces/                # 接口：Command、System
│   │   ├── resources/                 # 资源注册系统：ResourceRegistry + ResourceTypes
│   │   ├── systems/                   # 13 个游戏系统（每日按序执行）
│   │   ├── utils/                     # 10 个工具函数文件：效率/市场/风险/可行性计算
│   │   ├── EventBus.ts                # 事件总线
│   │   ├── Game.ts                    # 游戏入口与主控制器
│   │   ├── GameLoop.ts                # 游戏主循环（requestAnimationFrame）
│   │   ├── GameState.ts               # 游戏状态定义与不可变更新
│   │   └── utils.ts                   # 通用工具（clamp 等）
│   ├── ui/                            # 用户界面层
│   │   ├── components/                # 11 个 React 组件
│   │   ├── context/                   # React Context (GameProvider)
│   │   ├── hooks/                     # 自定义 Hooks (useGame, useGameState)
│   │   └── styles/                    # CSS Modules 样式
│   ├── main.tsx                       # 应用入口：组装 core + UI
│   └── vite-env.d.ts
├── .trae/documents/                   # 原始需求与架构文档
│   ├── PRD.md
│   └── TechnicalArchitecture.md
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── pnpm-workspace.yaml
```

## 4. 整体架构

### 4.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    UI 层 (src/ui/)                       │
│   React 组件 → useGame() 取 Game 实例发命令              │
│   useGameState(selector) 订阅状态局部字段重渲染          │
└───────────────┬─────────────────────────────────────────┘
                │ 唯一耦合点：GameContext
┌───────────────▼─────────────────────────────────────────┐
│                  核心层 (src/core/)                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Game   │→ │ GameState │  │EventBus  │  │Registry │ │
│  │ (入口)   │  │ (immer)   │  │ (解耦)   │  │(资源)   │ │
│  └────┬─────┘  └───────────┘  └──────────┘  └─────────┘ │
│       │ executeCommand / GameLoop.advanceDay            │
│  ┌────▼──────────────────────────────────────────────┐  │
│  │   Commands (状态变更)  ←→  Systems (每日推进)      │  │
│  └───────────────────────────────────────────────────┘  │
│       读取/校验           依赖                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────┐   │
│  │ entities (模型) │  │ config (配置)│  │ utils(算) │   │
│  └─────────────────┘  └──────────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 4.2 单向数据流

```
用户操作 → UI 组件
  → useGame().executeCommand(new XxxCommand(...))
  → Game.executeCommand(cmd)
  → cmd.execute(state, events)  // Command 修改 GameState（immer produce）
  → GameState.notify() 通知监听器
  → useGameState 的订阅回调触发 React 重渲染

时间推进：
  GameLoop (requestAnimationFrame)
  → 累积 deltaMs × speed ≥ 1 天
  → advanceDay(): emit('DAY_START') → 遍历 systems.update() → date+=1 → emit('DAY_END')
  → GameState 通知监听器 → UI 更新
```

### 4.3 核心解耦点

- **GameContext**：React 与 core 唯一耦合处，注入 `Game` 实例
- **EventBus**：系统间通过事件解耦，避免直接调用
- **ResourceRegistry**：资源通过配置注册，新增资源无需改核心代码
- **Command 模式**：所有状态变更走 Command，可追踪可回滚（除 SettingsPanel 调试入口）

---

## 5. 核心层 (src/core/)

### 5.1 Game 主控制器

**文件**：[Game.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/Game.ts)

`Game` 类是游戏入口，持有四要素并对外暴露控制 API。

**核心字段**：
- `state: GameState` — 游戏状态
- `events: EventBus` — 事件总线
- `registry: ResourceRegistry` — 资源注册器
- `loop: GameLoop`（私有）— 主循环
- `systems: System[]`（私有）— 系统列表

**关键方法**：
| 方法 | 职责 |
|------|------|
| `constructor(initialData, systems, registry?)` | 注册资源、初始化状态、补齐缺失资源初始值 |
| `executeCommand(cmd)` | 执行命令，调用 `cmd.execute(state, events)` |
| `start()` / `pause()` / `resume()` | 控制游戏运行（启动/停止主循环 + 标记暂停） |
| `setSpeed(speed)` | 设置速度倍率，同步到 state 与 loop |
| `save(): string` | 序列化当前状态为 JSON |
| `load(json)` | 从 JSON 读取存档，含旧存档数据迁移（`migrateOldData`） |

**存档迁移**：`migrateOldData` 处理历史版本兼容——为 `DataCollectionProject.normalEngineerCount` 和 IPO 轮次的 `sharesOutstanding` 补算字段。

### 5.2 GameState 状态管理

**文件**：[GameState.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/GameState.ts)

基于 Immer `produce` 实现不可变更新，持有 `GameData` 全量状态。

**GameData 关键字段**（约 30 个顶层字段）：
- 时间：`date`、`startDate`、`isPaused`、`speed`
- 资源：`resources`（id→数值）、`resourceMeta`（id→元数据）、`pendingOrders`（硬件采购订单）
- 实体集合：`employees`、`models`、`datasets`、`trainingProjects`、`researchProjects`、`dataCollectionProjects`、`staffTrainings`
- 基础设施：`serverNodes`、`clusters`、`dataCenters`
- 科技：`unlockedTechs`、`researchingTech`、`activeTechEffects`、`archMatrixSeed`
- 运营：`operations`、`fundingRounds`、`competitorStates`、`externalCorps`
- 风险：`riskState`、`dataAcquisitionCooldowns`
- 地区：`headquartersRegionId`、`operatingRegionIds`、`publishedRegions`
- 电力成本记账：`lastDayPowerCost`、`lastDayPowerCostDate`（设计-2 修复：避免 RegionSystem 重新估算电力成本）

**关键方法**：
- `read(): Readonly<GameData>` — 返回只读快照
- `update(recipe)` — immer produce 生成新状态并通知监听器
- `subscribe(listener)` — 订阅状态变更，返回取消订阅函数
- `resetData(data)` — 用新数据替换内部状态（存档读取）
- `getResource(id)` / `setResource(id, value, meta?)` / `addResource(id, delta)` — 资源操作，自动按 `ResourceDefinition` 限制边界（`clamp`）

**CardInstance 接口**（定义于此文件）：计算卡运行时状态，含 `uid`、`modelId`、`status`（online/offline/broken）、`age`、`assignedProjectId`、`location`（所在节点 id）、`autoRecoverDay`。

### 5.3 GameLoop 主循环

**文件**：[GameLoop.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/GameLoop.ts)

使用 `requestAnimationFrame` 实现主循环，按 speed 累积游戏天数。

**核心机制**：
- `MS_PER_DAY = 1000`（speed=1 时，1000ms 真实时间 = 1 游戏日）
- 每帧计算 `deltaMs`，累加 `dayAccumulator += (deltaMs / 1000) × speed`
- 累积 ≥ 1 天时调用 `advanceDay()`，单帧最多推进 60 天（防止卡顿后追帧过久）
- `RafAdapter` 接口封装 rAF，支持测试/服务端注入

**advanceDay 流程**：
```
emit('DAY_START', beforeDate)
  → 遍历 systems，调用 system.update(state, events, 1)
  → state.update(draft => draft.date += 1)
emit('DAY_END', newDate)
```

**暂停/恢复**：由 `Game` 通过 `start()`/`stop()` 控制，循环本身不读取 `isPaused`。

### 5.4 EventBus 事件总线

**文件**：[EventBus.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/EventBus.ts)

泛型事件总线，内部使用 `Map<string, Set<Handler>>`。

**关键方法**：`on(event, handler)`、`off(event, handler)`、`emit(event, ...args)`、`clear(event?)`

**容错设计**：emit 时复制监听器快照遍历，单个 handler 抛错不会中断其他 handler（catch + console.error）。

**主要事件名**（散布于各系统/命令）：`DAY_START`、`DAY_END`、`HARDWARE_DELIVERED`、`COMPUTE_POWER_CHANGED`、`POWER_OVERLOAD`、`TRAINING_COMPLETED`、`TRAINING_PAUSED`、`PLAYER_MODEL_RELEASED`、`COMPETITOR_RELEASE`、`RISK_EVENT`、`EMPLOYEE_RESIGNED`、`RESEARCH_COMPLETED`、`EXPERIMENT_COMPLETED`、`DECEPTION_EXPOSED`、`STOCK_DELISTED`、`MISSION_OFFERED` 等。

### 5.5 资源系统

**文件**：[ResourceTypes.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/resources/ResourceTypes.ts) | [ResourceRegistry.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/resources/ResourceRegistry.ts)

**ResourceDefinition（资源蓝图）**：
- `id`、`name`、`category`（currency/hardware/energy/human/asset/custom）
- `isContinuous`（资金连续 vs 计算卡离散）
- `minValue` / `maxValue` / `initialValue`
- `uiConfig`（icon、color、showInTopBar、format）

**ResourceRegistry**：统一管理资源定义。新增资源只需 `register(def)`，无需改核心逻辑。查询支持 `get(id)`、`getByCategory(cat)`、`getTopBarResources()`。

**设计要点**：资源定义是配置化的"蓝图"，所有资源（资金、算力卡、电力、普通员工等）都通过它注册。`GameState.setResource/addResource` 会自动按定义的 `minValue/maxValue` 进行 `clamp`。

### 5.6 Command / System 接口

**Command 接口**：[interfaces/Command.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/interfaces/Command.ts)
```typescript
export interface Command {
  execute(state: GameState, events: EventBus): void;
}
```
封装一次性状态变更操作（如雇佣员工、购买算力卡）。通过 `Game.executeCommand` 统一执行，便于记录、撤销（后续扩展）。

**System 接口**：[interfaces/System.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/interfaces/System.ts)
```typescript
export interface System {
  name: string;
  update(state: GameState, events: EventBus, deltaDays: number): void;
}
```
负责每个游戏日推进时对状态读写。GameLoop 每日遍历所有 System 调用 `update`。

---

## 6. 实体层 (entities/)

13 个实体文件定义游戏领域模型。所有实体均为 `interface`/`type`（无类），由 GameState 持有集合。

| 文件 | 核心接口 | 职责 |
|------|----------|------|
| [Employee.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Employee.ts) | `Employee`、`StaffRole`(enum)、`StaffAttributes`、`Skill` | 员工完整状态：5 种角色、5 维属性（智力/创造力/领导力/体力/魅力）、技能树、等级经验、薪资、忠诚度/疲劳度、绩效、股权/奖金冷却/培训 |
| [Department.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Department.ts) | `Department`、`DepartmentType` | 固定 5 个部门，负责人（L7+）领导力决定部门效率与全公司协同加成；常量 `DEPT_HEAD_MIN_LEVEL = 7` |
| [Infrastructure.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Infrastructure.ts) | `ServerNode`、`Cluster`、`DataCenter`、`TechEffect` | 三层硬件架构 + 约 20 种科技效果联合类型（利用率/网络/PUE/并行/训练分数/能力/研究/对齐等） |
| [ComputeCard.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/ComputeCard.ts) | `ComputeCardSpec`、`ComputeCardInstance` | 计算卡物理规格 + 运行时单卡实例状态 |
| [Model.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Model.ts) | `Model`、`CapabilityVector` | 训练产出的模型，含 16 维真实能力向量（玩家不可见）+ 带噪声观测值 + 涌现惩罚前原始值 |
| [TrainingProject.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/TrainingProject.ts) | `TrainingProject`、`ParallelConfig`、`ParallelStrategy` | 训练任务核心载体：5 种并行策略（DP/PP/TP/EP/CP 可组合成 3D 并行）、Checkpoint 回退、损失/稳定性追踪、训练阶段、风险自动暂停/恢复 |
| [Dataset.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Dataset.ts) | `Dataset`、`DataDomain`、`DataDomainId` | 11 个数据领域组织，跟踪规模/质量/新鲜度/重复率/污染率/合法性 |
| [DataCollectionProject.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/DataCollectionProject.ts) | `DataCollectionProject` | 持续运行的数据收集任务，含 `normalEngineerCount`（设计-4） |
| [ResearchProject.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/ResearchProject.ts) | `ResearchProject`、`ExperimentResult`、`ResearchType` | 区分 idea_generation / experiment_validation；实验验证消耗算力推断架构加成（带噪声与置信度） |
| [StaffTrainingProject.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/StaffTrainingProject.ts) | `StaffTrainingProject`、`STAFF_TRAINING_CONFIG` | 3 种员工培训（skill 7天/advanced 30天/overseas 60天）配置 |
| [Operations.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Operations.ts) | `FundingRound`、`FundingTerms`、`BoardMission`、`TokenPricing`、`DeceptionState` | 融资（5 类：seed/strategic/VC/government/ipo）+ 对赌/IPO 退市 + 董事会指令 + Token 定价 + 欺骗操作追踪 |
| [Competitor.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Competitor.ts) | `CompetitorState`、`ExternalCorp`、`CompetitorStrategy` | 8 家匿名化对手模板 + 5 家可渗透外部企业；含 7 种策略、渗透等级、情报系统 |
| [RiskState.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/RiskState.ts) | `RiskState` | 5 维风险负债（法律/信任/士气/声誉/对齐）+ 已触发事件历史 |

---

## 7. 系统层 (systems/)

13 个系统每日按固定顺序执行。系统顺序在 `main.tsx` 中实例化时确定。

### 7.1 系统执行顺序

| 序号 | 系统 | 职责摘要 |
|------|------|----------|
| 1 | ComputeHardwareSystem | 硬件采购订单到期交付、云算力合约到期清理 |
| 2 | PowerSystem | 电力容量与消耗计算、超容自动从电网购电（IT 电费） |
| 3 | TechResearchSystem | 科技树研究进度推进、解锁技术效果激活 |
| 4 | ResearchSystem | 实验验证类研发项目进度、信任债务自然衰减 |
| 5 | CollectionSystem | 数据收集项目进度、数据产量与质量更新 |
| 6 | InfrastructureFailureSystem | 基础设施随机故障、自动恢复、热备池替换 |
| 7 | TrainingSystem | 模型训练进度、训练事件、完成生成 Model |
| 8 | InfraMaintenanceSystem | 基础设施维护成本、冷却电费、PUE 衰减 |
| 9 | OperationsSystem | 运营收入、Token 售卖、欺骗检测、IPO 股价、董事会指令 |
| 10 | CompetitorSystem | 竞争对手 AI 决策（每 7 天 tick） |
| 11 | RiskSystem | 风险事件触发、法务公关降低债务、训练崩溃检查 |
| 12 | RegionSystem | 地区利润税、监管审查事件 |
| 13 | StaffSystem | 士气恢复、员工状态更新、薪资发放、绩效评估 |

> Staff 放最后以保证绩效评估在所有贡献累积之后。

### 7.2 各系统详解

**ComputeHardwareSystem**：处理 `pendingOrders` 中今日到期订单，生成 `CardInstance` 入池，增加 `resources[modelId]` 与 `compute_power`；清理到期云租赁合约。事件：`HARDWARE_DELIVERED`、`COMPUTE_POWER_CHANGED`、`CLOUD_RENTAL_EXPIRED`。

**PowerSystem**：每日计算总功耗（在线卡 `powerPerCard` 之和 + `baseConsumptionKW`），自建电站覆盖部分按 DC 电价收费，超出部分按市场电价收费。累加 `lastDayPowerCost`。事件：`GRID_PURCHASE`、`POWER_BALANCE`。

**TechResearchSystem**：推进 `researchingTech` 进度（受 `research_breakthrough` 技能加速），完成时解锁技术并激活 `tech.effect` 到 `activeTechEffects`（防重复解锁）。事件：`RESEARCH_COMPLETED`、`RESEARCH_PROGRESS`。

**ResearchSystem**：推进 `in_progress` 实验项目（受 `improve_research_speed` 与研究员效率加成），完成时调用 `runExperiment` 生成结果。信任债务每日 -0.05 衰减。事件：`EXPERIMENT_COMPLETED`。

**CollectionSystem**：推进 `active` 数据收集项目，计算日产量（`dailyRate × 工程师效率 × 公司技能倍率`），按"加权平均"更新数据集质量，资金不足则暂停。事件：`DATA_COLLECTED`。

**InfrastructureFailureSystem**：(R0) 恢复昨日网络故障 `utilizationBonus`；(R1) offline 卡到 `autoRecoverDay` 自动恢复；(R4) DC 热备池（≥50 卡启用 2% 冗余）替换 broken 卡；(R1-4) 节点老化、计算卡故障（50% major/50% minor）、节点故障、网络链路故障。容错设计：卡故障仅"降速"训练，>30% 卡故障或 >50% 节点故障才暂停回退。事件：`CARD_FAILED`、`NODE_FAILED`、`NETWORK_GLITCH`、`TRAINING_PAUSED`。

**TrainingSystem**：(1) 自动恢复风险暂停的训练（到 `autoResumeDay`）；(2) 推进训练，`calculateEffectiveCompute` 计算有效算力，按阶段（warmup<5%/main<85%/decay）修正利用率；(3) 损失更新（`calcExpectedLoss` + 高斯噪声，主训练期噪声更大）；(4) 训练事件（loss spike 5%/1%、gradient explosion 0.5%/0.1%，回退 checkpoint）；(5) 定期保存 checkpoint；(6) 完成生成 `Model`（`calcBaseScore` + `calculateCapabilities` × 稳定度质量系数 `0.7 + 0.3 × stabilityScore`）。事件：`TRAINING_COMPLETED`、`PLAYER_MODEL_RELEASED`、`TRAINING_PROGRESS`、`TRAINING_EVENT`。

**核心算力公式**：期望损失 `2.5 + 7.5 × exp(-5 × progress)`（初始 10，渐近 2.5）；高斯噪声用 Box-Muller 变换。

**InfraMaintenanceSystem**：扣三层基础设施维护成本（节点/集群/DC）；计算 DC 冷却电费（`totalPowerKW × (PUE-1) × (1-powerReduction) × 24 × 电价`）；PUE 衰减（超 365 天未维护每年劣化 1%，上限 `1.1 × basePue`）；电力过载暂停该 DC 内训练。事件：`POWER_OVERLOAD`、`INFRA_MAINTENANCE`。

**OperationsSystem**：(1) 市场收入（已发布模型，降智影响 `qualityFactor = 1 - downgradeLevel × 0.15`）；(2) Token 售卖（空闲卡+云算力 × inferenceAllocation，`inferenceTFLOPS × 6M tokens/TFLOPS × pricePerMillion × scoreFactor`）；(3) 用户流失；(4) 欺骗检测曝光（声誉 -15、trustDebt +1）；(5) IPO 股价波动（波动率 3%）；(6) 对赌协议检查；(7) 董事会指令生成/过期/完成。事件：`DECEPTION_EXPOSED`、`STOCK_DELISTED`、`VAM_FAILED`、`MISSION_OFFERED`、`STOCK_PRICE_CHANGED`。

**CompetitorSystem**：每 7 天（`COMPETITOR_TICK_DAYS`）模拟对手：烧钱、融资、推进训练、发布模型、动态成长、间谍渗透衰减、破产检查（资金归零累计 21 天，但保证市场最少 2 家）、5% 概率合并。训练进度 `5 × log10(compute+1)/log10(10000) × (1 + coreResearchers/200) × (0.8~1.2)`。事件：`COMPETITOR_INTEL`、`INDUSTRY_PANIC`、`COMPETITOR_BANKRUPT`、`COMPETITOR_RELEASE`、`COMPETITOR_MERGER`。

**RiskSystem**：(1) 扫描模型最大能力值与"未审计强模型参与研发"标志；(2) `checkDailyRisks` 触发风险事件（资金/声誉/用户/士气/法律损失，训练暂停 N 天设 `autoResumeDay`）；(3) 法务公关每日降 `legalDebt`/`trustDebt`；(4) 训练崩溃检查（`calcTrainingCrashProbability` 基于并行规模与可靠性，回退 checkpoint 累计 `lostFlops`）。事件：`RISK_EVENT`、`TRAINING_CRASH`。

**RegionSystem**：(1) 每日利润税（`dailyProfit = max(0, revenue + tokenRevenue - powerCost - nonPowerCost)` × 税率）；(2) 声誉 <20 触发监管审查。导出 `getRegionModifiers` 供其他系统查询地区修正系数（taxRate/talentBonus/energyMultiplier/hiringCostMultiplier）。

**StaffSystem**：(1) 士气自然恢复 +0.1/天（设计-12：放在所有事件冲击之后）；(2) 员工状态更新——培训推进、疲劳（`WORK_FATIGUE_BASE × 100/stamina`）、经验升级（达阈值升级 +2 属性 + 技能点）、忠诚度（-0.1/天 + 高疲劳加速 + 魅力抵抗 + 薪资竞争力 + 士气影响）、离职检查（忠诚度 <30 概率离职，股权锁定期 730 天内不可离职）；(3) 每 30 天扣薪发 `SALARY_PAID`；(4) 每 `PERFORMANCE_EVAL_PERIOD` 天绩效评估（S 级加技能点，C 级忠诚度 -2）；(5) 清理已处理候选人。事件：`EMPLOYEE_RESIGNED`、`EMPLOYEE_LEVEL_UP`、`STAFF_TRAINING_COMPLETED`、`SALARY_PAID`、`PERFORMANCE_EVALUATED`。

### 7.3 系统间协作链

- **电力成本链**：PowerSystem（IT 电费）+ InfraMaintenanceSystem（冷却电费）→ 写入 `lastDayPowerCost` → RegionSystem（利润税基）
- **故障容错链**：InfrastructureFailureSystem（卡/节点故障降速）+ RiskSystem（训练崩溃回退）→ TrainingSystem（`autoResumeDay` 自动恢复）
- **研发加速链**：TechResearchSystem 解锁技术 → CollectionSystem/ResearchSystem/TrainingSystem/RiskSystem 读取 `activeTechEffects`
- **员工贡献链**：CollectionSystem/ResearchSystem/TrainingSystem 调用 `accumulateResearcherContribution` → StaffSystem 绩效评估
- **市场博弈链**：OperationsSystem（玩家收入）+ CompetitorSystem（对手模拟）→ 用户流失/声誉/股价联动

---

## 8. 命令层 (commands/)

24 个 Command 文件，所有玩家操作封装为 Command。通过 `game.executeCommand(new XxxCommand(...))` 执行。

### 8.1 命令清单

| 类别 | Command 类 | 职责 |
|------|-----------|------|
| 资源 | `AddResourceCommand` | 通用资源增减（内部调用） |
| 硬件 | `PurchaseHardwareCommand` | 采购硬件，扣款创建采购订单 |
| 硬件 | `RentCloudComputeCommand` | 租用云算力（按天计费到期释放） |
| 电力 | `BuildPowerPlantCommand` | 建造电站增加 power_kw |
| 电力 | `BuyGridPowerCommand` | 从地区电网购买电力容量 |
| 基建 | `BuyServerNodeCommand` | 按模板购买服务器节点 |
| 基建 | `InstallCardCommand` / `UninstallCardCommand` | 安装/卸载计算卡到节点 |
| 基建 | `CreateClusterCommand` / `AddNodeToClusterCommand` | 创建集群/追加节点 |
| 基建 | `BuildDataCenterCommand` / `MoveClusterCommand` | 建数据中心/迁移集群 |
| 基建 | `UpgradeNodeInterconnectCommand` / `UpgradeClusterStorageCommand` | 升级互联/存储 |
| 基建 | `MaintainDataCenterCommand` / `MaintainNodeCommand` | 维护 DC/节点恢复可靠性 |
| 基建 | `RepairCardCommand` / `RepairNodeCommand` / `ScrapCardCommand` | 修复卡/修复节点/报废卡 |
| 员工 | `RequestRecruitmentCommand` / `HireCandidateCommand` / `RejectCandidateCommand` / `CleanupCandidatesCommand` | 招聘流程四步 |
| 员工 | `HireEmployeeCommand`（兼容包装）/ `HireNormalEmployeeCommand` | 录用核心/普通员工 |
| 员工 | `FireEmployeeCommand` | 解雇员工（高忠诚被解雇触发全员士气下降） |
| 员工 | `AssignEmployeeCommand` | 分配/取消分配员工到项目 |
| 员工 | `AdjustSalaryCommand` | 调薪（加薪小幅提忠诚，减薪 2 倍惩罚降忠诚） |
| 员工 | `PromoteEmployeeCommand` | 主动晋升（经验≥80%、绩效≥A、冷却 90 天） |
| 员工 | `LearnSkillCommand` | 学习技能（校验角色池/技能点/已解锁） |
| 员工 | `StartStaffTrainingCommand` / `CancelStaffTrainingCommand` | 启动/取消员工培训 |
| 激励 | `GiveBonusCommand` / `GrantEquityCommand` / `TeamBuildingCommand` | 奖金/股权/团建 |
| 部门 | `AppointDepartmentHeadCommand` / `TransferDepartmentCommand` / `AllocateNormalStaffCommand` | 部门管理 |
| 地区 | `SetHeadquartersCommand` | 设置总部并初始化运营区/基础设施/预设资源 |
| 地区 | `EnterRegionCommand` / `PublishInRegionCommand` | 进入地区/发布模型 |
| 训练 | `StartTrainingCommand` / `CancelTrainingCommand` / `ResumeTrainingCommand` | 启动/取消/恢复训练 |
| 训练 | `ReallocateTrainingCardsCommand` | 调整训练算力分配 |
| 训练 | `SetParallelStrategyCommand` | 设置 3D 并行策略（校验技术解锁/NVLink/卡数） |
| 模型 | `PublishModelCommand` / `UnpublishModelCommand` | 发布/下架模型 |
| 模型 | `SetModelResearchUsageCommand` | 开关模型参与内部研发 |
| 数据 | `AcquireDataCommand` / `SynthesizeDataCommand` | 购买数据（含冷却/灰产风险）/合成数据 |
| 数据 | `StartDataCollectionCommand` / `StopDataCollectionCommand` | 启动/停止数据收集 |
| 数据 | `CreateDatasetCommand` / `DeleteDatasetCommand` | 创建/删除数据集 |
| 研发 | `StartExperimentCommand` / `CancelResearchProjectCommand` | 启动/取消实验验证 |
| 科技 | `StartResearchCommand` / `CancelResearchCommand` | 启动/取消技术研发 |
| 运营 | `RaiseFundingCommand` | 发起融资（含 VAM/IPO/董事会条款） |
| 运营 | `SetTokenPricingCommand` / `SetDowngradeLevelCommand` / `ToggleStealUserDataCommand` / `ToggleSkipSafetyCommand` | Token 定价/欺骗操作 |
| 运营 | `RespondToMissionCommand` / `IssueSecondaryOfferingCommand` / `BuybackStockCommand` | 董事会指令/增发/回购 |
| 风险 | `SettleLawsuitCommand` / `PublicApologyCommand` / `ConductAuditCommand` / `UseModelInResearchCommand` | 和解/道歉/审计/研发用途 |
| 敌对 | `AcquireCompetitorCommand` | 收购对手（转移算力/研究员/普通员工） |
| 敌对 | `PoachTalentCommand` / `AssaultKeyPersonnelCommand` / `HackParametersCommand` | 挖角/袭击/黑客 |
| 敌对 | `InfiltrateCorpCommand` | 对外部企业股权渗透 |

### 8.2 关键导出辅助

- `allocateCardsFromCluster`（TrainingCommands.ts）：从集群优先同节点分配满足显存的空闲在线卡
- `CloudRentalContract` 接口（RentComputeCommand.ts）：云租赁合约数据结构
- `createDefaultOperations`（OperationsCommands.ts）：创建默认运营状态对象

---

## 9. 配置层 (config/)

15 个配置文件，采用"声明式注册"模式——新增条目无需改框架逻辑，系统通过 `*_MAP` 映射表自动接入。

| 文件 | 主要导出 | 驱动机制 |
|------|----------|----------|
| [resources.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/resources.ts) | `INITIAL_RESOURCES`、`HARDWARE_SPECS`、`POWER_CONFIG` | 资源注册清单（货币/算力/7 种硬件/电力/5 种普通员工）+ 硬件属性 + 电站经济 |
| [computeCards.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/computeCards.ts) | `COMPUTE_CARD_SPECS`、`getCardSpec` | 7 种 GPU 型号（L40S/A100 40G/80G/H100/H200/B200/GB300），含算力/显存/带宽/互联/精度 |
| [infrastructure.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/infrastructure.ts) | `NODE_TEMPLATES`、`CLUSTER_NETWORKS`、`DATA_CENTER_LOCATIONS`、`COOLING_TYPES`、`STORAGE_CONFIGS` | 9 节点模板/8 集群网络/4 DC 地点/3 冷却/4 存储 |
| [cloudProviders.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/cloudProviders.ts) | `CLOUD_PROVIDERS`、`calcCloudRentalPrice`、`calcCloudMaxTFLOPS` | 6 家匿名云服务商，价格按地区 computeIndex 修正 |
| [regions.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/regions.ts) | `REGIONS`、`REGION_MAP`、`RECOMMENDED_START_REGIONS`、`getGridPowerPrice/Cap` | 33 个全球地区（市场/监管/资源/语言属性）+ 电网价格容量 |
| [employees.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/employees.ts) | `ROLE_CONFIG`、`SKILL_CONFIG`、`RECRUITMENT_CHANNELS`、`HIRE_COST` 等 | 5 角色/11 技能/4 招聘渠道/激励/晋升/绩效整套人事配置 |
| [capabilities.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/capabilities.ts) | `CAPABILITIES`、`CAPABILITY_MAP`、`CapabilityId` | 16 维能力向量（7 显性 + 9 隐性），含噪声/涌现阈值/上下文门槛 |
| [archEffects.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/archEffects.ts) | `generateArchMatrix`、`ArchMatrix` | 按种子生成本局架构-能力映射矩阵（探索玩法） |
| [datasets.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/datasets.ts) | `INITIAL_DATA_DOMAINS`、`createInitialDataset` | 11 个数据领域初始模板 |
| [dataAcquisition.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/dataAcquisition.ts) | `COLLECTION_ROUTES`、`PURCHASE_ROUTES`、`calcCollectionRate/Quality` | 8 自收集路线 + 6 购买路线（含 2 灰色路线） |
| [researchConfig.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/researchConfig.ts) | `RESEARCH_CONFIG`、`EXPERIMENT_VALIDATION` | 实验验证参数（小/中型算力/噪声/进度）+ 并发上限 3 |
| [techTree.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/techTree.ts) | `TECH_TREE`(P0,11)、`TECH_TREE_P1`(13)、`TECH_TREE_P2`(4)、`TECH_MAP`、`TechId` | 28 项技术（基础/进阶/并行策略），含前置依赖/研究天数/成本/效果 |
| [techTreeP1.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/techTreeP1.ts) | 重导出 `TECH_TREE_P1` | 向后兼容文件（P1 已合并到 techTree.ts） |
| [riskEvents.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/riskEvents.ts) | `RISK_EVENTS`、`RISK_EVENT_MAP`、`RiskEventId` | 8 种风险事件（训练崩溃/诉讼/监管/泄露/抵制/举报/对齐失败/欺骗），含触发条件与效果 |
| [startupPresets.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/startupPresets.ts) | `STARTUP_PRESETS` | 3 个开局预设（bootstrapper/balanced/tech_heavy） |

---

## 10. 工具层 (utils/)

10 个工具函数文件，均为纯计算/查询函数（除 `accumulateResearcherContribution` 写员工字段、`updateCompetitorStates` 写模块级缓存外）。

| 文件 | 关键函数 | 职责 |
|------|----------|------|
| [capabilityCalc.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/capabilityCalc.ts) | `calcBaseScore`、`deriveBaseScoreParams`、`calcContextFactor`、`calcEmergencePenalty`、`calcDataQualityBonus`、`calculateCapabilities`、`observeWithNoise`、`calcNoiseSigma`、`createSeededRng`、`observeCapabilities`、`calcTrainingCompute` | 模型能力计算全套：Chinchilla 基础分/上下文因子/涌现惩罚/数据质量加成/带噪声观测/训练算力估算（长序列修正） |
| [computeUtilization.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/computeUtilization.ts) | `calcActualPowerDraw`、`estimateRequiredMemory`、`calcParallelMaxContext`、`calculateEffectiveCompute` | GPU 实际功耗/显存估算/并行上下文/有效算力（含软件/集群/冷却/电力/并行/互联/跨节点/规模/同构性惩罚） |
| [cloudComputeUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/cloudComputeUtils.ts) | `getActiveCloudContracts`、`getActiveCloudTFLOPS` | 云租赁合约查询与活跃算力汇总 |
| [crossSystemUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/crossSystemUtils.ts) | `getStaffTrainingSpeedMultiplier`、`getStaffTrainingStabilityBonus`、`getStaffResearchSpeedMultiplier`、`getStaffInfraFailureReduction`、`getStaffRevenueMultiplier`、`getStaffLegalRiskReductionPerDay`、`calcMoraleImpactFromOperations`、`accumulateResearcherContribution`、`getDataEngineerBonus`、`getCompanySkillBonus/Max`、`getCompanyPowerReduction`、`getCompanyCardWearReduction`、`getCompanyRevenueBoost`、`getCompanyComplianceBoost`、`getCompanyCrisisReduction`、`getCompanyTrainingComputeReduction`、`getCompanyCollectionSpeed`、`getCompanyDataQuality`、`getCompanyResearchSpeed`、`getCompanyModelCap`、`getCompanyTeamCoordination` | 员工属性→各系统加成的跨系统联动中枢（区分定向/被动贡献） |
| [employeeUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/employeeUtils.ts) | `baseEfficiency`、`attributeFactor`、`fatigueFactor`、`loyaltyFactor`、`departmentBonus`、`companyCoordination`、`calcEmployeeEfficiency`、`calcNormalEfficiency`、`marketSalary`、`salaryCompetitiveness`、`salaryLoyaltyDelta`、`calcSalaryForLevel`、`generateCandidateAttributes`、`getDefaultAttributePool`、`resignProbability`、`calcPerformanceScore` | 员工效率/薪资/招聘（Dirichlet 采样）/离职/绩效计算 |
| [teamEffects.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/teamEffects.ts) | `calculateTeamBonuses`、`calculateGlobalBonuses`、`getProjectMembers` | 团队加成（累加成员技能效果 + 几何平均疲劳因子） |
| [trainingFeasibility.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/trainingFeasibility.ts) | `assessTrainingFeasibility`、`diagnoseTraining` | 训练可行性评估（并行策略选择）+ 诊断（blocker/warning） |
| [marketCalc.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/marketCalc.ts) | `updateCompetitorStates`、`getPlayerBestCapability`、`calcSegmentCapabilityScore`、`calcRegionMarket`、`calcTotalRevenue`、`calcValuation`、`calcUserChurn` | 市场份额/地区收入/公司估值/用户流失计算 |
| [researchUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/researchUtils.ts) | `calcExperimentCost`、`runExperiment`、`aggregateExperiments` | 实验成本/运行（带正态噪声）/结果聚合 |
| [riskUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/riskUtils.ts) | `checkDailyRisks`、`calcTrainingCrashProbability` | 每日风险检查/训练崩溃概率（上限 10%） |

---

## 11. UI 层 (src/ui/)

### 11.1 连接层

| 文件 | 职责 |
|------|------|
| [main.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/main.tsx) | 应用入口：创建 ResourceRegistry、构造 initialData、实例化 13 个 System（按序）、`new Game()`、`createRoot().render(<GameProvider><App/></GameProvider>)` |
| [context/GameContext.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/context/GameContext.tsx) | `createContext<Game|null>` + `GameProvider`，React 与 core 唯一耦合点 |
| [hooks/useGame.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/hooks/useGame.ts) | 从 Context 取 Game 实例，未在 Provider 内使用则抛错 |
| [hooks/useGameState.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/hooks/useGameState.ts) | 选择器订阅 `GameData` 局部字段，`Object.is` 比较跳过未变更新，避免全局重渲染 |

### 11.2 组件

所有面板通过 `useGame()` 取 game 实例发命令、`useGameState(selector)` 订阅状态。样式统一来自 [App.module.css](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/styles/App.module.css)（科技感深色主题，青/绿高亮，JetBrains Mono 数值字体）。

| 组件 | 职责 | 主要命令 |
|------|------|----------|
| [App.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/App.tsx) | 根组件：未选总部显示 StartupScreen，否则渲染 TopBar+GameControls+7 面板（`display:none/block` 切换保留状态） | — |
| [TopBar.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/TopBar.tsx) | 顶部状态栏：日期/资金/算力/电力/总部/员工数。只读，通过 `registry.getTopBarResources()` 动态渲染 | — |
| [GameControls.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/GameControls.tsx) | 暂停/速度（1×/2×/4×）+ 7 面板切换标签。导出 `PanelView` 类型 | `start/pause/setSpeed` |
| [StartupScreen.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/StartupScreen.tsx) | 3 步开局向导：选总部→选预设/自定义→开始 | `SetHeadquartersCommand` |
| [ResourceDevPanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/ResourceDevPanel.tsx) | 4 子标签（资金/算力/电力/员工） | `PurchaseHardwareCommand`、`BuildPowerPlantCommand`、`BuyGridPowerCommand`、`RentCloudComputeCommand` |
| [EmployeePanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/EmployeePanel.tsx) | 4 子标签（员工列表/招聘/培训/部门） | 招聘/解雇/调薪/晋升/学习技能/激励/培训/部门管理全套命令 |
| [InfrastructurePanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/InfrastructurePanel.tsx) | 2 子标签（拓扑/建造）：树状展示+买节点/装卡/建集群/升级/维护/修复 | `BuyServerNodeCommand`、`InstallCardCommand`、`CreateClusterCommand`、`BuildDataCenterCommand` 等 |
| [ModelPanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/ModelPanel.tsx) | 3 子标签（训练/模型/数据）：训练配置+Chinchilla 估算+可行性诊断+损失曲线 SVG；模型能力观测；数据集管理 | `StartTrainingCommand`、`PublishModelCommand`、`AcquireDataCommand`、`StartDataCollectionCommand` 等 |
| [ResearchPanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/ResearchPanel.tsx) | 3 子标签（实验/技术树/风险） | `StartExperimentCommand`、`StartResearchCommand`、`SettleLawsuitCommand`、`ConductAuditCommand` 等 |
| [BusinessPanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/BusinessPanel.tsx) | 4 子标签（地区/运营/融资/竞争）：含估值计算+5 种融资+激进操作 | `EnterRegionCommand`、`RaiseFundingCommand`、`AcquireCompetitorCommand`、`PoachTalentCommand`、`HackParametersCommand`、`InfiltrateCorpCommand` 等 |
| [SettingsPanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/SettingsPanel.tsx) | 2 子标签（调试/系统信息）：作弊工具（加资金/推进天数/重置）+ 引擎状态摘要。**唯一绕过 Command 直接 `state.update` 的组件** | 直接 `game.state.update` |

---

## 12. 依赖关系

### 12.1 技术依赖（package.json）

**运行时**：
- `react` ^18.3.1、`react-dom` ^18.3.1 — UI 框架
- `immer` ^10.1.1 — 不可变状态更新

**开发时**：
- `vite` ^6.3.5 + `@vitejs/plugin-react` ^4.4.1 + `vite-tsconfig-paths` ^5.1.4 — 构建
- `typescript` ~5.8.3 — 类型检查
- `eslint` ^9.25.0 + `typescript-eslint` ^8.30.1 + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` — 代码检查
- `@types/react`、`@types/react-dom`、`@types/node` — 类型定义

### 12.2 模块依赖方向

```
main.tsx
  ├─ core/Game ───────────┬─ core/GameState ── immer
  │                       ├─ core/GameLoop ──── rAF
  │                       ├─ core/EventBus
  │                       ├─ core/resources/ResourceRegistry
  │                       ├─ core/interfaces/{Command,System}
  │                       └─ core/systems/* (13 个)
  │                              │ 读取
  │                              ├─ core/entities/* (类型)
  │                              ├─ core/config/* (配置)
  │                              └─ core/utils/* (计算)
  ├─ ui/context/GameContext (注入 Game)
  └─ ui/components/* (通过 useGame/useGameState 访问)
            │ 发命令
            └─ core/commands/* ── 修改 GameState
```

**关键约束**：
- `src/core/` 禁止 import React/DOM（唯一例外：GameLoop 中的 rAF，已封装为 `RafAdapter` 可替换）
- UI 层只能通过 `GameContext` + hooks 访问 Game 实例
- Command 修改状态，System 推进状态，两者不直接互相调用（通过 EventBus 通信）

### 12.3 路径别名

`tsconfig.json` 配置 `@/*` → `./src/*`，`vite-tsconfig-paths` 插件自动同步给 Vite。

---

## 13. 项目运行方式

### 13.1 环境要求

- Node.js（推荐 18+）
- pnpm（项目含 `pnpm-workspace.yaml` 与 `pnpm-lock.yaml`）

### 13.2 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器（http://localhost:5173）
pnpm dev

# 生产构建（先 tsc 类型检查再 vite build）
pnpm build

# 预览构建产物
pnpm preview

# 代码检查
pnpm lint

# TypeScript 类型检查（不输出文件）
pnpm check
```

### 13.3 构建配置要点

- **vite.config.ts**：`@vitejs/plugin-react` + `vite-tsconfig-paths`，`build.sourcemap: 'hidden'`
- **tsconfig.json**：`strict: true` + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch` + `forceConsistentCasingInFileNames`；`jsx: react-jsx`；`noEmit: true`（Vite 负责打包）
- **index.html**：`lang="zh-CN"`，标题 `Singularity.AI — AI 公司模拟经营`，挂载点 `#root`

### 13.4 游戏开局流程

1. 启动后进入 `StartupScreen`：选择总部地区（33 个，推荐 7 个）
2. 选择开局策略：3 个预设（bootstrapper/balanced/tech_heavy）或自定义（资金 $1M-$20M / 算力卡型号与数量 / 员工角色与等级）
3. 确认后 `SetHeadquartersCommand` 初始化运营区、固定基础设施、预设资源
4. 进入主界面，通过 GameControls 控制暂停/速度，7 个面板管理公司运营

---

## 14. 设计原则

1. **核心逻辑与 UI 分离** — `src/core/` 纯 TypeScript，可独立测试，无 React/DOM 依赖
2. **配置驱动** — 新资源/硬件/地区/科技通过配置文件添加，无需修改核心代码；系统通过 `*_MAP` 映射表自动接入
3. **命令模式** — 所有状态变更通过 Command（`Game.executeCommand`），便于追踪和回滚（除 SettingsPanel 调试入口）
4. **系统解耦** — 13 个系统通过 EventBus 通信，低耦合高内聚，按固定顺序每日执行
5. **不可变状态** — Immer `produce` 管理状态更新，防止意外修改；`GameState` 自动按 `ResourceDefinition` 边界 clamp
6. **可替换基础设施** — `RafAdapter` 封装 rAF，支持测试/服务端注入；`ResourceRegistry` 可外部传入
7. **存档兼容** — `Game.migrateOldData` 处理历史版本字段缺失，保证旧存档可加载
8. **容错设计** — 基础设施故障仅"降速"训练而非直接崩溃（卡故障 <30% 继续、节点故障 <50% 继续）；EventBus 单 handler 抛错不中断其他

---

> 本 Wiki 基于代码现状生成，反映项目当前实现。设计标注（设计-N、BUG-N）散布于代码注释中，改动时建议先检索对应编号的设计文档。
