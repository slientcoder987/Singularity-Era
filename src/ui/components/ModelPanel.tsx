import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { StartTrainingCommand, CancelTrainingCommand } from '../../core/commands/TrainingCommands';
import {
  AcquireDataCommand,
  SynthesizeDataCommand,
  StartDataCollectionCommand,
  StopDataCollectionCommand,
} from '../../core/commands/DataCommands';
import { ALL_TECH } from '../../core/config/techTree';
import { CAPABILITIES } from '../../core/config/capabilities';
import { observeCapabilities, calcNoiseSigma, calcTrainingCompute } from '../../core/utils/capabilityCalc';
import { diagnoseTraining } from '../../core/utils/trainingFeasibility';
import {
  COLLECTION_ROUTES,
  PURCHASE_ROUTES,
  COLLECTION_MAP,
  calcCollectionRate,
  calcCollectionQuality,
} from '../../core/config/dataAcquisition';
import { StaffRole } from '../../core/entities/Employee';
import { ROLE_TO_STAFF_RESOURCE } from '../../core/config/employees';
import type { Model } from '../../core/entities/Model';
import styles from '../styles/App.module.css';

type ModelTab = 'training' | 'models' | 'data';

const MODEL_TABS: { key: ModelTab; label: string; icon: string }[] = [
  { key: 'training', label: '训练', icon: '🎯' },
  { key: 'models', label: '模型', icon: '🧠' },
  { key: 'data', label: '数据', icon: '📊' },
];

export function ModelPanel() {
  const [tab, setTab] = useState<ModelTab>('training');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>大模型训练</h3>

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

      {tab === 'training' && <TrainingTab />}
      {tab === 'models' && <ModelsTab />}
      {tab === 'data' && <DataTab />}
    </section>
  );
}

/* ============== 训练标签 ============== */

