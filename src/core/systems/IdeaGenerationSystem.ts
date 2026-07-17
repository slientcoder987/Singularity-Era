/**
 * IdeaGenerationSystem
 *
 * 每 7 天判定一次，为每位在职研究员独立计算 idea 生成概率。
 *
 * idea 生成概率公式（每位研究员独立判定）：
 *   P = clamp(0.05 + (intelligence - 50) × 0.003 + (creativity - 50) × 0.004 + level × 0.01, 0, 0.6) × eff
 *
 * idea 产物分布：
 * - 80% accelerate：从未成熟技术中随机选一个
 *   - 研发中技术：value=0.20（进度推进 20% totalDays）
 *   - 已解锁但 maturity<100：value = 5 + creativity/100 × 5（+5~10 maturity）
 * - 20% unique：从 IDEA_TECH_POOL 随机选一个未注册的，value=30（初始 maturity）
 *
 * 执行时机：在 TechResearchSystem 之前，使 idea 加速能在同日生效。
 */
import type { GameState, GameData } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import type { TechIdea } from '../entities/TechIdea';
import type { Employee } from '../entities/Employee';
import { StaffRole } from '../entities/Employee';
import { IDEA_TECH_MAP, TECH_MAP } from '../config/techTree';
import { IDEA_TECH_POOL } from '../config/ideaTechPool';
import { calcEmployeeEfficiency } from '../utils/employeeUtils';
import { getUnlockedTechIds } from '../utils/techLookup';

const IDEA_TICK_DAYS = 7;
const MAX_PENDING_IDEAS = 50;

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class IdeaGenerationSystem implements System {
  name = 'IdeaGenerationSystem';

  update(state: GameState, events: EventBus, _deltaDays: number): void {
    const current = state.read();
    // 每 7 天判定一次
    if (current.date % IDEA_TICK_DAYS !== 0) return;

    const newIdeas: TechIdea[] = [];
    const researchers = current.employees.filter(
      (e) => e.role === StaffRole.RESEARCHER && e.status !== 'training',
    );

    for (const r of researchers) {
      const eff = calcEmployeeEfficiency(r, current.departments, current.employees);
      const p = Math.max(0, Math.min(0.6,
        0.05 + (r.attributes.intelligence - 50) * 0.003
             + (r.attributes.creativity - 50) * 0.004
             + r.level * 0.01,
      )) * eff;

      if (Math.random() >= p) continue;

      // 决定 idea 类型：20% unique，80% accelerate
      const isUnique = Math.random() < 0.20;
      const idea = this.generateIdea(current, r, isUnique);
      if (idea) {
        newIdeas.push(idea);
        events.emit('IDEA_GENERATED', idea);
      }
    }

    if (newIdeas.length === 0) return;

    state.update((draft) => {
      draft.pendingIdeas.push(...newIdeas);
      // 截断到最近 50 条（仅保留 pending 状态）
      if (draft.pendingIdeas.length > MAX_PENDING_IDEAS) {
        const pending = draft.pendingIdeas.filter((i) => i.status === 'pending');
        draft.pendingIdeas = pending.slice(-MAX_PENDING_IDEAS);
      }
    });
  }

  /**
   * 生成一条 idea
   *
   * @param data        当前游戏状态（只读快照）
   * @param researcher  产出 idea 的研究员
   * @param isUnique    true=独有技术；false=加速现有技术
   * @returns TechIdea 或 null（候选池为空时）
   */
  private generateIdea(
    data: GameData,
    researcher: Employee,
    isUnique: boolean,
  ): TechIdea | null {
    const day = data.date;
    const empName = researcher.name;

    if (isUnique) {
      // 从 IDEA_TECH_POOL 过滤掉已注册到 IDEA_TECH_MAP 的
      const available = IDEA_TECH_POOL.filter((t) => !IDEA_TECH_MAP[t.id]);
      if (available.length === 0) return null;
      const picked = available[Math.floor(Math.random() * available.length)];
      return {
        id: genId(`idea-${day}-${researcher.id}`),
        sourceEmployeeId: researcher.id,
        generatedDay: day,
        kind: 'unique',
        targetTechId: picked.id,
        value: 30,
        title: `${empName} 提出独有技术方案`,
        description: `${picked.name}：${picked.description}（初始成熟度 30）`,
        status: 'pending',
      };
    }

    // accelerate：从未成熟技术中选一个
    const candidates: Array<{ techId: string; isResearching: boolean }> = [];

    // 候选 1：研发中技术
    if (data.researchingTech) {
      candidates.push({
        techId: data.researchingTech.techId,
        isResearching: true,
      });
    }

    // 候选 2：已解锁但 maturity<100 的技术
    const unlockedNotMax = getUnlockedTechIds(data).filter(
      (id) => (data.techMaturity[id] ?? 0) < 100,
    );
    for (const techId of unlockedNotMax) {
      candidates.push({ techId, isResearching: false });
    }

    if (candidates.length === 0) return null;

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const techNode = TECH_MAP[picked.techId] ?? IDEA_TECH_MAP[picked.techId];
    const techName = techNode?.name ?? picked.techId;

    if (picked.isResearching) {
      // 研发中技术：进度 +20%
      return {
        id: genId(`idea-${day}-${researcher.id}`),
        sourceEmployeeId: researcher.id,
        generatedDay: day,
        kind: 'accelerate',
        targetTechId: picked.techId,
        value: 0.20,
        title: `${empName} 发现 ${techName} 的加速方案`,
        description: `研发进度 +20%（约 ${data.researchingTech?.totalDays ?? 0} × 0.2 天）`,
        status: 'pending',
      };
    }

    // 已解锁技术：maturity +5~10
    const gain = 5 + (researcher.attributes.creativity / 100) * 5;
    const currentMaturity = data.techMaturity[picked.techId] ?? 0;
    return {
      id: genId(`idea-${day}-${researcher.id}`),
      sourceEmployeeId: researcher.id,
      generatedDay: day,
      kind: 'accelerate',
      targetTechId: picked.techId,
      value: gain,
      title: `${empName} 优化了 ${techName}`,
      description: `成熟度 +${gain.toFixed(1)}（当前 ${currentMaturity.toFixed(0)} → ${Math.min(100, currentMaturity + gain).toFixed(0)}）`,
      status: 'pending',
    };
  }
}