/**
 * 活跃危机事件实体
 */

export interface ActiveCrisis {
  id: string;
  /** 危机配置 id */
  crisisId: string;
  /** 关联的模型 id（如适用） */
  modelId?: string;
  /** 触发日期 */
  triggeredAt: number;
  /** 是否已处理 */
  resolved: boolean;
  /** 选择的处理选项 id */
  resolvedOptionId?: string;
}

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createActiveCrisis(
  crisisId: string,
  triggeredAt: number,
  modelId?: string,
): ActiveCrisis {
  return {
    id: genId('crisis'),
    crisisId,
    modelId,
    triggeredAt,
    resolved: false,
  };
}
