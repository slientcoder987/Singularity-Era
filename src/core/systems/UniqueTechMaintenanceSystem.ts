/**
 * UniqueTechMaintenanceSystem
 *
 * PR-E：每日扣除独有技术维护成本。
 *
 * 设计意图：
 * - 独有技术（idea/开源/小公司得来）需要持续投入资源维护（专利费、专属团队等）
 * - 防止玩家无脑囤积独有技术：即使槽位未满，维护费也会成为负担
 * - 主技术树技术不收维护费（行业标准知识，无需额外维护）
 *
 * 维护费公式（每项独有技术）：
 *   dailyMaintenance = $50 + $1 × maturity
 *
 * 数值示例：
 * - 4 项独有技术，平均 maturity 30 → 4 × $80 = $320/天 ≈ $9.6k/月
 * - 10 项独有技术，平均 maturity 60 → 10 × $110 = $1100/天 ≈ $33k/月
 * - 13 项独有技术（满槽），平均 maturity 100 → 13 × $150 = $1950/天 ≈ $58.5k/月
 *
 * 资金不足时：仍扣除（扣到 0），并发射 UNIQUE_TECH_MAINT_UNDERFUNDED 事件供 UI 告警。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { getTotalUniqueTechMaintenance } from '../utils/uniqueTechSlots';

export class UniqueTechMaintenanceSystem implements System {
  name = 'UniqueTechMaintenanceSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const dailyCost = getTotalUniqueTechMaintenance(current);
    if (dailyCost <= 0) return;

    const totalCost = dailyCost * deltaDays;
    const fundsBefore = current.resources['funds'] ?? 0;
    const underfunded = fundsBefore < totalCost;

    state.update((draft) => {
      // ★ P0-2 修复模式：Math.max(0, ...) 保护资金下界
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - totalCost);
    });

    if (underfunded) {
      events.emit('UNIQUE_TECH_MAINT_UNDERFUNDED', {
        dailyCost,
        totalCost,
        fundsBefore,
        techCount: current.acceptedIdeaTechs.length,
      });
    }
  }
}