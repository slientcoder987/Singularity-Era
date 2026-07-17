# 员工系统 UI 收尾 — 管理标签页实现

## Summary

本 plan 是「公司管理系统」整体设计的最后一块拼图。前 7 项任务（工具层 / 命令层 / 系统层 / startupPresets）已全部完成并通过 TS 编译强检，仅剩 UI 层的 EmployeePanel 管理标签页和最终 tsc 验证。

本计划聚焦于：在 `EmployeePanel.tsx` 新增「管理」子标签，提供模式切换、高管任命、规模仪表盘的可视化入口，并对招聘渠道做角色守卫。完成后执行 `npx tsc --noEmit` 验证零错误。

---

## Current State Analysis

### 已完成（无需再改）

| # | 文件 | 完成内容 |
| - | ---- | -------- |
| 1 | `src/core/entities/Employee.ts` | StaffRole.MANAGER 枚举 |
| 2 | `src/core/config/management.ts` | 294 行完整配置 + 6 个纯函数 |
| 3 | `src/core/config/employees.ts` | MANAGER 角色 / 3 个技能 / executive_search 渠道 |
| 4 | `src/core/config/resources.ts` | staff_manager 资源 |
| 5 | `src/core/GameState.ts` | GameData 新增 managementMode / managementModeChangedDay / executives |
| 6 | `src/core/Game.ts` | migrateOldData 已追加 3 字段迁移 |
| 7 | `src/main.tsx` | initialData 已追加 |
| 8 | `src/core/utils/employeeUtils.ts` | calcNormalEfficiency 加可选参数 managementEfficiency |
| 9 | `src/core/utils/crossSystemUtils.ts` | 9 个新查询函数 + 7 个 getStaff* 乘管理效率 |
| 10 | `src/core/commands/ManagementCommands.ts` | 3 个 Command（Switch/Appoint/Dismiss） |
| 11 | `src/core/commands/FireEmployeeCommand.ts` | fire 时清理 executives 槽位 |
| 12 | `src/core/commands/RegionCommands.ts` | roleBaseSalary 补 MANAGER |
| 13 | `src/core/systems/StaffSystem.ts` | 5 处改动 + 挖角清理 |
| 14 | `src/core/systems/OperationsSystem.ts` | 2 处 staff 计数补 staff_manager |
| 15 | `src/core/config/startupPresets.ts` | balanced 预设加 1 名 Lv5 MANAGER |

### 待完成（本 plan 范围）

1. **EmployeePanel.tsx**：新增「管理」子标签 + ManagementTab 组件 + 招聘渠道守卫
2. **验证**：`npx tsc --noEmit` 零错误

### EmployeePanel.tsx 当前结构

- L1-38：imports（React / hooks / config / commands / styles）
- L40-47：`StaffTab` 类型 + `STAFF_TABS` 数组（4 个 tab）
- L54-124：`EmployeePanel` 主组件（tab 切换 + 4 个 tab 渲染分支）
- L130-230：`EmployeesTab`（员工列表）
- L244-396：`EmployeeCard`（员工卡片）
- L429-573：`RecruitmentTab`（招聘，含渠道按钮在 L471-491）
- L641-794：`TrainingTab`（培训）
- L806-981：`DepartmentsTab` + `DepartmentCard`（部门）

### 可用 CSS 类（已确认存在于 App.module.css）

- 布局：`devPanel` / `devTitle` / `devRow` / `devRowLabel` / `devHint` / `emptyHint` / `tabBody`
- 按钮：`btn` / `btnSm` / `btnWarn` / `btnActive` / `btnPrimary`
- 卡片：`empCard` / `empHeader` / `empName` / `empRole` / `empLevel` / `empInfo` / `empActions`
- 进度条：`bar` / `barLabel` / `barTrack` / `barFill`
- 筛选：`empFilter` / `empFilterBtn` / `empFilterBtnActive`
- 列表：`empList` / `deptCard`
- 输入：`select` / `input`

---

## Proposed Changes

### 一、修改 `src/ui/components/EmployeePanel.tsx`

#### 1.1 L40 StaffTab 类型扩展

**改动前**：
```typescript
type StaffTab = 'employees' | 'recruitment' | 'training' | 'departments';
```

