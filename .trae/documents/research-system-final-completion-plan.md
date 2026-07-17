# 研发系统扩展 — 最终完成计划（PR3 收尾 + PR4 + PR5）

## Summary

承接已批准的 [research-system-completion-plan.md](./research-system-completion-plan.md)（1080 行，含 PR3/PR4/PR5 全部代码）。本计划是对该文档的**精准修正版**，基于本次会话通过 `npx tsc --noEmit` + 文件系统核实的**真实当前状态**。

**真实当前状态**（2026-07-18 核实）：
- ✅ **PR1（数据结构迁移）100% 完成**：GameState.ts L211-226 已含全部字段（`pendingIdeas: TechIdea[]` / `smallCompanies: SmallCompany[]` / `openSourceOffers: OpenSourceOffer[]` / `acceptedIdeaTechs: IdeaTechNode[]` / `lastSmallCompanyRefreshDay: number` / `lastOpenSourceDay: Record<string, number>`）。
- ✅ **PR2（研究员接入研发）100% 完成**：TechCommands / TrainingSystem / TechResearchSystem 编译通过。
- ⚠️ **PR3（idea 系统）99% 完成，仅剩 1 个 import 错误**：
  - `ideaTechPool.ts`（3566 字节）✅ 完整，含 10 个独有技术。
  - `IdeaGenerationSystem.ts`（6013 字节）✅ 完整闭合，但**第 23 行 import 错误**：`IDEA_TECH_POOL` 误从 `../config/techTree` 导入，应从 `../config/ideaTechPool` 导入。
  - `IdeaCommands.ts`（2899 字节）✅ 完整。
  - `main.tsx` L12 + L130 ✅ 已注册 IdeaGenerationSystem（在 TechResearchSystem 之前）。
  - `ResearchPanel.tsx` L25-32 + L59-61 + L483-542 ✅ 已有 idea tab + IdeaTab 组件。
- ❌ **PR4（开源机制）0%**：openSourcePool.ts / OpenSourceCommands.ts 不存在；CompetitorSystem.ts 未接入开源触发；ResearchPanel 无 openSource tab。
- ❌ **PR5（小公司市场）0%**：smallCompanyTech.ts / SmallCompanyMarketSystem.ts / SmallCompanyCommands.ts 不存在；main.tsx 未注册；ResearchPanel 无 market tab。

**当前 tsc 错误**（仅 2 个，同源）：
```
src/core/systems/IdeaGenerationSystem.ts(23,10): error TS2724: '"../config/techTree"' has no exported member named 'IDEA_TECH_POOL'. Did you mean 'IDEA_TECH_MAP'?
src/core/systems/IdeaGenerationSystem.ts(96,48): error TS7006: Parameter 't' implicitly has an 'any' type.
```
（第 96 行的 `t` 隐式 any 是由第 23 行 import 失败连带引起，修复 import 后自动消失）

**目标**：修正 1 个 import 错误 + 完成 PR4（新建 2 + 修改 2）+ PR5（新建 3 + 修改 2），最终 `npx tsc --noEmit` 零错误，满足用户原始需求。

**工作量**：修改 1 文件（PR3 import）+ 新建 5 文件（PR4: openSourcePool / OpenSourceCommands；PR5: smallCompanyTech / SmallCompanyMarketSystem / SmallCompanyCommands）+ 修改 3 文件（CompetitorSystem.ts / main.tsx / ResearchPanel.tsx）。

---

## Current State Analysis

### 已就位的关键基础设施（无需改动）

| 文件 | 关键内容 |
|---|---|
| [GameState.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/GameState.ts) L211-226 | 全部 6 个新字段类型已定义 |
| [Competitor.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Competitor.ts) L17/L42/L188/L252/L312 | `CompetitorStrategy` 类型 + `strategy` 字段 + 3 家 `open_source` 公司（menta/shallowfind/mistral） |
| [OpenSourceOffer.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/OpenSourceOffer.ts) | 实体接口完整（id/techId/techName/techDescription/source/publishedDay/adoptionCost/initialMaturity/expiresDay/adoptedDay?） |
| [SmallCompany.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/SmallCompany.ts) | 实体接口完整（id/name/technologies/valuation/spawnedDay/lifespan/acquired/background） |
| [techTree.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/techTree.ts) L80 | `IDEA_TECH_MAP: Record<string, IdeaTechNode> = {}` 空容器 + `ALL_TECH` 导出 |
| [main.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/main.tsx) L111-116 | initialData 含全部新字段 |
| [IdeaCommands.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/commands/IdeaCommands.ts) | AcceptIdeaCommand + RejectIdeaCommand 完整（76 行） |

