# 研发系统扩展 — 完成实施计划（PR3 收尾 + PR4 + PR5）

## Summary

本计划承接已批准的两份文档：
- 设计规范：[research-system-expansion-design.md](./research-system-expansion-design.md)
- 原实施计划：[research-system-pr2-pr5-implementation.md](./research-system-pr2-pr5-implementation.md)

**当前真实状态**（已通过文件系统 + `npx tsc --noEmit` 核实）：
- ✅ **PR1（数据结构迁移）100% 完成**：GameState / techEffectScale / techLookup / TechIdea / SmallCompany / OpenSourceOffer / techTree(IDEA_TECH_MAP) / crossSystemUtils / Game.ts migrateOldData 全部就位且编译通过。
- ✅ **PR2（研究员接入研发）100% 完成**：TechCommands.ts（StartResearchCommand 锁定 + CancelResearchCommand 释放 + PolishTechCommand）、TrainingSystem.ts（effect 按 maturity 缩放 + 被动 +0.05/天）、TechResearchSystem.ts（log2 加速公式 + 完成释放）全部就位且编译通过。
- ⚠️ **PR3（idea 系统）部分完成但 2 个文件被截断，导致 tsc 报 2 个错误**：
  - `ideaTechPool.ts` 存在但第 119 行 `effect: { type: 'capability_bonus` 处截断（TS1002 Unterminated string literal）。
  - `IdeaGenerationSystem.ts` 存在但第 164 行 `status:` 处截断（TS1109 Expression expected），缺少对象闭合 + 方法闭合 + 类闭合。
  - `IdeaCommands.ts` **不存在**。
  - `main.tsx` systems 数组（13 个系统）**未注册** IdeaGenerationSystem。
  - `ResearchPanel.tsx` 仅有 3 个 tab（experiment/tech/risk），**无 idea tab**。
- ❌ **PR4（开源机制）0%**：openSourcePool.ts / OpenSourceCommands.ts 不存在；CompetitorSystem.ts 未接入开源触发；ResearchPanel 无 openSource tab。
- ❌ **PR5（小公司市场）0%**：smallCompanyTech.ts / SmallCompanyMarketSystem.ts / SmallCompanyCommands.ts 不存在；main.tsx 未注册；ResearchPanel 无 market tab。

**当前 tsc 错误**（仅 2 个，均由截断引起）：
```
src/core/config/ideaTechPool.ts(119,38): error TS1002: Unterminated string literal.
src/core/systems/IdeaGenerationSystem.ts(164,14): error TS1109: Expression expected.
```

**目标**：修复 2 个截断文件 + 完成剩余 PR3/PR4/PR5 全部工作，最终 `npx tsc --noEmit` 零错误，并满足用户原始需求（技术路线通过员工 idea / 开源公司开源 / 小公司收购 3 渠道流入；技术有成熟度且越成熟效果越好；科研需要研究员）。

**工作量**：修复 2 文件 + 新建 5 文件 + 修改 3 文件（main.tsx / ResearchPanel.tsx / CompetitorSystem.ts），分 3 个 PR 提交，每个 PR 独立通过 tsc。

---

## Current State Analysis

### PR1 已完成文件（无需改动，编译通过）

| 文件 | 说明 |
|---|---|
| [GameState.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/GameState.ts) | techMaturity / pendingIdeas / smallCompanies / openSourceOffers / acceptedIdeaTechs / lastSmallCompanyRefreshDay / lastOpenSourceDay 全部就位 |
| [techEffectScale.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/techEffectScale.ts) | scaleTechEffect 完整（含 extend_context 特殊处理 `1 + (multiplier - 1) * scale`） |
| [techLookup.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/techLookup.ts) | getTechNode / isTechUnlocked / getTechMaturity / getUnlockedTechIds |
| [TechIdea.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/TechIdea.ts) | `IdeaKind = 'accelerate' \| 'unique'`；TechIdea 接口含 id/sourceEmployeeId/generatedDay/kind/targetTechId/value/title/description/status |
| [SmallCompany.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/SmallCompany.ts) | id/name/technologies/valuation/spawnedDay/lifespan/acquired/background |
| [OpenSourceOffer.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/OpenSourceOffer.ts) | id/techId/techName/techDescription/source/publishedDay/adoptionCost/initialMaturity/expiresDay/adoptedDay? |
| [techTree.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/techTree.ts) | TechNode + IdeaTechNode 接口；`IDEA_TECH_MAP: Record<string, IdeaTechNode> = {}` 空容器；`ALL_TECH` 导出 |
| [crossSystemUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/crossSystemUtils.ts) | getActiveTechEffects 派生函数 + WeakMap 缓存 |
| [Game.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/Game.ts) | migrateOldData 旧存档迁移 + 加载时重建 IDEA_TECH_MAP |
| [main.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/main.tsx) | initialData 含所有新字段（pendingIdeas / smallCompanies / openSourceOffers / acceptedIdeaTechs / lastSmallCompanyRefreshDay / lastOpenSourceDay） |

### PR2 已完成文件（无需改动，编译通过）

| 文件 | 关键实现 |
|---|---|
| [TechCommands.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/commands/TechCommands.ts) | StartResearchCommand 研究员校验+锁定（lockProjectId=`tech-research-${techId}`）；CancelResearchCommand 释放研究员；PolishTechCommand（dailyGain=0.30×(1+sumInt/200)，cost=$5000×人×天，疲劳=天×3） |
| [TrainingSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/TrainingSystem.ts) | techEffects 用 `scaleTechEffect(node.effect, mat)` 按 maturity 缩放；被动 `techMaturity +0.05×deltaDays` |
| [TechResearchSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/TechResearchSystem.ts) | researcherBoost=`log2(1+sumInt/100)`；资金不足暂停；完成时 maturity=max(现有,50) + 释放研究员 |

