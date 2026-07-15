import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { formatGameDate, formatResourceValue } from '../../core/utils';
import { REGION_MAP } from '../../core/config/regions';
import { getActiveCloudTFLOPS } from '../../core/utils/cloudComputeUtils';
import styles from '../styles/App.module.css';

/**
 * TopBar
 *
 * 顶部状态栏：品牌标识 + 日期 + 资金 + 算力 + 员工 + 电力。
 * 硬件卡详情和普通员工分类在资源面板中展示。
 * 新增顶栏资源只需在 registry 中注册并设 showInTopBar:true。
 */
export function TopBar() {
  const game = useGame();
  const date = useGameState((s) => s.date);
  const startDate = useGameState((s) => s.startDate);
  const resources = useGameState((s) => s.resources);
  const coreEmployees = useGameState((s) => s.employees);
  const headquartersRegionId = useGameState((s) => s.headquartersRegionId);
  const hqRegion = headquartersRegionId ? REGION_MAP[headquartersRegionId] : null;

  const topBarResources = game.registry.getTopBarResources();
  // funds, compute_power, power_kw

  // 设计-8：云算力独立显示，让玩家直观感知租赁状态
  const cloudComputePower = useGameState((s) => getActiveCloudTFLOPS(s));

  // 计算员工总数：核心员工 + 普通员工（human 类别资源之和）
  const humanResources = game.registry.getByCategory('human');
  const normalEmployeeCount = humanResources.reduce((sum, def) => sum + (resources[def.id] ?? 0), 0);
  const totalEmployees = coreEmployees.length + normalEmployeeCount;

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

        {/* 资金、算力、电力 */}
        {topBarResources.map((def) => {
          const value = resources[def.id] ?? 0;
          const format = def.uiConfig?.format;
          // 设计-8：在算力项后追加云算力提示（仅当有云算力时）
          const cloudSuffix = def.id === 'compute_power' && cloudComputePower > 0
            ? ` (+${formatResourceValue(cloudComputePower, format)} 云)`
            : '';
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
                  {formatResourceValue(value, format)}{cloudSuffix}
                </span>
              </div>
            </div>
          );
        })}

        {/* 总部地区 */}
        {hqRegion && (
          <div className={styles.statGroup}>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>
                <span className={styles.statIcon} aria-hidden="true">🏢</span>
                总部
              </span>
              <span className={styles.statValue} style={{ color: '#7ab8e0' }}>
                {hqRegion.name}
              </span>
            </div>
          </div>
        )}

        {/* 员工总数（核心 + 普通） */}
        <div className={styles.statGroup}>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <span className={styles.statIcon} aria-hidden="true">👥</span>
              员工
            </span>
            <span className={styles.statValue} style={{ color: '#a78bfa' }}>
              {totalEmployees.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
