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
import { getStaffResearchSpeedMultiplier, accumulateResearcherContribution, getActiveTechEffects } from '../utils/crossSystemUtils';

export class ResearchSystem implements System {
  name = 'ResearchSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // improve_research_speed 技术效果（如 auto_research +50%，按 maturity 缩放）
    const researchSpeedBonus = getActiveTechEffects(current)
      .filter((e) => e.type === 'improve_research_speed')
      .reduce((s, e) => s + e.value, 0);

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
          // 研究员效率加速
          const staffSpeedMult = getStaffResearchSpeedMultiplier(draft);
          project.progress += dailyProgress * deltaDays * staffSpeedMult;
          project.computeUsed = project.computeBudget * project.progress;

          // 累积研究员贡献
          accumulateResearcherContribution(draft, project.researcherIds, dailyProgress);

          if (project.progress >= 1) {
            project.progress = 1;
            project.computeUsed = project.computeBudget;
            project.status = 'completed';
            project.completedAt = draft.date;

            // 生成实验结果（传入当前 maturity 用于降噪与置信度加成）
            const archMatrix = generateArchMatrix(draft.archMatrixSeed);
            const archMaturity = draft.techMaturity[project.targetArchId ?? ''] ?? 0;
            const result = runExperiment(
              project.targetArchId ?? '',
              archMatrix,
              project.experimentScale ?? 'small',
              0,               // confidenceBonus（未来可接 improve_experiment_confidence 技能）
              archMaturity,
            );
            result.date = draft.date;
            project.experimentResult = result;
            draft.experimentResults.push(result);

            // 实验完成提升对应架构技术成熟度（small +5, medium +12）
            const archTechId = project.targetArchId ?? '';
            if (archTechId) {
              const gain = project.experimentScale === 'medium' ? 12 : 5;
              const existing = draft.techMaturity[archTechId] ?? 0;
              draft.techMaturity[archTechId] = Math.min(100, existing + gain);
            }

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

      // 设计-12 修复：员工士气自然恢复移至 StaffSystem（最后一个系统），
      // 与 OperationsSystem/RiskSystem 的事件冲击分离，避免同日混合导致士气曲线难以理解。

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
