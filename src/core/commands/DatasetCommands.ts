/**
 * 数据集命令
 *
 * 采购、自建、合成数据集。
 */

import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import { createDataset, type DataDomain } from '../entities/Dataset';
import { getDatasetTemplate } from '../config/datasets';

/** 采购数据集 */
export class PurchaseDatasetCommand implements Command {
  constructor(private templateId: string) {}

  execute(state: GameState, events: EventBus): void {
    const tpl = getDatasetTemplate(this.templateId);
    if (!tpl) {
      events.emit('DATASET_REJECTED', { reason: '未知数据集模板' });
      return;
    }

    const current = state.read();
    const funds = current.resources['funds'] ?? 0;
    if (funds < tpl.baseCost) {
      events.emit('DATASET_REJECTED', { reason: '资金不足' });
      return;
    }

    const ds = createDataset(
      tpl.name,
      tpl.domain,
      tpl.baseTokensB,
      tpl.baseQuality,
      tpl.baseDiversity,
      'purchased',
      tpl.baseCost,
      current.date,
      tpl.decayPerDay,
    );

    state.update((draft) => {
      draft.resources['funds'] -= tpl.baseCost;
      draft.datasets.push(ds);
    });

    events.emit('DATASET_ACQUIRED', ds.id, ds.name);
  }
}

/** 自建数据集（分配员工，消耗时间和资金） */
export class BuildDatasetCommand implements Command {
  constructor(
    private name: string,
    private domain: DataDomain,
    private tokensB: number,
    private assignedEmployeeIds: string[],
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    // 自建成本 = token 数 × $200/B + 员工时间
    const cost = this.tokensB * 200;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('DATASET_REJECTED', { reason: '资金不足' });
      return;
    }

    // 员工技能影响质量
    let qualitySum = 0;
    let count = 0;
    for (const empId of this.assignedEmployeeIds) {
      const emp = current.employees.find((e) => e.id === empId);
      if (emp) {
        qualitySum += emp.attributes.intelligence + emp.attributes.creativity;
        count++;
      }
    }
    const avgQuality = count > 0 ? qualitySum / count : 30;
    const quality = Math.min(95, 40 + avgQuality / 2);
    const diversity = Math.min(80, 30 + count * 10);

    const ds = createDataset(
      this.name,
      this.domain,
      this.tokensB,
      quality,
      diversity,
      'self_built',
      cost,
      current.date,
      0.02, // 自建数据衰减中等
      true,
      quality,
    );

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      draft.datasets.push(ds);
    });

    events.emit('DATASET_ACQUIRED', ds.id, ds.name);
  }
}

/** 合成数据集（用已有模型生成） */
export class SynthesizeDatasetCommand implements Command {
  constructor(
    private sourceModelId: string,
    private domain: DataDomain,
    private tokensB: number,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const model = current.models.find((m) => m.id === this.sourceModelId);
    if (!model) {
      events.emit('DATASET_REJECTED', { reason: '源模型不存在' });
      return;
    }
    if (model.status !== 'released') {
      events.emit('DATASET_REJECTED', { reason: '源模型未发布' });
      return;
    }

    // 合成成本 = token 数 × $100/B（算力成本）
    const cost = this.tokensB * 100;
    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('DATASET_REJECTED', { reason: '资金不足' });
      return;
    }

    // 质量取决于母模型能力（取与领域相关的能力维度）
    const caps = model.releasedCapabilities ?? model.capabilities;
    const dimMap: Record<DataDomain, keyof typeof caps> = {
      web: 'world_knowledge',
      code: 'coding_agent',
      math: 'math_reasoning',
      science: 'research_taste',
      book: 'creative_writing',
      dialogue: 'dialogue_fluency',
      safety: 'hallucination_rate',
    };
    const dim = dimMap[this.domain];
    const modelCap = caps[dim] ?? 50;
    // 合成数据质量上限低于原始数据
    const quality = Math.min(85, modelCap * 0.85);
    const diversity = Math.min(70, modelCap * 0.6);

    const ds = createDataset(
      `${model.name}-合成-${this.domain}`,
      this.domain,
      this.tokensB,
      quality,
      diversity,
      'synthetic',
      cost,
      current.date,
      0.04, // 合成数据衰减较快
      true,
      quality,
    );

    state.update((draft) => {
      draft.resources['funds'] -= cost;
      draft.datasets.push(ds);
    });

    events.emit('DATASET_ACQUIRED', ds.id, ds.name);
  }
}
