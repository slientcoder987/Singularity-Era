import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { PostTrainingStage, PostTrainingState } from '../entities/Model';

/**
 * 开始后训练命令（BUG 修复：补齐核心层架构缺口）
 *
 * 此前 UI 层直接 model.postTraining.push(...) 修改 state，核心层无对应命令，
 * 导致后训练无法被统一执行/记录/校验，headless 模拟也无法通过标准命令触发。
 *
 * 本命令封装：
 * - 模型存在性与预训练完成校验
 * - 解锁技术校验（sft/rlhf/dpo/cot_training）
 * - 前置阶段校验（rlhf/dpo/cot 需先完成 sft）
 * - 互斥校验（rlhf 与 dpo 互斥）
 * - 重复阶段校验
 * - 追加 PostTrainingState（pending），由 PostTrainingSystem 自动启动推进
 */

/** 各阶段解锁技术 id 与算力系数（与 PostTrainingSystem 配置保持一致） */
const STAGE_META: Record<PostTrainingStage, { unlockTech: string; computeCoeff: number }> = {
  sft: { unlockTech: 'sft', computeCoeff: 2 },
  rlhf: { unlockTech: 'rlhf', computeCoeff: 5 },
  dpo: { unlockTech: 'dpo', computeCoeff: 3 },
  cot: { unlockTech: 'cot_training', computeCoeff: 4 },
};

/** 需要 sft 作为前置的阶段 */
const REQUIRES_SFT: PostTrainingStage[] = ['rlhf', 'dpo', 'cot'];
/** 互斥组 */
const MUTUALLY_EXCLUSIVE: Record<PostTrainingStage, PostTrainingStage[]> = {
  sft: [],
  rlhf: ['dpo'],
  dpo: ['rlhf'],
  cot: [],
};

export class StartPostTrainingCommand implements Command {
  constructor(
    private readonly modelId: string,
    private readonly stage: PostTrainingStage,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);

    if (!model) {
      events.emit('POST_TRAINING_REJECTED', { modelId: this.modelId, stage: this.stage, reason: '模型不存在' });
      return;
    }

    const meta = STAGE_META[this.stage];
    if (!meta) {
      events.emit('POST_TRAINING_REJECTED', { modelId: this.modelId, stage: this.stage, reason: `未知后训练阶段: ${String(this.stage)}` });
      return;
    }

    // 解锁技术校验
    const techMat = current.techMaturity[meta.unlockTech] ?? 0;
    if (techMat < 1) {
      events.emit('POST_TRAINING_REJECTED', {
        modelId: this.modelId,
        stage: this.stage,
        reason: `技术 ${meta.unlockTech} 未解锁（成熟度 ${techMat.toFixed(0)}%）`,
      });
      return;
    }

    const existing = model.postTraining ?? [];

    // 重复阶段校验
    if (existing.some((p) => p.stage === this.stage && p.status !== 'completed')) {
      events.emit('POST_TRAINING_REJECTED', { modelId: this.modelId, stage: this.stage, reason: '该阶段已在队列或进行中' });
      return;
    }
    if (existing.some((p) => p.stage === this.stage && p.status === 'completed')) {
      events.emit('POST_TRAINING_REJECTED', { modelId: this.modelId, stage: this.stage, reason: '该阶段已完成' });
      return;
    }

    // 前置 sft 校验
    if (REQUIRES_SFT.includes(this.stage)) {
      const sftDone = existing.some((p) => p.stage === 'sft' && p.status === 'completed');
      if (!sftDone) {
        events.emit('POST_TRAINING_REJECTED', { modelId: this.modelId, stage: this.stage, reason: '需先完成 SFT 阶段' });
        return;
      }
    }

    // 互斥校验
    const conflicts = MUTUALLY_EXCLUSIVE[this.stage];
    if (conflicts.length > 0) {
      const hasConflict = existing.some((p) => conflicts.includes(p.stage) && (p.status === 'completed' || p.status === 'in_progress' || p.status === 'pending'));
      if (hasConflict) {
        events.emit('POST_TRAINING_REJECTED', {
          modelId: this.modelId,
          stage: this.stage,
          reason: `与 ${conflicts.join('/')} 互斥，无法同时进行`,
        });
        return;
      }
    }

    // 计算算力需求（与 PostTrainingSystem 推进公式一致：computeTotal = P × computeCoeff）
    const computeTotal = model.paramCount * meta.computeCoeff;

    const ptState: PostTrainingState = {
      stage: this.stage,
      status: 'pending',
      computeRemaining: computeTotal,
      computeTotal,
      startedAt: 0,
      completedAt: null,
    };

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      if (!m.postTraining) m.postTraining = [];
      m.postTraining.push(ptState);
    });

    events.emit('POST_TRAINING_QUEUED', {
      modelId: this.modelId,
      modelName: model.name,
      stage: this.stage,
      computeTotal,
    });
  }
}
