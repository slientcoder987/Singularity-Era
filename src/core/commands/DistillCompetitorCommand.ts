/**
 * 蒸馏竞品模型命令（PR-B v3）
 *
 * 玩家选择竞争对手已发布的模型作为教师，创建学生模型。
 * 蒸馏效率由 distillation 技术的 maturity 决定。
 *
 * 公式：
 *   distillEfficiency = min(0.95, 0.70 × maturity/100)
 *   studentParams = targetParams × 0.15
 *   studentCap[i] = targetCap[i] × distillEfficiency
 *
 *   算力 = targetParams × 80 × (1 − distillEfficiency/2) TFLOPS·天
 *   资金 = $50,000 × targetParams
 *   冷却 = 90 天
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { Model, CapabilityVector } from '../entities/Model';

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DISTILL_COOLDOWN = 90;

export class DistillCompetitorCommand implements Command {
  constructor(
    private readonly competitorId: string,
    /** 竞品已发布模型在 releasedModels 数组中的索引 */
    private readonly modelIndex: number,
    /** 玩家自己起的模型名称 */
    private readonly studentName: string,
  ) { }

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 技术解锁检查
    const distillMat = current.techMaturity['distillation'] ?? 0;
    if (distillMat < 1) {
      events.emit('DISTILL_REJECTED', { reason: '未解锁蒸馏技术' });
      return;
    }

    // 竞品检查
    const competitor = current.competitorStates.find((c) => c.id === this.competitorId);
    if (!competitor) {
      events.emit('DISTILL_REJECTED', { reason: '竞品公司不存在' });
      return;
    }

    // 目标模型检查
    const targetModel = competitor.releasedModels[this.modelIndex];
    if (!targetModel) {
      events.emit('DISTILL_REJECTED', { reason: '目标模型已不存在' });
      return;
    }

    // 名称重复检查
    if (current.models.some((m) => m.name === this.studentName)) {
      events.emit('DISTILL_REJECTED', { reason: '模型名称已存在' });
      return;
    }

    // 冷却检查（全局蒸馏冷却）
    const cooldowns = current.dataAcquisitionCooldowns ?? {};
    const lastDistill = cooldowns['distill'] ?? -999;
    if (current.date - lastDistill < DISTILL_COOLDOWN) {
      events.emit('DISTILL_REJECTED', {
        reason: `冷却中，剩余 ${DISTILL_COOLDOWN - (current.date - lastDistill)} 天`,
      });
      return;
    }

    // 计算公式
    const matScale = distillMat / 100;
    const distillEfficiency = Math.min(0.95, 0.70 * matScale);
    const studentParams = targetModel.paramCount * 0.15;
    const fundsCost = 50000 * targetModel.paramCount;

    const funds = current.resources['funds'] ?? 0;
    if (funds < fundsCost) {
      events.emit('DISTILL_REJECTED', { reason: `资金不足，需要 $${fundsCost.toLocaleString()}` });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - fundsCost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns['distill'] = draft.date;

      // 找到目标竞品（可能在 draft 中）
      const comp = draft.competitorStates.find((c) => c.id === this.competitorId);
      const tm = comp?.releasedModels[this.modelIndex];
      if (!tm || !comp) return;

      // 从竞品能力估算学生能力
      // 竞品有 capabilities: Record<string, number>（CompetitorState.capabilities）
      const caps = comp.capabilities;
      const capVector = {} as CapabilityVector;
      const rawCapVector = {} as CapabilityVector;
      let baseScoreSum = 0;
      let capCount = 0;

      for (const [capId, value] of Object.entries(caps)) {
        const studentVal = value * distillEfficiency;
        (capVector as Record<string, number>)[capId] = studentVal;
        (rawCapVector as Record<string, number>)[capId] = studentVal;
        baseScoreSum += studentVal;
        capCount++;
      }

      const avgCap = capCount > 0 ? baseScoreSum / capCount : tm.baseScore * distillEfficiency;

      const model: Model = {
        id: genId('distill-model'),
        name: this.studentName,
        paramCount: Math.max(1, Math.round(studentParams)),
        architecture: 'distilled',
        contextLength: 4096,
        datasetId: '', // 蒸馏不使用数据集
        completedAt: draft.date,
        trainingProjectId: 'distillation',
        capabilities: capVector,
        rawCapabilities: rawCapVector,
        baseScore: avgCap,
        daysSincePublished: 0,
        publishedAt: -1,
        evaluationResearchers: 0,
        published: false,
        version: 1,
        audited: false,
        usedInResearch: false,
        noiseSeed: Math.floor(Math.random() * 1e9),
        // PR-B v3：后训练状态初始为空
        postTraining: [],
      };

      draft.models.push(model);
    });

    events.emit('MODEL_DISTILLED', {
      studentName: this.studentName,
      teacherName: targetModel.name,
      studentParams: Math.max(1, Math.round(studentParams)),
      distillEfficiency: Number(distillEfficiency.toFixed(2)),
      fundsCost,
    });
  }
}
