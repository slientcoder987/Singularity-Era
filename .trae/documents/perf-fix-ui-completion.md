# 性能优化收尾计划：BuildTab IIFE 清理 + ModelPanel 诊断缓存

## 摘要

承接 `perf-fix-gpu-scaling.md`（7 步总体计划）与 `perf-fix-ui-remaining.md`（UI 层细化计划）。
- **核心层（Step 1-4）已完成**：`cardIndex.ts` WeakMap 索引工具已集成到 7 个核心文件，消除 O(卡数²) 嵌套查找。
- **UI 层 Step 3.1 已完成**：`InfrastructurePanel` 的 `TopologyTab` 已用 react-window v2 `List` 虚拟化，1000+ 卡仅渲染 ~20 可见行。
- **UI 层 Step 3.2 部分完成**：`BuildTab` 已添加 4 个 useMemo（`uninstalledCards` / `offlineCardUids` / `brokenNodes` / `faultedCards`），但 JSX 内两个 IIFE 仍在重复计算并 shadow 顶层 memo 变量。
- **UI 层 Step 3.3 未开始**：`ModelPanel.TrainingTab` 的 `diagnosis` 每次渲染重算，且未订阅 `serverNodes` / `resourceMeta`，存在 stale 诊断 bug。
- **验证 Step 3.4 未执行**。

本计划聚焦剩余 3 项收尾工作，让 1000+ 卡场景下的 UI 流畅性达到目标。

---

## 当前状态分析

### InfrastructurePanel.tsx BuildTab 现状（关键问题：变量 shadow + 重复计算）

文件：`src/ui/components/InfrastructurePanel.tsx`

**已添加的顶层 useMemo（行 325-375）**：
```typescript
const uninstalledCards = useMemo(...);   // 行 325，已在 JSX 中使用
const offlineCardUids = useMemo(...);    // 行 339，仅被 brokenNodes 依赖
const brokenNodes = useMemo(...);        // 行 351，⚠ 当前未被 JSX 使用
const faultedCards = useMemo(...);       // 行 356，⚠ 当前未被 JSX 使用
```

**JSX 内仍存在的两个 IIFE（行 914-1009）**：

1. **行 915-956 `nodeHasOfflineCard` IIFE**：
   - 重新声明局部 `const brokenNodes = serverNodes.filter(...)`（行 928），shadow 顶层同名 memo
   - 内部 `nodeHasOfflineCard` 仍是 O(节点卡数 × 总卡数) 嵌套查找（与已修复的核心层问题同构）
   - 返回 JSX：`<select>` 列出故障节点 + "修复节点" 按钮

2. **行 959-1009 `faultedCards` IIFE**：
   - 重新声明局部 `const faultedCards: Array<...> = []`（行 960），shadow 顶层同名 memo
   - 重新遍历所有 resourceMeta pool 收集 offline/broken 卡（与顶层 memo 完全重复）
   - 返回 JSX：`<select>` 列出故障卡 + "修复/报废" 按钮

**后果**：
- 顶层 `brokenNodes` / `faultedCards` memo 被 shadow，等同未启用 → 1000+ 卡时每次渲染仍执行 O(卡数²) 嵌套查找
- TypeScript `noUnusedLocals` 可能误报（实际是被 shadow 而非未使用，但语义混乱）
- 违反 DRY：同一逻辑出现两次

### ModelPanel.tsx TrainingTab 现状（关键问题：stale 诊断 + 无缓存）

文件：`src/ui/components/ModelPanel.tsx`

**行 1**：`import { useState } from 'react';` — 缺 `useMemo`

**行 74-77 订阅**：
```typescript
const clusters = useGameState((s) => s.clusters);
const datasets = useGameState((s) => s.datasets);
const trainingProjects = useGameState((s) => s.trainingProjects);
const unlockedTechs = useGameState((s) => s.unlockedTechs);
```
未订阅 `serverNodes` / `resourceMeta`。

