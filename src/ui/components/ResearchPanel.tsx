import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import {
  StartExperimentCommand,
  CancelResearchProjectCommand,
} from '../../core/commands/DataCommands';
import {
  StartResearchCommand,
  CancelResearchCommand,
} from '../../core/commands/TechCommands';
import {
  SettleLawsuitCommand,
  PublicApologyCommand,
  ConductAuditCommand,
  UseModelInResearchCommand,
} from '../../core/commands/RiskCommands';
import { ALL_TECH, TECH_MAP } from '../../core/config/techTree';
import { CAPABILITY_MAP } from '../../core/config/capabilities';
import { aggregateExperiments } from '../../core/utils/researchUtils';
import { StaffRole } from '../../core/entities/Employee';
import styles from '../styles/App.module.css';

type ResearchTab = 'experiment' | 'tech' | 'risk';

const RESEARCH_TABS: { key: ResearchTab; label: string; icon: string }[] = [
  { key: 'experiment', label: '实验', icon: '🔬' },
  { key: 'tech', label: '技术树', icon: '🌳' },
  { key: 'risk', label: '风险', icon: '⚠️' },
];

export function ResearchPanel() {
  const [tab, setTab] = useState<ResearchTab>('experiment');

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

      <div style={{ display: tab === 'experiment' ? 'block' : 'none' }}>
        <ExperimentTab />
      </div>
      <div style={{ display: tab === 'tech' ? 'block' : 'none' }}>
        <TechTab />
      </div>
      <div style={{ display: tab === 'risk' ? 'block' : 'none' }}>
        <RiskTab />
      </div>
    </section>
  );
}

/* ============== 实验验证 ============== */

function ExperimentTab() {
  const game = useGame();
  const researchProjects = useGameState((s) => s.researchProjects);
  const experimentResults = useGameState((s) => s.experimentResults);
  const employees = useGameState((s) => s.employees);
  const unlockedTechs = useGameState((s) => s.unlockedTechs);

  const archTechs = ALL_TECH.filter((t) => t.isArchitecture && t.id !== 'pretraining');
  const researchers = employees.filter((e) => e.role === StaffRole.RESEARCHER && e.status === 'idle');

  const [selectedArch, setSelectedArch] = useState<string>(archTechs[0]?.id ?? '');
  const [selectedScale, setSelectedScale] = useState<'small' | 'medium'>('small');
  const [selectedResearchers, setSelectedResearchers] = useState<Set<string>>(new Set());
  const [mainModelParams, setMainModelParams] = useState<number>(7);

  const toggleResearcher = (id: string) => {
    setSelectedResearchers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    game.executeCommand(
      new StartExperimentCommand(
        selectedArch,
        Array.from(selectedResearchers),
        selectedScale,
        mainModelParams,
      ),
    );
    setSelectedResearchers(new Set());
  };

  const activeProjects = researchProjects.filter((p) => p.status === 'in_progress');
  const completedProjects = researchProjects.filter((p) => p.status === 'completed');

  return (
    <div className={styles.tabBody}>
      {/* 启动实验 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>启动实验验证</span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>目标架构</span>
        <select
          className={styles.select}
          value={selectedArch}
          onChange={(e) => setSelectedArch(e.target.value)}
        >
          {archTechs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}{unlockedTechs.includes(t.id) ? ' (已解锁)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>实验规模</span>
        <button
          className={`${styles.btn} ${selectedScale === 'small' ? styles.btnActive : ''}`}
          onClick={() => setSelectedScale('small')}
        >
          小型 (5%算力, 噪声大)
        </button>
        <button
          className={`${styles.btn} ${selectedScale === 'medium' ? styles.btnActive : ''}`}
          onClick={() => setSelectedScale('medium')}
        >
          中型 (15%算力, 噪声小)
        </button>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>主力模型参数量</span>
        <input
          type="number"
          className={styles.input}
          style={{ width: '80px' }}
          value={mainModelParams}
          onChange={(e) => setMainModelParams(Number(e.target.value) || 7)}
          min={1}
        />
        <span className={styles.devHint}>B</span>
        <span className={styles.devHint}>
          成本: ${(mainModelParams * (selectedScale === 'small' ? 0.05 : 0.15) * 100_000).toLocaleString()}
        </span>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: '100px' }}>研究员 ({selectedResearchers.size})</span>
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

      <div className={styles.devRow}>
        <button
          className={styles.btn}
          style={{ opacity: selectedResearchers.size === 0 ? 0.5 : 1 }}
          disabled={selectedResearchers.size === 0}
          onClick={handleStart}
        >
          启动实验
        </button>
      </div>

      {/* 进行中实验 */}
      {activeProjects.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>进行中</span>
          </div>
          {activeProjects.map((p) => (
            <div key={p.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · {TECH_MAP[p.targetArchId ?? '']?.name ?? p.targetArchId}
                ({p.experimentScale}) · {(p.progress * 100).toFixed(0)}%
              </span>
              <button
                className={styles.btn}
                onClick={() => game.executeCommand(new CancelResearchProjectCommand(p.id))}
              >
                取消
              </button>
            </div>
          ))}
        </>
      )}

      {/* 实验结果 */}
      {completedProjects.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>实验结果</span>
          </div>
          {archTechs.map((tech) => {
            const results = experimentResults.filter((r) => r.archTechId === tech.id);
            if (results.length === 0) return null;
            const aggregated = aggregateExperiments(experimentResults, tech.id);
            return (
              <div key={tech.id} className={styles.devRow}>
                <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                  · {tech.name} ({results.length}次实验)
                </span>
                <span className={styles.devHint}>
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

/* ============== 技术树标签 ============== */

function TechTab() {
  const game = useGame();
  const unlockedTechs = useGameState((s) => s.unlockedTechs);
  const researchingTech = useGameState((s) => s.researchingTech);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  const canResearch = (techId: string): boolean => {
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
              · {TECH_MAP[researchingTech.techId]?.name ?? researchingTech.techId}
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

      {ALL_TECH.filter((t) => t.researchDays > 0).map((tech) => {
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

/* ============== 风险管理 ============== */

function RiskTab() {
  const game = useGame();
  const riskState = useGameState((s) => s.riskState);
  const models = useGameState((s) => s.models);
  const unlockedTechs = useGameState((s) => s.unlockedTechs);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  const settleCost = Math.floor(riskState.legalDebt) * 100_000;
  const hasAlignment = unlockedTechs.includes('alignment_v1');
  const strongModels = models.filter((m) => {
    const maxCap = Math.max(...Object.values(m.capabilities));
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
                第{evt.date}天 · {evt.eventName} ({evt.severity})
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
