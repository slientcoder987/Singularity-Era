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
  MANAGER = 'manager',                 // 管理人员（高管层，影响全公司管理效率）
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

/**
 * 员工状态
 * - idle: 空闲，可分配
 * - assigned: 已分配到项目
 * - training: 培训中，不可分配
 */
export type EmployeeStatus = 'idle' | 'assigned' | 'training';

/** 员工绩效记录（每月评估一次） */
export interface PerformanceRecord {
  /** 评估日期（day） */
  evalDay: number;
  /** 出勤率（0-1） */
  attendance: number;
  /** 项目贡献分（0-100） */
  projectContribution: number;
  /** 绩效总分（0-100） */
  score: number;
  /** 绩效等级 */
  grade: 'S' | 'A' | 'B' | 'C';
}

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

  // ===== 扩展字段 =====
  /** 所属部门 id（无部门为 undefined） */
  departmentId?: string;
  /** 是否已授股权 */
  hasEquity?: boolean;
  /** 股权授予日（用于 2 年不可离职约束） */
  equityGrantedDay?: number;
  /** 上次发奖金日（用于 30 天冷却） */
  lastBonusDay?: number;
  /** 当前培训项目 id（无则为 undefined） */
  trainingId?: string;
  /** 本月工作天数（用于绩效评估） */
  monthlyWorkDays?: number;
  /** 本月项目贡献累积（用于绩效评估） */
  monthlyContribution?: number;
  /** 最近一次绩效记录 */
  lastPerformance?: PerformanceRecord;
}
