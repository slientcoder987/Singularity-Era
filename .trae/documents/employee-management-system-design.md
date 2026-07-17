# 公司管理系统扩展设计

## Context

当前员工系统已有 5 种核心角色（researcher/data\_engineer/system\_engineer/product\_manager/legal\_pr）和 5 个固定部门，但缺少**公司管理**维度：玩家无法根据公司规模选择管理模式、无法任命高管、普通员工效率与公司管理结构无关。

本扩展新增第 6 种 StaffRole `MANAGER`、4 种可切换管理模式、4 个高管职位（CEO/COO/CFO/CTO）、管理效率公式，通过 `calcNormalEfficiency`（当前为预留扩展点，**经 rg 验证 0 处调用**）将管理效率乘到所有普通员工产出上。

**设计哲学**：

* 核心层零破坏 — `calcNormalEfficiency` 新增可选参数默认 1.0

* 数据驱动 — 所有模式/高管/技能走 `config/` 配置表

* 类型强制对齐 — `Record<StaffRole, X>` 表会自动暴露遗漏点（TS 编译强制）

***

## 一、核心数值与公式

### 1.1 管理人员角色配置

```typescript
// src/core/config/employees.ts
[StaffRole.MANAGER]: {
  displayName: '管理人员',
  baseSalary: 260_000,           // 高于 RESEARCHER 180k，L10 年薪 $780k
  attributeWeights: { leadership: 0.45, charisma: 0.25, intelligence: 0.15, stamina: 0.10, creativity: 0.05 },
  skillPool: ['executive_vision', 'cost_optimization', 'talent_development', 'team_coordination'],
}
```

`ROLE_PRIMARY_ATTR[MANAGER] = 'leadership'`、`ROLE_TO_STAFF_RESOURCE[MANAGER] = 'staff_manager'`。

### 1.2 4 种管理模式

| Mode       | 中文名  | 适合规模    | requiredManagers | baseEfficiency | switchCostBase | switchCostPerManager |
| ---------- | ---- | ------- | ---------------- | -------------- | -------------- | -------------------- |
| flat       | 扁平   | < 30    | 1                | 1.00           | $100k          | $5k                  |
| matrix     | 矩阵   | 30-100  | 3                | 1.05           | $300k          | $10k                 |
| divisional | 事业部  | 100-300 | 6                | 1.10           | $600k          | $15k                 |
| holding    | 控股集团 | > 300   | 10               | 1.15           | $1M            | $20k                 |

**切换冷却**：60 天
**切换成本公式**：`cost = switchCostBase + switchCostPerManager × 在职 core manager 数`

### 1.3 模式匹配度系数

| 当前模式 \ 实际规模 | small | medium | large | huge |
| ----------- | ----- | ------ | ----- | ---- |
| flat        | 1.00  | 0.85   | 0.70  | 0.55 |
| matrix      | 0.85  | 1.00   | 0.85  | 0.70 |
| divisional  | 0.70  | 0.85   | 1.00  | 0.85 |
| holding     | 0.55  | 0.70   | 0.85  | 1.00 |

差距档数 → 系数：0档=1.00, 1档=0.85, 2档=0.70, 3档=0.55

### 1.4 4 个高管职位

| 职位  | 最低等级 | 最低 leadership | 最低 charisma | 效率加成  | 系统加成              |
| --- | ---- | ------------- | ----------- | ----- | ----------------- |
| CEO | L8   | 75            | 70          | +3.0% | 员工士气下限 +5（不跌破 5）  |
| COO | L7   | 70            | 60          | +2.0% | 基础设施故障率额外 -5%（乘算） |
| CFO | L7   | 65            | 65          | +1.5% | 全员薪资支出 -3%（乘算）    |
| CTO | L8   | 70            | —           | +2.5% | 研发速度 +5%（乘算）      |

最大高管加成 = +9.0%（4 位全聘齐）

### 1.5 管理效率公式（核心）

```
finalEff = clamp(
  baseModeEfficiency × managerStaffingRatio × modeMatchFactor
    × (1 + executiveBonus.efficiencyBonus)
    × (1 + getCompanySkillBonus('management_efficiency')),
  0.5, 1.3
)
```

| 变量                   | 取值范围                     | 说明                                     |
| -------------------- | ------------------------ | -------------------------------------- |
| baseModeEfficiency   | {1.00, 1.05, 1.10, 1.15} | 由当前模式决定                                |
| managerStaffingRatio | \[0, 1.0]                | coreManagers / requiredManagers，封顶 1.0 |
| modeMatchFactor      | {1.00, 0.85, 0.70, 0.55} | 4×4 矩阵                                 |
| (1 + executiveBonus) | \[1.00, 1.09]            | 4 位高管全聘齐 = 1.09                        |
| (1 + skillBonus)     | \[1.00, 1.06+]           | 每个 executive\_vision 技能 +2%            |

