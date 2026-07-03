import type { GameState, TurnActions, AIModel } from './types';
import { cloneState } from './state';
import {
  computeTraining,
  calcComputeCost,
} from './training';
import {
  settlePassiveIncome,
  regenCompute,
  computeReputationGain,
  generateModelName,
} from './economy';
import { gameEvents } from './events';
import { defaultRNG, type RNG } from './rng';
import { ARCHITECTURE_MAP, TRAINING_STRATEGY_MAP } from './config';

/**
 * 训练前校验
 * 返回错误信息字符串数组，空数组表示可执行。
 */
export function validateTurnActions(
  state: GameState,
  actions: TurnActions,
): string[] {
  const errors: string[] = [];

  if (!ARCHITECTURE_MAP[actions.selectedArchitectureId]) {
    errors.push('未选择有效的模型架构。');
  }
  if (!TRAINING_STRATEGY_MAP[actions.selectedStrategyId]) {
    errors.push('未选择有效的训练策略。');
  }

  const cost = calcComputeCost(
    actions.selectedArchitectureId,
    actions.selectedStrategyId,
  );
  if (cost > state.resources.compute) {
    errors.push(`算力不足：需要 ${cost}，当前 ${state.resources.compute}。`);
  }

  if (actions.assignedResearcherId) {
    const emp = state.employees.find((e) => e.id === actions.assignedResearcherId);
    if (!emp) errors.push('指派的研究员不存在。');
    else if (emp.role !== 'researcher') errors.push(`${emp.name} 不是研究员。`);
  }
  if (actions.assignedEngineerId) {
    const emp = state.employees.find((e) => e.id === actions.assignedEngineerId);
    if (!emp) errors.push('指派的数据工程师不存在。');
    else if (emp.role !== 'data_engineer') errors.push(`${emp.name} 不是数据工程师。');
  }

  return errors;
}

/**
 * 核心回合处理纯函数
 *
 * 流程：
 * 1. 校验输入
 * 2. 快照状态
 * 3. 消耗算力
 * 4. 计算训练明细
 * 5. 创建 AIModel 并加入 models
 * 6. 模型收入直接加入资金（首回合即产出）
 * 7. 结算被动收入（已有模型的累计收入）
 * 8. 补充算力
 * 9. 增加声望
 * 10. 员工疲劳度+10（预留，MVP生效但不影响产出）
 * 11. 生成事件日志
 * 12. 回合数+1
 * 13. emit 事件
 *
 * 全程不修改原 state，返回新 state。
 */
export function processTurn(
  state: GameState,
  actions: TurnActions,
  rng: RNG = defaultRNG,
): GameState {
  const errors = validateTurnActions(state, actions);
  if (errors.length > 0) {
    throw new Error(`回合行动校验失败：\n${errors.join('\n')}`);
  }

  gameEvents.emit('turn:start', { turn: state.turn });

  const next = cloneState(state);
  const breakdown = computeTraining(next, actions, rng);

  gameEvents.emit('training:start', { actions, breakdown });

  // 1. 消耗算力
  next.resources.compute = Math.max(0, next.resources.compute - breakdown.computeCost);

  // 2. 创建模型
  const model: AIModel = {
    id: `model_${next.turn}_${Math.floor(rng.next() * 100000)}`,
    name: generateModelName(next, actions.selectedArchitectureId),
    architectureId: actions.selectedArchitectureId,
    domainId: actions.selectedDomainId,
    strategyId: actions.selectedStrategyId,
    assignedResearcherId: actions.assignedResearcherId,
    assignedEngineerId: actions.assignedEngineerId,
    baseAbility: breakdown.baseAbility,
    finalAbility: breakdown.finalAbility,
    trait: breakdown.trait,
    customers: breakdown.customers,
    revenuePerTurn: breakdown.revenuePerTurn,
    turnCreated: next.turn,
  };
  next.models.push(model);
  next.lastBreakdown = breakdown;

  // 3. 模型发布即获得首回合收入
  next.resources.money += model.revenuePerTurn;

  // 4. 已有模型被动收入（不含本次新增的，已在上一步计入）
  // 注：此处采用"新模型首回合立即产出 + 旧模型持续产出"的简化模型
  // 为避免重复计算，被动收入仅累加 turnCreated < currentTurn 的模型
  const passiveFromOld = next.models
    .filter((m) => m.id !== model.id)
    .reduce((sum, m) => sum + m.revenuePerTurn, 0);
  if (passiveFromOld > 0) {
    next.resources.money += passiveFromOld;
  }

  // 5. 补充算力
  const regen = regenCompute(next);
  next.resources.compute += regen.amount;

  // 6. 声望
  const repGain = computeReputationGain(model.finalAbility);
  next.reputation += repGain;

  // 7. 员工疲劳+10（预留字段，MVP生效但不影响能力计算）
  for (const emp of next.employees) {
    if (
      emp.id === actions.assignedResearcherId ||
      emp.id === actions.assignedEngineerId
    ) {
      emp.fatigue = Math.min(100, emp.fatigue + 10);
    }
  }

  // 8. 事件日志
  const logs: string[] = [];
  logs.push(
    `第${next.turn}回合：训练模型 ${model.name}（能力 ${model.finalAbility}）` +
      (model.trait ? `，特性【${model.trait.name}】` : '') +
      `，获得客户 ${model.customers}，收入 +${model.revenuePerTurn}。`,
  );
  if (passiveFromOld > 0) {
    logs.push(`旧模型持续产出 +${passiveFromOld} 资金。`);
  }
  logs.push(`算力补充 +${regen.amount}，声望 +${repGain}（累计 ${next.reputation}）。`);
  next.eventLog = [...logs, ...next.eventLog];

  // 9. 回合推进
  next.turn += 1;

  gameEvents.emit('training:complete', { model, breakdown });
  gameEvents.emit('model:published', { model });
  gameEvents.emit('resource:changed', { resources: next.resources });
  gameEvents.emit('reputation:changed', { reputation: next.reputation });
  gameEvents.emit('turn:end', { turn: next.turn });

  return next;
}

/**
 * 跳过训练直接进入下一回合（用于玩家等待资源时）
 * 仅结算被动收入与算力补充。
 */
export function skipTurn(state: GameState): GameState {
  const next = cloneState(state);
  gameEvents.emit('turn:start', { turn: next.turn });

  const passive = settlePassiveIncome(next);
  if (passive.income > 0) {
    next.resources.money += passive.income;
  }
  const regen = regenCompute(next);
  next.resources.compute += regen.amount;

  const logs: string[] = [];
  logs.push(`第${next.turn}回合：跳过训练。`);
  if (passive.log) logs.push(passive.log);
  logs.push(regen.log ?? '');
  next.eventLog = [...logs.filter(Boolean), ...next.eventLog];

  next.turn += 1;
  gameEvents.emit('turn:end', { turn: next.turn });
  return next;
}
