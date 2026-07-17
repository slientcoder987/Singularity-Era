# 研发系统扩展设计 — 技术路线 / 成熟度 / 小公司收购

## Context

用户要求细化研发系统设计，核心需求：
1. **技术路线来源**：员工 idea + 开源公司开源 + 小公司技术收购（3 种渠道）
2. **科研需要研究员**：研究员应直接参与技术研发（当前 TechResearchSystem 不消耗研究员）
3. **市场中刷出小公司**：小公司拥有技术，购买即获得
4. **技术有成熟度**：同一技术越成熟效果越好（当前技术是二值状态：未解锁/已解锁）
5. **给出具体数值和公式**

### 用户确认的 3 项设计决策

1. **技术成熟度存储**：替换 `unlockedTechs: string[]` → `techMaturity: Record<string, number>`（0-100），maturity≥1 视为已解锁，effect 按 `maturity/100` 线性缩放。存档迁移：旧 unlockedTechs → maturity=50。
2. **员工 idea 产物**：混合模式 —— 80% 概率加速现有技术（成熟度 +5~15 或研发进度 +20%），20% 概率生成技术树外的「独有技术」。
3. **小公司实体**：新增独立 SmallCompany 实体（轻量级），每 14 天市场刷新 2-3 家，玩家直接购买技术（纯资金交易，无成功率）。

### 现有架构关键点（Phase 1 探索结论）

- **TechResearchSystem**：28 个预设技术（P0+P1+P2），单一研发队列，二值状态，不消耗研究员
- **ResearchProject**：已定义 `idea_generation` 类型但未实现；`experiment_validation` 已实现
- **CompetitorSystem**：8 家大型竞争对手，无「小公司」概念，无 technologies 字段
- **AcquireCompetitorCommand**：完整收购逻辑但不转移技术
- **员工技能**：`research_breakthrough` 已接入（+10% 研发速度）
- **GameState**：`unlockedTechs: string[]` / `researchingTech` / `activeTechEffects` / `researchProjects`

---

## 一、技术成熟度系统

### 1.1 数据结构变更（`src/core/GameState.ts`）

```typescript
// 替换 unlockedTechs: string[]
techMaturity: Record<string, number>;   // techId → 0~100

// researchingTech 扩展
researchingTech: {
  techId: string;
  progressDays: number;
  totalDays: number;
  researcherIds: string[];   // 新增：参与研发的研究员
  dailyCost: number;          // 新增：每日研发维持成本
} | null;

// 新增字段
pendingIdeas: TechIdea[];
smallCompanies: SmallCompany[];
openSourceOffers: OpenSourceOffer[];
acceptedIdeaTechs: IdeaTechNode[];        // 已接受的独有技术定义（持久化）
lastSmallCompanyRefreshDay: number;
lastOpenSourceDay: Record<string, number>; // per-competitor
```

### 1.2 存档迁移（`src/core/Game.ts` 的 `migrateOldData`）

```typescript
// unlockedTechs → techMaturity
if (Array.isArray(data.unlockedTechs) && !data.techMaturity) {
  data.techMaturity = {};
  for (const techId of data.unlockedTechs) data.techMaturity[techId] = 50;
  data.techMaturity['pretraining'] = 100;  // 初始技术置 100
  delete (data as any).unlockedTechs;
}
// researchingTech 补齐新字段
if (data.researchingTech && !Array.isArray(data.researchingTech.researcherIds)) {
  data.researchingTech.researcherIds = [];
  data.researchingTech.dailyCost = 0;
}
// 新字段补齐
data.pendingIdeas ??= [];
data.smallCompanies ??= [];
data.openSourceOffers ??= [];
data.acceptedIdeaTechs ??= [];
data.lastSmallCompanyRefreshDay ??= -999;
data.lastOpenSourceDay ??= {};
```

### 1.3 成熟度提升机制

| 来源 | 提升量 | 触发时机 |
|---|---|---|
| 研发完成 | 置 `maturity=50` | TechResearchSystem 完成判定 |
| 被动提升 - 训练使用 | +0.05/天 | TrainingSystem 中检测 project.techIds |
| 被动提升 - 实验使用 | +0.10/天 | ResearchSystem 中实验引用该架构 |
| 主动打磨 | +0.30/天 × (1 + sumInt/200) | 玩家投入研究员+资金（见 1.6） |
| idea 加速 | +5~15 一次性 | 员工 idea 转化为加速现有技术 |
| 开源采纳 | 置 `maturity=30` | 玩家采纳开源技术 |
| 小公司收购 | 置 `maturity=60` | 购买小公司技术 |