**行 113-119 诊断计算**：
```typescript
const diagnosis = selectedClusterId
  ? diagnoseTraining(
      paramCount, contextLength,
      selectedArchs.has('moe') ? 'moe' : 'transformer',
      selectedClusterId, game.state,
    )
  : [];
```
- 每次渲染重算（即使只是用户改 `modelName` 输入框也重算）
- `diagnoseTraining` 内部 `state.read()` 读取最新 `serverNodes` / `resourceMeta`，但 TrainingTab 不订阅这两者 → **卡状态变化后诊断不更新（stale bug）**
  - 例：卡从 online 变 offline，`diagnoseTraining` 应提示算力不足，但 TrainingTab 未触发重渲染，UI 仍显示旧诊断

---

## 提议改动

### 第一步：BuildTab IIFE 清理（使用已有 memo 变量）

**文件**：`src/ui/components/InfrastructurePanel.tsx`

#### 1.1 替换"节点修复"IIFE（行 914-956）

将：
```typescript
{/* 节点修复（节点故障后所有卡离线） */}
{(() => {
  const nodeHasOfflineCard = (nodeId: string): boolean => { ... };
  const brokenNodes = serverNodes.filter((n) => nodeHasOfflineCard(n.id));
  if (brokenNodes.length === 0) return null;
  return ( ...JSX... );
})()}
```

改为：
```typescript
{/* 节点修复（节点故障后所有卡离线） */}
{brokenNodes.length > 0 && (
  <div className={styles.devRow}>
    <select
      className={styles.select}
      value={repairNodeId}
      onChange={(e) => setRepairNodeId(e.target.value)}
    >
      <option value="">选择故障节点...</option>
      {brokenNodes.map((n) => (
        <option key={n.id} value={n.id}>
          {n.name} · 修复 ${(n.maintenanceCost * 10).toLocaleString()}
        </option>
      ))}
    </select>
    <button
      className={styles.btn}
      disabled={!repairNodeId}
      onClick={() => {
        game.executeCommand(new RepairNodeCommand(repairNodeId));
        setRepairNodeId('');
      }}
    >
      修复节点
    </button>
  </div>
)}
```

**关键点**：
- 删除整个 IIFE 包装，直接用顶层 `brokenNodes` memo（行 351 已 memoized，依赖 `serverNodes` + `offlineCardUids`）
- JSX 内容保持不变（select option 文案、按钮逻辑、`repairNodeId` state、`RepairNodeCommand` 调用全保留）
- `brokenNodes.length === 0` 时原 IIFE 返回 `null`，改为 `brokenNodes.length > 0 && (...)` 等价

#### 1.2 替换"卡修复/报废"IIFE（行 959-1009）

将：
```typescript
{/* 卡修复/报废 */}
{(() => {
  const faultedCards: Array<...> = [];
  for (const modelId of Object.keys(resourceMeta)) { ... }
  if (faultedCards.length === 0) return null;
  return ( ...JSX... );
})()}
```

改为：
```typescript
{/* 卡修复/报废 */}
{faultedCards.length > 0 && (
  <div className={styles.devRow}>
    <select
      className={styles.select}
      value={repairCardUid}
      onChange={(e) => setRepairCardUid(e.target.value)}
    >
      <option value="">选择故障卡...</option>
      {faultedCards.map((c) => (
        <option key={c.uid} value={c.uid}>
          {c.specName} ({c.status}) · {c.uid.slice(-6)} · {c.status === 'offline' ? `修复 $${c.repairCost}` : '报废回收'}
        </option>
      ))}
    </select>
    <button
      className={styles.btn}
      disabled={!repairCardUid}
      onClick={() => {
        const card = faultedCards.find((c) => c.uid === repairCardUid);
        if (card?.status === 'offline') {
          game.executeCommand(new RepairCardCommand(repairCardUid));
        } else {
          game.executeCommand(new ScrapCardCommand(repairCardUid));
        }
        setRepairCardUid('');
      }}
    >
      {faultedCards.find((c) => c.uid === repairCardUid)?.status === 'broken' ? '报废' : '修复'}
    </button>
  </div>
)}
```