**改动后**：
```typescript
type StaffTab = 'employees' | 'recruitment' | 'training' | 'departments' | 'management';
```

#### 1.2 L42-47 STAFF_TABS 追加 management 项

**改动前**：
```typescript
const STAFF_TABS: { key: StaffTab; label: string }[] = [
  { key: 'employees', label: '员工列表' },
  { key: 'recruitment', label: '招聘' },
  { key: 'training', label: '培训' },
  { key: 'departments', label: '部门' },
];
```

**改动后**（追加到末尾）：
```typescript
const STAFF_TABS: { key: StaffTab; label: string }[] = [
  { key: 'employees', label: '员工列表' },
  { key: 'recruitment', label: '招聘' },
  { key: 'training', label: '培训' },
  { key: 'departments', label: '部门' },
  { key: 'management', label: '管理' },
];
```

#### 1.3 文件头 imports 追加（在 L37 `formatCurrency` import 之后，L38 `styles` import 之前）

```typescript
import {
  SwitchManagementModeCommand,
  AppointExecutiveCommand,
  DismissExecutiveCommand,
} from '../../core/commands/ManagementCommands';
import {
  MANAGEMENT_MODES,
  EXECUTIVE_CONFIGS,
  EXECUTIVE_ROLES,
  getCompanyScale,
  getRecommendedMode,
  getModeMatchFactor,
  calcModeSwitchCost,
  MODE_SWITCH_COOLDOWN_DAYS,
  getExecutiveBonus,
  type ExecutiveRole,
  type ManagementMode,
} from '../../core/config/management';
import {
  getManagementEfficiency,
  getTotalNormalHeadcount,
} from '../../core/utils/crossSystemUtils';
```

**为什么这样组织 import**：
- 三组分别来自 commands / config / utils，与现有 import 风格一致
- `type` 修饰符分离类型导入，符合 TS 5.x 严格模式惯例
- `getExecutiveBonus` 直接从 management.ts 导入（无循环依赖，因 management.ts 是纯配置模块）

#### 1.4 主组件读取新增状态（L58-66 useGameState 块末尾追加）

在 `const date = useGameState((s) => s.date);` 之后追加：

```typescript
const managementMode = useGameState((s) => s.managementMode);
const managementModeChangedDay = useGameState((s) => s.managementModeChangedDay);
const executives = useGameState((s) => s.executives);
```

#### 1.5 主组件 tabBody 末尾追加 management 渲染分支

在 L114-120 `DepartmentsTab` 分支 `</div>` 之后、`</div>` (tabBody 闭合) 之前追加：

```tsx
<div style={{ display: tab === 'management' ? 'block' : 'none' }}>
  <ManagementTab
    game={game}
    employees={employees}
    funds={funds}
    date={date}
    managementMode={managementMode}
    managementModeChangedDay={managementModeChangedDay}
    executives={executives}
  />
</div>
```

#### 1.6 招聘 Tab 渠道守卫（L473-490 内层 .map 回调）

**改动前**（L474）：
```typescript
if (ch.id === 'internal_promote') return null;
```

**改动后**：
```typescript
if (ch.id === 'internal_promote') return null;
// executive_search 渠道仅对 MANAGER 角色开放
if (ch.id === 'executive_search' && role !== StaffRole.MANAGER) return null;
```

**为什么**：`executive_search` 渠道成本 20 万、等级范围 Lv7-10，仅服务于高管招聘。其他角色选用此渠道会浪费资金且生成的候选人等级过高，不符合岗位定位。

### 二、新增 ManagementTab 组件（文件末尾追加，约 180 行）

**位置**：在 `DepartmentCard` 组件闭合（L981 `}`）之后追加。

**组件签名**：

```typescript
interface ManagementTabProps {
  game: ReturnType<typeof useGame>;
  employees: Employee[];
  funds: number;
  date: number;
  managementMode: ManagementMode;
  managementModeChangedDay: number;
  executives: { ceoId: string | null; cooId: string | null; cfoId: string | null; ctoId: string | null };
}

function ManagementTab({
  game, employees, funds, date, managementMode, managementModeChangedDay, executives,
}: ManagementTabProps) { ... }
```

