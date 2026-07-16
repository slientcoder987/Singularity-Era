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
import {
  accumulateResearcherContribution,
  getDataEngineerBonus,
  getCompanyCollectionSpeed,
} from '../utils/crossSystemUtils';

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

        // 改进 A：数据工程师效率加成（定向 + 被动 + 质量）
        const engBonus = getDataEngineerBonus(draft, project.id, project.engineerIds);
        // 改进 B：pipeline_optimization 技能额外加速采集
        const companySpeed = 1 + getCompanyCollectionSpeed(draft);

        // 每日产量 × deltaDays × 工程师效率倍率 × 公司技能倍率
        const tokensProduced = project.dailyRate * deltaDays * engBonus.speedMultiplier * companySpeed;
        if (tokensProduced <= 0) continue;

        // ★ 数据工程师每日贡献累积
        accumulateResearcherContribution(draft, project.engineerIds, 1);

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
          // 归还普通工程师资源（设计-4：直接读取字段，不反推）
          const normalCount = project.normalEngineerCount ?? 0;
          if (normalCount > 0) {
            const staffId = ROLE_TO_STAFF_RESOURCE[StaffRole.DATA_ENGINEER];
            draft.resources[staffId] = (draft.resources[staffId] ?? 0) + normalCount;
          }
          continue;
        }
        draft.resources['funds'] = funds - operatingCost;

        // improve_data_quality 技术效果 + 数据工程师创造力加成 提升收集质量
        const dataQualityBonus = draft.activeTechEffects
          .filter((e) => e.type === 'improve_data_quality')
          .reduce((s, e) => s + e.value, 0) + engBonus.qualityBonus;
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

        // 设计-17：质量随累计收集量增长（数据管道学习曲线效应）
        // 对数增长：前期提升快，后期逐渐饱和至 qualityCap。
        // 每 10 倍收集量约提升 0.05 质量，模拟"管道越用越精"的现实。
        const oldCollected = project.collectedTokens;
        const newCollected = oldCollected + tokensProduced;
        const qualityGainFromScale =
          (Math.log10(newCollected + 1) - Math.log10(oldCollected + 1)) * 0.05;
        if (qualityGainFromScale > 0) {
          project.currentQuality = Math.min(
            route.qualityCap,
            project.currentQuality + qualityGainFromScale,
          );
        }

        // 累计已收集
        project.collectedTokens = newCollected;

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
