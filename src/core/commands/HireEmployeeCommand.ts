/**
 * 员工招聘命令（基于招聘渠道）
 *
 * 流程：
 * 1. RequestRecruitmentCommand：发起招聘，扣费，生成候选人列表加入 pendingCandidates
 * 2. HireCandidateCommand：从 pendingCandidates 中录用一位
 * 3. RejectCandidateCommand：拒绝候选人
 */
import type { Command } from '../interfaces/Command';
import type { GameState, Candidate } from '../GameState';
import type { EventBus } from '../EventBus';
import { StaffRole, type Employee } from '../entities/Employee';
import {
  ROLE_CONFIG,
  SKILL_CONFIG,
  CORE_EMPLOYEE_CAP_PER_ROLE,
  RECRUITMENT_CHANNELS,
  type RecruitmentChannelId,
} from '../config/employees';
import { REGIONS, REGION_MAP } from '../config/regions';
import { generateCandidateAttributes, calcSalaryForLevel } from '../utils/employeeUtils';
import { DEPARTMENT_ROLE_MAP } from '../entities/Department';

/** 生成唯一 id */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 生成随机姓名（根据地区语言） */
function generateName(regionId: string | null): string {
  const region = regionId ? REGION_MAP[regionId] : null;
  const langs = region?.primaryLanguages ?? ['en'];
  const isChinese = langs.some((l) => l.startsWith('zh'));

  if (isChinese) {
    const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'];
    const givenNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '霞', '平', '刚', '桂英'];
    return `${surnames[Math.floor(Math.random() * surnames.length)]}${givenNames[Math.floor(Math.random() * givenNames.length)]}`;
  }
  // 英文姓名（默认）
  const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Emily'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

/**
 * 发起招聘：扣费并生成候选人列表
 */
export class RequestRecruitmentCommand implements Command {
  constructor(
    public readonly role: StaffRole,
    public readonly channel: RecruitmentChannelId,
  ) {}

  execute(state: GameState, events: EventBus): void {
    const channelCfg = RECRUITMENT_CHANNELS[this.channel];
    if (!channelCfg) {
      events.emit('RECRUITMENT_REJECTED', { reason: '未知招聘渠道' });
      return;
    }

    const roleCfg = ROLE_CONFIG[this.role];
    if (!roleCfg) {
      events.emit('RECRUITMENT_REJECTED', { reason: '未知角色' });
      return;
    }

    // 内部晋升不通过此命令
    if (this.channel === 'internal_promote') {
      events.emit('RECRUITMENT_REJECTED', { reason: '内部晋升请使用 PromoteEmployeeCommand' });
      return;
    }

    const current = state.read();

    // 检查核心员工上限
    const roleCoreCount = current.employees.filter((e) => e.role === this.role).length;
    if (roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE) {
      events.emit('RECRUITMENT_REJECTED', {
        reason: `核心员工已达上限（${CORE_EMPLOYEE_CAP_PER_ROLE}人）`,
      });
      return;
    }

    const funds = current.resources['funds'] ?? 0;
    if (funds < channelCfg.cost) {
      events.emit('RECRUITMENT_REJECTED', {
        reason: '资金不足',
        cost: channelCfg.cost,
        funds,
      });
      return;
    }

    // 获取地区用于薪资和属性加成
    const hqRegionId = current.headquartersRegionId;
    const hqRegion = hqRegionId ? REGIONS.find((r) => r.id === hqRegionId) ?? null : null;
    const talentBonus = hqRegion ? (hqRegion.talentIndex - 50) / 100 : 0;

    // 生成候选人
    const candidates: Candidate[] = [];
    for (let i = 0; i < channelCfg.candidateCount; i++) {
      // 属性基础 = 渠道基础 + 地区人才加成 × 25
      const baseAttr = channelCfg.baseAttribute + talentBonus * 25;
      const attributes = generateCandidateAttributes(baseAttr, roleCfg.attributeWeights);

      // 等级：渠道范围内随机
      const [minLv, maxLv] = channelCfg.levelRange;
      const level = Math.floor(minLv + Math.random() * (maxLv - minLv + 1));

      // 预期薪资：按等级和地区计算
      const expectedSalary = calcSalaryForLevel(this.role, level, hqRegion);

      candidates.push({
        id: genId('cand'),
        name: generateName(hqRegionId),
        role: this.role,
        attributes,
        level,
        channel: this.channel,
        expectedSalary,
        generatedDay: current.date,
        status: 'pending',
      });
    }

    state.update((draft) => {
      draft.resources['funds'] -= channelCfg.cost;
      draft.pendingCandidates.push(...candidates);
    });

    events.emit('RECRUITMENT_REQUESTED', {
      channel: this.channel,
      role: this.role,
      candidateCount: candidates.length,
      cost: channelCfg.cost,
      deliveryDays: channelCfg.deliveryDays,
    });
  }
}

