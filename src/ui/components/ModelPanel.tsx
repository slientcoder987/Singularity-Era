import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { StartTrainingCommand, CancelTrainingCommand } from '../../core/commands/TrainingCommands';
import { StartResearchCommand, CancelResearchCommand } from '../../core/commands/TechCommands';
import { TECH_TREE, TECH_MAP, type TechId } from '../../core/config/techTree';
import { CAPABILITIES } from '../../core/config/capabilities';
import { observeCapabilities, calcNoiseSigma } from '../../core/utils/capabilityCalc';
import type { Model } from '../../core/entities/Model';
import styles from '../styles/App.module.css';

type ModelTab = 'training' | 'models' | 'tech';

const MODEL_TABS: { key: ModelTab; label: string; icon: string }[] = [
  { key: 'training', label: '训练', icon: '🎯' },
  { key: 'models', label: '模型', icon: '🧠' },
  { key: 'tech', label: '技术树', icon: '🔬' },
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
      {tab === 'tech' && <TechTab />}
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
  const [computeTotal, setComputeTotal] = useState(10_000);

  // 选择已解锁的架构技术
  const archTechs = TECH_TREE.filter(
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

  const handleStart = () => {
    const techIds = ['pretraining', ...Array.from(selectedArchs)];
    game.executeCommand(
      new StartTrainingCommand(
        modelName,
        paramCount,
        selectedArchs.has('moe') ? 'moe' : 'transformer',
        selectedClusterId,
        computeTotal,
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
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>总算力</span>
        <input
          className={styles.input}
          type="number"
          min={100}
          step={1000}
          value={computeTotal}
          onChange={(e) => setComputeTotal(Number(e.target.value))}
          style={{ width: '80px' }}
        />
        <span className={styles.devHint}>TFLOPS·天</span>
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
          disabled={!modelName || !selectedClusterId}
          onClick={handleStart}
        >
          开始训练
        </button>
      </div>

      {/* 训练中项目 */}
      {activeProjects.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>训练中 ({activeProjects.length})</span>
          </div>
          {activeProjects.map((p) => {
            const progress = ((p.computeTotal - p.computeRemaining) / p.computeTotal) * 100;
            return (
              <div key={p.id} className={styles.devRow}>
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
  const observed = observeCapabilities(model);

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
        const isEmerged = model.baseScore >= cap.emergenceThreshold;
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
        const isEmerged = model.baseScore >= cap.emergenceThreshold;
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

/* ============== 技术树标签 ============== */

function TechTab() {
  const game = useGame();
  const unlockedTechs = useGameState((s) => s.unlockedTechs);
  const researchingTech = useGameState((s) => s.researchingTech);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  const canResearch = (techId: TechId): boolean => {
    const tech = TECH_MAP[techId];
    if (!tech || tech.researchDays === 0) return false;
    if (unlockedTechs.includes(techId)) return false;
    if (researchingTech) return false;
    return tech.prerequisites.every((p) => unlockedTechs.includes(p));
  };

  return (
    <div className={styles.tabBody}>
      {/* 研发中状态 */}
      {researchingTech && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>研发中</span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {TECH_MAP[researchingTech.techId as TechId]?.name ?? researchingTech.techId}
            </span>
            <span className={styles.devHint}>
              {researchingTech.progressDays}/{researchingTech.totalDays} 天
              ({((researchingTech.progressDays / researchingTech.totalDays) * 100).toFixed(0)}%)
            </span>
            <button
              className={styles.btn}
              onClick={() => game.executeCommand(new CancelResearchCommand())}
            >
              取消
            </button>
          </div>
        </>
      )}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>技术树</span>
      </div>

      {TECH_TREE.filter((t) => t.researchDays > 0).map((tech) => {
        const isUnlocked = unlockedTechs.includes(tech.id);
        const isResearching = researchingTech?.techId === tech.id;
        const canDo = canResearch(tech.id);
        const prereqMet = tech.prerequisites.every((p) => unlockedTechs.includes(p));

        return (
          <div key={tech.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {tech.name}
              {tech.isArchitecture && ' [架构]'}
            </span>
            <span className={styles.devHint} style={{
              color: isUnlocked ? '#5cb85c' : !prereqMet ? '#666' : '#e6f0ff',
            }}>
              {tech.description}
              {' · '}
              {isUnlocked
                ? '✓ 已解锁'
                : !prereqMet
                ? '前置未满足'
                : `${tech.researchDays}天 · $${tech.researchCost.toLocaleString()}`}
            </span>
            {!isUnlocked && !isResearching && canDo && (
              <button
                className={styles.btn}
                disabled={funds < tech.researchCost}
                onClick={() => game.executeCommand(new StartResearchCommand(tech.id))}
              >
                研发
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