### 1.4 effect 缩放公式（新增 `src/core/utils/techEffectScale.ts`）

```typescript
/** 按 maturity/100 线性缩放 TechEffect */
export function scaleTechEffect(effect: TechEffect, maturity: number): TechEffect {
  if (maturity >= 100) return effect;
  const scale = maturity / 100;
  switch (effect.type) {
    case 'modify_base_score_E':
    case 'modify_base_score_A':
    case 'modify_base_score_B':
    case 'reduce_compute_cost':
    case 'reduce_memory':
    case 'improve_research_speed':
    case 'reduce_training_crash_risk':
    case 'improve_data_quality':
      return { ...effect, value: effect.value * scale };
    case 'capability_bonus':
      return { ...effect, bonus: effect.bonus * scale };
    case 'extend_context':
      // 上下文倍率特殊处理：1 + (multiplier - 1) * scale
      return { ...effect, multiplier: 1 + (effect.multiplier - 1) * scale };
    case 'enable_distillation':
      return { ...effect, efficiencyBonus: effect.efficiencyBonus * scale };
    // unlock_parallel_strategy / unlock_cluster_network 等解锁型不缩放（maturity≥1 即解锁）
    default:
      return effect;
  }
}
```

### 1.5 修改 `src/core/systems/TechResearchSystem.ts`

核心改动：
- 完成时 `draft.techMaturity[techId] = 50`（替代 `unlockedTechs.push`）
- 研究员加速公式（见第五节）
- 资金维持消耗：`dailyCost × deltaDays`
- 资金不足时暂停研发（不清空），emit `RESEARCH_PAUSED` 事件
- 完成后释放研究员（status='idle'）

### 1.6 主动打磨命令（新增 `PolishTechCommand`）

```typescript
export class PolishTechCommand implements Command {
  constructor(
    private readonly techId: string,
    private readonly researcherIds: string[],
    private readonly days: number = 7,
  ) {}
  // 校验：maturity≥1 且 <100；研究员有效性；资金
  // 公式：dailyGain = 0.30 × (1 + sumIntelligence/200)
  //       7 天预期增长 ≈ 2.1 ~ 4.2
  // 成本：$5000 × 研究员数 × 天数
  // 不锁定研究员状态（短期投入，不阻塞其他任务）
}
```

### 1.7 activeTechEffects 重构

- 新增工具函数 `getActiveTechEffects(data): TechEffect[]`：遍历 `techMaturity`，对每个 maturity≥1 的技术调用 `scaleTechEffect`
- 所有读取 `activeTechEffects` 的位置改为调用此函数
- `activeTechEffects` 字段保留以兼容旧存档，但不再写入

---

## 二、员工 idea 生成系统

### 2.1 数据结构（新增 `src/core/entities/TechIdea.ts`）

```typescript
export type IdeaKind = 'accelerate' | 'unique';

export interface TechIdea {
  id: string;
  sourceEmployeeId: string;
  generatedDay: number;
  kind: IdeaKind;
  targetTechId: string;
  value: number;        // accelerate: maturity加成或进度加成；unique: 初始maturity
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
}
```

### 2.2 idea 生成系统（新增 `src/core/systems/IdeaGenerationSystem.ts`）

**执行时机**：每 7 天判定一次（避免每日判定产生过多 idea），在 ResearchSystem 之前执行。

**idea 生成概率公式**：
```
P = clamp(0.05 + (intelligence - 50) × 0.003 + (creativity - 50) × 0.004 + level × 0.01, 0, 0.6) × eff
```

**idea 概率数值表**：

| 研究员等级 | 智力 | 创造力 | 效率 | 每周 P |
|---|---|---|---|---|
| L1 | 50 | 50 | 0.6 | 0.030 |
| L3 | 60 | 60 | 0.85 | 0.128 |
| L5 | 75 | 70 | 1.18 | 0.301 |
| L7 | 85 | 80 | 1.52 | 0.526 |
| L10 | 95 | 90 | 2.03 | 0.85（封顶 0.6 × 2.03） |

**idea 产物分布**：
- 80% `accelerate`：从未成熟技术中随机选一个（已解锁 maturity<100 或研发中）
  - 研发中技术：进度 +20%（绝对推进 totalDays × 0.2）
  - 已解锁技术：maturity +5~15（随机 + creativity/100 × 5）
