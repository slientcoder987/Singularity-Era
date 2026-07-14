/**
 * 风险系统
 *
 * 每日检查风险事件触发，处理训练崩溃。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { checkDailyRisks, calcTrainingCrashProbability } from '../utils/riskUtils';
import type { CapabilityId } from '../config/capabilities';
import { getStaffLegalRiskReductionPerDay } from '../utils/crossSystemUtils';

export class RiskSystem implements System {
  name = 'RiskSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // 1. 找出当前最强模型能力，以及是否有未审计的强模型参与研发
    let globalMaxCap = 0;
    let hasStrongModelInResearch = false;
    for (const model of current.models) {
      // 计算当前模型的最大能力（而非使用全局累积值）
      let modelMaxCap = 0;
      for (const capId of Object.keys(model.capabilities) as CapabilityId[]) {
        const val = model.capabilities[capId];
        if (val > modelMaxCap) modelMaxCap = val;
      }
      if (modelMaxCap > globalMaxCap) globalMaxCap = modelMaxCap;
      // 仅当该模型本身能力超过阈值且用于研发且未审计时才算
      if (model.usedInResearch && !model.audited && modelMaxCap > 1500) {
        hasStrongModelInResearch = true;
      }
    }

    // 对齐技术降低 AI 失控风险概率
    const alignmentBonus = current.activeTechEffects
      .filter((e) => e.type === 'improve_alignment')
      .reduce((s, e) => s + e.value, 0);

    // 2. 检查风险事件（training_crash 已由下方独立逻辑处理，不再作为通用风险事件）
    const triggered = checkDailyRisks(
      current.riskState,
      globalMaxCap,
      hasStrongModelInResearch,
      alignmentBonus,
    );

    const emittedEvents: Array<{ name: string; effects: typeof triggered[number]['effects']; id: string; severity: string }> = [];
    if (triggered.length > 0) {
      state.update((draft) => {
        for (const evt of triggered) {
          if (evt.effects.fundsLoss) {
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
              }
            }
          }

          draft.riskState.triggeredEvents.push({
            eventId: evt.id,
            eventName: evt.name,
            date: draft.date,
            severity: evt.severity,
          });

          emittedEvents.push({ name: evt.name, effects: evt.effects, id: evt.id, severity: evt.severity });
        }

        // ★ 法务公关每日降低法律和信任风险
        const legalReduction = getStaffLegalRiskReductionPerDay(draft);
        if (legalReduction > 0) {
          draft.riskState.legalDebt = Math.max(0, draft.riskState.legalDebt - legalReduction * deltaDays);
          draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - legalReduction * 0.5 * deltaDays);
        }
      });

      // 在 state.update 完成后再触发事件，确保监听器读到最新状态
      for (const evt of emittedEvents) {
        events.emit('RISK_EVENT', { id: evt.id, name: evt.name, effects: evt.effects, severity: evt.severity });
      }
    }

    // 3. 训练崩溃检查（针对每个训练中项目）
    // 统一通过 reduce_training_crash_risk 技术效果减免，不在 calcTrainingCrashProbability 内重复应用
    const crashRiskReduction = current.activeTechEffects
      .filter((e) => e.type === 'reduce_training_crash_risk')
      .reduce((s, e) => s + e.value, 0);

    const crashes: Array<{ projectId: string; lostFlops: number }> = [];
    state.update((draft) => {
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;

        // 计算基础设施平均可靠性
        const cluster = draft.clusters.find((c) => c.id === project.clusterId);
        let avgReliability = 80;
        if (cluster) {
          let totalRel = 0;
          let count = 0;
          for (const nid of cluster.nodes) {
            const node = draft.serverNodes.find((n) => n.id === nid);
            if (node) {
              totalRel += node.reliability;
              count++;
            }
          }
          if (count > 0) avgReliability = totalRel / count;
        }

        // 从 nodeAssignments 计算实际并行规模（总卡数）
        let parallelSize = 1;
        for (const nodeCards of Object.values(project.nodeAssignments)) {
          parallelSize += nodeCards.length;
        }

        const crashProb = calcTrainingCrashProbability(
          parallelSize,
          false, // 不在函数内部应用 stable_training
          false, // 不在函数内部应用 gradient_clipping
          avgReliability,
        );

        // 统一通过技术效果减免（stable_training 0.5 + gradient_clipping 0.3 = 0.8）
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

          crashes.push({ projectId: project.id, lostFlops: lost });
        }
      }
    });

    for (const crash of crashes) {
      events.emit('TRAINING_CRASH', crash);
    }
  }
}
