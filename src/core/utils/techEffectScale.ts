/**
 * 技术效果按成熟度缩放 + 聚合工具
 *
 * 设计原则：
 * - 数值型 effect（如 reduce_compute_cost / capability_bonus）按 maturity/100 线性缩放
 * - extend_context 特殊处理：1 + (multiplier - 1) × scale，避免 maturity=0 时 multiplier=1 锁死上下文
 * - 解锁型 effect（unlock_parallel_strategy / parallel_reliability / unlock_data_* / unlock_sft 等）不缩放，maturity≥1 即生效
 * - maturity≥100 时直接返回原 effect（满级）
 *
 * ★ PR-A 防滥用机制：新增 aggregateMultiplicative / aggregateMultiplier /
 *   aggregateCapabilityBonuses / aggregateAdditive 工具函数
 *   替换原 Σ value 加法累加，避免"100 个 1% 技术堆出 100%"漏洞
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
      case 'parallel_reliability':
      case 'unlock_data_purge':
      case 'unlock_data_dedup':
      case 'unlock_data_curate':
      case 'unlock_sft':
      case 'unlock_rlhf':
      case 'unlock_dpo':
      case 'unlock_cot':
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
      case 'parallel_reliability':
      case 'unlock_data_purge':
      case 'unlock_data_dedup':
      case 'unlock_data_curate':
      case 'unlock_sft':
      case 'unlock_rlhf':
      case 'unlock_dpo':
      case 'unlock_cot':
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

// ============================================================
// PR-A: 技术效果聚合工具（防滥用机制）
//
// 核心问题：原代码使用 Σ value 加法累加，N 个 v_i=1% 技术堆出 N% 总效果，
//          100 个独有技术即可达到 100% 减少导致免费训练。
//
// 解决方案：按效果类型采用不同聚合公式，并加硬性上限：
//   1. 数值减少/增益型 → 乘法叠加 1 - Π(1-v_i)，自然趋近 100% 但永不到达
//   2. 倍率型 → 乘积 Π m_i，配硬性倍率上限
//   3. 能力加成型 → 按 capability 分组加法 + 每能力独立上限
//   4. 数值调整型（modify_base_score_*）→ 加法 + 全局上下限
// ============================================================

/**
 * 聚合数值型技术效果（乘法叠加 + 硬性上限）
 *
 * 公式：combined = 1 - Π(1 - v_i)，再 clamp 至 [0, maxCap]
 *
 * 适用类型：reduce_compute_cost, reduce_memory, improve_utilization,
 *          improve_research_speed, improve_data_quality, reduce_training_crash_risk,
 *          improve_alignment, reduce_legal_risk, reduce_cooling_pue,
 *          improve_parallel_efficiency, improve_experiment_confidence
 *
 * 示例对比（10 个 v=0.05 的技术）：
 *   - 旧加法：5% × 10 = 50%
 *   - 新乘法：1 - 0.95^10 = 40.1%
 *
 * 示例对比（100 个 v=0.01 的技术）：
 *   - 旧加法：1% × 100 = 100%（漏洞！免费训练）
 *   - 新乘法：1 - 0.99^100 = 63.4%（仍付 36.6% 成本）
 *
 * @param effects  技术效果列表（已按 maturity 缩放）
 * @param type     目标效果类型
 * @param maxCap   硬性上限，如 0.6 表示最多 60%；默认 1.0（100%）
 * @returns        聚合值，范围 [0, maxCap]
 */
export function aggregateMultiplicative(
  effects: TechEffect[],
  type: TechEffect['type'],
  maxCap: number = 1.0,
): number {
  let product = 1.0;
  for (const e of effects) {
    if (e.type === type && 'value' in e) {
      const v = Math.max(0, Math.min(1, (e as { value: number }).value));
      product *= (1 - v);
    }
  }
  const combined = 1 - product;
  return Math.max(0, Math.min(maxCap, combined));
}

/**
 * 聚合倍率型技术效果（乘积 + 硬性上限）
 *
 * 公式：combined = Π m_i，再 clamp 至 [1, maxCap]
 *
 * 适用类型：extend_context
 *
 * 示例（3 个技术，multiplier=2/4/6）：
 *   - 旧加法（错）：2+4+6=12x
 *   - 新乘积：2×4×6=48x → 若 maxCap=32 则 clamp 至 32x
 *
 * @param effects  技术效果列表
 * @param type     目标效果类型
 * @param maxCap   最大倍率上限，如 32；默认 Infinity
 * @returns        聚合倍率，范围 [1, maxCap]
 */
