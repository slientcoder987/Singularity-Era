# 公司管理系统 — 剩余实现工作

## Context

`employee-management-system-design.md` 已被用户批准并完成约 60% 实现。本文件聚焦于**剩余工作**，无需重新设计。

### 已完成（无需再改）

| # | 文件 | 状态 |
| - | ---- | ---- |
| 1 | `src/core/entities/Employee.ts` | ✅ StaffRole.MANAGER 枚举已加 |
| 2 | `src/core/config/management.ts` | ✅ 完整配置 + 纯函数（294 行） |
| 3 | `src/core/config/employees.ts` | ✅ ROLE_CONFIG / SKILL_CONFIG / ROLE_TO_STAFF_RESOURCE / ROLE_PRIMARY_ATTR / executive_search 渠道已加 |
| 4 | `src/core/config/resources.ts` | ✅ staff_manager 资源已加 |
| 5 | `src/core/GameState.ts` | ✅ GameData 新增 3 字段 |
| 6 | `src/core/Game.ts` | ✅ migrateOldData 已追加 |
| 7 | `src/main.tsx` | ✅ initialData 已追加 |
| 8 | `src/core/utils/employeeUtils.ts` | ✅ calcNormalEfficiency 已加可选参数 managementEfficiency |
| 9 | `src/core/utils/crossSystemUtils.ts`（部分） | ✅ 末尾 9 个新查询函数已加（getManagementEfficiency 等） |

### 待完成（本 plan 范围）

1. **工具层收尾**：7 个现有 `getStaff*` 函数内部乘 `getManagementEfficiency(data)`
2. **命令层**：新建 `ManagementCommands.ts` + 改 `FireEmployeeCommand.ts` + `RegionCommands.ts`
3. **系统层**：改 `StaffSystem.ts` + `OperationsSystem.ts`
4. **UI 层**：改 `EmployeePanel.tsx` + `startupPresets.ts`
5. **验证**：`npx tsc --noEmit`

---

## 一、工具层收尾：crossSystemUtils.ts 7 个 getStaff* 函数

**位置**：`src/core/utils/crossSystemUtils.ts`

**原则**：管理效率只乘到「核心员工对系统的加成」结果上，不修改 `calcEmployeeEfficiency`。让所有依赖此函数的系统（Collection/Operations/Risk/InfraFailure/Research/Training）通过乘管理效率获得联动。

**待改的 7 个函数**（实测数量为 7，非原 design 文档中说的 11）：

| # | 函数名 | 行号 | 修改方式 |
| - | ------ | ---- | -------- |
| 1 | `getStaffTrainingSpeedMultiplier` | L62-78 | 末尾 `return 1.0 + totalBonus * diminishing;` → `* getManagementEfficiency(data)` |
| 2 | `getStaffTrainingStabilityBonus` | L86-93 | 末尾 `return Math.min(0.5, ...);` → `* getManagementEfficiency(data)` |
| 3 | `getStaffResearchSpeedMultiplier` | L100-110 | 末尾 `return 1.0 + Math.min(totalBonus, 1.0);` → `* getManagementEfficiency(data)` |
| 4 | `getStaffInfraFailureReduction` | L120-134 | 末尾 `return Math.max(0.3, ...);` → `* getManagementEfficiency(data)`（结果仍是故障率倍率，向下取更优） |
| 5 | `getStaffRevenueMultiplier` | L142-155 | 末尾 `return 1.0 + totalBonus * deptBonus;` → `* getManagementEfficiency(data)` |
| 6 | `getStaffLegalRiskReductionPerDay` | L162-175 | 末尾 `return total * deptBonus;` → `* getManagementEfficiency(data)` |
| 7 | `getDataEngineerBonus` | L220-249 | 仅 `speedMultiplier` 字段乘管理效率，`qualityBonus` 不变（质量不受管理影响） |

