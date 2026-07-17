# 性能优化计划：1000+ 张显卡训练卡顿修复

## 摘要

游戏在显卡数量达到 1000+ 张后，模型训练及每日推进出现严重卡顿。根因分析发现一个贯穿 10+ 处代码的反模式：通过 `pool.find(c => c.uid === uid)` 在 `resourceMeta[modelId]` 数组中线性查找卡实例，导致 **O(总卡数²)** 的嵌套循环。叠加每日 7+ 次 immer `produce` 全量拷贝、训练系统内冗余的全局员工扫描、以及 UI 层对 `resourceMeta` 的全量订阅与 1000+ DOM 节点重渲染，共同造成卡顿。

本计划采用**核心+UI 全面修复**方案，引入 `react-window` 虚拟化 UI 列表。核心思路是建立一个 memoized 的卡 uid→CardInstance 索引工具，一次性消除所有 O(卡数²) 查找点；同时对 TrainingSystem 做合并 produce + 缓存全局加成的外科手术式优化；UI 层引入虚拟列表与 useMemo 缓存。

预期效果：1000 张卡场景下，每日推进耗时从约 50-100ms 降至 5-10ms，UI 切换基建/训练面板从卡顿 1-2s 降至 <100ms。

---

## 当前状态分析（瓶颈定位）

### 核心层 P0 瓶颈（每日执行 + 高复杂度）

| 位置 | 复杂度 | 问题 |
|---|---|---|
| `InfraMaintenanceSystem.update` 行 65-96 | O(卡数²) | DC 功耗计算 5 层嵌套（DC→集群→节点→卡→modelPool→find），每日 ~100 万次比较 |
| `InfrastructureFailureSystem.applyHostSpares` 行 285-376 | O(卡数²) | 热备池替换嵌套查找，每日执行 |
| `InfrastructureFailureSystem` 行 156-180 | O(failedCards × 节点卡数) | 节点故障时对每张卡嵌套 find |
| `TrainingSystem.collectCardSpecs` 行 428-444 | O(项目卡数 × 总卡数) | 每日每训练项目调用，`pool?.find(c => c.uid === uid)` |
| `TrainingSystem.update` 行 302-313 | O(项目卡数 × 总卡数) | 完成训练释放卡时嵌套查找 |
| `TrainingSystem` 行 189-194 冗余扫描 | O(项目数 × 员工数 × 技能数) | `getCompanyTrainingComputeReduction` 等应一日一次却每项目调用 |
| `TrainingSystem.update` 2 次 `state.update` | O(state 大小) ×2 | autoResume 分支 + 主循环各一次 produce |
| `GameState.notify` 行 307-312 | O(监听器数) × 7+/日 | 每日 7+ 次全量通知所有 useGameState 订阅者 |

### 命令层 P1 瓶颈（玩家操作触发）

| 位置 | 复杂度 | 问题 |
|---|---|---|
| `TrainingCommands.allocateCardsFromCluster` 行 39-51 | O(卡数²) | 启动训练时嵌套查找 |
| `TrainingCommands.autoDetectParallelConfig` 行 102-118 | O(卡数²) | 同上 |
| `TrainingCommands.ReallocateTrainingCardsCommand` 行 448-485 | O(卡数²) | 调整算力时双重扫描 |
| `trainingFeasibility.diagnoseTraining` 行 220-227 | O(卡数²) | 可行性诊断嵌套查找 |

### UI 层瓶颈

| 位置 | 问题 |
|---|---|
| `InfrastructurePanel` 行 110-164 | 拓扑树为每张卡渲染 DOM 节点，1000+ 节点每日多次重渲染 |
| `InfrastructurePanel.getCard` 行 79-86 / `getNodeMemory` 行 88-102 | O(卡数²) 每次渲染查找 |
| `InfrastructurePanel.nodeHasOfflineCard` 行 858-900 | O(卡数²) 每次渲染扫描 |
| `ModelPanel` 行 113-119 `diagnoseTraining` | 每次渲染重算 O(卡数²) 诊断 |
| `useGameState` + `s.resourceMeta` 订阅 | `card.age++` 使 resourceMeta 每日变新引用，订阅者每日 7+ 次重渲染 |