- 20% `unique`：从 `IDEA_TECH_POOL` 随机选一个，接受后初始 maturity=30

**池大小限制**：pendingIdeas 最多 50 条，超限时过滤已处理 + 截断最近 50 条。

### 2.3 独有技术定义（扩展 `src/core/config/techTree.ts`）

```typescript
export interface IdeaTechNode extends TechNode {
  source: 'idea' | 'open_source' | 'small_company';
  isTransient?: boolean;
}

/** 独有技术候选池（idea 生成时随机选取） */
export const IDEA_TECH_POOL: IdeaTechNode[] = [
  { id: 'mixture_of_depths', name: 'MoD 混合深度', effect: { type: 'reduce_compute_cost', value: 0.08 }, ... },
  { id: 'sparse_attention_v2', name: '稀疏注意力 v2', effect: { type: 'extend_context', multiplier: 2 }, ... },
  { id: 'dynamic_routing', name: '动态路由', effect: { type: 'capability_bonus', capability: 'pragmatic_inference', bonus: 0.05 }, ... },
  // ... 共 8-12 个候选
];

/** 已生成的独有技术表（运行时填充，存档时通过 acceptedIdeaTechs 重建） */
export const IDEA_TECH_MAP: Record<string, IdeaTechNode> = {};
```

**关键技术决策**：独有技术一旦被玩家接受，就加入到 `techMaturity` 字典中。训练系统、能力计算系统无需修改逻辑，只需扩展 TECH_MAP 查询为 `TECH_MAP[id] ?? IDEA_TECH_MAP[id]`。

### 2.4 idea 处理命令（新增 `src/core/commands/IdeaCommands.ts`）

```typescript
export class AcceptIdeaCommand implements Command {
  constructor(private readonly ideaId: string) {}
  // accelerate + 研发中：progressDays += totalDays × 0.2
  // accelerate + 已解锁：techMaturity[id] += value
  // unique：注册到 IDEA_TECH_MAP + acceptedIdeaTechs，techMaturity[id] = 30
}

export class RejectIdeaCommand implements Command {
  constructor(private readonly ideaId: string) {}
  // 标记 status='rejected'，可选：产生者忠诚度 +2（被倾听）
}
```

### 2.5 存档持久化

- `acceptedIdeaTechs: IdeaTechNode[]` 存储已接受的独有技术定义
- 加载存档时重建 `IDEA_TECH_MAP`：`for (const t of data.acceptedIdeaTechs) IDEA_TECH_MAP[t.id] = t;`

---

## 三、开源公司开源机制

### 3.1 触发主体（修改 `src/core/systems/CompetitorSystem.ts`）

在 `simulateCompetitor` 内新增开源逻辑：
- 仅 `open_source` 策略公司触发（Menta / Mistral / ShallowFind）
- 频率：每 30~60 天开源一次（`cooldown = 30 + floor(random × 30)`）
- 记录 `lastOpenSourceDay[comp.id]`

### 3.2 开源技术池（新增 `src/core/config/openSourcePool.ts`）

```typescript
export const OPEN_SOURCE_TECH_POOL: IdeaTechNode[] = [
  { id: 'open_gqa', name: '开源 GQA', effect: { type: 'reduce_compute_cost', value: 0.05 }, source: 'open_source', ... },
  { id: 'open_quant_v2', name: '开源量化方案 v2', effect: { type: 'reduce_compute_cost', value: 0.10 }, source: 'open_source', ... },
  // ... 共 6-8 个候选
];
```

### 3.3 开源事件数据结构（新增 `src/core/entities/OpenSourceOffer.ts`）

```typescript
export interface OpenSourceOffer {
  id: string;
  techId: string;
  techName: string;
  techDescription: string;
  source: string;          // 竞争对手名称
  publishedDay: number;
  adoptionCost: number;     // $50k~$200k
  initialMaturity: 30;
  expiresDay: number;       // publishedDay + 14
  adoptedDay?: number;
}
```

### 3.4 数值表

| 参数 | 值 |
|---|---|
| 开源公司 | Menta / Mistral / ShallowFind（3 家） |
| 开源频率 | 每 30~60 天 / 家 |
| 采纳窗口 | 14 天 |
| 采纳成本 | $50k~$200k |
| 初始 maturity | 30 |
| 技术来源 | 60% 独有技术池 / 40% 主技术树未解锁技术 |

