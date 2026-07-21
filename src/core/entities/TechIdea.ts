/**
 * 员工产出的技术 idea
 *
 * 由 IdeaGenerationSystem 每 7 天判定生成。
 * 玩家通过 AcceptIdeaCommand 启动验证，验证过程每日推进（TechResearchSystem.processIdeaVerification 处理）。
 *
 * 两种产物（PR-C：删除"研发中技术"候选后）：
 * - accelerate: 优化已解锁但未满级的技术（maturity +5~10）
 * - unique: 生成技术树外的「独有技术」，初始 maturity=5（PR-D：固定 < 10%，需实验提升）
 *
 * 验证机制：
 * - 接受后需经过验证天数 + 每日资源消耗
 * - 验证完成时根据成功概率判定（概率基于提出者 intelligence / creativity / level）
 * - 成功 → 应用效果；失败 → 仅获 25% 效果
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
  /** 目标技术 id（accelerate: 已解锁技术；unique: 候选池中的独有技术） */
  targetTechId: string;
  /**
   * idea 数值含义随 kind 不同：
   * - accelerate：maturity 加成（如 10 = +10 maturity，封顶 100）
   * - unique：初始 maturity（PR-D：固定 5，严格 < 10%，需通过实验提升到更高水平）
   */
  value: number;
  /** idea 标题（UI 展示用） */
  title: string;
  /** idea 描述（UI 展示用） */
  description: string;
  /** 处理状态 */
  status: 'pending' | 'verifying' | 'accepted' | 'rejected' | 'failed';

  // ===== 验证相关字段（status='verifying' 时使用） =====
  /** 验证已过天数 */
  verificationDays?: number;
  /** 验证所需总天数 */
  verificationTotalDays?: number;
  /** 每日验证成本（$） */
  verificationDailyCost?: number;
  /** 验证成功概率（0~1，启动验证时计算） */
  successProbability?: number;
}