**微小公司豁免**：`totalNormalStaff < 5` 时直接返回 1.0，给开局 5-10 天招聘窗口。

### 1.6 9 个验证场景

| # | 场景                   | 计算                                         | 结果        |
| - | -------------------- | ------------------------------------------ | --------- |
| 1 | 0 员工开局               | 微小豁免                                       | **1.00**  |
| 2 | 25 人 + CEO           | 1.00 × 1 × 1 × 1.03                        | **1.030** |
| 3 | 50 人欠员管理 (2/3)       | 1.05 × (2/3) × 1                           | **0.700** |
| 4 | 50 人完美管理 + 3 高管      | 1.05 × 1 × 1 × 1.075                       | **1.129** |
| 5 | 200 人事业部全高管          | 1.10 × 1 × 1 × 1.09                        | **1.199** |
| 6 | 500 人控股全高管           | 1.15 × 1 × 1 × 1.09                        | **1.254** |
| 7 | 350 人欠员 (4/10)       | 1.15 × 0.4 × 1 × 1.09 = 0.501 → clamp      | **0.500** |
| 8 | 200 人错配 flat (1/6)   | 1.00 × (1/6) × 0.70 × 1.03 = 0.121 → clamp | **0.500** |
| 9 | 1024×GB300 终局 + 3 技能 | 1.15 × 1 × 1 × 1.09 × 1.06 = 1.329 → clamp | **1.300** |

***

## 二、新增 3 个 manager 专属技能

```typescript
// src/core/config/employees.ts SKILL_CONFIG 追加
executive_vision:    { effect: { type: 'management_efficiency', value: 0.02 }, cost: 2, name: '战略视野' }
cost_optimization:   { effect: { type: 'salary_reduction',      value: 0.03 }, cost: 2, name: '成本优化' }
talent_development:  { effect: { type: 'training_speed',         value: 0.10 }, cost: 1, name: '人才发展' }
```

**与现有 11 个技能的协同**：3 个新 effect type 与现有 11 个 effect type 无冲突。

***

## 三、系统联动

### 3.1 calcNormalEfficiency 改造（向后兼容）

```typescript
// src/core/utils/employeeUtils.ts
export function calcNormalEfficiency(
  dept, departments, employees, region,
  managementEfficiency: number = 1.0,   // 新增可选参数
): number {
  const talentBonus = region ? (region.talentIndex - 50) / 100 : 0;
  return (1.0 + talentBonus)
    * departmentBonus(dept, employees)
    * companyCoordination(departments, employees)
    * managementEfficiency;
}
```

### 3.2 修改 crossSystemUtils.ts 中 11 个 getStaff\* 函数

让每个 `getStaff*` 函数内部乘以 `getManagementEfficiency(data)`，使所有依赖此函数的系统（Collection/Operations/Risk/InfraFailure/Research/Training）自动受益。

**注意**：`calcEmployeeEfficiency`（核心员工）**不修改** — 管理效率只乘到普通员工，核心员工已有 departmentBonus+coordination 双层加成。

### 3.3 新增 9 个跨系统查询函数（crossSystemUtils.ts）

```typescript
getManagementEfficiency(data)             // 0.5~1.3
getExecutiveBonus(data)                   // { efficiencyBonus, moraleFloor, infraFailureReduction, salaryDiscount, researchSpeedBonus }
getCompanyFatigueReduction(data)          // 0~0.5/day（普通 manager 数 × 0.05，封顶 0.5）
getTotalNormalHeadcount(data)             // 6 种 staff_* 资源之和
getCompanySalaryDiscount(data)            // 0 或 0.03（CFO）
getCompanyResearchSpeedBonus(data)        // 0 或 0.05（CTO）
getCompanyMoraleFloor(data)               // 0 或 5（CEO）
getCompanyInfraFailureReductionBonus(data)// 0 或 0.05（COO）
getCompanyTrainingSpeedBonus(data)        // manager 的 talent_development 技能累积
```

### 3.4 StaffSystem 改造点

* 离职/挖角时清理 executives 槽位

* `processDailyPayroll` 应用 CFO 薪资折扣：`dailyTotal × (1 - salaryDiscount)`

* 士气恢复应用 CEO floor：morale 不跌破 5

* 员工疲劳衰减应用普通 manager 加成：`fatigueGain -= getCompanyFatigueReduction × deltaDays`

***

## 四、GameState 新增字段与迁移

```typescript
// src/core/GameState.ts GameData 接口追加
managementMode: ManagementMode;                  // 默认 'flat'
managementModeChangedDay: number;                // 默认 -999
executives: ExecutiveAssignment;                 // { ceoId, cooId, cfoId, ctoId } 全 null
```