### 3.5 采纳命令（新增 `src/core/commands/OpenSourceCommands.ts`）

```typescript
export class AdoptOpenSourceCommand implements Command {
  constructor(private readonly offerId: string) {}
  // 校验：存在 / 未采纳 / 未过期 / 资金
  // 扣费，注册到 IDEA_TECH_MAP（如独有），techMaturity[id] = max(现有, 30)
  // 标记 adoptedDay
}
```

---

## 四、小公司技术收购系统

### 4.1 实体定义（新增 `src/core/entities/SmallCompany.ts`）

```typescript
export interface SmallCompany {
  id: string;
  name: string;
  technologies: string[];   // 1~3 个 techId
  valuation: number;         // 美元
  spawnedDay: number;
  lifespan: number;          // 30 天
  acquired: boolean;
  background: string;
}
```

### 4.2 市场刷新机制（新增 `src/core/systems/SmallCompanyMarketSystem.ts`）

```typescript
const SMALL_COMPANY_REFRESH_DAYS = 14;
const SMALL_COMPANY_SPAWN_MIN = 2;
const SMALL_COMPANY_SPAWN_MAX = 3;
const SMALL_COMPANY_LIFESPAN = 30;

// 每 14 天刷新 2~3 家小公司
// 每家拥有 1~3 个技术（从主技术树未解锁 + SMALL_COMPANY_TECH_POOL 中随机选）
// 估值公式：baseValuation($200k) + techCount × ($100k~$500k)
// 到期未购买则消失
```

### 4.3 小公司专属技术池（新增 `src/core/config/smallCompanyTech.ts`）

```typescript
export const SMALL_COMPANY_TECH_POOL: IdeaTechNode[] = [
  { id: 'sc_kv_cache_opt', name: 'KV Cache 压缩', effect: { type: 'reduce_memory', value: 0.08 }, source: 'small_company', ... },
  // ... 共 6-8 个候选
];
```

### 4.4 数值表

| 参数 | 值 |
|---|---|
| 刷新周期 | 14 天 |
| 刷新数量 | 2~3 家 |
| 生命周期 | 30 天 |
| 技术数量 | 1~3 个 |
| 估值范围 | $300k~$1.7M（基础 $200k + 每技术 $100k~$500k） |
| 转移初始 maturity | 60 |
| 收购成功率 | 100%（纯资金交易） |

### 4.5 收购命令（新增 `src/core/commands/SmallCompanyCommands.ts`）

```typescript
export class AcquireSmallCompanyCommand implements Command {
  constructor(private readonly companyId: string) {}
  // 校验：存在 / 未收购 / 未过期 / 资金
  // 扣费，转移所有技术（maturity=60），注册独有技术到 IDEA_TECH_MAP
  // 标记 acquired=true
}
```

---

## 五、研究员在技术研发中的角色

### 5.1 修改 `StartResearchCommand`（`src/core/commands/TechCommands.ts`）

```typescript
export class StartResearchCommand implements Command {
  constructor(
    private readonly techId: string,
    private readonly researcherIds: string[] = [],   // 新增参数
  ) {}
  // 校验：前置技术 maturity≥1；研究员有效性
  // 至少需要 1 名研究员（除非 tech.researchDays < 5 的轻量技术）
  // dailyCost = round(tech.researchCost / tech.researchDays × 0.1)
  // 锁定研究员：status='assigned', assignedProjectId=`tech-research-${techId}`
}
```

### 5.2 研究员加速公式（修改 `TechResearchSystem.ts`）

```typescript
const sumIntelligence = researchers.reduce((s, r) =>
  s + calcEmployeeEfficiency(r, ...) × r.attributes.intelligence, 0);

// 对数递减回报：0 智力=0, 100 智力=+100%, 300 智力≈+158%, 600 智力≈+200%
const researcherBoost = Math.log(1 + sumIntelligence / 100) / Math.log(2);

const ctoBonus = getCompanyResearchSpeedBonus(current);      // 0~0.05
const skillBonus = getCompanyResearchSpeed(current);          // research_breakthrough 技能
const autoResearchBonus = activeTechEffects
  .filter(e => e.type === 'improve_research_speed')
  .reduce((s, e) => s + e.value, 0);                          // auto_research +0.5
const mgmtEff = getManagementEfficiency(current);             // 0.5~1.3

const researchSpeedMult = (1 + researcherBoost + ctoBonus + skillBonus + autoResearchBonus) × mgmtEff;
const newProgress = research.progressDays + deltaDays × researchSpeedMult;
```

