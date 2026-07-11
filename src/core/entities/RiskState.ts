/**
 * 风险状态实体
 *
 * 跟踪法律债务、信任债务、员工士气、公司声誉、对齐程度。
 * 由 RiskSystem 每日更新，由灰色数据路线积累。
 */

/** 风险状态 */
export interface RiskState {
  /** 法律债务 0-100 */
  legalDebt: number;
  /** 信任债务 0-100 */
  trustDebt: number;
  /** 员工士气 0-100 */
  employeeMorale: number;
  /** 公司声誉 0-100 */
  reputation: number;
  /** 对齐程度 0-1 */
  alignmentLevel: number;
  /** 已触发的风险事件历史 */
  triggeredEvents: Array<{
    eventId: string;
    eventName: string;
    date: number;
    severity: 'minor' | 'major' | 'critical';
  }>;
}
