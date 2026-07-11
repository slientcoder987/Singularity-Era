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
}
