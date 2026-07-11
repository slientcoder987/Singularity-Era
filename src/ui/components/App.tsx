import { useState } from 'react';
import { TopBar } from './TopBar';
import { GameControls, type PanelView } from './GameControls';
import { ResourceDevPanel } from './ResourceDevPanel';
import { EmployeePanel } from './EmployeePanel';
import { InfrastructurePanel } from './InfrastructurePanel';
import { ModelPanel } from './ModelPanel';
import { ResearchPanel } from './ResearchPanel';
import styles from '../styles/App.module.css';

/**
 * App
 *
 * 应用根组件：顶部状态栏 + 控制栏 + 页面切换面板。
 */
export function App() {
  const [activeView, setActiveView] = useState<PanelView>(null);

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

      <footer className={styles.footer}>
        Singularity.AI · 资源 + 员工 + 基建 + 训练系统已启用 · core (纯 TS) ⇄ ui (React + CSS Modules)
      </footer>
    </div>
  );
}