### 5.3 研发周期对比（以 rlhf researchDays=30 为例）

| 配置 | researchSpeedMult | 实际天数 |
|---|---|---|
| 无研究员 | 1.0 | 30 天 |
| 1×L5 研究员 | 1.91 | 15.7 天 |
| 3×L7 研究员 | 3.28 | 9.1 天 |
| 3×L7 + CTO + research_breakthrough + auto_research | 3.93 | 7.6 天 |
| 满配 5×L10 + CTO + 全加成 + mgmt 1.30 | 6.58 | 4.6 天 |

### 5.4 与现有 ResearchSystem 的关系

**不合并队列**：
- TechResearchSystem：一次只研发 1 个技术，资金+研究员长期投入
- ResearchSystem：并发 3 个实验项目，算力+研究员短期实验
- 二者使用不同的研究员（status='assigned' 即锁定，不可重复分配）

---

## 六、系统联动

### 6.1 联动图

```
玩家行为 → GameData.techMaturity (Record<techId, 0~100>)
              │
              ├─▶ getActiveTechEffects(data)  ← scaleTechEffect 按 maturity 缩放
              │      ├─▶ TrainingSystem        ← techIds 选取 + effect 缩放
              │      ├─▶ ResearchSystem        ← improve_research_speed 等
              │      ├─▶ CollectionSystem      ← improve_data_quality
              │      └─▶ capabilityCalc        ← archMatrix 按 maturity 缩放
              │
              ├─▶ IdeaGenerationSystem         ← 候选目标从未成熟技术中选
              │      └─▶ pendingIdeas → 玩家处理 → techMaturity +
              │
              ├─▶ TechResearchSystem           ← 研发完成置 maturity=50
              │      └─▶ uses getStaffResearchSpeedMultiplier + CTO + mgmtEff
              │
              ├─▶ CompetitorSystem             ← open_source 公司触发开源事件
              │      └─▶ openSourceOffers → 玩家采纳 → techMaturity=30
              │
              └─▶ SmallCompanyMarketSystem     ← 每 14 天刷新
                     └─▶ smallCompanies → 玩家收购 → techMaturity=60
```

### 6.2 被动成熟度提升（修改 `TrainingSystem.ts`）

```typescript
// 训练推进时，对 project.techIds 中已解锁的技术累积 maturity
state.update((draft) => {
  for (const techId of project.techIds) {
    if ((draft.techMaturity[techId] ?? 0) >= 1) {
      draft.techMaturity[techId] = Math.min(100,
        (draft.techMaturity[techId] ?? 0) + 0.05 × deltaDays);
    }
  }
});
```

### 6.3 技术效果缩放接入训练系统（修改 `TrainingSystem.ts`）

```typescript
// 原：techEffects = project.techIds.map(tid => TECH_MAP[tid].effect)
// 改为：按 maturity 缩放
const techEffects = project.techIds
  .map((tid) => {
    const node = TECH_MAP[tid] ?? IDEA_TECH_MAP[tid];
    if (!node) return null;
    const maturity = current.techMaturity[tid] ?? 0;
    if (maturity < 1) return null;
    return scaleTechEffect(node.effect, maturity);
  })
  .filter((e): e is TechEffect => e !== null);
```

### 6.4 统一查询工具（新增 `src/core/utils/techLookup.ts`）

```typescript
export function getTechNode(techId: string): TechNode | IdeaTechNode | null {
  return TECH_MAP[techId] ?? IDEA_TECH_MAP[techId] ?? null;
}
export function isTechUnlocked(data: GameData, techId: string): boolean {
  return (data.techMaturity[techId] ?? 0) >= 1;
}
export function getTechMaturity(data: GameData, techId: string): number {
  return data.techMaturity[techId] ?? 0;
}
```

所有 `unlockedTechs.includes(...)` 调用点改为 `isTechUnlocked(...)`（涉及 DataCommands / RiskCommands / TrainingCommands / capabilityCalc 等）。

---

## 七、数值平衡分析

### 7.1 资金流（开局 balanced 预设 $4M）

