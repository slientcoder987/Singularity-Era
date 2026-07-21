# 大规模算力卡（数十万级）性能瓶颈排查与优化报告

> 排查范围：`src/core` 全部与显卡数量 / 基础设施相关的代码
> 优化日期：2026-07-21
> 验证方式：TypeScript 全量编译 + Immer 行为基准测试（10k/50k/100k/200k 卡）

---

## 一、核心结论

数十万卡场景的主卡顿源不是"某条命令"，而是**每日 `state.update(draft)` 在 finalize 阶段的深度遍历**。基准测试（修改 5 张卡/天）：

| 卡数 | 优化前 (autoFreeze=on) | 优化后 (autoFreeze=off) | 提升 |
|---|---|---|---|
| 10,000 | 2.0 ms/天 | ~0.2 ms/天 | ~10× |
| 100,000 | 17.6 ms/天 | 1.9 ms/天 | ~9× |
| 200,000 | 33.2 ms/天 | 3.5 ms/天 | **~10×** |

> 按 speed=1（1 真实秒 = 1 游戏日）、每日 17 个系统各触发 1~3 次 update 估算，20 万卡时光 Immer 冻结遍历每日就要消耗数百毫秒主线程 —— 这就是"数十万卡后明显卡顿"的根因。

---

## 二、已修复的瓶颈

### ✅ 瓶颈 1（主因）：Immer produce finalize 深度冻结遍历卡池

- **位置**：`GameState.update()` → immer `produce`
- **根因**：每次 update，immer finalize 都会递归 `Object.freeze` 整个 state 树，包括 `resourceMeta` 下数十万 `CardInstance` 元素。即使一天只改 5 张卡，也要遍历全部 20 万元素。
- **修复**：`GameState.ts` 顶部 `setAutoFreeze(false)`。
- **安全性**：结构共享不受影响（引用比较/React `Object.is`/WeakMap 缓存失效机制全部照常工作）；代价是 base state 不再被 freeze 保护。本项目所有写入统一走 `state.update`，风险可控。

### ✅ 瓶颈 2：draft 上调用 `getCardIndex` / `findNode` / `findCluster` 每日重复全量重建索引

- **位置**：`cardIndex.ts` / `infraIndex.ts` 被 `InfrastructureFailureSystem`、`TrainingSystem`、`OperationsSystem`、`InfraMaintenanceSystem` 等在 `state.update(draft)` 内调用
- **根因**：WeakMap 缓存以 `data.resourceMeta` / `serverNodes` 的对象引用为 key。draft 的 proxy 引用与 base state 不同，导致每日每系统都 WeakMap miss → O(总卡数) 重建索引。
- **修复**：用 immer 的 `isDraft()` + `original()` 把 draft 解析回 base state 引用再查缓存。draft 上的索引查询现在直接命中 base 缓存，每日每系统最多重建一次（仅当数据真被修改）。
- **注意**：初版误用 `__DRAFT_STATE__` 字符串属性（不存在），已更正为官方 `original()` API。

### ✅ 瓶颈 3：批量装卡功耗检查 O(N²)

- **位置**：`InfraCommands.ts` `InstallCardCommand`
- **根因**：每装 1 张卡都遍历该节点全部已装卡重算功耗，装 N 张卡累计 O(N²)。数千卡批量装入节点时明显卡顿。
- **修复**：新增 `getNodeInstalledPowerKW()`，按 `node.installedCards` 数组引用缓存求和结果（WeakMap），批量装卡从 O(N²) 降为 O(N)。

---

## 三、已确认"本就优化良好"的部分（无需改动）

代码库已有较多正确的大规模优化，本次排查确认无需重复处理：

| 位置 | 已有优化 |
|---|---|
| `cardIndex.ts` | `getCardIndex` O(1) uid 查找（消除 pool.find 嵌套） |
| `computeUtilization.ts` | `summarizeCardSpecsFromMap` 按型号聚合，O(distinctModels)，避免 `Math.min(...十万数组)` 的 RangeError |
| `InfrastructureFailureSystem` | >2048 卡走 Fisher-Yates 采样；卡故障/节点故障预计算在只读快照上做，避免 draft proxy 遍历 |
| `computeUtilization.calcClusterTotalTflops` | 按 resourceMeta 引用缓存总算力 |
| `PowerSystem` | 计数循环替代 filter 临时数组 |
| `OperationsSystem` | 推理算力用 getCardIndex O(1)，替代 O(N×M×K) 嵌套 |
| `GameLoop` | `suspendNotify`/`resumeNotify` 把 60 天 × N 系统 update 合并为 1 次 UI 渲染 |
| `InfraMaintenanceSystem` | 训练/空闲功耗直接累加，不建中间大数组 |
| `ResearchSystem` | experimentResults 截断 1000 条，empMap 一次性构建 |
| `InfrastructurePanel.tsx` | 卡数 > 500 时折叠为聚合行，不渲染十万行 DOM |

