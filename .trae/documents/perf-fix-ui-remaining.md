# 性能优化计划（剩余）：UI 层虚拟化 + 诊断缓存

## 摘要

本计划承接 `perf-fix-gpu-scaling.md` 的第 5-7 步。核心层优化（第 1-4 步）已完成：`cardIndex.ts` 工具已创建，7 个核心文件已用 `getCardIndex`/`findCard` 替换所有 O(卡数²) 嵌套查找。`react-window@2.2.7` 已安装到 `package.json`。

剩余工作聚焦 UI 层：
1. **InfrastructurePanel 拓扑树虚拟化** — 当前 1000+ 张卡会生成 1000+ DOM 节点，每次 `resourceMeta` 引用变化（每日 `card.age++`）全部重渲染。改造为 react-window v2 `List` 虚拟列表，仅渲染可见的 ~20 行。
2. **InfrastructurePanel BuildTab 查找优化** — `nodeHasOfflineCard`、`faultedCards`、`getUninstalledCards` 每次渲染 O(卡数²) 扫描，改为 useMemo 缓存。
3. **ModelPanel 诊断 useMemo** — `diagnoseTraining` 每次渲染重算，包裹 useMemo 避免不必要计算。
4. **TypeScript + ESLint 验证**。

### 关键 API 适配：react-window v2 ≠ v1

原计划假设 v1 的 `FixedSizeList`，但已安装的 v2.2.7 导出完全不同的 API：

| v1 (FixedSizeList) | v2 (List) |
|---|---|
| `import { FixedSizeList } from 'react-window'` | `import { List } from 'react-window'` |
| `itemCount`, `itemSize`, `children` (render prop) | `rowCount`, `rowHeight`, `rowComponent` (组件 prop) |
| 无 rowProps | `rowProps: { rows }` 传入额外数据 |
| `style` 由 render prop 透传 | `rowComponent` 自动收到 `{ index, style, ariaAttributes } & RowProps` |

v2 `List` 泛型签名：
```typescript
List<RowProps extends object>(props: {
  rowComponent: (props: { ariaAttributes; index: number; style: CSSProperties } & RowProps) => ReactElement | null;
  rowCount: number;
  rowHeight: number | string | ((index, cellProps) => number);
  rowProps: RowProps;  // 不能含 ariaAttributes/index/style
  style?: CSSProperties;  // 必须设置 height，列表填充该高度
  overscanCount?: number;
  ...
})
```

---

## 当前状态分析

### InfrastructurePanel.tsx 现状（未改造）

**TopologyTab**（行 69-244）：
- 行 79-86 `getCard(uid)`：遍历所有 `resourceMeta` pool 做 `pool.find(c => c.uid === uid)`，O(总卡数) 每次调用
- 行 88-102 `getNodeMemory(nodeId)`：对节点每张卡调 `getCard`，O(节点卡数 × 总卡数)
- 行 110-164 拓扑树渲染：嵌套 `dataCenters.map → clusters.map → nodes.map → cards.map`，1000 卡 = 1000+ DOM 节点
- 行 73 `useGameState((s) => s.resourceMeta)`：每日 `card.age++` 使 resourceMeta 产生新引用，触发全量重渲染

**BuildTab**（行 246-1058）：
- 行 304-316 `getUninstalledCards()`：每次渲染遍历所有 resourceMeta，O(总卡数)
- 行 858-870 `nodeHasOfflineCard(nodeId)`：嵌套遍历节点卡 × resourceMeta pools，O(节点卡数 × 总卡数)
- 行 902-919 `faultedCards`：遍历所有 resourceMeta，O(总卡数)（可接受但无缓存）

### ModelPanel.tsx 现状（未改造）

