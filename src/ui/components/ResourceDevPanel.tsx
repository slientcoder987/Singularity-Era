import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { AddResourceCommand } from '../../core/commands/AddResourceCommand';
import { PurchaseHardwareCommand } from '../../core/commands/PurchaseHardwareCommand';
import { BuildPowerPlantCommand } from '../../core/commands/BuildPowerPlantCommand';
import { HARDWARE_SPECS, POWER_CONFIG } from '../../core/config/resources';
import { ROLE_CONFIG, ROLE_TO_STAFF_RESOURCE } from '../../core/config/employees';
import { StaffRole } from '../../core/entities/Employee';
import { formatCurrency, formatResourceValue } from '../../core/utils';
import styles from '../styles/App.module.css';

/**
 * ResourceDevPanel
 *
 * 资源管理面板：
 * - 资金操作
 * - 算力总览 + 各硬件型号详情（数量、算力贡献、采购）
 * - 电力容量 + 电站建造
 * - 普通员工分类统计
 */
export function ResourceDevPanel() {
  const game = useGame();
  const resources = useGameState((s) => s.resources);
  const resourceMeta = useGameState((s) => s.resourceMeta);

  const computePower = resources['compute_power'] ?? 0;
  const powerKW = resources['power_kw'] ?? 0;
  const funds = resources['funds'] ?? 0;

  // 硬件详情
  const hardwareDefs = game.registry.getByCategory('hardware');
  const powerPlants = (resourceMeta['power_plants'] as Array<{ capacityKW: number; builtAt: number }>) ?? [];

  // 普通员工详情
  const humanResources = game.registry.getByCategory('human');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>资源系统 · 详情</h3>

      {/* 资金 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>💰 资金</span>
        <span className={styles.statValue} style={{ color: '#ffd76b', fontSize: '18px' }}>
          {formatCurrency(funds)}
        </span>
        <button className={styles.btn} onClick={() => game.executeCommand(new AddResourceCommand('funds', 100_000, 'dev: 注入资金'))}>
          +$100,000
        </button>
        <button className={styles.btn} onClick={() => game.executeCommand(new AddResourceCommand('funds', -50_000, 'dev: 扣除资金'))}>
          -$50,000
        </button>
      </div>

      {/* 算力 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>🧠 算力</span>
        <span className={styles.statValue} style={{ color: '#a78bfa', fontSize: '18px' }}>
          {formatResourceValue(computePower, 'tflops')}
        </span>
      </div>

      {/* 各硬件型号详情 */}
      {hardwareDefs.map((def) => {
        const spec = HARDWARE_SPECS.find((s) => s.resourceId === def.id);
        const cardCount = resources[def.id] ?? 0;
        const tflopsContribution = spec ? cardCount * spec.tflopsPerCard : 0;
        return (
          <div key={def.id} className={styles.devRow}>
            <span className={styles.devRowLabel}>{def.uiConfig?.icon} {def.name}</span>
            <span className={styles.devHint}>
              {cardCount} 张 · 提供 {formatResourceValue(tflopsContribution, 'tflops')}
              {spec && ` · 单卡 ${spec.tflopsPerCard.toLocaleString()} TFLOPS · ${spec.powerPerCard} kW`}
            </span>
            <button
              className={styles.btn}
              onClick={() => game.executeCommand(new PurchaseHardwareCommand(def.id, 1))}
            >
              买 1 张
              <span className={styles.devHint}>（${spec?.unitCost.toLocaleString()} · {spec?.deliveryDays}天交付）</span>
            </button>
          </div>
        );
      })}

      {/* 电力 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>⚡ 电力容量</span>
        <span className={styles.devHint}>
          {powerKW.toLocaleString()} kW
          {powerPlants.length > 0 && ` · ${powerPlants.length} 座电站`}
        </span>
        <button
          className={styles.btn}
          onClick={() => game.executeCommand(new BuildPowerPlantCommand(50))}
        >
          +50 kW 电站
          <span className={styles.devHint}>（${(50 * POWER_CONFIG.powerPlantCostPerKW).toLocaleString()}）</span>
        </button>
        <button
          className={styles.btn}
          onClick={() => game.executeCommand(new BuildPowerPlantCommand(200))}
        >
          +200 kW 电站
          <span className={styles.devHint}>（${(200 * POWER_CONFIG.powerPlantCostPerKW).toLocaleString()}）</span>
        </button>
      </div>

      {/* 普通员工统计 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>👥 普通员工</span>
      </div>
      {humanResources.map((def) => {
        const count = resources[def.id] ?? 0;
        // 从 staff_researcher 反查角色名
        const roleEntry = Object.entries(ROLE_TO_STAFF_RESOURCE).find(
          ([, rid]) => rid === def.id,
        );
        const roleName = roleEntry
          ? ROLE_CONFIG[roleEntry[0] as StaffRole]?.displayName
          : def.name;
        return (
          <div key={def.id} className={styles.devRow}>
            <span className={styles.devRowLabel}>{def.uiConfig?.icon} {roleName}</span>
            <span className={styles.devHint}>{count} 人</span>
          </div>
        );
      })}
    </section>
  );
}