| 项目 | 成本 | 备注 |
|---|---|---|
| 起步技术 sft (15天) | $50k + $333/天 × 15 = $55k | 占开局资金 1.4% |
| 中端技术 rlhf (30天) | $200k + $667/天 × 30 = $220k | 占 5.5% |
| 高端技术 cev_alignment (60天) | $800k + $1.33k/天 × 60 = $880k | 占 22% |
| 打磨技术 7 天 × 1 研究员 | $35k | 单次 +2~3 maturity |
| 采纳开源技术 | $50k~$200k | 单次 |
| 收购小公司 | $300k~$1.7M | 单次，1~3 技术 |

### 7.2 成熟度提升速率

| 来源 | 单次/每日 | 累积到满级所需 |
|---|---|---|
| 研发完成 | 一次性置 50 | 还需 50 |
| 训练使用 | +0.05/天 | 1000 天（被动慢速） |
| 实验使用 | +0.10/天 | 500 天 |
| 主动打磨 7 天 × 3 研究员 | +2.5/次 | 20 次 × $105k = $2.1M |
| idea 加速 | +5~15/次 | 4~10 次 idea |
| 开源采纳 | 置 30 | 还需 70 |
| 小公司收购 | 置 60 | 还需 40 |

**设计目标**：技术满级为长期目标，被动+主动组合下，一个技术从解锁到满级约需 60~120 天。

---

## 八、文件修改清单

### 8.1 新建文件（17 个）

**实体层**：
- `src/core/entities/TechIdea.ts`
- `src/core/entities/SmallCompany.ts`
- `src/core/entities/OpenSourceOffer.ts`

**配置层**：
- `src/core/config/ideaTechPool.ts`（8~12 个独有技术）
- `src/core/config/openSourcePool.ts`（6~8 个开源技术）
- `src/core/config/smallCompanyTech.ts`（6~8 个小公司技术）
- `src/core/config/researchExtConfig.ts`（集中配置：刷新周期、生命周期、idea 概率参数）

**系统层**：
- `src/core/systems/IdeaGenerationSystem.ts`
- `src/core/systems/SmallCompanyMarketSystem.ts`

**命令层**：
- `src/core/commands/IdeaCommands.ts`（AcceptIdeaCommand / RejectIdeaCommand）
- `src/core/commands/OpenSourceCommands.ts`（AdoptOpenSourceCommand）
- `src/core/commands/SmallCompanyCommands.ts`（AcquireSmallCompanyCommand）

**工具层**：
- `src/core/utils/techEffectScale.ts`（scaleTechEffect / getEffectiveTechEffect）
- `src/core/utils/techLookup.ts`（getTechNode / isTechUnlocked / getTechMaturity）

**UI 层**：
- `src/ui/components/IdeaPanel.tsx`
- `src/ui/components/SmallCompanyMarketPanel.tsx`
- `src/ui/components/OpenSourcePanel.tsx`

### 8.2 修改文件（17 个）

| 文件 | 关键改动 |
|---|---|
| `src/core/GameState.ts` | `unlockedTechs` → `techMaturity`；新增 `pendingIdeas/smallCompanies/openSourceOffers/acceptedIdeaTechs/lastSmallCompanyRefreshDay/lastOpenSourceDay`；`researchingTech` 加 `researcherIds/dailyCost` |
| `src/core/Game.ts` | `migrateOldData` 迁移逻辑；`load` 后重建 `IDEA_TECH_MAP` |
| `src/core/systems/TechResearchSystem.ts` | 完成时 `techMaturity=50`；研究员加速；资金维持消耗 |
| `src/core/commands/TechCommands.ts` | `StartResearchCommand` 加 researcherIds；新增 `PolishTechCommand`；`CancelResearchCommand` 释放研究员 |
| `src/core/config/techTree.ts` | 新增 `IdeaTechNode` 接口、`IDEA_TECH_POOL`、`IDEA_TECH_MAP` |
| `src/core/utils/capabilityCalc.ts` | `calculateCapabilities` 签名改为 `techMaturity`；archMatrix 按 maturity 缩放 |
| `src/core/systems/TrainingSystem.ts` | techEffects 按 maturity 缩放；被动成熟度 +0.05/天 |
| `src/core/systems/ResearchSystem.ts` | experiment_validation 引用架构时被动 +0.10/天 |
| `src/core/systems/CompetitorSystem.ts` | open_source 公司触发开源事件 |
| `src/core/entities/Competitor.ts` | CompetitorState 新增 `technologies: string[]` |
| `src/core/commands/HostileCommands.ts` | AcquireCompetitorCommand 转移技术（maturity=40） |
| `src/core/commands/DataCommands.ts` | `unlockedTechs.includes` → `isTechUnlocked` |
| `src/core/commands/RiskCommands.ts` | 同上 |
| `src/core/commands/TrainingCommands.ts` | 同上 |
| `src/core/utils/crossSystemUtils.ts` | 新增 `getActiveTechEffects(data)` |
| `src/main.tsx` | systems 数组新增 `IdeaGenerationSystem` / `SmallCompanyMarketSystem`；initialData 新字段 |
| `src/ui/components/ResearchPanel.tsx` | TechTab 改造为 maturity 进度条；新增 idea/market/openSource tabs |

