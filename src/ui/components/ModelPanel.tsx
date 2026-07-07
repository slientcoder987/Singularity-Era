/**
 * ModelPanel
 *
 * 大模型训练面板，包含四个标签：
 * - 模型列表：所有模型概览 + 创建新模型
 * - 训练控制：配置、能力雷达、checkpoint、发布
 * - 评估：benchmark 分数 + 隐性维度信号
 * - 竞品动态：已触发事件 + 市场压力
 */

import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import {
  CreateModelCommand,
  CreateCheckpointCommand,
  RollbackToCheckpointCommand,
  ReleaseModelCommand,
  PauseTrainingCommand,
  ResumeTrainingCommand,
  AbandonModelCommand,
} from '../../core/commands/ModelCommands';
import {
  PurchaseDatasetCommand,
  BuildDatasetCommand,
  SynthesizeDatasetCommand,
} from '../../core/commands/DatasetCommands';
import {
  StartResearchCommand,
  PauseResearchCommand,
  ResumeResearchCommand,
  PurchaseTechPointsCommand,
  FundResearchCommand,
} from '../../core/commands/TechCommands';
import {
  SetPricingStrategyCommand,
  ResolveCrisisCommand,
  type PricingStrategy,
} from '../../core/commands/MarketCommands';
import {
  AVAILABLE_PARAM_SIZES,
  getParamSize,
} from '../../core/config/paramSizes';
import { AVAILABLE_ARCHITECTURES } from '../../core/config/architectures';
import {
  ORDERED_STAGES,
  getStageConfig,
  type TrainingStageId,
} from '../../core/config/trainingStages';
import {
  EXPLICIT_DIMS,
  getDimConfig,
  getEffectiveValue,
} from '../../core/config/capabilityDims';
import { BENCHMARKS } from '../../core/config/benchmarks';
import { DATASET_TEMPLATES } from '../../core/config/datasets';
import { TECH_TREE, getTechNode, canResearch } from '../../core/config/techTree';
import { getCrisisEvent } from '../../core/config/crisisEvents';
import { defaultStageBudgetAllocation } from '../../core/entities/ModelEntity';
import type { ModelTrainingConfig } from '../../core/entities/ModelEntity';
import type { DataDomain } from '../../core/entities/Dataset';
import { StaffRole } from '../../core/entities/Employee';
import type { ParallelConfig } from '../../core/utils/parallelStrategy';
import { recommendParallel } from '../../core/utils/parallelStrategy';
import styles from '../styles/App.module.css';

type ModelTab = 'list' | 'train' | 'eval' | 'competitor' | 'data' | 'tech' | 'market';

const MODEL_TABS: { key: ModelTab; label: string; icon: string }[] = [
  { key: 'list', label: '模型', icon: '🧠' },
  { key: 'train', label: '训练', icon: '🎯' },
  { key: 'eval', label: '评估', icon: '📊' },
  { key: 'competitor', label: '竞品', icon: '⚔️' },
  { key: 'data', label: '数据', icon: '📚' },
  { key: 'tech', label: '科技', icon: '🔬' },
  { key: 'market', label: '市场', icon: '💰' },
];

export function ModelPanel() {
  const game = useGame();
  const [tab, setTab] = useState<ModelTab>('list');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>大模型训练系统</h3>

      <CrisisBanner game={game} />

      <div className={styles.empFilter}>
        {MODEL_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.empFilterBtn} ${tab === t.key ? styles.empFilterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && <ModelListTab game={game} />}
      {tab === 'train' && <TrainTab game={game} />}
      {tab === 'eval' && <EvalTab game={game} />}
      {tab === 'competitor' && <CompetitorTab />}
      {tab === 'data' && <DataTab game={game} />}
      {tab === 'tech' && <TechTab game={game} />}
      {tab === 'market' && <MarketTab game={game} />}
    </section>
  );
}

/* ============== 危机横幅 ============== */

