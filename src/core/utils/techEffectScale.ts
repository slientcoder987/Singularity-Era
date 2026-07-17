/**
 * 技术效果按成熟度缩放
 *
 * 设计原则：
 * - 数值型 effect（如 reduce_compute_cost / capability_bonus）按 maturity/100 线性缩放
 * - extend_context 特殊处理：1 + (multiplier - 1) × scale，避免 maturity=0 时 multiplier=1 锁死上下文
 * - 解锁型 effect（unlock_parallel_strategy / unlock_cluster_network 等）不缩放，maturity≥1 即生效
 * - maturity≥100 时直接返回原 effect（满级）
 */
import type { TechEffect } from '../entities/Infrastructure';

/**
 * 按 maturity/100 线性缩放单个 TechEffect
 *
 * @param effect   原始效果
 * @param maturity 0~100
 */
export function scaleTechEffect(effect: TechEffect, maturity: number): TechEffect {
  if (maturity >= 100) return effect;
  const scale = Math.max(0, maturity) / 100;
  if (scale <= 0) {
    // maturity 为 0 时，缩放型效果归零；解锁型保留（maturity≥1 才会被 getActiveTechEffects 收集）
    switch (effect.type) {
      case 'unlock_parallel_strategy':
      case 'unlock_cluster_network':
      case 'upgrade_storage':
      case 'upgrade_network_topology':
      case 'enable_synthetic_data':
        return effect;
      default:
        return effect;
    }
  }

  switch (effect.type) {
    // 线性缩放数值型
    case 'modify_base_score_E':
    case 'modify_base_score_A':
    case 'modify_base_score_B':
    case 'modify_alpha':
    case 'modify_beta':
    case 'reduce_compute_cost':
    case 'reduce_memory':
    case 'improve_research_speed':
    case 'improve_experiment_confidence':
    case 'reduce_training_crash_risk':
    case 'improve_data_quality':
    case 'reduce_legal_risk':
    case 'improve_alignment':
    case 'improve_utilization':
    case 'improve_parallel_efficiency':
    case 'reduce_cooling_pue':
      return { ...effect, value: effect.value * scale };
    case 'capability_bonus':
      return { ...effect, bonus: effect.bonus * scale };
    case 'enable_distillation':
      return { ...effect, efficiencyBonus: effect.efficiencyBonus * scale };
    case 'enable_synthetic_data':
      return { ...effect, qualityBonus: effect.qualityBonus * scale };
    case 'extend_context':
      // 上下文倍率特殊处理：1 + (multiplier - 1) × scale
      // 例如 multiplier=4, maturity=50 → 1 + 3×0.5 = 2.5（而非 4×0.5=2）
      return { ...effect, multiplier: 1 + (effect.multiplier - 1) * scale };
    // 解锁型不缩放（maturity≥1 即生效）
    case 'unlock_parallel_strategy':
    case 'unlock_cluster_network':
    case 'upgrade_storage':
    case 'upgrade_network_topology':
      return effect;
    default:
      return effect;
  }
}

/**
 * 批量缩放效果列表（便捷方法）
 */
export function scaleTechEffects(effects: TechEffect[], maturity: number): TechEffect[] {
  return effects.map((e) => scaleTechEffect(e, maturity));
}
