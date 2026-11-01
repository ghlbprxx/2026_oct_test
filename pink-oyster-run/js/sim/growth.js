// Vessel lifecycle: colonization, pinning, cluster growth, flushes, infection progress.
// Every rate here is per REAL (bio) day: db = game days × time.bioDaysPerGameDay.
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { rand } from './rng.js';
import { emit } from './events.js';
import { log, learn } from './journal.js';
import { colF, clamp, forSpecies } from './environment.js';
import { toBio } from './clock.js';
import { rotMult } from './stages.js';
import { hazard, causeOf, revealLag, mediumSpeed, FRUIT } from './contamination.js';
import { LESSONS } from '../content/lessons.js';
import { count } from './mastery.js';
import { MEDIA } from '../content/species/pink-oyster.js';
import { spv, recipeOf } from '../content/species/index.js';

export function mk(g, kind, extra) {
  return Object.assign({ id: ++g.seq, sp: g.species || 'pink-oyster', kind, state: 'colonizing', prog: 0, t: 0, uses: 0, flush: 0, shaken: false, stallT: 0, salvage: 1,
    q: { c: 0, h: 0, n: 0 }, contam: { onset: null, vis: 0, why: null }, lostFrom: null }, extra);
}
export function vName(v) {
  if (v.kind === 'bed') return recipeOf(v).short + ' bed';
  if (v.kind === 'lc') return 'Liquid culture';
  return v.kind === 'plate' ? MEDIA[v.medium].name + ' plate' : v.kind === 'jar' ? 'Grain jar'
    : recipeOf(v).short + (FRUIT.includes(v.state === 'lost' ? v.lostFrom : v.state) ? ' block' : ' bag');
}
export const canShake = v => v.kind === 'jar' && v.state === 'colonizing' && !v.shaken && v.prog >= RULES.shakeFrom && v.prog <= RULES.shakeTo && !(v.contam.vis > 0);
export function afterFlush(v) {
  if (v.kind === 'bed') { const max = recipeOf(v).maxFlush; v.state = max && v.flush >= max ? 'spent' : 'resting'; v.t = 0; return; }
  v.state = v.flush >= 2 ? 'spent' : 'resting'; v.t = 0;
}

/** Real-day duration of the current phase for vessel v (after growthScale). Null when the phase has no clock. */
export function phaseDays(v) {
  const B = spv(v).bio, s = C.growth.growthScale;
  switch (v.kind + ':' + v.state) {
    case 'plate:colonizing': return B.plateDays / mediumSpeed(v.medium) * s;
    case 'jar:colonizing': return B.jarDays * s * (v.fromLC ? RULES.lcJarSpeed : 1);
    case 'lc:colonizing': return (B.lcDays ?? RULES.lcDays) * s;
    case 'lc:bath': return B.bathDays;
    case 'bag:colonizing': case 'bed:colonizing': return recipeOf(v).colDays * s;
    case 'bag:pinning': case 'bed:pinning': return B.pinDays * s;
    case 'bag:growing': case 'bed:growing': return B.growDays * s;
    case 'bag:resting': case 'bed:resting': return B.restDays * s;
    case 'jar:bath': case 'bag:bath': return B.bathDays;
  }
  return null;
}
export const peakWindow = (g, v) => spv(v).bio.peakWindow * C.growth.growthScale * rotMult(g);

/** Average fruiting-condition quality during growth: [CO2 factor, humidity factor]. */
export const quality = v => [v.q.n ? v.q.c / v.q.n : 1, v.q.n ? v.q.h / v.q.n : 1];
/** Fresh kg a harvest yields right now (1 kg dry substrate × BE × flush × ripeness × conditions × salvage). */
export function harvestKg(v) {
  const stage = v.state === 'peak' ? 'peak' : v.state === 'overripe' ? 'overripe' : 'young';
  const [qc, qh] = quality(v), qual = clamp(qc * qh, 0.25, 1);
  const fm = v.kind === 'bed' ? 1 : (spv(v).flushMult || RULES.flushMult)[Math.min(2, v.flush - 1)];
  const kg = +(recipeOf(v).be * C.growth.yieldScale * fm * RULES.stageMult[stage] * qual * (v.salvage ?? 1)).toFixed(2);
  return { kg, stage, qc, qh, qual };
}