function CrisisBanner({ game }: { game: ReturnType<typeof useGame> }) {
  const activeCrises = useGameState((s) => s.activeCrises);
  const unresolved = activeCrises.filter((c) => !c.resolved);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (unresolved.length === 0) return null;

  return (
    <div style={{
      border: '1px solid #ffb454',
      background: 'rgba(255,180,84,0.08)',
      borderRadius: '4px',
      padding: '6px 8px',
      marginBottom: '6px',
    }}>
      <div className={styles.devRow} style={{ margin: 0 }}>
        <span className={styles.devRowLabel} style={{ minWidth: 0, color: '#ffb454' }}>
          ⚠️ 危机事件 ({unresolved.length})
        </span>
      </div>
      {unresolved.map((c) => {
        const cfg = getCrisisEvent(c.crisisId);
        if (!cfg) return null;
        const isExpanded = expandedId === c.id || unresolved.length === 1;
        return (
          <div key={c.id} style={{ marginTop: '4px' }}>
            <div
              className={styles.devRow}
              style={{ margin: 0, cursor: 'pointer' }}
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
            >
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · [第 {c.triggeredAt} 天] {cfg.description}
              </span>
              <span className={styles.devHint}>
                {isExpanded ? '收起' : '展开'}
              </span>
            </div>
            {isExpanded && (
              <>
                {cfg.options.map((opt) => (
                  <div key={opt.id} className={styles.devRow} style={{ margin: 0 }}>
                    <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                      · {opt.label}
                    </span>
                    <span className={styles.devHint}>{opt.description}</span>
                    <button
                      className={styles.btn}
                      onClick={() => game.executeCommand(new ResolveCrisisCommand(c.id, opt.id))}
                    >
                      选择
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============== 模型列表 ============== */

function ModelListTab({ game }: { game: ReturnType<typeof useGame> }) {
  const models = useGameState((s) => s.models);
  const clusters = useGameState((s) => s.clusters);
  const datasets = useGameState((s) => s.datasets);
  const completedTechs = useGameState((s) => s.completedTechs);

  const [showCreate, setShowCreate] = useState(false);
  const [modelName, setModelName] = useState('GPT-X');
  const [paramSizeId, setParamSizeId] = useState('small_7b');
  const [selectedArchIds, setSelectedArchIds] = useState<Set<string>>(new Set(['dense_standard']));
  const [precision, setPrecision] = useState<'fp32' | 'bf16' | 'fp8' | 'int4'>('bf16');
  const [contextLength, setContextLength] = useState(4096);
  const [totalSteps, setTotalSteps] = useState(10000);
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [stageBudget, setStageBudget] = useState<Record<TrainingStageId, number>>(
    defaultStageBudgetAllocation(),
  );
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(new Set());
  const [parallelConfig, setParallelConfig] = useState<ParallelConfig>({ dp: 1, tp: 1, pp: 1 });

  const toggleArch = (id: string) => {
    setSelectedArchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDataset = (id: string) => {
    setSelectedDatasetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    const config: ModelTrainingConfig = {
      paramSizeId,
      architectureIds: Array.from(selectedArchIds),
      precision,
      maxContextLength: contextLength,
      stageBudgetAllocation: stageBudget,
      totalStepsTarget: totalSteps,
      datasetIds: Array.from(selectedDatasetIds),
      parallelConfig,
    };
    game.executeCommand(new CreateModelCommand(modelName, config, selectedClusterId));
    setShowCreate(false);
    setModelName('GPT-X');
    setSelectedArchIds(new Set(['dense_standard']));
    setSelectedDatasetIds(new Set());
    setParallelConfig({ dp: 1, tp: 1, pp: 1 });
  };

  // 推荐并行配置
  const handleRecommendParallel = () => {
    const ps = getParamSize(paramSizeId);
    if (!ps || !selectedClusterId) return;
    const cluster = clusters.find((c) => c.id === selectedClusterId);
    if (!cluster) return;
    // 简单估算卡数
    const cardCount = cluster.nodes.length * 8;
    const rec = recommendParallel(
      { paramCount: ps.paramCountB, architecture: Array.from(selectedArchIds).join('+') },
      cardCount,
      completedTechs
        .map((id) => TECH_TREE.find((t) => t.id === id)?.unlocksParallelStrategy)
        .filter(Boolean) as any[],
    );
    setParallelConfig(rec);
  };

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>模型列表</span>
        <span className={styles.devHint}>{models.length} 个模型</span>
        <button className={styles.btn} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '取消' : '创建新模型'}
        </button>
      </div>

      {showCreate && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>名称</span>
            <input
              className={styles.input}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              style={{ width: '120px' }}
            />
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>参数规模</span>
            <select
              className={styles.select}
              value={paramSizeId}
              onChange={(e) => {
                const newId = e.target.value;
                setParamSizeId(newId);
                // 切换参数规模时，自动同步推荐总步数（玩家仍可手动调整）
                const ps = getParamSize(newId);
                if (ps) setTotalSteps(ps.recommendedStepsTarget);
              }}
            >
              {AVAILABLE_PARAM_SIZES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.paramCountB}B · 需 {p.minMemoryGB}GB · 风险 {(p.baseStabilityRisk * 100).toFixed(0)}%
                </option>
              ))}
            </select>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>架构</span>
          </div>
          {AVAILABLE_ARCHITECTURES.map((a) => (
            <label key={a.id} className={styles.devRow} style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedArchIds.has(a.id)}
                onChange={() => toggleArch(a.id)}
                style={{ marginRight: '6px' }}
              />
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                {a.name} · {a.description}
              </span>
            </label>
          ))}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>精度</span>
            <select
              className={styles.select}
              value={precision}
              onChange={(e) => setPrecision(e.target.value as 'fp32' | 'bf16' | 'fp8' | 'int4')}
            >
              <option value="fp32">FP32</option>
              <option value="bf16">BF16</option>
              <option value="fp8">FP8</option>
              <option value="int4">INT4</option>
            </select>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>上下文</span>
            <input
              className={styles.input}
              type="number"
              min={512}
              step={512}
              value={contextLength}
              onChange={(e) => setContextLength(Number(e.target.value))}
              style={{ width: '80px' }}
            />
            <span className={styles.devHint}>tokens</span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>总步数</span>
            <input
              className={styles.input}
              type="number"
              min={1000}
              step={1000}
              value={totalSteps}
              onChange={(e) => setTotalSteps(Number(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>集群</span>
            <select
              className={styles.select}
              value={selectedClusterId}
              onChange={(e) => setSelectedClusterId(e.target.value)}
            >
              <option value="">选择集群...</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.nodes.length} 节点)
                </option>
              ))}
            </select>
          </div>
          {/* 数据集选择 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>训练数据集</span>
            <span className={styles.devHint}>
              已选 {selectedDatasetIds.size} / {datasets.length} 个
            </span>
          </div>
          {datasets.length === 0 ? (
            <div className={styles.emptyHint}>尚无数据集，请到"数据"标签采购</div>
          ) : (
            datasets.map((ds) => (
              <label key={ds.id} className={styles.devRow} style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedDatasetIds.has(ds.id)}
                  onChange={() => toggleDataset(ds.id)}
                  style={{ marginRight: '6px' }}
                />
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  {ds.name} · {ds.domain} · {ds.tokensB}B tokens
                </span>
                <span className={styles.devHint}>
                  Q{ds.quality.toFixed(0)} D{ds.diversity.toFixed(0)} F{ds.freshness.toFixed(0)}
                </span>
              </label>
            ))
          )}
          {/* 并行策略配置 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>并行策略</span>
            <button
              className={styles.btn}
              onClick={handleRecommendParallel}
              disabled={!selectedClusterId}
            >
              推荐
            </button>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>DP</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={parallelConfig.dp}
              onChange={(e) => setParallelConfig({ ...parallelConfig, dp: Math.max(1, Number(e.target.value)) })}
              style={{ width: '60px' }}
            />
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>TP</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={parallelConfig.tp}
              onChange={(e) => setParallelConfig({ ...parallelConfig, tp: Math.max(1, Number(e.target.value)) })}
              style={{ width: '60px' }}
            />
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>PP</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={parallelConfig.pp}
              onChange={(e) => setParallelConfig({ ...parallelConfig, pp: Math.max(1, Number(e.target.value)) })}
              style={{ width: '60px' }}
            />
          </div>
          {/* 阶段预算 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>阶段预算</span>
          </div>
          {ORDERED_STAGES.map((s) => (
            <div key={s.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>{s.name}</span>
              <input
                className={styles.input}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={stageBudget[s.id] ?? 0}
                onChange={(e) =>
                  setStageBudget({ ...stageBudget, [s.id]: Number(e.target.value) })
                }
                style={{ width: '120px' }}
              />
              <span className={styles.devHint}>
                {((stageBudget[s.id] ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <div className={styles.devRow}>
            <button
              className={styles.btn}
              disabled={!modelName || !selectedClusterId || selectedArchIds.size === 0}
              onClick={handleCreate}
            >
              创建并开始训练
            </button>
          </div>
        </>
      )}

      {models.length === 0 ? (
        <div className={styles.emptyHint}>尚无模型，点击"创建新模型"开始</div>
      ) : (
        models.map((m) => {
          const paramSize = getParamSize(m.config.paramSizeId);
          const stageCfg = getStageConfig(m.currentStage);
          const progressPct = (m.currentStep / m.config.totalStepsTarget) * 100;
          return (
            <div key={m.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · {m.name} ({paramSize?.name ?? m.config.paramSizeId})
              </span>
              <span className={styles.devHint}>
                {stageCfg?.name} · {progressPct.toFixed(1)}% · loss {m.currentLoss.toFixed(2)} · {m.status}
                {m.hasCrashed && ' ⚠️'}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ============== 训练控制 ============== */

function TrainTab({ game }: { game: ReturnType<typeof useGame> }) {
  const models = useGameState((s) => s.models);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [ckptLabel, setCkptLabel] = useState('');

  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>选择模型</span>
        <select
          className={styles.select}
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          <option value="">选择模型...</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.status})
            </option>
          ))}
        </select>
      </div>

      {!selectedModel ? (
        <div className={styles.emptyHint}>请选择一个模型</div>
      ) : (
        <>
          {/* 模型状态 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>状态</span>
            <span className={styles.devHint}>
              {selectedModel.status} · 阶段 {getStageConfig(selectedModel.currentStage)?.name}
              {selectedModel.pauseReason && ` · ${selectedModel.pauseReason}`}
            </span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>进度</span>
            <span className={styles.devHint}>
              {selectedModel.currentStep} / {selectedModel.config.totalStepsTarget} 步
              ({((selectedModel.currentStep / selectedModel.config.totalStepsTarget) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>loss</span>
            <span className={styles.devHint}>{selectedModel.currentLoss.toFixed(4)}</span>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>稳定性风险</span>
            <span className={styles.devHint} style={{ color: selectedModel.stabilityRisk > 0.15 ? '#ffb454' : '#7af0c0' }}>
              {(selectedModel.stabilityRisk * 100).toFixed(1)}%
            </span>
          </div>

          {/* 控制按钮 */}
          <div className={styles.devRow}>
            {selectedModel.status === 'training' && (
              <button
                className={styles.btn}
                onClick={() => game.executeCommand(new PauseTrainingCommand(selectedModel.id))}
              >
                暂停
              </button>
            )}
            {selectedModel.status === 'paused' && (
              <button
                className={styles.btn}
                onClick={() => game.executeCommand(new ResumeTrainingCommand(selectedModel.id))}
              >
                恢复
              </button>
            )}
            {(selectedModel.status === 'training' || selectedModel.status === 'paused') && (
              <>
                <input
                  className={styles.input}
                  value={ckptLabel}
                  onChange={(e) => setCkptLabel(e.target.value)}
                  placeholder="checkpoint 标签..."
                  style={{ width: '120px' }}
                />
                <button
                  className={styles.btn}
                  onClick={() => {
                    game.executeCommand(new CreateCheckpointCommand(selectedModel.id, ckptLabel || undefined));
                    setCkptLabel('');
                  }}
                >
                  创建 checkpoint
                </button>
                <button
                  className={styles.btn}
                  onClick={() => game.executeCommand(new ReleaseModelCommand(selectedModel.id))}
                >
                  发布模型
                </button>
              </>
            )}
            <button
              className={styles.btn}
              onClick={() => game.executeCommand(new AbandonModelCommand(selectedModel.id))}
            >
              放弃
            </button>
          </div>

          {/* Checkpoint 列表 */}
          {selectedModel.checkpoints.length > 0 && (
            <>
              <div className={styles.devRow}>
                <span className={styles.devRowLabel}>Checkpoints</span>
                <span className={styles.devHint}>{selectedModel.checkpoints.length} 个</span>
              </div>
              {selectedModel.checkpoints.map((c) => (
                <div key={c.id} className={styles.devRow}>
                  <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                    · {c.label ?? c.id.slice(-6)} · 步 {c.createdAtStep} · loss {c.loss.toFixed(3)}
                  </span>
                  <button
                    className={styles.btn}
                    onClick={() =>
                      game.executeCommand(new RollbackToCheckpointCommand(selectedModel.id, c.id))
                    }
                  >
                    回滚
                  </button>
                  <button
                    className={styles.btn}
                    onClick={() =>
                      game.executeCommand(new ReleaseModelCommand(selectedModel.id, c.id))
                    }
                  >
                    从此发布
                  </button>
                </div>
              ))}
            </>
          )}

          {/* 显性能力雷达（文字版） */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>显性能力</span>
          </div>
          {EXPLICIT_DIMS.map((dim) => {
            const cfg = getDimConfig(dim)!;
            const val = selectedModel.capabilities[dim] ?? 0;
            const eff = getEffectiveValue(selectedModel.capabilities, dim);
            return (
              <div key={dim} className={styles.devRow}>
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  · {cfg.displayName}
                </span>
                <div style={{ flex: 1, maxWidth: '200px', height: '8px', background: 'rgba(86,220,230,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${eff}%`,
                      height: '100%',
                      background: cfg.inverse ? '#ffb454' : '#7af0c0',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span className={styles.devHint}>{val.toFixed(1)}</span>
              </div>
            );
          })}

          {/* 隐性能力（仅模糊信号） */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>隐性信号</span>
            <span className={styles.devHint}>需发布后通过评估观察</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ============== 评估 ============== */

function EvalTab({ game: _game }: { game: ReturnType<typeof useGame> }) {
  const models = useGameState((s) => s.models);
  const benchmarkResults = useGameState((s) => s.benchmarkResults);
  const hiddenDimSignals = useGameState((s) => s.hiddenDimSignals);
  const totalUsers = useGameState((s) => s.totalUsers);
  const brandReputation = useGameState((s) => s.brandReputation);
  const marketPressure = useGameState((s) => s.marketPressure);

  const [selectedModelId, setSelectedModelId] = useState('');
  const releasedModels = models.filter((m) => m.status === 'released');
  const selectedModel = releasedModels.find((m) => m.id === selectedModelId);
  const modelResults = benchmarkResults.filter((r) => r.modelId === selectedModelId);
  const modelSignals = hiddenDimSignals.filter((s) => s.modelId === selectedModelId);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>市场指标</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 用户数</span>
        <span className={styles.devHint}>{totalUsers.toLocaleString()}</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 声誉</span>
        <span className={styles.devHint}>{brandReputation.toFixed(1)} / 100</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 市场压力</span>
        <span className={styles.devHint} style={{ color: marketPressure > 0.5 ? '#ffb454' : '#7af0c0' }}>
          {(marketPressure * 100).toFixed(0)}%
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>选择模型</span>
        <select
          className={styles.select}
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          <option value="">选择已发布模型...</option>
          {releasedModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (第 {m.releasedAt} 天发布)
            </option>
          ))}
        </select>
      </div>

      {!selectedModel ? (
        <div className={styles.emptyHint}>请选择一个已发布模型</div>
      ) : (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>Benchmark</span>
          </div>
          {BENCHMARKS.map((bench) => {
            const result = modelResults
              .filter((r) => r.benchmarkId === bench.id)
              .sort((a, b) => b.evalDate - a.evalDate)[0];
            return (
              <div key={bench.id} className={styles.devRow}>
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  · {bench.name}
                </span>
                <span className={styles.devHint}>
                  {result ? `${result.observedScore.toFixed(1)} 分` : '未评估'}
                </span>
              </div>
            );
          })}

          {/* 隐性维度信号 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>隐性信号</span>
            <span className={styles.devHint}>{modelSignals.length} 条</span>
          </div>
          {modelSignals.length === 0 ? (
            <div className={styles.devHint}>暂无隐性维度信号</div>
          ) : (
            modelSignals.map((sig, i) => {
              const cfg = getDimConfig(sig.dim);
              return (
                <div key={i} className={styles.devRow}>
                  <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                    · {cfg?.displayName ?? sig.dim} [{sig.strength}]
                  </span>
                  <span className={styles.devHint}>{sig.hint}</span>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

/* ============== 竞品动态 ============== */

function CompetitorTab() {
  const triggeredEvents = useGameState((s) => s.triggeredEvents);
  const marketPressure = useGameState((s) => s.marketPressure);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>市场压力</span>
        <span className={styles.devHint} style={{ color: marketPressure > 0.5 ? '#ffb454' : '#7af0c0' }}>
          {(marketPressure * 100).toFixed(0)}%
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>竞品事件</span>
        <span className={styles.devHint}>{triggeredEvents.length} 条</span>
      </div>

      {triggeredEvents.length === 0 ? (
        <div className={styles.emptyHint}>暂无竞品事件</div>
      ) : (
        triggeredEvents.map((e) => (
          <div key={e.eventId} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · [第 {e.triggeredAt} 天] {e.config.competitorName}
            </span>
            <span className={styles.devHint}>
              {e.config.description}
              {e.config.effects.marketPressure ? ` · 市场压力 +${(e.config.effects.marketPressure * 100).toFixed(0)}%` : ''}
              {e.config.effects.userLossRate ? ` · 用户流失 ${e.config.effects.userLossRate * 100}%` : ''}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

/* ============== 数据管理 ============== */

const DATA_DOMAINS: { id: DataDomain; label: string }[] = [
  { id: 'web', label: '网页' },
  { id: 'code', label: '代码' },
  { id: 'math', label: '数学' },
  { id: 'science', label: '科学' },
  { id: 'book', label: '书籍' },
  { id: 'dialogue', label: '对话' },
  { id: 'safety', label: '安全' },
];

function DataTab({ game }: { game: ReturnType<typeof useGame> }) {
  const datasets = useGameState((s) => s.datasets);
  const employees = useGameState((s) => s.employees);
  const models = useGameState((s) => s.models);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  // 采购数据集
  const [purchaseTplId, setPurchaseTplId] = useState(DATASET_TEMPLATES[0].id);

  // 自建数据集
  const [buildName, setBuildName] = useState('自建数据集');
  const [buildDomain, setBuildDomain] = useState<DataDomain>('web');
  const [buildTokens, setBuildTokens] = useState(10);
  const [buildEmpIds, setBuildEmpIds] = useState<Set<string>>(new Set());

  // 合成数据集
  const releasedModels = models.filter((m) => m.status === 'released');
  const [synthModelId, setSynthModelId] = useState('');
  const [synthDomain, setSynthDomain] = useState<DataDomain>('code');
  const [synthTokens, setSynthTokens] = useState(20);

  const toggleBuildEmp = (id: string) => {
    setBuildEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePurchase = () => {
    game.executeCommand(new PurchaseDatasetCommand(purchaseTplId));
  };

  const handleBuild = () => {
    if (!buildName || buildTokens <= 0) return;
    game.executeCommand(
      new BuildDatasetCommand(buildName, buildDomain, buildTokens, Array.from(buildEmpIds)),
    );
    setBuildName('自建数据集');
    setBuildEmpIds(new Set());
  };

  const handleSynth = () => {
    if (!synthModelId || synthTokens <= 0) return;
    game.executeCommand(
      new SynthesizeDatasetCommand(synthModelId, synthDomain, synthTokens),
    );
  };

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>资金</span>
        <span className={styles.devHint}>${funds.toLocaleString()}</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 数据集</span>
        <span className={styles.devHint}>{datasets.length} 个</span>
      </div>

      {/* 已有数据集列表 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>已有数据集</span>
      </div>
      {datasets.length === 0 ? (
        <div className={styles.emptyHint}>尚无数据集</div>
      ) : (
        datasets.map((ds) => (
          <div key={ds.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {ds.name} [{ds.source}]
            </span>
            <span className={styles.devHint}>
              {ds.domain} · {ds.tokensB}B · Q{ds.quality.toFixed(0)} D{ds.diversity.toFixed(0)} F{ds.freshness.toFixed(0)}
            </span>
          </div>
        ))
      )}

      {/* 采购数据集 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>采购数据集</span>
      </div>
      <div className={styles.devRow}>
        <select
          className={styles.select}
          value={purchaseTplId}
          onChange={(e) => setPurchaseTplId(e.target.value)}
        >
          {DATASET_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.domain} · {t.baseTokensB}B · ${t.baseCost.toLocaleString()}
            </option>
          ))}
        </select>
        <button className={styles.btn} onClick={handlePurchase}>采购</button>
      </div>

      {/* 自建数据集 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>自建数据集</span>
        <span className={styles.devHint}>成本 = tokens × $200</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>名称</span>
        <input
          className={styles.input}
          value={buildName}
          onChange={(e) => setBuildName(e.target.value)}
          style={{ width: '120px' }}
        />
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>领域</span>
        <select
          className={styles.select}
          value={buildDomain}
          onChange={(e) => setBuildDomain(e.target.value as DataDomain)}
        >
          {DATA_DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>tokens(B)</span>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={buildTokens}
          onChange={(e) => setBuildTokens(Number(e.target.value))}
          style={{ width: '60px' }}
        />
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>分配员工（影响质量）</span>
      </div>
      {employees.length === 0 ? (
        <div className={styles.emptyHint}>尚无员工</div>
      ) : (
        employees.map((emp) => (
          <label key={emp.id} className={styles.devRow} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={buildEmpIds.has(emp.id)}
              onChange={() => toggleBuildEmp(emp.id)}
              style={{ marginRight: '6px' }}
            />
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {emp.name} [{emp.role}]
            </span>
            <span className={styles.devHint}>
              智力 {emp.attributes.intelligence} · 创造力 {emp.attributes.creativity}
            </span>
          </label>
        ))
      )}
      <div className={styles.devRow}>
        <button
          className={styles.btn}
          disabled={!buildName || buildTokens <= 0}
          onClick={handleBuild}
        >
          自建（成本 ${(buildTokens * 200).toLocaleString()}）
        </button>
      </div>

      {/* 合成数据集 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>合成数据集</span>
        <span className={styles.devHint}>需已发布模型，成本 = tokens × $100</span>
      </div>
      {releasedModels.length === 0 ? (
        <div className={styles.emptyHint}>尚无已发布模型，无法合成</div>
      ) : (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>源模型</span>
            <select
              className={styles.select}
              value={synthModelId}
              onChange={(e) => setSynthModelId(e.target.value)}
            >
              <option value="">选择模型...</option>
              {releasedModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>领域</span>
            <select
              className={styles.select}
              value={synthDomain}
              onChange={(e) => setSynthDomain(e.target.value as DataDomain)}
            >
              {DATA_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>tokens(B)</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={synthTokens}
              onChange={(e) => setSynthTokens(Number(e.target.value))}
              style={{ width: '60px' }}
            />
          </div>
          <div className={styles.devRow}>
            <button
              className={styles.btn}
              disabled={!synthModelId || synthTokens <= 0}
              onClick={handleSynth}
            >
              合成（成本 ${(synthTokens * 100).toLocaleString()}）
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============== 科技树 ============== */

const TECH_CATEGORY_LABELS: Record<string, string> = {
  training: '训练效率',
  parallel: '并行策略',
  stability: '稳定性',
  evaluation: '评测',
  architecture: '架构',
  data: '数据',
};

function TechTab({ game }: { game: ReturnType<typeof useGame> }) {
  const researchProjects = useGameState((s) => s.researchProjects);
  const completedTechs = useGameState((s) => s.completedTechs);
  const techPoints = useGameState((s) => s.resources['tech_points'] ?? 0);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const employees = useGameState((s) => s.employees);

  const [buyPoints, setBuyPoints] = useState(10);
  const [fundQuantities, setFundQuantities] = useState<Record<string, number>>({});

  const researchers = employees.filter((e) => e.role === StaffRole.RESEARCHER);

  const handleStartResearch = (techId: string) => {
    // 自动分配所有研究员
    const assigned = researchers.map((r) => r.id);
    game.executeCommand(new StartResearchCommand(techId, assigned));
  };

  const handleBuyPoints = () => {
    if (buyPoints <= 0) return;
    game.executeCommand(new PurchaseTechPointsCommand(buyPoints));
  };

  const handleFund = (projectId: string, points: number) => {
    if (points <= 0) return;
    game.executeCommand(new FundResearchCommand(projectId, points));
  };

  // 按分类分组
  const grouped: Record<string, typeof TECH_TREE> = {};
  for (const t of TECH_TREE) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>科技点</span>
        <span className={styles.devHint}>{techPoints.toFixed(1)}</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 资金</span>
        <span className={styles.devHint}>${funds.toLocaleString()}</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 研究员</span>
        <span className={styles.devHint}>{researchers.length} 人</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 已完成</span>
        <span className={styles.devHint}>{completedTechs.length} / {TECH_TREE.length}</span>
      </div>

      {/* 购买科技点 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>购买科技点</span>
        <span className={styles.devHint}>$10,000 / 点</span>
      </div>
      <div className={styles.devRow}>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={buyPoints}
          onChange={(e) => setBuyPoints(Number(e.target.value))}
          style={{ width: '80px' }}
        />
        <button className={styles.btn} onClick={handleBuyPoints}>
          购买 {buyPoints} 点（${(buyPoints * 10000).toLocaleString()}）
        </button>
      </div>

      {/* 进行中研发 */}
      {researchProjects.filter((r) => r.status === 'researching').length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>进行中研发</span>
          </div>
          {researchProjects.filter((r) => r.status === 'researching').map((r) => {
            const node = getTechNode(r.techId);
            if (!node) return null;
            const qty = fundQuantities[r.id] ?? 10;
            return (
              <div key={r.id}>
                <div className={styles.devRow}>
                  <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                    · {node.name}
                  </span>
                  <span className={styles.devHint}>
                    {r.investedPoints.toFixed(1)} / {node.researchCost} 点 · {r.investedDays.toFixed(0)} / {node.researchDays} 天
                  </span>
                  <button
                    className={styles.btn}
                    onClick={() => game.executeCommand(new PauseResearchCommand(r.id))}
                  >
                    暂停
                  </button>
                </div>
                <div className={styles.devRow}>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      setFundQuantities({ ...fundQuantities, [r.id]: Number(e.target.value) })
                    }
                    style={{ width: '80px' }}
                  />
                  <button
                    className={styles.btn}
                    onClick={() => handleFund(r.id, qty)}
                  >
                    投入 {qty} 科技点
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* 已暂停研发 */}
      {researchProjects.filter((r) => r.status === 'paused').length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>已暂停研发</span>
          </div>
          {researchProjects.filter((r) => r.status === 'paused').map((r) => {
            const node = getTechNode(r.techId);
            if (!node) return null;
            return (
              <div key={r.id} className={styles.devRow}>
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  · {node.name}
                </span>
                <span className={styles.devHint}>
                  {r.investedPoints.toFixed(1)} / {node.researchCost} 点 · {r.investedDays.toFixed(0)} / {node.researchDays} 天
                </span>
                <button
                  className={styles.btn}
                  onClick={() => game.executeCommand(new ResumeResearchCommand(r.id))}
                >
                  恢复
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* 科技树（按分类） */}
      {Object.entries(grouped).map(([cat, techs]) => (
        <div key={cat}>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>{TECH_CATEGORY_LABELS[cat] ?? cat}</span>
          </div>
          {techs.map((t) => {
            const isCompleted = completedTechs.includes(t.id);
            const isResearching = researchProjects.some(
              (r) => r.techId === t.id && r.status === 'researching',
            );
            const isAvailable = !isCompleted && !isResearching && canResearch(t.id, completedTechs);
            const isLocked = !isCompleted && !isResearching && !isAvailable;

            return (
              <div key={t.id} className={styles.devRow}>
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  · {t.name}
                  {isCompleted && ' ✓'}
                  {isResearching && ' ⏳'}
                  {isLocked && ' 🔒'}
                </span>
                <span className={styles.devHint}>
                  {t.description} · {t.researchCost} 点 / {t.researchDays} 天
                  {t.prerequisites.length > 0 && ` · 前置: ${t.prerequisites.join(', ')}`}
                </span>
                {isAvailable && (
                  <button
                    className={styles.btn}
                    onClick={() => handleStartResearch(t.id)}
                  >
                    开始研究
                  </button>
                )}
                {isResearching && (
                  <button
                    className={styles.btn}
                    onClick={() => {
                      const proj = researchProjects.find(
                        (r) => r.techId === t.id && r.status === 'researching',
                      );
                      if (proj) game.executeCommand(new PauseResearchCommand(proj.id));
                    }}
                  >
                    暂停
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ============== 市场 ============== */

const PRICING_OPTIONS: { id: PricingStrategy; label: string; desc: string }[] = [
  { id: 'free', label: '免费', desc: '增长快，无收入' },
  { id: 'low', label: '低价', desc: '增长中，收入低' },
  { id: 'medium', label: '中价', desc: '平衡' },
  { id: 'high', label: '高价', desc: '增长慢，收入高' },
  { id: 'premium', label: '旗舰', desc: '用户少，ARPU 高' },
];

function MarketTab({ game }: { game: ReturnType<typeof useGame> }) {
  const pricingStrategy = useGameState((s) => s.pricingStrategy);
  const monthlyRevenue = useGameState((s) => s.monthlyRevenue);
  const monthlyCost = useGameState((s) => s.monthlyCost);
  const userSegments = useGameState((s) => s.userSegments);
  const totalUsers = useGameState((s) => s.totalUsers);
  const brandReputation = useGameState((s) => s.brandReputation);
  const marketPressure = useGameState((s) => s.marketPressure);
  const reputation = useGameState((s) => s.reputation);
  const models = useGameState((s) => s.models);
  const activeCrises = useGameState((s) => s.activeCrises);

  const releasedModels = models.filter((m) => m.status === 'released');
  const unresolvedCrises = activeCrises.filter((c) => !c.resolved);
  const currentPricing = PRICING_OPTIONS.find((p) => p.id === pricingStrategy);
  const currentPricingLabel = currentPricing ? currentPricing.label : pricingStrategy;
  const currentPricingDesc = currentPricing ? currentPricing.desc : '';

  return (
    <div className={styles.tabBody}>
      {/* 核心指标 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>月收入</span>
        <span className={styles.devHint} style={{ color: '#7af0c0' }}>
          ${monthlyRevenue.toFixed(0)}
        </span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 月成本</span>
        <span className={styles.devHint} style={{ color: '#ffb454' }}>
          ${monthlyCost.toFixed(0)}
        </span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 用户数</span>
        <span className={styles.devHint}>{totalUsers.toLocaleString()}</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 声誉</span>
        <span className={styles.devHint}>{brandReputation.toFixed(1)} / 100</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 口碑</span>
        <span className={styles.devHint}>{reputation.toFixed(1)} / 100</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 市场压力</span>
        <span className={styles.devHint} style={{ color: marketPressure > 50 ? '#ffb454' : '#7af0c0' }}>
          {marketPressure.toFixed(0)}%
        </span>
      </div>

      {/* 用户细分 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>用户细分</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 企业</span>
        <span className={styles.devHint}>{userSegments.enterprise.toLocaleString()}</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 开发者</span>
        <span className={styles.devHint}>{userSegments.developer.toLocaleString()}</span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· 个人</span>
        <span className={styles.devHint}>{userSegments.personal.toLocaleString()}</span>
      </div>

      {/* 定价策略 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>定价策略</span>
        <span className={styles.devHint}>当前：{currentPricingLabel}</span>
      </div>
      <div className={styles.devRow}>
        {PRICING_OPTIONS.map((p) => (
          <button
            key={p.id}
            className={`${styles.btn} ${pricingStrategy === p.id ? styles.empFilterBtnActive : ''}`}
            onClick={() => game.executeCommand(new SetPricingStrategyCommand(p.id))}
            style={{ marginRight: '4px' }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className={styles.devRow}>
        <span className={styles.devHint}>{currentPricingDesc}</span>
      </div>

      {/* 已发布模型 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>已发布模型</span>
        <span className={styles.devHint}>{releasedModels.length} 个</span>
      </div>
      {releasedModels.length === 0 ? (
        <div className={styles.emptyHint}>尚无已发布模型</div>
      ) : (
        releasedModels.map((m) => {
          const caps = m.releasedCapabilities ? m.releasedCapabilities : m.capabilities;
          const score = EXPLICIT_DIMS.reduce(
            (s, d) => s + getEffectiveValue(caps, d),
            0,
          );
          const psName = getParamSize(m.config.paramSizeId);
          return (
            <div key={m.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · {m.name} (第 {m.releasedAt} 天)
              </span>
              <span className={styles.devHint}>
                能力评分 {score.toFixed(0)} · {psName ? psName.name : m.config.paramSizeId}
              </span>
            </div>
          );
        })
      )}

      {/* 危机事件（重复显示，便于在市场标签内处理） */}
      {unresolvedCrises.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ color: '#ffb454' }}>
              ⚠️ 待处理危机 ({unresolvedCrises.length})
            </span>
          </div>
          <div className={styles.devHint}>
            请到顶部危机横幅或各模型详情中处理。
          </div>
        </>
      )}
    </div>
  );
}