**关键点**：
- 删除整个 IIFE 包装，直接用顶层 `faultedCards` memo（行 356 已 memoized，依赖 `resourceMeta`）
- JSX 内 `faultedCards.find((c) => c.uid === repairCardUid)` 保留（按钮文案根据选中卡状态切换）
- `faultedCards.length === 0` 时原 IIFE 返回 `null`，改为 `faultedCards.length > 0 && (...)` 等价

#### 1.3 验证 uninstalledCards / offlineCardUids 已被使用

- `uninstalledCards`：行 419、431、469、481、546、565 已使用 ✓
- `offlineCardUids`：行 351 被 `brokenNodes` memo 依赖 ✓
- `brokenNodes`：第一步 1.1 替换后使用 ✓
- `faultedCards`：第一步 1.2 替换后使用 ✓

替换后所有顶层 memo 都被消费，无 `noUnusedLocals` 警告。

---

### 第二步：ModelPanel diagnosis useMemo + 订阅补全

**文件**：`src/ui/components/ModelPanel.tsx`

#### 2.1 修改 import（行 1）

将：
```typescript
import { useState } from 'react';
```
改为：
```typescript
import { useState, useMemo } from 'react';
```

#### 2.2 TrainingTab 新增订阅（行 77 之后）

在 `const unlockedTechs = useGameState((s) => s.unlockedTechs);` 之后新增：
```typescript
const serverNodes = useGameState((s) => s.serverNodes);
const resourceMeta = useGameState((s) => s.resourceMeta);
```

**理由**：
- `diagnoseTraining` 内部经 `getCardIndex(state)` 读取 `resourceMeta`，并查 `serverNodes` 上的 `installedCards`
- 当前仅订阅 `clusters`，卡状态变化时 TrainingTab 不重渲染 → 诊断 stale
- 新增订阅后，卡 offline/broken 等状态变化会触发 TrainingTab 重渲染 → diagnosis useMemo 重算
- TrainingTab 已订阅 `trainingProjects`（每日变化），新增订阅不增加额外渲染频率上限

**注意**：虽然 `serverNodes` / `resourceMeta` 在 TrainingTab JSX 中不直接读取，但它们是 `diagnosis` useMemo 的依赖，必须订阅以触发重算。`noUnusedLocals` 不会报错，因为它们出现在 useMemo 依赖数组中。

#### 2.3 包裹 diagnosis 为 useMemo（替换行 111-119）

将：
```typescript
// 实时诊断：当参数变化时自动分析可行性
// 每次渲染重算以确保卡状态变化后诊断同步更新
const diagnosis = selectedClusterId
  ? diagnoseTraining(
      paramCount, contextLength,
      selectedArchs.has('moe') ? 'moe' : 'transformer',
      selectedClusterId, game.state,
    )
  : [];
```

改为：
```typescript
// 实时诊断：参数或基础设施状态变化时重算
const arch = selectedArchs.has('moe') ? 'moe' : 'transformer';
const diagnosis = useMemo(
  () => selectedClusterId
    ? diagnoseTraining(paramCount, contextLength, arch, selectedClusterId, game.state)
    : [],
  [selectedClusterId, paramCount, contextLength, arch, clusters, serverNodes, resourceMeta, game.state],
);
```

**依赖项说明**：
- `selectedClusterId` / `paramCount` / `contextLength` / `arch`：用户输入变化时重算
- `clusters` / `serverNodes` / `resourceMeta`：基础设施状态变化时重算（通过新订阅触发）
- `game.state`：GameState 实例引用稳定，列入依赖仅为满足 `react-hooks/exhaustive-deps` 规则

**注释更新**：原注释"每次渲染重算以确保卡状态变化后诊断同步更新"已不准确（useMemo 会缓存），改为"参数或基础设施状态变化时重算"。

---

### 第三步：验证

#### 3.1 TypeScript 严格模式编译

