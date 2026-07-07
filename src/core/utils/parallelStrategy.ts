/**
 * 并行策略效率计算
 *
 * DP/TP/PP 不同组合影响显存、效率和通信开销。
 */

import type { ParallelStrategy } from '../config/techTree';
import { clamp } from '../utils';

/** 并行配置 */
export interface ParallelConfig {
  /** 数据并行度 */
  dp: number;
  /** 张量并行度 */
  tp: number;
  /** 流水线并行度 */
  pp: number;
}

/** 并行效率结果 */
export interface ParallelEfficiencyResult {
  /** 综合并行效率 0-1 */
  efficiency: number;
  /** 显存需求缩减因子 */
  memoryReduction: number;
  /** 通信开销比例 */
  communicationOverhead: number;
  /** 瓶颈说明 */
  bottlenecks?: string[];
  /** 缺失的科技（如有） */
  missingTech?: string[];
}

/** 计算并行效率 */
export function computeParallelEfficiency(
  config: ParallelConfig,
  totalCards: number,
  unlockedStrategies: ParallelStrategy[],
): ParallelEfficiencyResult {
  const bottlenecks: string[] = [];
  const missingTech: string[] = [];

  // 检查科技解锁
  if (config.tp > 1 && !unlockedStrategies.includes('tp') && !unlockedStrategies.includes('dp_tp_pp')) {
    missingTech.push('tensor_parallel_basic');
  }
  if (config.pp > 1 && !unlockedStrategies.includes('pp') && !unlockedStrategies.includes('dp_tp_pp')) {
    missingTech.push('pipeline_parallel');
  }

  const dp = Math.max(1, config.dp);
  const tp = Math.max(1, config.tp);
  const pp = Math.max(1, config.pp);
  const used = dp * tp * pp;
  if (used > totalCards) {
    bottlenecks.push(`并行度 ${dp}×${tp}×${pp}=${used} 超过卡数 ${totalCards}`);
  }

  // 效率模型
  let efficiency = 1.0;
  // TP 效率：每多一张卡损失 2%
  if (tp > 1) efficiency *= Math.max(0.6, 1 - (tp - 1) * 0.02);
  // PP 效率：bubble 开销
  if (pp > 1) efficiency *= Math.max(0.7, 1 - (pp - 1) / (pp * 4));
  // DP 效率：几乎无损
  if (dp > 1) efficiency *= 0.98;

  // 通信开销
  let communicationOverhead = 0;
  if (tp > 1) communicationOverhead += 0.05 * (tp - 1);
  if (pp > 1) communicationOverhead += 0.03 * (pp - 1);

  // 显存缩减（TP 和 PP 都能切分模型）
  const memoryReduction = tp * pp;

  return {
    efficiency: clamp(efficiency - communicationOverhead, 0.3, 1),
    memoryReduction,
    communicationOverhead,
    bottlenecks: bottlenecks.length > 0 ? bottlenecks : undefined,
    missingTech: missingTech.length > 0 ? missingTech : undefined,
  };
}

/** 推荐并行配置 */
export function recommendParallel(
  modelParams: { paramCount: number; architecture: string },
  totalCards: number,
  unlockedStrategies: ParallelStrategy[],
): ParallelConfig {
  // 简单推荐：根据模型大小决定 TP/PP
  const paramB = modelParams.paramCount;
  const hasTP = unlockedStrategies.includes('tp') || unlockedStrategies.includes('dp_tp_pp');
  const hasPP = unlockedStrategies.includes('pp') || unlockedStrategies.includes('dp_tp_pp');

  let tp = 1;
  let pp = 1;

  if (hasTP) {
    if (paramB >= 200) tp = 8;
    else if (paramB >= 70) tp = 4;
    else if (paramB >= 30) tp = 2;
  }
  if (hasPP && paramB >= 200) pp = 2;

  // 确保 dp × tp × pp ≤ totalCards
  while (tp * pp > totalCards && tp > 1) tp--;
  while (tp * pp > totalCards && pp > 1) pp--;

  const dp = Math.max(1, Math.floor(totalCards / (tp * pp)));
  return { dp, tp, pp };
}