**改造示例**（函数 5）：
```typescript
export function getStaffRevenueMultiplier(data: GameData): number {
  const pms = getActiveStaffByRole(data, StaffRole.PRODUCT_MANAGER);
  if (pms.length === 0) return 1.0;

  const { dept } = getDepartment(data, 'product');
  const deptBonus = dept ? departmentBonus(dept, data.employees) : 1.0;

  let totalBonus = 0;
  for (const pm of pms) {
    const eff = calcEmployeeEfficiency(pm, data.departments, data.employees);
    totalBonus += eff * 0.03;
  }
  const mgmtEff = getManagementEfficiency(data);    // 新增
  return 1.0 + totalBonus * deptBonus * mgmtEff;    // 乘管理效率
}
```

**注意点**：
- 函数 1 已有「空员工早退返回 1.0」逻辑，乘管理效率在末尾统一乘（1.0 × mgmtEff = mgmtEff 也合理：无研究员时管理效率仍影响训练系统的「环境效率」）。决定统一在末尾乘。
- 函数 4 是「故障率倍率」(0.3~1.0)，乘管理效率后更低表示更好（故障率更低）。语义合理：管理越好，系统工程师对故障的抑制效果越强。
- 函数 2 返回 0~0.5 的稳定度加成，乘管理效率后保持同方向。

---

## 二、命令层

### 2.1 新建 `src/core/commands/ManagementCommands.ts`

包含 3 个 Command，遵循现有 Command 模式（`implements Command`，`execute(state, events)`）。

#### 2.1.1 SwitchManagementModeCommand

```typescript
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import {
  MANAGEMENT_MODES,
  MODE_SWITCH_COOLDOWN_DAYS,
  calcModeSwitchCost,
  type ManagementMode,
} from '../config/management';
import { StaffRole } from '../entities/Employee';

export class SwitchManagementModeCommand implements Command {
  constructor(public readonly targetMode: ManagementMode) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 1. 同模式直接拒绝
    if (current.managementMode === this.targetMode) {
      events.emit('MANAGEMENT_MODE_SWITCH_FAILED', { reason: 'same_mode', target: this.targetMode });
      return;
    }

    // 2. 冷却检查
    const daysSinceLast = current.date - current.managementModeChangedDay;
    if (daysSinceLast < MODE_SWITCH_COOLDOWN_DAYS) {
      events.emit('MANAGEMENT_MODE_SWITCH_FAILED', {
        reason: 'cooldown',
        remainingDays: MODE_SWITCH_COOLDOWN_DAYS - daysSinceLast,
      });
      return;
    }

    // 3. 在职核心 manager 数
    const coreManagers = current.employees.filter(
      (e) => e.role === StaffRole.MANAGER && e.status !== 'training',
    ).length;

    // 4. 成本计算
    const cost = calcModeSwitchCost(this.targetMode, coreManagers);

    // 5. 资金检查
    if ((current.resources['funds'] ?? 0) < cost) {
      events.emit('MANAGEMENT_MODE_SWITCH_FAILED', { reason: 'insufficient_funds', cost });
      return;
    }

    // 6. 执行
    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - cost;
      draft.managementMode = this.targetMode;
      draft.managementModeChangedDay = draft.date;
    });

    events.emit('MANAGEMENT_MODE_SWITCHED', {
      from: current.managementMode,
      to: this.targetMode,
      cost,
    });
  }
}
```

#### 2.1.2 AppointExecutiveCommand