function onMold(g, v, i) {
  const why = v.contam.why || 'luck', L = LESSONS[why];
  g.stats.lost[why] = (g.stats.lost[why] || 0) + 1; count(g, 'infected');
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
  const P = spv(v), F = P.fruiting;
  env = forSpecies(env, F);
  if (v.kind === 'bed') return stepBed(g, v, db, env, i);
  const cf = colF(env.temp, P.colShift), dur = phaseDays(v);
  if (v.state === 'colonizing' && env.temp < 60) { v.coldT = (v.coldT || 0) + db; if (v.coldT > RULES.garageLesson) learn(g, 'garage_swing'); }
  switch (v.kind + ':' + v.state) {
    case 'plate:colonizing': v.prog += db / dur * cf; if (v.prog >= 1) { v.prog = 1; v.state = 'colonized'; v.uses = RULES.plateUses; count(g, 'finished'); count(g, 'cleanPlates'); if (env.zone === 'closet') count(g, 'closetPlates'); emit('sfx', { name: 'pop' }); emit('float', { slot: i, text: 'Colonized!', c: 'good' }); log(g, `Plate #${v.id} is fully colonized.`); } break;
    case 'lc:colonizing': v.prog += db / dur * cf; if (v.prog >= 1) { v.prog = 1; v.state = 'colonized'; v.uses = RULES.lcUses; count(g, 'finished'); count(g, 'cleanLC'); emit('sfx', { name: 'pop' }); emit('float', { slot: i, text: 'LC ready!', c: 'good' }); log(g, `Liquid culture #${v.id} is colonized: ${RULES.lcUses} grain jars' worth.`); } break;
    case 'jar:bath': case 'bag:bath': v.t += db; if (v.t >= dur) { v.state = 'ready'; v.t = 0; } break;
    case 'jar:colonizing': v.prog += db / dur * cf; if (v.prog >= 1) { v.prog = 1; v.state = 'colonized'; v.uses = Math.max(1, Math.round(RULES.jarUses * v.salvage)); count(g, 'finished'); count(g, 'cleanJars'); emit('sfx', { name: 'pop' }); log(g, `Jar #${v.id} is fully colonized.`); } break;
    case 'bag:colonizing': v.prog += db / dur * cf; if (v.prog >= 1) {
      count(g, 'finished'); count(g, 'cleanBags'); emit('sfx', { name: 'good' }); emit('float', { slot: i, text: 'Colonized!', c: 'good' });
      if (!P.bagFruits) { v.prog = 1; v.state = 'colonized'; v.uses = 1; log(g, `Spawn bag #${v.id} is fully colonized: ready to inoculate a bed.`); }
      else { v.prog = 0; v.state = 'pinning'; v.flush = 1; v.stallT = 0; log(g, `#${v.id} fully colonized. Into fruiting.`); }
    } break;
    case 'bag:pinning': {
      const hot = F.maxTemp != null && env.temp > F.maxTemp;
      const rate = env.temp < F.minTemp || hot ? 0 : env.tF;
      if (env.zone === 'tent' && env.temp >= F.bestLo && env.temp <= F.bestHi && env.rh >= F.rhLo && env.rh <= F.rhHi) count(g, 'goodTent', db);
      if (!rate) { v.stallT += db; if (v.stallT > RULES.stallLesson) learn(g, hot ? 'too_warm' : 'cold_stall'); }
      v.prog += db / dur * rate;
      if (v.prog >= 1) { v.prog = 0; v.state = 'growing'; v.q = { c: 0, h: 0, n: 0 }; emit('sfx', { name: 'pop' }); }
      break;
    }
    case 'bag:growing': v.prog += db / dur * env.tF; v.q.c += env.cF * db; v.q.h += env.hF * db; v.q.n += db; if (v.prog >= 1) { v.prog = 1; v.state = 'peak'; v.t = 0; emit('sfx', { name: 'pop' }); emit('float', { slot: i, text: 'Peak!' }); } break;
    case 'bag:peak': v.t += db; if (v.t >= peakWindow(g, v)) { v.state = 'overripe'; v.t = 0; } break;
    case 'bag:overripe': v.t += db; if (v.t >= peakWindow(g, v)) { g.stats.dropped++; learn(g, 'overripe'); emit('sfx', { name: 'bad' }); emit('float', { slot: i, text: 'Dropped', c: 'bad' }); log(g, `#${v.id}: the cluster collapsed before you picked it.`, 'bad'); emit('track', { type: 'death', data: { cause: 'overripe' } }); afterFlush(v); } break;
    case 'bag:resting': v.t += db; if (v.t >= dur) { v.state = 'pinning'; v.prog = 0; v.flush++; v.stallT = 0; } break;
  }
}

