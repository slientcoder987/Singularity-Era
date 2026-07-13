import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useGameState } from '../hooks/useGameState';
import { EnterRegionCommand, PublishInRegionCommand } from '../../core/commands/RegionCommands';
import {
  SetTokenPricingCommand,
  SetDowngradeLevelCommand,
  ToggleStealUserDataCommand,
  ToggleSkipSafetyCommand,
  RaiseFundingCommand,
} from '../../core/commands/OperationsCommands';
import {
  AcquireCompetitorCommand,
  PoachTalentCommand,
  AssaultKeyPersonnelCommand,
  HackParametersCommand,
  InfiltrateCorpCommand,
} from '../../core/commands/HostileCommands';
import { calcValuation } from '../../core/utils/marketCalc';
import { REGION_MAP, LANGUAGE_NAMES, getRegionsByContinent } from '../../core/config/regions';
import styles from '../styles/App.module.css';

type BizTab = 'regions' | 'operations' | 'funding' | 'competitive';

const BIZ_TABS: { key: BizTab; label: string }[] = [
  { key: 'regions', label: '地区' },
  { key: 'operations', label: '运营' },
  { key: 'funding', label: '融资' },
  { key: 'competitive', label: '竞争' },
];

export function BusinessPanel() {
  const [tab, setTab] = useState<BizTab>('regions');
  const game = useGame();
  const headquartersRegionId = useGameState((s) => s.headquartersRegionId);
  const operatingRegionIds = useGameState((s) => s.operatingRegionIds);
  const publishedRegions = useGameState((s) => s.publishedRegions);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  return (
    <section className={styles.devPanel}>
      <h3 className={styles.devTitle}>经营</h3>

      <div className={styles.empFilter}>
        {BIZ_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.empFilterBtn} ${tab === t.key ? styles.empFilterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'regions' && (
        <RegionsTab
          game={game}
          headquartersRegionId={headquartersRegionId}
          operatingRegionIds={operatingRegionIds}
          publishedRegions={publishedRegions}
          funds={funds}
        />
      )}
      {tab === 'operations' && <OperationsTab game={game} />}
      {tab === 'funding' && <FundingTab game={game} />}
      {tab === 'competitive' && <CompetitiveTab game={game} />}
    </section>
  );
}

/* ============== 地区 ============== */