```typescript
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { EXECUTIVE_CONFIGS, EXECUTIVE_ROLES, type ExecutiveRole } from '../config/management';

export class AppointExecutiveCommand implements Command {
  constructor(
    public readonly role: ExecutiveRole,
    public readonly employeeId: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const emp = current.employees.find((e) => e.id === this.employeeId);

    if (!emp) {
      events.emit('EXECUTIVE_APPOINT_FAILED', { role: this.role, reason: 'employee_not_found' });
      return;
    }

    const cfg = EXECUTIVE_CONFIGS[this.role];

    // 1. 等级检查
    if (emp.level < cfg.minLevel) {
      events.emit('EXECUTIVE_APPOINT_FAILED', { role: this.role, reason: 'level_too_low', required: cfg.minLevel, actual: emp.level });
      return;
    }

    // 2. leadership 检查
    if (emp.attributes.leadership < cfg.minLeadership) {
      events.emit('EXECUTIVE_APPOINT_FAILED', { role: this.role, reason: 'leadership_too_low' });
      return;
    }

    // 3. charisma 检查（CTO 为 0 表示不要求）
    if (cfg.minCharisma > 0 && emp.attributes.charisma < cfg.minCharisma) {
      events.emit('EXECUTIVE_APPOINT_FAILED', { role: this.role, reason: 'charisma_too_low' });
      return;
    }

    // 4. 槽位占用检查：同一员工不能同时任 2 个高管槽位
    for (const r of EXECUTIVE_ROLES) {
      const k = `${r}Id` as keyof typeof current.executives;
      if (current.executives[k] === this.employeeId) {
        events.emit('EXECUTIVE_APPOINT_FAILED', { role: this.role, reason: 'already_executive' });
        return;
      }
    }

    // 5. 执行任命（替换原占用者，原占用者保留员工身份）
    const slotKey = `${this.role}Id` as 'ceoId' | 'cooId' | 'cfoId' | 'ctoId';
    const previousId = current.executives[slotKey];
    state.update((draft) => {
      draft.executives[slotKey] = this.employeeId;
    });

    events.emit('EXECUTIVE_APPOINTED', {
      role: this.role,
      employeeId: this.employeeId,
      previousId,
    });
  }
}
```

#### 2.1.3 DismissExecutiveCommand

```typescript
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Command } from '../interfaces/Command';
import { type ExecutiveRole } from '../config/management';

export class DismissExecutiveCommand implements Command {
  constructor(public readonly role: ExecutiveRole) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const slotKey = `${this.role}Id` as 'ceoId' | 'cooId' | 'cfoId' | 'ctoId';
    const previousId = current.executives[slotKey];

    if (!previousId) {
      events.emit('EXECUTIVE_DISMISS_FAILED', { role: this.role, reason: 'slot_empty' });
      return;
    }

    state.update((draft) => {
      draft.executives[slotKey] = null;
    });

    events.emit('EXECUTIVE_DISMISSED', { role: this.role, previousId });
  }
}
```

### 2.2 修改 `src/core/commands/FireEmployeeCommand.ts`

在 L48 `draft.employees = draft.employees.filter(...)` 之前，追加 executives 槽位清理：

```typescript
// 清理高管槽位（设计：fire 高管时自动卸任）
const exec = draft.executives;
if (exec.ceoId === this.employeeId) exec.ceoId = null;
if (exec.cooId === this.employeeId) exec.cooId = null;
if (exec.cfoId === this.employeeId) exec.cfoId = null;
if (exec.ctoId === this.employeeId) exec.ctoId = null;
```

无需新增 import（executives 字段已在 GameData 中）。

### 2.3 修改 `src/core/commands/RegionCommands.ts`

**L169-175** 的 `roleBaseSalary: Record<StaffRole, number>` 当前缺 MANAGER，TS 严格模式下编译失败。补齐：

```typescript
const roleBaseSalary: Record<StaffRole, number> = {
  [StaffRole.RESEARCHER]: 120000,
  [StaffRole.DATA_ENGINEER]: 80000,
  [StaffRole.SYSTEM_ENGINEER]: 90000,
  [StaffRole.PRODUCT_MANAGER]: 100000,
  [StaffRole.LEGAL_PR]: 85000,
  [StaffRole.MANAGER]: 150000,           // 新增
};
```

