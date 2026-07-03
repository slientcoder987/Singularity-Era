import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import styles from '../styles/App.module.css';

const SPEEDS = [1, 2, 4];

export type PanelView = 'resources' | 'employees' | null;

interface GameControlsProps {
  activeView: PanelView;
  onViewChange: (view: PanelView) => void;
}

/**
 * GameControls
 *
 * 游戏控制栏：暂停/开始按钮 + 速度倍率选择器 + 资源/员工页面切换按钮。
 */
export function GameControls({ activeView, onViewChange }: GameControlsProps) {
  const game = useGame();
  const isPaused = useGameState((s) => s.isPaused);
  const speed = useGameState((s) => s.speed);

  const toggleView = (view: Exclude<PanelView, null>) => {
    onViewChange(activeView === view ? null : view);
  };

  return (
    <section className={styles.controls}>
      <button
        type="button"
        className={`${styles.btn} ${isPaused ? styles.btnPrimary : styles.btnWarn}`}
        onClick={() => (isPaused ? game.start() : game.pause())}
      >
        {isPaused ? '▶ 开始' : '❚❚ 暂停'}
      </button>

      <div className={styles.speedGroup}>
        <span className={styles.speedLabel}>速度</span>
        <div className={styles.speedBtns}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.btn} ${styles.btnGhost} ${speed === s ? styles.btnActive : ''}`}
              onClick={() => game.setSpeed(s)}
              aria-pressed={speed === s}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.panelTabs}>
        <button
          type="button"
          className={`${styles.btn} ${activeView === 'resources' ? styles.btnActive : ''}`}
          onClick={() => toggleView('resources')}
          aria-pressed={activeView === 'resources'}
        >
          资源
        </button>
        <button
          type="button"
          className={`${styles.btn} ${activeView === 'employees' ? styles.btnActive : ''}`}
          onClick={() => toggleView('employees')}
          aria-pressed={activeView === 'employees'}
        >
          员工
        </button>
      </div>
    </section>
  );
}
