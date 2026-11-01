// Stage ladder + difficulty rules. g.stage is the index (in content/stages.js STAGES) of the stage being learned;
// everything a stage opens stays open. Mastery itself is decided in mastery.js at each weekly review.
import { C } from './cfg.js';
import { weekOf } from './clock.js';
import { RULES } from './rules.js';
import { STAGES, OPENS, ladderOf, opensIndex, OPENS_BY } from '../content/stages.js';

export const MODES = ['relaxed', 'normal', 'hardcore'];
/** The stage ladder of the species being grown. */
export const isExpert = g => !!g && g.runType === 'expert';
export const ladder = g => ladderOf(g && g.species, isExpert(g));
/** Has the current ladder reached the stage where `what` opens? */
export const atStage = (g, what) => (g.stage ?? 0) >= opensIndex(ladder(g), what);
/** Is a system open? Everything a mastered species opened stays open; outdoor beds are wine cap only; LC is Expert only. */
export function unlocked(g, what) {
  if (what === 'bed') return g.species === 'wine-cap' && atStage(g, 'bed');
  if (what === 'lc') return isExpert(g) && ((g.speciesMastered || []).length > 0 || atStage(g, 'lc'));
  if ((g.speciesMastered || []).length) return true;
  return atStage(g, what);
}
export const currentStage = g => { const L = ladder(g); return L[Math.min(g.stage, L.length - 1)]; };
export const stageNameFor = what => (what === 'lc' ? 'liquid culture' : STAGES[OPENS[what] ?? 0].name.toLowerCase());
/** Systems that open when stage index s begins (for the intro card). First species only, except the wine cap bed. */
export const opensAt = (s, g) => Object.keys(OPENS_BY).filter(k => opensIndex(ladder(g), k) === s && k !== 'market' &&
  (k === 'bed' ? g && g.species === 'wine-cap' : k === 'lc' ? isExpert(g) : !(g && (g.speciesMastered || []).length)));
/** Has stage index i been mastered on any species? (online-shop products stay open across species) */
export const everMastered = (g, i) => Object.values({ ...(g.masteredBy || {}), now: g.mastered })
  .some(list => (list || []).includes(STAGES[i].id));

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