注意：此处数值与 `ROLE_CONFIG.MANAGER.baseSalary=260_000` 不同。这是地区预设员工初始薪资表（与现有 5 个角色保持「地区折扣后」语义一致），沿用现有 pattern。`150000` 约为 `260_000 × 0.58`，与 `RESEARCHER 120k / 180k ≈ 0.67` 略低，反映 manager 在新地区起步薪资。

---

## 三、系统层

### 3.1 修改 `src/core/systems/StaffSystem.ts`

**5 处改动**：

#### 3.1.1 L18-19 后追加 import

```typescript
import {
  getCompanyMoraleFloor,
  getCompanyFatigueReduction,
  getCompanySalaryDiscount,
} from '../utils/crossSystemUtils';
```

#### 3.1.2 L55-57 士气恢复应用 CEO floor

```typescript
// 设计-12 修复：士气自然恢复放在所有事件冲击之后
const moraleFloor = getCompanyMoraleFloor(draft);  // 新增：CEO floor
if (draft.riskState.employeeMorale < 100) {
  draft.riskState.employeeMorale = Math.min(
    100,
    Math.max(moraleFloor, draft.riskState.employeeMorale + 0.1 * deltaDays),
  );
}
```

> 注意：`getCompanyMoraleFloor(draft)` 接受 GameData，draft 在 immer 中是 GameData 的可写版本，类型兼容。

#### 3.1.3 L82-90 疲劳衰减应用 manager 加成

将 `WORK_FATIGUE_BASE` 路径修改为减少 fatigue gain：

```typescript
if (emp.status === 'assigned') {
  // 普通 manager 减疲劳积累（HR 关怀、流程优化）
  const fatigueReduction = getCompanyFatigueReduction(draft);  // 0~0.5
  const baseGain = StaffSystem.WORK_FATIGUE_BASE * (100 / Math.max(emp.attributes.stamina, 1)) * deltaDays;
  const fatigueGain = Math.max(0, baseGain - fatigueReduction * deltaDays);
  emp.fatigue = clamp(emp.fatigue + fatigueGain, 0, 100);
  emp.monthlyWorkDays = (emp.monthlyWorkDays ?? 0) + deltaDays;
} else {
  emp.fatigue = clamp(emp.fatigue - StaffSystem.IDLE_FATIGUE_RECOVERY * deltaDays, 0, 100);
}
```

#### 3.1.4 L201-215 processDailyPayroll 应用 CFO 折扣

```typescript
private processDailyPayroll(state: GameState, events: EventBus, deltaDays: number, today: number): void {
  const current = state.read();
  const salaryDiscount = getCompanySalaryDiscount(current);  // 新增：CFO 折扣 0~0.03
  const dailyTotal = current.employees.reduce((sum, e) => sum + e.salary / 365, 0);
  const totalSalary = dailyTotal * deltaDays * (1 - salaryDiscount);  // 应用折扣

  if (totalSalary > 0) {
    state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) - totalSalary;
    });
    if (today > 0 && today % PAY_PERIOD_DAYS === 0) {
      events.emit('SALARY_PAID', dailyTotal * PAY_PERIOD_DAYS, current.employees.length);
    }
  }
}
```

#### 3.1.5 离职清理 executives（在 L145 `draft.employees = survivors;` 后）

```typescript
// 离职清理高管槽位
const resignedIds = new Set(resignList.map((r) => r.id));
if (resignedIds.size > 0) {
  const exec = draft.executives;
  if (exec.ceoId && resignedIds.has(exec.ceoId)) exec.ceoId = null;
  if (exec.cooId && resignedIds.has(exec.cooId)) exec.cooId = null;
  if (exec.cfoId && resignedIds.has(exec.cfoId)) exec.cfoId = null;
  if (exec.ctoId && resignedIds.has(exec.ctoId)) exec.ctoId = null;
}
```

#### 3.1.6 attemptPoaching 清理 executives（L287-292）