### 8.3 废弃字段

- `activeTechEffects`：保留兼容旧存档，不再写入，改为 `getActiveTechEffects(data)` 派生
- `unlockedTechs`：迁移期保留只读，新存档不再使用

---

## 九、验证场景（5 个关键数值推演）

### 场景 1：基础技术研发（无研究员）

- 第 0 天：balanced 预设，资金 $4M
- StartResearchCommand('sft', []) — sft researchDays=15, researchCost=$50k
  - dailyCost = $50k / 15 × 0.1 = $333/天
  - researchSpeedMult = 1.0
- 第 15 天：完成，`techMaturity['sft'] = 50`
  - effect 实际值 = 0.15 × 0.50 = 0.075（dialogue_fluency +7.5%）

### 场景 2：3 名 L7 研究员加速 rlhf

- 第 30 天：已有 3 名 L7 研究员（int 85, eff 1.52），sft maturity=50
- StartResearchCommand('rlhf', [r1, r2, r3]) — researchDays=30, researchCost=$200k
  - sumIntelligence = 3 × 85 × 1.52 = 387.6
  - researcherBoost = log2(1 + 3.876) = 2.28
  - researchSpeedMult = 1 + 2.28 = 3.28
- 实际天数 = 30 / 3.28 ≈ 9.15 天
- 第 39 天：完成，`techMaturity['rlhf'] = 50`

### 场景 3：idea 加速研发中技术

- 第 35 天（rlhf 研发中，进度 5/9.15 天 = 54.6%）：r1 触发 idea（P=0.526）
  - kind='accelerate', targetTechId='rlhf', value=0.20
- 第 36 天：AcceptIdeaCommand
  - newProgress = 5 + 9.15 × 0.20 = 6.83 天 → 进度 74.6%
- 第 38 天：完成 rlhf（节省约 1.83 天）

### 场景 4：开源采纳 + 打磨

- 第 60 天：Menta 开源 `open_gqa`（reduce_compute_cost 0.05），采纳成本 $100k
- 玩家采纳 → `techMaturity['open_gqa'] = 30`
  - effect 实际值 = 0.05 × 0.30 = 0.015（算力 -1.5%）
- 第 60~80 天：2 名 L5 研究员打磨 4 次（每次 5 天）
  - 每次增长 = 0.30 × (1 + 2×75/200) × 5 = 2.625
  - 4 次后 maturity = 30 + 10.5 = 40.5
- effect 实际值 = 0.05 × 0.405 = 0.020（算力 -2.0%）

### 场景 5：小公司收购 3 个技术

- 第 70 天：小公司市场刷新，出现「Nexus AI」（估值 $1.2M，technologies: ['quantization', 'sc_kv_cache_opt', 'open_gqa']）
- 第 75 天：玩家资金 $2.5M，AcquireSmallCompanyCommand
  - `techMaturity['quantization'] = 60`
  - `techMaturity['sc_kv_cache_opt'] = 60`（新注册）
  - `techMaturity['open_gqa'] = max(40.5, 60) = 60`（取较大）
- 节省：quantization 原本需研发 20 天 + $100k；sc_kv_cache_opt 仅小公司可获
- 总价值：3 个技术 × $200k+ 研发等价 ≈ $600k+，付出 $1.2M，溢价但即时获得

---

## 十、分阶段实施建议

本方案规模庞大（17 新建 + 17 修改），建议分 5 个 PR 提交：

### PR1 - 数据结构迁移（核心，不破现有功能）
- GameState 字段替换、Game.ts 迁移逻辑
- `techEffectScale.ts`、`techLookup.ts`、`getActiveTechEffects`
- 所有 `unlockedTechs.includes` 改为 `isTechUnlocked`
- **验证**：旧存档可正常加载，现有技术研发流程正常

