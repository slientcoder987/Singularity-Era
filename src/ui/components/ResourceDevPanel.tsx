import { useGame } from '../hooks/useGame';
import { AddResourceCommand } from '../../core/commands/AddResourceCommand';
import { PurchaseHardwareCommand } from '../../core/commands/PurchaseHardwareCommand';
import { BuildPowerPlantCommand } from '../../core/commands/BuildPowerPlantCommand';
import { HARDWARE_SPECS, POWER_CONFIG } from '../../core/config/resources';
import styles from '../styles/App.module.css';

/**
 * ResourceDevPanel
 *
 * 开发测试面板：用于验证资源系统的增减、采购、建造等命令。
 * 每个按钮触发对应 Command，通过 game.executeCommand 执行。
 */
export function ResourceDevPanel() {
  const game = useGame();

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>资源系统 · 开发面板</h3>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>通用增减</span>
        <button className={styles.btn} onClick={() => game.executeCommand(new AddResourceCommand('funds', 100_000, 'dev: 注入资金'))}>
          +$100,000
        </button>
        <button className={styles.btn} onClick={() => game.executeCommand(new AddResourceCommand('funds', -50_000, 'dev: 扣除资金'))}>
          -$50,000
        </button>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>采购硬件</span>
        {HARDWARE_SPECS.map((spec) => (
          <button
            key={spec.resourceId}
            className={styles.btn}
            onClick={() => game.executeCommand(new PurchaseHardwareCommand(spec.resourceId, 1))}
          >
            买 1 张 {game.registry.get(spec.resourceId).name}
            <span className={styles.devHint}>（${spec.unitCost.toLocaleString()} · {spec.deliveryDays}天交付）</span>
          </button>
        ))}
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>建造电站</span>
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
    </section>
  );
}