**4 个区块设计**：

#### 区块 1：规模与效率仪表盘（顶部摘要）

显示当前公司规模、模式、管理效率、匹配度等关键指标，让玩家一眼看清公司状态。

```tsx
<div className={styles.devRow}>
  <span className={styles.devRowLabel}>公司规模</span>
  <span className={styles.devHint}>
    {scaleDisplayName(scale)} · 普通员工 {totalNormal} 人 · 在职 Manager {coreManagers} 人
  </span>
</div>

<div className={styles.devRow}>
  <span className={styles.devRowLabel}>当前模式</span>
  <span className={styles.devHint}>
    {MANAGEMENT_MODES[managementMode].displayName} ·
    {' '}基础效率 ×{MANAGEMENT_MODES[managementMode].baseEfficiency.toFixed(2)} ·
    {' '}匹配度 ×{getModeMatchFactor(managementMode, scale).toFixed(2)} ·
    {' '}编制比 ×{staffingRatio.toFixed(2)}（{coreManagers}/{MANAGEMENT_MODES[managementMode].requiredManagers}）
  </span>
</div>

<div className={styles.devRow}>
  <span className={styles.devRowLabel}>管理效率</span>
  <span style={{ color: mgmtEff >= 1.0 ? '#7af0c0' : '#ffb454', fontWeight: 700 }}>
    ×{mgmtEff.toFixed(3)}
  </span>
  <span className={styles.devHint}>
    （影响 7 个 staff 加成系统：训练速度 / 训练稳定 / 研发速度 / 故障抑制 / 收入 / 法务 / 数据采集）
  </span>
</div>
```

**派生计算**（在组件顶部一次性算出）：
```typescript
const totalNormal = getTotalNormalHeadcount({ employees, resources, ... } as GameData);
// 注：getTotalNormalHeadcount 只读 data.resources，可传 readonly 快照
// 但更稳妥：用 useGameState((s) => s.resources) 直接拿 resources，自己求和
```

**实现细节**：为避免向查询函数传不完整 GameData，本组件**直接调用 `getManagementEfficiency(useGameState((s) => s))`** 不可行（hook 限制），所以改用：

```typescript
const data = useGameState((s) => s);  // 整个 GameData 快照
const totalNormal = getTotalNormalHeadcount(data);
const scale = getCompanyScale(totalNormal);
const mgmtEff = getManagementEfficiency(data);
const execBonus = getExecutiveBonus(data);
const coreManagers = employees.filter(
  (e) => e.role === StaffRole.MANAGER && e.status !== 'training',
).length;
const staffingRatio = Math.min(
  coreManagers / MANAGEMENT_MODES[managementMode].requiredManagers,
  1.0,
);
```

**注意**：`useGameState((s) => s)` 会订阅整个状态树，每次任何字段变化都会 re-render。在 ManagementTab 这种只展示派生指标的组件里可接受（与 DepartmentsTab 等同量级）。若担心性能可后续优化为 selector，本期不优化。

#### 区块 2：模式切换

展示 4 种模式卡片，玩家可点击切换。每张卡片显示：名称 / 描述 / 适合规模 / 基础效率 / 切换成本。

