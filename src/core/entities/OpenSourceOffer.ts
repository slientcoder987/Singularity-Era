/**
 * 开源技术采纳要约
 *
 * 由 open_source 策略的竞争对手（Menta / Mistral / ShallowFind）触发。
 * 每 30~60 天开源一次，玩家有 14 天窗口期采纳。
 *
 * 采纳成本 $50k~$200k，初始 maturity=30（比研发完成的 50 低，需本地化适配）。
 */
export interface OpenSourceOffer {
  id: string;
  /** 技术 id（可能来自 OPEN_SOURCE_TECH_POOL 或主技术树） */
  techId: string;
  /** 技术名（UI 展示用） */
  techName: string;
  /** 技术描述（UI 展示用） */
  techDescription: string;
  /** 开源方（竞争对手名） */
  source: string;
  /** 开源日期（游戏天数） */
  publishedDay: number;
  /** 采纳成本（美元） */
  adoptionCost: number;
  /** 初始成熟度（通常 30） */
  initialMaturity: number;
  /** 过期日期（publishedDay + 14） */
  expiresDay: number;
  /** 采纳日期（未采纳为 undefined） */
  adoptedDay?: number;
}
