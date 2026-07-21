/**
 * PublishModelCommand
 *
 * ★ 设计 #5：将训练完成但未发布的模型发布到市场。
 *
 * 发布后：
 * - model.published = true
 * - model.publishedAt = today（首次发布；重新发布不重置，见 I2 修复）
 * - 该模型才被 OperationsSystem 计入市场收入和 Token 收入
 *
 * 未发布的模型仍可用于内部研究（usedInResearch），但不产生市场收入。
 * 这符合现实：训练完成的模型需要走完发布流程（评测、安全审计、API 上线）才能变现。
 *
 * 限制：
 * - 模型必须存在且 published === false
 * - 模型必须训练已完成（completedAt >= 0，由 TrainingSystem 写入）
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';

export class PublishModelCommand implements Command {
  constructor(private modelId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('PUBLISH_MODEL_FAILED', this.modelId, '模型不存在');
      return;
    }
    if (model.published) {
      events.emit('PUBLISH_MODEL_FAILED', this.modelId, '模型已发布');
      return;
    }
    // BUG-11 修复：注释声称检查训练完成，现补充实际检查
    // completedAt < 0 表示模型尚未完成训练（初始值或训练中）
    if (model.completedAt < 0) {
      events.emit('PUBLISH_MODEL_FAILED', this.modelId, '模型尚未训练完成');
      return;
    }

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.published = true;
      // ★ I2 修复：用 publishedAt 替代 daysSincePublished，避免每日 ++ 写入
      //   首次发布设置 publishedAt = today；重新发布（unpublish → publish）不重置
      //   （与 UnpublishModelCommand 注释一致："daysSincePublished 保留"）
      if (m.publishedAt === undefined || m.publishedAt < 0) {
        m.publishedAt = draft.date;
      }
    });

    events.emit('MODEL_PUBLISHED', this.modelId, model.name, model.baseScore);
  }
}

/**
 * UnpublishModelCommand
 *
 * 设计-16：将已发布的模型从市场下架。
 *
 * 下架后：
 * - model.published = false（OperationsSystem 不再计入收入）
 * - daysSincePublished 保留（重新发布时仍累积社区反馈，不重置）
 * - 声誉损失（用户失去访问，信任下降）
 * - 用户流失率短期上升（由事件监听器或 OperationsSystem 处理）
 *
 * 限制：
 * - 模型必须存在且 published === true
 * - 不会删除模型本身，仍可重新发布
 */
export class UnpublishModelCommand implements Command {
  constructor(private modelId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('UNPUBLISH_MODEL_FAILED', this.modelId, '模型不存在');
      return;
    }
    if (!model.published) {
      events.emit('UNPUBLISH_MODEL_FAILED', this.modelId, '模型未发布');
      return;
    }

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.published = false;
      // 下架损害声誉：用户失去访问权，信任度下降
      draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
    });

    events.emit('MODEL_UNPUBLISHED', this.modelId, model.name);
  }
}

/**
 * SetModelResearchUsageCommand
 *
 * 设计-22：控制模型是否参与内部研发（usedInResearch 标志）。
 *
 * 当模型 usedInResearch = true 且未审计时，会触发 AI 对齐风险
 * （ai_misalignment / ai_deception）。玩家可通过此命令主动关闭
 * 高能力模型的研发参与以规避风险。
 *
 * 限制：模型必须存在。
 */
export class SetModelResearchUsageCommand implements Command {
  constructor(
    private modelId: string,
    private enabled: boolean,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('MODEL_RESEARCH_USAGE_FAILED', this.modelId, '模型不存在');
      return;
    }

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.usedInResearch = this.enabled;
    });

    events.emit(
      this.enabled ? 'MODEL_RESEARCH_ENABLED' : 'MODEL_RESEARCH_DISABLED',
      this.modelId,
      model.name,
    );
  }
}