```tsx
<h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>管理模式切换</h4>

<div className={styles.devRow}>
  <span className={styles.devHint}>
    冷却期 {MODE_SWITCH_COOLDOWN_DAYS} 天 ·
    {' '}距上次切换 {date - managementModeChangedDay} 天
    {date - managementModeChangedDay < MODE_SWITCH_COOLDOWN_DAYS
      ? `（剩余 ${MODE_SWITCH_COOLDOWN_DAYS - (date - managementModeChangedDay)} 天）`
      : '（可切换）'}
  </span>
</div>

<div className={styles.empList}>
  {(Object.values(MANAGEMENT_MODES)).map((modeCfg) => {
    const isCurrent = modeCfg.id === managementMode;
    const cost = calcModeSwitchCost(modeCfg.id, coreManagers);
    const daysSince = date - managementModeChangedDay;
    const inCooldown = daysSince < MODE_SWITCH_COOLDOWN_DAYS;
    const insufficientFunds = funds < cost;
    const disabled = isCurrent || inCooldown || insufficientFunds;

    return (
      <div key={modeCfg.id} className={styles.empCard}>
        <div className={styles.empHeader}>
          <span className={styles.empName}>{modeCfg.displayName}</span>
          {isCurrent && <span className={styles.empRole}>当前</span>}
          <span className={styles.empLevel}>
            基础效率 ×{modeCfg.baseEfficiency.toFixed(2)}
          </span>
        </div>
        <div className={styles.empInfo}>
          <span>{modeCfg.description}</span>
        </div>
        <div className={styles.empInfo}>
          <span>所需 Manager: {modeCfg.requiredManagers} 人</span>
          <span>切换成本: {formatCurrency(cost)}</span>
        </div>
        <div className={styles.empActions}>
          <button
            className={`${styles.btn} ${styles.btnSm}`}
            disabled={disabled}
            onClick={() => game.executeCommand(new SwitchManagementModeCommand(modeCfg.id))}
            title={
              isCurrent ? '已是当前模式'
              : inCooldown ? `冷却中（剩余 ${MODE_SWITCH_COOLDOWN_DAYS - daysSince} 天）`
              : insufficientFunds ? '资金不足'
              : `切换到 ${modeCfg.displayName}，花费 ${formatCurrency(cost)}`
            }
          >
            {isCurrent ? '当前' : '切换'}
          </button>
        </div>
      </div>
    );
  })}
</div>

<div className={styles.devRow}>
  <span className={styles.devHint}>
    推荐模式：{MANAGEMENT_MODES[getRecommendedMode(scale)].displayName}（基于当前规模）
  </span>
</div>
```

#### 区块 3：高管任命

4 个高管槽位（CEO/COO/CFO/CTO），每个槽位显示：当前任职者 / 加成效果 / 任命下拉 / 解任按钮。

```tsx
<h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>高管任命</h4>

<div className={styles.devRow}>
  <span className={styles.devHint}>
    高管加成汇总：效率 +{(execBonus.efficiencyBonus * 100).toFixed(1)}% ·
    {' '}士气下限 {execBonus.moraleFloor} ·
    {' '}故障抑制 ×{(1 - execBonus.infraFailureReduction).toFixed(2)} ·
    {' '}薪资折扣 ×{(1 - execBonus.salaryDiscount).toFixed(2)} ·
    {' '}研发加成 ×{(1 + execBonus.researchSpeedBonus).toFixed(2)}
  </span>
</div>

<div className={styles.empList}>
  {EXECUTIVE_ROLES.map((role) => {
    const cfg = EXECUTIVE_CONFIGS[role];
    const slotKey = `${role}Id` as 'ceoId' | 'cooId' | 'cfoId' | 'ctoId';
    const appointedId = executives[slotKey];
    const appointed = appointedId
      ? employees.find((e) => e.id === appointedId) ?? null
      : null;

    // 候选人：MANAGER 角色 + 等级达标 + leadership 达标 + charisma 达标 + 未任其他高管槽
    const candidates = employees.filter((e) => {
      if (e.role !== StaffRole.MANAGER) return false;
      if (e.level < cfg.minLevel) return false;
      if (e.attributes.leadership < cfg.minLeadership) return false;
      if (cfg.minCharisma > 0 && e.attributes.charisma < cfg.minCharisma) return false;
      // 已任其他高管槽
      if (executives.ceoId === e.id && role !== 'ceo') return false;
      if (executives.cooId === e.id && role !== 'coo') return false;
      if (executives.cfoId === e.id && role !== 'cfo') return false;
      if (executives.ctoId === e.id && role !== 'cto') return false;
      return true;
    });

    return (
      <div key={role} className={styles.empCard}>
        <div className={styles.empHeader}>
          <span className={styles.empName}>{cfg.displayName}</span>
          <span className={styles.empLevel}>效率 +{(cfg.efficiencyBonus * 100).toFixed(1)}%</span>
          {appointed ? (
            <span style={{ color: '#7af0c0', fontSize: 12 }}>
              {appointed.name} Lv.{appointed.level} 领{appointed.attributes.leadership}
            </span>
          ) : (
            <span style={{ color: '#ff6b6b', fontSize: 12 }}>空缺</span>
          )}
        </div>
        <div className={styles.empInfo}>
          <span>
            要求: Lv{cfg.minLevel}+ / 领导力{cfg.minLeadership}+
            {cfg.minCharisma > 0 ? ` / 魅力${cfg.minCharisma}+` : ''}
          </span>
        </div>
        <div className={styles.empInfo}>
          <span>
            {cfg.moraleFloor ? `士气下限 ${cfg.moraleFloor}`
              : cfg.infraFailureReduction ? `故障抑制 ×${(1 - cfg.infraFailureReduction).toFixed(2)}`
              : cfg.salaryDiscount ? `薪资折扣 ×${(1 - cfg.salaryDiscount).toFixed(2)}`
              : cfg.researchSpeedBonus ? `研发加成 ×${(1 + cfg.researchSpeedBonus).toFixed(2)}`
              : '—'}
          </span>
        </div>
        <div className={styles.empActions}>
          <select
            className={styles.select}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                game.executeCommand(new AppointExecutiveCommand(role, e.target.value));
              }
            }}
            disabled={candidates.length === 0}
          >
            <option value="">
              {candidates.length === 0 ? '无合格候选人' : '-- 任命 --'}
            </option>
            {candidates.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} Lv.{e.level} 领{e.attributes.leadership}
                {cfg.minCharisma > 0 ? ` 魅${e.attributes.charisma}` : ''}
              </option>
            ))}
          </select>
          {appointed && (
            <button
              className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
              onClick={() => game.executeCommand(new DismissExecutiveCommand(role))}
            >
              解任
            </button>
          )}
        </div>
      </div>
    );
  })}
</div>
```

