import type { GameData } from '../GameState';
import type { Employee } from '../entities/Employee';

/**
 * 团队加成结果
 *
 * 各字段含义：
 * - trainingSpeed: 训练速度乘数（1.0 = 无加成）
 * - computeCost: 算力消耗乘数（1.0 = 无加成，越小越省算力）
 * - powerConsumption: 电力消耗乘数
 * - modelCap: 可同时训练的模型数增量
 * - dataQuality: 数据质量加成（0~1）
 * - revenueBoost: 收入乘数（1.0 = 无加成）
 * - cardWearReduction: 计算卡故障率降低比例（0~1）
 * - teamEfficiency: 团队整体效率乘数
 */
export interface TeamBonuses {
  trainingSpeed: number;
  computeCost: number;
  powerConsumption: number;
  modelCap: number;
  dataQuality: number;
  revenueBoost: number;
  cardWearReduction: number;
  teamEfficiency: number;
}

/** 无加成基准 */
export const NO_BONUSES: TeamBonuses = {
  trainingSpeed: 1,
  computeCost: 1,
  powerConsumption: 1,
  modelCap: 0,
  dataQuality: 0,
  revenueBoost: 1,
  cardWearReduction: 0,
  teamEfficiency: 1,
};

/**
 * 计算某项目的团队加成。
 *
 * 读取该项目中所有员工（assignedProjectId === projectId），
 * 累加已解锁技能的效果，并考虑疲劳因子（疲劳越高效率越低）。
 *
 * 新增技能效果类型：只需在此函数的 switch 中添加 case。
 */
export function calculateTeamBonuses(state: GameData, projectId: string): TeamBonuses {
  const members = state.employees.filter(
    (e) => e.status === 'assigned' && e.assignedProjectId === projectId,
  );

  if (members.length === 0) return { ...NO_BONUSES };

  const bonuses: TeamBonuses = { ...NO_BONUSES };

  // 累加技能效果
  for (const emp of members) {
    for (const skill of emp.skills) {
      if (!skill.unlocked) continue;
      applySkillEffect(bonuses, skill.effect.type, skill.effect.value);
    }
  }

  // 团队效率：取所有成员效率的几何平均，考虑疲劳因子
  let efficiencyProduct = 1;
  for (const emp of members) {
    const fatigueFactor = 1 - (emp.fatigue / 100) * 0.5; // 疲劳 100 时效率减半
    efficiencyProduct *= fatigueFactor;
  }
  bonuses.teamEfficiency = Math.pow(efficiencyProduct, 1 / members.length);

  // 团队效率影响训练速度
  bonuses.trainingSpeed *= bonuses.teamEfficiency;

  return bonuses;
}

/**
 * 计算全局团队加成（不区分项目，用于全局效果如电力、故障率）。
 */
export function calculateGlobalBonuses(state: GameData): TeamBonuses {
  const allMembers = state.employees.filter((e) => e.status === 'assigned');
  if (allMembers.length === 0) return { ...NO_BONUSES };

  const bonuses: TeamBonuses = { ...NO_BONUSES };
  for (const emp of allMembers) {
    for (const skill of emp.skills) {
      if (!skill.unlocked) continue;
      applySkillEffect(bonuses, skill.effect.type, skill.effect.value);
    }
  }
  return bonuses;
}

/** 应用单个技能效果到加成对象 */
function applySkillEffect(bonuses: TeamBonuses, type: string, value: number): void {
  switch (type) {
    case 'reduce_training_compute':
      bonuses.computeCost *= (1 - value);
      break;
    case 'increase_model_cap':
      bonuses.modelCap += value;
      break;
    case 'research_speed':
      bonuses.trainingSpeed *= (1 + value);
      break;
    case 'data_quality':
      bonuses.dataQuality += value;
      break;
    case 'data_speed':
      bonuses.trainingSpeed *= (1 + value);
      break;
    case 'reduce_power_consumption':
      bonuses.powerConsumption *= (1 - value);
      break;
    case 'reduce_card_wear':
      bonuses.cardWearReduction = Math.min(1, bonuses.cardWearReduction + value);
      break;
    case 'revenue_boost':
      bonuses.revenueBoost *= (1 + value);
      break;
    case 'team_efficiency':
      bonuses.teamEfficiency *= (1 + value);
      break;
    // 新增技能效果类型在此添加 case 即可
    default:
      // 未知效果类型忽略（如 crisis_reduction, compliance 等非团队加成类）
      break;
  }
}

/** 获取项目中所有员工 */
export function getProjectMembers(state: GameData, projectId: string): Employee[] {
  return state.employees.filter(
    (e) => e.status === 'assigned' && e.assignedProjectId === projectId,
  );
}
