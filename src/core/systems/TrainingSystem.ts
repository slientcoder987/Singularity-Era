import type { GameState, GameData } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { TrainingProject } from '../entities/TrainingProject';
import type { ComputeCardSpec } from '../entities/ComputeCard';
import type { Model, CapabilityVector } from '../entities/Model';
import type { TechEffect } from '../entities/Infrastructure';
import { getCardSpec } from '../config/computeCards';
import { TECH_MAP, IDEA_TECH_MAP } from '../config/techTree';
import { scaleTechEffect } from '../utils/techEffectScale';
import {
  calculateEffectiveComputeFromSummary,
  summarizeCardSpecsFromMap,
  type ModelParams,
  type CardSpecSummary,
  type UtilizationResult,
} from '../utils/computeUtilization';
import {
  calcBaseScore,
  deriveBaseScoreParams,
  calculateCapabilities,
} from '../utils/capabilityCalc';
import {
  getStaffTrainingSpeedMultiplier,
  getStaffTrainingStabilityBonus,
  accumulateResearcherContribution,
  getCompanyTrainingComputeReduction,
  getActiveTechEffects,
} from '../utils/crossSystemUtils';
import { getActiveCloudTFLOPS } from '../utils/cloudComputeUtils';
import { findCluster, findDataCenter, findNode } from '../utils/infraIndex';
import { aggregateExperiments } from '../utils/researchUtils';
import type { CapabilityId } from '../config/capabilities';
import { StaffRole } from '../entities/Employee';

/** 计算期望损失（基于训练进度 0-1） */
function calcExpectedLoss(progress: number): number {
  // 损失曲线：初始10，渐近2.5
  return 2.5 + 7.5 * Math.exp(-5 * progress);
}

