/**
 * SettingsPanel - 设置面板（含调试选项）
 *
 * 子标签：调试 | 系统信息
 */
import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { formatCurrency } from '../../core/utils';
import styles from '../styles/App.module.css';

type SettingsTab = 'debug' | 'systemInfo';

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'debug', label: '调试' },
  { key: 'systemInfo', label: '系统信息' },
];

/** 系统执行顺序（与 main.tsx 保持一致） */
const SYSTEM_ORDER = [
  { name: 'ComputeHardwareSystem', desc: '硬件采购交付，卡实例入池' },
  { name: 'PowerSystem', desc: '计算日总功耗，电力短缺检测' },
  { name: 'StaffSystem', desc: '员工状态更新（疲劳/忠诚/经验/培训/绩效/发薪）' },
  { name: 'TechResearchSystem', desc: '技术研发进度推进' },
  { name: 'ResearchSystem', desc: '研发实验推进 + 结果生成' },
  { name: 'CollectionSystem', desc: '每日数据收集 + 数据集更新' },
  { name: 'InfrastructureFailureSystem', desc: '卡/节点/网络故障模拟' },
  { name: 'TrainingSystem', desc: '模型训练推进 + 损失曲线 + 事件' },
  { name: 'InfraMaintenanceSystem', desc: '基础设施维护成本 + 电费扣除' },
  { name: 'OperationsSystem', desc: '运营收入/Token售卖/用户流失/股价' },
  { name: 'CompetitorSystem', desc: '竞争对手后台模拟（每7天一次）' },
  { name: 'RiskSystem', desc: '风险事件检测 + 训练崩溃检查' },
  { name: 'RegionSystem', desc: '地区税率/监管/能源修正' },
];

export function SettingsPanel() {
  const [tab, setTab] = useState<SettingsTab>('debug');

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>设置</h3>

      <div className={styles.empFilter}>
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.empFilterBtn} ${tab === t.key ? styles.empFilterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabBody}>
        {tab === 'debug' && <DebugTab />}
        {tab === 'systemInfo' && <SystemInfoTab />}
      </div>
    </section>
  );
}

/* ============================================================
   调试标签页
   ============================================================ */

function DebugTab() {
  const game = useGame();
  const date = useGameState((s) => s.date);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);
  const isPaused = useGameState((s) => s.isPaused);
  const employeeCount = useGameState((s) => s.employees.length);
  const modelCount = useGameState((s) => s.models.length);

  const [stateDump, setStateDump] = useState<string | null>(null);
  const [advanceDays, setAdvanceDays] = useState('7');
  const [addFundsAmount, setAddFundsAmount] = useState('10000000');
  const [cheatMsg, setCheatMsg] = useState('');

  const showCheat = (msg: string) => {
    setCheatMsg(msg);
    setTimeout(() => setCheatMsg(''), 2500);
  };

  /** 添加资金 */
  const handleAddFunds = () => {
    const amount = Number(addFundsAmount);
    if (isNaN(amount) || amount <= 0) return;
    game.state.update((draft) => {
      draft.resources['funds'] = (draft.resources['funds'] ?? 0) + amount;
    });
    showCheat(`已添加 ${formatCurrency(amount)}`);
  };

  /** 推进天数（暂停 → 改 date → 手动触发一次 tick） */
  const handleAdvanceDays = () => {
    const days = Number(advanceDays);
    if (isNaN(days) || days <= 0) return;
    if (!isPaused) game.pause();
    game.state.update((draft) => {
      draft.date += days;
    });
    showCheat(`已推进 ${days} 天`);
  };

  /** 导出状态 */
  const handleDumpState = () => {
    try {
      const json = JSON.stringify(game.state.read(), null, 2);
      setStateDump(json);
    } catch {
      showCheat('导出失败');
    }
  };

  /** 重置士气/忠诚 */
  const handleResetMorale = () => {
    game.state.update((draft) => {
      draft.riskState.employeeMorale = 80;
      draft.riskState.reputation = 50;
      draft.riskState.legalDebt = 0;
      draft.riskState.trustDebt = 0;
      for (const emp of draft.employees) {
        emp.loyalty = 70;
        emp.fatigue = 0;
      }
    });
    showCheat('已重置士气/风险/忠诚/疲劳');
  };

  /** 清除负债 */
  const handleClearDebt = () => {
    game.state.update((draft) => {
      draft.riskState.legalDebt = 0;
      draft.riskState.trustDebt = 0;
    });
    showCheat('已清除法律/信任负债');
  };

  return (
    <div>
      {/* 快速调试 */}
      <h4 className={styles.devRowLabel}>快速调试</h4>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>添加资金</span>
        <input
          className={styles.input}
          type="number"
          value={addFundsAmount}
          onChange={(e) => setAddFundsAmount(e.target.value)}
          style={{ width: 140 }}
        />
        <button className={styles.btn} onClick={handleAddFunds}>
          添加
        </button>
      </div>

      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>推进天数</span>
        <input
          className={styles.input}
          type="number"
          value={advanceDays}
          onChange={(e) => setAdvanceDays(e.target.value)}
          style={{ width: 80 }}
          min="1"
          max="365"
        />
        <button className={styles.btn} onClick={handleAdvanceDays}>
          推进
        </button>
        <span className={styles.devHint}>
          在暂停状态下使用（直接跳过日期）
        </span>
      </div>

      <div className={styles.devRow}>
        <button className={styles.btn} onClick={handleResetMorale}>
          重置士气/风险
        </button>
        <button className={styles.btn} onClick={handleClearDebt}>
          清除负债
        </button>
      </div>

      {cheatMsg && (
        <div className={styles.devRow}>
          <span style={{ color: '#7af0c0', fontSize: 13 }}>{cheatMsg}</span>
        </div>
      )}

      {/* 当前状态摘要 */}
      <h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>当前状态</h4>
      <div className={styles.devRow}>
        <span className={styles.devHint}>
          日期: Day {date} | 资金: {formatCurrency(funds)} | 状态: {isPaused ? '已暂停' : '运行中'}
          {' | 员工: '}{ employeeCount } 人
          {' | 模型: '}{ modelCount } 个
        </span>
      </div>

      {/* 状态导出 */}
      <h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>状态导出</h4>
      <div className={styles.devRow}>
        <button className={styles.btn} onClick={handleDumpState}>
          {stateDump ? '刷新状态 JSON' : '导出状态 JSON'}
        </button>
        {stateDump && (
          <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => setStateDump(null)}>
            收起
          </button>
        )}
      </div>

      {stateDump && (
        <pre className={styles.stateDump}>
          {stateDump}
        </pre>
      )}
    </div>
  );
}

