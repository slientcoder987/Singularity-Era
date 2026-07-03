import type { ResourceCategory, ResourceDefinition } from './ResourceTypes';

/**
 * ResourceRegistry
 *
 * 资源注册器：统一管理所有资源定义。
 * - 新增资源只需 register(def)，无需修改任何核心逻辑。
 * - 查询通过 id / category 进行。
 *
 * 内部使用 Map<string, ResourceDefinition> 存储。
 */
export class ResourceRegistry {
  private readonly defs = new Map<string, ResourceDefinition>();

  /** 注册一个资源定义。若 id 已存在则覆盖。 */
  register(def: ResourceDefinition): void {
    this.defs.set(def.id, def);
  }

  /** 批量注册。 */
  registerAll(defs: ResourceDefinition[]): void {
    for (const def of defs) {
      this.register(def);
    }
  }

  /** 根据 id 获取资源定义，若不存在则抛错。 */
  get(id: string): ResourceDefinition {
    const def = this.defs.get(id);
    if (!def) {
      throw new Error(`[ResourceRegistry] 未注册的资源: ${id}`);
    }
    return def;
  }

  /** 安全获取：不存在返回 undefined。 */
  tryGet(id: string): ResourceDefinition | undefined {
    return this.defs.get(id);
  }

  /** 是否已注册某资源。 */
  has(id: string): boolean {
    return this.defs.has(id);
  }

  /** 获取所有已注册资源定义。 */
  getAll(): ResourceDefinition[] {
    return Array.from(this.defs.values());
  }

  /** 按分类获取资源定义。 */
  getByCategory(cat: ResourceCategory): ResourceDefinition[] {
    return this.getAll().filter((d) => d.category === cat);
  }

  /** 获取应在顶部栏显示的资源。 */
  getTopBarResources(): ResourceDefinition[] {
    return this.getAll().filter((d) => d.uiConfig?.showInTopBar === true);
  }
}
