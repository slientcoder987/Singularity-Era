/**
 * 地区系统配置
 *
 * 世界分为 33 个地区，每个地区有独立的人口、经济、语言、监管环境等属性。
 * 玩家开局选择一个地区建立总部，后续可向其他地区扩展市场。
 *
 * 设计原则：
 * - 大国可按经济/科技重心细分（合众国4区、共和国4区、东南亚3区）
 * - 经济不发达地区按大区简并（非洲1区）
 * - 同一国家不同地区政策统一，差异体现在经济/人才/市场
 */

// ============================================================
// 类型定义
// ============================================================

/** 地区 ID */
export type RegionId = string;

/** 语言代码（ISO 639-1 为主，部分加地区后缀） */
export type LanguageCode = string;

/** 地区数据 */
export interface Region {
  /** 唯一标识 */
  id: RegionId;
  /** 地区名称 */
  name: string;
  /** 所属国家/经济体 */
  country: string;
  /** 所属大区 */
  continent: string;

  // ---- 市场属性 ----
  /** 人口（百万人） */
  population: number;
  /** 人均 GDP（美元） */
  gdpPerCapita: number;
  /** 互联网普及率（0-100），互联网用户 = population × 0.01 × internetPenetration */
  internetPenetration: number;
  /** 科技采纳速度（0-10） */
  techAdoption: number;
  /** 市场进入难度（0-10） */
  marketEntryDifficulty: number;

  // ---- 监管属性 ----
  /** AI 监管严格度（0-10） */
  regulationLevel: number;
  /** 数据本地化要求 */
  dataLocalization: boolean;
  /** 内容审查严格度（0-10） */
  censorshipLevel: number;
  /** 企业税率（%） */
  taxRate: number;

  // ---- 资源属性 ----
  /** 人才储备指数（0-100） */
  talentIndex: number;
  /** 算力可及指数（0-100） */
  computeIndex: number;
  /** 能源成本指数（0-100），越低越便宜 */
  energyCostIndex: number;

  // ---- 语言文化 ----
  /** 主要语言列表 */
  primaryLanguages: LanguageCode[];
  /** 文化适配需求度（0-10） */
  culturalSensitivity: number;

  // ---- 推荐 ----
  /** 是否推荐为开局地区 */
  recommendedStart: boolean;
  /** 推荐理由 */
  startReason?: string;
}

// ============================================================
// 语言代码映射
// ============================================================

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  'en': '英语',
  'en-GB': '英语（英式）',
  'zh-CN': '中文（简体）',
  'zh-TW': '中文（繁体）',
  'ja': '日语',
  'ko': '韩语',
  'de': '德语',
  'fr': '法语',
  'es': '西班牙语',
  'pt': '葡萄牙语',
  'pt-BR': '葡萄牙语（巴西）',
  'it': '意大利语',
  'nl': '荷兰语',
  'sv': '瑞典语',
  'da': '丹麦语',
  'no': '挪威语',
  'fi': '芬兰语',
  'ru': '俄语',
  'ar': '阿拉伯语',
  'he': '希伯来语',
  'hi': '印地语',
  'bn': '孟加拉语',
  'ta': '泰米尔语',
  'th': '泰语',
  'vi': '越南语',
  'id': '印尼语',
  'ms': '马来语',
  'tl': '菲律宾语',
  'sw': '斯瓦希里语',
  'tr': '土耳其语',
};

// ============================================================
// 33 个地区详细数据
// ============================================================