在 `state.update((draft) => { draft.employees = draft.employees.filter((e) => e.id !== empId); });` 中追加：

```typescript
state.update((draft) => {
  draft.employees = draft.employees.filter((e) => e.id !== empId);
  // 挖角清理高管槽位
  const exec = draft.executives;
  if (exec.ceoId === empId) exec.ceoId = null;
  if (exec.cooId === empId) exec.cooId = null;
  if (exec.cfoId === empId) exec.cfoId = null;
  if (exec.ctoId === empId) exec.ctoId = null;
});
```

**关于管理效率在 StaffSystem 中的应用**：StaffSystem 不直接乘管理效率到员工产出（因为 StaffSystem 只管理员工状态，不计算产出）。管理效率通过 crossSystemUtils 的 getStaff* 函数已作用于 Collection/Operations/Risk/InfraFailure/Research/Training 系统。StaffSystem 这里只需消费 CEO/CFO/manager 的衍生效果。

### 3.2 修改 `src/core/systems/OperationsSystem.ts`

**L191-197** 和 **L268-270** 两处 staff 计数补 `staff_manager`：

#### 3.2.1 L191-197（hire_staff 任务完成判定）

```typescript
case 'hire_staff': {
  const totalStaff = draft.employees.length
    + (draft.resources['staff_researcher'] ?? 0)
    + (draft.resources['staff_data_engineer'] ?? 0)
    + (draft.resources['staff_system_engineer'] ?? 0)
    + (draft.resources['staff_product_manager'] ?? 0)
    + (draft.resources['staff_legal_pr'] ?? 0)
    + (draft.resources['staff_manager'] ?? 0);   // 新增
  if (totalStaff >= (mission.targetHeadcount ?? Infinity)) completed = true;
  break;
}
```

#### 3.2.2 L268-270（generateBoardMission 规模判定）

```typescript
const totalStaff = draft.employees.length
  + (draft.resources['staff_researcher'] ?? 0)
  + (draft.resources['staff_data_engineer'] ?? 0)
  + (draft.resources['staff_system_engineer'] ?? 0)
  + (draft.resources['staff_product_manager'] ?? 0)
  + (draft.resources['staff_legal_pr'] ?? 0)
  + (draft.resources['staff_manager'] ?? 0);   // 新增
```

---

## 四、UI 层

### 4.1 修改 `src/core/config/startupPresets.ts`

`balanced` 预设（L51-65）追加 1 名 Lv5 MANAGER：

```typescript
{
  id: 'balanced',
  name: '均衡起步',
  description: '32 卡 H100 集群 + 完整团队（含 1 名管理骨干）。启动资金有限，需种子轮/VC 融资支撑扩张。',
  bonusFunds: 3_000_000,
  cards: [{ modelId: 'compute_h100', count: 32 }],
  employees: [
    { role: StaffRole.RESEARCHER, level: 7, count: 1 },
    { role: StaffRole.RESEARCHER, level: 5, count: 2 },
    { role: StaffRole.DATA_ENGINEER, level: 5, count: 2 },
    { role: StaffRole.SYSTEM_ENGINEER, level: 5, count: 1 },
    { role: StaffRole.PRODUCT_MANAGER, level: 5, count: 1 },
    { role: StaffRole.MANAGER, level: 5, count: 1 },          // 新增
  ],
},
```

### 4.2 修改 `src/ui/components/EmployeePanel.tsx`

#### 4.2.1 L35 StaffTab 类型扩展

```typescript
type StaffTab = 'employees' | 'recruitment' | 'training' | 'departments' | 'management';
```

#### 4.2.2 L37-42 STAFF_TABS 追加

```typescript
const STAFF_TABS: { key: StaffTab; label: string }[] = [
  { key: 'employees', label: '员工列表' },
  { key: 'recruitment', label: '招聘' },
  { key: 'training', label: '培训' },
  { key: 'departments', label: '部门' },
  { key: 'management', label: '管理' },           // 新增
];
```

