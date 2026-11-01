// Stage ladder + difficulty rules. g.stage is the index (in content/stages.js STAGES) of the stage being learned;
// everything a stage opens stays open. Mastery itself is decided in mastery.js at each weekly review.
import { C } from './cfg.js';
import { weekOf } from './clock.js';
import { RULES } from './rules.js';
import { STAGES, OPENS } from '../content/stages.js';

export const MODES = ['relaxed', 'normal', 'hardcore'];
export const unlocked = (g, what) => (g.stage ?? 0) >= (OPENS[what] ?? 0);
export const currentStage = g => STAGES[Math.min(g.stage, STAGES.length - 1)];
export const stageNameFor = what => STAGES[OPENS[what] ?? 0].name.toLowerCase();
/** Systems that open when stage index s begins (for the intro card). */
export const opensAt = s => Object.keys(OPENS).filter(k => OPENS[k] === s && k !== 'market');

export function startCash(mode) { const D = C.difficulty; return mode === 'relaxed' ? D.relaxedCash : mode === 'hardcore' ? D.hardcoreCash : D.normalCash; }
/** Contamination multiplier from difficulty: grace weeks first (Hardcore: week 0 only), then mode. */
export function hazardMult(g) {
  const graceWeeks = g.mode === 'hardcore' ? 1 : 2;
  if (weekOf(g.day) < graceWeeks) return C.difficulty.graceHazard;
  return g.mode === 'relaxed' ? C.difficulty.relaxedHazard : 1;
}
/** Relaxed: fresh product and peak clusters last longer. */
export const rotMult = g => g.mode === 'relaxed' ? RULES.relaxedRotMult : 1;
export const canSalvage = (g, v) => g.mode === 'relaxed' && v.kind !== 'plate' && v.contam.vis > 0 && v.state !== 'lost';
