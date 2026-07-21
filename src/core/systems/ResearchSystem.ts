/**
 * 研发流程系统
 *
 * PR-B 重设计：
 * - 实验每日消耗集群总算力的 computeRatio 比例（与训练竞争算力）
 * - 实验完成时按公式 D 计算成熟度增益，受公式 A 上限约束
 * - 旧 small/medium 实验机制保留兼容（experimentScale 非 null 时走旧逻辑）
 *
 * 每日推进研发项目进度，完成时生成实验结果。
 * 信任债务自然衰减。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { Employee } from '../entities/Employee';
import { runExperiment } from '../utils/researchUtils';
import { generateArchMatrix } from '../config/archEffects';
import {
  EXPERIMENT_VALIDATION,
  EXPERIMENT_CONFIG,
  RESEARCH_CONFIG,
  calcMaxMaturityCap,
  calcMaturityGain,
  calcExperimentBudget,
  calcExperimentFundsCost,
} from '../config/researchConfig';
import { TECH_MAP, IDEA_TECH_MAP } from '../config/techTree';
import {
  getStaffResearchSpeedMultiplier,
  accumulateResearcherContribution,
  getActiveTechEffects,
} from '../utils/crossSystemUtils';
import { aggregateMultiplicative, TECH_EFFECT_CAPS } from '../utils/techEffectScale';
import { calcClusterTotalTflops } from '../utils/computeUtilization';
import { calcEmployeeEfficiency } from '../utils/employeeUtils';
import { StaffRole } from '../entities/Employee';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ResearchSystem implements System {
  name = 'ResearchSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // improve_research_speed 技术效果（如 auto_research +50%，按 maturity 缩放）
    // ★ PR-A 修复：改用乘法叠加 + 硬性上限 +100%
    const researchSpeedBonus = aggregateMultiplicative(
      getActiveTechEffects(current),
      'improve_research_speed',
      TECH_EFFECT_CAPS.improve_research_speed,
    );

    // PR-B：集群总算力（用于实验每日算力消耗）
    const clusterTotalTflops = calcClusterTotalTflops(current);

    const completedExperiments: Array<{ archId: string | null; result: import('../entities/ResearchProject').ExperimentResult }> = [];

    state.update((draft) => {
      // ★ T5 修复：empMap 提到 update 顶部一次性构建，所有 employees.find 替换为 O(1) 查找
      const empMap = new Map<string, Employee>();
      for (const e of draft.employees) empMap.set(e.id, e);

      // ★ E3 修复：getStaffResearchSpeedMultiplier 不依赖 projectId，原在 per-project
      //   循环内调用导致 O(RP × R × D × E)。提到循环外计算一次。
      //   安全性：该函数仅依赖研究员的 level/attributes/fatigue/loyalty + 部门负责人 leadership，
      //   这些字段在实验循环中不被修改（仅 monthlyContribution 变化），故单次计算结果在整轮循环内有效。
      const staffSpeedMult = getStaffResearchSpeedMultiplier(draft);

      for (const project of draft.researchProjects) {
        if (project.status !== 'in_progress') continue;
        if (project.type !== 'experiment_validation') continue;

        // ===== PR-B 分支：新机制（experimentParams + computeRatio） =====
        if (project.experimentParams !== null && project.computeRatio !== null) {
          // 每日消耗算力 = 集群总算力 × computeRatio × deltaDays
          const dailyCompute = clusterTotalTflops * project.computeRatio * deltaDays;
          // 技术效果加速实验进度（提升有效算力利用率）
          const effectiveDailyCompute = dailyCompute * (1 + researchSpeedBonus);
          // ★ E3 修复：staffSpeedMult 已提到循环外计算
          const computeGain = effectiveDailyCompute * staffSpeedMult;

          const budget = project.computeBudgetTotal ?? project.computeBudget;
          project.computeUsed += computeGain;
          project.progress = Math.min(1, project.computeUsed / Math.max(1, budget));

          // 累积研究员贡献
          accumulateResearcherContribution(draft, project.researcherIds, computeGain / Math.max(1, budget));

          if (project.progress >= 1) {
            project.progress = 1;
            project.computeUsed = budget;
            project.status = 'completed';
            project.completedAt = draft.date;

            // 生成实验结果
            const archMatrix = generateArchMatrix(draft.archMatrixSeed);
            const archMaturity = draft.techMaturity[project.targetArchId ?? ''] ?? 0;
            // PR-B：噪声σ 随参数量降低（大参数量实验更精确）
            const paramsBasedSigma = EXPERIMENT_CONFIG.baseNoiseSigma
              * (1 - Math.min(0.5, Math.log2(Math.max(1, project.experimentParams)) / 10));
            const result = runExperimentWithNoise(
              project.targetArchId ?? '',
              archMatrix,
              paramsBasedSigma,
              project.experimentParams,
              0,
              archMaturity,
            );
            result.date = draft.date;
            project.experimentResult = result;
            draft.experimentResults.push(result);
            // ★ U1 修复：experimentResults 无界增长会导致 aggregateExperiments 的 filter
            //   越来越慢（每次 O(N)）。保留最近 1000 条足够覆盖所有 archTechId 的历史。
            if (draft.experimentResults.length > 1000) {
              draft.experimentResults = draft.experimentResults.slice(-1000);
            }

            // 公式 D：成熟度增益
            const techId = project.targetArchId ?? '';
            let shouldAutoRestart = false;
            if (techId) {
              // 查找技术难易度（预设技术树或独有技术表）
              const techNode = TECH_MAP[techId] ?? IDEA_TECH_MAP[techId];
              const difficulty = techNode?.difficulty ?? 1;
              const existingMaturity = draft.techMaturity[techId] ?? 0;
              const maxCap = calcMaxMaturityCap(project.experimentParams, difficulty);
              // 计算研究员有效智力总和
              let sumIntelligence = 0;
              // ★ T5 修复：复用顶部 empMap，避免每项目重建
              for (const rid of project.researcherIds) {
                const r = empMap.get(rid);
                if (!r || r.status === 'training') continue;
                const eff = calcEmployeeEfficiency(r, draft.departments, draft.employees);
                sumIntelligence += eff * r.attributes.intelligence;
              }
              const gain = calcMaturityGain(
                project.experimentParams,
                project.computeRatio,
                existingMaturity,
                sumIntelligence,
                difficulty,
              );
              // 增益受公式 A 上限约束
              draft.techMaturity[techId] = Math.min(maxCap, existingMaturity + gain);

              // PR-F：to_cap 模式下，若未达上限则自动重试
              if (project.repeatMode === 'to_cap' && draft.techMaturity[techId] < maxCap) {
                const restartFundsCost = calcExperimentFundsCost(project.experimentParams);
                const currentFunds = draft.resources['funds'] ?? 0;
                if (currentFunds >= restartFundsCost) {
                  shouldAutoRestart = true;
                  draft.resources['funds'] = Math.max(0, currentFunds - restartFundsCost);
                  // 重置项目状态，研究员保持 assigned
                  project.status = 'in_progress';
                  project.progress = 0;
                  project.computeUsed = 0;
                  project.completedAt = null;
                  project.experimentResult = null;
                  project.startedAt = draft.date;
                }
              }
            }

            if (!shouldAutoRestart) {
              // 释放研究员
              // ★ T5 修复：用 empMap O(1) 查找替代 employees.find
              for (const empId of project.researcherIds) {
                const emp = empMap.get(empId);
                if (emp) {
                  emp.status = 'idle';
                  emp.assignedProjectId = undefined;
                }
              }
            }

            // P2-5 修复：to_cap 自动重试时不发完成事件，避免误导玩家
            if (!shouldAutoRestart) {
              completedExperiments.push({ archId: project.targetArchId, result });
            }
          }
          continue;
        }

        // ===== 旧机制兼容分支（experimentScale 非 null 的旧存档） =====
        const baseProgress = project.experimentScale === 'small'
          ? EXPERIMENT_VALIDATION.smallDailyProgress
          : EXPERIMENT_VALIDATION.mediumDailyProgress;
        const dailyProgress = baseProgress * (1 + researchSpeedBonus);
        // ★ E3 修复：staffSpeedMult 已提到循环外计算
        project.progress += dailyProgress * deltaDays * staffSpeedMult;
        project.computeUsed = project.computeBudget * project.progress;

        accumulateResearcherContribution(draft, project.researcherIds, dailyProgress);

        if (project.progress >= 1) {
          project.progress = 1;
          project.computeUsed = project.computeBudget;
          project.status = 'completed';
          project.completedAt = draft.date;

          const archMatrix = generateArchMatrix(draft.archMatrixSeed);
          const archMaturity = draft.techMaturity[project.targetArchId ?? ''] ?? 0;
          const result = runExperiment(
            project.targetArchId ?? '',
            archMatrix,
            project.experimentScale ?? 'small',
            0,
            archMaturity,
          );
          result.date = draft.date;
          project.experimentResult = result;
          draft.experimentResults.push(result);
          // ★ U1 修复：同上，截断 experimentResults 至最近 1000 条
          if (draft.experimentResults.length > 1000) {
            draft.experimentResults = draft.experimentResults.slice(-1000);
          }

          const archTechId = project.targetArchId ?? '';
          if (archTechId) {
            const gain = project.experimentScale === 'medium' ? 12 : 5;
            const existing = draft.techMaturity[archTechId] ?? 0;
            draft.techMaturity[archTechId] = Math.min(100, existing + gain);
          }

          for (const empId of project.researcherIds) {
            // ★ T5 修复：用 empMap O(1) 查找替代 employees.find
            const emp = empMap.get(empId);
            if (emp) {
              emp.status = 'idle';
              emp.assignedProjectId = undefined;
            }
          }

          completedExperiments.push({ archId: project.targetArchId, result });
        }
      }

      // 信任债务缓慢自然衰减（每日 -0.05）
      if (draft.riskState.trustDebt > 0) {
        draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - 0.05 * deltaDays);
      }

      // ===== PR-F：实验队列自动启动 =====
      // 若并发项目数 < 上限，且队列中有待执行项，则自动启动
      // 队列项的研究员可能已被占用，仅启动研究员可用的项
      // ★ T4 修复：原 while 循环每次迭代都 filter 全部 researchProjects 算 activeCount
      //   和 currentTotalRatio。改为进入循环前预算一次，循环内增量更新。
      let activeCount = 0;
      let currentTotalRatio = 0;
      for (const p of draft.researchProjects) {
        if (p.status === 'in_progress') {
          activeCount++;
          if (p.computeRatio !== null) currentTotalRatio += p.computeRatio ?? 0;
        }
      }

      while (true) {
        if (activeCount >= RESEARCH_CONFIG.maxConcurrentProjects) break;
        if (draft.experimentQueue.length === 0) break;

        const queueItem = draft.experimentQueue[0];

        // 检查队列项指定的研究员是否空闲
        // ★ T5 修复：复用顶部 empMap，O(1) 查找替代 employees.find
        const availableResearchers = queueItem.researcherIds.filter((rid) => {
          const emp = empMap.get(rid);
          return emp && emp.role === StaffRole.RESEARCHER && emp.status !== 'assigned';
        });

        // 若指定研究员均不可用，跳过此项（移除并继续）
        // 若未指定研究员，可用所有空闲研究员
        // ★ T4 修复：idleResearchers 只在需要时计算一次（队列项无指定研究员时）
        let researchersToUse: string[];
        if (queueItem.researcherIds.length > 0) {
          researchersToUse = availableResearchers;
        } else {
          const idleResearchers: string[] = [];
          for (const e of draft.employees) {
            if (e.role === StaffRole.RESEARCHER && e.status === 'idle') idleResearchers.push(e.id);
          }
          researchersToUse = idleResearchers;
        }

        if (researchersToUse.length === 0) {
          // 无可用研究员，保留队列项等待下次检查
          break;
        }

        // 检查资金
        const fundsCost = calcExperimentFundsCost(queueItem.experimentParams);
        const currentFunds = draft.resources['funds'] ?? 0;
        if (currentFunds < fundsCost) {
          // 资金不足，保留队列项等待下次检查
          break;
        }

        // P0-1 修复：全局算力比例上限校验（★ T4 增量更新后的值）
        if (currentTotalRatio + queueItem.computeRatio > 0.95) {
          break;
        }

        // 启动实验
        const computeBudgetTotal = calcExperimentBudget(queueItem.experimentParams);
        draft.resources['funds'] = Math.max(0, currentFunds - fundsCost);

        const projectId = genId('research');
        draft.researchProjects.push({
          id: projectId,
          type: 'experiment_validation',
          status: 'in_progress',
          targetArchId: queueItem.techId,
          researcherIds: [...researchersToUse],
          computeBudget: computeBudgetTotal,
          computeUsed: 0,
          progress: 0,
          startedAt: draft.date,
          completedAt: null,
          experimentResult: null,
          experimentScale: null,
          experimentParams: queueItem.experimentParams,
          computeRatio: queueItem.computeRatio,
          computeBudgetTotal,
          repeatMode: queueItem.repeatMode,
          queueItemId: queueItem.id,
        });

        // ★ T4 增量更新：新项目启动后，activeCount +1，currentTotalRatio 累加
        activeCount++;
        currentTotalRatio += queueItem.computeRatio;

        // 标记研究员为已分配
        // ★ T5 修复：用 empMap O(1) 查找替代 employees.find
        for (const empId of researchersToUse) {
          const emp = empMap.get(empId);
          if (emp) {
            emp.status = 'assigned';
            emp.assignedProjectId = projectId;
          }
        }

        // 从队列中移除已启动的项
        draft.experimentQueue.shift();
      }
    });

    for (const { archId, result } of completedExperiments) {
      events.emit('EXPERIMENT_COMPLETED', { archId, result });
    }
  }
}

/**
 * PR-B：带自定义噪声σ的实验运行（新机制使用参数量决定噪声）
 *
 * 与 runExperiment 类似，但噪声σ由调用方传入（基于参数量计算）。
 */
function runExperimentWithNoise(
  archTechId: string,
  archMatrix: import('../config/archEffects').ArchMatrix,
  noiseSigma: number,
  _params: number,
  confidenceBonus: number,
  techMaturity: number,
): import('../entities/ResearchProject').ExperimentResult {
  const trueBonuses = archMatrix[archTechId] ?? {};
  const modelScale = Math.min(1, _params / 64);

  const estimatedBonuses: Partial<Record<string, number>> = {};
  for (const capId of Object.keys(trueBonuses) as Array<import('../config/capabilities').CapabilityId>) {
    const trueValue = trueBonuses[capId] ?? 0;
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    estimatedBonuses[capId] = trueValue + z * noiseSigma;
  }

  let matConfBonus = 0;
  if (techMaturity >= 100) matConfBonus = 0.2;
  else if (techMaturity >= 50) matConfBonus = 0.1;

  return {
    archTechId,
    estimatedBonuses,
    confidence: Math.max(0.1, Math.min(1, (1 - noiseSigma) + confidenceBonus + matConfBonus)),
    modelScale,
    date: 0,
  };
}