### CompetitorSystem.ts 修改目标结构

- `update(state, events, _deltaDays)` L58-259，每 `COMPETITOR_TICK_DAYS=7` 天执行。
- 工作流：初始化 → simulateCompetitor 循环 L135-137 → 玩家模型追赶 → 兼并浪潮 → 合并 → intel 裁剪 → 破产过滤得 `survivors` L201-208 → `state.update` 写回 survivors L246-255 → `updateCompetitorStates(survivors)` L258。
- **开源触发插入点**：L258 `updateCompetitorStates(survivors);` 之后、L259 方法闭合 `}` 之前。遍历 `survivors`（非工作集 `competitors`），确保破产公司同 tick 不开源。
- `genId(prefix)` 函数已在 L9-11 定义，可直接复用。
- `current` 变量在 L59 定义，整个 update 作用域可用。

### ResearchPanel.tsx 当前结构

- `type ResearchTab = 'experiment' | 'tech' | 'idea' | 'risk'` L25。
- `RESEARCH_TABS` 4 项 L27-32。
- tab 容器 L53-64（idea tab 在 L59-61）。
- 4 个子组件：ExperimentTab / TechTab / IdeaTab / RiskTab。
- 已 import：`AcceptIdeaCommand, RejectIdeaCommand` L12，`ALL_TECH, TECH_MAP` L19。

---

## Proposed Changes

### PR3 — 修正 IdeaGenerationSystem.ts import（1 文件）

**唯一改动**：[src/core/systems/IdeaGenerationSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/IdeaGenerationSystem.ts) L23。

当前（错误）：
```typescript
import { IDEA_TECH_POOL, IDEA_TECH_MAP, TECH_MAP } from '../config/techTree';
```

改为（拆为两行，IDEA_TECH_POOL 从正确模块导入）：
```typescript
import { IDEA_TECH_MAP, TECH_MAP } from '../config/techTree';
import { IDEA_TECH_POOL } from '../config/ideaTechPool';
```

**验证**：`npx tsc --noEmit` 零错误（2 个错误同时消失，第 96 行 `t` 隐式 any 是连带错误）。

---

### PR4 — 开源机制（新建 2 + 修改 2）

#### 4.1 新建 `src/core/config/openSourcePool.ts`

7 个开源独有技术（`source: 'open_source'`），完整代码见 [原计划 L349-417](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L349-L417)。

技术清单：`open_gqa` / `open_quant_v2` / `open_flash_attn_v3` / `open_long_rope` / `open_dpo_v2` / `open_data_cleaning` / `open_swiglu_v2`。所有 `prerequisites: []` / `researchDays: 0` / `researchCost: 0`。

#### 4.2 新建 `src/core/commands/OpenSourceCommands.ts`

`AdoptOpenSourceCommand` 类，完整代码见 [原计划 L423-473](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L423-L473)。

逻辑：
1. 校验 offer 存在 / 未采纳 / 未过期 / 资金充足。
2. 扣 `funds` × `adoptionCost`，标记 `adoptedDay`。
3. 若 techId 在 `OPEN_SOURCE_TECH_POOL` 中，注册到 `IDEA_TECH_MAP` + 推入 `acceptedIdeaTechs`。
4. `techMaturity[techId] = max(现有, initialMaturity=30)`。
5. emit `OPEN_SOURCE_ADOPTED`。

#### 4.3 修改 `src/core/systems/CompetitorSystem.ts`

**追加 imports**（L1-6 区域）：
```typescript
import type { OpenSourceOffer } from '../entities/OpenSourceOffer';
import { OPEN_SOURCE_TECH_POOL } from '../config/openSourcePool';
import { ALL_TECH } from '../config/techTree';
```
注：`IDEA_TECH_MAP` 已在原计划代码中使用，但 CompetitorSystem 当前未导入 techTree 任何符号，需新增 `import { ALL_TECH, IDEA_TECH_MAP } from '../config/techTree';`。`TechEffect` 类型无需导入（类型可自动推断）。

**追加逻辑**：在 L258 `updateCompetitorStates(survivors);` 之后插入开源触发，完整代码见 [原计划 L488-556](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L488-L556)。

