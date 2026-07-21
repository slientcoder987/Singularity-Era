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
import { SettingsPanel } from './SettingsPanel';
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

      <main className={styles.pageMain}>
        {/* ★ UI-1 修复：原 display:none 模式让 7 大面板常驻订阅，
            每次 tick 触发所有面板重渲染。改为条件渲染后，
            未激活面板自动卸载，订阅清理。 */}
        {activeView === 'resources' && <ResourceDevPanel />}
        {activeView === 'employees' && <EmployeePanel />}
        {activeView === 'infrastructure' && <InfrastructurePanel />}
        {activeView === 'models' && <ModelPanel />}
        {activeView === 'research' && <ResearchPanel />}
        {activeView === 'business' && <BusinessPanel />}
        {activeView === 'settings' && <SettingsPanel />}
      </main>

      <footer className={styles.footer}>
        Singularity.AI · 地区系统 + 训练过程 + 数据收集已启用 · core (纯 TS) ⇄ ui (React + CSS Modules)
      </footer>
    </div>
  );
}
