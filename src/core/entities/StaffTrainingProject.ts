/**
 * 员工培训项目
 *
 * 三种培训类型：
 * - skill: 7 天，$5k，经验 +50，属性 +5
 * - advanced: 30 天，$30k，经验 +300，属性 +10，技能点 +1
 * - overseas: 60 天，$100k，经验 +800，全属性 +5，技能点 +2（L5+）
 */
import type { StaffAttributes } from './Employee';

/** 培训类型 */
export type StaffTrainingType = 'skill' | 'advanced' | 'overseas';

/** 培训项目状态 */
export type StaffTrainingStatus = 'in_progress' | 'completed' | 'cancelled';

/** 培训项目 */
export interface StaffTrainingProject {
  id: string;
  /** 培训类型 */
  type: StaffTrainingType;
  /** 受训员工 id */
  employeeId: string;
  /** 起始日 */
  startedAt: number;
  /** 总天数 */
  totalDays: number;
  /** 已过天数 */
  elapsedDays: number;
  /** 状态 */
  status: StaffTrainingStatus;
  /** 培训指定提升的属性 key（overseas 时为 null 表示全属性） */
  targetAttribute: keyof StaffAttributes | null;
}

/** 培训配置 */
export interface StaffTrainingConfig {
  type: StaffTrainingType;
  name: string;
  durationDays: number;
  cost: number;
  expGain: number;
  /** 属性提升点数 */
  attributeGain: number;
  /** 技能点奖励 */
  skillPointGain: number;
  /** 是否为全属性提升 */
  allAttributes: boolean;
  /** 最低等级要求 */
  minLevel: number;
}

/** 培训配置表 */
export const STAFF_TRAINING_CONFIG: Record<StaffTrainingType, StaffTrainingConfig> = {
  skill: {
    type: 'skill',
    name: '技能培训',
    durationDays: 7,
    cost: 5_000,
    expGain: 50,
    attributeGain: 5,
    skillPointGain: 0,
    allAttributes: false,
    minLevel: 1,
  },
  advanced: {
    type: 'advanced',
    name: '高级研修',
    durationDays: 30,
    cost: 30_000,
    expGain: 300,
    attributeGain: 10,
    skillPointGain: 1,
    allAttributes: false,
    minLevel: 1,
  },
  overseas: {
    type: 'overseas',
    name: '海外交流',
    durationDays: 60,
    cost: 100_000,
    expGain: 800,
    attributeGain: 5,
    skillPointGain: 2,
    allAttributes: true,
    minLevel: 5,
  },
};
