import { useState, useMemo } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import {
  StartExperimentCommand,
  CancelResearchProjectCommand,
  QueueExperimentCommand,
  RemoveQueuedExperimentCommand,
  ClearExperimentQueueCommand,
} from '../../core/commands/DataCommands';
import { AcceptIdeaCommand, RejectIdeaCommand } from '../../core/commands/IdeaCommands';
import { AdoptOpenSourceCommand } from '../../core/commands/OpenSourceCommands';
import { AcquireSmallCompanyCommand } from '../../core/commands/SmallCompanyCommands';
import {
  SettleLawsuitCommand,
  PublicApologyCommand,
  ConductAuditCommand,
  UseModelInResearchCommand,
} from '../../core/commands/RiskCommands';
import { ALL_TECH, TECH_MAP, IDEA_TECH_MAP } from '../../core/config/techTree';
import { CAPABILITY_MAP } from '../../core/config/capabilities';
import {
  EXPERIMENT_CONFIG,
  calcMaxMaturityCap,
  calcExperimentBudget,
  calcExperimentFundsCost,
  calcExperimentEstimatedDays,
} from '../../core/config/researchConfig';
import { calcClusterTotalTflops } from '../../core/utils/computeUtilization';
import {
  getMaxUniqueTechSlots,
  getUniqueTechCount,
  getTotalUniqueTechMaintenance,
} from '../../core/utils/uniqueTechSlots';
import { useFormatDate } from '../hooks/useFormatDate';
import { StaffRole } from '../../core/entities/Employee';
import type { ExperimentRepeatMode, ExperimentResult } from '../../core/entities/ResearchProject';
import styles from '../styles/App.module.css';

type ResearchTab = 'overview' | 'experiment' | 'idea' | 'openSource' | 'market' | 'risk';

const RESEARCH_TABS: { key: ResearchTab; label: string; icon: string }[] = [
  { key: 'overview', label: '总览', icon: '📋' },
  { key: 'experiment', label: '实验', icon: '🔬' },
  { key: 'idea', label: '创意', icon: '💡' },
  { key: 'openSource', label: '开源', icon: '🌐' },
  { key: 'market', label: '市场', icon: '🏢' },
  { key: 'risk', label: '风险', icon: '⚠️' },
];

export function ResearchPanel() {
  const [tab, setTab] = useState<ResearchTab>('overview');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>研发与风险</h3>

      <div className={styles.empFilter}>
        {RESEARCH_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.empFilterBtn} ${tab === t.key ? styles.empFilterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ★ UI-1 修复：display:none → 条件渲染，隐藏 tab 自动卸载订阅 */}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'experiment' && <ExperimentTab />}
      {tab === 'idea' && <IdeaTab />}
      {tab === 'openSource' && <OpenSourceTab />}
      {tab === 'market' && <MarketTab />}
      {tab === 'risk' && <RiskTab />}
    </section>
  );
}

/* ============== 技术总览 ============== */