关键逻辑：
- 遍历 `survivors`，过滤 `strategy === 'open_source'`。
- cooldown = `30 + floor(random × 31)` 天（30~60）。
- 60% 概率从 `OPEN_SOURCE_TECH_POOL` 过滤未注册的选；40% 从 `ALL_TECH` 过滤未解锁且 `researchDays > 0` 的选。
- 成本 `50_000 + random × 150_000`（$50k~$200k），初始 maturity=30，窗口 14 天。
- 批量 push 到 `openSourceOffers`，更新 `lastOpenSourceDay[comp.id]`，emit `OPEN_SOURCE_PUBLISHED`。

#### 4.4 修改 `src/ui/components/ResearchPanel.tsx`

**改动 1**：扩展 `ResearchTab` 类型 + `RESEARCH_TABS`（L25-32 替换）：
```typescript
type ResearchTab = 'experiment' | 'tech' | 'idea' | 'openSource' | 'risk';

const RESEARCH_TABS: { key: ResearchTab; label: string; icon: string }[] = [
  { key: 'experiment', label: '实验', icon: '🔬' },
  { key: 'tech', label: '技术树', icon: '🌳' },
  { key: 'idea', label: '创意', icon: '💡' },
  { key: 'openSource', label: '开源', icon: '🌐' },
  { key: 'risk', label: '风险', icon: '⚠️' },
];
```

**改动 2**：追加 import（L12 附近）：
```typescript
import { AdoptOpenSourceCommand } from '../../core/commands/OpenSourceCommands';
```

**改动 3**：在 tab 容器区（idea 和 risk 之间，L61 之后）插入：
```typescript
<div style={{ display: tab === 'openSource' ? 'block' : 'none' }}>
  <OpenSourceTab />
</div>
```

**改动 4**：在文件末尾 IdeaTab 之后追加 `OpenSourceTab` 组件，完整代码见 [原计划 L590-637](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L590-L637)。展示 `openSourceOffers` 中 `adoptedDay === undefined && date <= expiresDay` 的活跃要约，提供采纳按钮（资金不足时禁用）。

**PR4 验证**：`npx tsc --noEmit` 零错误。

---

### PR5 — 小公司市场（新建 3 + 修改 2）

#### 5.1 新建 `src/core/config/smallCompanyTech.ts`

7 个小公司独有技术（`source: 'small_company'`），完整代码见 [原计划 L654-720](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L654-L720)。

技术清单：`sc_kv_cache_opt` / `sc_dynamic_batching` / `sc_grad_accum` / `sc_moe_routing` / `sc_long_context` / `sc_data_dedup` / `sc_alignment_fine`。

#### 5.2 新建 `src/core/systems/SmallCompanyMarketSystem.ts`

`SmallCompanyMarketSystem` 类，完整代码见 [原计划 L727-848](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L727-L848)。

关键逻辑：
- 每 14 天刷新 2~3 家小公司（`SPAWN_MIN=2, SPAWN_MAX=3, REFRESH_DAYS=14, LIFESPAN=30`）。
- 每家 1~3 个技术，50% 来自 `SMALL_COMPANY_TECH_POOL`（过滤已注册）/ 50% 来自 `ALL_TECH`（过滤已解锁）。
- 估值 = `$200k + techCount × ($100k~$500k)`。
- 自动清理 `current.date - spawnedDay > lifespan` 且未收购的。
- 15 个公司名 / 6 个背景描述随机组合。
- emit `SMALL_COMPANY_REFRESHED`。

#### 5.3 新建 `src/core/commands/SmallCompanyCommands.ts`

`AcquireSmallCompanyCommand` 类，完整代码见 [原计划 L855-908](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L855-L908)。

逻辑：
1. 校验公司存在 / 未收购 / 未过期 / 资金充足。
2. 扣 `funds` × `valuation`，标记 `acquired = true`。
3. 遍历 `company.technologies`，独有技术注册到 `IDEA_TECH_MAP` + `acceptedIdeaTechs`。
4. 每个技术 `techMaturity = max(现有, 60)`（含专利/团队，比开源 30 高）。
5. emit `SMALL_COMPANY_ACQUIRED`。

#### 5.4 修改 `src/main.tsx`

**追加 import**（L19 附近）：
```typescript
import { SmallCompanyMarketSystem } from './core/systems/SmallCompanyMarketSystem';
```

