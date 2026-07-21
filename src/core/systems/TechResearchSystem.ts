/**
 * TechResearchSystem
 *
 * PR-C 变更：
 * - 删除 researchingTech 推进逻辑（技术树花钱时间研发机制已废弃）
 * - 保留 processIdeaVerification（idea 验证流程仍由此系统每日推进）
 * - applyIdeaEffect 中 accelerate 分支不再判断 researchingTech，统一作用于"已解锁但未满级"的技术
 *
 * 每日推进 idea 验证进度，完成时按成功概率判定。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { IDEA_TECH_MAP } from '../config/techTree';
import { IDEA_TECH_POOL } from '../config/ideaTechPool';

export class TechResearchSystem implements System {
  name = 'TechResearchSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    // 仅推进 idea 验证流程（技术研发机制已废弃）
    this.processIdeaVerification(state, events, deltaDays);
  }

  /**
   * 每日推进 idea 验证进度
   *
   * 对 status='verifying' 的 idea：
   * 1. 扣除每日验证成本（资金不足则暂停，不清空进度）
   * 2. 递增 verificationDays
   * 3. 到达 totalDays 时：按 successProbability 掷骰
   *    - 成功 → status='accepted'，应用完整效果
   *    - 失败 → status='failed'，应用 25% 效果
   */
  private processIdeaVerification(
    state: GameState,
    events: EventBus,
    deltaDays: number,
  ): void {
    const current = state.read();
    const verifying = current.pendingIdeas.filter((i) => i.status === 'verifying');
    if (verifying.length === 0) return;

    // 阶段 1：计算所有 idea 的当日变更（先不掷骰）
    interface DayResult {
      idea: typeof verifying[0];
      newDays: number;
      willComplete: boolean;
      totalCost: number;
      canAfford: boolean;
    }
    let remainingFunds = current.resources['funds'] ?? 0;
    const dayResults: DayResult[] = [];

    for (const idea of verifying) {
      const dailyCost = idea.verificationDailyCost ?? 0;
      const totalCost = dailyCost * deltaDays;
      const canAfford = remainingFunds >= totalCost;
      const newDays = canAfford
        ? (idea.verificationDays ?? 0) + deltaDays
        : (idea.verificationDays ?? 0);
      const willComplete = canAfford && newDays >= (idea.verificationTotalDays ?? 1);

      if (!canAfford) {
        events.emit('IDEA_VERIFICATION_PAUSED', {
          ideaId: idea.id,
          title: idea.title,
          deficit: totalCost - remainingFunds,
        });
      } else {
        remainingFunds -= totalCost;
      }

      dayResults.push({ idea, newDays, willComplete, totalCost, canAfford });
    }

    // 阶段 2：掷骰判定完成结果
    const completedResults: Array<{ idea: typeof verifying[0]; success: boolean }> = [];
    for (const dr of dayResults) {
      if (dr.willComplete) {
        const success = Math.random() < (dr.idea.successProbability ?? 0.5);
        completedResults.push({ idea: dr.idea, success });
      }
    }

    // 阶段 3：单次 state.update 批量写入所有变更
    if (dayResults.length === 0) return;

    state.update((draft) => {
      for (const dr of dayResults) {
        if (dr.canAfford && dr.totalCost > 0) {
          // ★ P0-2 修复：Math.max(0, ...) 保护资金下界
          draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - dr.totalCost);
        }
        const target = draft.pendingIdeas.find((i) => i.id === dr.idea.id);
        if (!target) continue;

        target.verificationDays = dr.newDays;

        if (dr.willComplete) {
          const result = completedResults.find((r) => r.idea.id === dr.idea.id);
          if (!result) continue;

          if (result.success) {
            target.status = 'accepted';
            this.applyIdeaEffect(draft, dr.idea, 1.0);
          } else {
            target.status = 'failed';
            this.applyIdeaEffect(draft, dr.idea, 0.25);
          }
        }
      }
    });

    // 阶段 4：发送完成事件
    for (const { idea, success } of completedResults) {
      if (success) {
        events.emit('IDEA_VERIFIED', {
          ideaId: idea.id,
          title: idea.title,
          targetTechId: idea.targetTechId,
          kind: idea.kind,
        });
      } else {
        events.emit('IDEA_VERIFICATION_FAILED', {
          ideaId: idea.id,
          title: idea.title,
          reason: '验证失败，效果降低至 25%',
          sourceEmployeeId: idea.sourceEmployeeId,
        });
      }
    }
  }

  /**
   * 应用 idea 效果（抽取为公共方法，供成功/失败复用）
   *
   * PR-C 变更：accelerate 分支不再判断 researchingTech（研发中技术概念已删除），
   *           统一作用于"已解锁但未满级"的技术，提升其 maturity。
   *
   * @param draft     immer draft
   * @param idea      idea 数据
   * @param ratio     效果比例：1.0=完整，0.25=失败保留
   */
  private applyIdeaEffect(
    draft: any,
    idea: { kind: string; targetTechId: string; value: number },
    ratio: number,
  ): void {
    const effectiveValue = idea.value * ratio;

    if (idea.kind === 'accelerate') {
      // accelerate：提升已解锁技术的 maturity（封顶 100）
      const existing = draft.techMaturity[idea.targetTechId] ?? 0;
      draft.techMaturity[idea.targetTechId] = Math.min(100, existing + effectiveValue);
    } else {
      // unique：注册独有技术
      const poolNode = IDEA_TECH_POOL.find((t) => t.id === idea.targetTechId);
      if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
        IDEA_TECH_MAP[poolNode.id] = poolNode;
        draft.acceptedIdeaTechs.push(poolNode);
      }
      const existing = draft.techMaturity[idea.targetTechId] ?? 0;
      draft.techMaturity[idea.targetTechId] = Math.max(existing, effectiveValue);
    }
  }
}