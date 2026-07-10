import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { AddResourceCommand } from '../../core/commands/AddResourceCommand';
import { PurchaseHardwareCommand } from '../../core/commands/PurchaseHardwareCommand';
import { BuildPowerPlantCommand } from '../../core/commands/BuildPowerPlantCommand';
import {
  COMPUTE_CARD_SPECS,
  getCardSpec,
} from '../../core/config/computeCards';
import {
  POWER_CONFIG,
} from '../../core/config/resources';
import {
  ROLE_CONFIG,
  ROLE_TO_STAFF_RESOURCE,
  CORE_EMPLOYEE_CAP_PER_ROLE,
  HIRE_COST,
  NORMAL_HIRE_COST,
  NORMAL_EMPLOYEE_SALARY,
} from '../../core/config/employees';
import { StaffRole } from '../../core/entities/Employee';
import { formatCurrency, formatResourceValue } from '../../core/utils';
import styles from '../styles/App.module.css';

/**
 * 资源分类类型
 *
 * 扩展方式：在此联合类型添加新分类，并在下面的 TAB_CONFIG 加配置，
 * 再实现对应的渲染函数即可。
 */
type ResourceTab = 'funds' | 'compute' | 'power' | 'staff';

interface TabConfig {
  key: ResourceTab;
  label: string;
  icon: string;
}

const TAB_CONFIG: TabConfig[] = [
  { key: 'funds', label: '资金', icon: '💰' },
  { key: 'compute', label: '算力', icon: '🧠' },
  { key: 'power', label: '电力', icon: '⚡' },
  { key: 'staff', label: '员工', icon: '👥' },
];

/**
 * ResourceDevPanel
 *
 * 资源管理面板，按分类查看：
 * - 资金：余额 + 每日收入/支出
 * - 算力：总 TFLOPS + 各显卡型号详情
 * - 电力：容量 + 耗电量 + 电站建造
 * - 员工：五类普通员工 + 核心员工数量统计
 */
