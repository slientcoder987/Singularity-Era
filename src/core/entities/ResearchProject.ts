/**
 * 研发项目实体
 */

/** 研发项目状态 */
export type ResearchStatus = 'researching' | 'completed' | 'paused';

export interface ResearchProject {
  id: string;
  /** 对应科技节点 id */
  techId: string;
  /** 已投入科技点 */
  investedPoints: number;
  /** 已投入天数 */
  investedDays: number;
  /** 分配的员工 id */
  assignedEmployeeIds: string[];
  /** 状态 */
  status: ResearchStatus;
  /** 开始日期 */
  startDate: number;
}

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 创建研发项目 */
export function createResearchProject(
  techId: string,
  assignedEmployeeIds: string[],
  date: number,
): ResearchProject {
  return {
    id: genId('res'),
    techId,
    investedPoints: 0,
    investedDays: 0,
    assignedEmployeeIds,
    status: 'researching',
    startDate: date,
  };
}
