import { useState, useMemo } from 'react';
import { useGame } from '../hooks/useGame';
import { SetHeadquartersCommand } from '../../core/commands/RegionCommands';
import { RECOMMENDED_START_REGIONS, getRegionsByContinent } from '../../core/config/regions';
import type { Region } from '../../core/config/regions';
import { STARTUP_PRESETS } from '../../core/config/startupPresets';
import type { StartupPreset, PresetCard, PresetEmployee } from '../../core/config/startupPresets';
import { StaffRole } from '../../core/entities/Employee';
import styles from '../styles/App.module.css';

/** 可选算力卡型号（仅展示开局早期可用的） */
const STARTUP_CARDS = [
  { modelId: 'compute_a100', label: 'A100 80GB ($10K)', tflops: 624, cost: 10_000 },
  { modelId: 'compute_h100', label: 'H100 80GB ($30K)', tflops: 1979, cost: 30_000 },
  { modelId: 'compute_l40s', label: 'L40S ($8K)', tflops: 733, cost: 8_000 },
];

/** 员工角色展示配置 */
const ROLE_OPTIONS: { role: StaffRole; label: string; baseSalary: number }[] = [
  { role: StaffRole.RESEARCHER, label: '研究员', baseSalary: 120_000 },
  { role: StaffRole.DATA_ENGINEER, label: '数据工程师', baseSalary: 80_000 },
  { role: StaffRole.SYSTEM_ENGINEER, label: '系统工程师', baseSalary: 90_000 },
  { role: StaffRole.PRODUCT_MANAGER, label: '产品经理', baseSalary: 100_000 },
  { role: StaffRole.LEGAL_PR, label: '法务/公关', baseSalary: 85_000 },
];

/** 资金档位 */
const FUND_TIERS = [
  { value: 1_000_000, label: '$1M' },
  { value: 3_000_000, label: '$3M' },
  { value: 5_000_000, label: '$5M' },
  { value: 10_000_000, label: '$10M' },
  { value: 20_000_000, label: '$20M' },
];

interface StartupScreenProps {
  onComplete: () => void;
}

/**
 * 开局流程：地区选择 → 预设 / 自定义 → 开始游戏
 *
 * Step 1: 选择总部地区
 * Step 2: 选择策略（3 个预设 + 1 个自定义）
 * Step 2b (自定义): 独立选择资金/算力卡/员工
 */
