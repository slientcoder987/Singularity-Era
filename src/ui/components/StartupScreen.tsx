import { useGame } from '../hooks/useGame';
import { SetHeadquartersCommand } from '../../core/commands/RegionCommands';
import { RECOMMENDED_START_REGIONS, getRegionsByContinent } from '../../core/config/regions';
import type { Region } from '../../core/config/regions';
import styles from '../styles/App.module.css';

interface StartupScreenProps {
  onComplete: () => void;
}

/**
 * 开局地区选择界面。
 * 按大区分组展示所有 33 个地区，推荐地区前置高亮。
 */
export function StartupScreen({ onComplete }: StartupScreenProps) {
  const game = useGame();
  const groups = getRegionsByContinent();

  const handleSelect = (region: Region) => {
    game.executeCommand(new SetHeadquartersCommand(region.id));
    onComplete();
  };

  return (
    <div className={styles.app}>
      <div className={styles.pageMain}>
        <section className={styles.devPanel}>
          <h2 className={styles.devTitle}>选择总部地区</h2>
          <p className={styles.devHint} style={{ marginBottom: '12px' }}>
            推荐选择经济发展水平高的地区开局（东亚、合众国、西欧等），便于获取人才和算力。
          </p>

          {/* 推荐地区 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ color: '#5cb85c' }}>推荐开局</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {RECOMMENDED_START_REGIONS.map((r) => (
              <button
                key={r.id}
                className={styles.btn}
                style={{ flex: '0 0 calc(25% - 6px)', minWidth: '140px', textAlign: 'left' }}
                onClick={() => handleSelect(r)}
              >
                <div style={{ fontWeight: 'bold', color: '#5cb85c' }}>{r.name}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {r.country} · {r.population}M人 · GDP ${r.gdpPerCapita.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  人才{r.talentIndex} · 算力{r.computeIndex} · 税率{r.taxRate}%{r.dataLocalization ? ' · 需本地存储' : ''}
                </div>
                {r.startReason && (
                  <div style={{ fontSize: '10px', color: '#7ab8e0', marginTop: '3px' }}>
                    {r.startReason}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* 全部地区按大区 */}
          {Object.entries(groups).map(([continent, regions]) => (
            <div key={continent}>
              <div className={styles.devRow}>
                <span className={styles.devRowLabel}>{continent} ({regions.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {regions.map((r) => {
                  const isRec = r.recommendedStart;
                  return (
                    <button
                      key={r.id}
                      className={styles.btn}
                      style={{
                        flex: '1 1 calc(20% - 4px)',
                        minWidth: '110px',
                        textAlign: 'left',
                        borderLeft: isRec ? '3px solid #5cb85c' : 'none',
                      }}
                      onClick={() => handleSelect(r)}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        {r.name}
                        {isRec && <span style={{ color: '#5cb85c', fontSize: '10px', marginLeft: '4px' }}>★</span>}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {r.population}M · ${r.gdpPerCapita.toLocaleString()} · 税率{r.taxRate}%
                      </div>
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        人才{r.talentIndex} · 算力{r.computeIndex} · 语言{r.primaryLanguages.join(',')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
