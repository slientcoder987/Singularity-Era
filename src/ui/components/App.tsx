import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { TopBar } from './TopBar';
import { GameControls, type PanelView } from './GameControls';
import { ResourceDevPanel } from './ResourceDevPanel';
import { EmployeePanel } from './EmployeePanel';
import { InfrastructurePanel } from './InfrastructurePanel';
import { ModelPanel } from './ModelPanel';
import { ResearchPanel } from './ResearchPanel';
import { BusinessPanel } from './BusinessPanel';
import { StartupScreen } from './StartupScreen';
import styles from '../styles/App.module.css';

/**
 * App
 *
 * 应用根组件：开局地区选择 → 顶部状态栏 + 控制栏 + 页面切换面板。
 */
export function App() {
  const [activeView, setActiveView] = useState<PanelView>(null);
  const headquartersRegionId = useGameState((s) => s.headquartersRegionId);
  const [showStartup, setShowStartup] = useState(!headquartersRegionId);

  // 未选择总部地区 → 显示开局选择界面
  if (showStartup && !headquartersRegionId) {
    return <StartupScreen onComplete={() => setShowStartup(false)} />;
  }

  return (
    <div className={styles.app}>
      <TopBar />
      <GameControls activeView={activeView} onViewChange={setActiveView} />

      {activeView === 'resources' && (
        <main className={styles.pageMain}>
          <ResourceDevPanel />
        </main>
      )}

      {activeView === 'employees' && (
        <main className={styles.pageMain}>
          <EmployeePanel />
        </main>
      )}

      {activeView === 'infrastructure' && (
        <main className={styles.pageMain}>
          <InfrastructurePanel />
        </main>
      )}

      {activeView === 'models' && (
        <main className={styles.pageMain}>
          <ModelPanel />
        </main>
      )}

      {activeView === 'research' && (
        <main className={styles.pageMain}>
          <ResearchPanel />
        </main>
      )}

      {activeView === 'business' && (
        <main className={styles.pageMain}>
          <BusinessPanel />
        </main>
      )}

      <footer className={styles.footer}>
        Singularity.AI · 地区系统 + 训练过程 + 数据收集已启用 · core (纯 TS) ⇄ ui (React + CSS Modules)
      </footer>
    </div>
  );
}
