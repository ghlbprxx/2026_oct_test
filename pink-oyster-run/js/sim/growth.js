// Vessel lifecycle: colonization, pinning, cluster growth, flushes, infection progress.
// Every rate here is per REAL (bio) day: db = game days × time.bioDaysPerGameDay.
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { rand } from './rng.js';
import { emit } from './events.js';
import { log, learn } from './journal.js';
import { colF, clamp } from './environment.js';
import { toBio } from './clock.js';
import { rotMult } from './stages.js';
import { hazard, causeOf, revealLag, mediumSpeed, FRUIT } from './contamination.js';
import { LESSONS } from '../content/lessons.js';
import { RECIPES, MEDIA, SPECIES } from '../content/species/pink-oyster.js';

export function mk(g, kind, extra) {
  return Object.assign({ id: ++g.seq, kind, state: 'colonizing', prog: 0, t: 0, uses: 0, flush: 0, shaken: false, stallT: 0, salvage: 1,
    q: { c: 0, h: 0, n: 0 }, contam: { onset: null, vis: 0, why: null }, lostFrom: null }, extra);
}
export function vName(v) {
  return v.kind === 'plate' ? MEDIA[v.medium].name + ' plate' : v.kind === 'jar' ? 'Grain jar'
    : RECIPES[v.recipe].short + (FRUIT.includes(v.state === 'lost' ? v.lostFrom : v.state) ? ' block' : ' bag');
}
export const canShake = v => v.kind === 'jar' && v.state === 'colonizing' && !v.shaken && v.prog >= RULES.shakeFrom && v.prog <= RULES.shakeTo && !(v.contam.vis > 0);
export function afterFlush(v) { v.state = v.flush >= 2 ? 'spent' : 'resting'; v.t = 0; }

/** Real-day duration of the current phase for vessel v (after growthScale). Null when the phase has no clock. */
export function phaseDays(v) {
  const B = SPECIES.bio, s = C.growth.growthScale;
  switch (v.kind + ':' + v.state) {
    case 'plate:colonizing': return B.plateDays / mediumSpeed(v.medium) * s;
    case 'jar:colonizing': return B.jarDays * s;
    case 'bag:colonizing': return RECIPES[v.recipe].colDays * s;
    case 'bag:pinning': return B.pinDays * s;
    case 'bag:growing': return B.growDays * s;
    case 'bag:resting': return B.restDays * s;
    case 'jar:bath': case 'bag:bath': return B.bathDays;
  }
  return null;
}
export const peakWindow = g => SPECIES.bio.peakWindow * C.growth.growthScale * rotMult(g);

/** Average fruiting-condition quality during growth: [CO2 factor, humidity factor]. */
export const quality = v => [v.q.n ? v.q.c / v.q.n : 1, v.q.n ? v.q.h / v.q.n : 1];
/** Fresh kg a harvest yields right now (1 kg dry substrate × BE × flush × ripeness × conditions × salvage). */
export function harvestKg(v) {
  const stage = v.state === 'peak' ? 'peak' : v.state === 'overripe' ? 'overripe' : 'young';
  const [qc, qh] = quality(v), qual = clamp(qc * qh, 0.25, 1);
  const kg = +(RECIPES[v.recipe].be * C.growth.yieldScale * RULES.flushMult[Math.min(2, v.flush - 1)] * RULES.stageMult[stage] * qual * (v.salvage ?? 1)).toFixed(2);
  return { kg, stage, qc, qh, qual };
}

function onMold(g, v, i) {
  const why = v.contam.why || 'luck', L = LESSONS[why];
  g.stats.lost[why] = (g.stats.lost[why] || 0) + 1;
  emit('track', { type: 'death', data: { cause: why } });
  emit('sfx', { name: 'mold' }); emit('wobble', { slot: i });
  log(g, `Mold on #${v.id} ${vName(v)}: ${L.title.toLowerCase()}.`, 'bad');
  if (g.learned.includes(why)) emit('toast', { text: `Mold on #${v.id} ${vName(v)}. ${L.title}.`, c: 'bad' }); else learn(g, why);
}

