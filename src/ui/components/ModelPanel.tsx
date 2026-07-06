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
import { defaultStageBudgetAllocation } from '../../core/entities/ModelEntity';
import type { ModelTrainingConfig } from '../../core/entities/ModelEntity';
import styles from '../styles/App.module.css';

type ModelTab = 'list' | 'train' | 'eval' | 'competitor';

const MODEL_TABS: { key: ModelTab; label: string; icon: string }[] = [
  { key: 'list', label: '模型', icon: '🧠' },
  { key: 'train', label: '训练', icon: '🎯' },
  { key: 'eval', label: '评估', icon: '📊' },
  { key: 'competitor', label: '竞品', icon: '⚔️' },
];

export function ModelPanel() {
  const game = useGame();
  const [tab, setTab] = useState<ModelTab>('list');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>大模型训练系统</h3>

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
    </section>
  );
}

/* ============== 模型列表 ============== */

function ModelListTab({ game }: { game: ReturnType<typeof useGame> }) {
  const models = useGameState((s) => s.models);
  const clusters = useGameState((s) => s.clusters);

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

  const toggleArch = (id: string) => {
    setSelectedArchIds((prev) => {
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
    };
    game.executeCommand(new CreateModelCommand(modelName, config, selectedClusterId));
    setShowCreate(false);
    // 重置
    setModelName('GPT-X');
    setSelectedArchIds(new Set(['dense_standard']));
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
