/**
 * 风险计算工具
 *
 * 每日风险事件检查、训练崩溃概率计算。
 */
import type { RiskState } from '../entities/RiskState';
import { RISK_EVENTS, type RiskEventConfig } from '../config/riskEvents';

/**
 * 每日风险事件检查
 *
 * 返回当日触发的风险事件列表。
 * training_crash 由 RiskSystem 的独立崩溃检查逻辑处理，此处跳过。
 * alignmentBonus（对齐技术加成）降低 AI 相关风险概率。
 */
export function checkDailyRisks(
  riskState: RiskState,
  modelMaxCapability: number,
  hasStrongModelInResearch: boolean,
  alignmentBonus: number = 0,
): RiskEventConfig[] {
  const triggered: RiskEventConfig[] = [];

  for (const evt of RISK_EVENTS) {
    // training_crash 由独立逻辑处理
    if (evt.id === 'training_crash') continue;

    const { trigger } = evt;
    let probability = trigger.baseProbability;
    let conditionsMet = true;

    if (trigger.legalDebt) {
      if (riskState.legalDebt >= trigger.legalDebt) {
        probability += (riskState.legalDebt - trigger.legalDebt) * (trigger.riskFactor ?? 0);
      } else {
        conditionsMet = false;
      }
    }
    if (trigger.trustDebt) {
      if (riskState.trustDebt >= trigger.trustDebt) {
        probability += (riskState.trustDebt - trigger.trustDebt) * (trigger.riskFactor ?? 0);
      } else {
        conditionsMet = false;
      }
    }
    if (trigger.capabilityThreshold) {
      if (modelMaxCapability >= trigger.capabilityThreshold) {
        probability += (modelMaxCapability - trigger.capabilityThreshold) * 0.0001;
      } else {
        conditionsMet = false;
      }
    }

    // AI 相关风险只在有强模型参与内部研发时检查
    if (evt.id === 'ai_misalignment' || evt.id === 'ai_deception') {
      if (!hasStrongModelInResearch) continue;
      // 对齐技术降低 AI 失控风险
      probability *= Math.max(0.01, 1 - alignmentBonus);
    }

    if (conditionsMet && Math.random() < probability) {
      triggered.push(evt);
    }
  }

  return triggered;
}

/**
 * 计算训练崩溃概率
 *
 * 注意：stable_training 和 gradient_clipping 的减免通过
 * reduce_training_crash_risk 技术效果在 RiskSystem 中统一应用，
 * 此函数不再内部重复处理。
 */
export function calcTrainingCrashProbability(
  parallelSize: number,
  _hasStableTraining: boolean,
  _hasGradientClipping: boolean,
  infrastructureReliability: number,
): number {
  // 数值修复：基础系数 0.001 → 0.0005，64 卡并行/reliability=80 时日崩溃率
  // 从 0.08 (8%) 降至 0.04 (4%)，550 天期望崩溃次数由 ~44 降至 ~22，挫败感减半。
  let baseProb = 0.0005 * parallelSize;
  baseProb *= 100 / Math.max(1, infrastructureReliability);
  // 上限 0.1 → 0.05，避免极端并行规模下每日必然崩溃
  return Math.min(0.05, baseProb);
}