/**
 * 录用候选人
 */
export class HireCandidateCommand implements Command {
  constructor(public readonly candidateId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const candidate = current.pendingCandidates.find((c) => c.id === this.candidateId);
    if (!candidate) {
      events.emit('HIRE_REJECTED', { reason: '候选人不存在' });
      return;
    }
    if (candidate.status !== 'pending') {
      events.emit('HIRE_REJECTED', { reason: '候选人已被处理' });
      return;
    }

    // 再次检查核心员工上限
    const roleCoreCount = current.employees.filter((e) => e.role === candidate.role).length;
    if (roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE) {
      events.emit('HIRE_REJECTED', {
        reason: `核心员工已达上限（${CORE_EMPLOYEE_CAP_PER_ROLE}人）`,
      });
      return;
    }

    // 生成初始技能列表（全部锁定）
    const roleCfg = ROLE_CONFIG[candidate.role];
    const skills = roleCfg.skillPool.map((skillId) => {
      const cfg = SKILL_CONFIG[skillId];
      if (!cfg) {
        return {
          id: skillId,
          name: skillId,
          description: '',
          effect: { type: 'unknown', value: 0 },
          unlocked: false,
          cost: 1,
        };
      }
      return { ...cfg, unlocked: false };
    });

    const employee: Employee = {
      id: genId('emp'),
      name: candidate.name,
      role: candidate.role,
      attributes: candidate.attributes,
      skills,
      skillPoints: 0,
      level: candidate.level,
      salary: candidate.expectedSalary,
      loyalty: 70,
      fatigue: 0,
      status: 'idle',
      hireDay: current.date,
      experience: 0,
    };

    state.update((draft) => {
      draft.employees.push(employee);
      const cand = draft.pendingCandidates.find((c) => c.id === this.candidateId);
      if (cand) cand.status = 'hired';

      // 自动加入对应部门
      const dept = draft.departments.find(
        (d) => DEPARTMENT_ROLE_MAP[d.type] === candidate.role,
      );
      if (dept) {
        dept.memberIds.push(employee.id);
        const emp = draft.employees[draft.employees.length - 1];
        if (emp) emp.departmentId = dept.id;
      }
    });

    events.emit('EMPLOYEE_HIRED', employee, 0);
  }
}

/**
 * 拒绝候选人
 */
export class RejectCandidateCommand implements Command {
  constructor(public readonly candidateId: string) {}

  execute(state: GameState, events: EventBus): void {
    const current = state.read();
    const candidate = current.pendingCandidates.find((c) => c.id === this.candidateId);
    if (!candidate) {
      events.emit('REJECT_CANDIDATE_FAILED', { reason: '候选人不存在' });
      return;
    }

    state.update((draft) => {
      const cand = draft.pendingCandidates.find((c) => c.id === this.candidateId);
      if (cand) cand.status = 'rejected';
    });

    events.emit('CANDIDATE_REJECTED', this.candidateId);
  }
}

/**
 * 清理已处理的候选人（可定期调用）
 */
export class CleanupCandidatesCommand implements Command {
  execute(state: GameState, _events: EventBus): void {
    state.update((draft) => {
      draft.pendingCandidates = draft.pendingCandidates.filter((c) => c.status === 'pending');
    });
  }
}

// 保留旧命令以兼容（简单包装）
export class HireEmployeeCommand implements Command {
  constructor(
    public readonly role: StaffRole,
    public readonly name?: string,
  ) {}

  execute(state: GameState, events: EventBus): void {
    // 默认使用招聘网站渠道
    const cmd = new RequestRecruitmentCommand(this.role, 'job_site');
    cmd.execute(state, events);
  }
}