---

## 提议改动

### 3.1 核心层：建立 memoized 卡 uid 索引工具

**新增文件**：`src/core/utils/cardIndex.ts`

**目的**：一次性消除所有 `pool?.find(c => c.uid === uid)` 反模式，将 O(poolSize) 查找降为 O(1)。

**实现要点**：
- 导出函数 `getCardIndex(data: GameData): Map<string, { card: CardInstance; modelId: string }>`
- 内部使用模块级 WeakMap 缓存，key 为 `data.resourceMeta` 引用（immer 产生新引用时自动失效重建）
- 遍历 `Object.entries(data.resourceMeta)` 构建 `Map<uid, {card, modelId}>`，复杂度 O(总卡数)，仅在 resourceMeta 引用变化时重建一次
- 导出辅助函数 `findCard(data, uid): { card: CardInstance; modelId: string } | undefined`，封装"先查索引再取规格"的常用模式
- 导出 `findCardSpec(data, uid): ComputeCardSpec | undefined`

**关键约束**：
- 纯函数 + WeakMap 缓存，不修改 GameData，符合核心层无副作用约定
- WeakMap 以 `data.resourceMeta`（对象引用）为 key，immer 不可变更新保证引用变化即失效
- 不引入新的 GameData 字段，避免存档迁移问题

### 3.2 核心层：替换所有 O(卡数²) 查找点

逐一将 `pool?.find(c => c.uid === uid)` 替换为 `findCard(data, uid)` / `findCardSpec(data, uid)`。

**改动文件与位置**：

1. **`src/core/systems/TrainingSystem.ts`**
   - `collectCardSpecs` 行 428-444：用 `findCardSpec(data, uid)` 替换双层循环，函数体简化为单层 `for...of` + O(1) 查找
   - `update` 行 302-313（完成释放卡）：用 `getCardIndex(draft)` 获取索引后直接 `index.get(uid)` 拿到 modelId 与 card，避免嵌套 find

2. **`src/core/systems/InfraMaintenanceSystem.ts`**
   - `update` 行 65-96：重构为：先用 `getCardIndex(current)` 取索引，遍历 DC→集群→节点→卡时 `index.get(cardUid)` O(1) 拿 card，再 `getCardSpec(indexEntry.modelId)` 取规格
   - 消除 5 层嵌套的最内两层

3. **`src/core/systems/InfrastructureFailureSystem.ts`**
   - `applyHostSpares` 行 285-376：用 `getCardIndex(draft)` 重建一次索引，替换所有 `pool?.find`
   - 行 156-180 节点故障循环：同样替换
   - 行 121-130 卡故障从 nodeAssignments 移除：保持 `.filter()` 但 O(节点卡数) 可接受，不改

4. **`src/core/systems/ComputeHardwareSystem.ts`**
   - 行 40-72 订单交付：交付时直接 push 到 pool，不涉及 find，无需改
   - `getAvailableCards` 行 109-112：保持 `pool.filter`，O(poolSize) 可接受（命令触发非每日）

### 3.3 核心层：TrainingSystem 合并 produce + 缓存全局加成

**改动文件**：`src/core/systems/TrainingSystem.ts`

**问题**：当前 `update` 调用 2 次 `state.update`（autoResume 分支 + 主循环），且主循环内每个训练项目重复调用 `getCompanyTrainingComputeReduction`、`getActiveCloudTFLOPS`、`getStaffTrainingSpeedMultiplier` 等全员工扫描函数。

