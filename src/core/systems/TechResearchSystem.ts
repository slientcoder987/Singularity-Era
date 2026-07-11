/**
 * TechResearchSystem
 *
 * 每日推进技术研发进度，完成时解锁技术并激活效果。
 */
import type { GameState } from '../GameState';
import type { EventBus } from '../EventBus';
import type { System } from '../interfaces/System';
import { TECH_MAP } from '../config/techTree';

export class TechResearchSystem implements System {
  name = 'TechResearchSystem';

  update(state: GameState, events: EventBus, deltaDays: number): void {
    const current = state.read();
    if (!current.researchingTech) return;

    const research = current.researchingTech;
    const tech = TECH_MAP[research.techId];
    if (!tech) return;

    const newProgress = research.progressDays + deltaDays;
    const isCompleted = newProgress >= research.totalDays;

    state.update((draft) => {
      if (!draft.researchingTech) return;

      if (isCompleted) {
        const techId = draft.researchingTech.techId;
        const completedTech = TECH_MAP[techId];
        draft.unlockedTechs.push(techId);
        if (completedTech) {
          draft.activeTechEffects.push(completedTech.effect);
        }
        draft.researchingTech = null;
      } else {
        draft.researchingTech.progressDays = newProgress;
      }
    });

    if (isCompleted) {
      events.emit('RESEARCH_COMPLETED', research.techId, tech.name);
    } else {
      events.emit('RESEARCH_PROGRESS', {
        techId: research.techId,
        name: tech.name,
        progress: newProgress,
        total: research.totalDays,
      });
    }
  }
}