**在 systems 数组 L138 `CompetitorSystem` 之后插入**：
```typescript
  new CompetitorSystem(),
  new SmallCompanyMarketSystem(),   // ← 新增
  new RiskSystem(),
```

#### 5.5 修改 `src/ui/components/ResearchPanel.tsx`

**改动 1**：扩展 `ResearchTab` 类型 + `RESEARCH_TABS`（替换 PR4 的版本）：
```typescript
type ResearchTab = 'experiment' | 'tech' | 'idea' | 'openSource' | 'market' | 'risk';

const RESEARCH_TABS: { key: ResearchTab; label: string; icon: string }[] = [
  { key: 'experiment', label: '实验', icon: '🔬' },
  { key: 'tech', label: '技术树', icon: '🌳' },
  { key: 'idea', label: '创意', icon: '💡' },
  { key: 'openSource', label: '开源', icon: '🌐' },
  { key: 'market', label: '市场', icon: '🏢' },
  { key: 'risk', label: '风险', icon: '⚠️' },
];
```

**改动 2**：追加 import（`ALL_TECH, TECH_MAP` 已在 L19 导入，追加 `IDEA_TECH_MAP`）：
```typescript
import { AdoptOpenSourceCommand } from '../../core/commands/OpenSourceCommands';  // PR4 已加
import { AcquireSmallCompanyCommand } from '../../core/commands/SmallCompanyCommands';
import { ALL_TECH, TECH_MAP, IDEA_TECH_MAP } from '../../core/config/techTree';  // 修改 L19
```

**改动 3**：tab 容器区追加（openSource 和 risk 之间）：
```typescript
<div style={{ display: tab === 'market' ? 'block' : 'none' }}>
  <MarketTab />
</div>
```

