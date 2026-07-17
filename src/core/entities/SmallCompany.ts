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
 */
export interface SmallCompany {
  id: string;
  /** 公司名 */
  name: string;
  /** 拥有的技术 id 列表（1~3 个） */
  technologies: string[];
  /** 估值（美元），由 baseValuation + techCount × perTechValuation 计算 */
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