### PR3 部分完成（需修复 + 补齐）

| 文件 | 状态 | 问题 |
|---|---|---|
| [ideaTechPool.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/ideaTechPool.ts) | ⚠️ 截断 | 第 119 行 `effect: { type: 'capability_bonus` 处断开，缺少 `', capability: 'coding_agent', bonus: 0.06 }` + `isArchitecture: false, source: 'idea',` + `},` + `];` |
| [IdeaGenerationSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/IdeaGenerationSystem.ts) | ⚠️ 截断 | 第 164 行 `status:` 处断开，缺少 `'pending',` + 对象闭合 `};` + 方法闭合 + 类闭合 `}` |
| IdeaCommands.ts | ❌ 不存在 | 需新建 AcceptIdeaCommand / RejectIdeaCommand |
| main.tsx | ⚠️ 未注册 | systems 数组（L126-140）无 IdeaGenerationSystem |
| ResearchPanel.tsx | ⚠️ 无 idea tab | ResearchTab 类型（L24）+ RESEARCH_TABS（L26-30）仅 3 项 |

### PR4 / PR5 完全未开始

- PR4：openSourcePool.ts / OpenSourceCommands.ts / CompetitorSystem.ts 开源触发 / ResearchPanel openSource tab
- PR5：smallCompanyTech.ts / SmallCompanyMarketSystem.ts / SmallCompanyCommands.ts / main.tsx 注册 / ResearchPanel market tab

### 关键既有结构（修改时需匹配）

**CompetitorSystem.ts**（[L52-410](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/CompetitorSystem.ts)）：
- `update(state, events, _deltaDays)`，每 `COMPETITOR_TICK_DAYS=7` 天执行一次（与 idea 同周期）。
- 工作流：初始化 → `for (const comp of competitors) this.simulateCompetitor(comp, current.date, events)`（L135-137）→ 玩家模型追赶 → 兼并浪潮 → 合并 → intel 裁剪 → 破产过滤得到 `survivors`（L201-208）→ 最终 `state.update` 写回 survivors（L246-255）→ `updateCompetitorStates(survivors)`（L258）。
- `simulateCompetitor(comp, day, events)` 是 private 方法，操作深拷贝的工作集，不直接访问 state。
- 3 家 `open_source` 策略公司：menta / shallowfind / mistral（[Competitor.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/Competitor.ts) L185-337）。

**ResearchPanel.tsx**：
- `type ResearchTab = 'experiment' | 'tech' | 'risk'`（L24）。
- `RESEARCH_TABS` 数组（L26-30），tab 切换通过 `display: none/block`（L51-59）。
- 3 个子组件：ExperimentTab / TechTab / RiskTab，使用 `useGame()` + `useGameState()` + `styles` from `App.module.css`。
- TechTab 已展示 maturity（L288 `techMaturity[tech.id] ?? 0`）和 StartResearchCommand 调用（L314，当前仅传 techId，未传 researcherIds —— 这是 PR2 之前的调用形式，但 StartResearchCommand 已支持 researcherIds 可选参数，编译通过）。

---

## Proposed Changes

### PR3 — idea 系统（修复 2 + 新建 1 + 修改 2）

#### 3.1 修复 `src/core/config/ideaTechPool.ts`（截断补全）

定位第 119 行截断处：
```typescript
    effect: { type: 'capability_bonus
```
替换为完整的最后一个技术条目 + 数组闭合：
```typescript
    effect: { type: 'capability_bonus', capability: 'coding_agent', bonus: 0.06 },
    isArchitecture: false,
    source: 'idea',
  },
];
```

完成后该文件含 10 个独有技术：mixture_of_depths / sparse_attention_v2 / dynamic_routing / kv_cache_compression / token_pruning / contrastive_decoding / self_consistency / retrieval_augmented / long_rope / moe_routing_v2。所有 `source: 'idea'`，researchDays=0，researchCost=0。

#### 3.2 修复 `src/core/systems/IdeaGenerationSystem.ts`（截断补全）

定位第 164 行截断处：
```typescript
      description: `成熟度 +${gain.toFixed(1)}（当前 ${currentMaturity.toFixed(0)} → ${Math.min(100, currentMaturity + gain).toFixed(0)}）`,
      status:
```
替换为完整的对象闭合 + 方法闭合 + 类闭合：
```typescript
      description: `成熟度 +${gain.toFixed(1)}（当前 ${currentMaturity.toFixed(0)} → ${Math.min(100, currentMaturity + gain).toFixed(0)}）`,
      status: 'pending',
    };
  }
}
```

完成后该文件完整实现：
- 每 7 天判定（`current.date % 7 === 0`），遍历非 training 的 RESEARCHER。
- 概率 `P = clamp(0.05 + (int-50)×0.003 + (cre-50)×0.004 + level×0.01, 0, 0.6) × eff`。
- 20% unique（从 IDEA_TECH_POOL 过滤已注册的，value=30）/ 80% accelerate（候选=研发中技术[value=0.20] + 已解锁未满级技术[value=5+cre/100×5]）。
- pendingIdeas 截断到最近 50 条（仅 pending）。
- imports 已正确：GameState/GameData, EventBus, System, TechIdea, Employee, StaffRole, IDEA_TECH_POOL/IDEA_TECH_MAP/TECH_MAP, calcEmployeeEfficiency, getUnlockedTechIds。

#### 3.3 新建 `src/core/commands/IdeaCommands.ts`

完整代码（来自原计划 L522-599）：

