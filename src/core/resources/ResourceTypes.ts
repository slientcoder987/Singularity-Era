/**
 * 资源定义相关类型
 */

/** 资源分类 */
export type ResourceCategory =
  | 'currency'
  | 'hardware'
  | 'energy'
  | 'human'
  | 'asset'
  | 'custom';

/** 资源在 UI 上的格式化方式 */
export type ResourceFormat = 'number' | 'currency' | 'percentage' | 'tflops';

/** 资源的 UI 渲染提示 */
export interface ResourceUIConfig {
  icon: string;
  color: string;
  showInTopBar: boolean;
  format?: ResourceFormat;
}

/**
 * 资源定义
 *
 * 描述一种资源的元信息：类型、范围、初始值、UI 提示。
 * 这是配置化的"资源蓝图"，所有资源（资金、算力卡、电力等）都通过它注册。
 */
export interface ResourceDefinition {
  /** 唯一标识，如 'funds', 'compute_h100' */
  id: string;
  /** 显示名称 */
  name: string;
  /** 所属分类 */
  category: ResourceCategory;
  /** 是否连续值（资金）还是离散（计算卡数量） */
  isContinuous: boolean;
  /** 最小值（资金可为 -Infinity 允许负债） */
  minValue: number;
  /** 最大值 */
  maxValue: number;
  /** 初始值 */
  initialValue: number;
  /** UI 渲染提示 */
  uiConfig?: ResourceUIConfig;
}