### PR2 - 研究员接入研发
- TechResearchSystem 改造（研究员加速、资金维持）
- StartResearchCommand 扩展（researcherIds 参数）
- PolishTechCommand
- TrainingSystem 被动提升 + effect 缩放
- **验证**：研究员分配后研发加速，打磨提升 maturity

### PR3 - idea 系统
- IdeaGenerationSystem、IdeaCommands
- IDEA_TECH_POOL、IdeaPanel UI
- **验证**：研究员产出 idea，接受后加速/解锁技术

### PR4 - 开源机制
- CompetitorSystem 开源逻辑
- OPEN_SOURCE_TECH_POOL、AdoptOpenSourceCommand
- OpenSourcePanel UI
- **验证**：open_source 公司定期开源，玩家可采纳

### PR5 - 小公司市场
- SmallCompanyMarketSystem
- SMALL_COMPANY_TECH_POOL、AcquireSmallCompanyCommand
- SmallCompanyMarketPanel UI
- **验证**：每 14 天刷新小公司，收购转移技术

每个 PR 可独立通过 `npx tsc --noEmit` 验证 + 手动测试。

---

## 十一、假设与决策

1. **技术成熟度线性缩放**：`effect × maturity/100`。简单直观，玩家易理解。对数缩放（前期提升快）虽更真实但增加认知负担。
2. **idea 混合产物**：80% 加速现有 + 20% 独有技术。加速为主保证 idea 高频有用，独有技术为惊喜奖励丰富技术多样性。
3. **小公司独立实体**：不与 CompetitorSystem 耦合，避免影响现有 8 家大公司平衡。小公司纯技术交易，无收购成功率。
4. **研究员不强制要求**：`researchDays < 5` 的轻量技术无需研究员，避免开局卡死。中重型技术至少 1 名研究员。
5. **独有技术持久化**：通过 `acceptedIdeaTechs` 字段存储，加载时重建 `IDEA_TECH_MAP`。避免全局变量丢失。
6. **被动成熟度慢速**：训练使用 +0.05/天，满级需 1000 天。设计为长期累积，主动打磨才是主要提升方式。
7. **开源初始 maturity=30**：比研发完成（50）低，因为开源技术需要本地化适配。小公司收购 maturity=60，因为含专利/团队。
8. **不合并 TechResearchSystem 与 ResearchSystem**：保持单线程研发 + 并发实验的分离设计，符合研发故事。
9. **dailyCost 公式**：`researchCost / researchDays × 0.1`。总维持费约为一次性成本的 10%，避免资金充裕时无限研发。
10. **IDEA_TECH_MAP 全局变量风险**：通过 `acceptedIdeaTechs` 持久化 + 加载重建机制缓解。若未来需多存档切换，可改为 GameData 字段。

---

## Verification Steps

### 1. TypeScript 编译验证
```powershell
npx tsc --noEmit
```
**预期**：零错误零警告。

### 2. 存档迁移验证
- 加载旧存档（含 `unlockedTechs`）→ 验证 `techMaturity` 正确生成（maturity=50）
- 验证 `pretraining` 置 100
- 验证 `researchingTech` 补齐 `researcherIds` / `dailyCost`

### 3. 核心机制验证
- **成熟度缩放**：解锁 sft（maturity=50）后，dialogue_fluency 加成应为 0.15 × 0.5 = 0.075
- **研究员加速**：分配 3 名 L7 研究员，rlhf 研发天数应从 30 天降至 ~9 天
- **idea 生成**：L5+ 研究员每周有 30%+ 概率产出 idea
- **开源采纳**：open_source 公司每 30-60 天开源一次，采纳后 maturity=30
- **小公司收购**：每 14 天刷新 2-3 家，收购后技术 maturity=60

### 4. 系统联动验证
- 管理效率 < 1.0 时，研发速度应相应降低
- CTO 任命后，研发速度 +5%
- 训练模型时，project.techIds 中的技术每日 +0.05 maturity

### 5. 边界场景
- 无研究员时尝试研发中重型技术 → 拒绝
- 资金不足维持费 → 研发暂停（不清空）
- pendingIdeas 满 50 条 → 自动截断
- 小公司过期 → 自动清理
- 开源 offer 过期 → 不可采纳