```typescript
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP } from '../config/techTree';
import { IDEA_TECH_POOL } from '../config/ideaTechPool';

/** 接受员工 idea */
export class AcceptIdeaCommand implements Command {
  constructor(private readonly ideaId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const idea = current.pendingIdeas.find((i) => i.id === this.ideaId);
    if (!idea) {
      events.emit('IDEA_REJECTED', { reason: 'idea 不存在' });
      return;
    }
    if (idea.status !== 'pending') {
      events.emit('IDEA_REJECTED', { reason: 'idea 已处理' });
      return;
    }

    state.update((draft) => {
      const target = draft.pendingIdeas.find((i) => i.id === this.ideaId);
      if (!target) return;
      target.status = 'accepted';

      if (idea.kind === 'accelerate') {
        if (idea.targetTechId === draft.researchingTech?.techId) {
          // 研发中技术：进度 +20% totalDays
          draft.researchingTech.progressDays += draft.researchingTech.totalDays * idea.value;
        } else {
          // 已解锁技术：maturity += value
          const existing = draft.techMaturity[idea.targetTechId] ?? 0;
          draft.techMaturity[idea.targetTechId] = Math.min(100, existing + idea.value);
        }
      } else {
        // unique：注册独有技术到 IDEA_TECH_MAP + 持久化
        const poolNode = IDEA_TECH_POOL.find((t) => t.id === idea.targetTechId);
        if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
          IDEA_TECH_MAP[poolNode.id] = poolNode;
          draft.acceptedIdeaTechs.push(poolNode);
        }
        // 应用初始 maturity（取较大值，避免重复接受降级）
        const existing = draft.techMaturity[idea.targetTechId] ?? 0;
        draft.techMaturity[idea.targetTechId] = Math.max(existing, idea.value);
      }
    });

    events.emit('IDEA_ACCEPTED', idea);
  }
}

/** 拒绝员工 idea（产生者忠诚度 +2，被倾听） */
export class RejectIdeaCommand implements Command {
  constructor(private readonly ideaId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const idea = current.pendingIdeas.find((i) => i.id === this.ideaId);
    if (!idea || idea.status !== 'pending') {
      events.emit('IDEA_REJECTED', { reason: 'idea 不存在或已处理' });
      return;
    }

    state.update((draft) => {
      const target = draft.pendingIdeas.find((i) => i.id === this.ideaId);
      if (target) target.status = 'rejected';
      // 产生者忠诚度 +2
      const emp = draft.employees.find((e) => e.id === idea.sourceEmployeeId);
      if (emp) emp.loyalty = Math.min(100, emp.loyalty + 2);
    });

    events.emit('IDEA_REJECTED_OK', idea);
  }
}
```

#### 3.4 修改 `src/main.tsx`

在 imports 区（L6-18 附近）追加：
```typescript
import { IdeaGenerationSystem } from './core/systems/IdeaGenerationSystem';
```

在 systems 数组（L126-140）中，`TechResearchSystem` 之前插入 IdeaGenerationSystem（确保 idea 加速能在同日 TechResearch 执行前生效）：
```typescript
const systems = [
  new ComputeHardwareSystem(registry),
  new PowerSystem(registry),
  new IdeaGenerationSystem(),   // ← 新增：在 TechResearch 之前
  new TechResearchSystem(),
  new ResearchSystem(),
  new CollectionSystem(),
  new InfrastructureFailureSystem(),
  new TrainingSystem(),
  new InfraMaintenanceSystem(),
  new OperationsSystem(),
  new CompetitorSystem(),
  new RiskSystem(),
  new RegionSystem(),
  new StaffSystem(),
];
```

#### 3.5 修改 `src/ui/components/ResearchPanel.tsx`

**改动 1**：扩展 ResearchTab 类型 + RESEARCH_TABS（L24-30）：
```typescript
type ResearchTab = 'experiment' | 'tech' | 'idea' | 'risk';

const RESEARCH_TABS: { key: ResearchTab; label: string; icon: string }[] = [
  { key: 'experiment', label: '实验', icon: '🔬' },
  { key: 'tech', label: '技术树', icon: '🌳' },
  { key: 'idea', label: '创意', icon: '💡' },
  { key: 'risk', label: '风险', icon: '⚠️' },
];
```

**改动 2**：在 tab 内容区（L51-59 之间）插入 idea tab 容器：
```typescript
<div style={{ display: tab === 'idea' ? 'block' : 'none' }}>
  <IdeaTab />
</div>
```

**改动 3**：追加 imports（顶部）：
```typescript
import { AcceptIdeaCommand, RejectIdeaCommand } from '../../core/commands/IdeaCommands';
```

**改动 4**：新增 `IdeaTab` 组件（追加到文件末尾 RiskTab 之后）：
```typescript
/* ============== 员工创意 ============== */

function IdeaTab() {
  const game = useGame();
  const pendingIdeas = useGameState((s) => s.pendingIdeas);
  const employees = useGameState((s) => s.employees);
  const techMaturity = useGameState((s) => s.techMaturity);
  const researchingTech = useGameState((s) => s.researchingTech);

  const pending = pendingIdeas.filter((i) => i.status === 'pending');
  const empMap = new Map(employees.map((e) => [e.id, e]));

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>员工创意 ({pending.length})</span>
      </div>
      <div className={styles.devHint} style={{ paddingLeft: '4px', marginBottom: '6px' }}>
        研究员每 7 天可能产出创意；接受可加速研发/提升成熟度或解锁独有技术。
      </div>
      {pending.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无待处理创意</div>
      ) : (
        pending.map((idea) => {
          const emp = empMap.get(idea.sourceEmployeeId);
          const isResearchingTarget =
            idea.kind === 'accelerate' && idea.targetTechId === researchingTech?.techId;
          const mat = techMaturity[idea.targetTechId] ?? 0;
          return (
            <div key={idea.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
              <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                · {idea.title}
                {idea.kind === 'unique' ? ' [独有]' : isResearchingTarget ? ' [研发加速]' : ''}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                {idea.description}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                来源：{emp?.name ?? '未知员工'} · 第{idea.generatedDay}天
                {idea.kind === 'accelerate' && !isResearchingTarget && mat >= 1
                  ? ` · 当前成熟度 ${mat.toFixed(0)}`
                  : ''}
              </span>
              <button
                className={styles.btn}
                onClick={() => game.executeCommand(new AcceptIdeaCommand(idea.id))}
              >
                接受
              </button>
              <button
                className={styles.btn}
                onClick={() => game.executeCommand(new RejectIdeaCommand(idea.id))}
              >
                拒绝
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
```

