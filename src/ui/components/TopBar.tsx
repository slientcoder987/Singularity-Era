import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { formatGameDate, formatResourceValue } from '../../core/utils';
import styles from '../styles/App.module.css';

/**
 * TopBar
 *
 * 顶部状态栏：品牌标识 + 日期 + 动态资源展示。
 * 资源列表来自 ResourceRegistry.getTopBarResources()，
 * 数值通过 useGameState(s => s.resources[id]) 订阅。
 * 新增资源只需在 registry 中注册并设 showInTopBar:true，即可自动出现。
 */
export function TopBar() {
  const game = useGame();
  const date = useGameState((s) => s.date);
  const startDate = useGameState((s) => s.startDate);
  const resources = useGameState((s) => s.resources);

  const topBarResources = game.registry.getTopBarResources();

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <span className={styles.logoMark} aria-hidden="true">◆</span>
        <span className={styles.brandTitle}>SINGULARITY.AI</span>
        <span className={styles.brandSub}>公司模拟经营</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>日期</span>
          <span className={styles.statValue}>{formatGameDate(startDate, date)}</span>
        </div>

        {topBarResources.map((def) => {
          const value = resources[def.id] ?? 0;
          const format = def.uiConfig?.format;
          return (
            <div key={def.id} className={styles.statGroup}>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statLabel}>
                  <span className={styles.statIcon} aria-hidden="true">{def.uiConfig?.icon}</span>
                  {def.name}
                </span>
                <span
                  className={styles.statValue}
                  style={def.uiConfig?.color ? { color: def.uiConfig.color } : undefined}
                >
                  {formatResourceValue(value, format)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