/** Outdoor wine cap bed: colonizes with the weather, needs moisture (rain or the hose), then flushes after wet spells. */
function stepBed(g, v, db, env, i) {
  const R = recipeOf(v), P = spv(v), F = P.fruiting, dur = phaseDays(v);
  v.water = Math.max(0, (v.water ?? 1) - db * RULES.bedDryRate);
  const wet = v.water >= 0.5 ? 1 : v.water >= 0.25 ? 0.6 : 0.25;
  if (v.water < 0.25 && ['colonizing', 'pinning'].includes(v.state)) { v.dryT = (v.dryT || 0) + db; if (v.dryT > 3) learn(g, 'dry_bed'); }
  switch (v.state) {
    case 'colonizing': {
      const pine = R.pine ? 0.35 : 1;
      if (R.pine && v.prog > 0.02) learn(g, 'pine_chips');
      v.prog += db / dur * colF(env.temp, P.colShift) * wet * pine;
      if (v.water >= 0.5 && !(v.contam.onset != null)) count(g, 'bedMoistDays', db);
      if (v.prog >= 1) { v.prog = 0; v.state = 'pinning'; v.flush = 1; count(g, 'finished'); emit('sfx', { name: 'good' }); emit('float', { slot: i, text: 'Bed colonized!', c: 'good' }); log(g, `Bed #${v.id} is fully colonized. It fruits after a good soak.`, 'good'); }
      break;
    }
    case 'pinning': {
      const rate = env.temp < F.minTemp || env.temp > F.maxTemp ? 0 : env.tF * (v.water >= 0.5 ? 1 : 0); // flushes follow rain
      v.prog += db / dur * rate;
      if (v.prog >= 1) { v.prog = 0; v.state = 'growing'; v.q = { c: 0, h: 0, n: 0 }; emit('sfx', { name: 'pop' }); }
      break;
    }
    case 'growing': v.prog += db / dur * Math.max(0.3, env.tF); v.q.c += db; v.q.h += wet * db; v.q.n += db; if (v.prog >= 1) { v.prog = 1; v.state = 'peak'; v.t = 0; emit('sfx', { name: 'pop' }); emit('float', { slot: i, text: 'Peak!' }); } break;
    case 'peak': v.t += db; if (v.t >= peakWindow(g, v)) { v.state = 'overripe'; v.t = 0; } break;
    case 'overripe': v.t += db; if (v.t >= peakWindow(g, v)) { g.stats.dropped++; learn(g, 'overripe'); emit('float', { slot: i, text: 'Dropped', c: 'bad' }); log(g, `Bed #${v.id}: the flush went over before you picked it.`, 'bad'); afterFlush(v); } break;
    case 'resting': v.t += db; if (v.t >= dur) { v.state = 'pinning'; v.prog = 0; v.flush++; } break;
  }
}