function RegionsTab({
  game, headquartersRegionId, operatingRegionIds, publishedRegions, funds,
}: {
  game: ReturnType<typeof useGame>;
  headquartersRegionId: string | null;
  operatingRegionIds: string[];
  publishedRegions: string[];
  funds: number;
}) {
  const hq = headquartersRegionId ? REGION_MAP[headquartersRegionId] : null;
  const groups = getRegionsByContinent();

  return (
    <div className={styles.tabBody}>
      {hq ? (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel}>总部</span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0, color: '#7ab8e0' }}>
              {hq.name}
            </span>
            <span className={styles.devHint}>{hq.country} · {hq.continent}</span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devHint}>
              人口 {hq.population}M · GDP ${hq.gdpPerCapita.toLocaleString()} · 税率 {hq.taxRate}% · 人才 {hq.talentIndex}
            </span>
          </div>
          <div className={styles.devRow}>
            <span className={styles.devHint}>
              语言: {hq.primaryLanguages.map((l) => LANGUAGE_NAMES[l] ?? l).join('、')}
              {hq.dataLocalization && ' · 需本地化'} {hq.censorshipLevel >= 6 && ' · 审查严格'}
            </span>
          </div>
        </>
      ) : (
        <div className={styles.emptyHint}>尚未选择总部地区</div>
      )}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>已运营 ({operatingRegionIds.length})</span>
      </div>
      {operatingRegionIds.map((rid) => {
        const r = REGION_MAP[rid];
        if (!r) return null;
        const isPublished = publishedRegions.includes(rid);
        return (
          <div key={rid} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              {rid === headquartersRegionId ? '🏢 ' : '· '}{r.name}
            </span>
            <span className={styles.devHint}>{r.population}M · 税率{r.taxRate}%</span>
            {isPublished ? (
              <span className={styles.devHint} style={{ color: '#5cb85c' }}>已发布</span>
            ) : (
              <button className={styles.btn} onClick={() => game.executeCommand(new PublishInRegionCommand(rid))}>发布</button>
            )}
          </div>
        );
      })}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '12px' }}>扩展市场</span>
      </div>
      {Object.entries(groups).map(([continent, regions]) => {
        const other = regions.filter((r) => !operatingRegionIds.includes(r.id));
        if (other.length === 0) return null;
        return (
          <div key={continent}>
            <div className={styles.devRow}><span className={styles.devHint} style={{ color: '#888' }}>{continent}</span></div>
            {other.map((r) => {
              const cost = 100_000 + r.marketEntryDifficulty * 50_000;
              return (
                <div key={r.id} className={styles.devRow}>
                  <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· {r.name}</span>
                  <span className={styles.devHint}>{r.population}M · {r.primaryLanguages.map((l) => LANGUAGE_NAMES[l] ?? l).join('/')}</span>
                  <span className={styles.devHint} style={{ minWidth: '80px', color: funds >= cost ? '#e6f0ff' : '#ff6b6b' }}>${cost.toLocaleString()}</span>
                  <button className={styles.btn} disabled={funds < cost} onClick={() => game.executeCommand(new EnterRegionCommand(r.id))}>进入</button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ============== 竞争（情报 + 激进操作） ============== */

function CompetitiveTab({ game }: { game: ReturnType<typeof useGame> }) {
  const competitorStates = useGameState((s) => (s as any).competitorStates ?? []);
  const externalCorps = useGameState((s) => (s as any).externalCorps ?? []);
  const funds = useGameState((s) => s.resources['funds'] ?? 0);

  return (
    <div className={styles.tabBody}>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>竞争对手动态 ({competitorStates.length})</span>
      </div>
      {competitorStates.map((c: any) => {
        const avgCap = Object.values(c.capabilities as Record<string, number>).reduce((s: number, v: number) => s + v, 0) / 16;
        return (
          <div key={c.id} className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
              · {c.name} ({c.strategy})
            </span>
            <span className={styles.devHint}>
              能力{avgCap.toFixed(0)} · {c.computeUnits}卡 · {c.headcount}人 · 训练{c.trainingProgress.toFixed(0)}%
              {c.infiltrationLevel > 0 && ` · 渗透Lv${c.infiltrationLevel}`}
            </span>
          </div>
        );
      })}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '12px' }}>最新情报</span>
      </div>
      {competitorStates.flatMap((c: any) => c.intel).slice(-10).reverse().map((intel: any) => (
        <div key={intel.id} className={styles.devRow}>
          <span className={styles.devHint} style={{ color: intel.severity === 'critical' ? '#ff6b6b' : intel.severity === 'warning' ? '#f0ad4e' : '#888' }}>
            [{intel.day}天] {intel.title}: {intel.description}
          </span>
        </div>
      ))}
      {!competitorStates.some((c: any) => c.intel.length > 0) && (
        <div className={styles.emptyHint}>暂无情报 · 渗透竞争对手以获得研发动态</div>
      )}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '12px', color: '#ff6b6b' }}>激进操作</span>
      </div>

      {competitorStates.map((c: any) => {
        const avgCap = Object.values(c.capabilities as Record<string, number>).reduce((s: number, v: number) => s + v, 0) / 16;
        const valuation = c.funds * 10 + c.computeUnits * 0.5 + c.headcount * 0.2 + avgCap * 2;
        const acqCost = Math.floor(valuation * 1.5);
        return (
          <div key={c.id}>
            <div className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>{c.name}</span>
              <span className={styles.devHint}>估值 ${valuation.toFixed(0)}M</span>
            </div>
            <div className={styles.devRow}>
              <button className={styles.btn} disabled={funds < acqCost} onClick={() => game.executeCommand(new AcquireCompetitorCommand(c.id, acqCost))}>
                收购 (${acqCost}M)
              </button>
              <button className={styles.btn} disabled={funds < 50} onClick={() => game.executeCommand(new PoachTalentCommand(c.id, 50))}>
                挖角 ($50M)
              </button>
              <button className={styles.btn} style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => {
                if (confirm('确定对 ' + c.name + ' 采取极端手段？高风险！暴露则游戏结束！')) {
                  game.executeCommand(new AssaultKeyPersonnelCommand(c.id));
                }
              }}>
                袭击
              </button>
              <button className={styles.btn} style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => {
                if (confirm('确定黑入 ' + c.name + ' 窃取模型参数？暴露将面临国际刑事指控！')) {
                  game.executeCommand(new HackParametersCommand(c.id));
                }
              }}>
                黑客
              </button>
            </div>
          </div>
        );
      })}

      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '12px' }}>外部企业渗透</span>
      </div>
      {externalCorps.map((corp: any) => (
        <div key={corp.id} className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
            · {corp.name} ({corp.industry})
          </span>
          <span className={styles.devHint}>
            持股 {(corp.playerEquity * 100).toFixed(1)}% · 难度{corp.infiltrationDifficulty}
            {corp.effects.gpuDiscount > 0 && ` · GPU${(corp.effects.gpuDiscount * 100).toFixed(0)}%折`}
            {corp.effects.defenseAccess && ' · 安全许可'}
          </span>
          <button className={styles.btn} disabled={funds < corp.minInvestment} onClick={() => game.executeCommand(new InfiltrateCorpCommand(corp.id, corp.minInvestment))}>
            渗透 (${corp.minInvestment}M)
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============== 运营（Token + 欺骗） ============== */

function OperationsTab({ game }: { game: ReturnType<typeof useGame> }) {
  const ops = useGameState((s) => s.operations);
  const dailyRevenue = ops?.dailyRevenue ?? 0;
  const tokenRevenue = ops?.tokenRevenue ?? 0;
  const markets = ops?.markets ?? [];
  const pricing = ops?.tokenPricing ?? { pricePerMillion: 0.01, inferenceAllocation: 0 };
  const deception = ops?.deception ?? { downgradeLevel: 0, stealUserData: false, skipSafetyTesting: false, detectionProbability: 0, totalDeceptions: 0 };

  const [price, setPrice] = useState(pricing.pricePerMillion);
  const [alloc, setAlloc] = useState(pricing.inferenceAllocation);

  const handlePricing = () => {
    game.executeCommand(new SetTokenPricingCommand(price, alloc));
  };

  return (
    <div className={styles.tabBody}>
      {/* 收入概览 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>收入概览</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
          市场收入: <span style={{ color: '#5cb85c' }}>${dailyRevenue.toFixed(0)}/天</span>
        </span>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
          Token: <span style={{ color: '#7ab8e0' }}>${tokenRevenue.toFixed(0)}/天</span>
        </span>
      </div>

      {/* 各市场详情 */}
      {markets.filter((m) => m.marketShare > 0.01).map((m) => (
        <div key={m.regionId} className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: 0 }}>· {m.regionName}</span>
          <span className={styles.devHint}>
            份额 {(m.marketShare * 100).toFixed(1)}% · ${m.dailyRevenue.toFixed(0)}/天 · ${m.pricePerMillion.toFixed(3)}/1M tokens
          </span>
        </div>
      ))}
      {markets.length > 0 && markets[0].competitors.length > 0 && (
        <div className={styles.devRow}>
          <span className={styles.devHint}>
            竞争者: {markets[0].competitors.slice(0, 4).map((c) => `${c.name}(${(c.share * 100).toFixed(0)}%)`).join(' ')}
          </span>
        </div>
      )}

      {/* Token 定价 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '12px' }}>Token 售卖</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devHint}>单价($/1M tokens)</span>
        <input className={styles.input} type="number" min={0.001} step={0.001} value={price} onChange={(e) => setPrice(Number(e.target.value))} style={{ width: '80px' }} />
        <span className={styles.devHint}>推理分配</span>
        <input className={styles.input} type="number" min={0} max={1} step={0.05} value={alloc} onChange={(e) => setAlloc(Number(e.target.value))} style={{ width: '60px' }} />
        <button className={styles.btn} onClick={handlePricing}>应用</button>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devHint}>
          参考市价: ${(markets[0]?.pricePerMillion ?? 0.01).toFixed(3)}/1M tokens · 推理使用集群总算力×分配比例
        </span>
      </div>

      {/* 欺骗操作 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '12px', color: '#ff6b6b' }}>不道德操作</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
          降低模型质量（省算力20%/档，日流失+1%/档）
        </span>
        <select className={styles.select} value={deception.downgradeLevel} onChange={(e) => game.executeCommand(new SetDowngradeLevelCommand(Number(e.target.value)))}>
          <option value={0}>不降级</option>
          <option value={1}>轻度 (-15%)</option>
          <option value={2}>中度 (-30%)</option>
          <option value={3}>重度 (-45%)</option>
        </select>
      </div>
      <div className={styles.devRow}>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input type="checkbox" checked={deception.stealUserData} onChange={(e) => game.executeCommand(new ToggleStealUserDataCommand(e.target.checked))} />
          <span className={styles.devRowLabel} style={{ minWidth: 0 }}>偷用全量用户数据（+0.5B/天，risk↑）</span>
        </label>
      </div>
      <div className={styles.devRow}>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input type="checkbox" checked={deception.skipSafetyTesting} onChange={(e) => game.executeCommand(new ToggleSkipSafetyCommand(e.target.checked))} />
          <span className={styles.devRowLabel} style={{ minWidth: 0 }}>跳过安全测试（部署加速）</span>
        </label>
      </div>
      {deception.detectionProbability > 0 && (
        <div className={styles.devRow}>
          <span className={styles.devHint} style={{ color: '#ff6b6b' }}>
            被发现概率: {(deception.detectionProbability * 100).toFixed(1)}%/天 · 已累计 {deception.totalDeceptions} 次暴露
          </span>
        </div>
      )}
    </div>
  );
}

/* ============== 融资 ============== */

function FundingTab({ game }: { game: ReturnType<typeof useGame> }) {
  const models = useGameState((s) => s.models);
  const ops = useGameState((s) => s.operations);
  const hqId = useGameState((s) => s.headquartersRegionId);
  const fundingRounds = useGameState((s) => s.fundingRounds);
  const missions = ops?.boardMissions ?? [];

  const bestCap = models.length > 0 ? Math.max(...models.map((m) => m.baseScore)) : 0;
  const annualRevenue = (ops?.dailyRevenue ?? 0) * 365;
  const valuation = calcValuation(annualRevenue, bestCap, hqId);

  return (
    <div className={styles.tabBody}>
      {/* 估值 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel}>公司估值</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0, color: '#5cb85c', fontSize: '16px' }}>
          ${valuation.toFixed(1)}M
        </span>
        <span className={styles.devHint}>
          基础 $100M × 收入 {(1 + annualRevenue / 10).toFixed(2)}× × 能力 {(1 + bestCap / 1000).toFixed(2)}×
        </span>
      </div>

      {/* 融资历史 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '8px' }}>融资历史 ({fundingRounds.length})</span>
      </div>
      {fundingRounds.map((r) => (
        <div key={r.id} className={styles.devRow}>
          <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
            · {r.investorName} ({r.type})
          </span>
          <span className={styles.devHint}>
            ${r.amount.toFixed(1)}M · 估值 ${r.valuationAtRound.toFixed(1)}M
            {r.terms.stockPrice && ` · 股价 $${r.terms.stockPrice.toFixed(2)}`}
          </span>
        </div>
      ))}

      {/* 融资操作 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ marginTop: '12px' }}>新一轮融资</span>
      </div>

      {/* 战略投资 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
          战略投资: MicroHard
        </span>
        <span className={styles.devHint}>${(valuation * 0.08).toFixed(1)}M · 算力折扣30% · 排他+技术配合</span>
        <button className={styles.btn} onClick={() => game.executeCommand(new RaiseFundingCommand({
          type: 'strategic',
          investorName: 'MicroHard',
          terms: { computeDiscount: 0.3, exclusivityRequired: true, techAlignment: 'Cloud优先', boardSeats: 1 },
        }))}>融资</button>
      </div>

      {/* VC */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
          VC: b16z
        </span>
        <span className={styles.devHint}>${(valuation * 0.15).toFixed(1)}M · 对赌: 365天达$100M年收入 · 失败稀释15%</span>
        <button className={styles.btn} onClick={() => game.executeCommand(new RaiseFundingCommand({
          type: 'venture_capital',
          investorName: 'b16z',
          terms: { vamRevenueTarget: 100, vamDeadlineDays: 365, vamDilutionPercent: 15, boardSeats: 2 },
        }))}>融资</button>
      </div>

      {/* 政府基金 */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
          政府基金: DARPHA
        </span>
        <span className={styles.devHint}>${(valuation * 0.04).toFixed(1)}M · 国家安全审查 · 对共和国禁售</span>
        <button className={styles.btn} onClick={() => game.executeCommand(new RaiseFundingCommand({
          type: 'government',
          investorName: 'DARPHA',
          terms: { restrictedMarkets: ['cn-east', 'cn-south', 'cn-north', 'cn-inland'], securityReviewRequired: true, boardSeats: 1 },
        }))}>融资</button>
      </div>

      {/* IPO */}
      <div className={styles.devRow}>
        <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
          IPO
        </span>
        <span className={styles.devHint}>${(valuation * 0.30).toFixed(1)}M · 季度披露 · 股价波动 ±3%/天 · 做空风险</span>
        <button
          className={styles.btn}
          disabled={fundingRounds.some((r) => r.type === 'ipo' && r.active)}
          onClick={() => game.executeCommand(new RaiseFundingCommand({
            type: 'ipo',
            investorName: '纳斯达克',
            terms: { ipoPrice: valuation * 0.01, stockPrice: valuation * 0.01, shortSellRisk: 0.02, boardSeats: 3 },
          }))}
        >
          {fundingRounds.some((r) => r.type === 'ipo' && r.active) ? '已上市' : 'IPO'}
        </button>
      </div>

      {/* 董事会指令 */}
      {missions.length > 0 && (
        <>
          <div className={styles.devRow}>
            <span className={styles.devRowLabel} style={{ marginTop: '12px' }}>董事会指令 ({missions.length})</span>
          </div>
          {missions.map((m) => (
            <div key={m.id} className={styles.devRow}>
              <span className={styles.devRowLabel} style={{ minWidth: 0 }}>
                · {m.title}
              </span>
              <span className={styles.devHint} style={{ color: m.status === 'failed' ? '#ff6b6b' : m.status === 'completed' ? '#5cb85c' : '#888' }}>
                {m.status} {m.deadline > 0 && `· 截止第${m.deadline}天`}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