export function StartupScreen({ onComplete }: StartupScreenProps) {
  const game = useGame();
  const [step, setStep] = useState<'region' | 'preset' | 'custom'>('region');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const groups = useMemo(() => getRegionsByContinent(), []);

  // ---- 自定义模式状态 ----
  const [customFundsIdx, setCustomFundsIdx] = useState(2); // 默认 $5M
  const [customCards, setCustomCards] = useState<Record<string, number>>({
    compute_a100: 2,
    compute_h100: 0,
    compute_l40s: 0,
  });
  const [customEmployees, setCustomEmployees] = useState<Record<string, { count: number; level: number }>>({
    [StaffRole.RESEARCHER]: { count: 3, level: 3 },
    [StaffRole.DATA_ENGINEER]: { count: 1, level: 2 },
    [StaffRole.SYSTEM_ENGINEER]: { count: 1, level: 2 },
    [StaffRole.PRODUCT_MANAGER]: { count: 0, level: 2 },
    [StaffRole.LEGAL_PR]: { count: 0, level: 2 },
  });

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);
    setStep('preset');
  };

  const handleSelectPreset = (preset: StartupPreset) => {
    if (!selectedRegion) return;
    game.executeCommand(new SetHeadquartersCommand(selectedRegion.id, preset));
    onComplete();
  };

  const handleCustom = () => {
    setStep('custom');
  };

  const handleConfirmCustom = () => {
    if (!selectedRegion) return;

    const fundsM = FUND_TIERS[customFundsIdx].value;
    const cards: PresetCard[] = Object.entries(customCards)
      .filter(([, count]) => count > 0)
      .map(([modelId, count]) => ({ modelId, count }));

    const employees: PresetEmployee[] = Object.entries(customEmployees)
      .filter(([, v]) => v.count > 0)
      .map(([role, v]) => ({ role: role as StaffRole, level: v.level, count: v.count }));

    // 自定义预设：资金 = 所选档位（代替 base $1M + bonus）
    const customPreset: StartupPreset = {
      id: 'custom',
      name: '自定义',
      description: '',
      bonusFunds: fundsM - 1_000_000, // SetHeadquartersCommand 会在 base $1M 上叠加
      cards,
      employees,
    };

    game.executeCommand(new SetHeadquartersCommand(selectedRegion.id, customPreset));
    onComplete();
  };

  const handleBack = () => {
    if (step === 'custom') setStep('preset');
    else setStep('region');
  };

  // ---- 计算自定义方案总成本 ----
  const customTotalCost = useMemo(() => {
    const cardCost = Object.entries(customCards).reduce((sum, [modelId, count]) => {
      const card = STARTUP_CARDS.find((c) => c.modelId === modelId);
      return sum + (card?.cost ?? 0) * count;
    }, 0);
    return cardCost;
  }, [customCards]);

  const customTotalSalary = useMemo(() => {
    return Object.entries(customEmployees).reduce((sum, [role, v]) => {
      const opt = ROLE_OPTIONS.find((r) => r.role === role);
      return sum + (opt?.baseSalary ?? 0) * v.count;
    }, 0);
  }, [customEmployees]);

  const customTotalTFlops = useMemo(() => {
    return Object.entries(customCards).reduce((sum, [modelId, count]) => {
      const card = STARTUP_CARDS.find((c) => c.modelId === modelId);
      return sum + (card?.tflops ?? 0) * count;
    }, 0);
  }, [customCards]);

  // ================================================================
  // Step 2b: 自定义开局
  // ================================================================
  if (step === 'custom' && selectedRegion) {
    return (
      <div className={styles.app}>
        <div className={styles.pageMain}>
          <section className={styles.devPanel}>
            <h2 className={styles.devTitle}>自定义开局配置</h2>
            <p className={styles.devHint} style={{ marginBottom: 12 }}>
              总部：{selectedRegion.name} · {selectedRegion.country} · 人才{selectedRegion.talentIndex} · 能源成本{selectedRegion.energyCostIndex}
            </p>

            {/* 资金选择 */}
            <div className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ color: '#ffd76b' }}>初始资金</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {FUND_TIERS.map((tier, i) => (
                <button
                  key={tier.value}
                  className={styles.btn}
                  style={{
                    background: i === customFundsIdx ? '#444' : undefined,
                    borderColor: i === customFundsIdx ? '#ffd76b' : undefined,
                    minWidth: 80,
                  }}
                  onClick={() => setCustomFundsIdx(i)}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            {/* 算力卡选择 */}
            <div className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ color: '#a78bfa' }}>
                算力卡 · 总 {customTotalTFlops} TFLOPS · 硬件成本 ${(customTotalCost / 1000).toFixed(0)}K
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {STARTUP_CARDS.map((card) => (
                <div key={card.modelId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#ccc', minWidth: 140 }}>{card.label}</span>
                  <button
                    className={styles.btn}
                    style={{ minWidth: 30, padding: '2px 8px' }}
                    onClick={() =>
                      setCustomCards((prev) => ({
                        ...prev,
                        [card.modelId]: Math.max(0, (prev[card.modelId] ?? 0) - 1),
                      }))
                    }
                  >
                    −
                  </button>
                  <span style={{ minWidth: 24, textAlign: 'center', fontSize: 14 }}>
                    {customCards[card.modelId] ?? 0}
                  </span>
                  <button
                    className={styles.btn}
                    style={{ minWidth: 30, padding: '2px 8px' }}
                    onClick={() =>
                      setCustomCards((prev) => ({
                        ...prev,
                        [card.modelId]: Math.min(8, (prev[card.modelId] ?? 0) + 1),
                      }))
                    }
                  >
                    +
                  </button>
                </div>
              ))}
            </div>

            {/* 员工选择 */}
            <div className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ color: '#7ab8e0' }}>
                核心员工 · 年薪合计 ${(customTotalSalary / 1000).toFixed(0)}K
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {ROLE_OPTIONS.map((opt) => {
                const val = customEmployees[opt.role];
                return (
                  <div key={opt.role} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#ccc', minWidth: 110 }}>{opt.label}</span>
                    <button
                      className={styles.btn}
                      style={{ minWidth: 30, padding: '2px 8px' }}
                      onClick={() =>
                        setCustomEmployees((prev) => ({
                          ...prev,
                          [opt.role]: { ...val, count: Math.max(0, val.count - 1) },
                        }))
                      }
                    >
                      −
                    </button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontSize: 14 }}>{val.count}</span>
                    <button
                      className={styles.btn}
                      style={{ minWidth: 30, padding: '2px 8px' }}
                      onClick={() =>
                        setCustomEmployees((prev) => ({
                          ...prev,
                          [opt.role]: { ...val, count: Math.min(8, val.count + 1) },
                        }))
                      }
                    >
                      +
                    </button>
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>Lv.</span>
                    <button
                      className={styles.btn}
                      style={{ minWidth: 30, padding: '2px 8px' }}
                      disabled={val.count === 0}
                      onClick={() =>
                        setCustomEmployees((prev) => ({
                          ...prev,
                          [opt.role]: { ...val, level: Math.max(1, val.level - 1) },
                        }))
                      }
                    >
                      −
                    </button>
                    <span style={{ minWidth: 16, textAlign: 'center', fontSize: 14 }}>{val.level}</span>
                    <button
                      className={styles.btn}
                      style={{ minWidth: 30, padding: '2px 8px' }}
                      disabled={val.count === 0}
                      onClick={() =>
                        setCustomEmployees((prev) => ({
                          ...prev,
                          [opt.role]: { ...val, level: Math.min(10, val.level + 1) },
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={styles.btn} onClick={handleBack}>
                ← 返回预设选择
              </button>
              <button
                className={styles.btn}
                style={{ background: '#2a4a2a', borderColor: '#5cb85c', color: '#5cb85c', fontWeight: 'bold' }}
                disabled={customTotalTFlops === 0 && Object.values(customEmployees).every((v) => v.count === 0)}
                onClick={handleConfirmCustom}
              >
                确认配置，开始游戏
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ================================================================
  // Step 2: 预设选择
  // ================================================================
  if (step === 'preset' && selectedRegion) {
    const baseFunds = 1_000_000;

    return (
      <div className={styles.app}>
        <div className={styles.pageMain}>
          <section className={styles.devPanel}>
            <h2 className={styles.devTitle}>选择开局策略</h2>
            <p className={styles.devHint} style={{ marginBottom: 12 }}>
              总部：{selectedRegion.name} · {selectedRegion.country} · 人才{selectedRegion.talentIndex} · 能源成本指数{selectedRegion.energyCostIndex}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STARTUP_PRESETS.map((preset) => {
                const totalFunds = baseFunds + preset.bonusFunds;
                const cardSummary = preset.cards
                  .map((c) => `${c.modelId.replace('compute_', '').toUpperCase()} ×${c.count}`)
                  .join('，');
                const empSummary = preset.employees
                  .map((e) => {
                    const names: Record<string, string> = {
                      researcher: '研究员',
                      data_engineer: '数据工程师',
                      system_engineer: '系统工程师',
                      product_manager: '产品经理',
                      legal_pr: '法务/公关',
                    };
                    return `${names[e.role] ?? e.role} ×${e.count}`;
                  })
                  .join('，');

                return (
                  <button
                    key={preset.id}
                    className={styles.btn}
                    style={{ flex: '1 1 calc(33% - 8px)', minWidth: 260, textAlign: 'left', padding: 16 }}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>{preset.name}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{preset.description}</div>
                    <div style={{ fontSize: 12, color: '#ffd76b', marginBottom: 3 }}>
                      资金：${(totalFunds / 1_000_000).toFixed(0)}M
                    </div>
                    <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 3 }}>
                      算力：{cardSummary || '无'}
                    </div>
                    <div style={{ fontSize: 12, color: '#7ab8e0' }}>员工：{empSummary || '无'}</div>
                  </button>
                );
              })}
            </div>

            {/* 自定义按钮 */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className={styles.btn} onClick={handleBack}>
                ← 返回地区选择
              </button>
              <button
                className={styles.btn}
                style={{ background: '#333', borderColor: '#7ab8e0', color: '#7ab8e0' }}
                onClick={handleCustom}
              >
                自定义开局配置...
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ================================================================
  // Step 1: 地区选择
  // ================================================================
  return (
    <div className={styles.app}>
      <div className={styles.pageMain}>
        <section className={styles.devPanel}>
          <h2 className={styles.devTitle}>选择总部地区</h2>
          <p className={styles.devHint} style={{ marginBottom: 12 }}>
            推荐选择经济发展水平高的地区开局（东亚、合众国、西欧等），便于获取人才和算力。
          </p>

          {/* 推荐地区 */}
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ color: '#5cb85c' }}>推荐开局</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {RECOMMENDED_START_REGIONS.map((r) => (
              <button
                key={r.id}
                className={styles.btn}
                style={{ flex: '0 0 calc(25% - 6px)', minWidth: 140, textAlign: 'left' }}
                onClick={() => handleSelectRegion(r)}
              >
                <div style={{ fontWeight: 'bold', color: '#5cb85c' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  {r.country} · {r.population}M人 · GDP ${r.gdpPerCapita.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                  人才{r.talentIndex} · 算力{r.computeIndex} · 税率{r.taxRate}%{r.dataLocalization ? ' · 需本地存储' : ''}
                </div>
                {r.startReason && (
                  <div style={{ fontSize: 10, color: '#7ab8e0', marginTop: 3 }}>{r.startReason}</div>
                )}
              </button>
            ))}
          </div>

          {/* 全部地区按大区 */}
          {Object.entries(groups).map(([continent, regions]) => (
            <div key={continent}>
              <div className={styles.devRow}>
                <span className={styles.devRowLabel}>{continent} ({regions.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {regions.map((r) => {
                  const isRec = r.recommendedStart;
                  return (
                    <button
                      key={r.id}
                      className={styles.btn}
                      style={{
                        flex: '1 1 calc(20% - 4px)',
                        minWidth: 110,
                        textAlign: 'left',
                        borderLeft: isRec ? '3px solid #5cb85c' : undefined,
                      }}
                      onClick={() => handleSelectRegion(r)}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 12 }}>
                        {r.name}
                        {isRec && <span style={{ color: '#5cb85c', fontSize: 10, marginLeft: 4 }}>★</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#888' }}>
                        {r.population}M · ${r.gdpPerCapita.toLocaleString()} · 税率{r.taxRate}%
                      </div>
                      <div style={{ fontSize: 10, color: '#666' }}>
                        人才{r.talentIndex} · 算力{r.computeIndex} · 语言{r.primaryLanguages.join(',')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
