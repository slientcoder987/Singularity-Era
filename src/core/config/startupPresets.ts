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
    description: '少量启动资金 + 小规模算力。需尽快种子轮融资才能撑过训练期。',
    bonusFunds: 2_000_000,
    cards: [
      { modelId: 'compute_h100', count: 8 },
    ],
    employees: [
      { role: StaffRole.RESEARCHER, level: 7, count: 1 },
      { role: StaffRole.RESEARCHER, level: 5, count: 1 },
      { role: StaffRole.DATA_ENGINEER, level: 5, count: 1 },
    ],
  },
  {
    id: 'balanced',
    name: '均衡起步',
    description: '32 卡 H100 集群 + 完整团队。启动资金有限，需种子轮/VC 融资支撑扩张。',
    bonusFunds: 3_000_000,
    cards: [
      { modelId: 'compute_h100', count: 32 },
    ],
    employees: [
      { role: StaffRole.RESEARCHER, level: 7, count: 1 },
      { role: StaffRole.RESEARCHER, level: 5, count: 2 },
      { role: StaffRole.DATA_ENGINEER, level: 5, count: 2 },
      { role: StaffRole.SYSTEM_ENGINEER, level: 5, count: 1 },
      { role: StaffRole.PRODUCT_MANAGER, level: 5, count: 1 },
    ],
  },
  {
    id: 'tech_heavy',
    name: '技术驱动',
    description: '算力拉满，精简团队。资金极度紧张，必须立即融资否则将面临现金流危机。',
    bonusFunds: 1_000_000,
    cards: [
      { modelId: 'compute_h100', count: 48 },
    ],
    employees: [
      { role: StaffRole.RESEARCHER, level: 7, count: 1 },
      { role: StaffRole.RESEARCHER, level: 5, count: 3 },
      { role: StaffRole.DATA_ENGINEER, level: 5, count: 1 },
      { role: StaffRole.SYSTEM_ENGINEER, level: 5, count: 1 },
    ],
  },
];