function OverviewTab() {
  const techMaturity = useGameState((s) => s.techMaturity);
  const acceptedIdeaTechs = useGameState((s) => s.acceptedIdeaTechs);
  // PR-E：独有技术槽位与维护成本
  const uniqueTechUsed = useGameState((s) => getUniqueTechCount(s));
  const uniqueTechMax = useGameState((s) => getMaxUniqueTechSlots(s));
  const dailyMaintenance = useGameState((s) => getTotalUniqueTechMaintenance(s));

  // 收集所有已解锁技术（maturity >= 1）
  const allOwned: Array<{
    id: string;
    name: string;
    description: string;
    maturity: number;
    source: string;       // 预设/创意/开源/收购
    effectType: string;   // 效果简述
    isArchitecture: boolean;
  }> = [];

  // 预设技术树
  for (const tech of ALL_TECH) {
    const mat = techMaturity[tech.id] ?? 0;
    if (mat >= 1) {
      allOwned.push({
        id: tech.id, name: tech.name, description: tech.description,
        maturity: mat, source: '🎓 预设',
        effectType: techEffectLabel(tech.effect),
        isArchitecture: tech.isArchitecture,
      });
    }
  }

  // 独有技术（创意/开源/收购）
  for (const tech of acceptedIdeaTechs) {
    const mat = techMaturity[tech.id] ?? 0;
    if (mat >= 1) {
      const srcTag = tech.source === 'idea' ? '💡 创意'
        : tech.source === 'open_source' ? '🌐 开源'
        : '🏢 收购';
      allOwned.push({
        id: tech.id, name: tech.name, description: tech.description,
        maturity: mat, source: srcTag,
        effectType: techEffectLabel(tech.effect),
        isArchitecture: tech.isArchitecture,
      });
    }
  }

  // 按来源 + maturity 排序
  allOwned.sort((a, b) => a.source.localeCompare(b.source) || b.maturity - a.maturity);

  const totalCount = allOwned.length;
  const maxedCount = allOwned.filter((t) => t.maturity >= 100).length;
  const avgMaturity = totalCount > 0
    ? allOwned.reduce((s, t) => s + t.maturity, 0) / totalCount
    : 0;

  // 槽位告警颜色：满则红色，临近（≥80%）则黄色
  const slotRatio = uniqueTechMax > 0 ? uniqueTechUsed / uniqueTechMax : 0;
  const slotColor = slotRatio >= 1 ? '#ff6b6b'
    : slotRatio >= 0.8 ? '#ffb454' : '#e6f0ff';

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>技术总览</span>
        <span className={styles.devHint}>
          {totalCount} 项 · 满级 {maxedCount} · 平均成熟度 {avgMaturity.toFixed(0)}
        </span>
      </div>
      <div className={styles.devHint} style={{ paddingLeft: '4px', marginBottom: '6px' }}>
        已解锁的所有技术，按来源分组展示。成熟度越高效果越强。
      </div>

      {/* PR-E：独有技术槽位与维护成本 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '120px' }}>独有技术槽位</span>
        <span className={styles.devHint} style={{ color: slotColor }}>
          {uniqueTechUsed} / {uniqueTechMax}
          {slotRatio >= 1 && ' · 已满，无法接受新独有技术'}
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '120px' }}>每日维护费</span>
        <span className={styles.devHint} style={{ color: dailyMaintenance > 1000 ? '#ffb454' : '#e6f0ff' }}>
          ${dailyMaintenance.toLocaleString()}/天
          {dailyMaintenance > 0 && ` · $${(dailyMaintenance * 30).toLocaleString()}/月`}
        </span>
      </div>

      {allOwned.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无已解锁技术</div>
      ) : (
        allOwned.map((tech) => {
          const matPct = tech.maturity >= 100 ? '✓' : `${tech.maturity.toFixed(0)}%`;
          const matColor = tech.maturity >= 100 ? '#5cb85c'
            : tech.maturity >= 50 ? '#ffb454' : '#e6f0ff';
          return (
            <div key={tech.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · {tech.name}
                {tech.isArchitecture && ' [架构]'}
              </span>
              <span className={styles.devHint} style={{ color: matColor, minWidth: '60px' }}>
                成熟度 {matPct}
              </span>
              <span className={styles.devHint}>
                {tech.source} · {tech.effectType}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

/** techEffect 类型转中文简述 */
function techEffectLabel(effect: { type: string;[k: string]: unknown }): string {
  const labels: Record<string, string> = {
    reduce_compute_cost: '算力成本↓',
    reduce_memory: '显存占用↓',
    capability_bonus: '能力加成',
    extend_context: '上下文扩展',
    modify_base_score_A: '架构评分-A',
    modify_base_score_B: '架构评分-B',
    modify_base_score_E: '架构评分-E',
    improve_utilization: '利用率↑',
    improve_data_quality: '数据质量↑',
    reduce_training_crash_risk: '崩溃风险↓',
    enable_distillation: '蒸馏',
    improve_research_speed: '研发速度↑',
    improve_alignment: '对齐↑',
    unlock_parallel_strategy: '并行策略',
    parallel_reliability: '并行可靠',
    unlock_data_purge: '数据清洗',
    unlock_data_dedup: '数据去重',
    unlock_data_curate: '数据精选',
    unlock_sft: 'SFT后训练',
    unlock_rlhf: 'RLHF后训练',
    unlock_dpo: 'DPO后训练',
    unlock_cot: 'CoT后训练',
  };
  return labels[effect.type] ?? effect.type;
}

/* ============== 实验验证 ============== */

function ExperimentTab() {
  const game = useGame();
  const researchProjects = useGameState((s) => s.researchProjects);
  const experimentResults = useGameState((s) => s.experimentResults);
  const employees = useGameState((s) => s.employees);
  const techMaturity = useGameState((s) => s.techMaturity);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  // PR-B：集群总算力（拉条实时反映实验占用对训练的影响）
  const clusterTotalTflops = useGameState((s) => calcClusterTotalTflops(s));

  // v2：所有技术均可实验（预设技术树 + 已获得的独有技术，排除 pretraining 基础）
  const allTechs = [
    ...ALL_TECH.filter((t) => t.id !== 'pretraining'),
    ...Object.values(IDEA_TECH_MAP),
  ];
  const researchers = employees.filter((e) => e.role === StaffRole.RESEARCHER && e.status === 'idle');

  const [selectedTechId, setSelectedTechId] = useState<string>(allTechs[0]?.id ?? '');
  const [experimentParams, setExperimentParams] = useState<number>(8);
  const [computeRatio, setComputeRatio] = useState<number>(0.10);
  const [selectedResearchers, setSelectedResearchers] = useState<Set<string>>(new Set());
  const [repeatMode, setRepeatMode] = useState<ExperimentRepeatMode>('once');

  const toggleResearcher = (id: string) => {
    setSelectedResearchers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 当前选中技术的元数据
  const selectedTech = allTechs.find((t) => t.id === selectedTechId);
  const techDiff = selectedTech?.difficulty ?? 1;

  // PR-B v2：实时计算派生值（公式 A/B/C/D，含技术难易度）
  const maxMaturityCap = calcMaxMaturityCap(experimentParams, techDiff);
  const budget = calcExperimentBudget(experimentParams);
  const fundsCost = calcExperimentFundsCost(experimentParams);
  const estimatedDays = calcExperimentEstimatedDays(experimentParams, computeRatio, clusterTotalTflops);
  const currentMat = techMaturity[selectedTechId] ?? 0;
  const canStillGrow = currentMat < maxMaturityCap;
  const occupiedTflops = clusterTotalTflops * computeRatio;

  // 满级所需的参数量提示
  const p100 = Math.pow(techDiff, 3) * 0.5;

  const handleStart = () => {
    game.executeCommand(
      new StartExperimentCommand(
        selectedTechId,
        Array.from(selectedResearchers),
        experimentParams,
        computeRatio,
        repeatMode,
      ),
    );
    setSelectedResearchers(new Set());
  };

  const handleQueue = () => {
    game.executeCommand(
      new QueueExperimentCommand(
        selectedTechId,
        Array.from(selectedResearchers),
        experimentParams,
        computeRatio,
        repeatMode,
      ),
    );
  };

  const experimentQueue = useGameState((s) => s.experimentQueue);

  const activeProjects = researchProjects.filter((p) => p.status === 'in_progress');
  const completedProjects = researchProjects.filter((p) => p.status === 'completed');

  // ★ UI-4 修复：原 allTechs.map 内每个 tech 调用 experimentResults.filter + aggregateExperiments，
  //   两次 O(N) 遍历 × T 个技术 = O(T×N)。改为 useMemo 一次性按 archTechId 分组并预聚合。
  const resultsByTechId = useMemo(() => {
    const m = new Map<string, ExperimentResult[]>();
    for (const r of experimentResults) {
      const arr = m.get(r.archTechId);
      if (arr) arr.push(r);
      else m.set(r.archTechId, [r]);
    }
    return m;
  }, [experimentResults]);

  const aggregatedByTechId = useMemo(() => {
    const m = new Map<string, Partial<Record<string, number>>>();
    for (const [techId, exps] of resultsByTechId) {
      if (exps.length === 0) {
        m.set(techId, {});
        continue;
      }
      const capIds = new Set(exps.flatMap((e) => Object.keys(e.estimatedBonuses)));
      const result: Partial<Record<string, number>> = {};
      for (const capId of capIds) {
        let weightedSum = 0;
        let weightSum = 0;
        for (const exp of exps) {
          const val = exp.estimatedBonuses[capId];
          if (val !== undefined) {
            weightedSum += val * exp.confidence;
            weightSum += exp.confidence;
          }
        }
        if (weightSum > 0) result[capId] = weightedSum / weightSum;
      }
      m.set(techId, result);
    }
    return m;
  }, [resultsByTechId]);

  const totalExpRatio = activeProjects
    .filter((p) => p.computeRatio !== null)
    .reduce((s, p) => s + (p.computeRatio ?? 0), 0);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>启动实验验证</span>
        <span className={styles.devHint}>
          集群总算力 {clusterTotalTflops.toFixed(0)} TFLOPS · 实验占用 {((totalExpRatio) * 100).toFixed(0)}%
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>目标技术</span>
        <select
          className={styles.select}
          value={selectedTechId}
          onChange={(e) => setSelectedTechId(e.target.value)}
        >
          {allTechs.map((t) => {
            const mat = techMaturity[t.id] ?? 0;
            const cap = calcMaxMaturityCap(experimentParams, t.difficulty);
            const diffLabel = t.difficulty >= 9 ? '★' : t.difficulty >= 6 ? '◆' : '';
            return (
              <option key={t.id} value={t.id}>
                {diffLabel}[难度{t.difficulty}] {t.name}
                {mat >= 1 ? ` (成熟度 ${mat.toFixed(0)}/${cap.toFixed(0)})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {selectedTech && (
        <div className={styles.devHint} style={{ paddingLeft: '120px', marginBottom: '4px' }}>
          {selectedTech.description} · 难度 {techDiff} · 满级需 ≥{p100.toFixed(1)}B 实验模型
          {selectedTech.isArchitecture && ' · [架构]'}
        </div>
      )}

      {/* PR-B v2：实验参数量下拉（扩展至 1024B） */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>实验参数量</span>
        <select
          className={styles.select}
          value={experimentParams}
          onChange={(e) => setExperimentParams(Number(e.target.value))}
        >
          {EXPERIMENT_CONFIG.paramOptions.map((p) => (
            <option key={p} value={p}>{p >= 1024 ? `${(p / 1024).toFixed(0)}T` : `${p}B`}</option>
          ))}
        </select>
        <span className={styles.devHint}>
          成熟度上限 {maxMaturityCap.toFixed(0)}%
          {!canStillGrow && <span style={{ color: '#ff6b6b' }}> · 已达上限</span>}
        </span>
      </div>

      {/* PR-B：算力比例拉条 */}
      <div className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>算力投入</span>
        <input
          type="range"
          min={EXPERIMENT_CONFIG.minComputeRatio}
          max={EXPERIMENT_CONFIG.maxComputeRatio}
          step={EXPERIMENT_CONFIG.ratioStep}
          value={computeRatio}
          onChange={(e) => setComputeRatio(Number(e.target.value))}
          style={{ flex: '1 1 200px', minWidth: '120px' }}
        />
        <span className={styles.devHint} style={{ minWidth: '60px' }}>
          {(computeRatio * 100).toFixed(1)}%
        </span>
        <span className={styles.devHint}>
          占用 {occupiedTflops.toFixed(0)} TFLOPS
        </span>
      </div>

      {/* 派生指标 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>预算 / 预计</span>
        <span className={styles.devHint}>
          {budget.toLocaleString(undefined, { maximumFractionDigits: 0 })} TFLOPS·天 · {Number.isFinite(estimatedDays) ? `${estimatedDays.toFixed(1)} 天` : '∞（无集群算力）'}
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>启动成本</span>
        <span className={styles.devHint} style={{ color: funds < fundsCost ? '#ff6b6b' : '#e6f0ff' }}>
          ${fundsCost.toLocaleString()}
        </span>
      </div>

      {/* 研究员选择 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>研究员 ({selectedResearchers.size})</span>
        <span className={styles.devHint}>提升成熟度增益（智力越高越好）</span>
      </div>
      {researchers.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>无空闲研究员</div>
      ) : (
        researchers.map((emp) => (
          <div key={emp.id} className={styles.devRow}>
            <button
              className={`${styles.btn} ${selectedResearchers.has(emp.id) ? styles.btnActive : ''}`}
              onClick={() => toggleResearcher(emp.id)}
            >
              {selectedResearchers.has(emp.id) ? '✓ ' : ''}
              {emp.name} (智力{emp.attributes.intelligence})
            </button>
          </div>
        ))
      )}

      {/* 重复模式选择 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>执行模式</span>
        <button
          className={`${styles.btn} ${repeatMode === 'once' ? styles.btnActive : ''}`}
          onClick={() => setRepeatMode('once')}
        >
          进行一次
        </button>
        <button
          className={`${styles.btn} ${repeatMode === 'to_cap' ? styles.btnActive : ''}`}
          onClick={() => setRepeatMode('to_cap')}
        >
          进行到上限
        </button>
        <span className={styles.devHint}>
          {repeatMode === 'once'
            ? '完成后释放研究员'
            : `重复执行至成熟度达 ${maxMaturityCap.toFixed(0)}% 上限`}
        </span>
      </div>

      <div className={styles.devRow}>
        <button
          className={styles.btn}
          style={{ opacity: (selectedResearchers.size === 0 || funds < fundsCost || !canStillGrow) ? 0.5 : 1 }}
          disabled={selectedResearchers.size === 0 || funds < fundsCost || !canStillGrow}
          onClick={handleStart}
        >
          立即启动
        </button>
        <button
          className={styles.btn}
          style={{ opacity: (!canStillGrow) ? 0.5 : 1 }}
          disabled={!canStillGrow}
          onClick={handleQueue}
        >
          加入队列
        </button>
        {!canStillGrow && (
          <span className={styles.devHint} style={{ color: '#ff6b6b' }}>
            当前参数量下成熟度已达上限，需更大参数量实验
          </span>
        )}
      </div>

      {/* 实验队列 */}
      {experimentQueue.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>
              实验队列 ({experimentQueue.length})
            </span>
            <button
              className={styles.btn}
              style={{ fontSize: '12px', marginLeft: '8px' }}
              onClick={() => game.executeCommand(new ClearExperimentQueueCommand())}
            >
              清空
            </button>
          </div>
          {experimentQueue.map((item, idx) => {
            const techName = TECH_MAP[item.techId]?.name
              ?? IDEA_TECH_MAP[item.techId]?.name
              ?? item.techId;
            return (
              <div key={item.id} className={styles.devRow}>
                <span className={styles.devHint} style={{ minWidth: '24px' }}>
                  {idx + 1}.
                </span>
                <span className={styles.devHint} style={{ minWidth: '0' }}>
                  {techName} · {item.experimentParams >= 1024 ? `${(item.experimentParams / 1024).toFixed(0)}T` : `${item.experimentParams}B`}
                  {' · '}{(item.computeRatio * 100).toFixed(0)}%算力
                  {' · '}{item.repeatMode === 'once' ? '一次' : '到上限'}
                </span>
                <button
                  className={styles.btn}
                  style={{ fontSize: '12px' }}
                  onClick={() => game.executeCommand(new RemoveQueuedExperimentCommand(item.id))}
                >
                  移除
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* 进行中实验 */}
      {activeProjects.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>进行中 ({activeProjects.length})</span>
          </div>
          {activeProjects.map((p) => {
            const name = TECH_MAP[p.targetArchId ?? '']?.name
              ?? IDEA_TECH_MAP[p.targetArchId ?? '']?.name
              ?? p.targetArchId;
            const ratioPct = ((p.computeRatio ?? 0) * 100).toFixed(0);
            const params = p.experimentParams ?? 0;
            return (
              <div key={p.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
                <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                  · {name} · {params}B · {ratioPct}% 算力 · {(p.progress * 100).toFixed(0)}%
                  {p.repeatMode === 'to_cap' && <span style={{ color: '#ffb454' }}> · 重复到上限</span>}
                </span>
                <button
                  className={styles.btn}
                  onClick={() => game.executeCommand(new CancelResearchProjectCommand(p.id))}
                >
                  取消
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* 实验结果 */}
      {completedProjects.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>实验结果</span>
          </div>
          {allTechs.map((tech) => {
            // ★ UI-4 修复：从预聚合的 Map 中 O(1) 取值，避免每次 filter + aggregateExperiments
            const results = resultsByTechId.get(tech.id);
            if (!results || results.length === 0) return null;
            const aggregated = aggregatedByTechId.get(tech.id) ?? {};
            return (
              <div key={tech.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
                <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                  · {tech.name} ({results.length}次实验)
                </span>
                <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                  {Object.entries(aggregated).map(([capId, val]) =>
                    `${CAPABILITY_MAP[capId as keyof typeof CAPABILITY_MAP]?.name ?? capId}: ${((val ?? 0) * 100).toFixed(1)}%`,
                  ).join(' · ')}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ============== 风险管理 ============== */

function RiskTab() {
  const game = useGame();
  const riskState = useGameState((s) => s.riskState);
  const models = useGameState((s) => s.models);
  const techMaturity = useGameState((s) => s.techMaturity);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const formatDay = useFormatDate();

  // ★ P0-5/F-3 修复：legalDebt 为负时 settleCost 为负，Math.max 兜底
  const safeLegalDebt = Math.max(0, riskState.legalDebt);
  const settleCost = Math.floor(safeLegalDebt) * 100_000;
  const hasAlignment = (techMaturity['alignment_v1'] ?? 0) >= 1;
  // ★ P0-5 修复：原 Math.max(...Object.values(...)) 在能力字段 ≥ 125k 时栈溢出
  // 改用 reduce 循环求最大；空对象时返回 0 而非 -Infinity
  const strongModels = models.filter((m) => {
    let maxCap = 0;
    for (const v of Object.values(m.capabilities)) {
      if (v > maxCap) maxCap = v;
    }
    return maxCap > 1500;
  });

  return (
    <div className={styles.tabBody}>
      {/* 风险状态 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>风险状态</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '120px' }}>法律债务</span>
        <span className={styles.devHint} style={{
          color: riskState.legalDebt > 10 ? '#ff6b6b' : riskState.legalDebt > 5 ? '#ffb454' : '#e6f0ff',
        }}>
          {riskState.legalDebt.toFixed(1)} / 100
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '120px' }}>信任债务</span>
        <span className={styles.devHint} style={{
          color: riskState.trustDebt > 8 ? '#ff6b6b' : riskState.trustDebt > 5 ? '#ffb454' : '#e6f0ff',
        }}>
          {riskState.trustDebt.toFixed(1)} / 100
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '120px' }}>员工士气</span>
        <span className={styles.devHint} style={{
          color: riskState.employeeMorale < 30 ? '#ff6b6b' : riskState.employeeMorale < 60 ? '#ffb454' : '#e6f0ff',
        }}>
          {riskState.employeeMorale.toFixed(0)} / 100
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '120px' }}>公司声誉</span>
        <span className={styles.devHint} style={{
          color: riskState.reputation < 30 ? '#ff6b6b' : riskState.reputation < 60 ? '#ffb454' : '#e6f0ff',
        }}>
          {riskState.reputation.toFixed(0)} / 100
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '120px' }}>对齐程度</span>
        <span className={styles.devHint}>
          {(riskState.alignmentLevel * 100).toFixed(0)}%
        </span>
      </div>

      {/* 补救措施 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>补救措施</span>
      </div>

      <div className={styles.devRow}>
        <button
          className={styles.btn}
          style={{ opacity: (riskState.legalDebt < 3 || funds < settleCost) ? 0.5 : 1 }}
          disabled={riskState.legalDebt < 3 || funds < settleCost}
          onClick={() => game.executeCommand(new SettleLawsuitCommand())}
        >
          和解诉讼
        </button>
        <span className={styles.devHint}>
          legal_debt -3 · 花费 ${settleCost.toLocaleString()} · 声誉 +5
        </span>
      </div>

      <div className={styles.devRow}>
        <button
          className={styles.btn}
          style={{ opacity: riskState.trustDebt < 2 ? 0.5 : 1 }}
          disabled={riskState.trustDebt < 2}
          onClick={() => game.executeCommand(new PublicApologyCommand())}
        >
          公开道歉
        </button>
        <span className={styles.devHint}>
          trust_debt -2 · 声誉 -5
        </span>
      </div>

      {/* 模型审计 */}
      {hasAlignment && strongModels.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>模型审计</span>
          </div>
          {strongModels.map((m) => (
            <div key={m.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · {m.name} ({m.paramCount}B)
                {m.audited && ' ✓已审计'}
                {m.usedInResearch && ' · 用于研发'}
              </span>
              {!m.audited && (
                <button
                  className={styles.btn}
                  onClick={() => game.executeCommand(new ConductAuditCommand(m.id))}
                >
                  审计
                </button>
              )}
              {!m.usedInResearch && (
                <button
                  className={styles.btn}
                  onClick={() => game.executeCommand(new UseModelInResearchCommand(m.id))}
                >
                  用于研发
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {/* 事件历史 */}
      {riskState.triggeredEvents.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>事件历史</span>
          </div>
          {riskState.triggeredEvents.slice(-20).reverse().map((evt, i) => (
            <div key={i} className={styles.devRow}>
              <span className={styles.devHint} style={{
                color: evt.severity === 'critical' ? '#ff6b6b' :
                       evt.severity === 'major' ? '#ffb454' : '#e6f0ff',
              }}>
                {formatDay(evt.date)} · {evt.eventName} ({evt.severity})
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ============== 员工创意 ============== */

function IdeaTab() {
  const game = useGame();
  const pendingIdeas = useGameState((s) => s.pendingIdeas);
  const employees = useGameState((s) => s.employees);
  const techMaturity = useGameState((s) => s.techMaturity);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const formatDay = useFormatDate();

  const pending = pendingIdeas.filter((i) => i.status === 'pending');
  const inProgress = pendingIdeas.filter((i) => i.status === 'verifying');
  const done = pendingIdeas.filter((i) => i.status === 'accepted' || i.status === 'failed');
  const empMap = new Map(employees.map((e) => [e.id, e]));

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>员工创意 ({pending.length})</span>
      </div>
      <div className={styles.devHint} style={{ paddingLeft: '4px', marginBottom: '6px' }}>
        研究员每 7 天可能产出创意；接受后需验证（时间+资金），成功率取决于提出者属性。
      </div>

      {/* 待处理 */}
      {pending.length === 0 && inProgress.length === 0 && done.length === 0 && (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无创意</div>
      )}

      {pending.map((idea) => {
        const emp = empMap.get(idea.sourceEmployeeId);
        const mat = techMaturity[idea.targetTechId] ?? 0;
        return (
          <div key={idea.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
            <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
              · {idea.title}
              {idea.kind === 'unique' ? ' [独有]' : ' [优化]'}
            </span>
            <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
              {idea.description}
            </span>
            <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
              来源：{emp?.name ?? '未知员工'} · {formatDay(idea.generatedDay)}
              {idea.kind === 'accelerate' && mat >= 1
                ? ` · 当前成熟度 ${mat.toFixed(0)}`
                : ''}
            </span>
            <button
              className={styles.btn}
              disabled={funds < 2000 || idea.status !== 'pending'}
              onClick={() => game.executeCommand(new AcceptIdeaCommand(idea.id))}
            >
              接受
            </button>
            <button
              className={styles.btn}
              disabled={idea.status !== 'pending'}
              onClick={() => game.executeCommand(new RejectIdeaCommand(idea.id))}
            >
              拒绝
            </button>
          </div>
        );
      })}

      {/* 验证中 */}
      {inProgress.length > 0 && (
        <>
          <div className={styles.devRow} style={{ marginTop: '8px' }}>
            <span className={styles.devRowLabel}>验证中 ({inProgress.length})</span>
          </div>
          {inProgress.map((idea) => {
            const emp = empMap.get(idea.sourceEmployeeId);
            const pct = ((idea.verificationDays ?? 0) / (idea.verificationTotalDays ?? 1)) * 100;
            const successPct = ((idea.successProbability ?? 0) * 100).toFixed(0);
            return (
              <div key={idea.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
                <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                  · {idea.title}
                  {idea.kind === 'unique' ? ' [独有]' : ''}
                </span>
                <span className={styles.devHint} style={{
                  flex: '1 1 100%', paddingLeft: '12px', color: '#ffb454',
                }}>
                  验证进度 {idea.verificationDays}/{idea.verificationTotalDays} 天 ({pct.toFixed(0)}%)
                  · 成本 ${idea.verificationDailyCost}/天
                  · 成功率 {successPct}%
                  · 提出者 {emp?.name ?? '?'}
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* 已完成（成功/失败） */}
      {done.length > 0 && (
        <>
          <div className={styles.devRow} style={{ marginTop: '8px' }}>
            <span className={styles.devRowLabel}>已完成 ({done.length})</span>
          </div>
          {done.slice(-10).map((idea) => {
            const emp = empMap.get(idea.sourceEmployeeId);
            const isSuccess = idea.status === 'accepted';
            return (
              <div key={idea.id} className={styles.devRow}>
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  · {idea.title}
                </span>
                <span className={styles.devHint} style={{
                  color: isSuccess ? '#5cb85c' : '#d9534f',
                }}>
                  {isSuccess ? '✓ 验证成功' : '✗ 验证失败（25%效果）'}
                  {' · '}{emp?.name ?? '?'}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ============== 开源采纳 ============== */

function OpenSourceTab() {
  const game = useGame();
  const openSourceOffers = useGameState((s) => s.openSourceOffers);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const currentDate = useGameState((s) => s.date);

  const active = openSourceOffers.filter((o) => o.adoptedDay === undefined && currentDate <= o.expiresDay);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>开源要约 ({active.length})</span>
      </div>
      <div className={styles.devHint} style={{ paddingLeft: '4px', marginBottom: '6px' }}>
        开源策略公司（Menta/ShallowFind/Mistral）每 30~60 天发布一项技术；14 天内可付费采纳，初始成熟度 20~40（PR-D）。
      </div>
      {active.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无可采纳的开源要约</div>
      ) : (
        active.map((offer) => {
          const remaining = offer.expiresDay - currentDate;
          const affordable = funds >= offer.adoptionCost;
          return (
            <div key={offer.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
              <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                · {offer.techName}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                {offer.techDescription}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                来源：{offer.source} · 成本 ${offer.adoptionCost.toLocaleString()} · 初始成熟度 {offer.initialMaturity} · 剩余 {remaining} 天
              </span>
              <button
                className={styles.btn}
                style={{ opacity: affordable ? 1 : 0.5 }}
                disabled={!affordable}
                onClick={() => game.executeCommand(new AdoptOpenSourceCommand(offer.id))}
              >
                采纳
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ============== 小公司市场 ============== */

function MarketTab() {
  const game = useGame();
  const smallCompanies = useGameState((s) => s.smallCompanies);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const currentDate = useGameState((s) => s.date);

  const active = smallCompanies.filter(
    (c) => !c.acquired && currentDate - c.spawnedDay <= c.lifespan,
  );

  const techName = (tid: string): string =>
    TECH_MAP[tid]?.name ?? IDEA_TECH_MAP[tid]?.name ?? tid;

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>小公司市场 ({active.length})</span>
      </div>
      <div className={styles.devHint} style={{ paddingLeft: '4px', marginBottom: '6px' }}>
        每 14 天刷新 2~3 家拥有 1~3 项技术的小公司；30 天内可收购。PR-D：每项技术初始成熟度 20~80，成熟度越高估值越高。
      </div>
      {active.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无可收购的小公司</div>
      ) : (
        active.map((c) => {
          const remaining = c.lifespan - (currentDate - c.spawnedDay);
          const affordable = funds >= c.valuation;
          return (
            <div key={c.id} className={styles.devRow} style={{ flexWrap: 'wrap', gap: '4px' }}>
              <span className={styles.devRowLabel} style={{ minWidth: 0, flex: '1 1 100%' }}>
                · {c.name}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                {c.background}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                技术：
                {c.technologies.map((tid) => {
                  const mat = c.techMaturities?.[tid];
                  const matLabel = mat !== undefined ? ` (${mat}%)` : '';
                  return `${techName(tid)}${matLabel}`;
                }).join('、')}
              </span>
              <span className={styles.devHint} style={{ flex: '1 1 100%', paddingLeft: '12px' }}>
                估值 ${c.valuation.toLocaleString()} · 剩余 {remaining} 天
              </span>
              <button
                className={styles.btn}
                style={{ opacity: affordable ? 1 : 0.5 }}
                disabled={!affordable}
                onClick={() => game.executeCommand(new AcquireSmallCompanyCommand(c.id))}
              >
                收购
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