export const REGIONS: Region[] = [
  // ========================
  // 北美 (5)
  // ========================
  {
    id: 'us-west',
    name: '美国西海岸',
    country: '合众国',
    continent: '北美',
    population: 51.2,
    gdpPerCapita: 92000,
    internetPenetration: 96,
    techAdoption: 10,
    marketEntryDifficulty: 3,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 28,
    talentIndex: 98,
    computeIndex: 95,
    energyCostIndex: 45,
    primaryLanguages: ['en'],
    culturalSensitivity: 2,
    recommendedStart: true,
    startReason: '硅谷所在地，全球顶尖 AI 人才密度最高，算力供应充足，市场开放度高',
  },
  {
    id: 'us-northeast',
    name: '美国东北部',
    country: '合众国',
    continent: '北美',
    population: 57.6,
    gdpPerCapita: 85000,
    internetPenetration: 94,
    techAdoption: 9,
    marketEntryDifficulty: 3,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 28,
    talentIndex: 95,
    computeIndex: 88,
    energyCostIndex: 55,
    primaryLanguages: ['en'],
    culturalSensitivity: 2,
    recommendedStart: true,
    startReason: '纽约+波士顿，金融资本雄厚，MIT/Harvard 顶级学术资源，金融AI市场巨大',
  },
  {
    id: 'us-south',
    name: '美国南部',
    country: '合众国',
    continent: '北美',
    population: 68.3,
    gdpPerCapita: 62000,
    internetPenetration: 91,
    techAdoption: 7,
    marketEntryDifficulty: 2,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 21,
    talentIndex: 65,
    computeIndex: 72,
    energyCostIndex: 30,
    primaryLanguages: ['en'],
    culturalSensitivity: 3,
    recommendedStart: false,
  },
  {
    id: 'us-midwest',
    name: '美国中西部',
    country: '合众国',
    continent: '北美',
    population: 46.1,
    gdpPerCapita: 58000,
    internetPenetration: 89,
    techAdoption: 6,
    marketEntryDifficulty: 2,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 25,
    talentIndex: 60,
    computeIndex: 60,
    energyCostIndex: 35,
    primaryLanguages: ['en'],
    culturalSensitivity: 3,
    recommendedStart: false,
  },
  {
    id: 'ca',
    name: '加拿大',
    country: '加拿大',
    continent: '北美',
    population: 39.5,
    gdpPerCapita: 55000,
    internetPenetration: 95,
    techAdoption: 8,
    marketEntryDifficulty: 3,
    regulationLevel: 6,
    dataLocalization: true,
    censorshipLevel: 2,
    taxRate: 26,
    talentIndex: 80,
    computeIndex: 65,
    energyCostIndex: 20,
    primaryLanguages: ['en', 'fr'],
    culturalSensitivity: 3,
    recommendedStart: false,
  },

  // ========================
  // 东亚 (7)
  // ========================
  {
    id: 'cn-east',
    name: '中国长三角',
    country: '共和国',
    continent: '东亚',
    population: 175.2,
    gdpPerCapita: 24000,
    internetPenetration: 92,
    techAdoption: 9,
    marketEntryDifficulty: 6,
    regulationLevel: 8,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 88,
    computeIndex: 70,
    energyCostIndex: 40,
    primaryLanguages: ['zh-CN'],
    culturalSensitivity: 5,
    recommendedStart: true,
    startReason: '上海+杭州+苏州，中国最大经济体量，互联网产业成熟，用户基数极大',
  },
  {
    id: 'cn-south',
    name: '中国珠三角',
    country: '共和国',
    continent: '东亚',
    population: 86.2,
    gdpPerCapita: 22500,
    internetPenetration: 95,
    techAdoption: 9,
    marketEntryDifficulty: 6,
    regulationLevel: 8,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 85,
    computeIndex: 75,
    energyCostIndex: 38,
    primaryLanguages: ['zh-CN'],
    culturalSensitivity: 5,
    recommendedStart: true,
    startReason: '深圳+广州，硬件产业链完善，华为/腾讯总部所在，算力硬件优势明显',
  },
  {
    id: 'cn-north',
    name: '中国京津冀',
    country: '共和国',
    continent: '东亚',
    population: 112.4,
    gdpPerCapita: 19000,
    internetPenetration: 88,
    techAdoption: 8,
    marketEntryDifficulty: 7,
    regulationLevel: 9,
    dataLocalization: true,
    censorshipLevel: 9,
    taxRate: 25,
    talentIndex: 90,
    computeIndex: 65,
    energyCostIndex: 50,
    primaryLanguages: ['zh-CN'],
    culturalSensitivity: 5,
    recommendedStart: true,
    startReason: '北京+天津，中国政策中心+科研重镇，清华北大顶级高校，AI 论文产出全球领先',
  },
  {
    id: 'cn-inland',
    name: '中国内陆',
    country: '共和国',
    continent: '东亚',
    population: 435.6,
    gdpPerCapita: 11000,
    internetPenetration: 76,
    techAdoption: 6,
    marketEntryDifficulty: 5,
    regulationLevel: 8,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 55,
    computeIndex: 45,
    energyCostIndex: 42,
    primaryLanguages: ['zh-CN'],
    culturalSensitivity: 4,
    recommendedStart: false,
  },
  {
    id: 'jp',
    name: '日本',
    country: '日本',
    continent: '东亚',
    population: 123.5,
    gdpPerCapita: 35000,
    internetPenetration: 93,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 30,
    talentIndex: 82,
    computeIndex: 72,
    energyCostIndex: 85,
    primaryLanguages: ['ja'],
    culturalSensitivity: 8,
    recommendedStart: true,
    startReason: '高消费力市场，付费意愿强，企业AI需求旺盛，但语言壁垒高',
  },
  {
    id: 'kr',
    name: '韩国',
    country: '韩国',
    continent: '东亚',
    population: 51.7,
    gdpPerCapita: 34000,
    internetPenetration: 97,
    techAdoption: 9,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: true,
    censorshipLevel: 5,
    taxRate: 27,
    talentIndex: 78,
    computeIndex: 70,
    energyCostIndex: 70,
    primaryLanguages: ['ko'],
    culturalSensitivity: 7,
    recommendedStart: false,
  },
  {
    id: 'tw',
    name: '中国台湾',
    country: '中国台湾',
    continent: '东亚',
    population: 23.4,
    gdpPerCapita: 33000,
    internetPenetration: 92,
    techAdoption: 8,
    marketEntryDifficulty: 4,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 20,
    talentIndex: 78,
    computeIndex: 85,
    energyCostIndex: 65,
    primaryLanguages: ['zh-TW'],
    culturalSensitivity: 4,
    recommendedStart: false,
  },

  // ========================
  // 东南亚 (3)
  // ========================
  {
    id: 'sg',
    name: '新加坡',
    country: '新加坡',
    continent: '东南亚',
    population: 5.9,
    gdpPerCapita: 85000,
    internetPenetration: 98,
    techAdoption: 9,
    marketEntryDifficulty: 2,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 4,
    taxRate: 17,
    talentIndex: 72,
    computeIndex: 80,
    energyCostIndex: 75,
    primaryLanguages: ['en', 'zh-CN', 'ms'],
    culturalSensitivity: 4,
    recommendedStart: false,
  },
  {
    id: 'indo-china',
    name: '中南半岛',
    country: '越/泰/缅/柬/老',
    continent: '东南亚',
    population: 252.4,
    gdpPerCapita: 6500,
    internetPenetration: 70,
    techAdoption: 6,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 5,
    taxRate: 22,
    talentIndex: 30,
    computeIndex: 30,
    energyCostIndex: 52,
    primaryLanguages: ['vi', 'th', 'en'],
    culturalSensitivity: 7,
    recommendedStart: false,
  },
  {
    id: 'malay',
    name: '马来群岛',
    country: '印尼/马来/菲律宾/文莱',
    continent: '东南亚',
    population: 431.8,
    gdpPerCapita: 5500,
    internetPenetration: 74,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 4,
    taxRate: 22,
    talentIndex: 32,
    computeIndex: 32,
    energyCostIndex: 56,
    primaryLanguages: ['id', 'ms', 'tl', 'en'],
    culturalSensitivity: 7,
    recommendedStart: false,
  },

  // ========================
  // 南亚 (2)
  // ========================
  {
    id: 'in',
    name: '印度',
    country: '印度',
    continent: '南亚',
    population: 1441.7,
    gdpPerCapita: 2800,
    internetPenetration: 55,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: true,
    censorshipLevel: 5,
    taxRate: 30,
    talentIndex: 72,
    computeIndex: 40,
    energyCostIndex: 50,
    primaryLanguages: ['hi', 'en', 'bn', 'ta'],
    culturalSensitivity: 8,
    recommendedStart: false,
  },
  {
    id: 'sa-other',
    name: '南亚其他',
    country: '南亚各国',
    continent: '南亚',
    population: 472.8,
    gdpPerCapita: 1800,
    internetPenetration: 38,
    techAdoption: 3,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 5,
    taxRate: 28,
    talentIndex: 18,
    computeIndex: 18,
    energyCostIndex: 60,
    primaryLanguages: ['bn', 'en', 'hi'],
    culturalSensitivity: 7,
    recommendedStart: false,
  },

  // ========================
  // 欧洲 (7)
  // ========================
  {
    id: 'uk',
    name: '英国与爱尔兰',
    country: '英国/爱尔兰',
    continent: '欧洲',
    population: 72.5,
    gdpPerCapita: 48000,
    internetPenetration: 96,
    techAdoption: 8,
    marketEntryDifficulty: 4,
    regulationLevel: 6,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 25,
    talentIndex: 85,
    computeIndex: 72,
    energyCostIndex: 60,
    primaryLanguages: ['en', 'en-GB'],
    culturalSensitivity: 2,
    recommendedStart: true,
    startReason: 'DeepMine 发源地，AI 研究底蕴深厚，英语母语市场，脱欧后监管相对独立',
  },
  {
    id: 'fr',
    name: '法国与低地',
    country: '法国/比/荷/卢',
    continent: '欧洲',
    population: 98.3,
    gdpPerCapita: 48000,
    internetPenetration: 93,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 8,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 28,
    talentIndex: 78,
    computeIndex: 65,
    energyCostIndex: 50,
    primaryLanguages: ['fr', 'nl', 'en'],
    culturalSensitivity: 6,
    recommendedStart: true,
    startReason: 'Mistral AI 发源地+巴黎顶尖数学人才，EU AI Act 总部所在地，低地国家英语普及率高',
  },
  {
    id: 'de',
    name: '德国',
    country: '德国/奥地利/瑞士',
    continent: '欧洲',
    population: 102.1,
    gdpPerCapita: 55000,
    internetPenetration: 95,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 7,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 30,
    talentIndex: 82,
    computeIndex: 68,
    energyCostIndex: 55,
    primaryLanguages: ['de', 'en'],
    culturalSensitivity: 5,
    recommendedStart: false,
  },
  {
    id: 'iberia',
    name: '伊比利亚半岛',
    country: '西班牙/葡萄牙',
    continent: '欧洲',
    population: 58.2,
    gdpPerCapita: 32000,
    internetPenetration: 91,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 25,
    talentIndex: 50,
    computeIndex: 45,
    energyCostIndex: 52,
    primaryLanguages: ['es', 'pt'],
    culturalSensitivity: 4,
    recommendedStart: false,
  },
  {
    id: 'eu-north',
    name: '北欧',
    country: '瑞典/挪威/丹麦/芬兰',
    continent: '欧洲',
    population: 27.5,
    gdpPerCapita: 62000,
    internetPenetration: 97,
    techAdoption: 9,
    marketEntryDifficulty: 3,
    regulationLevel: 6,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 22,
    talentIndex: 75,
    computeIndex: 62,
    energyCostIndex: 15,
    primaryLanguages: ['sv', 'da', 'no', 'fi', 'en'],
    culturalSensitivity: 4,
    recommendedStart: false,
  },
  {
    id: 'eu-south',
    name: '南欧',
    country: '意大利/希腊',
    continent: '欧洲',
    population: 68.5,
    gdpPerCapita: 33000,
    internetPenetration: 87,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 27,
    talentIndex: 52,
    computeIndex: 48,
    energyCostIndex: 60,
    primaryLanguages: ['it'],
    culturalSensitivity: 5,
    recommendedStart: false,
  },
  {
    id: 'eu-east',
    name: '中东欧',
    country: '波兰/捷克/罗马尼亚等',
    continent: '欧洲',
    population: 95.3,
    gdpPerCapita: 18500,
    internetPenetration: 82,
    techAdoption: 5,
    marketEntryDifficulty: 3,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 19,
    talentIndex: 48,
    computeIndex: 38,
    energyCostIndex: 48,
    primaryLanguages: ['en', 'de'],
    culturalSensitivity: 5,
    recommendedStart: false,
  },

  // ========================
  // 中东与北非 (4)
  // ========================
  {
    id: 'il',
    name: '以色列',
    country: '以色列',
    continent: '中东',
    population: 9.7,
    gdpPerCapita: 55000,
    internetPenetration: 95,
    techAdoption: 9,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: true,
    censorshipLevel: 4,
    taxRate: 23,
    talentIndex: 78,
    computeIndex: 72,
    energyCostIndex: 55,
    primaryLanguages: ['he', 'ar', 'en'],
    culturalSensitivity: 5,
    recommendedStart: false,
  },
  {
    id: 'sa',
    name: '沙特与海湾',
    country: '沙特/阿联酋/卡塔尔/科威特',
    continent: '中东',
    population: 45.1,
    gdpPerCapita: 38000,
    internetPenetration: 88,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 6,
    dataLocalization: true,
    censorshipLevel: 7,
    taxRate: 15,
    talentIndex: 28,
    computeIndex: 50,
    energyCostIndex: 12,
    primaryLanguages: ['ar', 'en'],
    culturalSensitivity: 8,
    recommendedStart: false,
  },
  {
    id: 'me-other',
    name: '中东其他',
    country: '伊朗/伊拉克/约旦/叙利亚等',
    continent: '中东',
    population: 74.2,
    gdpPerCapita: 7500,
    internetPenetration: 62,
    techAdoption: 3,
    marketEntryDifficulty: 7,
    regulationLevel: 7,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 18,
    computeIndex: 18,
    energyCostIndex: 25,
    primaryLanguages: ['ar', 'tr'],
    culturalSensitivity: 8,
    recommendedStart: false,
  },
  {
    id: 'naf',
    name: '北非',
    country: '埃及/摩洛哥/阿尔及利亚/突尼斯',
    continent: '中东',
    population: 216.3,
    gdpPerCapita: 4800,
    internetPenetration: 55,
    techAdoption: 3,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 6,
    taxRate: 25,
    talentIndex: 15,
    computeIndex: 15,
    energyCostIndex: 42,
    primaryLanguages: ['ar', 'fr'],
    culturalSensitivity: 7,
    recommendedStart: false,
  },

  // ========================
  // 拉美 (2)
  // ========================
  {
    id: 'br',
    name: '巴西',
    country: '巴西',
    continent: '南美',
    population: 215.3,
    gdpPerCapita: 9500,
    internetPenetration: 80,
    techAdoption: 6,
    marketEntryDifficulty: 6,
    regulationLevel: 6,
    dataLocalization: true,
    censorshipLevel: 4,
    taxRate: 34,
    talentIndex: 40,
    computeIndex: 30,
    energyCostIndex: 48,
    primaryLanguages: ['pt-BR'],
    culturalSensitivity: 6,
    recommendedStart: false,
  },
  {
    id: 'hispanic',
    name: '西语美洲',
    country: '墨西哥/阿根廷/智利/哥伦比亚等',
    continent: '南美',
    population: 324.6,
    gdpPerCapita: 10200,
    internetPenetration: 71,
    techAdoption: 5,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 30,
    talentIndex: 30,
    computeIndex: 25,
    energyCostIndex: 45,
    primaryLanguages: ['es', 'en'],
    culturalSensitivity: 5,
    recommendedStart: false,
  },

  // ========================
  // 欧亚 (1)
  // ========================
  {
    id: 'ru',
    name: '俄罗斯与独联体',
    country: '俄罗斯/哈萨克斯坦等',
    continent: '欧亚',
    population: 210.5,
    gdpPerCapita: 12000,
    internetPenetration: 82,
    techAdoption: 5,
    marketEntryDifficulty: 7,
    regulationLevel: 7,
    dataLocalization: true,
    censorshipLevel: 7,
    taxRate: 20,
    talentIndex: 55,
    computeIndex: 30,
    energyCostIndex: 18,
    primaryLanguages: ['ru'],
    culturalSensitivity: 6,
    recommendedStart: false,
  },

  // ========================
  // 大洋洲 (1)
  // ========================
  {
    id: 'oce',
    name: '澳新',
    country: '澳大利亚/新西兰',
    continent: '大洋洲',
    population: 31.2,
    gdpPerCapita: 58000,
    internetPenetration: 92,
    techAdoption: 7,
    marketEntryDifficulty: 3,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 30,
    talentIndex: 65,
    computeIndex: 55,
    energyCostIndex: 45,
    primaryLanguages: ['en'],
    culturalSensitivity: 2,
    recommendedStart: false,
  },

  // ========================
  // 非洲 (1) — 撒哈拉以南
  // ========================
  {
    id: 'af',
    name: '撒哈拉以南非洲',
    country: '非洲联盟',
    continent: '非洲',
    population: 1211.2,
    gdpPerCapita: 1800,
    internetPenetration: 30,
    techAdoption: 2,
    marketEntryDifficulty: 6,
    regulationLevel: 3,
    dataLocalization: false,
    censorshipLevel: 5,
    taxRate: 30,
    talentIndex: 8,
    computeIndex: 8,
    energyCostIndex: 58,
    primaryLanguages: ['en', 'fr', 'sw'],
    culturalSensitivity: 7,
    recommendedStart: false,
  },
];

// ============================================================
// 便捷查询
// ============================================================

/** 地区 ID → 地区数据 */
export const REGION_MAP: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);

/** 推荐开局地区 */
export const RECOMMENDED_START_REGIONS = REGIONS.filter((r) => r.recommendedStart);

/** 按大区分组 */
export function getRegionsByContinent(): Record<string, Region[]> {
  const groups: Record<string, Region[]> = {};
  for (const r of REGIONS) {
    (groups[r.continent] ??= []).push(r);
  }
  return groups;
}
