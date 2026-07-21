import { useState, useMemo } from 'react';
import { useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { StartTrainingCommand, CancelTrainingCommand, ReallocateTrainingCardsCommand } from '../../core/commands/TrainingCommands';
import { PublishModelCommand, UnpublishModelCommand, SetModelResearchUsageCommand } from '../../core/commands/PublishModelCommand';
import {
  AcquireDataCommand,
  SynthesizeDataCommand,
  StartDataCollectionCommand,
  StopDataCollectionCommand,
  CreateDatasetCommand,
  DeleteDatasetCommand,
} from '../../core/commands/DataCommands';
import {
  PurgeDatasetCommand,
  DedupDatasetCommand,
  CurateDatasetCommand,
} from '../../core/commands/DataOperationCommands';
import { DistillCompetitorCommand } from '../../core/commands/DistillCompetitorCommand';
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
import { getDaysSincePublished } from '../../core/entities/Model';
import { countOnlineCardsByNode } from '../../core/utils/cardAggregate';
import type { Model, PostTrainingStage } from '../../core/entities/Model';
import { useFormatDate } from '../hooks/useFormatDate';
import styles from '../styles/App.module.css';

type ModelTab = 'training' | 'models' | 'data' | 'distill' | 'posttrain';

const MODEL_TABS: { key: ModelTab; label: string; icon: string }[] = [
  { key: 'training', label: '训练', icon: '🎯' },
  { key: 'models', label: '模型', icon: '🧠' },
  { key: 'data', label: '数据', icon: '📊' },
  { key: 'distill', label: '蒸馏', icon: '⚗️' },
  { key: 'posttrain', label: '后训练', icon: '🔧' },
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

      {/* ★ UI-1 修复：display:none → 条件渲染，隐藏 tab 自动卸载订阅 */}
      {tab === 'training' && <TrainingTab />}
      {tab === 'models' && <ModelsTab />}
      {tab === 'data' && <DataTab />}
      {tab === 'distill' && <DistillTab />}
      {tab === 'posttrain' && <PostTrainingTab />}
    </section>
  );
}

/* ============== 训练标签 ============== */