#### 区块 4：管理效率公式说明（折叠的可选区块）

为玩家提供公式透明度，但默认折叠避免噪音：

```tsx
<details style={{ marginTop: 16 }}>
  <summary className={styles.devRowLabel} style={{ cursor: 'pointer' }}>
    管理效率公式说明
  </summary>
  <div className={styles.devHint} style={{ padding: '8px 12px' }}>
    <div>finalEff = clamp(</div>
    <div style={{ paddingLeft: 16 }}>
      baseModeEff × staffingRatio × modeMatchFactor
    </div>
    <div style={{ paddingLeft: 16 }}>
      × (1 + execBonus) × (1 + skillBonus), 0.5, 1.3
    </div>
    <div>)</div>
    <div style={{ marginTop: 8 }}>
      · 微小公司豁免：普通员工 &lt; 5 人时直接 = 1.0
    </div>
    <div>· staffingRatio = min(在职Manager / 模式所需Manager, 1.0)</div>
    <div>· modeMatchFactor：模式与规模档位差距（0档=1.00 / 1档=0.85 / 2档=0.70 / 3档=0.55）</div>
    <div>· execBonus：4 位高管效率加成累加（CEO +3% / COO +2% / CFO +1.5% / CTO +2.5%）</div>
    <div>· skillBonus：executive_vision 技能累加（每个 +2%）</div>
  </div>
</details>
```

#### scaleDisplayName 辅助函数（组件外部定义）

```typescript
function scaleDisplayName(scale: CompanyScale): string {
  return { small: '小型', medium: '中型', large: '大型', huge: '巨型' }[scale];
}
```

**需要在 imports 追加**：
```typescript
import type { CompanyScale } from '../../core/config/management';
```

（合并到 1.3 节的 management.ts import 中）

---

## Assumptions & Decisions

1. **整状态订阅**：`useGameState((s) => s)` 一次性取整个 GameData 快照传给 `getManagementEfficiency` / `getExecutiveBonus` / `getTotalNormalHeadcount`。理由：3 个查询函数都接受完整 GameData，分散订阅反而增加 hook 数量和复杂度。ManagementTab 是低频 tab，re-render 成本可接受。

2. **不缓存派生值**：`mgmtEff` / `execBonus` / `coreManagers` 等在每次 render 时重算。员工数通常 < 100，O(n) 计算可忽略。