- 行 113-119 `diagnosis`：渲染体内直接调用 `diagnoseTraining(...)`，每次渲染重算
- 行 74-77 仅订阅 `clusters`、`datasets`、`trainingProjects`、`unlockedTechs`，未订阅 `serverNodes`/`resourceMeta`
- **正确性问题**：`diagnoseTraining` 内部 `state.read()` 读取最新数据，但 TrainingTab 不订阅 `resourceMeta`，卡状态变化后诊断不更新（stale）

### useGameState 订阅机制

```typescript
// useGameState.ts: 通过 Object.is 比较选择结果，未变则跳过更新
setValue((prev) => (Object.is(prev, next) ? prev : next));
```
- 订阅 `s.resourceMeta`（对象引用）：immer 修改时产生新引用 → 每日触发更新
- 订阅 `s.clusters`（数组引用）：clusters 变化时触发

---

## 提议改动

### 3.1 InfrastructurePanel TopologyTab：虚拟化拓扑树

**文件**：`src/ui/components/InfrastructurePanel.tsx`

**改动要点**：

#### 3.1.1 新增导入
```typescript
import { useState, useMemo } from 'react';
import { List, type RowComponentProps } from 'react-window';
import type { CSSProperties } from 'react';
```

#### 3.1.2 卡实例 Map 缓存（替换 O(N²) getCard）

在 `TopologyTab` 内部：
```typescript
const cardMap = useMemo(() => {
  const map = new Map<string, { card: CardInstance; modelId: string }>();
  for (const key of Object.keys(resourceMeta)) {
    const pool = resourceMeta[key] as CardInstance[] | undefined;
    if (!pool) continue;
    for (const card of pool) {
      map.set(card.uid, { card, modelId: key });
    }
  }
  return map;
}, [resourceMeta]);
```
- 复杂度：O(总卡数) 每次 resourceMeta 变化，O(1) 查找
- 删除原 `getCard` 函数（行 79-86）

#### 3.1.3 节点显存 Map 缓存（替换 O(N²) getNodeMemory）

```typescript
const nodeMemoryMap = useMemo(() => {
  const map = new Map<string, { memoryGB: number; bandwidthGBs: number }>();
  for (const node of serverNodes) {
    let memoryGB = 0;
    let bandwidthGBs = 0;
    for (const cardUid of node.installedCards) {
      const entry = cardMap.get(cardUid);
      const spec = entry ? getCardSpec(entry.modelId) : undefined;
      if (spec) {
        memoryGB += spec.memoryGB;
        bandwidthGBs += spec.memoryBandwidth;
      }
    }
    map.set(node.id, { memoryGB, bandwidthGBs });
  }
  return map;
}, [serverNodes, cardMap]);
```
- 删除原 `getNodeMemory` 函数（行 88-102）

#### 3.1.4 扁平化拓扑树为行数组

定义行类型：
```typescript
interface TopologyRow {
  kind: 'dc' | 'cluster' | 'node' | 'card' | 'freeCluster' | 'freeNode' | 'freeNodesHeader';
  depth: number;
  icon: string;
  label: string;
  hint: string;
}
```

用 `useMemo` 依赖 `[dataCenters, clusters, serverNodes, cardMap, nodeMemoryMap]` 构建 `flattenedRows: TopologyRow[]`：
- 遍历 `dataCenters` → 对每个 DC push `{ kind: 'dc', depth: 0, ... }`
  - 遍历 `dc.clusters` → 查找 cluster → push `{ kind: 'cluster', depth: 1, ... }`
    - 遍历 `cluster.nodes` → 查找 node → push `{ kind: 'node', depth: 2, ... }`（从 `nodeMemoryMap` 取显存）
      - 遍历 `node.installedCards` → 从 `cardMap` 取卡 → push `{ kind: 'card', depth: 3, ... }`
- 遍历 `freeClusters`（`clusters.filter(c => c.dataCenterId === null)`）→ push `{ kind: 'freeCluster', depth: 0, ... }`
  - 遍历 cluster.nodes → push `{ kind: 'node', depth: 1, ... }`（注意 freeCluster 的 node depth 为 1）
