# 研发系统扩展实施计划 — PR2 收尾 + PR3/PR4/PR5

## Summary

本计划承接已批准的 [research-system-expansion-design.md](./research-system-expansion-design.md)，聚焦于剩余 4 个 PR 的具体实施。PR1（数据结构迁移）已 100% 完成，PR2 仅完成 TechResearchSystem 重写，其余部分（研究员锁定/释放、PolishTechCommand、TrainingSystem 被动成熟度 + effect 缩放）待补齐。PR3/PR4/PR5 完全未开始。

**目标**：完成研发系统扩展的全部剩余工作，让技术路线通过 3 种渠道（员工 idea / 开源采纳 / 小公司收购）流入玩家公司，并通过研究员加速 + 主动打磨 + 被动训练使用 3 种方式提升技术成熟度。

**预计工作量**：新建 11 个文件 + 修改 6 个文件，分 4 个 PR 提交，每个 PR 独立通过 `npx tsc --noEmit`。

---

## Current State Analysis

### 已完成（PR1，无需改动）

| 文件 | 状态 |
|---|---|
| [GameState.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/GameState.ts) | ✅ techMaturity / pendingIdeas / smallCompanies / openSourceOffers / acceptedIdeaTechs / lastSmallCompanyRefreshDay / lastOpenSourceDay 全部就位 |
| [techEffectScale.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/techEffectScale.ts) | ✅ scaleTechEffect 完整（含 extend_context 特殊处理） |
| [techLookup.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/techLookup.ts) | ✅ getTechNode / isTechUnlocked / getTechMaturity / getUnlockedTechIds |
| [TechIdea.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/TechIdea.ts) | ✅ 实体定义完整 |
| [SmallCompany.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/SmallCompany.ts) | ✅ 实体定义完整 |
| [OpenSourceOffer.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/entities/OpenSourceOffer.ts) | ✅ 实体定义完整 |
| [techTree.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/config/techTree.ts) | ✅ IdeaTechNode 接口 + IDEA_TECH_MAP 空容器 |
| [crossSystemUtils.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/utils/crossSystemUtils.ts) | ✅ getActiveTechEffects 派生函数 + WeakMap 缓存 |
| [main.tsx](file:///c:/Users/28705/Documents/trae_projects/project4/src/main.tsx) | ✅ initialData 含所有新字段 |
| 所有 unlockedTechs.includes 替换 | ✅ DataCommands / RiskCommands / TrainingCommands / capabilityCalc 等 |
| Game.ts migrateOldData | ✅ 旧存档迁移 + IDEA_TECH_MAP 重建 |

### 部分完成（PR2）

| 文件 | 已完成 | 待补齐 |
|---|---|---|
| [TechResearchSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/TechResearchSystem.ts) | 研究员加速公式、资金维持检查、完成时释放研究员 | ✅ 已完整 |
| [TechCommands.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/commands/TechCommands.ts) | StartResearchCommand 接受 researcherIds 参数 | 研究员锁定逻辑、CancelResearchCommand 释放研究员、PolishTechCommand 新建 |
| [TrainingSystem.ts](file:///c:/Users/28705/Documents/trae_projects/project4/src/core/systems/TrainingSystem.ts) | getActiveTechEffects 已接入（全局派生效果） | project.techIds effect 按 maturity 缩放（第 209-212 行）；被动成熟度 +0.05/天 |

### 未开始（PR3/PR4/PR5）

- PR3 idea 系统：0%
- PR4 开源机制：0%
- PR5 小公司市场：0%

---

## Proposed Changes

### PR2 收尾 — 研究员接入研发（3 个文件修改 + 0 新建）

#### 2.1 修改 `src/core/commands/TechCommands.ts`

**改动 1**：`StartResearchCommand.execute` 添加研究员有效性校验 + 锁定逻辑

```typescript
// 在"检查是否已有研发中技术"之后、"检查资金"之前，新增研究员校验
const researcherIds = this.researcherIds;
const empMap = new Map(current.employees.map((e) => [e.id, e]));
const validResearchers: Employee[] = [];
for (const rid of researcherIds) {
  const emp = empMap.get(rid);
  if (!emp) {
    events.emit('RESEARCH_REJECTED', { reason: `研究员不存在: ${rid}` });
    return;
  }
  if (emp.role !== StaffRole.RESEARCHER) {
    events.emit('RESEARCH_REJECTED', { reason: `${emp.name} 不是研究员` });
    return;
  }
  if (emp.status !== 'idle') {
    events.emit('RESEARCH_REJECTED', { reason: `${emp.name} 当前不可用（${emp.status}）` });
    return;
  }
  validResearchers.push(emp);
}

// 轻量技术（researchDays < 5）不强制要求研究员；中重型至少 1 名
if (tech.researchDays >= 5 && validResearchers.length === 0) {
  events.emit('RESEARCH_REJECTED', { reason: '该技术至少需要 1 名研究员' });
  return;
}
```

在 `state.update` 内追加研究员锁定：
```typescript
// 锁定研究员
const lockProjectId = `tech-research-${this.techId}`;
for (const emp of validResearchers) {
  const target = draft.employees.find((e) => e.id === emp.id);
  if (target) {
    target.status = 'assigned';
    target.assignedProjectId = lockProjectId;
  }
}
```

需要 import：`import { StaffRole } from '../entities/Employee';` 和 `import type { Employee } from '../entities/Employee';`

**改动 2**：`CancelResearchCommand.execute` 添加研究员释放逻辑

```typescript
export class CancelResearchCommand implements Command {
  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    if (!current.researchingTech) {
      events.emit('RESEARCH_CANCEL_REJECTED', { reason: '无研发中技术' });
      return;
    }

    const techId = current.researchingTech.techId;
    const researcherIds = current.researchingTech.researcherIds ?? [];
    const lockProjectId = `tech-research-${techId}`;

    state.update((draft) => {
      // 释放锁定研究员
      for (const rid of researcherIds) {
        const emp = draft.employees.find((e) => e.id === rid);
        if (emp && emp.assignedProjectId === lockProjectId) {
          emp.status = 'idle';
          emp.assignedProjectId = undefined;
        }
      }
      draft.researchingTech = null;
    });

    events.emit('RESEARCH_CANCELLED');
  }
}
```

**改动 3**：新增 `PolishTechCommand`（同文件追加）

设计决策：**一次性即时命令**（不创建 polishingTechs 状态字段，避免增加系统复杂度）
- 立即扣除总成本 = $5000 × researcherCount × days
- 立即应用总成熟度增益 = dailyGain × days
- 不锁定研究员状态（但要求命令时研究员必须 idle，且增加疲劳）
- dailyGain = 0.30 × (1 + sumIntelligence/200)，其中 sumIntelligence = Σ(eff × intelligence)

```typescript
/**
 * 主动打磨技术（提升成熟度）
 *
 * 一次性即时命令：立即扣除资金、应用成熟度增益、增加研究员疲劳。
 * 不锁定研究员状态（短期投入，不阻塞其他任务）。
 *
 * 公式：
 * - dailyGain = 0.30 × (1 + sumIntelligence/200)
 * - 总增益 = dailyGain × days
 * - 成本 = $5000 × researcherCount × days
 * - 疲劳 = days × 3（每位参与研究员）
 *
 * 7 天预期增长：
 * - 1×L5（int 75, eff 1.18）: sumInt=88.5, dailyGain=0.43, 7天=3.04
 * - 3×L7（int 85, eff 1.52）: sumInt=387.6, dailyGain=0.88, 7天=6.17
 */
export class PolishTechCommand implements Command {
  constructor(
    private readonly techId: string,
    private readonly researcherIds: string[],
    private readonly days: number = 7,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const maturity = current.techMaturity[this.techId] ?? 0;

    // 校验 1：技术已解锁且未满级
    if (maturity < 1) {
      events.emit('POLISH_REJECTED', { reason: '技术未解锁，无法打磨' });
      return;
    }
    if (maturity >= 100) {
      events.emit('POLISH_REJECTED', { reason: '技术已满级' });
      return;
    }

    // 校验 2：days 范围
    if (this.days < 1 || this.days > 14) {
      events.emit('POLISH_REJECTED', { reason: '打磨天数必须在 1~14 之间' });
      return;
    }

    // 校验 3：研究员有效性（必须 idle + RESEARCHER）
    const researchers: Employee[] = [];
    for (const rid of this.researcherIds) {
      const emp = current.employees.find((e) => e.id === rid);
      if (!emp || emp.role !== StaffRole.RESEARCHER) {
        events.emit('POLISH_REJECTED', { reason: '无效研究员' });
        return;
      }
      if (emp.status !== 'idle') {
        events.emit('POLISH_REJECTED', { reason: `${emp.name} 不可用` });
        return;
      }
      researchers.push(emp);
    }
    if (researchers.length === 0) {
      events.emit('POLISH_REJECTED', { reason: '至少需要 1 名研究员' });
      return;
    }

    // 计算总增益
    let sumIntelligence = 0;
    for (const r of researchers) {
      const eff = calcEmployeeEfficiency(r, current.departments, current.employees);
      sumIntelligence += eff * r.attributes.intelligence;
    }
    const dailyGain = 0.30 * (1 + sumIntelligence / 200);
    const totalGain = dailyGain * this.days;
    const cost = 5000 * researchers.length * this.days;

    // 校验 4：资金
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('POLISH_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      // 扣费
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - cost;
      // 应用成熟度（封顶 100）
      const existing = draft.techMaturity[this.techId] ?? 0;
      draft.techMaturity[this.techId] = Math.min(100, existing + totalGain);
      // 增加研究员疲劳
      const fatigueGain = this.days * 3;
      for (const r of researchers) {
        const target = draft.employees.find((e) => e.id === r.id);
        if (target) {
          target.fatigue = Math.min(100, target.fatigue + fatigueGain);
        }
      }
    });

    events.emit('TECH_POLISHED', {
      techId: this.techId,
      gain: totalGain,
      cost,
      researcherCount: researchers.length,
    });
  }
}
```

需要追加 import：`import { calcEmployeeEfficiency } from '../utils/employeeUtils';`

#### 2.2 修改 `src/core/systems/TrainingSystem.ts`

**改动 1**：project.techIds effect 按 maturity 缩放（修复 PR1 遗留）

定位第 209-212 行：
```typescript
// 原：
const techEffects = project.techIds
  .map((tid) => TECH_MAP[tid as keyof typeof TECH_MAP])
  .filter(Boolean)
  .map((t) => t.effect) as TechEffect[];
```

改为：
```typescript
// 按 maturity 缩放 project.techIds 中的技术效果
const techEffects = project.techIds
  .map((tid) => {
    const node = TECH_MAP[tid] ?? IDEA_TECH_MAP[tid];
    if (!node) return null;
    const mat = current.techMaturity[tid] ?? 0;
    if (mat < 1) return null;
    return scaleTechEffect(node.effect, mat);
  })
  .filter((e): e is TechEffect => e !== null);
```

需要追加 import：`IDEA_TECH_MAP` from `'../config/techTree'`；`scaleTechEffect` from `'../utils/techEffectScale'`。

**改动 2**：被动成熟度提升 +0.05/天

在 `state.update` 回调内、训练项目循环中（完成判定之前），追加：
```typescript
// 被动成熟度提升：训练使用 project.techIds 中的已解锁技术，每日 +0.05
for (const techId of project.techIds) {
  const mat = draft.techMaturity[techId] ?? 0;
  if (mat >= 1 && mat < 100) {
    draft.techMaturity[techId] = Math.min(100, mat + 0.05 * deltaDays);
  }
}
```

位置：在 `project.computeRemaining = Math.max(0, project.computeRemaining - dailyProgress);`（约第 200 行）之后。

**PR2 验证**：
- `npx tsc --noEmit` 零错误
- 场景：StartResearchCommand('rlhf', [r1,r2,r3]) → 验证 3 名研究员 status='assigned'，assignedProjectId='tech-research-rlhf'
- 场景：CancelResearchCommand → 验证研究员 status='idle'，assignedProjectId=undefined
- 场景：PolishTechCommand('sft', [r1], 7) → 验证 techMaturity['sft'] 增加 ~3，funds 减少 $35k，r1.fatigue += 21
- 场景：训练使用 sft（maturity=50）→ techEffects 中 sft 的 capability_bonus 应为 0.15×0.5=0.075；每日后 maturity +0.05

---

### PR3 — idea 系统（4 个新建 + 2 个修改）

#### 3.1 新建 `src/core/config/ideaTechPool.ts`

```typescript
import type { IdeaTechNode } from './techTree';

/**
 * 独有技术候选池（员工 idea 生成时随机选取）
 *
 * 这些技术不在主技术树中，只能通过员工 idea 获得。
 * 接受后初始 maturity=30，可通过训练使用 / 主动打磨 / idea 加速提升。
 */
export const IDEA_TECH_POOL: IdeaTechNode[] = [
  {
    id: 'mixture_of_depths',
    name: 'MoD 混合深度',
    description: '动态跳过部分层计算，算力 -8%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.08 },
    isArchitecture: false,
    source: 'idea',
  },
  {
    id: 'sparse_attention_v2',
    name: '稀疏注意力 v2',
    description: '更高效的稀疏模式，上下文 ×2',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'extend_context', multiplier: 2 },
    isArchitecture: true,
    source: 'idea',
  },
  {
    id: 'dynamic_routing',
    name: '动态路由',
    description: '自适应计算路径，实用推理 +5%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'pragmatic_inference', bonus: 0.05 },
    isArchitecture: false,
    source: 'idea',
  },
  {
    id: 'kv_cache_compression',
    name: 'KV Cache 压缩',
    description: '压缩 KV 缓存，显存 -10%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'reduce_memory', value: 0.10 },
    isArchitecture: false,
    source: 'idea',
  },
  {
    id: 'token_pruning',
    name: 'Token 剪枝',
    description: '动态剪枝无效 token，算力 -6%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'reduce_compute_cost', value: 0.06 },
    isArchitecture: false,
    source: 'idea',
  },
  {
    id: 'contrastive_decoding',
    name: '对比解码',
    description: '多模型对比提升创意写作 +8%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'creative_writing', bonus: 0.08 },
    isArchitecture: false,
    source: 'idea',
  },
  {
    id: 'self_consistency',
    name: '自一致性',
    description: '多采样投票提升数学推理 +6%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'math_reasoning', bonus: 0.06 },
    isArchitecture: false,
    source: 'idea',
  },
  {
    id: 'retrieval_augmented',
    name: '检索增强',
    description: '外挂知识库，世界知识 +10%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'world_knowledge', bonus: 0.10 },
    isArchitecture: false,
    source: 'idea',
  },
  {
    id: 'long_rope',
    name: '长程 RoPE',
    description: '改进的位置编码外推，上下文 ×6',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'extend_context', multiplier: 6 },
    isArchitecture: true,
    source: 'idea',
  },
  {
    id: 'moe_routing_v2',
    name: 'MoE 路由 v2',
    description: '更均衡的专家路由，编码能力 +6%',
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: 'capability_bonus', capability: 'coding_agent', bonus: 0.06 },
    isArchitecture: false,
    source: 'idea',
  },
];
```

#### 3.2 新建 `src/core/systems/IdeaGenerationSystem.ts`

**执行时机**：每日 update，但只在 `current.date % 7 === 0` 时执行判定（每 7 天一次）。

**idea 生成概率公式**（每位研究员独立判定）：
```
P = clamp(0.05 + (intelligence - 50) × 0.003 + (creativity - 50) × 0.004 + level × 0.01, 0, 0.6) × eff
```

**idea 产物分布**：
- 80% `accelerate`：从未成熟技术中随机选一个
  - 研发中技术（`researchingTech.techId`）：value=0.20（进度推进 20%）
  - 已解锁但 maturity<100 的技术：value = 5 + creativity/100 × 5（+5~10 maturity）
  - 无未成熟技术时：跳过（不产出 idea）
- 20% `unique`：从 IDEA_TECH_POOL 随机选一个未注册的，value=30（初始 maturity）

```typescript
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { TechIdea } from '../entities/TechIdea';
import { StaffRole } from '../entities/Employee';
import { IDEA_TECH_POOL, IDEA_TECH_MAP, TECH_MAP } from '../config/techTree';
import { calcEmployeeEfficiency } from '../utils/employeeUtils';
import { getUnlockedTechIds } from '../utils/techLookup';

const IDEA_TICK_DAYS = 7;
const MAX_PENDING_IDEAS = 50;

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class IdeaGenerationSystem implements System {
  name = 'IdeaGenerationSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    if (current.date % IDEA_TICK_DAYS !== 0) return;

    const newIdeas: TechIdea[] = [];
    const researchers = current.employees.filter(
      (e) => e.role === StaffRole.RESEARCHER && e.status !== 'training',
    );

    for (const r of researchers) {
      const eff = calcEmployeeEfficiency(r, current.departments, current.employees);
      const p = Math.max(0, Math.min(0.6,
        0.05 + (r.attributes.intelligence - 50) * 0.003
             + (r.attributes.creativity - 50) * 0.004
             + r.level * 0.01,
      )) * eff;

      if (Math.random() >= p) continue;

      // 决定 idea 类型
      const isUnique = Math.random() < 0.20;
      const idea = this.generateIdea(current, r, isUnique);
      if (idea) {
        newIdeas.push(idea);
        events.emit('IDEA_GENERATED', idea);
      }
    }

    if (newIdeas.length === 0) return;

    state.update((draft) => {
      draft.pendingIdeas.push(...newIdeas);
      // 截断到最近 50 条（移除已处理的）
      if (draft.pendingIdeas.length > MAX_PENDING_IDEAS) {
        const pending = draft.pendingIdeas.filter((i) => i.status === 'pending');
        draft.pendingIdeas = pending.slice(-MAX_PENDING_IDEAS);
      }
    });
  }

  private generateIdea(data: Readonly<typeof data>, researcher: Employee, isUnique: boolean): TechIdea | null {
    // ... 见下方说明
  }
}
```

`generateIdea` 实现要点：
- `accelerate` 分支：
  - 候选 1：`data.researchingTech?.techId`（研发中技术）
  - 候选 2：`getUnlockedTechIds(data).filter(id => (data.techMaturity[id] ?? 0) < 100)`（已解锁未满级）
  - 合并候选池，随机选一个；若为空返回 null
  - value：研发中=0.20；已解锁=5 + creativity/100 × 5
- `unique` 分支：
  - 从 `IDEA_TECH_POOL` 过滤掉已注册到 IDEA_TECH_MAP 的
  - 随机选一个；若池空返回 null
  - value=30，targetTechId=选中技术的 id

#### 3.3 新建 `src/core/commands/IdeaCommands.ts`

```typescript
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP, type IdeaTechNode } from '../config/techTree';
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
          // 研发中技术：进度 +20%
          draft.researchingTech.progressDays += draft.researchingTech.totalDays * idea.value;
        } else {
          // 已解锁技术：maturity += value
          const existing = draft.techMaturity[idea.targetTechId] ?? 0;
          draft.techMaturity[idea.targetTechId] = Math.min(100, existing + idea.value);
        }
      } else {
        // unique：注册独有技术
        const poolNode = IDEA_TECH_POOL.find((t) => t.id === idea.targetTechId);
        if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
          IDEA_TECH_MAP[poolNode.id] = poolNode;
          draft.acceptedIdeaTechs.push(poolNode);
        }
        draft.techMaturity[idea.targetTechId] = Math.max(
          draft.techMaturity[idea.targetTechId] ?? 0,
          idea.value,
        );
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

在 systems 数组中，`TechResearchSystem` 之前插入 `IdeaGenerationSystem`：
```typescript
import { IdeaGenerationSystem } from './core/systems/IdeaGenerationSystem';
// ...
const systems = [
  new ComputeHardwareSystem(registry),
  new PowerSystem(registry),
  new IdeaGenerationSystem(),   // ← 新增：在 TechResearch 之前，idea 加速能当轮生效
  new TechResearchSystem(),
  new ResearchSystem(),
  // ...
];
```

#### 3.5 修改 `src/ui/components/ResearchPanel.tsx`

扩展 ResearchTab 类型 + 添加 idea tab：
```typescript
type ResearchTab = 'experiment' | 'tech' | 'idea' | 'risk';

const RESEARCH_TABS = [
  { key: 'experiment', label: '实验', icon: '🔬' },
  { key: 'tech', label: '技术树', icon: '🌳' },
  { key: 'idea', label: '创意', icon: '💡' },   // ← 新增
  { key: 'risk', label: '风险', icon: '⚠️' },
];
```

新增 `IdeaTab` 组件：展示 `pendingIdeas.filter(i => i.status === 'pending')`，每条 idea 显示标题、描述、来源员工、目标技术、value；提供「接受」和「拒绝」按钮，分别调用 AcceptIdeaCommand / RejectIdeaCommand。

**PR3 验证**：
- `npx tsc --noEmit` 零错误
- 场景：L5+ 研究员每 7 天有 30%+ 概率产出 idea
- 场景：接受 accelerate idea（研发中技术）→ researchingTech.progressDays 跳增 20%
- 场景：接受 unique idea → IDEA_TECH_MAP 注册新条目，techMaturity[id]=30，acceptedIdeaTechs 增长

---

### PR4 — 开源机制（2 个新建 + 2 个修改）

#### 4.1 新建 `src/core/config/openSourcePool.ts`

```typescript
import type { IdeaTechNode } from './techTree';

/**
 * 开源技术候选池
 *
 * 由 open_source 策略竞争对手（Menta / Mistral / ShallowFind）触发开源事件。
 * 采纳后初始 maturity=30，需本地化适配。
 *
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

```typescript
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { IDEA_TECH_MAP, TECH_MAP } from '../config/techTree';
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
      // 应用初始 maturity（取较大值）
      const existing = draft.techMaturity[offer.techId] ?? 0;
      draft.techMaturity[offer.techId] = Math.max(existing, offer.initialMaturity);
    });

    events.emit('OPEN_SOURCE_ADOPTED', offer);
  }
}
```

#### 4.3 修改 `src/core/systems/CompetitorSystem.ts`

在 `simulateCompetitor` 方法末尾（第 6 段"间谍渗透衰减"之后）追加开源触发逻辑：

```typescript
// ---- 7. 开源事件触发（仅 open_source 策略公司）----
if (comp.strategy === 'open_source') {
  const lastDay = data.lastOpenSourceDay[comp.id] ?? -999;
  const cooldown = 30 + Math.floor(Math.random() * 30); // 30~60 天
  if (day - lastDay >= cooldown) {
    this.triggerOpenSource(comp, day, data, events);
  }
}
```

注意：`simulateCompetitor` 当前签名是 `(comp, day, events)`，需要扩展为 `(comp, day, data, events)` 以访问 `data.lastOpenSourceDay` 和写入 `draft.openSourceOffers`。但由于 `simulateCompetitor` 在 `update` 之外被调用（操作的是深拷贝的 competitors），开源事件需要单独处理：

**实现方案**：在 `CompetitorSystem.update` 的主循环中（`for (const comp of competitors)` 之前），预计算本轮应开源的公司列表，然后在 `state.update` 内推送 OpenSourceOffer。

```typescript
// 在 for (const comp of competitors) { this.simulateCompetitor(...) } 之后
// 检测开源事件
const openSourceEvents: Array<{ comp: CompetitorState; offer: OpenSourceOffer }> = [];
for (const comp of competitors) {
  if (comp.strategy !== 'open_source') continue;
  const lastDay = current.lastOpenSourceDay[comp.id] ?? -999;
  const cooldown = 30 + Math.floor(Math.random() * 30);
  if (current.date - lastDay < cooldown) continue;

  // 60% 独有技术池 / 40% 主技术树未解锁
  const usePool = Math.random() < 0.6;
  let techNode: { id: string; name: string; description: string; effect: TechEffect; isPool: boolean } | null = null;

  if (usePool) {
    const available = OPEN_SOURCE_TECH_POOL.filter((t) => !IDEA_TECH_MAP[t.id]);
    if (available.length > 0) {
      const picked = available[Math.floor(Math.random() * available.length)];
      techNode = { id: picked.id, name: picked.name, description: picked.description, effect: picked.effect, isPool: true };
    }
  }
  if (!techNode) {
    // 从主技术树未解锁技术中选
    const available = ALL_TECH.filter((t) => (current.techMaturity[t.id] ?? 0) < 1 && t.researchDays > 0);
    if (available.length > 0) {
      const picked = available[Math.floor(Math.random() * available.length)];
      techNode = { id: picked.id, name: picked.name, description: picked.description, effect: picked.effect, isPool: false };
    }
  }
  if (!techNode) continue;

  const adoptionCost = 50_000 + Math.random() * 150_000; // $50k~$200k
  const offer: OpenSourceOffer = {
    id: genId(`offer-${comp.id}-${current.date}`),
    techId: techNode.id,
    techName: techNode.name,
    techDescription: techNode.description,
    source: comp.name,
    publishedDay: current.date,
    adoptionCost: Math.round(adoptionCost),
    initialMaturity: 30,
    expiresDay: current.date + 14,
  };
  openSourceEvents.push({ comp, offer });
}

// 在 state.update 内推送 offers + 更新 lastOpenSourceDay
if (openSourceEvents.length > 0) {
  state.update((draft) => {
    for (const { comp, offer } of openSourceEvents) {
      draft.openSourceOffers.push(offer);
      draft.lastOpenSourceDay[comp.id] = draft.date;
    }
  });
  for (const { comp, offer } of openSourceEvents) {
    events.emit('OPEN_SOURCE_PUBLISHED', { compName: comp.name, offer });
  }
}
```

需要追加 import：`OpenSourceOffer` from `'../entities/OpenSourceOffer'`；`OPEN_SOURCE_TECH_POOL` from `'../config/openSourcePool'`；`ALL_TECH` from `'../config/techTree'`；`IDEA_TECH_MAP` from `'../config/techTree'`。

#### 4.4 修改 `src/ui/components/ResearchPanel.tsx`

扩展 ResearchTab + 添加 openSource tab：
```typescript
type ResearchTab = 'experiment' | 'tech' | 'idea' | 'openSource' | 'risk';
// RESEARCH_TABS 追加 { key: 'openSource', label: '开源', icon: '🌐' }
```

新增 `OpenSourceTab` 组件：展示 `openSourceOffers`（未采纳 + 未过期），每条显示技术名、来源、采纳成本、过期倒计时；提供「采纳」按钮调用 AdoptOpenSourceCommand。

**PR4 验证**：
- `npx tsc --noEmit` 零错误
- 场景：游戏进行 30~60 天后，menta/shallowfind/mistral 之一触发开源事件，openSourceOffers 增长
- 场景：AdoptOpenSourceCommand → funds 扣减，techMaturity[id]=max(现有,30)，独有技术注册到 IDEA_TECH_MAP
- 场景：offer 过期（14 天后）→ 采纳被拒绝

---

### PR5 — 小公司市场（2 个新建 + 2 个修改）

#### 5.1 新建 `src/core/config/smallCompanyTech.ts`

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

```typescript
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

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // 清理过期小公司（生命周期 30 天）
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
          // 50% 从小公司池选，50% 从主技术树未解锁选
          for (let j = 0; j < techCount; j++) {
            const usePool = Math.random() < 0.5;
            if (usePool) {
              const available = SMALL_COMPANY_TECH_POOL.filter((t) => !techs.includes(t.id) && !IDEA_TECH_MAP[t.id]);
              if (available.length > 0) {
                techs.push(available[Math.floor(Math.random() * available.length)].id);
                continue;
              }
            }
            const available = ALL_TECH.filter((t) => !techs.includes(t.id) && (draft.techMaturity[t.id] ?? 0) < 1 && t.researchDays > 0);
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
        // 注册独有技术
        const poolNode = SMALL_COMPANY_TECH_POOL.find((t) => t.id === techId);
        if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
          IDEA_TECH_MAP[poolNode.id] = poolNode;
          draft.acceptedIdeaTechs.push(poolNode);
        }
        // 应用初始 maturity=60（取较大值）
        const existing = draft.techMaturity[techId] ?? 0;
        draft.techMaturity[techId] = Math.max(existing, 60);
      }
    });

    events.emit('SMALL_COMPANY_ACQUIRED', company);
  }
}
```

#### 5.4 修改 `src/main.tsx`

在 systems 数组中，`CompetitorSystem` 之后插入 `SmallCompanyMarketSystem`：
```typescript
import { SmallCompanyMarketSystem } from './core/systems/SmallCompanyMarketSystem';
// ...
const systems = [
  // ...
  new CompetitorSystem(),
  new SmallCompanyMarketSystem(),   // ← 新增
  new RiskSystem(),
  // ...
];
```

#### 5.5 修改 `src/ui/components/ResearchPanel.tsx`

扩展 ResearchTab + 添加 market tab：
```typescript
type ResearchTab = 'experiment' | 'tech' | 'idea' | 'openSource' | 'market' | 'risk';
// RESEARCH_TABS 追加 { key: 'market', label: '市场', icon: '🏢' }
```

新增 `MarketTab` 组件：展示 `smallCompanies`（未收购 + 未过期），每条显示公司名、背景、技术列表、估值、剩余天数；提供「收购」按钮调用 AcquireSmallCompanyCommand。

**PR5 验证**：
- `npx tsc --noEmit` 零错误
- 场景：游戏进行 14 天后，smallCompanies 刷新 2~3 家
- 场景：AcquireSmallCompanyCommand → funds 扣减，所有技术 maturity=60，独有技术注册
- 场景：小公司 30 天后未收购 → 自动清理

---

## Assumptions & Decisions

1. **PolishTechCommand 设计为即时命令**：不创建 polishingTechs 状态字段，避免增加系统复杂度。命令时校验研究员 idle，应用后增加疲劳但不锁定状态。玩家可频繁使用，但疲劳累积会降低研究员效率，形成自然平衡。
2. **IdeaGenerationSystem 执行时机**：每 7 天判定（`date % 7 === 0`），插入在 TechResearchSystem 之前，使 idea 加速能在同日生效。
3. **CompetitorSystem 开源逻辑位置**：在 `simulateCompetitor` 调用之后、`state.update` 写回之前，单独检测开源事件并推送 offers。避免修改 `simulateCompetitor` 签名。
4. **独有技术持久化**：所有 3 种来源（idea/openSource/smallCompany）的独有技术统一通过 `IDEA_TECH_MAP` 运行时注册 + `acceptedIdeaTechs` 持久化，加载存档时由 Game.ts 重建（PR1 已实现）。
5. **重复技术处理**：开源/收购时若技术已存在，取 `max(existing, initialMaturity)`。玩家已 maturity=80 的技术被小公司收购不会降级。
6. **idea 池去重**：IdeaGenerationSystem 生成 unique idea 时过滤已注册到 IDEA_TECH_MAP 的；开源/小公司同理。池耗尽后跳过。
7. **TrainingSystem effect 缩放修复**：PR1 遗留问题（第 209-212 行未缩放），PR2 一并修复。使用 `current.techMaturity`（update 前快照）计算缩放，然后 +0.05 被动提升在 update 内追加。
8. **UI tab 数量**：ResearchPanel 从 3 个 tab 扩展到 6 个（experiment/tech/idea/openSource/market/risk），图标 + 文字布局可容纳。
9. **小公司命名池**：15 个候选名 + 6 个背景描述，避免重复。已存在的名字会被过滤。
10. **不合并 TechResearchSystem 与 ResearchSystem**：保持单线程技术研发 + 并发实验验证的分离设计。

---

## Verification Steps

### 1. TypeScript 编译验证（每个 PR 后执行）
```powershell
npx tsc --noEmit
```
**预期**：零错误零警告。

### 2. PR2 数值验证
- **研究员锁定**：`StartResearchCommand('rlhf', [r1,r2,r3])` 后，3 名研究员 `status='assigned'`，`assignedProjectId='tech-research-rlhf'`
- **研究员释放**：`CancelResearchCommand` 后，研究员 `status='idle'`，`assignedProjectId=undefined`
- **PolishTechCommand**：`PolishTechCommand('sft', [r1], 7)` → `techMaturity['sft']` 增加 ~3.04，funds 减少 $35k，r1.fatigue += 21
- **TrainingSystem effect 缩放**：训练使用 sft（maturity=50）→ techEffects 中 sft 的 capability_bonus = 0.15 × 0.5 = 0.075
- **被动成熟度**：训练 1 天后，project.techIds 中的已解锁技术 maturity +0.05

### 3. PR3 数值验证
- **idea 概率**：L5 研究员（int 75, eff 1.18）每周 P = (0.05 + 0.075 + 0.08 + 0.05) × 1.18 = 0.301
- **idea 加速研发**：accept accelerate idea（研发中 rlhf）→ `progressDays += totalDays × 0.2`
- **idea 独有技术**：accept unique idea → `IDEA_TECH_MAP['mixture_of_depths']` 注册，`techMaturity['mixture_of_depths']=30`，`acceptedIdeaTechs` 长度 +1

### 4. PR4 数值验证
- **开源触发**：menta/shallowfind/mistral 之一在 30~60 天后触发，`openSourceOffers` 增长
- **开源采纳**：`AdoptOpenSourceCommand` → funds 扣 $50k~$200k，`techMaturity[id]=max(现有,30)`
- **开源过期**：offer 14 天后采纳被拒绝

### 5. PR5 数值验证
- **小公司刷新**：14 天后 `smallCompanies` 增加 2~3 家
- **小公司收购**：`AcquireSmallCompanyCommand` → funds 扣估值，所有技术 `maturity=60`
- **小公司过期**：30 天后未收购的小公司被清理

### 6. 系统联动验证
- 训练模型时，project.techIds 中的技术每日 +0.05 maturity
- CTO 任命后，研发速度 +5%（`getCompanyResearchSpeedBonus`）
- 管理效率 < 1.0 时，研发速度相应降低
- 接受 unique idea 后，新技术立即出现在 `getActiveTechEffects` 派生列表中（按 maturity=30 缩放）

### 7. 边界场景
- 无研究员时尝试研发中重型技术（researchDays≥5）→ 拒绝
- 资金不足维持费 → 研发暂停（不清空，TechResearchSystem 已实现）
- pendingIdeas 满 50 条 → 自动截断（仅保留 pending 状态最近 50 条）
- 小公司过期 → 自动清理
- 开源 offer 过期 → 不可采纳
- IDEA_TECH_POOL 耗尽 → unique idea 跳过（不产出）
- 研究员疲劳 ≥ 100 → PolishTechCommand 仍可执行但效率低