---

## 四、残余性能风险（第二轮已全部修复）

以下为第一轮排查标记的 5 项残余风险，本轮已全部处理：

| 优先级 | 项 | 修复方案 | 状态 |
|---|---|---|---|
| P2 | 故障恢复循环每日遍历所有节点 `installedCards` | `cardIndex.ts` 新增 `getOfflineCardIndex()`：按 resourceMeta base 引用缓存"待恢复 offline 卡"反查表。恢复逻辑从 O(已装卡数) 降为 O(offline 数)，数十万已装卡下每日从数十万次 Map 查询降为个位数。 | ✅ 已修复 |
| P2 | `applyHostSpares` 热备扫描 | `cardIndex.ts` 新增 `getBrokenCardIndex()`：函数入口 `if (brokenIdx.size === 0) return` 整体短路（无 broken 卡时跳过所有 DC 遍历）；有 broken 卡时遍历反查集合 + `dcNodeIds` 归属判定，不再扫描健康卡。 | ✅ 已修复 |
| P3 | `calcClusterTotalTflops` 缓存粒度 | 单条 `_tflopsCache` 变量改为 `WeakMap<base引用, number>`：日内多次 resourceMeta 变化（交付+装卡+故障+热备）只在新引用首次调用时重建，同一引用命中 O(1)，且旧引用条目可被 GC。 | ✅ 已修复 |
| P3 | UI `resourceMeta` 选择器 | 经分析：`getCardIndex` 已按 base 引用 WeakMap 缓存 O(1)，`cardIdx` useMemo 仅在引用变化时重建，聚合 useMemo 依赖 cardIdx。订阅整个 resourceMeta 是 UI 反映卡状态的必要行为，且 GameLoop `suspendNotify` 已把每日 update 合并为每帧 1 次渲染。现有缓存链已足够，无需进一步拆分。 | ✅ 已分析（现状足够） |
| P3 | `diagnoseTraining` | 重构为按型号聚合（`byModel: Map<resourceId, {spec,count}>`）：消除数十万 cardSpecs 大数组分配、`Math.min(...大数组)` 的 RangeError 风险、`serverNodes.find` O(N²) 嵌套（改用 `getNodeIndex` O(1)）。 | ✅ 已修复 |

---

## 五、改动文件清单

### 第一轮（主瓶颈）

| 文件 | 改动 |
|---|---|
| `src/core/GameState.ts` | 新增 `setAutoFreeze(false)`（瓶颈 1） |
| `src/core/utils/cardIndex.ts` | `getCardIndex` 用 `isDraft`+`original` 解析 draft → base 缓存（瓶颈 2） |
| `src/core/utils/computeUtilization.ts` | `calcClusterTotalTflops` 同样解析 draft（瓶颈 2） |
| `src/core/utils/infraIndex.ts` | node/cluster/dc 三个索引用 `original()` 解析 draft 数组（瓶颈 2） |
| `src/core/commands/InfraCommands.ts` | 新增 `getNodeInstalledPowerKW` WeakMap 缓存（瓶颈 3） |

### 第二轮（残余风险）

| 文件 | 改动 |
|---|---|
| `src/core/utils/cardIndex.ts` | 新增 `getOfflineCardIndex()` + `getBrokenCardIndex()` 反查索引（P2×2） |
| `src/core/systems/InfrastructureFailureSystem.ts` | 恢复循环改用 `getOfflineCardIndex`；`applyHostSpares` 用 `getBrokenCardIndex` 短路 + `dcNodeIds` 归属判定（P2×2） |
| `src/core/utils/computeUtilization.ts` | `_tflopsCache` 单条变量 → `WeakMap`（P3） |
| `src/core/utils/trainingFeasibility.ts` | `diagnoseTraining` 改按型号聚合 + `getNodeIndex` O(1)（P3） |

**验证**：`tsc -b` 全量编译通过；immer 基准确认反查索引结果正确（offline=2/broken=1）、draft 内缓存复用正常（20 次反查 0.7ms）。

---

## 六、给玩家的可感知效果

- 批量装数千张卡到节点：功耗检查从平方级降为线性，不再逐卡变卡。
- 数十万卡日常推进：每日主线程 Immer 开销从数百毫秒降到几十毫秒，卡顿明显缓解。
- 训练/故障/电力等每日系统：索引不再每日重复重建，响应更快。
