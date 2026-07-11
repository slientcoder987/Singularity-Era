/**
 * 研发流程系统
 *
 * 每日推进研发项目进度，完成时生成实验结果。
 * 员工士气和信任债务自然恢复/衰减。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { runExperiment } from '../utils/researchUtils';
import { generateArchMatrix } from '../config/archEffects';
import { EXPERIMENT_VALIDATION } from '../config/researchConfig';

export class ResearchSystem implements System {
  name = 'ResearchSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // improve_research_speed 技术效果（如 auto_research +50%）
    const researchSpeedBonus = current.activeTechEffects
      .filter((e) => e.type === 'improve_research_speed')
      .reduce((s, e) => s + (e.type === 'improve_research_speed' ? e.value : 0), 0);

    const completedExperiments: Array<{ archId: string | null; result: import('../entities/ResearchProject').ExperimentResult }> = [];

    state.update((draft) => {
      for (const project of draft.researchProjects) {
        if (project.status !== 'in_progress') continue;

        if (project.type === 'experiment_validation') {
          const baseProgress = project.experimentScale === 'small'
            ? EXPERIMENT_VALIDATION.smallDailyProgress
            : EXPERIMENT_VALIDATION.mediumDailyProgress;
          // 技术效果加速实验进度
          const dailyProgress = baseProgress * (1 + researchSpeedBonus);
          project.progress += dailyProgress * deltaDays;
          project.computeUsed = project.computeBudget * project.progress;

          if (project.progress >= 1) {
            project.progress = 1;
            project.computeUsed = project.computeBudget;
            project.status = 'completed';
            project.completedAt = draft.date;

            // 生成实验结果
            const archMatrix = generateArchMatrix(draft.archMatrixSeed);
            const result = runExperiment(
              project.targetArchId ?? '',
              archMatrix,
              project.experimentScale ?? 'small',
            );
            result.date = draft.date;
            project.experimentResult = result;
            draft.experimentResults.push(result);

            // 释放研究员
            for (const empId of project.researcherIds) {
              const emp = draft.employees.find((e) => e.id === empId);
              if (emp) {
                emp.status = 'idle';
                emp.assignedProjectId = undefined;
              }
            }

            completedExperiments.push({ archId: project.targetArchId, result });
          }
        }
      }

      // 员工士气自然恢复（每日 +0.1，上限 100）
      if (draft.riskState.employeeMorale < 100) {
        draft.riskState.employeeMorale = Math.min(100, draft.riskState.employeeMorale + 0.1 * deltaDays);
      }

      // 信任债务缓慢自然衰减（每日 -0.05）
      if (draft.riskState.trustDebt > 0) {
        draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - 0.05 * deltaDays);
      }
    });

    // 在 state.update 完成后再触发事件
    for (const { archId, result } of completedExperiments) {
      events.emit('EXPERIMENT_COMPLETED', { archId, result });
    }
  }
}