/** Advance one vessel by dd game days. */
export function stepVessel(g, v, dd, env, i) {
  if (v.state === 'lost') return;
  const db = toBio(dd);
  const h = C.dev.god ? 0 : hazard(g, v, env);
  if (h > 0 && v.contam.onset == null && rand() < 1 - Math.exp(-h * db)) { v.contam.onset = g.day; v.contam.why = causeOf(v, env); }
  if (v.contam.onset != null && toBio(g.day - v.contam.onset) >= revealLag(v)) {
    if (v.contam.vis === 0) { v.contam.vis = 0.001; onMold(g, v, i); }
    v.contam.vis = Math.min(1, v.contam.vis + db / (C.contam.overrunDays * rotMult(g)));
    if (v.contam.vis >= 1) { v.lostFrom = v.state; v.state = 'lost'; log(g, `#${v.id} is overrun with mold. Toss it to free the shelf.`, 'bad'); }
    return; // growth stops once mold shows
  }
  const cf = colF(env.temp), dur = phaseDays(v);
  switch (v.kind + ':' + v.state) {
    case 'plate:colonizing': v.prog += db / dur * cf; if (v.prog >= 1) { v.prog = 1; v.state = 'colonized'; v.uses = RULES.plateUses; emit('sfx', { name: 'pop' }); emit('float', { slot: i, text: 'Colonized!', c: 'good' }); log(g, `Plate #${v.id} is fully colonized.`); } break;
    case 'jar:bath': case 'bag:bath': v.t += db; if (v.t >= dur) { v.state = 'ready'; v.t = 0; } break;
    case 'jar:colonizing': v.prog += db / dur * cf; if (v.prog >= 1) { v.prog = 1; v.state = 'colonized'; v.uses = Math.max(1, Math.round(RULES.jarUses * v.salvage)); emit('sfx', { name: 'pop' }); log(g, `Jar #${v.id} is fully colonized.`); } break;
    case 'bag:colonizing': v.prog += db / dur * cf; if (v.prog >= 1) { v.prog = 0; v.state = 'pinning'; v.flush = 1; v.stallT = 0; emit('sfx', { name: 'good' }); emit('float', { slot: i, text: 'Colonized!', c: 'good' }); log(g, `#${v.id} fully colonized. Into fruiting.`); } break;
    case 'bag:pinning': {
      const rate = env.temp < SPECIES.fruiting.minTemp ? 0 : env.tF;
      if (!rate) { v.stallT += db; if (v.stallT > RULES.stallLesson) learn(g, 'cold_stall'); }
      v.prog += db / dur * rate;
      if (v.prog >= 1) { v.prog = 0; v.state = 'growing'; v.q = { c: 0, h: 0, n: 0 }; emit('sfx', { name: 'pop' }); }
      break;
    }
    case 'bag:growing': v.prog += db / dur * env.tF; v.q.c += env.cF * db; v.q.h += env.hF * db; v.q.n += db; if (v.prog >= 1) { v.prog = 1; v.state = 'peak'; v.t = 0; emit('sfx', { name: 'pop' }); emit('float', { slot: i, text: 'Peak!' }); } break;
    case 'bag:peak': v.t += db; if (v.t >= peakWindow(g)) { v.state = 'overripe'; v.t = 0; } break;
    case 'bag:overripe': v.t += db; if (v.t >= peakWindow(g)) { g.stats.dropped++; learn(g, 'overripe'); emit('sfx', { name: 'bad' }); emit('float', { slot: i, text: 'Dropped', c: 'bad' }); log(g, `#${v.id}: the cluster collapsed before you picked it.`, 'bad'); emit('track', { type: 'death', data: { cause: 'overripe' } }); afterFlush(v); } break;
    case 'bag:resting': v.t += db; if (v.t >= dur) { v.state = 'pinning'; v.prog = 0; v.flush++; v.stallT = 0; } break;
  }
}