**改动方案**：
- 将 autoResume 检查合并进主循环的单一 `state.update`：在 recipe 内先处理 autoResume 逻辑（更新 project.status、释放/重分配卡），再进入训练推进逻辑。两次 produce 合并为一次。
- 在 `state.update` 调用前，先读取一次 `current = state.read()`，计算并缓存以下全局值（只算一次，传入 recipe 闭包）：
  - `companyComputeReduction = getCompanyTrainingComputeReduction(current)`
  - `activeCloudTFLOPS = getActiveCloudTFLOPS(current)`
  - 每个项目的 `staffSpeedMult` 与 `stabilityBonus` 仍需 per-project 计算（依赖 project.id），但 `getStaffTrainingSpeedMultiplier` 内部对全员工扫描可优化为先构建 `Map<employeeId, Employee>` 再查找（见 3.3.1）

**3.3.1 员工查找优化**（辅助）：
- 在 `crossSystemUtils.ts` 中新增 `getEmployeeMap(data): Map<string, Employee>`，memoized on `data.employees` 引用
- `accumulateResearcherContribution`（行 375-395）与 `getStaffTrainingSpeedMultiplier` 内部的 `data.employees.find` 改为 `employeeMap.get(id)`

### 3.4 命令层：替换训练命令中的嵌套查找

**改动文件**：`src/core/commands/TrainingCommands.ts`、`src/core/utils/trainingFeasibility.ts`

- `allocateCardsFromCluster` 行 39-51：用 `findCard(current, cardUid)` 替换嵌套 find
- `autoDetectParallelConfig` 行 102-118：同上
- `ReallocateTrainingCardsCommand` 行 448-485：用 `getCardIndex(current)` 一次性取索引，替换所有 `pool?.find`
- `StartTrainingCommand.execute` 行 294-308 标记卡分配：用索引替换
- `trainingFeasibility.diagnoseTraining` 行 220-227：用索引替换

### 3.5 UI 层：react-window 虚拟化 InfrastructurePanel 拓扑树

**新增依赖**：`react-window`（约 6KB gzipped）

**改动文件**：`src/ui/components/InfrastructurePanel.tsx`、`package.json`

**实现方案**：
1. 将 DC→集群→节点→卡 的嵌套树**扁平化**为行数组 `flattenedRows: Array<{ type: 'dc'|'cluster'|'node'|'card'; id: string; depth: number; data: ... }>`，用 `useMemo` 依赖 `[dataCenters, clusters, serverNodes, resourceMeta]` 计算
2. 用 `react-window` 的 `FixedSizeList` 渲染扁平化行，每行按 type 渲染对应内容（DC 行/集群行/节点行/卡行），通过 `depth` 控制缩进
3. `itemSize` 固定（如 28px），`height` 取 `min(totalRows × 28, 600)` 并支持容器滚动
4. 保留现有 CSS 类名（`treeNode`/`treeChild`/`devRow`/`devRowLabel`/`devHint`），仅外层容器改为虚拟列表
5. `getCard` 与 `getNodeMemory` 改为 `useMemo` 内一次性构建 `Map<uid, card>`，避免每次渲染 O(卡数²) 查找
6. `nodeHasOfflineCard` 行 858-900、`faultedCards` 行 902-952：改为 `useMemo` 依赖 `[serverNodes, resourceMeta]`，返回 `Set<string>` 供下拉框使用

### 3.6 UI 层：ModelPanel 诊断缓存 + 派生订阅

**改动文件**：`src/ui/components/ModelPanel.tsx`

1. `diagnoseTraining` 调用从渲染体内移到 `useMemo`：
   ```typescript
   const diagnosis = useMemo(
     () => selectedClusterId && paramCount > 0
       ? diagnoseTraining({ ... }, clusters, serverNodes, resourceMeta)
       : null,
     [selectedClusterId, paramCount, contextLength, architecture, clusters, serverNodes, resourceMeta]
   );
   ```
2. 训练中项目列表的损失曲线 SVG 迷你图：保持原样（O(projects) 可接受）

### 3.7 UI 层：useGameState 派生订阅优化

**改动文件**：`src/ui/components/InfrastructurePanel.tsx`、`src/ui/components/TopBar.tsx`（如需）

