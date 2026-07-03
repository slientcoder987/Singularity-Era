import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './core/Game';
import type { GameData } from './core/GameState';
import { ResourceRegistry } from './core/resources/ResourceRegistry';
import { ComputeHardwareSystem } from './core/systems/ComputeHardwareSystem';
import { PowerSystem } from './core/systems/PowerSystem';
import { StaffSystem } from './core/systems/StaffSystem';
import { INITIAL_RESOURCES } from './core/config/resources';
import { GameProvider } from './ui/context/GameContext';
import { App } from './ui/components/App';

/**
 * 初始资源数值：从 INITIAL_RESOURCES 的 initialValue 自动生成。
 * 调整初始值只需改 config/resources.ts，无需改这里。
 */
function buildInitialResources(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const def of INITIAL_RESOURCES) {
    map[def.id] = def.initialValue;
  }
  return map;
}

const initialData: GameData = {
  date: 0,
  startDate: '2023-01-01',
  isPaused: true,
  speed: 1,
  resources: buildInitialResources(),
  resourceMeta: {},
  pendingOrders: [],
  employees: [],
  models: [],
};

// 1. 先创建 registry 并注册资源
const registry = new ResourceRegistry();
registry.registerAll(INITIAL_RESOURCES);

// 2. 创建 systems，注入同一个 registry
const systems = [
  new ComputeHardwareSystem(registry),
  new PowerSystem(registry),
  new StaffSystem(),
];

// 3. 创建 Game，传入 registry（Game 内部会再次 registerAll，幂等）
const game = new Game(initialData, systems, registry);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider game={game}>
      <App />
    </GameProvider>
  </StrictMode>,
);