export function ResourceDevPanel() {
  const game = useGame();
  const [tab, setTab] = useState<ResourceTab>('funds');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>资源系统 · 详情</h3>

      {/* 分类切换标签 */}
      <div className={styles.empFilter}>
        {TAB_CONFIG.map((t) => (
          <button
            key={t.key}
            className={`${styles.empFilterBtn} ${tab === t.key ? styles.empFilterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'funds' && <FundsTab game={game} />}
      {tab === 'compute' && <ComputeTab game={game} />}
      {tab === 'power' && <PowerTab game={game} />}
      {tab === 'staff' && <StaffTab game={game} />}
    </section>
  );
}

/* ============== 资金 ============== */

function FundsTab({ game }: { game: ReturnType<typeof useGame> }) {
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const employees = useGameState((s) => s.employees);
  const resourceMeta = useGameState((s) => s.resourceMeta);
  const resources = useGameState((s) => s.resources);
  const [fundAmount, setFundAmount] = useState(100_000);

  // ===== 每日支出 =====
  // 1. 核心员工日薪
  const coreDailySalary = employees.reduce((sum, e) => sum + e.salary / 365, 0);

  // 2. 普通员工日薪
  const humanResources = game.registry.getByCategory('human');
  const normalDailySalary = humanResources.reduce((sum, def) => {
    const count = resources[def.id] ?? 0;
    return sum + count * (NORMAL_EMPLOYEE_SALARY / 365);
  }, 0);

  // 3. 电费（基于在线卡数 + 基础设施耗电估算）
  let dailyPowerCost = 0;
  let dailyPowerConsumption = POWER_CONFIG.baseConsumptionKW;
  for (const spec of COMPUTE_CARD_SPECS) {
    const pool = (resourceMeta[spec.resourceId] as Array<{ status: string }>) ?? [];
    const onlineCount = pool.filter((c) => c.status === 'online').length;
    dailyPowerConsumption += onlineCount * spec.powerPerCard;
  }
  dailyPowerCost = dailyPowerConsumption * 24 * POWER_CONFIG.pricePerKWh;

  const totalDailyExpense = coreDailySalary + normalDailySalary + dailyPowerCost;

  // ===== 每日收入（暂无收入系统，占位 0） =====
  const totalDailyIncome = 0;
  const netDaily = totalDailyIncome - totalDailyExpense;

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>余额</span>
        <span className={styles.statValue} style={{ color: '#ffd76b', fontSize: '18px' }}>
          {formatCurrency(funds)}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>每日收入</span>
        <span className={styles.devHint} style={{ color: '#7af0c0' }}>
          +{formatCurrency(totalDailyIncome)}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>每日支出</span>
        <span className={styles.devHint} style={{ color: '#ffb454' }}>
          -{formatCurrency(totalDailyExpense)}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>支出明细</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 核心员工</span>
        <span className={styles.devHint}>{employees.length} 人 · -{formatCurrency(coreDailySalary)}/天</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 普通员工</span>
        <span className={styles.devHint}>
          {humanResources.reduce((s, d) => s + (resources[d.id] ?? 0), 0)} 人 · -{formatCurrency(normalDailySalary)}/天
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 电费</span>
        <span className={styles.devHint}>
          {dailyPowerConsumption.toFixed(2)} kW · -{formatCurrency(dailyPowerCost)}/天
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>净收支</span>
        <span className={styles.devHint} style={{ color: netDaily >= 0 ? '#7af0c0' : '#ffb454' }}>
          {netDaily >= 0 ? '+' : ''}{formatCurrency(netDaily)}/天
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>资金调整</span>
        <input
          className={styles.input}
          type="number"
          value={fundAmount}
          onChange={(e) => setFundAmount(Number(e.target.value) || 0)}
          style={{ width: '100px' }}
        />
        <button
          className={styles.btn}
          disabled={fundAmount <= 0}
          onClick={() => game.executeCommand(new AddResourceCommand('funds', fundAmount, 'dev: 注入资金'))}
        >
          + 增加
        </button>
        <button
          className={styles.btn}
          disabled={fundAmount <= 0 || funds < fundAmount}
          onClick={() => game.executeCommand(new AddResourceCommand('funds', -fundAmount, 'dev: 扣除资金'))}
        >
          - 减少
        </button>
      </div>
    </div>
  );
}

/* ============== 算力 ============== */

function ComputeTab({ game }: { game: ReturnType<typeof useGame> }) {
  const resources = useGameState((s) => s.resources);
  const funds = resources['funds'] ?? 0;
  const computePower = resources['compute_power'] ?? 0;
  const hardwareDefs = game.registry.getByCategory('hardware');
  const [buyQty, setBuyQty] = useState<Record<string, number>>({});

  // 总在线卡数 / 显存 / 带宽
  let totalCards = 0;
  let totalOnlineCards = 0;
  let totalMemoryGB = 0;
  let totalBandwidthGBs = 0;
  for (const def of hardwareDefs) {
    const count = resources[def.id] ?? 0;
    totalCards += count;
    totalOnlineCards += count; // 简化：所有卡默认在线（损坏的由系统扣除）
    const spec = getCardSpec(def.id);
    if (spec) {
      totalMemoryGB += count * spec.memoryGB;
      totalBandwidthGBs += count * spec.memoryBandwidth;
    }
  }

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>总算力</span>
        <span className={styles.statValue} style={{ color: '#a78bfa', fontSize: '18px' }}>
          {formatResourceValue(computePower, 'tflops')}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>显卡总数</span>
        <span className={styles.devHint}>{totalCards} 张（在线 {totalOnlineCards} 张）</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>总显存</span>
        <span className={styles.devHint}>{totalMemoryGB.toLocaleString()} GB</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>总带宽</span>
        <span className={styles.devHint}>{totalBandwidthGBs.toLocaleString()} GB/s</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>型号明细</span>
      </div>

      {hardwareDefs.length === 0 ? (
        <div className={styles.emptyHint}>暂无显卡型号</div>
      ) : (
        hardwareDefs.map((def) => {
          const spec = getCardSpec(def.id);
          const cardCount = resources[def.id] ?? 0;
          const tflopsContribution = spec ? cardCount * spec.tflopsPerCard : 0;
          return (
            <div key={def.id} className={styles.devRow}>
              <span className={styles.devRowLabel}>{def.uiConfig?.icon} {def.name}</span>
              <span className={styles.devHint}>
                {cardCount} 张 · {formatResourceValue(tflopsContribution, 'tflops')}
                {spec &&
                  ` · 单卡 ${spec.tflopsPerCard.toLocaleString()} TFLOPS · ${spec.memoryGB}GB · ${spec.memoryBandwidth}GB/s · NVLink ${spec.nvlinkBandwidth}GB/s · ${spec.powerPerCard}kW · ${spec.recommendedRole}`}
              </span>
              <input
                className={styles.input}
                type="number"
                min={1}
                step={1}
                value={buyQty[def.id] ?? 1}
                onChange={(e) => setBuyQty((prev) => ({ ...prev, [def.id]: Math.max(1, Number(e.target.value) || 1) }))}
                style={{ width: '50px' }}
              />
              <button
                className={styles.btn}
                disabled={spec ? funds < spec.unitCost * (buyQty[def.id] ?? 1) : true}
                onClick={() => game.executeCommand(new PurchaseHardwareCommand(def.id, buyQty[def.id] ?? 1))}
              >
                买 {buyQty[def.id] ?? 1} 张
                <span className={styles.devHint}>
                  （${(spec?.unitCost ?? 0).toLocaleString()}/张 · {spec?.deliveryDays}天 · 合计 ${((spec?.unitCost ?? 0) * (buyQty[def.id] ?? 1)).toLocaleString()}）
                </span>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ============== 电力 ============== */

function PowerTab({ game }: { game: ReturnType<typeof useGame> }) {
  const resources = useGameState((s) => s.resources);
  const resourceMeta = useGameState((s) => s.resourceMeta);

  const capacityKW = resources['power_kw'] ?? 0;
  const powerPlants =
    (resourceMeta['power_plants'] as Array<{ capacityKW: number; builtAt: number }>) ?? [];

  // 计算当前耗电
  let consumptionKW = POWER_CONFIG.baseConsumptionKW;
  for (const spec of COMPUTE_CARD_SPECS) {
    const pool = (resourceMeta[spec.resourceId] as Array<{ status: string }>) ?? [];
    const onlineCount = pool.filter((c) => c.status === 'online').length;
    consumptionKW += onlineCount * spec.powerPerCard;
  }

  const dailyCost = consumptionKW * 24 * POWER_CONFIG.pricePerKWh;
  const utilization = capacityKW > 0 ? (consumptionKW / capacityKW) * 100 : 0;
  const isShortage = consumptionKW > capacityKW;

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>电力容量</span>
        <span className={styles.statValue} style={{ color: '#ffb454', fontSize: '18px' }}>
          {capacityKW.toLocaleString()} kW
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>当前耗电</span>
        <span className={styles.devHint} style={{ color: isShortage ? '#ffb454' : '#e6f0ff' }}>
          {consumptionKW.toFixed(2)} kW
          {isShortage && ' · ⚠️ 电力不足！'}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>负载率</span>
        <span className={styles.devHint} style={{ color: utilization > 100 ? '#ffb454' : '#7af0c0' }}>
          {utilization.toFixed(1)}%
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>每日电费</span>
        <span className={styles.devHint}>-{formatCurrency(dailyCost)}/天</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>基础设施</span>
        <span className={styles.devHint}>{POWER_CONFIG.baseConsumptionKW} kW（机房/照明/冷却）</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>电站</span>
        <span className={styles.devHint}>{powerPlants.length} 座</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>操作</span>
        <button className={styles.btn} onClick={() => game.executeCommand(new BuildPowerPlantCommand(50))}>
          +50 kW 电站
          <span className={styles.devHint}>
            （${(50 * POWER_CONFIG.powerPlantCostPerKW).toLocaleString()}）
          </span>
        </button>
        <button className={styles.btn} onClick={() => game.executeCommand(new BuildPowerPlantCommand(200))}>
          +200 kW 电站
          <span className={styles.devHint}>
            （${(200 * POWER_CONFIG.powerPlantCostPerKW).toLocaleString()}）
          </span>
        </button>
      </div>
    </div>
  );
}

/* ============== 员工 ============== */

function StaffTab({ game }: { game: ReturnType<typeof useGame> }) {
  const employees = useGameState((s) => s.employees);
  const resources = useGameState((s) => s.resources);

  const humanResources = game.registry.getByCategory('human');
  const totalNormal = humanResources.reduce((sum, def) => sum + (resources[def.id] ?? 0), 0);
  const totalCore = employees.length;

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>总览</span>
        <span className={styles.devHint}>
          核心 {totalCore} 人 · 普通 {totalNormal} 人 · 合计 {totalCore + totalNormal} 人
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>核心员工</span>
        <span className={styles.devHint}>
          上限 {CORE_EMPLOYEE_CAP_PER_ROLE} 人/角色 · 招聘费 ${HIRE_COST.toLocaleString()}/人
        </span>
      </div>

      {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => {
        const count = employees.filter((e) => e.role === role).length;
        const cap = CORE_EMPLOYEE_CAP_PER_ROLE;
        return (
          <div key={`core-${role}`} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· {ROLE_CONFIG[role].displayName}</span>
            <span className={styles.devHint}>
              {count} / {cap} 人
            </span>
          </div>
        );
      })}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>普通员工</span>
        <span className={styles.devHint}>
          无上限 · 招聘费 ${NORMAL_HIRE_COST.toLocaleString()}/人 · 年薪 ${NORMAL_EMPLOYEE_SALARY.toLocaleString()}
        </span>
      </div>

      {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => {
        const staffId = ROLE_TO_STAFF_RESOURCE[role];
        const count = resources[staffId] ?? 0;
        return (
          <div key={`normal-${role}`} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· {ROLE_CONFIG[role].displayName}</span>
            <span className={styles.devHint}>{count} 人</span>
          </div>
        );
      })}
    </div>
  );
}