**PR3 验证**：
- `npx tsc --noEmit` 零错误（修复 2 个截断 + 新建 IdeaCommands + 修改 main.tsx + ResearchPanel）。
- 数值：L5 研究员（int 75, cre 70, eff 1.18）每周 P = (0.05 + 0.075 + 0.08 + 0.05) × 1.18 = 0.301。
- 接受 accelerate idea（研发中 rlhf）→ `researchingTech.progressDays += totalDays × 0.20`。
- 接受 unique idea → `IDEA_TECH_MAP['mixture_of_depths']` 注册，`techMaturity['mixture_of_depths']=30`，`acceptedIdeaTechs.length +1`。

---

### PR4 — 开源机制（新建 2 + 修改 2）

#### 4.1 新建 `src/core/config/openSourcePool.ts`

完整代码（来自原计划 L646-714），7 个开源独有技术（source='open_source'）：

```typescript
import type { IdeaTechNode } from './techTree';

/**
 * 开源技术候选池
 *
 * 由 open_source 策略竞争对手（Menta / Mistral / ShallowFind）触发开源事件。
 * 采纳后初始 maturity=30，需本地化适配。
 * 60% 概率从此池随机选；40% 概率从主技术树未解锁技术中选。
 */
export const OPEN_SOURCE_TECH_POOL: IdeaTechNode[] = [
  {
    id: 'open_gqa',
    name: '开源 GQA',
    description: '分组查询注意力，算力 -5%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.05 },
    isArchitecture: false, source: 'open_source',
  },
  {
    id: 'open_quant_v2',
    name: '开源量化方案 v2',
    description: '社区优化的 INT8 量化，算力 -10%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.10 },
    isArchitecture: false, source: 'open_source',
  },
  {
    id: 'open_flash_attn_v3',
    name: '开源 FlashAttention v3',
    description: '社区改进版，显存 -12%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_memory', value: 0.12 },
    isArchitecture: false, source: 'open_source',
  },
  {
    id: 'open_long_rope',
    name: '开源长程 RoPE',
    description: '社区外推方案，上下文 ×5',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'extend_context', multiplier: 5 },
    isArchitecture: true, source: 'open_source',
  },
  {
    id: 'open_dpo_v2',
    name: '开源 DPO v2',
    description: '改进的偏好优化，利用率 +3%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_utilization', value: 0.03 },
    isArchitecture: false, source: 'open_source',
  },
  {
    id: 'open_data_cleaning',
    name: '开源数据清洗',
    description: '社区清洗工具链，数据质量 +8%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_data_quality', value: 0.08 },
    isArchitecture: false, source: 'open_source',
  },
  {
    id: 'open_swiglu_v2',
    name: '开源 SwiGLU v2',
    description: '改进的激活函数，A -40',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'modify_base_score_A', value: -40 },
    isArchitecture: true, source: 'open_source',
  },
];
```

#### 4.2 新建 `src/core/commands/OpenSourceCommands.ts`

完整代码（来自原计划 L719-769）：

```typescript
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP } from '../config/techTree';
import { OPEN_SOURCE_TECH_POOL } from '../config/openSourcePool';

/** 采纳开源技术 */
export class AdoptOpenSourceCommand implements Command {
  constructor(private readonly offerId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const offer = current.openSourceOffers.find((o) => o.id === this.offerId);
    if (!offer) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '要约不存在' });
      return;
    }
    if (offer.adoptedDay !== undefined) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '已采纳' });
      return;
    }
    if (current.date > offer.expiresDay) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '已过期' });
      return;
    }
    const funds = current.resources['funds'] ?? 0;
    if (funds < offer.adoptionCost) {
      events.emit('OPEN_SOURCE_REJECTED', { reason: '资金不足' });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - offer.adoptionCost;
      const target = draft.openSourceOffers.find((o) => o.id === this.offerId);
      if (target) target.adoptedDay = draft.date;

      // 注册独有技术（如果是池中的）
      const poolNode = OPEN_SOURCE_TECH_POOL.find((t) => t.id === offer.techId);
      if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
        IDEA_TECH_MAP[poolNode.id] = poolNode;
        draft.acceptedIdeaTechs.push(poolNode);
      }
      // 应用初始 maturity（取较大值，避免降级）
      const existing = draft.techMaturity[offer.techId] ?? 0;
      draft.techMaturity[offer.techId] = Math.max(existing, offer.initialMaturity);
    });

    events.emit('OPEN_SOURCE_ADOPTED', offer);
  }
}
```

#### 4.3 修改 `src/core/systems/CompetitorSystem.ts`

**插入点**：在 `update` 方法末尾，`updateCompetitorStates(survivors);`（L258）之后、方法闭合 `}`（L259）之前。选择此位置的原因：开源事件应仅由存活的开源策略公司触发（破产公司同 tick 不应开源），且 `survivors` 已在此处确定。

**追加 imports**（文件顶部，L1-6 附近）：
```typescript
import type { OpenSourceOffer } from '../entities/OpenSourceOffer';
import { OPEN_SOURCE_TECH_POOL } from '../config/openSourcePool';
import { IDEA_TECH_MAP, ALL_TECH, type TechEffect } from '../config/techTree';
```