- 若 `freeNodes.length > 0`：push `{ kind: 'freeNodesHeader', depth: 0, ... }`
  - 遍历 freeNodes → push `{ kind: 'freeNode', depth: 1, ... }`

**关键约束**：label 和 hint 字符串在扁平化时预计算，行组件只做纯渲染。

#### 3.1.5 行渲染组件

```typescript
interface TopologyRowProps {
  rows: TopologyRow[];
}

function TopologyRow({ index, style, rows }: RowComponentProps<TopologyRowProps>) {
  const row = rows[index];
  const paddingLeft = row.depth * 12 + 4;
  return (
    <div
      className={row.depth === 0 ? styles.treeNode : styles.treeChild}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: `${paddingLeft}px`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        flexWrap: 'nowrap',  // 覆盖 .devRow 的 flex-wrap: wrap
      }}
    >
      <span className={styles.devRowLabel} style={{ minWidth: 0, flexShrink: 0 }}>
        {row.icon} {row.label}
      </span>
      <span
        className={styles.devHint}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {row.hint}
      </span>
    </div>
  );
}
```

**CSS 适配说明**：
- `.devRow` 有 `flex-wrap: wrap`，长 hint 会换行导致行高不定。行组件用内联 `flexWrap: 'nowrap'` + `whiteSpace: 'nowrap'` + `overflow: 'hidden'` 覆盖，保证固定 28px 行高
- `.treeNode`/`treeChild` 的 `padding-left: 12px` 被内联 `paddingLeft` 覆盖以控制缩进层级
- `.devRowLabel`/`.devHint` 类保留用于字体样式（11px、uppercase、颜色等）

#### 3.1.6 List 渲染

```typescript
if (dataCenters.length === 0 && clusters.length === 0 && serverNodes.length === 0) {
  return <div className={styles.emptyHint}>尚无基础设施，请前往"建造"标签建设</div>;
}

const listHeight = Math.min(flattenedRows.length * 28, 600);

return (
  <div className={styles.tabBody}>
    <List<TopologyRowProps>
      rowComponent={TopologyRow}
      rowCount={flattenedRows.length}
      rowHeight={28}
      rowProps={{ rows: flattenedRows }}
      style={{ height: listHeight }}
      overscanCount={5}
    />
    {/* 事件日志保持不变（≤20 条，无需虚拟化） */}
    {infraEventLog.length > 0 && ( ... )}
  </div>
);
```

**行高决策**：固定 28px。`devRowLabel`/`devHint` 字体 11px，单行约 16-17px，28px 留足垂直间距。长 hint 用 `text-overflow: ellipsis` 截断（拓扑视图 1000+ 卡时优先保证流畅滚动，详细信息可在 BuildTab 查看）。

---

### 3.2 InfrastructurePanel BuildTab：useMemo 缓存查找结果

**文件**：`src/ui/components/InfrastructurePanel.tsx`（BuildTab 函数内）

#### 3.2.1 离线卡 uid Set 缓存

替换行 858-870 的 `nodeHasOfflineCard` 闭包：
```typescript
const offlineCardUids = useMemo(() => {
  const set = new Set<string>();
  for (const key of Object.keys(resourceMeta)) {
    const pool = resourceMeta[key] as CardInstance[] | undefined;
    if (!pool) continue;
    for (const card of pool) {
      if (card.status === 'offline') set.add(card.uid);
    }
  }
  return set;
}, [resourceMeta]);
```
`brokenNodes` 改为：`serverNodes.filter(n => n.installedCards.some(uid => offlineCardUids.has(uid)))`

#### 3.2.2 faultedCards 缓存

