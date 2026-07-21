/**
 * SettingsPanel - 设置面板（含调试选项）
 *
 * 子标签：调试 | 系统信息
 */
import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { formatCurrency } from '../../core/utils';
import { CreateDatasetCommand } from '../../core/commands/DataCommands';
import { INITIAL_DATA_DOMAINS } from '../../core/config/datasets';
import type { DataDomainId } from '../../core/entities/Dataset';
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
  { name: 'TechResearchSystem', desc: 'Idea 验证进度推进（PR-C：技术研发机制已废弃）' },
  { name: 'ResearchSystem', desc: '研发实验推进（公式A难易度×参数量上限/B预算/C成本/D增益）+ 结果生成' },
  { name: 'CollectionSystem', desc: '每日数据收集 + 数据集更新' },
  { name: 'InfrastructureFailureSystem', desc: '卡/节点/网络故障模拟（PR-B v3：并行可靠度加成）' },
  { name: 'TrainingSystem', desc: '模型训练推进 + 损失曲线 + 技术成熟度提升' },
  { name: 'InfraMaintenanceSystem', desc: '基础设施维护成本 + 电费扣除' },
  { name: 'UniqueTechMaintenanceSystem', desc: 'PR-E：独有技术每日维护费扣除（$50+$1×成熟度/项）' },
  { name: 'PostTrainingSystem', desc: 'PR-B v3：后训练推进（SFT/RLHF/DPO/CoT）' },
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
        {/* ★ UI-1 修复：display:none → 条件渲染，隐藏 tab 自动卸载订阅 */}
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
  const [loadJson, setLoadJson] = useState('');
  const [loadMsg, setLoadMsg] = useState('');
  const [loadMsgOk, setLoadMsgOk] = useState(true);

  // ★ 调试：修改电力容量
  const [powerCapacity, setPowerCapacity] = useState('10000');
  // ★ 调试：创建数据集
  const [datasetName, setDatasetName] = useState('调试数据集');
  const [datasetDomainTokens, setDatasetDomainTokens] = useState<Record<string, string>>(
    () => Object.fromEntries(
      (Object.keys(INITIAL_DATA_DOMAINS) as DataDomainId[]).map((id) => [id, '10']),
    ),
  );
  const [datasetQuality, setDatasetQuality] = useState('0.8');
  const [datasetFreshness, setDatasetFreshness] = useState('0.9');
  const [datasetDuplication, setDatasetDuplication] = useState('0.1');

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

  /** 导出存档 */
  const handleExportSave = () => {
    try {
      const json = game.save();
      setStateDump(json);
      showCheat('存档已导出');
    } catch (e) {
      showCheat(`导出失败: ${(e as Error).message ?? '未知错误'}`);
    }
  };

  /** 读档：加载 JSON 存档并还原游戏状态 */
  const handleLoadSave = () => {
    if (!loadJson.trim()) {
      setLoadMsg('请粘贴存档 JSON');
      setLoadMsgOk(false);
      setTimeout(() => setLoadMsg(''), 2500);
      return;
    }
    try {
      // 校验 JSON 格式
      JSON.parse(loadJson);
    } catch {
      setLoadMsg('JSON 格式无效');
      setLoadMsgOk(false);
      setTimeout(() => setLoadMsg(''), 2500);
      return;
    }
    try {
      game.load(loadJson);
      setLoadJson('');
      setLoadMsg('存档加载成功！');
      setLoadMsgOk(true);
      setTimeout(() => setLoadMsg(''), 2500);
    } catch (e) {
      setLoadMsg(`加载失败: ${(e as Error).message ?? '未知错误'}`);
      setLoadMsgOk(false);
      setTimeout(() => setLoadMsg(''), 4000);
    }
  };

  /** 导出调试状态 JSON */
  const handleDumpState = () => {
    try {
      const json = game.save();
      setStateDump(json);
    } catch (e) {
      showCheat(`导出失败: ${(e as Error).message ?? '未知错误'}`);
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

  /** ★ 调试：设置电力容量 (power_kw) */
  const handleSetPowerCapacity = () => {
    const kw = Number(powerCapacity);
    if (isNaN(kw) || kw < 0) {
      showCheat('电力容量必须为非负数');
      return;
    }
    // ★ 修复：用 setResource 替代直接 draft 赋值，确保按 ResourceDefinition.maxValue clamp
    game.state.setResource('power_kw', kw);
    const actual = game.state.getResource('power_kw');
    showCheat(`已设置电力容量为 ${actual.toLocaleString()} kW`);
  };

  /** ★ 调试：创建带指定 tokens/quality 的数据集 */
  const handleCreateDebugDataset = () => {
    const name = datasetName.trim();
    if (!name) {
      showCheat('数据集名称不能为空');
      return;
    }
    const quality = Math.max(0, Math.min(1, Number(datasetQuality) || 0));
    const freshness = Math.max(0, Math.min(1, Number(datasetFreshness) || 0));
    const duplication = Math.max(0, Math.min(1, Number(datasetDuplication) || 0));
    const tokensByDomain: Partial<Record<DataDomainId, number>> = {};
    for (const id of Object.keys(INITIAL_DATA_DOMAINS) as DataDomainId[]) {
      const t = Number(datasetDomainTokens[id] ?? '0');
      if (!isNaN(t) && t > 0) tokensByDomain[id] = t;
    }
    game.executeCommand(new CreateDatasetCommand(name));
    // 直接追加到 datasets 数组，并填充自定义 token/quality
    const today = game.state.read().date;
    game.state.update((draft) => {
      const ds = draft.datasets[draft.datasets.length - 1];
      if (ds) {
        for (const [id, tokens] of Object.entries(tokensByDomain)) {
          const dom = ds.domains[id as DataDomainId];
          if (dom) {
            dom.tokens = tokens;
            dom.quality = quality;
            dom.freshness = freshness;
            dom.duplication = duplication;
          }
        }
        // 重新计算 totalTokens / effectiveTokens
        let total = 0;
        let effective = 0;
        for (const d of Object.values(ds.domains)) {
          total += d.tokens;
          effective += d.tokens * d.quality * (1 - d.duplication);
        }
        ds.totalTokens = total;
        ds.effectiveTokens = effective;
        ds.createdAt = today;
      }
    });
    showCheat(`已创建数据集「${name}」`);
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

      {/* ★ 调试：电力容量 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>电力容量 (kW)</span>
        <input
          className={styles.input}
          type="number"
          min="0"
          step="1000"
          value={powerCapacity}
          onChange={(e) => setPowerCapacity(e.target.value)}
          style={{ width: 140 }}
        />
        <button className={styles.btn} onClick={handleSetPowerCapacity}>
          设置
        </button>
        <span className={styles.devHint}>直接覆盖当前电力容量</span>
      </div>

      {/* ★ 调试：创建数据集 */}
      <h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>创建数据集（调试）</h4>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 60 }}>名称</span>
        <input
          className={styles.input}
          type="text"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          style={{ width: 200 }}
        />
        <span className={styles.devRowLabel} style={{ minWidth: 40 }}>质量</span>
        <input
          className={styles.input}
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={datasetQuality}
          onChange={(e) => setDatasetQuality(e.target.value)}
          style={{ width: 70 }}
        />
        <span className={styles.devRowLabel} style={{ minWidth: 50 }}>新鲜</span>
        <input
          className={styles.input}
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={datasetFreshness}
          onChange={(e) => setDatasetFreshness(e.target.value)}
          style={{ width: 70 }}
        />
        <span className={styles.devRowLabel} style={{ minWidth: 50 }}>重复</span>
        <input
          className={styles.input}
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={datasetDuplication}
          onChange={(e) => setDatasetDuplication(e.target.value)}
          style={{ width: 70 }}
        />
        <button className={styles.btn} onClick={handleCreateDebugDataset}>
          创建
        </button>
      </div>
      <div className={styles.devRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
        <span className={styles.devHint} style={{ marginBottom: 4 }}>
          各领域 token 数（十亿）；留空或 0 表示该领域为空
        </span>
        {(Object.keys(INITIAL_DATA_DOMAINS) as DataDomainId[]).map((id) => (
          <div key={id} className={styles.devRow} style={{ gap: 8 }}>
            <span className={styles.devRowLabel} style={{ minWidth: 100 }}>{id}</span>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="1"
              value={datasetDomainTokens[id] ?? '0'}
              onChange={(e) =>
                setDatasetDomainTokens((prev) => ({ ...prev, [id]: e.target.value }))
              }
              style={{ width: 100 }}
            />
            <span className={styles.devHint}>B tokens</span>
          </div>
        ))}
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

      {/* 存档管理 */}
      <h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>存档管理</h4>

      <div className={styles.devRow}>
        <button className={styles.btn} onClick={handleExportSave}>
          导出存档
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={() => {
            const json = game.save();
            navigator.clipboard.writeText(json).then(
              () => showCheat('已复制到剪贴板'),
              () => showCheat('复制失败'),
            );
          }}
        >
          复制到剪贴板
        </button>
        <span className={styles.devHint}>导出当前游戏状态为 JSON</span>
      </div>

      <div className={styles.devRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={styles.devRowLabel} style={{ minWidth: '80px' }}>读档</span>
          <button className={styles.btn} onClick={handleLoadSave} disabled={!loadJson.trim()}>
            加载存档
          </button>
          {loadMsg && (
            <span className={styles.devHint} style={{ color: loadMsgOk ? '#5cb85c' : '#ff6b6b' }}>
              {loadMsg}
            </span>
          )}
        </div>
        <textarea
          className={styles.stateDump}
          style={{ maxHeight: '140px', minHeight: '80px', width: '100%', resize: 'vertical' }}
          placeholder="粘贴存档 JSON 后点击「加载存档」..."
          value={loadJson}
          onChange={(e) => setLoadJson(e.target.value)}
        />
      </div>

      {/* 状态导出（调试） */}
      <h4 className={styles.devRowLabel} style={{ marginTop: 16 }}>状态导出（调试）</h4>
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

  // ★ 性能优化：只订阅 .length / 过滤计数（返回 number，Object.is 稳定），
  //   避免订阅整个数组引用导致任意子属性变化都触发重渲染。
  //   原先 17 个 useGameState((s) => s.xxx) 订阅整个数组，
  //   数组内任意元素属性变化（如员工 fatigue 变化）都触发重渲染。
  const employeeCount = useGameState((s) => s.employees.length);
  const modelCount = useGameState((s) => s.models.length);
  const datasetCount = useGameState((s) => s.datasets.length);
  const dataCenterCount = useGameState((s) => s.dataCenters.length);
  const clusterCount = useGameState((s) => s.clusters.length);
  const serverNodeCount = useGameState((s) => s.serverNodes.length);
  const pendingOrderCount = useGameState((s) => s.pendingOrders.length);
  const departmentCount = useGameState((s) => s.departments.length);

  // 需要总数 + 过滤计数：分别订阅两个 number，互不影响
  const researchCount = useGameState((s) => s.researchProjects.length);
  const activeResearch = useGameState((s) => s.researchProjects.filter((p) => p.status === 'in_progress').length);
  const trainingCount = useGameState((s) => s.trainingProjects.length);
  const activeTraining = useGameState((s) => s.trainingProjects.filter((p) => p.status === 'training').length);
  const collectionCount = useGameState((s) => s.dataCollectionProjects.length);
  const activeCollection = useGameState((s) => s.dataCollectionProjects.filter((p) => p.status === 'active').length);
  const fundingCount = useGameState((s) => s.fundingRounds.length);
  const activeFunding = useGameState((s) => s.fundingRounds.filter((r) => r.active).length);

  // 只需要过滤计数（无需总数）
  const activeCandidates = useGameState((s) => s.pendingCandidates.filter((c) => c.status === 'pending').length);
  const activeTrainings = useGameState((s) => s.staffTrainings.filter((t) => t.status === 'in_progress').length);

  const rows: [string, string][] = [
    ['日期', `Day ${date}`],
    ['状态', isPaused ? '暂停' : `运行中 (${speed}×)`],
    ['员工', `${employeeCount} 核心 / ${activeCandidates} 候选人`],
    ['模型', `${modelCount} 个`],
    ['数据集', `${datasetCount} 个`],
    ['研发项目', `${researchCount} 个 (${activeResearch} 进行中)`],
    ['训练项目', `${trainingCount} 个 (${activeTraining} 进行中)`],
    ['数据收集', `${collectionCount} 个 (${activeCollection} 活跃)`],
    ['基础设施', `${dataCenterCount} DC / ${clusterCount} 集群 / ${serverNodeCount} 节点`],
    ['待交付订单', `${pendingOrderCount} 笔`],
    ['融资轮次', `${fundingCount} 轮 (${activeFunding} 活跃)`],
    ['部门/培训', `${departmentCount} 部门 | ${activeTrainings} 培训进行中`],
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
