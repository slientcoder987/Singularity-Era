/**
 * 数据操作命令（PR-B v3）
 *
 * 提供数据清洗 (Purge)、去重 (Dedup)、精选 (Curate) 三种操作。
 * 每种操作需对应技术 maturity≥1 解锁，效果按 maturity/100 缩放。
 */
import type { Command } from '../interfaces/Command';
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { DataDomainId } from '../entities/Dataset';

// ===== 配置常量 =====

/** 数据清洗冷却天数 */
const PURGE_COOLDOWN = 30;
/** 数据去重冷却天数 */
const DEDUP_COOLDOWN = 60;
/** 数据精选冷却天数 */
const CURATE_COOLDOWN = 45;

// ============================================================
// 数据清洗 (Purge)
// ============================================================

/**
 * 数据清洗命令
 *
 * 解锁条件：data_cleaning_v1 maturity ≥ 1
 *
 * 公式：
 *   清洗比例 = 15% × maturity/100
 *   质量增益 = (1 - 当前质量) × 10% × maturity/100
 *   资金成本 = $5 × 移除Token量(百万)
 *   冷却 = 30 天
 */
export class PurgeDatasetCommand implements Command {
  constructor(
    private readonly datasetId: string,
    private readonly domainId: DataDomainId,
  ) { }

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 技术解锁检查
    const purgeMat = current.techMaturity['data_cleaning_v1'] ?? 0;
    if (purgeMat < 1) {
      events.emit('DATA_PURGE_REJECTED', { reason: '未解锁数据清洗技术' });
      return;
    }

    // 数据集存在检查
    const dataset = current.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit('DATA_PURGE_REJECTED', { reason: '数据集不存在' });
      return;
    }

    // 领域存在检查
    const domain = dataset.domains[this.domainId];
    if (!domain) {
      events.emit('DATA_PURGE_REJECTED', { reason: `领域 ${this.domainId} 不存在` });
      return;
    }

    if (domain.tokens <= 0) {
      events.emit('DATA_PURGE_REJECTED', { reason: '该领域无数据可清洗' });
      return;
    }

    // 冷却检查
    const cooldowns = current.dataAcquisitionCooldowns ?? {};
    const lastPurge = cooldowns['purge_' + this.datasetId] ?? -999;
    if (current.date - lastPurge < PURGE_COOLDOWN) {
      events.emit('DATA_PURGE_REJECTED', {
        reason: `冷却中，剩余 ${PURGE_COOLDOWN - (current.date - lastPurge)} 天`,
      });
      return;
    }

    // 计算公式
    const matScale = purgeMat / 100;
    const purgeRatio = 0.15 * matScale;
    const removedTokens = domain.tokens * purgeRatio;
    const qualityGain = (1 - domain.quality) * 0.10 * matScale;
    const cost = Math.ceil(5 * (removedTokens / 1000)); // tokens 单位是十亿，1000十亿=1百万百万token

    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('DATA_PURGE_REJECTED', { reason: `资金不足，需要 $${cost.toLocaleString()}` });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - cost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns['purge_' + this.datasetId] = draft.date;

      const ds = draft.datasets.find((d) => d.id === this.datasetId);
      if (!ds) return;
      const dm = ds.domains[this.domainId];
      if (!dm) return;

      const removed = dm.tokens * purgeRatio;
      dm.tokens = Math.max(0, dm.tokens - removed);
      dm.quality = Math.min(1, dm.quality + qualityGain);

      // 重新计算数据集汇总
      ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication), 0,
      );
    });

    events.emit('DATA_PURGED', {
      datasetId: this.datasetId,
      domainId: this.domainId,
      removedTokens: Math.ceil(removedTokens * 1000) / 1000, // GB
      qualityGain: Number(qualityGain.toFixed(3)),
      cost,
    });
  }
}

// ============================================================
// 数据去重 (Dedup)
// ============================================================

/**
 * 数据去重命令
 *
 * 解锁条件：data_deduplication maturity ≥ 1
 *
 * 公式：
 *   重复度削减 = 当前重复度 × 20% × maturity/100
 *   资金成本 = $2 × 总Token量(百万)
 *   冷却 = 60 天
 *   最低重复度 = 0.01
 */
export class DedupDatasetCommand implements Command {
  constructor(private readonly datasetId: string) { }

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 技术解锁检查
    const dedupMat = current.techMaturity['data_deduplication'] ?? 0;
    if (dedupMat < 1) {
      events.emit('DATA_DEDUP_REJECTED', { reason: '未解锁数据去重技术' });
      return;
    }