3. **候选人在 UI 层筛选**：`AppointExecutiveCommand` 已做服务端校验（等级/属性/槽位占用），UI 层再筛一次是为了避免渲染无效 option。双重校验符合「UI 友好 + 核心严谨」原则。

4. **渠道守卫只加一行**：`executive_search` 渠道在招聘 Tab 仅当 `role === StaffRole.MANAGER` 时渲染。MANAGER 角色是核心员工，走「候选人卡片」流程而非「普通员工批量招聘」流程，与现有 5 个核心角色一致。

5. **不新增 CSS 类**：ManagementTab 全部复用现有 `empCard` / `empHeader` / `empInfo` / `empActions` / `devRow` / `devHint` / `select` / `btn` / `btnSm` / `btnWarn` / `btnActive` / `empList` 等。保持视觉一致性。

6. **`details/summary` 用于公式说明**：原生 HTML 元素，无需额外 JS 状态管理，可访问性好。仅这一处使用原生标签，其他位置仍用受控 `useState`。

7. **不在 ManagementTab 显示「普通 Manager 招聘」入口**：MANAGER 既可作核心员工（通过 executive_search 渠道招聘），也可作普通员工（staff_manager 资源，批量招聘）。普通 Manager 招聘已在 RecruitmentTab 的「普通员工」区块覆盖（因 MANAGER 已加入 `ROLE_TO_STAFF_RESOURCE`）。ManagementTab 只管高管和模式，职责单一。

8. **高管候选人下拉的 `value=""` 重置**：每次选中后立即触发命令并 reset 为空字符串，避免下次打开仍显示上次选择。与 DepartmentCard 中「加入成员」select 的模式一致（见 L927-940）。

9. **MANAGER 角色筛选按钮已存在**：EmployeesTab 的角色筛选按钮通过 `Object.keys(ROLE_CONFIG)` 自动包含 MANAGER，无需额外改动。

---

## Verification Steps

### 1. TypeScript 编译验证

```powershell
npx tsc --noEmit
```

**预期**：零错误零警告。

**重点关注**：
- `StaffTab` 类型扩展后，所有 `tab === 'xxx'` 比较的 exhaustive 性
- `executives[slotKey]` 的类型断言（`as 'ceoId' | 'cooId' | 'cfoId' | 'ctoId'`）
- `CompanyScale` 类型导入是否正确
- `useGameState((s) => s)` 返回的 GameData 是否能直接传给 crossSystemUtils 函数

### 2. 手动验证清单（运行时）

启动 dev server 后切换到「员工系统 → 管理」标签，逐项检查：

- [ ] 仪表盘显示「普通员工 N 人 / 在职 Manager M 人 / 管理效率 ×X.XXX」
- [ ] 切换模式按钮：同模式 disabled / 冷却中 disabled + tooltip 显示剩余天数 / 资金不足 disabled
- [ ] 切换成功后扣费、模式更新、冷却开始
- [ ] 4 个高管卡片显示当前任职者或「空缺」
- [ ] 候选人下拉只列出等级和属性达标的 MANAGER
- [ ] 任命后立即更新显示，原占用者（若有）保留员工身份
- [ ] 解任按钮清空槽位但保留员工
- [ ] 公式说明 details 默认折叠，点击展开
- [ ] 招聘 Tab：选 MANAGER 时显示 executive_search 渠道，选其他角色时不显示

### 3. 数据不变量

- 切换模式不改变 employees 数组
- 任命/解任高管不改变 employees 数组（仅修改 executives 字段）
- 高管被 fire / 离职 / 挖角时，对应槽位自动清空（已在前 7 项任务实现）
- 管理效率在普通员工 < 5 时强制 = 1.0（开局豁免）

### 4. 边界场景

- **无 MANAGER 员工**：高管候选人下拉显示「无合格候选人」 disabled
- **资金不足切换模式**：按钮 disabled，tooltip 显示「资金不足」
- **冷却期内尝试切换**：按钮 disabled，tooltip 显示剩余天数
- **同一员工任命第二个高管槽**：候选下拉中不显示该员工（UI 层过滤 + Command 层兜底）
- **普通员工 0 人**：仪表盘显示「小型 · 普通员工 0 人」，管理效率 = 1.0（豁免）