function TrainingTab() {
  const game = useGame();
  const clusters = useGameState((s) => s.clusters);
  const datasets = useGameState((s) => s.datasets);
  const trainingProjects = useGameState((s) => s.trainingProjects);
  const unlockedTechs = useGameState((s) => s.unlockedTechs);

  const [modelName, setModelName] = useState('GPT-7B');
  const [paramCount, setParamCount] = useState(7);
  const [contextLength, setContextLength] = useState(4096);
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('dataset-initial');

  // 根据 Chinchilla 缩放定律自动计算训练所需算力
  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);
  const computeTotal = calcTrainingCompute(
    paramCount * 1e9,
    (selectedDataset?.totalTokens ?? 1) * 1e9,
    contextLength,
  );

  // 选择已解锁的架构技术
  const archTechs = ALL_TECH.filter(
    (t) => t.isArchitecture && unlockedTechs.includes(t.id),
  );
  const [selectedArchs, setSelectedArchs] = useState<Set<string>>(new Set());

  const toggleArch = (id: string) => {
    setSelectedArchs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeProjects = trainingProjects.filter((p) => p.status === 'training');
  const pausedProjects = trainingProjects.filter((p) => p.status === 'paused');

  // 实时诊断：当参数变化时自动分析可行性
  // 每次渲染重算以确保卡状态变化后诊断同步更新
  const diagnosis = selectedClusterId
    ? diagnoseTraining(
        paramCount, contextLength,
        selectedArchs.has('moe') ? 'moe' : 'transformer',
        selectedClusterId, game.state,
      )
    : [];

  const blockers = diagnosis.filter((d) => d.severity === 'blocker');
  const warnings = diagnosis.filter((d) => d.severity === 'warning');

  const handleStart = () => {
    const techIds = ['pretraining', ...Array.from(selectedArchs)];
    game.executeCommand(
      new StartTrainingCommand(
        modelName,
        paramCount,
        selectedArchs.has('moe') ? 'moe' : 'transformer',
        selectedClusterId,
        undefined,
        contextLength,
        selectedDatasetId,
        techIds,
        false,
      ),
    );
  };

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>启动训练</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>模型名</span>
        <input
          className={styles.input}
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          style={{ width: '100px' }}
        />
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>参数量</span>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={paramCount}
          onChange={(e) => setParamCount(Number(e.target.value))}
          style={{ width: '50px' }}
        />
        <span className={styles.devHint}>B</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>上下文</span>
        <input
          className={styles.input}
          type="number"
          min={512}
          step={1024}
          value={contextLength}
          onChange={(e) => setContextLength(Number(e.target.value))}
          style={{ width: '80px' }}
        />
        <span className={styles.devHint}>tokens</span>
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
              {c.name} ({c.nodes.length}节点 · {c.networkBandwidth}GB/s · TP×{c.maxTPDegree})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>数据集</span>
        <select
          className={styles.select}
          value={selectedDatasetId}
          onChange={(e) => setSelectedDatasetId(e.target.value)}
        >
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.totalTokens.toFixed(0)}B tokens · 有效{d.effectiveTokens.toFixed(0)}B)
            </option>
          ))}
        </select>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>所需算力</span>
        <span className={styles.devHint}>
          {selectedDataset
            ? `${computeTotal.toFixed(0)} TFLOPS·天（Chinchilla: 6×${paramCount}B×${selectedDataset.totalTokens.toFixed(1)}Btokens×长序列修正）`
            : '请先选择数据集'}
        </span>
      </div>

      {archTechs.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>架构技术</span>
          </div>
          {archTechs.map((t) => (
            <label key={t.id} className={styles.devRow} style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedArchs.has(t.id)}
                onChange={() => toggleArch(t.id)}
                style={{ marginRight: '6px' }}
              />
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                {t.name}
              </span>
              <span className={styles.devHint}>{t.description}</span>
            </label>
          ))}
        </>
      )}

      <div className={styles.devRow}>
        <button
          className={styles.btn}
          disabled={!modelName || !selectedClusterId || blockers.length > 0}
          onClick={handleStart}
        >
          开始训练
        </button>
      </div>

      {/* 训练可行性诊断 */}
      {diagnosis.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ color: blockers.length > 0 ? '#ff6b6b' : '#ffb454' }}>
              训练诊断 {blockers.length > 0 ? '（存在阻塞项）' : `（${warnings.length} 条提示）`}
            </span>
          </div>
          {blockers.map((d, i) => (
            <div key={`blocker-${i}`} className={styles.devRow}>
              <span className={styles.devHint} style={{ color: '#ff6b6b' }}>
                ❌ {d.message}
              </span>
            </div>
          ))}
          {warnings.map((d, i) => (
            <div key={`warn-${i}`} className={styles.devRow}>
              <span className={styles.devHint} style={{ color: '#ffb454' }}>
                ⚠️ {d.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 训练中项目 */}
      {activeProjects.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>训练中 ({activeProjects.length})</span>
          </div>
          {activeProjects.map((p) => {
            const progress = ((p.computeTotal - p.computeRemaining) / p.computeTotal) * 100;
            const phaseNames: Record<string, string> = {
              warmup: '预热', main: '主训练', decay: '衰减',
            };
            const phaseColors: Record<string, string> = {
              warmup: '#ffb454', main: '#5cb85c', decay: '#7ab8e0',
            };
            const stabilityColor = p.stabilityScore > 0.8 ? '#5cb85c' :
              p.stabilityScore > 0.5 ? '#ffb454' : '#ff6b6b';
            return (
              <div key={p.id}>
                <div className={styles.devRow}>
                  <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                    · {p.modelName} ({p.paramCount}B · {p.contextLength}ctx)
                  </span>
                  <span className={styles.devHint}>
                    {progress.toFixed(1)}% · 剩余 {p.computeRemaining.toFixed(0)} TFLOPS·天
                    {p.lostFlops > 0 && ` · 损失 ${p.lostFlops.toFixed(0)}`}
                  </span>
                  <button
                    className={styles.btn}
                    onClick={() => game.executeCommand(new CancelTrainingCommand(p.id))}
                  >
                    取消
                  </button>
                </div>
                <div className={styles.devRow}>
                  <span className={styles.devHint} style={{ minWidth: '120px' }}>
                    阶段: <span style={{ color: phaseColors[p.trainingPhase] }}>{phaseNames[p.trainingPhase]}</span>
                  </span>
                  <span className={styles.devHint}>
                    损失: {p.currentLoss.toFixed(3)} (验证 {p.validationLoss.toFixed(3)})
                  </span>
                  <span className={styles.devHint} style={{ color: stabilityColor }}>
                    稳定度: {(p.stabilityScore * 100).toFixed(0)}%
                  </span>
                </div>
                {/* 损失曲线迷你图 */}
                {p.lossHistory.length > 1 && (
                  <div className={styles.devRow}>
                    <span className={styles.devHint} style={{ minWidth: '120px' }}>损失曲线</span>
                    <LossSparkline history={p.lossHistory} />
                  </div>
                )}
                {/* 事件统计 */}
                {(p.lossSpikeCount > 0 || p.gradientExplosionCount > 0) && (
                  <div className={styles.devRow}>
                    <span className={styles.devHint} style={{ minWidth: '120px' }}>事件统计</span>
                    <span className={styles.devHint} style={{ color: '#ffb454' }}>
                      尖峰×{p.lossSpikeCount}
                    </span>
                    <span className={styles.devHint} style={{ color: '#ff6b6b' }}>
                      爆炸×{p.gradientExplosionCount}
                    </span>
                  </div>
                )}
                {/* 最近训练日志 */}
                {p.trainingLog.length > 0 && (
                  <div className={styles.devRow}>
                    <span className={styles.devHint} style={{ minWidth: '120px' }}>最近事件</span>
                    <span className={styles.devHint} style={{ flex: 1 }}>
                      {p.trainingLog.slice(-3).map((log) => (
                        <span
                          key={`${log.day}-${log.event}`}
                          style={{
                            display: 'block',
                            color: log.severity === 'critical' ? '#ff6b6b' :
                              log.severity === 'warning' ? '#ffb454' : '#888',
                          }}
                        >
                          第{log.day}天: {log.event}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* 暂停项目 */}
      {pausedProjects.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>已暂停 ({pausedProjects.length})</span>
          </div>
          {pausedProjects.map((p) => (
            <div key={p.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · {p.modelName} ({p.pauseReason})
              </span>
              <button
                className={styles.btn}
                onClick={() => game.executeCommand(new CancelTrainingCommand(p.id))}
              >
                取消
              </button>
            </div>
          ))}
        </>
      )}

      {trainingProjects.length === 0 && (
        <div className={styles.emptyHint}>尚无训练项目，请先创建集群并安装显卡</div>
      )}
    </div>
  );
}

/* ============== 损失曲线迷你图 ============== */

function LossSparkline({
  history,
}: {
  history: Array<{ day: number; progress: number; loss: number; valLoss: number }>;
}) {
  if (history.length < 2) return null;

  // 采样：最多40个点
  const maxPoints = 40;
  const step = Math.max(1, Math.floor(history.length / maxPoints));
  const sampled = history.filter((_, i) => i % step === 0);
  if (sampled[sampled.length - 1] !== history[history.length - 1]) {
    sampled.push(history[history.length - 1]);
  }

  const allLosses = sampled.flatMap((h) => [h.loss, h.valLoss]);
  const minLoss = Math.min(...allLosses);
  const maxLoss = Math.max(...allLosses);
  const range = Math.max(maxLoss - minLoss, 0.01);

  const width = 200;
  const height = 40;

  const toPath = (key: 'loss' | 'valLoss') => {
    return sampled
      .map((h, i) => {
        const x = (i / (sampled.length - 1)) * width;
        const y = height - ((h[key] - minLoss) / range) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <svg width={width} height={height} style={{ verticalAlign: 'middle' }}>
      <path d={toPath('loss')} fill="none" stroke="#5cb85c" strokeWidth="1.5" />
      <path d={toPath('valLoss')} fill="none" stroke="#7ab8e0" strokeWidth="1" strokeDasharray="2,1" />
      <text x={2} y={10} fill="#888" fontSize="9">
        {maxLoss.toFixed(1)}
      </text>
      <text x={2} y={height - 2} fill="#888" fontSize="9">
        {minLoss.toFixed(1)}
      </text>
    </svg>
  );
}

/* ============== 模型标签 ============== */

function ModelsTab() {
  const models = useGameState((s) => s.models);
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  if (models.length === 0) {
    return <div className={styles.emptyHint}>尚无已完成模型，请在"训练"标签启动训练</div>;
  }

  const selectedModel = models.find((m) => m.id === selectedModelId) ?? models[models.length - 1];

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>模型列表 ({models.length})</span>
        <select
          className={styles.select}
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          <option value="">选择模型...</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.paramCount}B · 第{m.completedAt}天)
            </option>
          ))}
        </select>
      </div>

      {selectedModel && <ModelDetail model={selectedModel} />}
    </div>
  );
}

function ModelDetail({ model }: { model: Model }) {
  // 生成带噪声的观测值
  const observed = observeCapabilities(model, model.noiseSeed);

  return (
    <>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>{model.name}</span>
        <span className={styles.devHint}>
          {model.paramCount}B · {model.architecture} · ctx {model.contextLength} · 基础分 {model.baseScore.toFixed(1)}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>显性能力（benchmark 观测）</span>
      </div>
      {CAPABILITIES.filter((c) => c.visible).map((cap) => {
        const val = observed[cap.id];
        const sigma = calcNoiseSigma(cap, model.evaluationResearchers, model.daysSincePublished);
        const isEmerged = model.rawCapabilities[cap.id] >= cap.emergenceThreshold;
        return (
          <div key={cap.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {cap.name}{cap.inverse ? ' ↓' : ''}
            </span>
            <span className={styles.devHint} style={{
              color: isEmerged ? '#e6f0ff' : '#888',
            }}>
              {val.toFixed(1)} ±{sigma.toFixed(0)}
              {!isEmerged && ' (未涌现)'}
            </span>
          </div>
        );
      })}

      <div className={styles.devRow} style={{ marginTop: '8px' }}>
        <span className={styles.devRowLabel}>隐性能力（需深度评估）</span>
        <span className={styles.devHint}>
          评估员 {model.evaluationResearchers} 人
        </span>
      </div>
      {CAPABILITIES.filter((c) => !c.visible).map((cap) => {
        const val = observed[cap.id];
        const sigma = calcNoiseSigma(cap, model.evaluationResearchers, model.daysSincePublished);
        const isEmerged = model.rawCapabilities[cap.id] >= cap.emergenceThreshold;
        return (
          <div key={cap.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {cap.name}{cap.inverse ? ' ↓' : ''}
            </span>
            <span className={styles.devHint} style={{
              color: isEmerged ? '#b8c9e0' : '#666',
            }}>
              {val.toFixed(1)} ±{sigma.toFixed(0)}
              {!isEmerged && ' (未涌现)'}
            </span>
          </div>
        );
      })}
    </>
  );
}

/* ============== 数据管理标签 ============== */

function DataTab() {
  const game = useGame();
  const datasets = useGameState((s) => s.datasets);
  const unlockedTechs = useGameState((s) => s.unlockedTechs);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const cooldowns = useGameState((s) => s.dataAcquisitionCooldowns);
  const date = useGameState((s) => s.date);
  const models = useGameState((s) => s.models);
  const employees = useGameState((s) => s.employees);
  const normalDataEngineers = useGameState((s) => s.resources[ROLE_TO_STAFF_RESOURCE[StaffRole.DATA_ENGINEER]] ?? 0);
  const collectionProjects = useGameState((s) => s.dataCollectionProjects);

  const [selectedDatasetId] = useState<string>(datasets[0]?.id ?? '');
  const [synthModelId, setSynthModelId] = useState<string>('');
  const [synthDomain, setSynthDomain] = useState<string>('code');
  const [synthAmount, setSynthAmount] = useState<number>(5);

  // 新建收集任务状态
  const [selectedRoute, setSelectedRoute] = useState<string>(COLLECTION_ROUTES[0].id);
  const [normalCount, setNormalCount] = useState<number>(0);
  const [selectedCoreEngineers, setSelectedCoreEngineers] = useState<Set<string>>(new Set());

  const dataset = datasets.find((d) => d.id === selectedDatasetId) ?? datasets[0];
  const coreDataEngineers = employees.filter(
    (e) => e.role === StaffRole.DATA_ENGINEER && e.status === 'idle',
  );

  const toggleCoreEngineer = (id: string) => {
    setSelectedCoreEngineers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartCollection = () => {
    game.executeCommand(
      new StartDataCollectionCommand(
        selectedRoute,
        Array.from(selectedCoreEngineers),
        normalCount,
        selectedDatasetId,
      ),
    );
    setSelectedCoreEngineers(new Set());
    setNormalCount(0);
  };

  // 预估日产量和质量
  const route = COLLECTION_MAP[selectedRoute as keyof typeof COLLECTION_MAP];
  const previewRate = route ? calcCollectionRate(normalCount, selectedCoreEngineers.size, route) : 0;
  const previewQuality = route ? calcCollectionQuality(selectedCoreEngineers.size, route) : 0;

  return (
    <div className={styles.tabBody}>
      {/* 数据集概览 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>数据集: {dataset?.name ?? '无'}</span>
        <span className={styles.devHint}>
          总量 {dataset?.totalTokens.toFixed(0)}B · 有效 {dataset?.effectiveTokens.toFixed(0)}B
        </span>
      </div>

      {/* 各领域详情 */}
      {dataset && Object.values(dataset.domains).filter((d) => d.tokens > 0).map((domain) => (
        <div key={domain.id} className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
            · {domain.id}
          </span>
          <span className={styles.devHint}>
            {domain.tokens.toFixed(1)}B · 质量{(domain.quality * 100).toFixed(0)}% · 重复{(domain.duplication * 100).toFixed(0)}%
          </span>
        </div>
      ))}

      {/* ===== 自收集任务 ===== */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>自收集任务</span>
        <span className={styles.devHint}>
          普通工程师 {normalDataEngineers} 人可用
        </span>
      </div>

      {/* 进行中的收集任务 */}
      {collectionProjects.filter((p) => p.status === 'active').map((p) => {
        const r = COLLECTION_MAP[p.routeId as keyof typeof COLLECTION_MAP];
        return (
          <div key={p.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {r?.name ?? p.routeId}
            </span>
            <span className={styles.devHint}>
              {p.dailyRate.toFixed(2)}B/天 · 质量{(p.currentQuality * 100).toFixed(0)}%
              · 已收 {p.collectedTokens.toFixed(1)}B · 核心{p.engineerIds.length}人
            </span>
            <button
              className={styles.btn}
              onClick={() => game.executeCommand(new StopDataCollectionCommand(p.id))}
            >
              停止
            </button>
          </div>
        );
      })}

      {/* 新建收集任务 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>收集路线</span>
        <select
          className={styles.select}
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
        >
          {COLLECTION_ROUTES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.baseRate}B/人/天 · 质量{(r.baseQuality * 100).toFixed(0)}-{(r.qualityCap * 100).toFixed(0)}%)
              {r.requiredTech && !unlockedTechs.includes(r.requiredTech) ? ' [需技术]' : ''}
            </option>
          ))}
        </select>
      </div>

      {route && (
        <div className={styles.devRow}>
          <span className={styles.devHint}>
            {route.description} · 运营${route.dailyCost}/天 · 领域: {route.targetDomains.join(', ')}
          </span>
        </div>
      )}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>普通工程师</span>
        <input
          type="number"
          className={styles.input}
          style={{ width: '60px' }}
          value={normalCount}
          onChange={(e) => setNormalCount(Math.max(0, Math.min(normalDataEngineers, Number(e.target.value) || 0)))}
          min={0}
          max={normalDataEngineers}
        />
        <span className={styles.devHint}>人 (可用 {normalDataEngineers})</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>核心工程师 ({selectedCoreEngineers.size})</span>
      </div>
      {coreDataEngineers.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>无空闲核心数据工程师</div>
      ) : (
        coreDataEngineers.map((emp) => (
          <div key={emp.id} className={styles.devRow}>
            <button
              className={`${styles.btn} ${selectedCoreEngineers.has(emp.id) ? styles.btnActive : ''}`}
              onClick={() => toggleCoreEngineer(emp.id)}
            >
              {selectedCoreEngineers.has(emp.id) ? '✓ ' : ''}
              {emp.name} (Lv{emp.level} · 智力{emp.attributes.intelligence})
            </button>
          </div>
        ))
      )}

      {/* 预估 */}
      {(normalCount > 0 || selectedCoreEngineers.size > 0) && (
        <div className={styles.devRow}>
          <span className={styles.devHint}>
            预估: {previewRate.toFixed(2)}B/天 · 质量{(previewQuality * 100).toFixed(0)}%
            · 成本${route?.dailyCost ?? 0}/天
          </span>
        </div>
      )}

      <div className={styles.devRow}>
        <button
          className={styles.btn}
          style={{ opacity: (normalCount === 0 && selectedCoreEngineers.size === 0) ? 0.5 : 1 }}
          disabled={normalCount === 0 && selectedCoreEngineers.size === 0}
          onClick={handleStartCollection}
        >
          启动收集
        </button>
      </div>

      {/* ===== 购买数据 ===== */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>购买数据</span>
      </div>
      {PURCHASE_ROUTES.map((route) => {
        const lastUsed = cooldowns[route.id] ?? -999;
        const remaining = route.cooldownDays - (date - lastUsed);
        const onCooldown = remaining > 0;
        const techLocked = !!(route.requiredTech && !unlockedTechs.includes(route.requiredTech));
        const tooExpensive = funds < route.cost;

        return (
          <div key={route.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {route.name}
              {route.isGrey && ' ⚠️灰色'}
            </span>
            <span className={styles.devHint}>
              ${route.cost.toLocaleString()} · {route.tokensProduced}B · 质量{(route.quality * 100).toFixed(0)}%
              {onCooldown && ` · 冷却${remaining}天`}
            </span>
            <button
              className={styles.btn}
              style={{ opacity: (techLocked || onCooldown || tooExpensive) ? 0.5 : 1 }}
              disabled={techLocked || onCooldown || tooExpensive}
              onClick={() => game.executeCommand(new AcquireDataCommand(route.id, selectedDatasetId))}
            >
              购买
            </button>
          </div>
        );
      })}

      {/* 合成数据 */}
      {unlockedTechs.includes('distillation') && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>合成数据</span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>源模型</span>
            <select
              className={styles.select}
              value={synthModelId}
              onChange={(e) => setSynthModelId(e.target.value)}
            >
              <option value="">选择模型</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.paramCount}B)</option>
              ))}
            </select>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>目标领域</span>
            <select
              className={styles.select}
              value={synthDomain}
              onChange={(e) => setSynthDomain(e.target.value)}
            >
              <option value="code">code</option>
              <option value="synthetic">synthetic</option>
              <option value="dialogue">dialogue</option>
            </select>
            <span className={styles.devRowLabel} style={{ minWidth: '60px' }}>数量</span>
            <input
              type="number"
              className={styles.input}
              style={{ width: '60px' }}
              value={synthAmount}
              onChange={(e) => setSynthAmount(Number(e.target.value) || 5)}
              min={1}
            />
            <span className={styles.devHint}>B</span>
          </div>
          <div className={styles.devRow}>
            <button
              className={styles.btn}
              style={{ opacity: (!synthModelId) ? 0.5 : 1 }}
              disabled={!synthModelId}
              onClick={() => game.executeCommand(
                new SynthesizeDataCommand(synthModelId, synthDomain, synthAmount, selectedDatasetId),
              )}
            >
              合成
            </button>
          </div>
        </>
      )}
    </div>
  );
}