function TrainingTab() {
  const game = useGame();
  const clusters = useGameState((s) => s.clusters);
  const datasets = useGameState((s) => s.datasets);
  const trainingProjects = useGameState((s) => s.trainingProjects);
  const techMaturity = useGameState((s) => s.techMaturity);
  // ★ U6 修复：原订阅 s.serverNodes + s.resourceMeta 整个对象引用，
  //   任意卡状态变化（故障/恢复/安装）都触发 TrainingTab 重渲染 + diagnosis 重算。
  //   改为订阅派生字符串，仅捕获选中集群的卡状态摘要（online/total/节点数/utilizationBonus），
  //   其他集群的卡变化不再触发重渲染。clusters 保留订阅（下拉列表需要）。
  const formatDay = useFormatDate();

  const [modelName, setModelName] = useState('GPT-7B');
  const [paramCount, setParamCount] = useState(7);
  const [contextLength, setContextLength] = useState(4096);
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('dataset-initial');

  // ★ P1-9 修复：useState 派生值不随数据更新，数据集被删后下拉仍指向已删 id
  useEffect(() => {
    if (selectedDatasetId && !datasets.some((d) => d.id === selectedDatasetId)) {
      setSelectedDatasetId(datasets[0]?.id ?? '');
    }
  }, [datasets, selectedDatasetId]);
  // 同步 clusterId：未选或选中已不存在的 cluster
  useEffect(() => {
    if (selectedClusterId && !clusters.some((c) => c.id === selectedClusterId)) {
      setSelectedClusterId(clusters[0]?.id ?? '');
    }
  }, [clusters, selectedClusterId]);

  // 根据 Chinchilla 缩放定律自动计算训练所需算力
  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);
  const computeTotal = calcTrainingCompute(
    paramCount * 1e9,
    (selectedDataset?.totalTokens ?? 1) * 1e9,
    contextLength,
  );

  // 选择已解锁的架构技术
  const archTechs = ALL_TECH.filter(
    (t) => t.isArchitecture && (techMaturity[t.id] ?? 0) >= 1,
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

  // ★ U6 修复 + 性能优化：派生字符串捕获选中集群的状态摘要。
  //   仅在选中集群的卡数/在线数/节点数/utilizationBonus 变化时才变化。
  //   ★ 性能：用聚合桶 O(桶数) 统计替代 O(卡数) 的 UID 遍历，10万卡场景从 ~50ms 降至 <1ms
  const clusterStateKey = useGameState((s) => {
    if (!selectedClusterId) return '';
    const cluster = s.clusters.find((c) => c.id === selectedClusterId);
    if (!cluster) return '';
    const nodeIdSet = new Set(cluster.nodes);
    const onlineByNode = countOnlineCardsByNode(s.resourceMeta, nodeIdSet);
    let key = `${cluster.utilizationBonus}|${cluster.networkTopology}|${cluster.nodes.length}`;
    for (const nodeId of cluster.nodes) {
      const node = s.serverNodes.find((n) => n.id === nodeId);
      const installed = node?.installedCards.length ?? 0;
      const online = onlineByNode.get(nodeId)?.total ?? 0;
      key += `|${nodeId}:${installed}:${online}`;
    }
    return key;
  });

  // 实时诊断：参数或基础设施状态变化时重算
  const arch = selectedArchs.has('moe') ? 'moe' : 'transformer';
  const diagnosis = useMemo(
    () => selectedClusterId
      ? diagnoseTraining(paramCount, contextLength, arch, selectedClusterId, game.state)
      : [],
    // ★ U6 修复：用 clusterStateKey 替代 serverNodes + resourceMeta 依赖，
    //   仅在选中集群状态真正变化时重算 diagnosis，避免无关卡故障触发的级联重算。
    //   clusters 保留依赖（下拉需要 + 集群拓扑变化需重算）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedClusterId, paramCount, contextLength, arch, clusters, clusterStateKey, game.state],
  );

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
                  {/* 设计-9：运行中动态调整算力，无需取消重训 */}
                  <button
                    className={styles.btn}
                    title="从同一集群追加空闲在线卡"
                    onClick={() => game.executeCommand(new ReallocateTrainingCardsCommand(p.id, 1))}
                  >
                    +卡
                  </button>
                  <button
                    className={styles.btn}
                    title="释放部分已分配卡（至少保留 1 张）"
                    onClick={() => game.executeCommand(new ReallocateTrainingCardsCommand(p.id, -1))}
                  >
                    -卡
                  </button>
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
                          {formatDay(log.day)}: {log.event}
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
              {/* 设计-9：暂停时也可调整算力，便于恢复前补卡 */}
              <button
                className={styles.btn}
                title="从同一集群追加空闲在线卡"
                onClick={() => game.executeCommand(new ReallocateTrainingCardsCommand(p.id, 1))}
              >
                +卡
              </button>
              <button
                className={styles.btn}
                title="释放部分已分配卡（至少保留 1 张）"
                onClick={() => game.executeCommand(new ReallocateTrainingCardsCommand(p.id, -1))}
              >
                -卡
              </button>
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
  const today = useGameState((s) => s.date);
  const game = useGame();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const formatDay = useFormatDate();

  if (models.length === 0) {
    return <div className={styles.emptyHint}>尚无已完成模型，请在"训练"标签启动训练</div>;
  }

  const selectedModel = models.find((m) => m.id === selectedModelId) ?? models[models.length - 1];
  const publishedCount = models.filter((m) => m.published).length;

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>模型列表 ({models.length} · 已发布 {publishedCount})</span>
        <select
          className={styles.select}
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          <option value="">选择模型...</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.paramCount}B · {formatDay(m.completedAt)}){m.published ? ' ✓已发布' : ' ⏳未发布'}
            </option>
          ))}
        </select>
      </div>

      {selectedModel && (
        <>
          <ModelDetail model={selectedModel} />
          {/* ★ 设计 #5：发布按钮 */}
          <div className={styles.devRow} style={{ marginTop: '8px' }}>
            <span className={styles.devRowLabel}>市场发布</span>
            {selectedModel.published ? (
              <>
                <span className={styles.devHint} style={{ color: '#5cb85c' }}>
                  ✓ 已发布 {getDaysSincePublished(selectedModel, today)} 天 · 正在产生市场收入与 Token 收入
                </span>
                <button
                  className={`${styles.btn} ${styles.btnWarn}`}
                  onClick={() => game.executeCommand(new UnpublishModelCommand(selectedModel.id))}
                >
                  下架
                </button>
              </>
            ) : (
              <>
                <span className={styles.devHint} style={{ color: '#ff9800' }}>
                  未发布 · 训练完成但未上线，无法产生市场收入
                </span>
                <button
                  className={styles.btn}
                  onClick={() => game.executeCommand(new PublishModelCommand(selectedModel.id))}
                >
                  发布到市场
                </button>
              </>
            )}
          </div>
          {/* ★ 设计-22：内部研发参与开关（控制 AI 对齐风险） */}
          <div className={styles.devRow} style={{ marginTop: '4px' }}>
            <span className={styles.devRowLabel}>内部研发</span>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={selectedModel.usedInResearch}
                onChange={(e) =>
                  game.executeCommand(new SetModelResearchUsageCommand(selectedModel.id, e.target.checked))
                }
              />
              <span className={styles.devHint}>
                {selectedModel.usedInResearch
                  ? (selectedModel.audited ? '已审计 · 安全参与' : '⚠️ 未审计 · 触发AI对齐风险')
                  : '已禁用 · 不参与研发'}
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

function ModelDetail({ model }: { model: Model }) {
  const today = useGameState((s) => s.date);
  // ★ I2 修复：用派生值替代 model.daysSincePublished（每日 ++ 已移除）
  const daysSincePublished = getDaysSincePublished(model, today);
  // 生成带噪声的观测值（observeCapabilities 接收鸭子类型 model 对象，需含 daysSincePublished 字段）
  const observed = observeCapabilities(
    { ...model, daysSincePublished },
    model.noiseSeed,
  );

  return (
    <>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>{model.name}</span>
        <span className={styles.devHint}>
          {model.paramCount}B · {model.architecture} · ctx {model.contextLength} · 基础分 {model.baseScore.toFixed(1)} · {model.published ? '已发布' : '未发布'}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>显性能力（benchmark 观测）</span>
      </div>
      {CAPABILITIES.filter((c) => c.visible).map((cap) => {
        const val = observed[cap.id];
        const sigma = calcNoiseSigma(cap, model.evaluationResearchers, daysSincePublished);
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
        const sigma = calcNoiseSigma(cap, model.evaluationResearchers, daysSincePublished);
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
  const techMaturity = useGameState((s) => s.techMaturity);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const cooldowns = useGameState((s) => s.dataAcquisitionCooldowns);
  const date = useGameState((s) => s.date);
  const models = useGameState((s) => s.models);
  const employees = useGameState((s) => s.employees);
  const normalDataEngineers = useGameState((s) => s.resources[ROLE_TO_STAFF_RESOURCE[StaffRole.DATA_ENGINEER]] ?? 0);
  const collectionProjects = useGameState((s) => s.dataCollectionProjects);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id ?? '');
  const [synthModelId, setSynthModelId] = useState<string>('');
  const [synthDomain, setSynthDomain] = useState<string>('code');
  const [synthAmount, setSynthAmount] = useState<number>(5);
  const [newDatasetName, setNewDatasetName] = useState<string>('');

  // ★ P1-9 修复：同步 selectedDatasetId 派生值
  useEffect(() => {
    if (selectedDatasetId && !datasets.some((d) => d.id === selectedDatasetId)) {
      setSelectedDatasetId(datasets[0]?.id ?? '');
    }
  }, [datasets, selectedDatasetId]);
  // 同步 synthModelId
  useEffect(() => {
    if (synthModelId && !models.some((m) => m.id === synthModelId)) {
      setSynthModelId(models[0]?.id ?? '');
    }
  }, [models, synthModelId]);

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
      {/* 数据集选择与管理 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>数据集</span>
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
        {dataset && dataset.id !== 'dataset-initial' && (
          <button
            className={`${styles.btn} ${styles.btnSm} ${styles.btnWarn}`}
            onClick={() => game.executeCommand(new DeleteDatasetCommand(dataset.id))}
          >
            删除
          </button>
        )}
      </div>

      {/* 新建数据集 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>新建数据集</span>
        <input
          className={styles.input}
          value={newDatasetName}
          onChange={(e) => setNewDatasetName(e.target.value)}
          placeholder="输入数据集名称"
          style={{ width: '180px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newDatasetName.trim()) {
              game.executeCommand(new CreateDatasetCommand(newDatasetName));
              setNewDatasetName('');
            }
          }}
        />
        <button
          className={styles.btn}
          disabled={!newDatasetName.trim()}
          onClick={() => {
            game.executeCommand(new CreateDatasetCommand(newDatasetName));
            setNewDatasetName('');
          }}
        >
          创建
        </button>
      </div>

      {/* 数据集概览 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>概览: {dataset?.name ?? '无'}</span>
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
              {r.requiredTech && (techMaturity[r.requiredTech] ?? 0) < 1 ? ' [需技术]' : ''}
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
        const techLocked = !!(route.requiredTech && (techMaturity[route.requiredTech] ?? 0) < 1);
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
      {(techMaturity['distillation'] ?? 0) >= 1 && (
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

      {/* ===== 数据操作（清洗/去重/精选） ===== */}
      {(techMaturity['data_cleaning_v1'] ?? 0) >= 1 && (
        <DataOperationsSection dataset={dataset} selectedDatasetId={selectedDatasetId} />
      )}
    </div>
  );
}

/** 数据操作子组件（展示在 DataTab 中） */
function DataOperationsSection({ dataset, selectedDatasetId }: { dataset: any; selectedDatasetId: string }) {
  const game = useGame();
  const date = useGameState((s) => s.date);
  const techMaturity = useGameState((s) => s.techMaturity);
  const cooldowns = useGameState((s) => s.dataAcquisitionCooldowns);

  const purgeMat = techMaturity['data_cleaning_v1'] ?? 0;
  const dedupMat = techMaturity['data_deduplication'] ?? 0;
  const curateMat = techMaturity['data_curation'] ?? 0;

  const [purgeDomain, setPurgeDomain] = useState<string>('');
  const [curateDomain, setCurateDomain] = useState<string>('');

  const hasAnyDataOp = purgeMat >= 1 || dedupMat >= 1 || curateMat >= 1;
  if (!hasAnyDataOp) return null;

  return (
    <>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>数据操作</span>
      </div>

      {/* 数据清洗 */}
      {purgeMat >= 1 && dataset && (
        <div className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>
            数据清洗
          </span>
          <select
            className={styles.select}
            value={purgeDomain}
            onChange={(e) => setPurgeDomain(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="">选择领域</option>
            {Object.values(dataset.domains as Record<string, { id: string; tokens: number }>)
              .filter((d: any) => d.tokens > 0)
              .map((d: any) => (
                <option key={d.id} value={d.id}>{d.id} ({d.tokens.toFixed(1)}B)</option>
              ))}
          </select>
          <button
            className={styles.btn}
            style={{ opacity: purgeDomain ? 1 : 0.5 }}
            disabled={!purgeDomain}
            onClick={() => {
              game.executeCommand(new PurgeDatasetCommand(selectedDatasetId, purgeDomain as any));
              setPurgeDomain('');
            }}
          >
            清洗
          </button>
          <span className={styles.devHint}>
          {(() => {
            const lastPurge = cooldowns['purge_' + selectedDatasetId] ?? -999;
            const remaining = 30 - (date - lastPurge);
            const onCooldown = remaining > 0;
            const matScale = purgeMat / 100;
            const purgeRatio = (0.15 * matScale * 100).toFixed(0);
            const qualityGain = (0.10 * matScale * 100).toFixed(0);
            return onCooldown
              ? `冷却 ${remaining} 天`
              : `移除 ${purgeRatio}% tokens · 质量+${qualityGain}%`;
          })()}
          </span>
        </div>
      )}

      {/* 数据去重 */}
      {dedupMat >= 1 && dataset && (
        <div className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>
            数据去重
          </span>
          <button
            className={styles.btn}
            onClick={() => game.executeCommand(new DedupDatasetCommand(selectedDatasetId))}
          >
            去重
          </button>
          <span className={styles.devHint}>
          {(() => {
            const lastDedup = cooldowns['dedup_' + selectedDatasetId] ?? -999;
            const remaining = 60 - (date - lastDedup);
            const onCooldown = remaining > 0;
            const matScale = dedupMat / 100;
            const reduction = (0.20 * matScale * 100).toFixed(0);
            return onCooldown
              ? `冷却 ${remaining} 天`
              : `重复度 -${reduction}%`;
          })()}
          </span>
        </div>
      )}

      {/* 数据精选 */}
      {curateMat >= 1 && dataset && (
        <div className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>
            数据精选
          </span>
          <select
            className={styles.select}
            value={curateDomain}
            onChange={(e) => setCurateDomain(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="">选择目标领域</option>
            {Object.values(dataset.domains as Record<string, { id: string; tokens: number }>)
              .filter((d: any) => d.tokens > 0)
              .map((d: any) => (
                <option key={d.id} value={d.id}>{d.id} ({d.tokens.toFixed(1)}B)</option>
              ))}
          </select>
          <button
            className={styles.btn}
            style={{ opacity: curateDomain ? 1 : 0.5 }}
            disabled={!curateDomain}
            onClick={() => {
              game.executeCommand(new CurateDatasetCommand(selectedDatasetId, curateDomain as any));
              setCurateDomain('');
            }}
          >
            精选
          </button>
          <span className={styles.devHint}>
          {(() => {
            const lastCurate = cooldowns['curate_' + selectedDatasetId] ?? -999;
            const remaining = 45 - (date - lastCurate);
            const onCooldown = remaining > 0;
            const matScale = curateMat / 100;
            const qualityGain = (0.15 * matScale * 100).toFixed(0);
            return onCooldown
              ? `冷却 ${remaining} 天`
              : `目标域质量+${qualityGain}% · 其他域 -5% tokens`;
          })()}
          </span>
        </div>
      )}
    </>
  );
}

/* ============== 蒸馏标签 ============== */

function DistillTab() {
  const game = useGame();
  const techMaturity = useGameState((s) => s.techMaturity);
  const competitorStates = useGameState((s) => s.competitorStates);
  const date = useGameState((s) => s.date);
  const cooldowns = useGameState((s) => s.dataAcquisitionCooldowns);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const formatDay = useFormatDate();

  const distillMat = techMaturity['distillation'] ?? 0;
  const lastDistill = cooldowns?.['distill'] ?? -999;
  const cooldownRemaining = 90 - (date - lastDistill);
  const onCooldown = cooldownRemaining > 0;

  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(-1);
  const [studentName, setStudentName] = useState<string>('');

  if (distillMat < 1) {
    return (
      <div className={styles.tabBody}>
        <div className={styles.devRow}>
          <span className={styles.devHint}>未解锁蒸馏技术（需 distillation 技术成熟度 ≥ 1）</span>
        </div>
      </div>
    );
  }

  const matScale = distillMat / 100;
  const distillEfficiency = Math.min(0.95, 0.70 * matScale);

  const compsWithModels = competitorStates.filter((c) => c.releasedModels.length > 0);
  const selectedComp = compsWithModels.find((c) => c.id === selectedCompId);
  const selectedModel = selectedComp && selectedModelIdx >= 0
    ? selectedComp.releasedModels[selectedModelIdx] : null;

  const studentParams = selectedModel ? Math.max(1, Math.round(selectedModel.paramCount * 0.15)) : 0;
  const fundsCost = selectedModel ? 50000 * selectedModel.paramCount : 0;

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>蒸馏竞品模型</span>
        <span className={styles.devHint}>
          蒸馏效率 {(distillEfficiency * 100).toFixed(0)}% · 学生模型参数量 = 教师 × 15% · 90天冷却
          {onCooldown && <span style={{ color: '#ff6b6b' }}> · 冷却 {cooldownRemaining} 天</span>}
        </span>
      </div>

      {compsWithModels.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>
          暂无已发布模型的竞品公司
        </div>
      ) : (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>竞品公司</span>
            <select
              className={styles.select}
              value={selectedCompId}
              onChange={(e) => { setSelectedCompId(e.target.value); setSelectedModelIdx(-1); }}
            >
              <option value="">选择公司</option>
              {compsWithModels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.releasedModels.length} 个模型)
                </option>
              ))}
            </select>
          </div>

          {selectedComp && (
            <div className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>教师模型</span>
              <select
                className={styles.select}
                value={selectedModelIdx}
                onChange={(e) => setSelectedModelIdx(Number(e.target.value))}
              >
                <option value={-1}>选择模型</option>
                {selectedComp.releasedModels.map((m, i) => (
                  <option key={i} value={i}>
                    {m.name} ({m.paramCount}B · 基准分 {m.baseScore.toFixed(2)} · {formatDay(m.day)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedModel && (
            <>
              <div className={styles.devRow}>
                <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>学生模型名</span>
                <input
                  className={styles.input}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={`${selectedModel.name}-distilled`}
                  style={{ width: '200px' }}
                />
              </div>
              <div className={styles.devHint} style={{ paddingLeft: '4px' }}>
                教师: {selectedModel.name} ({selectedModel.paramCount}B) →
                学生: {studentParams}B · 效率 {(distillEfficiency * 100).toFixed(0)}% · 费用 ${fundsCost.toLocaleString()}
              </div>
              <div className={styles.devRow}>
                <button
                  className={styles.btn}
                  style={{ opacity: (studentName.trim() && !onCooldown && funds >= fundsCost) ? 1 : 0.5 }}
                  disabled={!studentName.trim() || onCooldown || funds < fundsCost}
                  onClick={() => {
                    game.executeCommand(
                      new DistillCompetitorCommand(selectedCompId, selectedModelIdx, studentName),
                    );
                    setStudentName('');
                    setSelectedModelIdx(-1);
                  }}
                >
                  蒸馏
                </button>
                {funds < fundsCost && (
                  <span className={styles.devHint} style={{ color: '#ff6b6b' }}>
                    资金不足（需 ${fundsCost.toLocaleString()}）
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ============== 后训练标签 ============== */

const POST_TRAINING_STAGES = [
  { stage: 'sft' as const, name: 'SFT', desc: '监督微调', unlockTech: 'sft', requires: null as PostTrainingStage | null },
  { stage: 'rlhf' as const, name: 'RLHF', desc: '强化学习人类反馈', unlockTech: 'rlhf', requires: 'sft' as PostTrainingStage },
  { stage: 'dpo' as const, name: 'DPO', desc: '直接偏好优化', unlockTech: 'dpo', requires: 'sft' as PostTrainingStage },
  { stage: 'cot' as const, name: 'CoT', desc: '思维链训练', unlockTech: 'cot_training', requires: 'sft' as PostTrainingStage },
];

function PostTrainingTab() {
  const game = useGame();
  const models = useGameState((s) => s.models);
  const techMaturity = useGameState((s) => s.techMaturity);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  const hasAnyPostTrainingTech = POST_TRAINING_STAGES.some(
    (s) => (techMaturity[s.unlockTech] ?? 0) >= 1,
  );

  if (!hasAnyPostTrainingTech) {
    return (
      <div className={styles.tabBody}>
        <div className={styles.devRow}>
          <span className={styles.devHint}>未解锁任何后训练技术（需 SFT/RLHF/DPO/CoT 技术成熟度 ≥ 1）</span>
        </div>
      </div>
    );
  }

  const trainableModels = models.filter((m) => m.architecture !== 'distilled');

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>后训练阶段</span>
        <span className={styles.devHint}>
          在模型完成预训练后，推进 SFT → RLHF/DPO → CoT 阶段。计算和资金在启动时扣除。
        </span>
      </div>

      {trainableModels.length === 0 ? (
        <div className={styles.devHint} style={{ paddingLeft: '20px' }}>暂无可后训练的模型</div>
      ) : (
        trainableModels.map((model) => {
          const pt = model.postTraining ?? [];
          const completedStages = pt.filter((p) => p.status === 'completed').map((p) => p.stage);
          const inProgress = pt.find((p) => p.status === 'in_progress');
          const pending = pt.find((p) => p.status === 'pending');

          const availableStages = POST_TRAINING_STAGES.filter((stage) => {
            const techMat = techMaturity[stage.unlockTech] ?? 0;
            if (techMat < 1) return false;
            if (completedStages.includes(stage.stage)) return false;
            if (inProgress || pending) return false;
            if (stage.requires && !completedStages.includes(stage.requires)) return false;
            if (stage.stage === 'rlhf' && completedStages.includes('dpo')) return false;
            if (stage.stage === 'dpo' && completedStages.includes('rlhf')) return false;
            return true;
          });

          return (
            <div key={model.id} className={styles.devRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  {model.name} ({model.paramCount}B)
                </span>
                <span className={styles.devHint}>
                  {completedStages.length > 0 ? `已完成: ${completedStages.join(' → ')}` : '未开始后训练'}
                  {inProgress && (
                    <span style={{ color: '#ffb454' }}>
                      {' · '}进行中: {inProgress.stage.toUpperCase()} ({((1 - inProgress.computeRemaining / inProgress.computeTotal) * 100).toFixed(0)}%)
                    </span>
                  )}
                  {pending && (
                    <span style={{ color: '#7ab8e0' }}>
                      {' · '}等待: {pending.stage.toUpperCase()}
                    </span>
                  )}
                </span>
              </div>

              {availableStages.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '16px' }}>
                  {availableStages.map((stage) => {
                    const computeCost = model.paramCount * (stage.stage === 'sft' ? 2 : stage.stage === 'rlhf' ? 5 : stage.stage === 'dpo' ? 3 : 4);
                    const fundsCost = model.paramCount * (stage.stage === 'sft' ? 10 : stage.stage === 'rlhf' ? 30 : stage.stage === 'dpo' ? 15 : 20) * 1000;
                    const canAfford = funds >= fundsCost;
                    return (
                      <button
                        key={stage.stage}
                        className={styles.btn}
                        style={{ fontSize: '12px', opacity: canAfford ? 1 : 0.5 }}
                        disabled={!canAfford}
                        onClick={() => {
                          game.state.update((draft) => {
                            const m = draft.models.find((x) => x.id === model.id);
                            if (!m) return;
                            m.postTraining.push({
                              stage: stage.stage,
                              status: 'pending',
                              computeRemaining: computeCost,
                              computeTotal: computeCost,
                              startedAt: 0,
                              completedAt: null,
                            });
                          });
                        }}
                        title={canAfford ? '' : `资金不足（需 $${fundsCost.toLocaleString()}）`}
                      >
                        {stage.name}
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '4px' }}>
                          ${(fundsCost / 1000).toFixed(0)}k
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
