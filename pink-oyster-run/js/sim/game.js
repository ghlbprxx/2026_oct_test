// Orchestration: new game, the per-tick update, seasonal events, and every player action.
// Pure: state in, state out, side effects only through events.emit().
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { rand } from './rng.js';
import { emit } from './events.js';
import { log, learn } from './journal.js';
import { envNow } from './environment.js';
import { stepCooker } from './equipment.js';
import { stepLots, market, pay, money } from './economy.js';
import { mk, stepVessel, afterFlush, canShake, harvestKg, vName } from './growth.js';
import { seasonDays, weekOf } from './clock.js';
import { unlocked, unlockWeek, newIn, startCash, hazardMult, canSalvage } from './stages.js';
import { fmtLb } from './economy.js';
import { inheritedCause } from './contamination.js';
import { RECIPES, MEDIA, SUPPLIES } from '../content/species/pink-oyster.js';

export function newGame(mode = 'normal') {
  const day = C.dev.startLevel * RULES.daysPerWeek;
  const g = { mode, day, week: weekOf(day), cash: startCash(mode), slots: Array(C.equipment.slots).fill(null), queue: [], cooker: { batch: [], t: 0 },
    hasSab: false, heater: 0, fae: 2, mist: 80, lots: [], lotSeq: 0, dried: 0, nextMarket: day + C.economy.marketEvery, snap: null, forecast: null,
    coffeeDay: unlockWeek('bag') * RULES.daysPerWeek + 3 + Math.floor(rand() * 10), coffeeDone: false, log: [], learned: [], asked: [], seq: 0, over: false, endReason: '',
    stats: { harvestKg: 0, freshKg: 0, driedKg: 0, rotKg: 0, dropped: 0, lost: {}, revenue: 0, spent: 0, energy: 0, rescued: 0 } };
  g.startCash = g.cash;
  log(g, 'Week 0. An empty spare room, a box of supplies, and a neighbor who knows a lot about mold.');
  return g;
}

export function update(g, dd) {
  if (!g || g.over) return;
  g.day += dd;
  const env = envNow(g);
  const wk = weekOf(g.day);
  if (wk !== g.week) { g.week = wk; emit('week', { week: wk, news: newIn(wk) }); }
  if (g.heater > 0 && unlocked(g, 'room')) {
    const cost = g.heater * C.economy.heaterCost * dd;
    if (g.cash >= cost) { g.cash -= cost; g.stats.energy += cost; }
    else { g.heater = 0; emit('toast', { text: 'Out of cash: the heater switched off.', c: 'bad' }); log(g, 'Heater switched off (no cash).', 'bad'); }
  }
  stepCooker(g, dd);
  g.slots.forEach((v, i) => { if (v) stepVessel(g, v, dd, env, i); });
  stepLots(g, dd);
  if (g.day >= g.nextMarket) { g.nextMarket += C.economy.marketEvery; if (unlocked(g, 'room')) market(g, false); } // markets start with the grow room
  stepEvents(g, dd);
  if (g.day >= seasonDays()) endSeason(g, 'season');
  else if (g.cash < 1 && !g.lots.length && !g.dried && g.slots.every(v => !v || v.state === 'lost' || v.state === 'spent' || v.contam.vis > 0)) endSeason(g, 'broke');
}

function stepEvents(g, dd) {
  if (!g.snap && !g.forecast && unlocked(g, 'room') && rand() < 1 - Math.exp(-C.room.coldSnapChance * dd)) {
    g.forecast = { start: g.day + 1 };
    emit('toast', { text: `Forecast: cold snap tomorrow, −${RULES.coldSnapDrop}°F for ${RULES.coldSnapDays} days.`, c: 'bad' }); log(g, 'Forecast: cold snap tomorrow.', 'bad');
  }
  if (g.forecast && g.day >= g.forecast.start) { g.forecast = null; g.snap = { end: g.day + RULES.coldSnapDays }; emit('toast', { text: 'Cold snap! The room just lost ' + RULES.coldSnapDrop + '°F.', c: 'bad' }); }
  if (g.snap && g.day >= g.snap.end) { g.snap = null; emit('toast', { text: 'The cold snap is over.' }); }
  if (!g.coffeeDone && g.day >= g.coffeeDay) { g.coffeeDone = true; if (g.slots.some(v => !v)) emit('coffee'); }
}

