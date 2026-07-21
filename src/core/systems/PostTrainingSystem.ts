/**
 * 后训练系统（PR-B v3）
 *
 * 在模型完成预训练后，推进 SFT / RLHF / DPO / CoT 后训练阶段。
 * 每个阶段按配置消耗算力和资金，完成后按 maturity/100 缩放增益追加到模型能力。
 *
 * 配置表：
 *
 * | 阶段 | 解锁技术  | 算力(TFLOPS·天) | 资金      | 增益                                   |
 * |------|----------|-----------------|-----------|----------------------------------------|
 * | SFT  | sft      | P×2             | $10k×P    | 对话流畅+0.15, 指令遵循+0.10            |
 * | RLHF | rlhf     | P×5             | $30k×P    | 谄媚-0.10, 对齐+0.30, 诚实+0.12        |
 * | DPO  | dpo      | P×3             | $15k×P    | 谄媚-0.08, 对齐+0.20, 利用率+0.02      |
 * | CoT  | cot_training | P×4         | $20k×P    | 数学推理+0.10, 逻辑推理+0.08, 编码+0.05 |
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { PostTrainingStage } from '../entities/Model';

// ===== 后训练阶段配置 =====

interface PostTrainingConfig {
  /** 解锁所需技术 id */
  unlockTech: string;
  /** 算力系数 */
  computeCoeff: number;
  /** 资金系数（千美元） */
  fundsCoeff: number;
  /** 需要的前一阶段（null 表示无前置） */
  requires: PostTrainingStage | null;
  /** 与哪些阶段互斥 */
  mutuallyExclusive: PostTrainingStage[];
  /** 能力增益（绝对值，不缩放） */
  capacityGains: Record<string, number>;
}

const POST_TRAINING_CONFIGS: Record<PostTrainingStage, PostTrainingConfig> = {
  sft: {
    unlockTech: 'sft',
    computeCoeff: 2,
    fundsCoeff: 10,
    requires: null,
    mutuallyExclusive: [],
    capacityGains: {
      dialogue_fluency: 0.15,
      instruction_following: 0.10,
    },
  },
  rlhf: {
    unlockTech: 'rlhf',
    computeCoeff: 5,
    fundsCoeff: 30,
    requires: 'sft',
    mutuallyExclusive: ['dpo'],
    capacityGains: {
      sycophancy: -0.10,
      alignment: 0.30,
      honesty: 0.12,
    },
  },
  dpo: {
    unlockTech: 'dpo',
    computeCoeff: 3,
    fundsCoeff: 15,
    requires: 'sft',
    mutuallyExclusive: ['rlhf'],
    capacityGains: {
      sycophancy: -0.08,
      alignment: 0.20,
      improve_utilization: 0.02,
    },
  },
  cot: {
    unlockTech: 'cot_training',
    computeCoeff: 4,
    fundsCoeff: 20,
    requires: 'sft',
    mutuallyExclusive: [],
    capacityGains: {
      math_reasoning: 0.10,
      logical_reasoning: 0.08,
      coding: 0.05,
    },
  },
};

export class PostTrainingSystem implements System {
  name = 'PostTrainingSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();

    // 收集所有有后训练阶段的模型
    const modelsWithPostTraining = current.models.filter(
      (m) => m.postTraining && m.postTraining.some((pt) => pt.status === 'in_progress' || pt.status === 'pending'),
    );
    if (modelsWithPostTraining.length === 0) return;

    const completedStages: Array<{ modelId: string; stage: PostTrainingStage; modelName: string }> = [];

    state.update((draft) => {
      for (const model of draft.models) {
        if (!model.postTraining || model.postTraining.length === 0) continue;

        for (let i = 0; i < model.postTraining.length; i++) {
          const pt = model.postTraining[i];

          if (pt.status === 'completed') continue;

          // pending → 自动启动
          if (pt.status === 'pending') {
            const config = POST_TRAINING_CONFIGS[pt.stage];
            const techMat = draft.techMaturity[config.unlockTech] ?? 0;
            if (techMat < 1) continue; // 未解锁，跳过

            // 互斥检查：已经完成互斥阶段则跳过
            if (config.mutuallyExclusive.length > 0) {
              const hasMutuallyExclusive = model.postTraining.some(
                (p) => config.mutuallyExclusive.includes(p.stage) && p.status === 'completed',
              );
              if (hasMutuallyExclusive) {
                pt.status = 'completed';
                pt.completedAt = draft.date;
                continue;
              }
            }

            // 资金检查（启动时一次性扣除）
            const fundsCost = config.fundsCoeff * 1000 * model.paramCount;
            const funds = draft.resources['funds'] ?? 0;
            if (funds < fundsCost) {
              events.emit('POST_TRAINING_REJECTED', {
                modelId: model.id,
                stage: pt.stage,
                reason: `资金不足，需要 $${fundsCost.toLocaleString()}`,
              });
              continue;
            }
            draft.resources['funds'] = Math.max(0, funds - fundsCost);
            pt.status = 'in_progress';
            pt.startedAt = draft.date;
            events.emit('POST_TRAINING_STARTED', {
              modelId: model.id,
              modelName: model.name,
              stage: pt.stage,
              computeTotal: pt.computeTotal,
              fundsCost,
            });
          }

          // in_progress → 推进计算
          if (pt.status === 'in_progress') {
            const dailyCompute = model.paramCount * 0.1 * deltaDays; // 基础 0.1 TFLOPS/B·天
            pt.computeRemaining = Math.max(0, pt.computeRemaining - dailyCompute);

            if (pt.computeRemaining <= 0) {
              pt.status = 'completed';
              pt.completedAt = draft.date;

              // 应用能力增益（按 maturity 缩放）
              const config = POST_TRAINING_CONFIGS[pt.stage];
              const techMat = draft.techMaturity[config.unlockTech] ?? 0;
              const matScale = techMat / 100;

              for (const [capId, baseGain] of Object.entries(config.capacityGains)) {
                const scaledGain = baseGain * matScale;
                const currentCap = (model.capabilities as Record<string, number>)[capId] ?? 0;
                (model.capabilities as Record<string, number>)[capId] = currentCap + scaledGain;
              }

              completedStages.push({
                modelId: model.id,
                stage: pt.stage,
                modelName: model.name,
              });
            }
          }
        }
      }
    });

    for (const c of completedStages) {
      events.emit('POST_TRAINING_COMPLETED', {
        modelId: c.modelId,
        modelName: c.modelName,
        stage: c.stage,
      });
    }
  }
}