#### 4.2.3 L93 后追加 management tab 渲染分支

参考其他 tab 的写法：
```tsx
<div style={{ display: tab === 'management' ? 'block' : 'none' }}>
  <ManagementTab game={game} />
</div>
```

#### 4.2.4 import 追加

```typescript
import { SwitchManagementModeCommand, AppointExecutiveCommand, DismissExecutiveCommand } from '../../core/commands/ManagementCommands';
import {
  MANAGEMENT_MODES,
  EXECUTIVE_CONFIGS,
  EXECUTIVE_ROLES,
  getCompanyScale,
  getRecommendedMode,
  getModeMatchFactor,
  calcModeSwitchCost,
  MODE_SWITCH_COOLDOWN_DAYS,
  type ExecutiveRole,
  type ManagementMode,
} from '../../core/config/management';
import { getManagementEfficiency, getTotalNormalHeadcount } from '../../core/utils/crossSystemUtils';
```

#### 4.2.5 招聘 Tab 守卫 executive_search 渠道（L473-490）

`executive_search` 渠道仅当 `role === StaffRole.MANAGER` 时启用：

```tsx
{(Object.values(RECRUITMENT_CHANNELS)).map((ch) => {
  if (ch.id === 'internal_promote') return null;
  // 新增：executive_search 仅 MANAGER 可用
  if (ch.id === 'executive_search' && role !== StaffRole.MANAGER) return null;
  const isFull = employees.filter((e) => e.role === role).length >= CORE_EMPLOYEE_CAP_PER_ROLE;
  return ( /* 原按钮 */ );
})}
```

#### 4.2.6 新增 ManagementTab 组件（约 150 行，文件末尾追加）

**结构**：
1. **顶部仪表盘**：显示当前管理效率 + 拆解信息（baseEff / staffingRatio / modeMatch / execBonus / skillBonus）
2. **管理模式区**：4 个模式卡片，显示规模范围 + 所需 manager 数 + 是否当前 + 切换按钮（冷却/资金不足时 disabled）
3. **高管任命区**：4 张高管卡片，已任命显示属性，空缺显示满足条件的 MANAGER 下拉选择
4. **底部信息**：规模档位 + 推荐模式 + 切换冷却剩余天数

**核心代码骨架**（精简版，完整代码在执行时写）：