/* ============================================================
   系统信息标签页
   ============================================================ */

function SystemInfoTab() {
  const date = useGameState((s) => s.date);
  const isPaused = useGameState((s) => s.isPaused);
  const speed = useGameState((s) => s.speed);
  const employees = useGameState((s) => s.employees);
  const models = useGameState((s) => s.models);
  const datasets = useGameState((s) => s.datasets);
  const researchProjects = useGameState((s) => s.researchProjects);
  const trainingProjects = useGameState((s) => s.trainingProjects);
  const dataCollectionProjects = useGameState((s) => s.dataCollectionProjects);
  const dataCenters = useGameState((s) => s.dataCenters);
  const clusters = useGameState((s) => s.clusters);
  const serverNodes = useGameState((s) => s.serverNodes);
  const pendingOrders = useGameState((s) => s.pendingOrders);
  const fundingRounds = useGameState((s) => s.fundingRounds);
  const departments = useGameState((s) => s.departments);
  const staffTrainings = useGameState((s) => s.staffTrainings);
  const pendingCandidates = useGameState((s) => s.pendingCandidates);

  const activeCandidates = pendingCandidates.filter((c) => c.status === 'pending').length;
  const activeResearch = researchProjects.filter((p) => p.status === 'in_progress').length;
  const activeTraining = trainingProjects.filter((p) => p.status === 'training').length;
  const activeCollection = dataCollectionProjects.filter((p) => p.status === 'active').length;
  const activeFunding = fundingRounds.filter((r) => r.active).length;
  const activeTrainings = staffTrainings.filter((t) => t.status === 'in_progress').length;

  const rows: [string, string][] = [
    ['日期', `Day ${date}`],
    ['状态', isPaused ? '暂停' : `运行中 (${speed}×)`],
    ['员工', `${employees.length} 核心 / ${activeCandidates} 候选人`],
    ['模型', `${models.length} 个`],
    ['数据集', `${datasets.length} 个`],
    ['研发项目', `${researchProjects.length} 个 (${activeResearch} 进行中)`],
    ['训练项目', `${trainingProjects.length} 个 (${activeTraining} 进行中)`],
    ['数据收集', `${dataCollectionProjects.length} 个 (${activeCollection} 活跃)`],
    ['基础设施', `${dataCenters.length} DC / ${clusters.length} 集群 / ${serverNodes.length} 节点`],
    ['待交付订单', `${pendingOrders.length} 笔`],
    ['融资轮次', `${fundingRounds.length} 轮 (${activeFunding} 活跃)`],
    ['部门/培训', `${departments.length} 部门 | ${activeTrainings} 培训进行中`],
  ];

  return (
    <div>
      {/* 引擎信息 */}
      <h4 className={styles.devRowLabel}>引擎状态</h4>
      <div className={styles.devRow}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <td style={{ color: 'var(--text-dim)', padding: '2px 12px 2px 0', whiteSpace: 'nowrap' }}>{label}</td>
                <td style={{ padding: '2px 0' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 系统执行顺序 */}
      <h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>系统执行顺序（每日）</h4>
      <div className={styles.devRow}>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8 }}>
          {SYSTEM_ORDER.map((sys) => (
            <li key={sys.name}>
              <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>{sys.name}</span>
              <span style={{ marginLeft: 8 }}>{sys.desc}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
