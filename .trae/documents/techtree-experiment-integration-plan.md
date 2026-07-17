# 技术树与实验系统融入新研发系统 — 实施计划

## Context

新研发系统（PR1-PR5）已完成：技术成熟度（techMaturity 0-100）、idea 系统、开源机制、小公司市场三大技术流入路径，以及 `scaleTechEffect` 按 maturity 缩放效果的机制均已就位。

但**既有的技术树与实验系统未融入新机制**，存在 4 个脱节问题：

1. **实验结果未被训练消费**（最严重）：[capabilityCalc.ts:183](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/capabilityCalc.ts#L183) 中 `calculateCapabilities` 直接读取真实 `archMatrix[techId]`，完全绕过 `experimentResults`。玩家做不做实验，训练时都直接用真实值，实验系统形同虚设。
2. **实验不提升成熟度**：[ResearchSystem.ts:46-73](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/ResearchSystem.ts#L46) 实验完成只产出 ExperimentResult，不影响 techMaturity，与"实验验证使技术成熟"的直觉相悖。
3. **TechTab 不展示独有技术**：[ResearchPanel.tsx:302](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/ResearchPanel.tsx#L302) `ALL_TECH.filter(t => t.researchDays > 0)` 只展示预设技术树，idea/开源/小公司获得的独有技术（在 IDEA_TECH_MAP 中）不显示，玩家无法查看已获独有技术的 maturity 和效果。
4. **实验目标仅限预设架构技术**：[ResearchPanel.tsx:88](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/ResearchPanel.tsx#L88) `archTechs = ALL_TECH.filter(t => t.isArchitecture)` 不含独有架构技术（如 sparse_attention_v2 / long_rope / open_long_rope / sc_long_context），这些技术无法被实验验证。

**目标**：通过 5 个改进点让实验系统成为"揭示架构加成 + 提升成熟度"的核心路径，让 TechTab 统一展示所有技术来源，形成"idea/开源/小公司获技术 → 实验验证揭示加成并提升 maturity → 训练消费已知加成"的完整闭环。

**用户决策**（已确认）：
- 未实验架构在训练中**完全隐藏加成**（archBonus=1.0），强制玩家先实验
- 实验完成提升 maturity 用**绝对值**：small +5，medium +12

---

## Current State Analysis

### 实验系统数据流（当前）

```
ExperimentTab (UI)
  → StartExperimentCommand(targetArchId, researcherIds, scale, mainModelParams)
    → ResearchProject{type:'experiment_validation', targetArchId, experimentScale}
      → ResearchSystem.update 每日推进 progress
        → 完成时 runExperiment(archTechId, archMatrix, scale) → ExperimentResult
          → 存入 experimentResults[]
            → ExperimentTab 展示 aggregateExperiments（仅 UI，无下游消费）
```

**断点**：`calculateCapabilities`（训练系统）直接读真实 `archMatrix`，不读 `experimentResults`。

### 训练系统消费技术效果（当前）

[TrainingSystem.ts:94-95](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/TrainingSystem.ts#L94) 调用 `getActiveTechEffects(current)` 获取按 maturity 缩放的技术效果列表。
[TrainingSystem.ts:338-346](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/TrainingSystem.ts#L338) 调用 `calculateCapabilities(baseScore, contextLength, dataset, archMatrix, project.techIds, techEffects)`，其中 `archMatrix = generateArchMatrix(draft.archMatrixSeed)` 是**真实值**。

### 关键既有工具（可复用）

| 工具 | 位置 | 作用 |
|---|---|---|
| `aggregateExperiments(experiments, archTechId)` | [researchUtils.ts:62](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/researchUtils.ts#L62) | 加权平均多次实验结果，返回 `Partial<Record<capId, number>>` |
| `runExperiment(archTechId, archMatrix, scale, confidenceBonus)` | [researchUtils.ts:26](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/researchUtils.ts#L26) | 运行实验，返回带噪声的 ExperimentResult |
| `getTechMaturity(data, techId)` | [techLookup.ts:29](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/techLookup.ts#L29) | 查询技术成熟度 |
| `IDEA_TECH_MAP` | [techTree.ts:80](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/techTree.ts#L80) | 运行时独有技术表 |
| `acceptedIdeaTechs` | GameState | 持久化的独有技术节点列表 |

---

## Proposed Changes

### 改进 1：实验结果驱动训练架构加成（核心融合）

**文件**：[src/core/systems/TrainingSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/TrainingSystem.ts)

**改动位置**：L338 `const archMatrix = generateArchMatrix(draft.archMatrixSeed);` 替换为构建 `knownArchMatrix`。

**逻辑**：
```typescript
// 构建已知架构矩阵：仅包含已实验验证的架构加成（带噪声估计值）
const trueArchMatrix = generateArchMatrix(draft.archMatrixSeed);
const knownArchMatrix: Record<string, Partial<Record<CapabilityId, number>>> = {};
for (const techId of project.techIds) {
  const aggregated = aggregateExperiments(draft.experimentResults, techId);
  if (Object.keys(aggregated).length > 0) {
    knownArchMatrix[techId] = aggregated;
  }
}
// 后续 calculateCapabilities 传入 knownArchMatrix（而非 trueArchMatrix）
```

**新增 import**：`import { aggregateExperiments } from '../utils/researchUtils';` 和 `import type { CapabilityId } from '../config/capabilities';`

**效果**：未实验的架构 `knownArchMatrix` 中无条目 → `archBonus=1.0`（无加成）。已实验的架构按玩家观察到的估计值加成（含噪声，多次实验收敛）。

**注意**：`trueArchMatrix` 仍需保留给 `runExperiment` 使用（ResearchSystem 中），TrainingSystem 不再直接使用真实值。

### 改进 2：实验完成提升技术成熟度

**文件**：[src/core/systems/ResearchSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/ResearchSystem.ts)

**改动位置**：L60-61 `draft.experimentResults.push(result);` 之后追加 maturity 提升。

**逻辑**：
```typescript
// 实验完成提升对应架构技术成熟度（small +5, medium +12）
const archTechId = project.targetArchId ?? '';
if (archTechId) {
  const gain = project.experimentScale === 'medium' ? 12 : 5;
  const existing = draft.techMaturity[archTechId] ?? 0;
  draft.techMaturity[archTechId] = Math.min(100, existing + gain);
}
```

**效果**：实验不仅揭示加成，还让该技术更"成熟"→ effect 缩放更强 → 训练收益更高。形成"实验 → maturity↑ → 效果↑"正循环。

**数值依据**：与 idea accelerate（+5~10）和被动训练（+0.05/天）量级一致。medium 实验成本更高（15% vs 5% 算力），提升也更多。

### 改进 3：maturity 影响实验噪声与置信度

**文件**：[src/core/utils/researchUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/researchUtils.ts)

**改动位置**：`runExperiment` 函数签名新增 `techMaturity: number = 0` 参数，内部应用降噪。

**逻辑**：
```typescript
export function runExperiment(
  archTechId: string,
  archMatrix: ArchMatrix,
  scale: 'small' | 'medium',
  confidenceBonus: number = 0,
  techMaturity: number = 0,  // ← 新增
): ExperimentResult {
  const trueBonuses = archMatrix[archTechId] ?? {};
  const baseNoiseSigma = scale === 'small'
    ? EXPERIMENT_VALIDATION.smallNoiseSigma
    : EXPERIMENT_VALIDATION.mediumNoiseSigma;
  // 已解锁技术做实验：噪声降低（最高 -50%），代表"对已验证架构的复测更精确"
  const noiseSigma = baseNoiseSigma * (1 - Math.min(0.5, techMaturity / 200));
  // ...（Box-Muller 噪声生成不变）

  // maturity 加成置信度
  let matConfBonus = 0;
  if (techMaturity >= 100) matConfBonus = 0.2;
  else if (techMaturity >= 50) matConfBonus = 0.1;

  return {
    archTechId,
    estimatedBonuses,
    confidence: Math.max(0.1, Math.min(1, (1 - noiseSigma) + confidenceBonus + matConfBonus)),
    modelScale,
    date: 0,
  };
}
```

**调用方修改**（ResearchSystem.ts L54-58）：
```typescript
const archMaturity = draft.techMaturity[project.targetArchId ?? ''] ?? 0;
const result = runExperiment(
  project.targetArchId ?? '',
  archMatrix,
  project.experimentScale ?? 'small',
  0,               // confidenceBonus（未来可接 improve_experiment_confidence 技能）
  archMaturity,    // ← 新增
);
```

**效果**：已成熟技术做实验更精确（噪声低、置信度高），鼓励玩家对核心架构反复实验收敛。

### 改进 4：ExperimentTab 扩展独有架构技术

**文件**：[src/ui/components/ResearchPanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/ResearchPanel.tsx)

**改动位置**：L88 `const archTechs = ALL_TECH.filter((t) => t.isArchitecture && t.id !== 'pretraining');`

**替换为**：
```typescript
// 合并预设架构技术与已获得的独有架构技术
const uniqueArchTechs = Object.values(IDEA_TECH_MAP).filter(
  (t) => t.isArchitecture && (techMaturity[t.id] ?? 0) >= 1,
);
const archTechs = [
  ...ALL_TECH.filter((t) => t.isArchitecture && t.id !== 'pretraining'),
  ...uniqueArchTechs,
];
```

**效果**：玩家获得独有架构技术（如 sparse_attention_v2 / long_rope / open_long_rope / sc_long_context）后，可在 ExperimentTab 中选择实验验证，进一步揭示其能力加成并提升 maturity。

**注意**：`IDEA_TECH_MAP` 已在 L21 import。`techMaturity` 已在 L86 订阅。但独有架构技术在 archMatrix 中无真实值（generateArchMatrix 只含 rope/moe/swiglu），因此 runExperiment 对独有架构返回 `estimatedBonuses={}`（无加成可揭示）。这是合理的——独有架构的加成已通过 effect 直接体现（如 sparse_attention_v2 的 extend_context×2），实验系统对它们主要起"提升 maturity → 增强 effect 缩放"的作用。

### 改进 5：TechTab 展示独有技术 + maturity 数值

**文件**：[src/ui/components/ResearchPanel.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/ui/components/ResearchPanel.tsx)

**改动 1**：TechTab 函数顶部新增订阅：
```typescript
const acceptedIdeaTechs = useGameState((s) => s.acceptedIdeaTechs);
```

**改动 2**：L302 `ALL_TECH.filter((t) => t.researchDays > 0).map(...)` 之前，合并独有技术并分组展示。

**逻辑**：
```typescript
// 预设技术树（可研发）
const presetTechs = ALL_TECH.filter((t) => t.researchDays > 0);
// 已获得的独有技术（idea/开源/小公司）
const uniqueTechs = acceptedIdeaTechs;

// 渲染：
// 1. "技术研发"分区（现有逻辑，显示 presetTechs）
// 2. "独有技术"分区（新增，显示 uniqueTechs）
//    - 每项显示：名称 + source 标签（💡/🌐/🏢）+ maturity 数值 + 效果缩放比例
//    - 架构类技术标注"可实验验证"
```

**maturity 数值展示格式**：
- 未解锁（<1）：不显示（独有技术获得即 ≥30）
- 1-99：`成熟度 ${maturity.toFixed(0)}/100 · 效果 ${(maturity).toFixed(0)}%`
- 100：`✓ 满级`

**source 标签映射**：
- `idea` → 💡 创意
- `open_source` → 🌐 开源
- `small_company` → 🏢 收购

---

## Assumptions & Decisions

1. **完全隐藏未实验架构加成**（用户确认）：`knownArchMatrix` 仅含已实验架构，未实验架构 `archBonus=1.0`。强制玩家实验才能获得架构加成，实验系统成为必经路径。
2. **实验提升 maturity 用绝对值**（用户确认）：small +5 / medium +12，与 idea accelerate 量级一致。
3. **不改 auto_research 技术效果**：`improve_experiment_confidence` effect 类型保留为死代码，未来扩展。改进 3 的 maturity 降噪已提供足够的"已验证技术复测更精确"效果，避免叠加过多加成破坏平衡。
4. **独有架构技术可实验但无真实加成揭示**：generateArchMatrix 只含 rope/moe/swiglu，独有架构实验返回空 estimatedBonuses。实验对独有架构的作用是"提升 maturity → 增强 effect 缩放"，而非"揭示隐藏加成"。这是合理的——独有技术的加成已通过 TechNode.effect 透明展示。
5. **不改 StartExperimentCommand 命令签名**：现有 `targetArchId: string` 已支持任意技术 id，ExperimentTab 传入独有架构 id 时命令层无需修改。
6. **不改 calculateCapabilities 接口**：只改传入的 archMatrix 参数内容（真实值 → 已知值），函数签名和内部逻辑不变。
7. **knownArchMatrix 在 TrainingSystem 中每次训练完成时构建**：不缓存，因为 experimentResults 是数组，WeakMap 缓存收益不大且增加复杂度。训练完成是低频事件。
8. **TechTab 独有技术分区不显示"研发"按钮**：独有技术 researchDays=0，无法通过研发获得，只通过 idea/开源/小公司获得。只展示 maturity 和效果。

---

## Verification Steps

### 1. 编译验证
```powershell
npx tsc --noEmit
```
**预期**：零错误。

### 2. 核心闭环验证（改进 1）
- **场景**：玩家训练一个使用 RoPE 架构的模型，但未做 RoPE 实验。
- **预期**：`knownArchMatrix['rope']` 不存在 → `archBonus=1.0` → long_range_coherence 能力无架构加成（仅靠 baseScore×ctxFactor×dataBonus×techBonus）。
- **场景**：玩家做 1 次 small RoPE 实验（噪声σ=0.08），结果 estimatedBonuses={long_range_coherence: 0.25}（真实 0.2-0.3）。
- **预期**：再次训练使用 RoPE → `knownArchMatrix['rope']={long_range_coherence:0.25}` → `archBonus=1.25` → long_range_coherence 提升 25%。
- **场景**：做 5 次 small RoPE 实验后聚合，估计值收敛到真实值附近。
- **预期**：`aggregateExperiments` 加权平均，置信度高的实验权重更大。

### 3. maturity 提升验证（改进 2）
- **场景**：RoPE maturity=0，做 1 次 small 实验。
- **预期**：实验完成后 `techMaturity['rope']=5`。TechTab 显示"成熟度 5/100 · 效果 5%"。
- **场景**：RoPE maturity=0，做 1 次 medium 实验。
- **预期**：`techMaturity['rope']=12`。
- **场景**：RoPE maturity=95，做 1 次 small 实验。
- **预期**：`techMaturity['rope']=Math.min(100, 95+5)=100`。

### 4. 噪声降噪验证（改进 3）
- **场景**：RoPE maturity=0，做 small 实验，噪声σ=0.08。
- **预期**：`noiseSigma = 0.08 × (1 - 0/200) = 0.08`，无降噪。
- **场景**：RoPE maturity=100，做 small 实验。
- **预期**：`noiseSigma = 0.08 × (1 - 100/200) = 0.04`（降噪 50%），`confidenceBonus = 0.2`。

### 5. 独有架构实验验证（改进 4）
- **场景**：玩家通过 idea 获得 sparse_attention_v2（maturity=30），在 ExperimentTab 选择它做 small 实验。
- **预期**：实验完成，`runExperiment('sparse_attention_v2', archMatrix, 'small', 0, 30)` → `estimatedBonuses={}`（archMatrix 无此条目）→ `techMaturity['sparse_attention_v2']=35`（30+5）。
- **场景**：ExperimentTab 的 archTechs 下拉框包含 sparse_attention_v2（标注"已解锁"）。

### 6. TechTab 独有技术展示验证（改进 5）
- **场景**：玩家有 3 个独有技术：mixture_of_depths（idea, maturity=30）、open_long_rope（开源, maturity=45, 架构类）、sc_kv_cache_opt（小公司, maturity=60）。
- **预期**：TechTab 显示"独有技术"分区，3 项分别标注 💡/🌐/🏢，maturity 数值，open_long_rope 额外标注"可实验验证"。

### 7. 回归验证
- 既有预设技术树研发流程不受影响（TechTab 预设技术分区逻辑不变）。
- 既有 idea/开源/小公司获取技术流程不受影响（命令层无改动）。
- 既有训练流程的 techEffects（非架构效果）不受影响（getActiveTechEffects 逻辑不变）。

---

## 实施顺序

1. **改进 3**：修改 `researchUtils.ts` runExperiment 签名 + 降噪逻辑（独立，无依赖）
2. **改进 2 + 改进 3 调用方**：修改 `ResearchSystem.ts`（实验完成提升 maturity + 传入 archMaturity）
3. **改进 1**：修改 `TrainingSystem.ts`（构建 knownArchMatrix）
4. **改进 4 + 改进 5**：修改 `ResearchPanel.tsx`（ExperimentTab 扩展 + TechTab 独有技术分区）
5. **验证**：`npx tsc --noEmit` 零错误 + 浏览器运行时验证核心闭环

总计：修改 4 个文件，无新建文件，无