```tsx
function ManagementTab({ game }: { game: ReturnType<typeof useGame> }) {
  const data = useGameState((s) => s);
  const mgmtEff = getManagementEfficiency(data);
  const totalNormalStaff = getTotalNormalHeadcount(data);
  const scale = getCompanyScale(totalNormalStaff);
  const recommendedMode = getRecommendedMode(scale);
  const modeMatch = getModeMatchFactor(data.managementMode, scale);
  const cooldownRemaining = Math.max(0, MODE_SWITCH_COOLDOWN_DAYS - (data.date - data.managementModeChangedDay));
  const coreManagers = data.employees.filter((e) => e.role === StaffRole.MANAGER && e.status !== 'training');
  const funds = data.resources['funds'] ?? 0;

  return (
    <div>
      {/* 1. 仪表盘 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>管理效率</span>
        <strong>{(mgmtEff * 100).toFixed(1)}%</strong>
        <span className={styles.devHint}>
          （规模: {scale} · 推荐: {MANAGEMENT_MODES[recommendedMode].displayName} · 匹配度: ×{modeMatch.toFixed(2)}）
        </span>
      </div>

      {/* 2. 模式切换 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>管理模式</span>
        {(Object.keys(MANAGEMENT_MODES) as ManagementMode[]).map((mode) => {
          const cfg = MANAGEMENT_MODES[mode];
          const isCurrent = data.managementMode === mode;
          const cost = calcModeSwitchCost(mode, coreManagers.length);
          const disabled = isCurrent || cooldownRemaining > 0 || funds < cost;
          return (
            <button
              key={mode}
              className={`${styles.btn} ${isCurrent ? styles.btnActive : ''}`}
              disabled={disabled}
              onClick={() => game.executeCommand(new SwitchManagementModeCommand(mode))}
              title={cfg.description}
            >
              {cfg.displayName}
              <span className={styles.devHint}>
                {' '}({cfg.scaleRange[0]}-{cfg.scaleRange[1] === Infinity ? '∞' : cfg.scaleRange[1]}人 · 需{cfg.requiredManagers}管理 · ${cost.toLocaleString()})
              </span>
            </button>
          );
        })}
      </div>
      {cooldownRemaining > 0 && (
        <div className={styles.devHint}>切换冷却剩余 {cooldownRemaining} 天</div>
      )}

      {/* 3. 高管任命 */}
      {EXECUTIVE_ROLES.map((role) => {
        const cfg = EXECUTIVE_CONFIGS[role];
        const slotKey = `${role}Id` as 'ceoId' | 'cooId' | 'cfoId' | 'ctoId';
        const appointedId = data.executives[slotKey];
        const appointed = appointedId ? data.employees.find((e) => e.id === appointedId) : null;
        // 满足条件的候选人
        const candidates = coreManagers.filter((m) => {
          if (m.id === appointedId) return false;
          if (Object.values(data.executives).includes(m.id)) return false;
          if (m.level < cfg.minLevel) return false;
          if (m.attributes.leadership < cfg.minLeadership) return false;
          if (cfg.minCharisma > 0 && m.attributes.charisma < cfg.minCharisma) return false;
          return true;
        });

        return (
          <div key={role} className={styles.devRow}>
            <span className={styles.devRowLabel}>{cfg.displayName}</span>
            {appointed ? (
              <>
                <span>{appointed.name} (L{appointed.level} · 领导力{appointed.attributes.leadership})</span>
                <button
                  className={styles.btn}
                  onClick={() => game.executeCommand(new DismissExecutiveCommand(role))}
                >
                  解任
                </button>
              </>
            ) : (
              <>
                <span className={styles.devHint}>空缺（需 L{cfg.minLevel}+ · 领导力{cfg.minLeadership}+{cfg.minCharisma > 0 ? ` · 魅力${cfg.minCharisma}+` : ''}）</span>
                {candidates.length === 0 ? (
                  <span className={styles.devHint}>无符合条件的管理人员</span>
                ) : (
                  <select
                    className={styles.input}
                    onChange={(e) => {
                      if (e.target.value) {
                        game.executeCommand(new AppointExecutiveCommand(role, e.target.value));
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">选择管理人员...</option>
                    {candidates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (L{m.level} · 领导力{m.attributes.leadership} · 魅力{m.attributes.charisma})
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* 4. 规模信息 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>规模信息</span>
        <span className={styles.devHint}>
          普通员工总数: {totalNormalStaff} 人 · 核心 manager: {coreManagers.length} 人
        </span>
      </div>
    </div>
  );
}
```

---

## 五、验证

### 5.1 TypeScript 编译

```bash
npx tsc --noEmit
```

应零错误通过。关键 TS 强制点：
- `Record<StaffRole, number>` 在 RegionCommands.ts L169 — 必须补 MANAGER
- `Record<StaffRole, RoleConfig>` 在 employees.ts — 已补
- `Record<StaffRole, string>` 在 ROLE_TO_STAFF_RESOURCE — 已补

### 5.2 手动验证清单（pnpm dev）

参考原 design 文档第 10.2 节的 9 项验证：
1. balanced 预设开局 → 员工列表见 1 名 Lv5 MANAGER
2. 任命 CEO → 仪表盘显示管理效率 +3%
3. 50 normal staff 下 flat → matrix → 效率提升
4. 冷却期内切换被拒
5. 200 staff 下保持 flat → 效率跌至 0.5 地板
6. fire CEO → executives.ceoId 自动 null
7. 旧存档加载 → managementMode='flat' 无报错
8. 调试注入 350 staff_manager + 10 个 L8 manager → 切 holding → 效率 1.30
9. 0-4 normal staff → 效率 1.00

