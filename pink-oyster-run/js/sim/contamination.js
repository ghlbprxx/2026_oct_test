// Contamination: daily hazard per vessel, what caused it, and how long until it shows.
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { RECIPES } from '../content/species/pink-oyster.js';

export const FRUIT = ['pinning', 'growing', 'peak', 'overripe', 'resting', 'spent'];
export const isBlock = v => !!v && v.kind === 'bag' && FRUIT.includes(v.state === 'lost' ? v.lostFrom : v.state);
export const mediumSpeed = m => m === 'super' ? RULES.superSpeed : m === 'cma' ? RULES.cmaSpeed : 1;

/** Chance per game day that this vessel becomes infected. */
export function hazard(v, env) {
  const K = C.contam;
  if (v.kind === 'plate') return K.plateHazard * (v.state === 'colonized' ? 0.5 : 1);
  if (['queued', 'cooking', 'bath', 'spent'].includes(v.state)) return 0;
  if (v.kind === 'jar') { const h = v.prep === 'ster' ? K.jarSterile : K.jarPasteurized; return h * (v.state === 'ready' ? 0.5 : v.state === 'colonized' ? 0.3 : 1); }
  let h = RECIPES[v.recipe].hz[v.prep] * K.bagScale;
  if (v.state === 'ready') return h * 0.5;
  if (v.state === 'colonizing') return h;
  h *= K.fruitingMult;
  if (env.rh > 96) h += RULES.soggyHazard;
  if (env.temp > 90) h += RULES.heatHazard;
  if (v.flush >= 3) h += RULES.flush3Hazard;
  return h;
}
/** Lesson id that explains a fresh infection. */
export function causeOf(v, env) {
  if (v.kind === 'jar') return v.prep === 'past' ? 'past_grain' : 'luck';
  if (v.kind === 'bag') {
    const R = RECIPES[v.recipe];
    if (v.recipe === 'coffee') return 'coffee';
    if (v.prep === 'past' && R.rich >= 3) return 'past_supplement';
    if (v.prep === 'ster' && v.recipe === 'straw') return 'steril_straw';
    if (isBlock(v) && env.rh > 96) return 'soggy';
    if (v.flush >= 3) return 'flush3';
  }
  return 'luck';
}
/** Days from infection until mold is visible. Super agar hides it; CMA shows it fast. */
export function revealLag(v) {
  return C.contam.revealDays * (v.kind === 'plate' ? (v.medium === 'super' ? C.contam.superAgarHide : v.medium === 'cma' ? RULES.cmaReveal : 1) : 1);
}
/** What a child vessel inherits when spawned from source s (hidden infections travel too). */
export function inheritedCause(s) {
  if (s.contam.onset == null) return null;
  return s.contam.vis > 0 ? 'expand_contam' : (s.medium === 'super' || s.contam.why === 'hidden_contam') ? 'hidden_contam' : s.contam.why;
}
