/**
 * 开源技术采纳要约
 *
 * 由 open_source 策略的竞争对手（Menta / Mistral / ShallowFind）触发。
 * 每 30~60 天开源一次，玩家有 14 天窗口期采纳。
 *
 * PR-D：初始成熟度随机 20~40（开源代码需本地化适配，所以初始较低但比创意 idea 高）。
 * 采纳成本 $50k~$200k。
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
  /** 初始成熟度（PR-D：随机 20~40） */
  initialMaturity: number;
  /** 过期日期（publishedDay + 14） */
  expiresDay: number;
  /** 采纳日期（未采纳为 undefined） */
  adoptedDay?: number;
}
