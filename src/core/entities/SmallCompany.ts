/**
 * 市场中的小公司（轻量级实体）
 *
 * 由 SmallCompanyMarketSystem 每 14 天刷新 2~3 家。
 * 玩家通过 AcquireSmallCompanyCommand 收购，获得其所有技术。
 *
 * 与大型 CompetitorState 的区别：
 * - 纯技术交易，无算力/员工转移，100% 成功率
 * - 生命周期 30 天，到期未购买则消失
 * - 不参与 CompetitorSystem 的破产/合并机制
 *
 * PR-D：每项技术在生成时即 roll 好初始成熟度（20~80），玩家收购前可见。
 * 估值公式：$200k + Σ_tech($50k + maturity × $5k)
 * 例：3 项技术，平均 maturity 50 → 估值 $1.25M；3 项 maturity 80 → $1.7M
 */
export interface SmallCompany {
  id: string;
  /** 公司名 */
  name: string;
  /** 拥有的技术 id 列表（1~3 个） */
  technologies: string[];
  /**
   * 每项技术对应的初始成熟度（PR-D：随机 20~80）
   * key = technologies 中的 techId，value = 该技术的初始成熟度
   */
  techMaturities: Record<string, number>;
  /** 估值（美元），PR-D：基于技术成熟度总和计算 */
  valuation: number;
  /** 出现日期（游戏天数） */
  spawnedDay: number;
  /** 生命周期（天），到期未收购则消失 */
  lifespan: number;
  /** 是否已被收购 */
  acquired: boolean;
  /** 背景描述（UI 展示用） */
  background: string;
}