```bash
npx tsc -b --noEmit
```
预期：无错误。重点检查：
- `InfrastructurePanel.tsx`：`brokenNodes` / `faultedCards` 不再被 shadow，无 `noUnusedLocals` 警告
- `ModelPanel.tsx`：`serverNodes` / `resourceMeta` 在 useMemo 依赖数组中被使用，无未使用变量警告
- react-window v2 类型：`List<TopologyRowProps>` 与 `RowComponentProps<TopologyRowProps>` 已在 Step 3.1 验证通过

#### 3.2 ESLint 检查

```bash
pnpm lint
```
预期：无错误。重点检查：
- `react-hooks/exhaustive-deps`：ModelPanel diagnosis useMemo 依赖数组完整
- `no-unused-vars`：BuildTab 顶层 memo 变量均被消费

#### 3.3 功能回归（手动，可选）

启动 `pnpm dev`：
- **基建-建造标签**：触发卡故障（用 SettingsPanel 调试）→ "选择故障节点" 和 "选择故障卡" 下拉框列表正确显示
- **训练标签**：选择集群后诊断信息正确显示；触发卡故障后诊断实时更新（提示算力不足）

---

## 假设与决策

### 假设
1. **顶层 memo 已正确实现**：经 Grep 确认行 325-375 的 4 个 useMemo 已就位，本计划仅替换 JSX 消费侧
2. **react-window v2 类型已在 Step 3.1 验证通过**：`List` / `RowComponentProps` 导入和 TopologyTab 编译已无错误
3. **`diagnoseTraining` 内部已用 `getCardIndex`**：Step 4 已修复，复杂度从 O(卡数²) 降为 O(集群卡数)
4. **TrainingTab 已因 `trainingProjects` 每日重渲染**：新增 `serverNodes` / `resourceMeta` 订阅不增加渲染频率上限

### 决策
1. **不修改 BuildTab 的 JSX 内容**：仅移除 IIFE 包装，select option / button / Command 调用全保留，确保行为完全一致
2. **ModelPanel 新增 `serverNodes` / `resourceMeta` 订阅**：虽然 JSX 不直接读取，但作为 useMemo 依赖必须订阅以触发重算
3. **`arch` 变量提取到 useMemo 之前**：避免在依赖数组中重复计算 `selectedArchs.has('moe')`，同时让依赖项更清晰
4. **不虚拟化 BuildTab**：它是表单控件，DOM 节点数固定不随卡数增长，useMemo 已足够
5. **保留 `game.state` 在 useMemo 依赖中**：虽然引用稳定，但 `react-hooks/exhaustive-deps` 规则要求列入

---

## 实施步骤

### Step 1: BuildTab IIFE 清理（InfrastructurePanel.tsx）
1. 用 Edit 替换行 914-956 的 `nodeHasOfflineCard` IIFE 为 `brokenNodes.length > 0 && (...)` 条件渲染
2. 用 Edit 替换行 959-1009 的 `faultedCards` IIFE 为 `faultedCards.length > 0 && (...)` 条件渲染
3. 确认顶层 `brokenNodes` / `faultedCards` memo 被消费

### Step 2: ModelPanel diagnosis useMemo + 订阅（ModelPanel.tsx）
1. 用 Edit 修改行 1 的 import：`useState` → `useState, useMemo`
2. 用 Edit 在行 77 后添加 `serverNodes` / `resourceMeta` 订阅
3. 用 Edit 替换行 111-119 的 diagnosis 计算为 useMemo 包裹

### Step 3: 验证
1. `npx tsc -b --noEmit` — 无类型错误
2. `pnpm lint` — 无 lint 错误

---

## 验证清单

- [ ] `npx tsc -b --noEmit` 通过
- [ ] `pnpm lint` 通过
- [ ] InfrastructurePanel.tsx 中 `brokenNodes` / `faultedCards` 顶层 memo 在 JSX 中被使用（无 shadow）
- [ ] ModelPanel.tsx 中 `diagnosis` 被 useMemo 包裹，依赖数组包含 `selectedClusterId` / `paramCount` / `contextLength` / `arch` / `clusters` / `serverNodes` / `resourceMeta` / `game.state`
- [ ] ModelPanel.tsx 中 TrainingTab 订阅 `serverNodes` / `resourceMeta`
