/** 数据收集项目（持续运行） */
export interface DataCollectionProject {
  id: string;
  /** 收集路线 id */
  routeId: string;
  /** 分配的数据工程师员工 id 列表 */
  engineerIds: string[];
  /** 目标数据集 id */
  targetDatasetId: string;
  /** 开始日期 */
  startedAt: number;
  /** 累计已收集 token 数（十亿） */
  collectedTokens: number;
  /** 状态 */
  status: 'active' | 'stopped';
  /** 当前日产量（十亿 token/天） */
  dailyRate: number;
  /** 当前有效质量 0-1 */
  currentQuality: number;
  /**
   * 分配的普通数据工程师数量（设计-4 修复）。
   * 停止收集时直接归还此数量，避免依赖 dailyRate/baseRate 反推导致公式变更后归还错误数量。
   */
  normalEngineerCount: number;
}
