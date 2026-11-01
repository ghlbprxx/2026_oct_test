// Mastery: counters the sim bumps, the mentor's checklist, units of product, the weekly report card and verdict.
// Order matters (brief): units only count once the current stage's checklist is complete.
import { C } from './cfg.js';
import { emit } from './events.js';
import { currentStage } from './stages.js';
import { STAGES, MENTOR } from '../content/stages.js';
import { LESSONS } from '../content/lessons.js';
import { rand } from './rng.js';

/** Bump a counter. If it's the current stage's unit and the checklist is done, it also counts toward mastery. */
export function count(g, key, n = 1) {
  g.counts[key] = (g.counts[key] || 0) + n;
  const st = currentStage(g);
  if (!g.speciesDone && st.unitKey === key && checklistDone(g)) g.units += n;
}
export const checklist = g => currentStage(g).checklist.map(it => ({ ...it, have: Math.min(it.n, g.counts[it.key] || 0), done: (g.counts[it.key] || 0) >= it.n }));
export const checklistDone = g => checklist(g).every(it => it.done);
/** Units needed for the current stage (progression.unitsScale; fewer once the player has learned lessons on earlier species — Phase 6). */
export const unitsNeeded = g => Math.max(1, Math.round(currentStage(g).units * C.progression.unitsScale));
export const isMastered = g => !g.speciesDone && checklistDone(g) && g.units >= unitsNeeded(g);

/** Snapshot of the numbers a weekly report diffs against. */
export const weekSnapshot = g => JSON.parse(JSON.stringify({ stats: g.stats, counts: g.counts, cash: g.cash, day: g.day }));
const pick = list => list[Math.floor(rand() * list.length)];

/** Build the weekly report card for the week that just ended. Pure: does not change the game. */
export function buildReview(g) {
  const s0 = g.weekStart || weekSnapshot({ ...g, stats: {}, counts: {}, cash: g.cash });
  const d = (k, src = 'stats') => (g[src][k] || 0) - ((s0[src] || {})[k] || 0);
  const causes = {};
  for (const [k, n] of Object.entries(g.stats.lost || {})) { const dn = n - ((s0.stats.lost || {})[k] || 0); if (dn > 0) causes[k] = dn; }
  const finished = d('finished', 'counts'), infected = d('infected', 'counts');
  const st = currentStage(g), list = checklist(g), mastered = isMastered(g);
  const tips = [];
  const todo = list.find(it => !it.done);
  if (todo) tips.push(`Still on the mentor’s list: ${todo.text.charAt(0).toLowerCase() + todo.text.slice(1)} (${todo.have}/${todo.n}).`);
  Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([k]) => tips.push(`${LESSONS[k].title}: ${LESSONS[k].fix}`));
  if (!todo && !mastered) tips.push(`Next: ${unitsNeeded(g) - g.units} more ${st.unitName} (counting since your checklist was done).`);
  if (d('rotKg') > 0) tips.push(`${LESSONS.rot.title}: ${LESSONS.rot.fix}`);
  const mood = mastered ? 'mastered' : infected > Math.max(1, finished) ? 'mold' : !todo ? 'units' : 'checklist';
  return {
    week: g.week, stage: st.id, stageName: st.name, mastered, last: g.stage >= STAGES.length - 1,
    money: { in: d('revenue'), out: d('spent') + d('energy'), net: g.cash - s0.cash },
    yield: { harvestKg: d('harvestKg'), rotKg: d('rotKg'), plates: d('cleanPlates', 'counts'), jars: d('cleanJars', 'counts'), bags: d('cleanBags', 'counts'), sales: d('sales', 'counts'), refunds: d('refunds', 'counts') },
    cleanRate: finished + infected ? finished / (finished + infected) : null, finished, infected,
    causes, tips: tips.slice(0, 3), checklist: list, units: g.units, need: unitsNeeded(g), unitName: st.unitName,
    mentor: pick(MENTOR[mood]),
  };
}

/** Apply the verdict: advance the ladder on mastery, otherwise repeat the week. Returns follow-up events for the caller to emit after the review. */
export function applyVerdict(g, r) {
  const after = [];
  if (g.speciesDone) return after; // free play after the species: reviews still come, no verdicts
  if (r.mastered) {
    g.mastered.push(r.stage);
    emit('track', { type: 'mastered', data: { stage: r.stage, week: g.week } });
    if (g.stage >= STAGES.length - 1) { g.speciesDone = true; after.push(['species', {}]); }
    else { g.stage++; g.units = 0; after.push(['stage', { stage: g.stage }]); }
  } else {
    g.weeksRepeated = (g.weeksRepeated || 0) + 1;
    emit('track', { type: 'weekRepeated', data: { stage: r.stage, week: g.week } });
  }
  return after;
}
/** Admin/testing: complete the current stage's checklist and units. */
export function forceMaster(g) {
  for (const it of currentStage(g).checklist) g.counts[it.key] = Math.max(g.counts[it.key] || 0, it.n);
  g.units = Math.max(g.units, unitsNeeded(g));
}