    // 数据集存在检查
    const dataset = current.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit('DATA_DEDUP_REJECTED', { reason: '数据集不存在' });
      return;
    }

    if (dataset.totalTokens <= 0) {
      events.emit('DATA_DEDUP_REJECTED', { reason: '数据集为空' });
      return;
    }

    // 冷却检查
    const cooldowns = current.dataAcquisitionCooldowns ?? {};
    const lastDedup = cooldowns['dedup_' + this.datasetId] ?? -999;
    if (current.date - lastDedup < DEDUP_COOLDOWN) {
      events.emit('DATA_DEDUP_REJECTED', {
        reason: `冷却中，剩余 ${DEDUP_COOLDOWN - (current.date - lastDedup)} 天`,
      });
      return;
    }

    // 计算公式
    const matScale = dedupMat / 100;
    const totalTokensM = dataset.totalTokens * 1000; // 十亿→百万
    const cost = Math.ceil(2 * totalTokensM);

    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('DATA_DEDUP_REJECTED', { reason: `资金不足，需要 $${cost.toLocaleString()}` });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - cost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns['dedup_' + this.datasetId] = draft.date;

      const ds = draft.datasets.find((d) => d.id === this.datasetId);
      if (!ds) return;

      const reduction = 0.20 * matScale;
      for (const key of Object.keys(ds.domains) as DataDomainId[]) {
        const dm = ds.domains[key];
        if (!dm) continue;
        const dupReduction = dm.duplication * reduction;
        dm.duplication = Math.max(0.01, dm.duplication - dupReduction);
      }

      // 重新计算有效 tokens
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication), 0,
      );
    });

    events.emit('DATA_DEDUPED', {
      datasetId: this.datasetId,
      reductionRatio: Number((0.20 * (dedupMat / 100)).toFixed(3)),
      cost,
    });
  }
}

// ============================================================
// 数据精选 (Curate)
// ============================================================

/**
 * 数据精选命令
 *
 * 解锁条件：data_curation maturity ≥ 1
 *
 * 公式：
 *   目标域质量增益 = (1 - 当前域质量) × 15% × maturity/100
 *   代价 = 其他域各损失 5% tokens
 *   资金成本 = $8 × dataset有效Tokens(百万)
 *   冷却 = 45 天
 */
export class CurateDatasetCommand implements Command {
  constructor(
    private readonly datasetId: string,
    private readonly targetDomainId: DataDomainId,
  ) { }

  execute(state: GameState, events: EventBus): void {
    const current = state.read();

    // 技术解锁检查
    const curateMat = current.techMaturity['data_curation'] ?? 0;
    if (curateMat < 1) {
      events.emit('DATA_CURATE_REJECTED', { reason: '未解锁数据精选技术' });
      return;
    }

    // 数据集存在检查
    const dataset = current.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit('DATA_CURATE_REJECTED', { reason: '数据集不存在' });
      return;
    }

    // 目标领域检查
    const targetDomain = dataset.domains[this.targetDomainId];
    if (!targetDomain) {
      events.emit('DATA_CURATE_REJECTED', { reason: `领域 ${this.targetDomainId} 不存在` });
      return;
    }

    if (targetDomain.tokens <= 0) {
      events.emit('DATA_CURATE_REJECTED', { reason: '目标领域无数据' });
      return;
    }

    // 冷却检查
    const cooldowns = current.dataAcquisitionCooldowns ?? {};
    const lastCurate = cooldowns['curate_' + this.datasetId] ?? -999;
    if (current.date - lastCurate < CURATE_COOLDOWN) {
      events.emit('DATA_CURATE_REJECTED', {
        reason: `冷却中，剩余 ${CURATE_COOLDOWN - (current.date - lastCurate)} 天`,
      });
      return;
    }

    // 计算公式
    const matScale = curateMat / 100;
    const totalEffectiveTokensM = dataset.effectiveTokens * 1000; // 十亿→百万
    const cost = Math.ceil(8 * totalEffectiveTokensM);

    const funds = current.resources['funds'] ?? 0;
    if (funds < cost) {
      events.emit('DATA_CURATE_REJECTED', { reason: `资金不足，需要 $${cost.toLocaleString()}` });
      return;
    }

    state.update((draft) => {
      draft.resources['funds'] = Math.max(0, (draft.resources['funds'] ?? 0) - cost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns['curate_' + this.datasetId] = draft.date;

      const ds = draft.datasets.find((d) => d.id === this.datasetId);
      if (!ds) return;

      // 目标域质量增益
      const target = ds.domains[this.targetDomainId];
      if (!target) return;
      const qualityGain = (1 - target.quality) * 0.15 * matScale;
      target.quality = Math.min(1, target.quality + qualityGain);

      // 其他域各损失 5% tokens
      const otherLoss = 0.05;
      for (const key of Object.keys(ds.domains) as DataDomainId[]) {
        if (key === this.targetDomainId) continue;
        const dm = ds.domains[key];
        if (!dm || dm.tokens <= 0) continue;
        dm.tokens = Math.max(0, dm.tokens * (1 - otherLoss));
      }

      // 重新计算汇总
      ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication), 0,
      );
    });

    events.emit('DATA_CURATED', {
      datasetId: this.datasetId,
      domainId: this.targetDomainId,
      qualityGain: Number(((1 - targetDomain.quality) * 0.15 * (curateMat / 100)).toFixed(3)),
      cost,
    });
  }
}