### 5.3 数据不变量

- `executives.ceoId === null || employees.find(e => e.id === executives.ceoId)?.role === MANAGER`
- 同一员工不能同时任 2 个高管槽位（AppointExecutiveCommand 校验）
- `0.5 <= getManagementEfficiency(data) <= 1.3`（totalNormalStaff >= 5 时）
- `managementModeChangedDay <= date`

---

## 六、执行顺序

1. **工具层**：crossSystemUtils.ts 7 个 getStaff* 函数乘管理效率
2. **命令层**：
   a. 新建 ManagementCommands.ts（3 个 Command）
   b. 改 FireEmployeeCommand.ts（executives 清理）
   c. 改 RegionCommands.ts（roleBaseSalary 补 MANAGER）
3. **系统层**：
   a. 改 StaffSystem.ts（5 处改动 + 挖角清理）
   b. 改 OperationsSystem.ts（2 处 staff_manager 计数）
4. **UI 层**：
   a. 改 startupPresets.ts（balanced 加 MANAGER）
   b. 改 EmployeePanel.tsx（StaffTab 扩展 + ManagementTab 组件 + 渠道守卫）
5. **验证**：`npx tsc --noEmit`

---

## 七、假设与决策

1. **管理效率乘到核心员工对系统的加成**：原 design 文档 3.2 节明确要求。语义解释为「管理效率影响公司整体运营环境，包括核心员工推动系统的实际效果」。`calcEmployeeEfficiency` 不修改。

2. **行号校正**：原 design 文档写「L193-197、L269-270 补 staff_manager 计数」，实际为 L191-197 和 L268-270。已校正。

3. **roleBaseSalary[MANAGER] = 150000**：与 ROLE_CONFIG.MANAGER.baseSalary=260_000 不一致，但与 RegionCommands 中其他 5 个角色保持「地区折扣后」pattern（如 RESEARCHER 此表 120k vs ROLE_CONFIG 180k ≈ 0.67）。MANAGER 150k/260k ≈ 0.58，反映 manager 起步薪资相对更低（地区差异）。

4. **StaffSystem 不直接乘管理效率到员工产出**：StaffSystem 只管理状态（疲劳/忠诚/经验/培训/离职/发薪），不计算产出。管理效率通过 crossSystemUtils 的 getStaff* 函数已作用于其他系统。

5. **UI ManagementTab 简化版**：不实现彩色堆叠进度条（CSS 复杂度高），改为文字拆解显示 5 个乘子。如需可视化可后续迭代。

6. **executive_search 渠道守卫**：仅 MANAGER 角色可选；非 MANAGER 角色时此渠道按钮不渲染（返回 null）。

7. **挖角清理 executives**：原 design 文档未明确提及，但语义必要（员工被挖走时高管槽位应自动清空）。补在 attemptPoaching 中。

8. **getStaff* 函数数量**：原 design 文档说 11 个，实测为 7 个（getStaffTrainingSpeedMultiplier / getStaffTrainingStabilityBonus / getStaffResearchSpeedMultiplier / getStaffInfraFailureReduction / getStaffRevenueMultiplier / getStaffLegalRiskReductionPerDay / getDataEngineerBonus）。其他 getCompany* 函数计算的是公司范围技能加成，与管理效率语义重叠，不再乘。

9. **useGameState 选择器**：UI 中 `useGameState((s) => s)` 返回完整 state，性能上非最优但当前代码库其他 Tab 也用类似模式（如 `useGameState((s) => s.employees)`）。ManagementTab 需要访问 executives/employees/resources/departments 多字段，整对象订阅更简洁。如出现性能问题再优化为多订阅。