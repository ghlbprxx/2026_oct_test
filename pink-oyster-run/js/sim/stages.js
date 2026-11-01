// Interim stage ladder (Phase 2): systems unlock by week for a slow start. Phase 4 replaces this with mastery.
// Also difficulty rules, which every other module asks through here.
import { C } from './cfg.js';
import { weekOf } from './clock.js';
import { RULES } from './rules.js';

export const MODES = ['relaxed', 'normal', 'hardcore'];
/** Week each system unlocks: plates from week 0; one new system every progression.unlockPace weeks after week 1. */
export function unlockWeek(what) {
  const p = C.progression.unlockPace;
  return { plate: 0, jar: 1 + p, bag: 1 + 2 * p, room: 1 + 3 * p }[what];
}
export const unlocked = (g, what) => weekOf(g.day) >= unlockWeek(what);
/** What becomes available at the start of `week` (for the week-intro card). */
export const newIn = week => ['jar', 'bag', 'room'].filter(w => unlockWeek(w) === week);

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