export function endSeason(g, reason) {
  if (g.over) return;
  market(g, true); g.over = true; g.endReason = reason;
  const profit = g.cash - g.startCash;
  emit('track', { type: 'runEnd', data: { profit: Math.round(profit), day: Math.floor(g.day), reason, harvestKg: +g.stats.harvestKg.toFixed(2), lost: Object.values(g.stats.lost).reduce((a, b) => a + b, 0) } });
  emit('end', { profit });
}

/* ---------- player actions: return false when nothing happened (e.g. not enough cash) ---------- */
function place(g, i, v, msg) { g.slots[i] = v; emit('sfx', { name: 'build' }); log(g, msg); return true; }
export function pourPlate(g, i, medium) {
  if (!pay(g, SUPPLIES.plate)) return false;
  const ws = g.hasSab ? 'sab' : 'open';
  return place(g, i, mk(g, 'plate', { medium, ws }), `Poured a ${MEDIA[medium].name} plate ${ws === 'sab' ? 'in the still-air box' : 'on the open counter'}.`);
}
/** One-time DIY still-air box: a clear tote with arm holes. Cuts airborne spores during plate work and inoculation. */
export function buildSab(g) {
  if (g.hasSab || !pay(g, SUPPLIES.sab)) return false;
  g.hasSab = true; learn(g, 'sab'); emit('sfx', { name: 'good' }); log(g, 'Built a still-air box from a clear tote. Still air, fewer spores.', 'good'); return true;
}
export function prepJar(g, i, prep) {
  if (!unlocked(g, 'jar') || !pay(g, SUPPLIES.jar)) return false;
  const v = mk(g, 'jar', { prep, state: prep === 'ster' ? 'queued' : 'bath' }); if (prep === 'ster') g.queue.push(v.id);
  return place(g, i, v, `Grain jar #${v.id}: ${prep === 'ster' ? 'queued for the pressure cooker' : 'into the hot-water bath'}.`);
}
export function prepBag(g, i, recipe, prep) {
  if (!unlocked(g, 'bag') || !pay(g, RECIPES[recipe].cost)) return false;
  const v = mk(g, 'bag', { recipe, prep, state: prep === 'ster' ? 'queued' : 'bath' }); if (prep === 'ster') g.queue.push(v.id);
  return place(g, i, v, `${RECIPES[recipe].name} bag #${v.id}: ${prep === 'ster' ? 'queued for the pressure cooker' : 'pasteurizing'}.`);
}
/** Colonized vessels that can inoculate target t (plates → jars, jars → bags). */
export function sources(g, t) { const want = t.kind === 'jar' ? 'plate' : 'jar'; return g.slots.map((v, i) => ({ v, i })).filter(s => s.v && s.v.kind === want && s.v.state === 'colonized' && s.v.uses > 0); }
export function inoculate(g, ti, si) {
  const t = g.slots[ti], s = g.slots[si];
  t.state = 'colonizing'; t.prog = 0; t.parent = s.id; s.uses--;
  const why = inheritedCause(s);
  if (why) { t.contam.onset = g.day; t.contam.why = why; }
  else if (!C.dev.god && rand() < C.contam.openAirInoc * (g.hasSab ? C.contam.sabFactor : 1) * C.contam.hazardScale * hazardMult(g)) {
    t.contam.onset = g.day; t.contam.why = g.hasSab ? 'luck' : 'open_air'; // spores got in while the jar/bag was open
  }
  if (s.medium === 'super') t.medium = 'super'; // remember the super-agar lineage for hidden-mold attribution
  emit('sfx', { name: 'build' }); emit('float', { slot: ti, text: 'Spawned!', c: 'good' });
  log(g, `Spawned #${t.id} from #${s.id}${s.contam.vis > 0 ? ' (it had visible mold)' : ''}.`, s.contam.vis > 0 ? 'bad' : '');
  if (s.uses <= 0) { g.slots[si] = null; log(g, `#${s.id} is used up.`); }
  return true;
}
export function toss(g, i) {
  const v = g.slots[i]; if (!v) return false;
  g.queue = g.queue.filter(id => id !== v.id); g.cooker.batch = g.cooker.batch.filter(id => id !== v.id);
  g.slots[i] = null; emit('sfx', { name: 'tap' }); log(g, `Tossed #${v.id} ${vName(v)}.`); return true;
}
export function cutEdge(g, i) {
  const v = g.slots[i]; if (!pay(g, SUPPLIES.plate)) return false;
  v.contam = { onset: null, vis: 0, why: null }; v.prog = 0.3; v.state = 'colonizing'; v.uses = 0; v.ws = g.hasSab ? 'sab' : 'open';
  g.stats.rescued++; learn(g, 'agar_job'); emit('sfx', { name: 'good' }); emit('float', { slot: i, text: 'Rescued!', c: 'good' });
  log(g, `Cut a clean edge from #${v.id} onto a fresh plate.`, 'good'); return true;
}
export function shake(g, i) {
  const v = g.slots[i]; if (!canShake(v)) return false;
  v.shaken = true; v.prog += (1 - v.prog) * RULES.shakeBoost; learn(g, 'shake');
  emit('sfx', { name: 'shake' }); emit('wobble', { slot: i }); emit('float', { slot: i, text: 'Shaken!' }); return true;
}
export function harvest(g, i) {
  const v = g.slots[i], h = harvestKg(v);
  g.lots.push({ kg: h.kg, age: 0, id: ++g.lotSeq }); g.stats.harvestKg += h.kg;
  if (h.qc < 0.8) learn(g, 'leggy');
  if (h.qh < 0.8) learn(g, 'dry_caps');
  if (v.flush >= 3) learn(g, 'flush3');
  emit('sfx', { name: 'harvest' }); emit('float', { slot: i, text: '+' + fmtLb(h.kg) }); emit('burst', { slot: i });
  log(g, `Picked ${fmtLb(h.kg)} from #${v.id} (flush ${v.flush}, ${h.stage}${h.qual < 0.95 ? ', quality ' + Math.round(h.qual * 100) + '%' : ''}).`, 'good');
  afterFlush(v); return true;
}
/** Relaxed only: cut the moldy patch out of a jar or bag and keep going at reduced yield. */
export function salvage(g, i) {
  const v = g.slots[i]; if (!canSalvage(g, v)) return false;
  v.contam = { onset: null, vis: 0, why: null }; v.salvage *= C.difficulty.salvageQuality;
  if (v.kind === 'jar' && v.state === 'colonized') v.uses = Math.max(1, v.uses - 1);
  emit('sfx', { name: 'good' }); emit('float', { slot: i, text: 'Salvaged', c: 'good' });
  log(g, `Cut the mold out of #${v.id}. It keeps going at ${Math.round(v.salvage * 100)}%.`); return true;
}
export function soak(g, i) { const v = g.slots[i]; v.state = 'resting'; v.t = 0; emit('sfx', { name: 'tap' }); log(g, `Soaking #${v.id} for a third flush.`); return true; }
export function retire(g, i) { const v = g.slots[i]; g.slots[i] = null; emit('sfx', { name: 'tap' }); log(g, `Retired #${v.id} after ${v.flush} flush${v.flush === 1 ? '' : 'es'}.`); return true; }
export function acceptCoffee(g, yes) {
  const i = g.slots.findIndex(v => !v);
  if (yes && i >= 0) return place(g, i, mk(g, 'bag', { recipe: 'coffee', prep: 'past', state: 'bath' }), `Bagged the neighbor’s week-old coffee grounds on shelf ${i + 1}.`);
  log(g, 'Declined the week-old coffee grounds. Good instinct: they’re already moldy.', 'good'); return true;
}
export function answerQuiz(g, myth, answer) {
  const right = answer === myth.a;
  if (right) { g.cash += RULES.quizTip; g.stats.revenue += RULES.quizTip; emit('sfx', { name: 'coin' }); } else emit('sfx', { name: 'bad' });
  return right;
}
export { money };
