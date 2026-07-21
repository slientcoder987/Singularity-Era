/**
 * IdeaGenerationSystem
 *
 * 每 7 天判定一次，为每位在职研究员独立计算 idea 生成概率。
 *
 * idea 生成概率公式（每位研究员独立判定）：
 *   baseP = clamp(0.05 + (intelligence - 50) × 0.003 + (creativity - 50) × 0.004 + level × 0.01, 0, 0.6)
 *   difficultyMult = max(0.15, 1.0 - unlockedCount × 0.025 - day × 0.0003)
 *   P = baseP × eff × difficultyMult
 *
 * difficultyMult 使创意随技术解锁数和游戏天数递增而变难：
 * - 解锁 10 项技术 → -0.25，20 项 → -0.50，30 项 → -0.75
 * - 每 1000 天额外 -0.30
 * - 下限 0.15，确保始终有小概率产出
 *
 * idea 产物分布：
 * - 80% accelerate：从已解锁但 maturity<100 的技术中随机选一个
 *   - value = 5 + creativity/100 × 5（+5~10 maturity）
 * - 20% unique：从 IDEA_TECH_POOL 随机选一个未注册的，value=30（初始 maturity）
 *
 * 执行时机：在 TechResearchSystem 之前，使 idea 加速能在同日生效。
 *
 * PR-C 变更：删除"研发中技术"候选源（技术树花钱时间研发机制已废弃），
 *          accelerate 类 idea 统一作用于"已解锁但未满级"的技术。
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

      // 跳过已有同目标 pending/verifying idea 的员工（防重复）
      const existingIdea = current.pendingIdeas.find(
        (i) => i.sourceEmployeeId === r.id && i.status !== 'rejected' && i.status !== 'failed',
      );
      if (existingIdea) continue;

      const baseP = Math.max(0, Math.min(0.6,
        0.05 + (r.attributes.intelligence - 50) * 0.003
             + (r.attributes.creativity - 50) * 0.004
             + r.level * 0.01,
      ));

      // 难度系数：技术越多、天数越大 → 创意越难产出
      const unlockedCount = Object.values(current.techMaturity).filter((m) => m >= 1).length;
      const difficultyMult = Math.max(0.15, 1.0 - unlockedCount * 0.025 - current.date * 0.0003);

      const p = baseP * eff * difficultyMult;

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
      // 截断：保留所有非 pending 的（验证中/已完成），仅裁剪 pending 到最近 MAX_PENDING_IDEAS 条
      if (draft.pendingIdeas.length > MAX_PENDING_IDEAS) {
        const active = draft.pendingIdeas.filter((i) => i.status !== 'pending');
        const pendingOnly = draft.pendingIdeas.filter((i) => i.status === 'pending').slice(-MAX_PENDING_IDEAS);
        draft.pendingIdeas = [...pendingOnly, ...active];
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
      // PR-D：unique idea 初始成熟度固定 5（严格 < 10%），需通过实验提升
      // 验证成功 → maturity=5；验证失败 → maturity=5×0.25=1.25（仍解锁但效果微弱）
      return {
        id: genId(`idea-${day}-${researcher.id}`),
        sourceEmployeeId: researcher.id,
        generatedDay: day,
        kind: 'unique',
        targetTechId: picked.id,
        value: 5,
        title: `${empName} 提出独有技术方案`,
        description: `${picked.name}：${picked.description}（初始成熟度 5，需实验提升）`,
        status: 'pending',
      };
    }

    // accelerate：从已解锁但 maturity<100 的技术中选一个
    // PR-C：删除"研发中技术"候选（研发机制已废弃）
    const candidates: Array<{ techId: string }> = [];

    const unlockedNotMax = getUnlockedTechIds(data).filter(
      (id) => (data.techMaturity[id] ?? 0) < 100,
    );
    for (const techId of unlockedNotMax) {
      candidates.push({ techId });
    }

    if (candidates.length === 0) return null;

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const techNode = TECH_MAP[picked.techId] ?? IDEA_TECH_MAP[picked.techId];
    const techName = techNode?.name ?? picked.techId;

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