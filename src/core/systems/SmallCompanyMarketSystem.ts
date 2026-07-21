/**
 * SmallCompanyMarketSystem
 *
 * 每 14 天刷新 2~3 家小公司进入市场。
 * 小公司拥有 1~3 个技术，生命周期 30 天，到期未收购则消失。
 *
 * PR-D：
 * - 每项技术在生成时即 roll 初始成熟度（20~80），玩家收购前可见
 * - 估值公式：$200k + Σ_tech($50k + maturity × $5k)（成熟度越高越贵）
 * - 收购时应用 company.techMaturities 而非固定 60
 *
 * 技术来源：50% 小公司独有池 / 50% 主技术树未解锁技术。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { ALL_TECH, IDEA_TECH_MAP } from '../config/techTree';
import { SMALL_COMPANY_TECH_POOL } from '../config/smallCompanyTech';

const REFRESH_DAYS = 14;
const SPAWN_MIN = 2;
const SPAWN_MAX = 3;
const LIFESPAN = 30;

const COMPANY_NAMES = [
  'Nexus AI', 'DeepForge', 'CogniLabs', 'Synapse Co', 'MindForge',
  'NeuroSpark', 'LogicStream', 'TensorWave', 'CortexHub', 'Atlas AI',
  'PrismMind', 'QuantumLeaf', 'EchoLabs', 'Vertex AI', 'LumenMind',
];

const BACKGROUNDS = [
  '专注推理优化的初创团队',
  '拥有多项注意力专利的研究机构',
  '擅长数据工程的精简团队',
  '专注对齐安全的非营利实验室',
  'MoE 架构专家',
  '长上下文处理先锋',
];

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SmallCompanyMarketSystem implements System {
  name = 'SmallCompanyMarketSystem';

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();

    // 清理过期小公司（生命周期 30 天，未收购的）
    const expiredIds: string[] = current.smallCompanies
      .filter((c) => !c.acquired && current.date - c.spawnedDay > c.lifespan)
      .map((c) => c.id);

    // 刷新判定：距上次刷新 ≥ 14 天
    const shouldRefresh = (current.date - current.lastSmallCompanyRefreshDay) >= REFRESH_DAYS;

    if (!shouldRefresh && expiredIds.length === 0) return;

    state.update((draft) => {
      // 清理过期
      if (expiredIds.length > 0) {
        draft.smallCompanies = draft.smallCompanies.filter((c) => !expiredIds.includes(c.id));
      }

      // 刷新新公司
      if (shouldRefresh) {
        const count = SPAWN_MIN + Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN + 1));
        const usedNames = new Set(draft.smallCompanies.map((c) => c.name));
        const availableNames = COMPANY_NAMES.filter((n) => !usedNames.has(n));

        for (let i = 0; i < count && availableNames.length > 0; i++) {
          const nameIdx = Math.floor(Math.random() * availableNames.length);
          const name = availableNames.splice(nameIdx, 1)[0];
          const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];

          // 1~3 个技术
          const techCount = 1 + Math.floor(Math.random() * 3);
          const techs: string[] = [];
          for (let j = 0; j < techCount; j++) {
            const usePool = Math.random() < 0.5;
            if (usePool) {
              const available = SMALL_COMPANY_TECH_POOL.filter(
                (t) => !techs.includes(t.id) && !IDEA_TECH_MAP[t.id],
              );
              if (available.length > 0) {
                techs.push(available[Math.floor(Math.random() * available.length)].id);
                continue;
              }
            }
            const available = ALL_TECH.filter(
              (t) => !techs.includes(t.id) && (draft.techMaturity[t.id] ?? 0) < 1 && t.researchDays > 0,
            );
            if (available.length > 0) {
              techs.push(available[Math.floor(Math.random() * available.length)].id);
            }
          }
          if (techs.length === 0) continue;

          // PR-D：为每项技术 roll 初始成熟度（20~80），并据此计算估值
          // 公式：valuation = $200k + Σ_tech($50k + maturity × $5k)
          // - 1 项 maturity=20 → $350k
          // - 1 项 maturity=80 → $650k
          // - 3 项平均 maturity=50 → $1.25M
          // - 3 项 maturity=80 → $1.7M
          const techMaturities: Record<string, number> = {};
          let valuation = 200_000;
          for (const tid of techs) {
            const mat = 20 + Math.floor(Math.random() * 61); // 20~80
            techMaturities[tid] = mat;
            valuation += 50_000 + mat * 5_000;
          }
          valuation = Math.round(valuation);

          draft.smallCompanies.push({
            id: genId(`sc-${draft.date}-${i}`),
            name,
            technologies: techs,
            techMaturities,
            valuation,
            spawnedDay: draft.date,
            lifespan: LIFESPAN,
            acquired: false,
            background: bg,
          });
        }
        draft.lastSmallCompanyRefreshDay = draft.date;
      }
    });

    if (shouldRefresh) {
      events.emit('SMALL_COMPANY_REFRESHED', current.smallCompanies.length);
    }
  }
}