替换行 902-919 的 IIFE：
```typescript
const faultedCards = useMemo(() => {
  const cards: Array<{ uid: string; modelId: string; status: string; specName: string; repairCost: number }> = [];
  for (const key of Object.keys(resourceMeta)) {
    const pool = resourceMeta[key] as CardInstance[] | undefined;
    if (!pool) continue;
    for (const card of pool) {
      if (card.status === 'offline' || card.status === 'broken') {
        const spec = getCardSpec(key);
        cards.push({
          uid: card.uid, modelId: key, status: card.status,
          specName: spec?.name ?? key,
          repairCost: spec ? Math.ceil(spec.unitCost * 0.20) : 0,
        });
      }
    }
  }
  return cards;
}, [resourceMeta]);
```

#### 3.2.3 未安装卡列表缓存

替换行 304-316 的 `getUninstalledCards` 函数：
```typescript
const uninstalledCards = useMemo(() => {
  const cards: Array<{ uid: string; modelId: string }> = [];
  for (const key of Object.keys(resourceMeta)) {
    const pool = resourceMeta[key] as CardInstance[] | undefined;
    if (!pool) continue;
    for (const card of pool) {
      if (card.location === null && card.status === 'online') {
        cards.push({ uid: card.uid, modelId: key });
      }
    }
  }
  return cards;
}, [resourceMeta]);
```

**注意**：BuildTab 已导入 `useMemo`（与 TopologyTab 共享文件级导入）。BuildTab 本身不虚拟化（它是表单控件，DOM 节点数量固定不随卡数增长），仅需消除重复计算。

---

### 3.3 ModelPanel：diagnosis useMemo + 订阅补全

**文件**：`src/ui/components/ModelPanel.tsx`（TrainingTab 函数内）

#### 3.3.1 新增导入与订阅

```typescript
import { useState, useMemo } from 'react';
```

在 TrainingTab 内新增订阅（行 74-77 之后）：
```typescript
const serverNodes = useGameState((s) => s.serverNodes);
const resourceMeta = useGameState((s) => s.resourceMeta);
```

**理由**：
- `diagnoseTraining` 内部读取 `current.clusters`、`current.serverNodes`、`current.resourceMeta`（经 `getCardIndex`）
- 当前仅订阅 `clusters`，卡状态变化后诊断不更新（stale bug）
- 新增 `serverNodes`/`resourceMeta` 订阅确保诊断实时同步
- TrainingTab 已订阅 `trainingProjects`（每日变化），新增订阅不增加额外渲染频率

#### 3.3.2 diagnosis 包裹 useMemo

替换行 113-119：
```typescript
const arch = selectedArchs.has('moe') ? 'moe' : 'transformer';
const diagnosis = useMemo(
  () => selectedClusterId
    ? diagnoseTraining(paramCount, contextLength, arch, selectedClusterId, game.state)
    : [],
  [selectedClusterId, paramCount, contextLength, arch, clusters, serverNodes, resourceMeta, game.state],
);
```

**依赖项说明**：
- `selectedClusterId`、`paramCount`、`contextLength`、`arch`：用户输入变化时重算
- `clusters`、`serverNodes`、`resourceMeta`：基础设施状态变化时重算（通过订阅触发）
- `game.state`：GameState 实例引用稳定（不变），列入依赖仅为满足 exhaustive-deps 规则

**注意**：`diagnoseTraining` 内部已用 `getCardIndex`（Step 4 修复），复杂度从 O(卡数²) 降为 O(集群卡数)。useMemo 进一步避免用户输入 modelName 等无关字段时重算。

---

## 假设与决策

### 假设
1. react-window v2.2.7 的 `List` 组件与 React 18 兼容 — package.json `peerDependencies` 声明 `react: ^18.0.0 || ^19.0.0`
2. 扁平化后每行 28px 固定高度，长 hint 截断显示（`text-overflow: ellipsis`）— 牺牲少量信息密度换取 1000+ 卡场景的流畅滚动
3. `RowComponentProps` 类型从 react-window v2 正确导出 — 已从 d.ts 行 433 确认 `export declare type RowComponentProps<RowProps> = ComponentProps<RowComponent<RowProps>>`
4. TopologyTab 每日重渲染不可避免（`card.age++` 改变 resourceMeta 引用），但虚拟化后仅渲染 ~20 个可见行，DOM 操作从 O(1000) 降为 O(20)

