/**
 * 风险系统
 *
 * 每日检查风险事件触发，处理训练崩溃。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { checkDailyRisks, calcTrainingCrashProbability } from '../utils/riskUtils';
import { findCluster, findNode } from '../utils/infraIndex';
import type { CapabilityId } from '../config/capabilities';
import { effectiveCapabilityValue } from '../config/capabilities';
import { getStaffLegalRiskReductionPerDay, getActiveTechEffects } from '../utils/crossSystemUtils';
import { aggregateMultiplicative, TECH_EFFECT_CAPS } from '../utils/techEffectScale';

export class RiskSystem implements System {
  name = 'RiskSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // 1. 找出当前最强模型能力，以及是否有未审计的强模型参与研发
    // BUG 修复：inverse 维度（hallucination_rate 等，越低越好）取反转后的有效值，
    // 否则幻觉率越高 globalMaxCap 越大，导致 AI 风险/能力阈值误判。
    let globalMaxCap = 0;
    let hasStrongModelInResearch = false;
    for (const model of current.models) {
      // 计算当前模型的最大能力（而非使用全局累积值）
      let modelMaxCap = 0;
      for (const capId of Object.keys(model.capabilities) as CapabilityId[]) {
        const val = effectiveCapabilityValue(capId, model.capabilities[capId]);
        if (val > modelMaxCap) modelMaxCap = val;
      }
      if (modelMaxCap > globalMaxCap) globalMaxCap = modelMaxCap;
      // 仅当该模型本身能力超过阈值且用于研发且未审计时才算
      if (model.usedInResearch && !model.audited && modelMaxCap > 1500) {
        hasStrongModelInResearch = true;
      }
    }

    // 对齐技术降低 AI 失控风险概率（按 maturity 缩放后的派生效果）
    // ★ PR-A 修复：improve_alignment 改用乘法叠加 + 硬性上限 +80%
    const alignmentBonus = aggregateMultiplicative(
      getActiveTechEffects(current),
      'improve_alignment',
      TECH_EFFECT_CAPS.improve_alignment,
    );

    // 2. 检查风险事件
    const triggered = checkDailyRisks(
      current.riskState,
      globalMaxCap,
      hasStrongModelInResearch,
      alignmentBonus,
    );

    // 计算训练崩溃概率统一参数（在 update 外只读一次）
    // ★ PR-A 修复：reduce_training_crash_risk 改用乘法叠加 + 硬性上限 80%
    const crashRiskReduction = aggregateMultiplicative(
      getActiveTechEffects(current),
      'reduce_training_crash_risk',
      TECH_EFFECT_CAPS.reduce_training_crash_risk,
    );
    const legalReduction = getStaffLegalRiskReductionPerDay(current);

    // ★ P1-7 修复：把原本 3 次 state.update（风险事件 / legalReduction / 训练崩溃）
    //   合并为 1 次，减少 UI 重渲染
    const emittedRiskEvents: Array<{ id: string; name: string; effects: typeof triggered[number]['effects']; severity: string }> = [];
    const trainingCrashes: Array<{ projectId: string; lostFlops: number }> = [];

    state.update((draft) => {
      // 阶段 1：风险事件
      for (const evt of triggered) {
        if (evt.effects.fundsLoss) {
          // ★ P0-2 修复：使用 Math.max(0, ...) 保护资金下界
          draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - evt.effects.fundsLoss);
        }
        if (evt.effects.reputationLoss) {
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - evt.effects.reputationLoss);
        }
        // userLossPercent 转化为额外声誉损失（用户流失 → 声誉下降）
        if (evt.effects.userLossPercent) {
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - evt.effects.userLossPercent * 0.5);
        }
        if (evt.effects.moraleLoss) {
          draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - evt.effects.moraleLoss);
        }
        if (evt.effects.legalDebtReduction) {
          draft.riskState.legalDebt = Math.max(0, draft.riskState.legalDebt - evt.effects.legalDebtReduction);
        }
        if (evt.effects.trainingPauseDays) {
          for (const p of draft.trainingProjects) {
            if (p.status === 'training') {
              p.status = 'paused';
              p.pauseReason = `风险事件：${evt.name}`;
              p.autoResumeDay = draft.date + evt.effects.trainingPauseDays;
            }
          }
        }
        draft.riskState.triggeredEvents.push({
          eventId: evt.id,
          eventName: evt.name,
          date: draft.date,
          severity: evt.severity,
        });
        // ★ U2 修复：triggeredEvents 无界增长会膨胀存档体积；UI 只取最近 20 条
        if (draft.riskState.triggeredEvents.length > 200) {
          draft.riskState.triggeredEvents = draft.riskState.triggeredEvents.slice(-200);
        }
        emittedRiskEvents.push({ id: evt.id, name: evt.name, effects: evt.effects, severity: evt.severity });
      }

      // 阶段 2：法务公关每日降低法律和信任风险
      if (legalReduction > 0) {
        draft.riskState.legalDebt = Math.max(0, draft.riskState.legalDebt - legalReduction * deltaDays);
        draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - legalReduction * 0.5 * deltaDays);
      }

      // 阶段 3：训练崩溃检查
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;

        // 计算基础设施平均可靠性
        // ★ T2 修复：用 clusterIndex/nodeIndex 替代 find()，O(1) 查找
        const cluster = findCluster(draft, project.clusterId);
        let avgReliability = 80;
        if (cluster) {
          let totalRel = 0;
          let count = 0;
          for (const nid of cluster.nodes) {
            const node = findNode(draft, nid);
            if (node) {
              totalRel += node.reliability;
              count++;
            }
          }
          if (count > 0) avgReliability = totalRel / count;
        }

        let parallelSize = 0;
        for (const nodeCards of Object.values(project.nodeAssignments)) {
          parallelSize += nodeCards.length;
        }
        if (parallelSize === 0) continue;

        const crashProb = calcTrainingCrashProbability(
          parallelSize,
          false,
          false,
          avgReliability,
        );
        const adjustedProb = crashProb * Math.max(0, 1 - crashRiskReduction);

        if (Math.random() < adjustedProb * deltaDays) {
          const lost = project.lastCheckpointRemaining - project.computeRemaining;
          project.computeRemaining = project.lastCheckpointRemaining;
          project.lostFlops += lost;

          draft.riskState.triggeredEvents.push({
            eventId: 'training_crash',
            eventName: '训练崩溃',
            date: draft.date,
            severity: 'major',
          });
          // ★ U2 修复：同上，截断 triggeredEvents
          if (draft.riskState.triggeredEvents.length > 200) {
            draft.riskState.triggeredEvents = draft.riskState.triggeredEvents.slice(-200);
          }

          trainingCrashes.push({ projectId: project.id, lostFlops: lost });
        }
      }
    });

    // 在 state.update 完成后再触发事件
    for (const evt of emittedRiskEvents) {
      events.emit('RISK_EVENT', { id: evt.id, name: evt.name, effects: evt.effects, severity: evt.severity });
    }
    for (const crash of trainingCrashes) {
      events.emit('TRAINING_CRASH', crash);
    }
  }
}