/** Box-Muller 正态分布随机数 */
function gaussianNoise(sigma: number): number {
  const u1 = Math.max(Math.random(), 1e-10);
  const u2 = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** 判定是否有某技术效果 */
function hasTechEffect(effects: TechEffect[], type: string): boolean {
  return effects.some((e) => e.type === type);
}

/** 简易字符串哈希（djb2），用于从模型 ID 生成噪声种子 */
function hashStr(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * TrainingSystem
 *
 * 每日推进训练项目，模拟完整训练过程：
 * 1. 根据进度判定训练阶段（预热/主训练/衰减），应用阶段利用率修正
 * 2. 计算有效算力并扣除
 * 3. 更新训练损失（带噪声）
 * 4. 概率触发训练事件（损失尖峰、梯度爆炸）
 * 5. 定期保存 checkpoint
 * 6. 完成时根据稳定度修正最终能力
 */
export class TrainingSystem implements System {
  name = 'TrainingSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    const trainingProjects = current.trainingProjects.filter((p) => p.status === 'training');
    if (trainingProjects.length === 0) return;

    const completed: Array<{ id: string; modelName: string }> = [];
    const progressInfo: Array<{
      id: string; modelName: string; effectiveTflops: number; utilization: number;
      loss: number; valLoss: number; phase: string; stability: number;
    }> = [];
    const events_log: Array<{ id: string; day: number; event: string; severity: 'info' | 'warning' | 'critical' }> = [];
    // BUG-6 修复：收集 update 内的事件，update 结束后再 emit
    const pausedProjects: Array<{ id: string; reason: string }> = [];
    const releasedModels: Array<{ name: string; score: number }> = [];

    // 设计-18：自动恢复因风险事件暂停的训练（到达 autoResumeDay 时自动恢复）
    const autoResumedProjects: Array<{ id: string; modelName: string }> = [];

    // 缓存全局加成（每系统调用一次，避免每个训练项目重复全员工扫描）
    const companyComputeReduction = getCompanyTrainingComputeReduction(current);
    const cloudTFLOPS = getActiveCloudTFLOPS(current);
    // 预计算派生技术效果（按 maturity 缩放，替代 draft.activeTechEffects）
    const activeTechEffects = getActiveTechEffects(current);

    // ★ T6 修复：原循环内每训练项目都调用 getStaffTrainingSpeedMultiplier(draft, project.id)
    //   和 getStaffTrainingStabilityBonus(draft)，内部全量扫 researchers。
    //   改为在 update 顶部预算一次，循环内 O(1) 查找。
    //   注：用 current（只读快照）计算，结果在当日 tick 内稳定（研究员属性不会在训练循环中变）。
    const projectIdToStaffMult = new Map<string, number>();
    for (const p of trainingProjects) {
      projectIdToStaffMult.set(p.id, getStaffTrainingSpeedMultiplier(current, p.id));
    }
    const precomputedStabilityBonus = getStaffTrainingStabilityBonus(current);

    // PR-B：实验占用集群算力，按比例削减训练可用算力
    // Σ computeRatio 为所有进行中实验占用的算力比例之和；云算力不受影响
    const experimentRatioSum = current.researchProjects
      .filter((p) => p.status === 'in_progress'
        && p.type === 'experiment_validation'
        && p.computeRatio !== null)
      .reduce((s, p) => s + (p.computeRatio ?? 0), 0);
    const experimentLoadFactor = Math.max(0, 1 - experimentRatioSum);

    // ★ 性能优化（核心）：在 state.update 外用 current（只读快照）预计算所有只读数据。
    //   原实现在 state.update(draft => ...) 回调内调用 summarizeProjectCardSpecs(draft, project)，
    //   Immer draft 代理对 resourceMeta 聚合桶的每次属性访问都做拦截 → 几千桶 × 代理开销 = 严重卡顿。
    //   移出后：只读计算用 current（无代理），update 内只做纯状态写入。
    //   安全性：resourceMeta/cluster/dc/node 在训练循环中不被修改，current 与 draft 基础值一致。
    interface ProjectComputeInfo {
      summary: CardSpecSummary;
      result: UtilizationResult;
      dailyProgress: number;
      progressBefore: number;
      phase: 'warmup' | 'main' | 'decay';
      phaseModifier: number;
    }
    const projectComputeInfo = new Map<string, ProjectComputeInfo>();
    const pausedNoCards: string[] = []; // 因无可用卡而需暂停的项目 id

    for (const project of trainingProjects) {
      // ★ C2 修复：直接构建 CardSpecSummary，跳过数十万元素中间数组分配
      // ★ 性能：用 current 而非 draft，避免 Immer 代理开销
      const summary = this.summarizeProjectCardSpecs(current, project);

      if (summary.totalCards === 0) {
        pausedNoCards.push(project.id);
        continue;
      }

      // 查找集群和数据中心（用 current，训练循环中不变）
      const cluster = findCluster(current, project.clusterId);
      const dc = cluster?.dataCenterId
        ? findDataCenter(current, cluster.dataCenterId)
        : undefined;

      // 计算集群中单节点最大卡槽数
      let maxSlotsPerNode = 8;
      if (cluster) {
        for (const nid of cluster.nodes) {
          const n = findNode(current, nid);
          if (n && n.slotCount > maxSlotsPerNode) maxSlotsPerNode = n.slotCount;
        }
      }

      const modelParams: ModelParams = {
        paramCount: project.paramCount,
        architecture: project.architecture,
        parallelConfig: project.parallelConfig,
      };

      const result = calculateEffectiveComputeFromSummary(
        summary,
        cluster,
        dc,
        activeTechEffects,
        modelParams,
        maxSlotsPerNode,
      );

      // 计算训练进度
      const progressBefore = 1 - project.computeRemaining / project.computeTotal;

      // 判定训练阶段
      const phase: 'warmup' | 'main' | 'decay' =
        progressBefore < 0.05 ? 'warmup' :
        progressBefore < 0.85 ? 'main' : 'decay';

      // 阶段利用率修正
      const phaseModifier = phase === 'warmup' ? 0.7 : phase === 'decay' ? 0.95 : 1.0;

      // 每日推进 = 有效算力 × 阶段修正 × deltaDays
      const staffSpeedMult = projectIdToStaffMult.get(project.id) ?? 1.0;
      const speedMultiplier = staffSpeedMult * (1 + companyComputeReduction);
      const cloudUtilization = 0.9;
      const cloudProgress = cloudTFLOPS * cloudUtilization * phaseModifier * deltaDays * speedMultiplier;
      const dailyProgress = result.effectiveTflops * experimentLoadFactor * phaseModifier * deltaDays * speedMultiplier + cloudProgress;

      projectComputeInfo.set(project.id, {
        summary, result, dailyProgress, progressBefore, phase, phaseModifier,
      });
    }

    // 自动恢复检查：用 current 预计算（不依赖 draft）
    const autoResumeChecks = new Map<string, boolean>();
    for (const project of current.trainingProjects) {
      if (project.status === 'paused' && project.autoResumeDay !== undefined && current.date >= project.autoResumeDay) {
        const summary = this.summarizeProjectCardSpecs(current, project);
        autoResumeChecks.set(project.id, summary.totalCards > 0);
      }
    }

    state.update((draft) => {
      // ★ E5 修复：预计算研究员分组，替代循环内 draft.employees.filter O(E) × P 次。
      //   安全性：研究员的 role/status/assignedProjectId 在训练循环中不被修改
      //   （仅 monthlyContribution 变化），故预计算结果在整轮循环内有效。
      const idleResearcherIds: string[] = [];
      const assignedResearcherIdsByProject = new Map<string, string[]>();
      for (const e of draft.employees) {
        if (e.role !== StaffRole.RESEARCHER) continue;
        if (e.status === 'idle') {
          idleResearcherIds.push(e.id);
        } else if (e.status === 'assigned' && e.assignedProjectId) {
          let arr = assignedResearcherIdsByProject.get(e.assignedProjectId);
          if (!arr) {
            arr = [];
            assignedResearcherIdsByProject.set(e.assignedProjectId, arr);
          }
          arr.push(e.id);
        }
      }

      // 第一遍：自动恢复风险暂停的训练
      for (const project of draft.trainingProjects) {
        if (project.status === 'paused' && project.autoResumeDay !== undefined && draft.date >= project.autoResumeDay) {
          // ★ 性能：用预计算结果替代 draft 上遍历 resourceMeta
          if (autoResumeChecks.get(project.id)) {
            project.status = 'training';
            project.pauseReason = null;
            project.autoResumeDay = undefined;
            project.trainingLog.push({
              day: draft.date,
              event: '风险暂停期满，自动恢复训练',
              severity: 'info',
            });
            autoResumedProjects.push({ id: project.id, modelName: project.modelName });
          }
        }
      }

      // 第二遍：推进训练项目
      for (const project of draft.trainingProjects) {
        if (project.status !== 'training') continue;

        // ★ 性能：因无可用卡暂停（预计算阶段已判定）
        if (pausedNoCards.includes(project.id)) {
          project.status = 'paused';
          project.pauseReason = '无可用计算卡';
          pausedProjects.push({ id: project.id, reason: project.pauseReason });
          continue;
        }

        // ★ 性能：从预计算 Map 获取所有只读结果，不再在 draft 上遍历 resourceMeta
        const info = projectComputeInfo.get(project.id);
        if (!info) continue; // 不应发生（trainingProjects 已过滤）

        const { result, dailyProgress, phase } = info;

        // 阶段切换
        const oldPhase = project.trainingPhase;
        project.trainingPhase = phase;
        if (oldPhase !== phase) {
          const phaseNames: Record<string, string> = {
            warmup: '预热期', main: '主训练期', decay: '衰减期',
          };
          project.trainingLog.push({
            day: draft.date,
            event: `进入${phaseNames[phase]}`,
            severity: 'info',
          });
        }

        // 扣除算力
        project.computeRemaining = Math.max(0, project.computeRemaining - dailyProgress);

        // 正式训练提升技术成熟度（PR-B v2 需求 3c）
        // P1-3 修复：提升基础增益，使训练与实验效率平衡
        // 公式：每日增益 = 0.15×deltaDays + 1.0×(当日消耗算力/总需求算力)
        // 30 天完整训练累计获得 ~5.5 点成熟度（基础 4.5 + 比例 1.0）
        const computeConsumedRatio = dailyProgress / Math.max(1, project.computeTotal);
        for (const techId of project.techIds) {
          const mat = draft.techMaturity[techId] ?? 0;
          if (mat >= 1 && mat < 100) {
            const gain = 0.15 * deltaDays + 1.0 * computeConsumedRatio;
            draft.techMaturity[techId] = Math.min(100, mat + gain);
          }
        }

        // 计算训练进度
        const progressAfter = 1 - project.computeRemaining / project.computeTotal;

        // ===== 损失更新 =====
        const expectedLoss = calcExpectedLoss(progressAfter);

        // 收集技术效果（PR2：按 maturity 缩放，支持 IDEA_TECH_MAP 独有技术）
        // ★ P0-4 修复：必须读 draft.techMaturity（已在本 update 中 +0.05）而非 current.techMaturity
        //   否则能力计算用旧值，自相矛盾
        const techEffects = project.techIds
          .map((tid) => {
            const node = TECH_MAP[tid] ?? IDEA_TECH_MAP[tid];
            if (!node) return null;
            const mat = draft.techMaturity[tid] ?? 0;
            if (mat < 1) return null;
            return scaleTechEffect(node.effect, mat);
          })
          .filter((e): e is TechEffect => e !== null);

        const hasGradientClipping = hasTechEffect(techEffects, 'reduce_training_crash_risk') ||
          project.techIds.includes('gradient_clipping');
        const hasStableTraining = project.techIds.includes('stable_training');

        // 损失噪声：主训练期噪声较大
        const lossNoiseSigma = phase === 'main' ? 0.15 : 0.08;
        let loss = expectedLoss + gaussianNoise(lossNoiseSigma);

        // 尖峰恢复期：额外衰减
        if (project.spikeRecoveryDays > 0) {
          project.spikeRecoveryDays = Math.max(0, project.spikeRecoveryDays - deltaDays);
        }

        // ===== 训练事件判定 =====
        // 损失尖峰概率（研究员稳定度可降低）
        // ★ T6 修复：用顶部预算的 precomputedStabilityBonus 替代每项目重算
        const stabilityBonus = precomputedStabilityBonus;
        const spikeProb = hasGradientClipping ? 0.01 * (1 - stabilityBonus) : 0.05 * (1 - stabilityBonus);
        if (Math.random() < spikeProb * deltaDays) {
          const spikeMagnitude = 0.5 + Math.random() * 1.5;
          loss += spikeMagnitude;
          project.lossSpikeCount++;
          project.stabilityScore = Math.max(0.3, project.stabilityScore - 0.02);
          project.spikeRecoveryDays = 2;
          project.trainingLog.push({
            day: draft.date,
            event: `损失尖峰 +${spikeMagnitude.toFixed(2)}`,
            severity: 'warning',
          });
          events_log.push({ id: project.id, day: draft.date, event: '损失尖峰', severity: 'warning' });
        }

        // 梯度爆炸概率
        const explosionProb = hasStableTraining ? 0.001 : 0.005;
        if (Math.random() < explosionProb * deltaDays && progressAfter > 0.05) {
          // 回退到上一个 checkpoint
          const lostSinceCheckpoint = project.lastCheckpointRemaining - project.computeRemaining;
          project.computeRemaining = project.lastCheckpointRemaining;
          project.lostFlops += Math.abs(lostSinceCheckpoint);
          project.gradientExplosionCount++;
          project.stabilityScore = Math.max(0.3, project.stabilityScore - 0.1);
          loss = calcExpectedLoss(1 - project.computeRemaining / project.computeTotal) + 2;
          project.trainingLog.push({
            day: draft.date,
            event: `梯度爆炸！回退到检查点，损失 ${Math.abs(lostSinceCheckpoint).toFixed(0)} TFLOPS·天`,
            severity: 'critical',
          });
          events_log.push({ id: project.id, day: draft.date, event: '梯度爆炸', severity: 'critical' });
        }

        // 验证损失（略高于训练损失，带更大噪声）
        const valLoss = loss + gaussianNoise(0.2) + 0.1;

        project.currentLoss = Math.max(1.5, loss);
        project.validationLoss = Math.max(1.5, valLoss);

        // 记录损失历史（保留最近100个点）
        project.lossHistory.push({
          day: draft.date,
          progress: progressAfter,
          loss: project.currentLoss,
          valLoss: project.validationLoss,
        });
        if (project.lossHistory.length > 100) {
          project.lossHistory.shift();
        }

        // Checkpoint 保存
        const progressSinceCheckpoint = project.lastCheckpointRemaining - project.computeRemaining;
        if (progressSinceCheckpoint >= project.checkpointInterval) {
          project.lastCheckpointRemaining = project.computeRemaining;
          project.lastCheckpointDay = draft.date;
          project.trainingLog.push({
            day: draft.date,
            event: '检查点已保存',
            severity: 'info',
          });
        }

        // 限制日志长度
        if (project.trainingLog.length > 50) {
          project.trainingLog = project.trainingLog.slice(-50);
        }

        // ===== 完成判定 =====
        if (project.computeRemaining <= 0) {
          project.status = 'completed';
          project.completedAt = draft.date;
          completed.push({ id: project.id, modelName: project.modelName });

          // ★ 性能优化：移除 O(卡数) 卡释放逻辑。
          //   聚合存储下 assignedProjectId 不在桶上（assignedProjectMap 始终为空，
          //   见 cardIndex.ts L57-60 注释），原代码遍历 10万 UID 逐个 releaseIndex.get(uid)
          //   是无效空操作。训练分配追踪已由 TrainingProject.nodeAssignments 承担，
          //   项目完成时 nodeAssignments 随 project 保留但不再被读取（status='completed'）。

          // 生成模型实体
          const dataset = draft.datasets.find((d) => d.id === project.datasetId);
          if (dataset) {
            const scoreParams = deriveBaseScoreParams(techEffects);
            const baseScore = calcBaseScore(
              project.paramCount * 1e9,
              dataset.effectiveTokens * 1e9,
              scoreParams,
            );

            // 构建已知架构矩阵：仅包含已实验验证的架构加成（带噪声估计值）
            // 未实验架构不在 knownArchMatrix 中 → calculateCapabilities 中 archBonus=1.0（无加成）
            // 这强制玩家先做实验才能获得架构加成，实验系统成为必经路径
            const knownArchMatrix: Record<string, Partial<Record<CapabilityId, number>>> = {};
            for (const techId of project.techIds) {
              const aggregated = aggregateExperiments(draft.experimentResults, techId);
              if (Object.keys(aggregated).length > 0) {
                knownArchMatrix[techId] = aggregated;
              }
            }
            const capResult = calculateCapabilities(
              baseScore,
              project.contextLength,
              dataset,
              knownArchMatrix,
              project.techIds,
              techEffects,
            );

            // 稳定度修正：qualityFactor = 0.7 + 0.3 × stabilityScore
            const qualityFactor = 0.7 + 0.3 * project.stabilityScore;

            // 训练完成日志
            project.trainingLog.push({
              day: draft.date,
              event: `训练完成 · 稳定度 ${(project.stabilityScore * 100).toFixed(0)}% · 质量系数 ${qualityFactor.toFixed(2)}`,
              severity: 'info',
            });

            const model: Model = {
              id: `${project.id}-model`,
              name: project.modelName,
              paramCount: project.paramCount,
              architecture: project.architecture,
              contextLength: project.contextLength,
              datasetId: project.datasetId,
              completedAt: draft.date,
              trainingProjectId: project.id,
              capabilities: Object.fromEntries(
                Object.entries(capResult.capabilities).map(([k, v]) => [k, v * qualityFactor]),
              ) as CapabilityVector,
              rawCapabilities: Object.fromEntries(
                Object.entries(capResult.rawCapabilities).map(([k, v]) => [k, v * qualityFactor]),
              ) as CapabilityVector,
              baseScore: baseScore * qualityFactor,
              daysSincePublished: 0,
              publishedAt: -1,
              evaluationResearchers: 0,
              published: false,
              version: 1,
              audited: false,
              usedInResearch: false,
              noiseSeed: hashStr(`${project.id}-model` + draft.date + Math.random()),
              // PR-B v3：后训练状态初始为空
              postTraining: [],
            };
            draft.models.push(model);

            // ★ Bug #9 修复 + 设计 #7：将训练贡献分配给研究员
            // BUG-22 修复：定向分配到该训练项目的研究员（status='assigned'）也应获得贡献分，
            // 否则他们只能拿到训练速度加成（1.5%）却因 monthlyContribution=0 被评 C 级 → 忠诚度下降 → 离职。
            // 与 ResearchSystem/CollectionSystem 行为对齐。
            // ★ E5 修复：用预计算的分组替代 draft.employees.filter
            const trainingResearcherIds = [
              ...idleResearcherIds,
              ...(assignedResearcherIdsByProject.get(project.id) ?? []),
            ];
            accumulateResearcherContribution(draft, trainingResearcherIds, 5);
            releasedModels.push({ name: project.modelName, score: model.baseScore });
          }
        } else {
          // 每日贡献累积（Bug #9 修复：分配给研究员）
          // BUG-22 修复：assigned 到本训练项目的研究员也累积贡献分
          // ★ E5 修复：用预计算的分组替代 draft.employees.filter
          const dailyResearcherIds = [
            ...idleResearcherIds,
            ...(assignedResearcherIdsByProject.get(project.id) ?? []),
          ];
          accumulateResearcherContribution(draft, dailyResearcherIds, 1);
          progressInfo.push({
            id: project.id,
            modelName: project.modelName,
            effectiveTflops: result.effectiveTflops + cloudTFLOPS * 0.9,
            utilization: result.utilization,
            loss: project.currentLoss,
            valLoss: project.validationLoss,
            phase: project.trainingPhase,
            stability: project.stabilityScore,
          });
        }
      }
    });

    for (const c of completed) {
      events.emit('TRAINING_COMPLETED', c.id, c.modelName);
    }
    for (const p of pausedProjects) {
      events.emit('TRAINING_PAUSED', p.id, p.reason);
    }
    for (const r of releasedModels) {
      events.emit('PLAYER_MODEL_RELEASED', r.name, r.score);
    }
    for (const p of autoResumedProjects) {
      events.emit('TRAINING_RESUMED', p.id);
    }
    for (const p of progressInfo) {
      events.emit('TRAINING_PROGRESS', p);
    }
    for (const e of events_log) {
      events.emit('TRAINING_EVENT', e);
    }
  }

  /**
   * ★ 聚合存储版：从项目节点分配构建 CardSpecSummary
   *
   * 不再按 uid 反查 CardInstance，直接遍历项目的 nodeAssignments 获得节点，
   * 然后扫描该节点在各 modelId 池中的 online 桶（O(节点×模型)）。
   *
   * 注意：项目 nodeAssignments[uid] 列表的 uid 是合成 uid（数量=项目使用卡数），
   * 但聚合系统按桶维护 location=nodeId 的 online 卡数，天然匹配。
   */
  private summarizeProjectCardSpecs(data: GameData, project: TrainingProject): CardSpecSummary {
    const byResource = new Map<string, { spec: ComputeCardSpec; count: number }>();
    // 按 nodeId 聚合（不同 modelId 在同一节点可能多张卡）
    const nodeIdSet = new Set<string>();
    // 每个节点的已分配卡数（按 nodeAssignments 的 UID 数组长度，O(1) 而非 O(卡数) 遍历）
    const assignedCountByNode = new Map<string, number>();
    for (const nodeId of Object.keys(project.nodeAssignments)) {
      nodeIdSet.add(nodeId);
      assignedCountByNode.set(nodeId, project.nodeAssignments[nodeId].length);
    }
    // 遍历桶 → 按 location=nodeId 且 status=online 聚合
    // ★ 性能优化：原实现内层 for (uid of list) 计数同 modelId 的 UID，O(卡数)；
    //   改用 assignedCountByNode O(1) 查询，min(分配数, 桶count) 保证不超分
    for (const modelId of Object.keys(data.resourceMeta)) {
      const pool = data.resourceMeta[modelId];
      if (!pool || !Array.isArray((pool as any).aggregates)) continue;
      const spec = getCardSpec(modelId);
      if (!spec) continue;
      let nodeCount = 0;
      for (const agg of (pool as any).aggregates) {
        if (agg.location && nodeIdSet.has(agg.location) && agg.status === 'online' && agg.count > 0) {
          // 该项目在该节点分配了 assignedCount 张卡，桶中有 agg.count 张在线卡
          // 保守取 min(分配数, 桶count) 以保证不超分
          const assigned = assignedCountByNode.get(agg.location) ?? 0;
          if (assigned > 0) {
            nodeCount += Math.min(assigned, agg.count);
          }
        }
      }
      if (nodeCount > 0) {
        const r = byResource.get(spec.resourceId);
        if (r) r.count += nodeCount;
        else byResource.set(spec.resourceId, { spec, count: nodeCount });
      }
    }
    return summarizeCardSpecsFromMap(byResource, 'training');
  }
}