**追加逻辑**（在 L258 `updateCompetitorStates(survivors);` 之后）：
```typescript
    // ---- 开源事件触发（仅 open_source 策略的存活公司）----
    // 每 30~60 天开源一次；60% 独有技术池 / 40% 主技术树未解锁技术。
    // 采纳窗口 14 天，初始 maturity=30，成本 $50k~$200k。
    const openSourceEvents: Array<{ compName: string; offer: OpenSourceOffer }> = [];
    for (const comp of survivors) {
      if (comp.strategy !== 'open_source') continue;
      const lastDay = current.lastOpenSourceDay[comp.id] ?? -999;
      const cooldown = 30 + Math.floor(Math.random() * 31); // 30~60 天
      if (current.date - lastDay < cooldown) continue;

      // 选技术：60% 独有池 / 40% 主技术树未解锁
      const usePool = Math.random() < 0.6;
      let techId = '';
      let techName = '';
      let techDesc = '';

      if (usePool) {
        const available = OPEN_SOURCE_TECH_POOL.filter((t) => !IDEA_TECH_MAP[t.id]);
        if (available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)];
          techId = picked.id;
          techName = picked.name;
          techDesc = picked.description;
        }
      }
      if (!techId) {
        const available = ALL_TECH.filter(
          (t) => (current.techMaturity[t.id] ?? 0) < 1 && t.researchDays > 0,
        );
        if (available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)];
          techId = picked.id;
          techName = picked.name;
          techDesc = picked.description;
        }
      }
      if (!techId) continue;

      const adoptionCost = Math.round(50_000 + Math.random() * 150_000); // $50k~$200k
      const offer: OpenSourceOffer = {
        id: genId(`offer-${comp.id}-${current.date}`),
        techId,
        techName,
        techDescription: techDesc,
        source: comp.name,
        publishedDay: current.date,
        adoptionCost,
        initialMaturity: 30,
        expiresDay: current.date + 14,
      };
      openSourceEvents.push({ compName: comp.name, offer });
    }

    if (openSourceEvents.length > 0) {
      state.update((draft) => {
        for (const { offer } of openSourceEvents) {
          draft.openSourceOffers.push(offer);
        }
        for (const { compName } of openSourceEvents) {
          // 反查 comp.id 写入 lastOpenSourceDay
          const comp = survivors.find((c) => c.name === compName);
          if (comp) draft.lastOpenSourceDay[comp.id] = draft.date;
        }
      });
      for (const { compName, offer } of openSourceEvents) {
        events.emit('OPEN_SOURCE_PUBLISHED', { compName, offer });
      }
    }
```

**注意**：`genId` 函数已在 CompetitorSystem.ts L9-11 定义，可直接复用。`current` 变量在 update 作用域内可用（L59 定义）。`survivors` 在 L201 定义。`TechEffect` 类型导入用于类型标注（若 ALL_TECH 元素 effect 类型推断无误可省略，但导入保险）。

#### 4.4 修改 `src/ui/components/ResearchPanel.tsx`

**改动 1**：扩展 ResearchTab + RESEARCH_TABS：
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

**改动 2**：追加 import + tab 容器 + OpenSourceTab 组件：
```typescript
import { AdoptOpenSourceCommand } from '../../core/commands/OpenSourceCommands';
```
tab 容器区追加：
```typescript
<div style={{ display: tab === 'openSource' ? 'block' : 'none' }}>
  <OpenSourceTab />
</div>
```
新增组件：
```typescript
/* ============== 开源采纳 ============== */

function OpenSourceTab() {
  const game = useGame();
  const openSourceOffers = useGameState((s) => s.openSourceOffers);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const currentDate = useGameState((s) => s.date);

  const active = openSourceOffers.filter((o) => o.adoptedDay === undefined && currentDate <= o.expiresDay);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>开源要约 ({active.length})</span>
      </div>
      <div className={styles.devHint} style={{ paddingLeft: '4px', marginBottom: '6px' }}>
        开源策略公司（Menta/ShallowFind/Mistral）每 30~60 天发布一项技术；14 天内可付费采纳，初始成熟度 30。
      </div>
      {active.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无可采纳的开源要约</div>
      ) : (
        active.map((offer) => {
          const remaining = offer.expiresDay - currentDate;
          const affordable = funds >= offer.adoptionCost;
          return (
            <div key={offer.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
              <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                · {offer.techName}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                {offer.techDescription}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                来源：{offer.source} · 成本 ${offer.adoptionCost.toLocaleString()} · 初始成熟度 {offer.initialMaturity} · 剩余 {remaining} 天
              </span>
              <button
                className={styles.btn}
                style={{ opacity: affordable ? 1 : 0.5 }}
                disabled={!affordable}
                onClick={() => game.executeCommand(new AdoptOpenSourceCommand(offer.id))}
              >
                采纳
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
```

**PR4 验证**：
- `npx tsc --noEmit` 零错误。
- 场景：游戏进行 30~60 天后，survivors 中 menta/shallowfind/mistral 之一触发，`openSourceOffers` 增长，`lastOpenSourceDay[comp.id]` 更新。
- 场景：`AdoptOpenSourceCommand` → funds 扣 $50k~$200k，`techMaturity[id]=max(现有,30)`，独有技术注册到 IDEA_TECH_MAP + acceptedIdeaTechs。
- 场景：offer 14 天后 → 采纳被拒绝（`current.date > offer.expiresDay`）。

---

### PR5 — 小公司市场（新建 3 + 修改 2）

#### 5.1 新建 `src/core/config/smallCompanyTech.ts`

完整代码（来自原计划 L876-941），7 个小公司独有技术（source='small_company'）：

