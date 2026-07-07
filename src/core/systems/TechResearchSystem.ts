/**
 * TechResearchSystem
 *
 * 每日推进研发项目：
 * 1. 分配的研究员产出科技点
 * 2. 项目累积天数
 * 3. 满足成本和天数后完成，解锁效果
 */

import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { StaffRole } from '../entities/Employee';
import { getTechNode } from '../config/techTree';

export class TechResearchSystem implements System {
  name = 'TechResearchSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const activeProjects = current.researchProjects.filter((r) => r.status === 'researching');
    if (activeProjects.length === 0) return;

    const completed: Array<{ projectId: string; techId: string; techName: string }> = [];

    state.update((draft) => {
      for (const project of draft.researchProjects) {
        if (project.status !== 'researching') continue;

        const node = getTechNode(project.techId);
        if (!node) {
          project.status = 'paused';
          continue;
        }

        // 研究员每日产出科技点 = skill × 0.1
        let dailyPoints = 0;
        for (const empId of project.assignedEmployeeIds) {
          const emp = draft.employees.find((e) => e.id === empId);
          if (emp && emp.role === StaffRole.RESEARCHER) {
            const skill = (emp.attributes.intelligence + emp.attributes.creativity) / 2;
            dailyPoints += skill * 0.1;
          }
        }

        // 消耗科技点（从科技点池中扣除项目产出）
        const pointsProduced = dailyPoints * deltaDays;
        project.investedPoints += pointsProduced;
        project.investedDays += deltaDays;

        // 完成判定：投入点数 ≥ 成本 且 投入天数 ≥ 研发天数
        if (project.investedPoints >= node.researchCost && project.investedDays >= node.researchDays) {
          project.status = 'completed';
          draft.completedTechs.push(node.id);

          // 解锁效果
          for (const effect of node.effects) {
            draft.activeTechEffects.push(effect);
          }

          // 解锁隐性维度
          if (node.revealsHiddenDims) {
            const revealedSet = new Set(draft.revealedHiddenDims);
            for (const dim of node.revealsHiddenDims) {
              revealedSet.add(dim);
            }
            draft.revealedHiddenDims = Array.from(revealedSet);
          }

          completed.push({ projectId: project.id, techId: node.id, techName: node.name });
        }
      }
    });

    for (const c of completed) {
      events.emit('TECH_COMPLETED', c.projectId, c.techId, c.techName);
    }
  }
}