**迁移**（`src/core/Game.ts` migrateOldData 末尾追加）：

```typescript
if (data.managementMode === undefined) data.managementMode = 'flat';
if (data.managementModeChangedDay === undefined) data.managementModeChangedDay = -999;
if (data.executives === undefined) data.executives = { ceoId: null, cooId: null, cfoId: null, ctoId: null };
else {
  data.executives.ceoId ??= null;
  data.executives.cooId ??= null;
  data.executives.cfoId ??= null;
  data.executives.ctoId ??= null;
}
```

***

## 五、新增 Commands

新建文件 `src/core/commands/ManagementCommands.ts`：

* `SwitchManagementModeCommand(targetMode)` — 检查冷却 60 天 + 资金，扣费更新模式

* `AppointExecutiveCommand(role, employeeId)` — 校验等级/leadership/charisma + 槽位占用，任命高管

* `DismissExecutiveCommand(role)` — 解除高管职位（不解雇员工）

**现有命令修改**：

* `FireEmployeeCommand` — fire 员工时清理 executives 槽位

* `RegionCommands.ts:169` `roleBaseSalary` 补齐 `[StaffRole.MANAGER]: 150000`（TS 强制）

***

## 六、UI 改动

### 6.1 EmployeePanel 新增"管理"子标签

```typescript
type StaffTab = 'employees' | 'recruitment' | 'training' | 'departments' | 'management';
```

### 6.2 ManagementTab 组件（约 200 行）

* **顶部**：管理效率仪表盘（5 个堆叠彩色进度条 + 总值数字，显示 baseEff/ratio/match/exec/skill 拆解）

* **中部**：4 个模式按钮（显示规模范围、所需 manager 数、当前是否匹配，切换按钮在冷却/资金不足时 disabled）

* **下部**：4 张高管卡片（已任命显示属性，空缺显示满足条件的 MANAGER 下拉选择）

* **底部**：规模信息 + 推荐模式 + 切换冷却剩余天数

### 6.3 招聘 Tab 渠道守卫

`executive_search` 渠道仅当 `role === StaffRole.MANAGER` 时启用，否则禁用并提示。

***

## 七、改动文件清单

新建 2 个文件 + 修改 14 个文件，无删除：

| #  | 文件                                         | 类型                                                                                                |
| -- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1  | `src/core/entities/Employee.ts`            | 修改：MANAGER 枚举                                                                                     |
| 2  | `src/core/config/management.ts`            | **新建**：模式/高管/公式集中配置                                                                               |
| 3  | `src/core/config/employees.ts`             | 修改：ROLE\_CONFIG/SKILL\_CONFIG/ROLE\_TO\_STAFF\_RESOURCE/ROLE\_PRIMARY\_ATTR/RECRUITMENT\_CHANNELS |
| 4  | `src/core/config/resources.ts`             | 修改：staff\_manager 资源（maxValue=50）                                                                 |
| 5  | `src/core/GameState.ts`                    | 修改：GameData 新增 3 字段                                                                               |
| 6  | `src/core/utils/employeeUtils.ts`          | 修改：calcNormalEfficiency 新增可选参数                                                                    |
| 7  | `src/core/utils/crossSystemUtils.ts`       | 修改：11 个 getStaff\* 函数 + 9 个新查询函数                                                                  |
| 8  | `src/core/commands/ManagementCommands.ts`  | **新建**：3 个 Command                                                                                |
| 9  | `src/core/commands/FireEmployeeCommand.ts` | 修改：清理 executives                                                                                  |
| 10 | `src/core/commands/RegionCommands.ts`      | 修改：roleBaseSalary 补齐 MANAGER                                                                      |
| 11 | `src/core/systems/StaffSystem.ts`          | 修改：高管清理 + CFO 折扣 + CEO floor + manager 疲劳衰减                                                       |
| 12 | `src/core/systems/OperationsSystem.ts`     | 修改：L193-197、L269-270 补 staff\_manager 计数                                                          |
| 13 | `src/core/Game.ts`                         | 修改：migrateOldData 追加 3 字段迁移                                                                       |
| 14 | `src/main.tsx`                             | 修改：initialData 新增 3 字段                                                                            |
| 15 | `src/core/config/startupPresets.ts`        | 修改：balanced 预设追加 1 名 Lv5 MANAGER                                                                  |
| 16 | `src/ui/components/EmployeePanel.tsx`      | 修改：StaffTab 加 management + ManagementTab 组件 + 招聘渠道守卫                                              |

***

## 八、关键复用点

* **`getEmployeeMap`** (crossSystemUtils.ts:21) — WeakMap 缓存员工索引，新查询函数复用

* **`getCompanySkillBonus`** (crossSystemUtils.ts:260) — 自动累积同 effect.type 技能，新技能无需改逻辑