```typescript
import type { IdeaTechNode } from './techTree';

/**
 * 小公司专属技术候选池
 *
 * 收购小公司时，其技术可能来自此池（独有技术）或主技术树。
 * 收购后初始 maturity=60（含专利/团队，比开源 30 高）。
 */
export const SMALL_COMPANY_TECH_POOL: IdeaTechNode[] = [
  {
    id: 'sc_kv_cache_opt',
    name: 'KV Cache 极致优化',
    description: '小公司专利，显存 -8%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_memory', value: 0.08 },
    isArchitecture: false, source: 'small_company',
  },
  {
    id: 'sc_dynamic_batching',
    name: '动态批处理',
    description: '自适应批处理，利用率 +4%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_utilization', value: 0.04 },
    isArchitecture: false, source: 'small_company',
  },
  {
    id: 'sc_grad_accum',
    name: '梯度累积优化',
    description: '大 batch 模拟，算力 -7%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.07 },
    isArchitecture: false, source: 'small_company',
  },
  {
    id: 'sc_moe_routing',
    name: 'MoE 路由专利',
    description: '专有路由算法，编码能力 +6%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'coding_agent', bonus: 0.06 },
    isArchitecture: false, source: 'small_company',
  },
  {
    id: 'sc_long_context',
    name: '长上下文专利',
    description: '专有长上下文方案，上下文 ×3',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'extend_context', multiplier: 3 },
    isArchitecture: true, source: 'small_company',
  },
  {
    id: 'sc_data_dedup',
    name: '数据去重专利',
    description: '专有去重算法，数据质量 +6%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_data_quality', value: 0.06 },
    isArchitecture: false, source: 'small_company',
  },
  {
    id: 'sc_alignment_fine',
    name: '精细对齐',
    description: '专有对齐方法，对齐度 +15%',
    prerequisites: [], researchDays: 0, researchCost: 0,
    effect: { type: 'improve_alignment', value: 0.15 },
    isArchitecture: false, source: 'small_company',
  },
];
```

#### 5.2 新建 `src/core/systems/SmallCompanyMarketSystem.ts`

完整代码（来自原计划 L944-1055）：

```typescript
/**
 * SmallCompanyMarketSystem
 *
 * 每 14 天刷新 2~3 家小公司进入市场。
 * 小公司拥有 1~3 个技术，生命周期 30 天，到期未收购则消失。
 * 估值 = $200k + techCount × ($100k~$500k)。
 *
 * 技术来源：50% 小公司独有池 / 50% 主技术树未解锁技术。
 * 收购后初始 maturity=60（含专利/团队）。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { SmallCompany } from '../entities/SmallCompany';
import { ALL_TECH, IDEA_TECH_MAP } from '../config/techTree';
import { SMALL_COMPANY_TECH_POOL } from '../config/smallCompanyTech';

const REFRESH_DAYS = 14;
const SPAWN_MIN = 2;
const SPAWN_MAX = 3;
const LIFESPAN = 30;

const COMPANY_NAMES = [
  'Nexus AI', 'DeepForge', 'CogniLabs', 'Synapse Co', 'MindForge',
  'NeuroSpark', 'LogicStream', 'TensorWave', 'CortexHub', 'Atlas AI',
  'PrismMind', 'QuantumLeaf', 'EchoLabs', 'Vertex AI', 'LumenMind',
];

const BACKGROUNDS = [
  '专注推理优化的初创团队',
  '拥有多项注意力专利的研究机构',
  '擅长数据工程的精简团队',
  '专注对齐安全的非营利实验室',
  'MoE 架构专家',
  '长上下文处理先锋',
];

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SmallCompanyMarketSystem implements System {
  name = 'SmallCompanyMarketSystem';

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();

    // 清理过期小公司（生命周期 30 天，未收购的）
    const expiredIds: string[] = current.smallCompanies
      .filter((c) => !c.acquired && current.date - c.spawnedDay > c.lifespan)
      .map((c) => c.id);

    // 刷新判定：距上次刷新 ≥ 14 天
    const shouldRefresh = (current.date - current.lastSmallCompanyRefreshDay) >= REFRESH_DAYS;

    if (!shouldRefresh && expiredIds.length === 0) return;

    state.update((draft) => {
      // 清理过期
      if (expiredIds.length > 0) {
        draft.smallCompanies = draft.smallCompanies.filter((c) => !expiredIds.includes(c.id));
      }

      // 刷新新公司
      if (shouldRefresh) {
        const count = SPAWN_MIN + Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN + 1));
        const usedNames = new Set(draft.smallCompanies.map((c) => c.name));
        const availableNames = COMPANY_NAMES.filter((n) => !usedNames.has(n));

        for (let i = 0; i < count && availableNames.length > 0; i++) {
          const nameIdx = Math.floor(Math.random() * availableNames.length);
          const name = availableNames.splice(nameIdx, 1)[0];
          const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];

          // 1~3 个技术
          const techCount = 1 + Math.floor(Math.random() * 3);
          const techs: string[] = [];
          for (let j = 0; j < techCount; j++) {
            const usePool = Math.random() < 0.5;
            if (usePool) {
              const available = SMALL_COMPANY_TECH_POOL.filter(
                (t) => !techs.includes(t.id) && !IDEA_TECH_MAP[t.id],
              );
              if (available.length > 0) {
                techs.push(available[Math.floor(Math.random() * available.length)].id);
                continue;
              }
            }
            const available = ALL_TECH.filter(
              (t) => !techs.includes(t.id) && (draft.techMaturity[t.id] ?? 0) < 1 && t.researchDays > 0,
            );
            if (available.length > 0) {
              techs.push(available[Math.floor(Math.random() * available.length)].id);
            }
          }
          if (techs.length === 0) continue;

          // 估值：基础 $200k + 每技术 $100k~$500k
          const perTech = 100_000 + Math.random() * 400_000;
          const valuation = Math.round(200_000 + techs.length * perTech);

          draft.smallCompanies.push({
            id: genId(`sc-${draft.date}-${i}`),
            name,
            technologies: techs,
            valuation,
            spawnedDay: draft.date,
            lifespan: LIFESPAN,
            acquired: false,
            background: bg,
          });
        }
        draft.lastSmallCompanyRefreshDay = draft.date;
      }
    });

    if (shouldRefresh) {
      events.emit('SMALL_COMPANY_REFRESHED', current.smallCompanies.length);
    }
  }
}
```

