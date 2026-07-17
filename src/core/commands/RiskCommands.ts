/**
 * 风险响应命令
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { isTechUnlocked } from '../utils/techLookup';

/** 和解诉讼（降低 legal_debt，花费资金） */
export class SettleLawsuitCommand implements Command {
  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    if (current.riskState.legalDebt < 3) {
      events.emit('SETTLE_REJECTED', { reason: 'legal_debt 不足 3，无需和解' });
      return;
    }

    const cost = Math.floor(current.riskState.legalDebt) * 100_000;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('SETTLE_REJECTED', { reason: '资金不足', cost });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      draft.riskState.legalDebt = Math.max(0, draft.riskState.legalDebt - 3);
      draft.riskState.reputation = Math.min(100, draft.riskState.reputation + 5);
    });

    events.emit('LAWSUIT_SETTLED', { cost, legalDebtReduction: 3 });
  }
}

/** 公开道歉（降低 trust_debt，损失声誉） */
export class PublicApologyCommand implements Command {
  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    if (current.riskState.trustDebt < 2) {
      events.emit('APOLOGY_REJECTED', { reason: 'trust_debt 不足 2' });
      return;
    }

    state.update((draft) => {
      draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - 2);
      draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
    });

    events.emit('APOLOGY_MADE');
  }
}

/** 开展内部审计（需对齐技术，降低 AI 失控风险） */
export class ConductAuditCommand implements Command {
  constructor(private readonly modelId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    if (!isTechUnlocked(current, 'alignment_v1')) {
      events.emit('AUDIT_REJECTED', { reason: '需要对齐v1技术' });
      return;
    }

    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('AUDIT_REJECTED', { reason: '模型不存在' });
      return;
    }

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m) {
        m.audited = true;
      }
      draft.riskState.alignmentLevel = Math.min(1, draft.riskState.alignmentLevel + 0.1);
    });

    events.emit('AUDIT_COMPLETED', { modelId: this.modelId });
  }
}

/** 将模型用于内部研发 */
export class UseModelInResearchCommand implements Command {
  constructor(private readonly modelId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit('USE_MODEL_REJECTED', { reason: '模型不存在' });
      return;
    }

    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m) {
        m.usedInResearch = true;
      }
    });

    events.emit('MODEL_USED_IN_RESEARCH', { modelId: this.modelId });
  }
}