* **`departmentBonus`** **/** **`companyCoordination`** (employeeUtils.ts) — 高管加成与之乘法叠加，三层独立

* **`clamp`** (utils.ts) — 管理效率封顶 0.5\~1.3

* **`migrateOldData`** (Game.ts:123) — 已有 dataCollectionProjects/fundingRounds 先例

***

## 九、数值平衡分析

### 9.1 不同规模下的效率曲线（4 模式 + 全高管 + 3 技能）

| normal staff | flat      | matrix    | divisional | holding   | 最优         |
| ------------ | --------- | --------- | ---------- | --------- | ---------- |
| 0-4          | 1.000（豁免） | —         | —          | —         | flat       |
| 25           | **1.155** | 1.030     | 0.891      | 0.732     | flat       |
| 50           | 0.981     | **1.213** | 1.083      | 0.931     | matrix     |
| 100          | 0.808     | 1.030     | **1.273**  | 1.130     | divisional |
| 200          | 0.635     | 0.849     | **1.273**  | 1.130     | divisional |
| 350          | 0.635     | 0.849     | 1.083      | **1.300** | holding    |
| 500          | 0.635     | 0.849     | 1.083      | **1.300** | holding    |

每个规模档位都有清晰最优模式，错配惩罚 30%-50%。

### 9.2 切换经济性

* flat → divisional @200 人：成本 $675k，30 天回本（约 24 天）

* matrix → holding @350 人：成本 $1.16M，约 30 天回本

切换成本合理：不会随意切换，但错配下不切换会持续亏损。

### 9.3 manager 招聘经济性

* 猎头招 manager：$50k + 7 天 → L4-7

* 高管猎聘：$200k + 14 天 → L7-10（必出 1 个 8-10 级）

* L7 manager 年薪 $442k，CEO 加成 +3% 在 200 staff 下月增收 $30k，回收期 \~15 个月

***

## 十、验证方法

### 10.1 TypeScript 编译验证

```bash
npx tsc --noEmit
```

应零错误通过。所有 `Record<StaffRole, X>` 表强制补齐 MANAGER 项。

### 10.2 手动验证清单（pnpm dev）

1. **新开局**：选 balanced 预设 → 员工面板应见 1 名 Lv5 MANAGER
2. **任命 CEO**：管理 Tab → 任命 → 仪表盘显示 1.030
3. **切换模式**：50 normal staff 下 flat → matrix → 效率从 \~0.85 升到 1.213
4. **冷却验证**：刚切完立即再切 → 拒绝并提示"冷却剩余 X 天"
5. **错配惩罚**：200 staff 下保持 flat → 效率跌至 0.5 地板
6. **fire 高管**：fire CEO → executives.ceoId 自动 null，仪表盘刷新
7. **存档迁移**：旧版本 JSON 加载 → managementMode='flat'，无报错
8. **终局**：调试注入 350 staff\_manager + 10 个 L8 manager → 切 holding → 效率达 1.30 上限
9. **微小豁免**：开局 0-4 normal staff → 效率 1.00，不因无 manager 受罚

### 10.3 数据不变量

* `executives.ceoId === null || employees.find(e => e.id === executives.ceoId)?.role === MANAGER`

* 同一员工不能同时任 2 个高管槽位

* `managementModeChangedDay <= date`

* `0.5 <= getManagementEfficiency(data) <= 1.3`（totalNormalStaff >= 5 时）

***

## 十一、可扩展性

* **第 5 种管理模式**：在 `MANAGEMENT_MODES` 加一条 + `getModeMatchFactor` order 数组加一项（4×4 → 5×5 自动适配）

* **第 5 个高管职位**：在 `EXECUTIVE_CONFIGS` 加一条 + `ExecutiveAssignment` 加字段 + 迁移加 `??= null` 兜底

* **新 manager 技能**：在 `SKILL_CONFIG` 加一条，`getCompanySkillBonus` 自动累积

* **规模阈值调整**：仅改 `getCompanyScale` 一处

* **AI 竞争对手管理层**：CompetitorState 可仿照加字段，复用 `getManagementEfficiency`（需泛型化）

***

## 十二、执行顺序

1. 类型层（强制对齐）：`Employee.ts` + `employees.ts` + `resources.ts`
2. 配置层：新建 `management.ts`
3. 状态层：`GameState.ts` + `Game.ts` 迁移 + `main.tsx` initialData
4. 工具层：`employeeUtils.ts` + `crossSystemUtils.ts`
5. 命令层：新建 `ManagementCommands.ts` + 改 `FireEmployeeCommand` + `RegionCommands`
6. 系统层：`StaffSystem.ts` + `OperationsSystem.ts`
7. UI 层：`EmployeePanel.tsx` + `startupPresets.ts`
8. 验证：`npx tsc --noEmit` + 手动测试清单

