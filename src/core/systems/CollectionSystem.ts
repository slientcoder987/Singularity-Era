/**
 * 数据收集系统
 *
 * 每日推进所有 active 收集项目：
 * 1. 计算日产量（已在启动时确定，存于 dailyRate）
 * 2. 扣除每日运营成本
 * 3. 将数据按领域添加到目标数据集，加权平均更新质量
 * 4. 累计 collectedTokens
 *
 * 不在此处释放工程师（停止由 StopDataCollectionCommand 处理）。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { COLLECTION_MAP, type CollectionRouteId } from '../config/dataAcquisition';
import { ROLE_TO_STAFF_RESOURCE } from '../config/employees';
import { StaffRole } from '../entities/Employee';
import type { DataDomainId } from '../entities/Dataset';

export class CollectionSystem implements System {
  name = 'CollectionSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const activeProjects = current.dataCollectionProjects.filter((p) => p.status === 'active');
    if (activeProjects.length === 0) return;

    const completedProjects: Array<{ projectId: string; routeName: string; collected: number }> = [];

    state.update((draft) => {
      for (const project of draft.dataCollectionProjects) {
        if (project.status !== 'active') continue;

        const route = COLLECTION_MAP[project.routeId as CollectionRouteId];
        if (!route) continue;

        // 每日产量 × deltaDays
        const tokensProduced = project.dailyRate * deltaDays;
        if (tokensProduced <= 0) continue;

        // 扣除每日运营成本
        const operatingCost = route.dailyCost * deltaDays;
        const funds = draft.resources['funds'] ?? 0;
        if (funds < operatingCost) {
          // 资金不足，暂停收集
          project.status = 'stopped';
          // 释放核心工程师
          for (const empId of project.engineerIds) {
            const emp = draft.employees.find((e) => e.id === empId);
            if (emp) {
              emp.status = 'idle';
              emp.assignedProjectId = undefined;
            }
          }
          // 归还普通工程师资源
          const normalCount = Math.max(0, Math.round(
            (project.dailyRate / route.baseRate - project.engineerIds.length * 1.5) / 1.0,
          ));
          if (normalCount > 0) {
            const staffId = ROLE_TO_STAFF_RESOURCE[StaffRole.DATA_ENGINEER];
            draft.resources[staffId] = (draft.resources[staffId] ?? 0) + normalCount;
          }
          continue;
        }
        draft.resources['funds'] = funds - operatingCost;

        // improve_data_quality 技术效果提升收集质量
        const dataQualityBonus = draft.activeTechEffects
          .filter((e) => e.type === 'improve_data_quality')
          .reduce((s, e) => s + e.value, 0);
        const effectiveQuality = Math.min(route.qualityCap, project.currentQuality + dataQualityBonus);

        // 添加到目标数据集
        const ds = draft.datasets.find((d) => d.id === project.targetDatasetId);
        if (ds) {
          for (const domainId of route.targetDomains) {
            const domain = ds.domains[domainId as DataDomainId];
            if (domain) {
              const oldWeight = domain.tokens;
              domain.tokens += tokensProduced;
              domain.quality = (domain.quality * oldWeight + effectiveQuality * tokensProduced) / domain.tokens;
            }
          }
          ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
          ds.effectiveTokens = Object.values(ds.domains).reduce(
            (s, d) => s + d.tokens * d.quality * (1 - d.duplication), 0,
          );
        }

        // 累计已收集
        project.collectedTokens += tokensProduced;

        completedProjects.push({
          projectId: project.id,
          routeName: route.name,
          collected: tokensProduced,
        });
      }
    });

    for (const p of completedProjects) {
      events.emit('DATA_COLLECTED', p);
    }
  }
}
