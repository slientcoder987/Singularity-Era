/**
 * 员工实体相关类型定义
 */

/** 员工角色枚举 */
export enum StaffRole {
  RESEARCHER = 'researcher',           // 研究员
  DATA_ENGINEER = 'data_engineer',     // 数据工程师
  SYSTEM_ENGINEER = 'system_engineer', // 系统工程师
  PRODUCT_MANAGER = 'product_manager', // 产品经理
  LEGAL_PR = 'legal_pr',               // 法务/公关
}

/** 员工基础属性（五维） */
export interface StaffAttributes {
  intelligence: number;   // 智力
  creativity: number;     // 创造力
  leadership: number;     // 领导力
  stamina: number;        // 体力
  charisma: number;       // 魅力
}

/** 技能效果 */
export interface SkillEffect {
  /** 效果类型，如 'reduce_training_compute', 'increase_model_cap' */
  type: string;
  /** 效果数值 */
  value: number;
  /** 特定目标 id（可选） */
  targetId?: string;
}

/** 技能 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  effect: SkillEffect;
  unlocked: boolean;
  /** 解锁所需技能点 */
  cost: number;
}

/** 员工状态 */
export type EmployeeStatus = 'idle' | 'assigned';

/** 员工实体 */
export interface Employee {
  id: string;
  name: string;
  role: StaffRole;
  attributes: StaffAttributes;
  skills: Skill[];
  skillPoints: number;
  level: number;
  /** 年薪（美元） */
  salary: number;
  /** 忠诚度 0-100 */
  loyalty: number;
  /** 疲劳度 0-100 */
  fatigue: number;
  status: EmployeeStatus;
  /** 已分配的项目 id（未分配为 undefined） */
  assignedProjectId?: string;
  /** 入职日 */
  hireDay: number;
  /** 经验值 */
  experience: number;
}
