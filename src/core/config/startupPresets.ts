/**
 * 开局预设
 *
 * 玩家在选定总部地区后选择一个预设，决定初始资金、算力卡和员工配置。
 * 预设仅定义增量，基础基础设施（数据中心/集群/节点）由 SetHeadquartersCommand 统一创建。
 */
import { StaffRole } from '../entities/Employee';

/** 算力卡配置 */
export interface PresetCard {
  modelId: string; // 资源 id，如 'compute_a100'
  count: number;
}

/** 员工配置 */
export interface PresetEmployee {
  role: StaffRole;
  level: number;
  count: number;
}

/** 开局预设 */
export interface StartupPreset {
  id: string;
  name: string;
  description: string;
  /** 额外资金（在初始 $1M 基础上叠加） */
  bonusFunds: number;
  /** 初始算力卡 */
  cards: PresetCard[];
  /** 初始核心员工 */
  employees: PresetEmployee[];
}

export const STARTUP_PRESETS: StartupPreset[] = [
  {
    id: 'bootstrapper',
    name: '自力更生',
    description: '更多启动资金，少量算力和员工。适合稳健经营，先做数据服务再逐步扩张。',
    bonusFunds: 4_000_000,
    cards: [
      { modelId: 'compute_a100', count: 1 },
    ],
    employees: [
      { role: StaffRole.RESEARCHER, level: 3, count: 2 },
      { role: StaffRole.DATA_ENGINEER, level: 2, count: 1 },
    ],
  },
  {
    id: 'balanced',
    name: '均衡起步',
    description: '适中的资金、算力和人员配置。适合大多数策略，攻守兼备。',
    bonusFunds: 1_000_000,
    cards: [
      { modelId: 'compute_a100', count: 2 },
    ],
    employees: [
      { role: StaffRole.RESEARCHER, level: 3, count: 3 },
      { role: StaffRole.DATA_ENGINEER, level: 2, count: 2 },
    ],
  },
  {
    id: 'tech_heavy',
    name: '技术驱动',
    description: '最少资金但算力拉满，适合激进训练路线。风险高但模型迭代最快。',
    bonusFunds: 0,
    cards: [
      { modelId: 'compute_a100', count: 4 },
    ],
    employees: [
      { role: StaffRole.RESEARCHER, level: 3, count: 3 },
      { role: StaffRole.DATA_ENGINEER, level: 2, count: 1 },
      { role: StaffRole.SYSTEM_ENGINEER, level: 2, count: 1 },
    ],
  },
];