#### 5.3 新建 `src/core/commands/SmallCompanyCommands.ts`

完整代码（来自原计划 L1060-1112）：

```typescript
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP } from '../config/techTree';
import { SMALL_COMPANY_TECH_POOL } from '../config/smallCompanyTech';

/** 收购小公司，获得其所有技术 */
export class AcquireSmallCompanyCommand implements Command {
  constructor(private readonly companyId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const company = current.smallCompanies.find((c) => c.id === this.companyId);
    if (!company) {
      events.emit('ACQUIRE_REJECTED', { reason: '公司不存在' });
      return;
    }
    if (company.acquired) {
      events.emit('ACQUIRE_REJECTED', { reason: '已被收购' });
      return;
    }
    if (current.date - company.spawnedDay > company.lifespan) {
      events.emit('ACQUIRE_REJECTED', { reason: '已过期' });
      return;
    }
    const funds = current.resources['funds'] ?? 0;
    if (funds < company.valuation) {
      events.emit('ACQUIRE_REJECTED', { reason: '资金不足' });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - company.valuation;
      const target = draft.smallCompanies.find((c) => c.id === this.companyId);
      if (target) target.acquired = true;

      // 转移所有技术
      for (const techId of company.technologies) {
        // 注册独有技术（如果是池中的）
        const poolNode = SMALL_COMPANY_TECH_POOL.find((t) => t.id === techId);
        if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
          IDEA_TECH_MAP[poolNode.id] = poolNode;
          draft.acceptedIdeaTechs.push(poolNode);
        }
        // 应用初始 maturity=60（取较大值，避免降级）
        const existing = draft.techMaturity[techId] ?? 0;
        draft.techMaturity[techId] = Math.max(existing, 60);
      }
    });

    events.emit('SMALL_COMPANY_ACQUIRED', company);
  }
}
```

#### 5.4 修改 `src/main.tsx`

追加 import：
```typescript
import { SmallCompanyMarketSystem } from './core/systems/SmallCompanyMarketSystem';
```
在 systems 数组中，`CompetitorSystem` 之后插入（市场刷新应在竞争对手模拟之后、风险之前）：
```typescript
  new CompetitorSystem(),
  new SmallCompanyMarketSystem(),   // ← 新增
  new RiskSystem(),
```

#### 5.5 修改 `src/ui/components/ResearchPanel.tsx`

**改动 1**：扩展 ResearchTab + RESEARCH_TABS：
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

**改动 2**：追加 import + tab 容器 + MarketTab 组件：
```typescript
import { AcquireSmallCompanyCommand } from '../../core/commands/SmallCompanyCommands';
import { TECH_MAP } from '../../core/config/techTree';  // 若未导入则追加（已导入则跳过）
import { IDEA_TECH_MAP } from '../../core/config/techTree';  // 追加
```
tab 容器区追加：
```typescript
<div style={{ display: tab === 'market' ? 'block' : 'none' }}>
  <MarketTab />
</div>
```
新增组件（技术名查找需同时查 TECH_MAP 和 IDEA_TECH_MAP）：
```typescript
/* ============== 小公司市场 ============== */

function MarketTab() {
  const game = useGame();
  const smallCompanies = useGameState((s) => s.smallCompanies);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const currentDate = useGameState((s) => s.date);

  const active = smallCompanies.filter(
    (c) => !c.acquired && currentDate - c.spawnedDay <= c.lifespan,
  );

  const techName = (tid: string): string =>
    TECH_MAP[tid]?.name ?? IDEA_TECH_MAP[tid]?.name ?? tid;

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>小公司市场 ({active.length})</span>
      </div>
      <div className={styles.devHint} style={{ paddingLeft: '4px', marginBottom: '6px' }}>
        每 14 天刷新 2~3 家拥有 1~3 项技术的小公司；30 天内可收购，收购后技术初始成熟度 60。
      </div>
      {active.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无可收购的小公司</div>
      ) : (
        active.map((c) => {
          const remaining = c.lifespan - (currentDate - c.spawnedDay);
          const affordable = funds >= c.valuation;
          return (
            <div key={c.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
              <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                · {c.name}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                {c.background}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                技术：{c.technologies.map(techName).join('、')}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                估值 ${c.valuation.toLocaleString()} · 剩余 {remaining} 天
              </span>
              <button
                className={styles.btn}
                style={{ opacity: affordable ? 1 : 0.5 }}
                disabled={!affordable}
                onClick={() => game.executeCommand(new AcquireSmallCompanyCommand(c.id))}
              >
                收购
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
```

**PR5 验证**：
- `npx tsc --noEmit` 零错误。
- 场景：游戏进行 14 天后，`smallCompanies` 增加 2~3 家，每家 1~3 个技术。
- 场景：`AcquireSmallCompanyCommand` → funds 扣估值，所有技术 `maturity=max(现有,60)`，独有技术注册到 IDEA_TECH_MAP + acceptedIdeaTechs。
- 场景：30 天后未收购的小公司被自动清理。

---

## Assumptions & Decisions