export function aggregateMultiplier(
  effects: TechEffect[],
  type: TechEffect['type'],
  maxCap: number = Infinity,
): number {
  let product = 1.0;
  for (const e of effects) {
    if (e.type === type && 'multiplier' in e) {
      const m = Math.max(1, (e as { multiplier: number }).multiplier);
      product *= m;
    }
  }
  return Math.max(1, Math.min(maxCap, product));
}

/**
 * 聚合能力加成（按 capability 分组，每能力独立加法 + 独立上限）
 *
 * 公式：对每个 capability，combined_cap = clamp(Σ bonus_i, 0, maxPerCapability)
 *
 * 适用类型：capability_bonus
 *
 * 设计：能力加成语义为"加法增益"（每个技术独立贡献），
 *      但每能力有硬性上限避免单一能力被无限堆叠突破涌现阈值。
 *
 * @param effects            技术效果列表
 * @param maxPerCapability   每个能力的加成上限，默认 0.5（+50%）
 * @returns                  Record<capabilityId, totalBonus>
 */
export function aggregateCapabilityBonuses(
  effects: TechEffect[],
  maxPerCapability: number = 0.5,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of effects) {
    if (e.type === 'capability_bonus') {
      const cap = (e as { capability: string }).capability;
      result[cap] = (result[cap] ?? 0) + (e as { bonus: number }).bonus;
    }
  }
  for (const cap of Object.keys(result)) {
    result[cap] = Math.max(0, Math.min(maxPerCapability, result[cap]));
  }
  return result;
}

/**
 * 聚合加法型技术效果（Σ value + 全局上下限）
 *
 * 公式：combined = clamp(Σ v_i, minCap, maxCap)
 *
 * 适用类型：modify_base_score_E/A/B, modify_alpha/beta
 *
 * 设计：参数调整语义为加法（如 A=-200 表示参数基准 -200），
 *      多技术叠加合理，但需上下限避免极端值破坏缩放公式。
 *
 * @param effects  技术效果列表
 * @param type     目标效果类型
 * @param options  可选上下限：{ maxCap?, minCap? }
 * @returns        聚合值
 */
export function aggregateAdditive(
  effects: TechEffect[],
  type: TechEffect['type'],
  options: { maxCap?: number; minCap?: number } = {},
): number {
  let sum = 0;
  for (const e of effects) {
    if (e.type === type && 'value' in e) {
      sum += (e as { value: number }).value;
    }
  }
  if (options.maxCap !== undefined) sum = Math.min(sum, options.maxCap);
  if (options.minCap !== undefined) sum = Math.max(sum, options.minCap);
  return sum;
}

/**
 * 效果类型 → 推荐硬性上限（参考表）
 *
 * 供消费方调用 aggregateMultiplicative 时使用，集中维护避免散落。
 */
export const TECH_EFFECT_CAPS = {
  reduce_compute_cost: 0.60,           // 训练算力减少最多 60%（仍需付 40%）
  reduce_memory: 0.70,                  // 显存减少最多 70%
  reduce_training_crash_risk: 0.80,     // 崩溃风险降低最多 80%
  reduce_legal_risk: 0.70,              // 法律风险降低最多 70%
  reduce_cooling_pue: 0.50,             // PUE 降低最多 50%
  improve_utilization: 0.30,            // 利用率提升最多 +30%
  improve_research_speed: 1.00,         // 研发速度最多 +100%
  improve_experiment_confidence: 0.50,  // 实验置信度最多 +50%
  improve_parallel_efficiency: 0.50,    // 并行效率最多 +50%
  improve_data_quality: 0.50,           // 数据质量最多 +50%
  improve_alignment: 0.80,              // 对齐最多 +80%
  extend_context: 32,                   // 上下文最多 32×
  capability_bonus: 0.50,               // 每能力加成最多 +50%
  modify_base_score_A: 500,             // A 参数调整范围 ±500
  modify_base_score_B: 500,             // B 参数调整范围 ±500
  modify_base_score_E: 2.0,             // E 参数调整范围 ±2.0
  modify_alpha: 0.5,                    // alpha 调整范围 ±0.5
  modify_beta: 0.5,                     // beta 调整范围 ±0.5
} as const;
