/**
 * 技术查询工具
 *
 * 统一所有「技术是否解锁 / 成熟度多少 / 技术节点查询」入口。
 * 替代旧的 `unlockedTechs.includes(techId)` 调用模式。
 */
import type { GameData } from '../GameState';
import { TECH_MAP, IDEA_TECH_MAP, type TechNode, type IdeaTechNode } from '../config/techTree';

/**
 * 查询技术节点
 *
 * 优先查 TECH_MAP（预设技术树），其次 IDEA_TECH_MAP（运行时独有技术）。
 */
export function getTechNode(techId: string): TechNode | IdeaTechNode | null {
  return TECH_MAP[techId] ?? IDEA_TECH_MAP[techId] ?? null;
}

/**
 * 技术是否已解锁（maturity ≥ 1）
 */
export function isTechUnlocked(data: GameData, techId: string): boolean {
  return (data.techMaturity[techId] ?? 0) >= 1;
}

/**
 * 获取技术成熟度（0~100，未在表中返回 0）
 */
export function getTechMaturity(data: GameData, techId: string): number {
  return data.techMaturity[techId] ?? 0;
}

/**
 * 获取所有已解锁技术 id（maturity ≥ 1），用于遍历场景
 */
export function getUnlockedTechIds(data: GameData): string[] {
  return Object.keys(data.techMaturity).filter((id) => (data.techMaturity[id] ?? 0) >= 1);
}

/**
 * 获取所有已解锁技术及其成熟度（用于 UI 展示）
 */
export function getUnlockedTechsWithMaturity(data: GameData): Array<{ techId: string; maturity: number }> {
  return Object.entries(data.techMaturity)
    .filter(([, m]) => m >= 1)
    .map(([techId, maturity]) => ({ techId, maturity }));
}
