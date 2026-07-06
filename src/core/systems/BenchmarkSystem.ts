/**
 * BenchmarkSystem
 *
 * 负责模型评估：
 * - 发布时自动评估（由 ReleaseModelCommand 触发）
 * - 玩家可主动评估已发布模型
 * - 市场压力随时间衰减
 */

import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { evaluateBenchmark } from '../entities/Benchmark';
import { BENCHMARKS } from '../config/benchmarks';

export class BenchmarkSystem implements System {
  name = 'BenchmarkSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    // 市场压力随时间衰减（每天衰减 1%）
    state.update((draft) => {
      draft.marketPressure = Math.max(0, draft.marketPressure - 0.01 * deltaDays);
    });

    // 市场压力变化事件（仅在显著变化时触发）
    const current = state.read();
    if (current.marketPressure > 0.5) {
      events.emit('MARKET_PRESSURE_HIGH', current.marketPressure);
    }
  }

  /** 主动评估某模型 */
  evaluateModel(state: GameState, modelId: string, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === modelId);
    if (!model) return;
    if (model.status !== 'released') return;
    if (!model.releasedCapabilities) return;

    const evalDate = current.date;

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === modelId);
      if (!m || !m.releasedCapabilities) return;

      for (const bench of BENCHMARKS) {
        const result = evaluateBenchmark(
          m.id,
          m.name,
          m.releasedCapabilities,
          bench,
          evalDate,
        );
        draft.benchmarkResults.push(result);
        events.emit('BENCHMARK_EVALUATED', m.id, bench.id, result.observedScore);
      }
    });
  }
}
