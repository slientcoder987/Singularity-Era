/**
 * 部门实体
 *
 * 固定 5 个部门，对应 5 种角色。每个部门有 1 名负责人（L7+ 核心员工），
 * 负责人领导力决定部门加成。普通员工通过 normalHeadcount 配额分配给部门。
 */
import { StaffRole } from './Employee';

/** 部门类型 */
export type DepartmentType =
  | 'research'      // 研发部
  | 'data'          // 数据部
  | 'infrastructure' // 基础设施部
  | 'product'       // 产品部
  | 'legal_pr';     // 法务公关部

/** 部门实体 */
export interface Department {
  id: string;
  /** 部门类型（5 种之一） */
  type: DepartmentType;
  /** 部门名称 */
  name: string;
  /** 对应的员工角色 */
  role: StaffRole;
  /** 部门负责人 id（核心员工，L7+） */
  headId: string | null;
  /** 核心员工成员 id 列表 */
  memberIds: string[];
  /** 普通员工配额（分配给本部门的普通员工数） */
  normalHeadcount: number;
  /** 年度预算（美元，预留） */
  budget: number;
}

/** 部门加成结果 */
export interface DepartmentBonus {
  /** 部门效率乘数（1.0 = 无加成） */
  efficiency: number;
  /** 全公司协同乘数（1.0 = 无加成） */
  coordination: number;
}

/** 部门类型 → 中文名映射 */
export const DEPARTMENT_NAMES: Record<DepartmentType, string> = {
  research: '研发部',
  data: '数据部',
  infrastructure: '基础设施部',
  product: '产品部',
  legal_pr: '法务公关部',
};

/** 部门类型 → 对应角色映射 */
export const DEPARTMENT_ROLE_MAP: Record<DepartmentType, StaffRole> = {
  research: StaffRole.RESEARCHER,
  data: StaffRole.DATA_ENGINEER,
  infrastructure: StaffRole.SYSTEM_ENGINEER,
  product: StaffRole.PRODUCT_MANAGER,
  legal_pr: StaffRole.LEGAL_PR,
};

/** 部门负责人最低等级 */
export const DEPT_HEAD_MIN_LEVEL = 7;
