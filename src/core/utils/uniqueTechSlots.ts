/**
 * PR-E：独有技术槽位与维护成本计算
 *
 * 设计目标：限制独有技术数量，避免"100 个独有技术叠加破坏平衡"。
 *
 * 槽位公式：
 *   maxSlots = 4 + floor(researcherCount / 3) + floor(gameDay / 365)
 *
 * 数值表：
 * - 第 0 天，0 研究员 → 4 槽
 * - 第 100 天，4 研究员 → 5 槽
 * - 第 365 天，6 研究员 → 7 槽
 * - 第 730 天，12 研究员 → 10 槽
 * - 第 1095 天，20 研究员 → 13 槽
 *
 * 维护成本公式（每项独有技术）：
 *   dailyMaintenance = $50 + $1 × maturity
 *
 * 数值表：
 * - maturity 5（刚解锁的创意）→ $55/天
 * - maturity 30（开源/小公司初始）→ $80/天
 * - maturity 60（小公司高成熟度）→ $110/天
 * - maturity 100（满级）→ $150/天
 *
 * 注：主技术树技术不消耗槽位、不收维护费（行业标准知识）。
 *     仅 acceptedIdeaTechs 中的独有技术计入。
 */
import type { GameData } from '../GameState';
import { StaffRole } from '../entities/Employee';

/** 槽位基数 */
const SLOT_BASE = 4;
/** 每多少研究员 +1 槽 */
const SLOT_PER_RESEARCHERS = 3;
/** 每多少游戏日 +1 槽 */
const SLOT_PER_DAYS = 365;

/** 维护费固定基数（美元/天） */
const MAINT_BASE = 50;
/** 维护费按成熟度系数（美元/天/maturity 点） */
const MAINT_PER_MATURITY = 1;

/**
 * 计算当前可用的独有技术槽位上限
 *
 * 公式：4 + floor(researcherCount / 3) + floor(gameDay / 365)
 */
export function getMaxUniqueTechSlots(data: GameData): number {
  const researcherCount = data.employees.filter(
    (e) => e.role === StaffRole.RESEARCHER,
  ).length;
  const dayBonus = Math.floor(data.date / SLOT_PER_DAYS);
  const researcherBonus = Math.floor(researcherCount / SLOT_PER_RESEARCHERS);
  return SLOT_BASE + researcherBonus + dayBonus;
}

/**
 * 当前已占用的独有技术槽位数
 *
 * 等于 acceptedIdeaTechs.length（所有已注册的独有技术，无论来源）。
 */
export function getUniqueTechCount(data: GameData): number {
  return data.acceptedIdeaTechs.length;
}

/**
 * 判断是否还能接受 N 个新的独有技术
 *
 * @param data             当前游戏状态
 * @param additionalCount  即将新增的数量（默认 1）
 * @returns true 若 currentCount + additionalCount <= maxSlots
 */
export function canAcceptUniqueTechs(data: GameData, additionalCount: number = 1): boolean {
  const current = getUniqueTechCount(data);
  const max = getMaxUniqueTechSlots(data);
  return current + additionalCount <= max;
}

/**
 * 计算单项独有技术的每日维护成本
 *
 * 公式：$50 + $1 × maturity
 */
export function getSingleTechMaintenance(maturity: number): number {
  return MAINT_BASE + MAINT_PER_MATURITY * Math.max(0, maturity);
}

/**
 * 计算所有独有技术的每日维护成本总和
 */
export function getTotalUniqueTechMaintenance(data: GameData): number {
  let total = 0;
  for (const tech of data.acceptedIdeaTechs) {
    const maturity = data.techMaturity[tech.id] ?? 0;
    // 仅对 maturity ≥ 1（已解锁）的技术收维护费
    if (maturity >= 1) {
      total += getSingleTechMaintenance(maturity);
    }
  }
  return total;
}