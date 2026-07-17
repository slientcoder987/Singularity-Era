/**
 * 员工产出的技术 idea
 *
 * 由 IdeaGenerationSystem 每 7 天判定生成。
 * 玩家通过 AcceptIdeaCommand / RejectIdeaCommand 处理。
 *
 * 两种产物：
 * - accelerate: 加速现有技术（成熟度 +5~15 或研发进度 +20%）
 * - unique: 生成技术树外的「独有技术」，初始 maturity=30
 */
export type IdeaKind = 'accelerate' | 'unique';

export interface TechIdea {
  id: string;
  /** 产出该 idea 的员工 id */
  sourceEmployeeId: string;
  /** 生成日期（游戏天数） */
  generatedDay: number;
  /** idea 类型 */
  kind: IdeaKind;
  /** 目标技术 id（accelerate: 现有技术；unique: 候选池中的独有技术） */
  targetTechId: string;
  /**
   * idea 数值含义随 kind 不同：
   * - accelerate + 研发中技术：进度推进比例（如 0.20 = +20% totalDays）
   * - accelerate + 已解锁技术：maturity 加成（如 10 = +10 maturity）
   * - unique：初始 maturity（通常 30）
   */
  value: number;
  /** idea 标题（UI 展示用） */
  title: string;
  /** idea 描述（UI 展示用） */
  description: string;
  /** 处理状态 */
  status: 'pending' | 'accepted' | 'rejected';
}