- `InfrastructurePanel` 行 73 `useGameState((s) => s.resourceMeta)`：改为订阅派生的卡统计而非整个 resourceMeta。新增选择器返回 `{ totalCards: number; onlineCards: number; offlineCards: number; brokenCards: number }`，用 `useMemo` 从 resourceMeta 计算
  - 注意：拓扑树仍需 resourceMeta 来渲染卡型号，因此拓扑树行数据用 `useMemo` 依赖 resourceMeta，但**只在拓扑标签激活时计算**（通过 `activeTab === 'topology'` 守卫）
- `TopBar` 若订阅了 resourceMeta 用于算力显示，改为订阅 `resources.compute_power` 数值（已是标量）

---

## 假设与决策

### 假设
1. immer 的 `produce` 在结构共享下，未修改的 `resourceMeta` 子数组保持引用不变 —— 已从 GameState.ts 行 285-291 的 `setResource` 实现确认
2. `react-window` 与 React 18 + Vite 兼容 —— react-window 1.8.x 官方支持 React 18
3. 扁平化树后保留缩进视觉层级 —— 通过 `depth` 字段 + `paddingLeft` 实现
4. 命令层在 `execute` 内调用 `state.read()` 拿到的是当前快照，索引 memoized 在该快照的 resourceMeta 上有效

### 决策
1. **索引放工具层而非 GameState**：避免污染 GameData 与存档格式，符合"配置/索引不入存档"原则
2. **不合并所有 System 的 produce**：架构改动过大且影响事件时序（DAY_START→systems→DAY_END）。仅合并 TrainingSystem 内部的 2 次 produce，收益/风险比最优
3. **react-window 而非自研虚拟化**：成熟稳定，6KB 体积可接受，避免重复造轮子
4. **保留 getAvailableCards 的 filter**：命令触发非每日循环，O(poolSize) 可接受，不过度优化
5. **不引入 Map 字段到 GameData**：避免存档迁移复杂度，索引通过 memoized 工具函数按需重建

---

## 验证步骤

### 1. TypeScript 严格模式编译
```bash
pnpm check
```
确保无类型错误（strict 模式 + noUnusedLocals + noUnusedParameters）。

### 2. ESLint 检查
```bash
pnpm lint
```

### 3. 功能回归验证（手动）
启动 `pnpm dev`，验证以下场景无行为变化：
- 开局 → 采购 50 张 H100 → 安装到节点 → 创建集群 → 启动训练 → 训练完成发布模型
- 触发卡故障（用 SettingsPanel 调试推进天数）→ 验证 offline/broken 状态正确、热备池替换工作
- 调整训练算力（ReallocateTrainingCards）→ 验证卡分配正确转移
- 切换基建面板拓扑标签 → 验证树状层级渲染正确
- 切换模型面板训练标签 → 验证诊断信息正确显示

### 4. 性能验证（手动）
- 用 SettingsPanel 调试：添加 1000 张 H100（通过多次 PurchaseHardwareCommand + 推进天数交付）
- 安装到节点、创建集群、启动训练
- 观察游戏速度 4× 下每日推进是否流畅（应无肉眼可见卡顿）
- 切换基建/模型面板应 <100ms 响应

### 5. 存档兼容验证
- 保存当前游戏 → 重新加载 → 验证卡实例、训练项目、基础设施状态完整保留
- 索引工具不写入 GameData，存档格式不变

---

## 实施顺序建议

1. **第一步**：新增 `cardIndex.ts` 工具 + `crossSystemUtils.getEmployeeMap`（基础设施，无副作用）
2. **第二步**：替换核心层 4 个 System 中的 O(卡数²) 查找（3.2）
3. **第三步**：TrainingSystem 合并 produce + 缓存全局加成（3.3）
4. **第四步**：替换命令层嵌套查找（3.4）
5. **第五步**：安装 react-window + 改造 InfrastructurePanel 拓扑树（3.5）
6. **第六步**：ModelPanel useMemo + 派生订阅（3.6、3.7）
7. **第七步**：`pnpm check` + `pnpm lint` + 手动回归验证

每步完成后可独立编译通过，便于增量验证。