### 决策
1. **行高固定 28px 而非动态**：v2 的 `useDynamicRowHeight` 效率低于预定高度，1000+ 行场景优先性能。长内容用 `ellipsis` 截断
2. **BuildTab 不虚拟化**：它是表单控件（select/input/button），DOM 节点数固定不随卡数增长，仅需 useMemo 消除重复计算
3. **事件日志不虚拟化**：仅显示最近 20 条，`slice(-20).reverse()` 已有上限
4. **ModelPanel 新增 resourceMeta 订阅**：虽然 resourceMeta 每日变化，但 TrainingTab 已因 trainingProjects 每日重渲染，新增订阅不增加渲染频率，且修复了诊断 stale bug
5. **不使用 CSS Modules 新增类**：行样式用内联 style 覆盖 `.devRow` 的 `flex-wrap: wrap`，避免修改 CSS 文件

---

## 实施步骤

### 第一步：InfrastructurePanel TopologyTab 虚拟化（3.1）
1. 添加 `useMemo`、`List`、`RowComponentProps`、`CSSProperties` 导入
2. 在 TopologyTab 内添加 `cardMap`、`nodeMemoryMap` useMemo
3. 删除 `getCard`、`getNodeMemory` 函数
4. 定义 `TopologyRow` 接口和 `TopologyRowProps`
5. 构建 `flattenedRows` useMemo
6. 实现 `TopologyRow` 行组件
7. 替换嵌套 JSX 为 `<List>` 组件
8. 保留事件日志渲染（List 之后）

### 第二步：InfrastructurePanel BuildTab useMemo 缓存（3.2）
1. 添加 `offlineCardUids` useMemo，替换 `nodeHasOfflineCard` 闭包
2. 添加 `faultedCards` useMemo，替换 IIFE
3. 添加 `uninstalledCards` useMemo，替换 `getUninstalledCards` 函数

### 第三步：ModelPanel diagnosis useMemo（3.3）
1. 添加 `useMemo` 导入
2. TrainingTab 内添加 `serverNodes`、`resourceMeta` 订阅
3. 用 useMemo 包裹 `diagnosis`

### 第四步：验证（3.4）
1. `npx tsc -b --noEmit` — TypeScript 严格模式编译
2. `pnpm lint` — ESLint 检查
3. 手动回归：
   - 开局 → 买卡 → 装节点 → 建集群 → 启动训练 → 切换拓扑标签验证树状层级
   - 触发卡故障 → 验证 BuildTab 故障节点/故障卡列表正确
   - 切换模型面板训练标签 → 验证诊断信息正确且随卡状态更新

---

## 验证步骤

### 1. TypeScript 严格模式编译
```bash
npx tsc -b --noEmit
```
确保无类型错误（strict + noUnusedLocals + noUnusedParameters）。

### 2. ESLint 检查
```bash
pnpm lint
```

### 3. 功能回归验证（手动）
启动 `pnpm dev`，验证：
- 拓扑标签：DC → 集群 → 节点 → 卡 层级渲染正确，缩进视觉一致
- 拓扑标签滚动：1000+ 卡场景下滚动流畅，无卡顿
- 建造标签：安装卡、创建集群、故障修复下拉框列表正确
- 训练标签：选择集群后诊断信息正确显示，卡故障后诊断实时更新
- 长文本截断：节点/卡行 hint 过长时以 `...` 截断，不换行

### 4. 性能验证（手动）
- 用 SettingsPanel 调试：添加 1000 张 H100
- 安装到节点、创建集群、启动训练
- 切换基建拓扑标签 → 应 <100ms 响应
- 游戏速度 4× 下每日推进 → 无肉眼可见卡顿