1. **继续已批准的设计**：沿用 research-system-expansion-design.md 与 research-system-pr2-pr5-implementation.md 的所有数值与公式，不重新设计。本计划仅针对"实际代码状态"与"原计划"的偏差（2 个截断 + 未注册 + 缺 UI tab）进行精准补齐。
2. **先修复截断再推进**：PR3 第一步修复 ideaTechPool.ts 与 IdeaGenerationSystem.ts 的截断，使 tsc 立即回到零错误基线，再追加新文件，便于定位后续错误。
3. **CompetitorSystem 开源触发位置**：放在 `updateCompetitorStates(survivors)` 之后，遍历 `survivors`（而非工作集 `competitors`），确保破产公司同 tick 不会开源。比原计划放在 simulateCompetitor 之后更严谨。
4. **开源 cooldown 随机化时机**：每次 update 重新 `30 + floor(random*31)`，意味着判定是"距上次开源 ≥ 一个随机冷却"。这与原计划一致，简化实现（无需为每家公司持久化下次开源日）。
5. **lastOpenSourceDay 写入**：通过 `survivors.find(c => c.name === compName)` 反查 comp.id。因为 openSourceEvents 数组只存了 compName 和 offer。备选方案是直接存 comp.id（更简洁），但为与 offer.source（公司名）一致，保留 compName。
6. **ResearchPanel tab 渐进扩展**：PR3 加 idea（4 tab）→ PR4 加 openSource（5 tab）→ PR5 加 market（6 tab）。每个 PR 的 ResearchTab 类型与 RESEARCH_TABS 数组都重新定义完整，避免类型遗漏。
7. **独有技术统一持久化**：3 种来源（idea/openSource/smallCompany）的独有技术都通过 `IDEA_TECH_MAP` 运行时注册 + `acceptedIdeaTechs` 持久化 + Game.ts migrateOldData 重建（PR1 已实现）。
8. **重复技术取 max**：开源/收购时若技术已存在，`maturity = max(现有, initialMaturity)`，避免降级。
9. **main.tsx systems 顺序**：IdeaGenerationSystem 在 TechResearchSystem 之前（idea 加速当轮生效）；SmallCompanyMarketSystem 在 CompetitorSystem 之后、RiskSystem 之前。
10. **不修改 TechTab 的 StartResearchCommand 调用**：当前 `new StartResearchCommand(tech.id)` 未传 researcherIds（PR2 已支持可选参数，默认空数组）。轻量技术（researchDays<5）仍可不带研究员研发；中重型需研究员的场景由玩家通过未来 UI 增强（不在本次范围）。

---

## Verification Steps

### 1. TypeScript 编译验证（每个 PR 后）
```powershell
npx tsc --noEmit
```
**预期**：零错误零警告。

### 2. PR3 数值验证
- **截断修复**：ideaTechPool.ts 含 10 个完整技术条目；IdeaGenerationSystem.ts 完整闭合，`update` + `generateIdea` 方法正常。
- **idea 概率**：L5 研究员（int 75, cre 70, level 5, eff 1.18）每周 P = (0.05 + (75-50)×0.003 + (70-50)×0.004 + 5×0.01) × 1.18 = (0.05+0.075+0.08+0.05) × 1.18 = 0.301。
- **idea 加速研发**：accept accelerate idea（研发中 rlhf，totalDays=30）→ `progressDays += 30 × 0.20 = 6` 天。
- **idea 独有技术**：accept unique idea → `IDEA_TECH_MAP['mixture_of_depths']` 注册，`techMaturity['mixture_of_depths']=30`，`acceptedIdeaTechs.length +1`。

### 3. PR4 数值验证
- **开源触发**：survivors 中 menta/shallowfind/mistral 在距上次开源 30~60 天后触发，`openSourceOffers` 增长，`lastOpenSourceDay[comp.id]` 更新为当前 date。
- **开源采纳**：`AdoptOpenSourceCommand` → funds 扣 $50k~$200k，`techMaturity[id]=max(现有,30)`，独有技术注册到 IDEA_TECH_MAP。
- **开源过期**：offer 14 天后采纳被拒绝（`current.date > offer.expiresDay`）。

### 4. PR5 数值验证
- **小公司刷新**：14 天后 `smallCompanies` 增加 2~3 家，每家 1~3 个技术，估值 $200k + techCount × ($100k~$500k)。
- **小公司收购**：`AcquireSmallCompanyCommand` → funds 扣估值，所有技术 `maturity=max(现有,60)`，独有技术注册。
- **小公司过期**：30 天后未收购的小公司被清理（`current.date - spawnedDay > lifespan`）。

### 5. 系统联动验证
- 训练模型时，project.techIds 中的技术每日 +0.05 maturity（PR2 已实现）。
- 接受 unique idea 后，新技术立即出现在 `getActiveTechEffects` 派生列表中（按 maturity=30 缩放，即 30% 效果）。
- 6 个 tab 在 ResearchPanel 中正常切换，每个 tab 数据独立订阅。

### 6. 边界场景
- 无研究员时尝试研发中重型技术（researchDays≥5）→ StartResearchCommand 拒绝（PR2 已实现）。
- pendingIdeas 满 50 条 → 自动截断（仅保留 pending 状态最近 50 条）。
- 小公司过期 → 自动清理。
- 开源 offer 过期 → 不可采纳。
- IDEA_TECH_POOL / OPEN_SOURCE_TECH_POOL / SMALL_COMPANY_TECH_POOL 耗尽 → 对应来源跳过（不产出）。

### 7. 最终验证
- `npx tsc --noEmit` 零错误。
- 用户原始需求逐条核对：
  - ✅ 技术路线需要员工 idea（PR3 IdeaGenerationSystem + unique 技术）或其他开源公司开源（PR4 CompetitorSystem 开源触发）。
  - ✅ 科研需要研究员（PR2 StartResearchCommand 研究员校验 + 锁定 + TechResearchSystem log2 加速）。
  - ✅ 市场中会刷出很多小公司，小公司拥有一些技术，购买即可获得（PR5 SmallCompanyMarketSystem + AcquireSmallCompanyCommand）。
  - ✅ 技术有成熟度，同一个技术越成熟效果越好（techMaturity 0-100 + scaleTechEffect 按 maturity/100 缩放）。
  - ✅ 具体数值和公式（见上方各 PR 验证 + 设计文档）。