**改动 4**：追加 `MarketTab` 组件，完整代码见 [原计划 L956-1011](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md#L956-L1011)。展示 `smallCompanies` 中未收购且未过期的，技术名通过 `TECH_MAP[tid]?.name ?? IDEA_TECH_MAP[tid]?.name ?? tid` 查找（同时查主技术树和独有技术表）。

**PR5 验证 + 最终验证**：`npx tsc --noEmit` 零错误。

---

## Assumptions & Decisions

1. **沿用已批准设计**：所有数值、公式、技术池内容、命令逻辑均与 [research-system-completion-plan.md](file:///c:/Users/28705/Documents/trae_projects/project4/.trae/documents/research-system-completion-plan.md) 一致，不重新设计。本计划仅修正"当前状态描述"与"PR3 修复方式"（从"补全截断"改为"修正 import 路径"）。
2. **PR3 仅需 1 处改动**：前次会话已落盘的 5 个 PR3 文件全部正确，唯一阻塞是 `IdeaGenerationSystem.ts` L23 的 `IDEA_TECH_POOL` import 路径错误。
3. **CompetitorSystem 开源触发位置不变**：放在 L258 `updateCompetitorStates(survivors)` 之后，遍历 `survivors`，确保破产公司同 tick 不开源。
4. **开源 cooldown 随机化**：每次 update 重新 `30 + floor(random*31)`，无需为每家公司持久化下次开源日。
5. **ResearchPanel tab 渐进扩展**：PR3（4 tab）→ PR4（5 tab）→ PR5（6 tab），每个 PR 重新定义完整 `ResearchTab` 类型与 `RESEARCH_TABS` 数组。
6. **独有技术统一持久化**：3 种来源（idea/openSource/smallCompany）都通过 `IDEA_TECH_MAP` 运行时注册 + `acceptedIdeaTechs` 持久化 + Game.ts migrateOldData 重建（PR1 已实现）。
7. **重复技术取 max**：开源/收购时若技术已存在，`maturity = max(现有, initialMaturity)`，避免降级。
8. **main.tsx systems 顺序**：`IdeaGenerationSystem` 在 `TechResearchSystem` 之前（已就位）；`SmallCompanyMarketSystem` 在 `CompetitorSystem` 之后、`RiskSystem` 之前（PR5 新增）。
9. **不修改 TechTab 的 StartResearchCommand 调用**：当前 `new StartResearchCommand(tech.id)` 未传 researcherIds（PR2 已支持可选参数，默认空数组）。轻量技术可不带研究员研发；中重型需研究员的场景由玩家通过未来 UI 增强（不在本次范围）。
10. **Write 工具截断预防**：新建 `SmallCompanyMarketSystem.ts`（~120 行）等较长文件时，创建后立即 Read 验证末尾闭合，若截断则用 Edit 补全（前次会话已遇到此问题）。

---

## Verification Steps

### 1. PR3 验证（修正 import 后）
```powershell
npx tsc --noEmit
```
**预期**：零错误（2 个 IdeaGenerationSystem 错误同时消失）。

### 2. PR4 验证
- `npx tsc --noEmit` 零错误。
- 场景：游戏进行 30~60 天后，survivors 中 menta/shallowfind/mistral 之一触发，`openSourceOffers` 增长，`lastOpenSourceDay[comp.id]` 更新。
- 场景：`AdoptOpenSourceCommand` → funds 扣 $50k~$200k，`techMaturity[id]=max(现有,30)`，独有技术注册到 `IDEA_TECH_MAP` + `acceptedIdeaTechs`。
- 场景：offer 14 天后 → 采纳被拒绝（`current.date > offer.expiresDay`）。

### 3. PR5 验证 + 最终验证
- `npx tsc --noEmit` 零错误。
- 场景：14 天后 `smallCompanies` 增加 2~3 家，每家 1~3 个技术，估值 $200k + techCount × ($100k~$500k)。
- 场景：`AcquireSmallCompanyCommand` → funds 扣估值，所有技术 `maturity=max(现有,60)`，独有技术注册。
- 场景：30 天后未收购的小公司被自动清理。

### 4. 用户原始需求逐条核对
- ✅ **技术路线需要员工 idea**（PR3 IdeaGenerationSystem + unique 技术，每 7 天判定，概率公式 `P = clamp(0.05 + (int-50)×0.003 + (cre-50)×0.004 + level×0.01, 0, 0.6) × eff`）。
- ✅ **或其他开源公司开源**（PR4 CompetitorSystem 开源触发，open_source 策略公司每 30~60 天开源一次，14 天采纳窗口，成本 $50k~$200k，初始 maturity=30）。
- ✅ **科研需要研究员**（PR2 StartResearchCommand 研究员校验+锁定 + TechResearchSystem `researcherBoost = log2(1 + sumIntelligence / 100)` 加速）。
- ✅ **市场中会刷出很多小公司，小公司拥有一些技术，购买即可获得**（PR5 SmallCompanyMarketSystem 每 14 天刷新 2~3 家，每家 1~3 技术，估值 $200k+techCount×$100k~$500k，收购 maturity=60）。
- ✅ **技术有成熟度，同一个技术越成熟效果越好**（`techMaturity: Record<string, number>` 0-100，`scaleTechEffect(effect, maturity)` 按 `maturity/100` 缩放数值型 effect，`extend_context` 特殊处理为 `1 + (multiplier - 1) × scale`；训练中技术每日被动 +0.05 maturity；idea 可加速）。
- ✅ **给出具体数值和公式**（见上方各 PR + 设计文档）。

### 5. 边界场景
- 无研究员时尝试研发中重型技术（researchDays≥5）→ StartResearchCommand 拒绝。
- pendingIdeas 满 50 条 → 自动截断（仅保留 pending 状态最近 50 条）。
- 小公司过期 → 自动清理。
- 开源 offer 过期 → 不可采纳。
- 3 个独有技术池耗尽 → 对应来源跳过（不产出）。

---

## 实施顺序

1. **PR3**（1 步）：Edit `IdeaGenerationSystem.ts` L23 import → `npx tsc --noEmit` 验证。
2. **PR4**（4 步）：
   - Write `openSourcePool.ts`
   - Write `OpenSourceCommands.ts`
   - Edit `CompetitorSystem.ts`（imports + L258 后插入开源触发）
   - Edit `ResearchPanel.tsx`（4 处改动）
   - `npx tsc --noEmit` 验证
3. **PR5**（5 步）：
   - Write `smallCompanyTech.ts`
   - Write `SmallCompanyMarketSystem.ts`（创建后 Read 验证末尾闭合）
   - Write `SmallCompanyCommands.ts`
   - Edit `main.tsx`（import + systems 数组）
   - Edit `ResearchPanel.tsx`（4 处改动）
   - `npx tsc --noEmit` 最终验证

总计：1 修复 + 5 新建 + 3 修改 = 9 个文件操作 + 3 次 tsc