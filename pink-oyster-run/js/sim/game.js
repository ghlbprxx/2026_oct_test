// Orchestration: new game, the per-tick update, seasonal events, and every player action.
// Pure: state in, state out, side effects only through events.emit().
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { rand } from './rng.js';
import { emit } from './events.js';
import { log, learn } from './journal.js';
import { SPOTS, zoneOf, spotOpen, allEnvs, zoneFit } from './zones.js';
import { workspace, workFactor, canSterilizeJars, canSterilizeBags, buy } from './equipment.js';
import { stepShop } from './shop.js';
import { count, buildReview, applyVerdict, weekSnapshot } from './mastery.js';
import { ZONE_BY_ID } from '../content/zones.js';
import { stepCooker } from './equipment.js';
import { stepLots, market, pay, money } from './economy.js';
import { mk, stepVessel, afterFlush, canShake, harvestKg, vName } from './growth.js';
import { weekOf, toBio } from './clock.js';
import { unlocked, startCash, hazardMult, canSalvage } from './stages.js';
import { fmtLb } from './economy.js';
import { inheritedCause } from './contamination.js';
import { MEDIA, SUPPLIES, LC_MEDIA } from '../content/species/pink-oyster.js';
import { spg, spv, packOf, nextSpecies, SPECIES_BY } from '../content/species/index.js';
import { ladderOf } from '../content/stages.js';

/** `runType` ('tutorial' | 'story' | 'free' | 'expert') is stored for the UI and saves; the sim never reads it. */
export function newGame(mode = 'normal', runType = 'free') {
  const day = C.dev.startLevel * RULES.daysPerWeek;
  const g = { mode, day, week: weekOf(day), cash: startCash(mode), slots: Array(SPOTS.length).fill(null), queue: [], cookers: [], gear: {},
    heater: 0, fae: 2, mist: 80, lots: [], lotSeq: 0, dried: 0, nextMarket: day + C.economy.marketEvery, marketMode: 'auto', snap: null, forecast: null,
    coffeeAt: null, coffeeDone: false, log: [], learned: [], asked: [], seq: 0, over: false, endReason: '',
    runType, story: { seen: [] }, species: 'pink-oyster', speciesMastered: [], masteredBy: {}, countsBy: {},
    stage: 0, units: 0, mastered: [], counts: {}, speciesDone: false, weeksRepeated: 0, reviews: [],
    stock: { plate: [], jar: [], kit: [], dried: [] }, prices: {}, rep: C.shop.startReputation,
    stats: { harvestKg: 0, freshKg: 0, driedKg: 0, rotKg: 0, dropped: 0, lost: {}, revenue: 0, spent: 0, energy: 0, rescued: 0 } };
  g.startCash = g.cash; g.weekStart = weekSnapshot(g);
  log(g, 'Week 0. A kitchen, a closet shelf, a garage, a box of supplies, and a neighbor who knows a lot about mold.');
  return g;
}

export function update(g, dd) {
  if (!g || g.over) return;
  g.day += dd;
  const envs = allEnvs(g);
  const wk = weekOf(g.day);
  if (wk !== g.week) { weekEnd(g); g.week = wk; }
  if (g.heater > 0 && g.gear.heatmat) {
    const cost = g.heater * C.economy.heaterCost * dd;
    if (g.cash >= cost) { g.cash -= cost; g.stats.energy += cost; }
    else { g.heater = 0; emit('toast', { text: 'Out of cash: the heater switched off.', c: 'bad' }); log(g, 'Heater switched off (no cash).', 'bad'); }
  }
  stepCooker(g, dd);
  g.slots.forEach((v, i) => { if (v) stepVessel(g, v, dd, envs[zoneOf(i)], i); });
  stepLots(g, dd);
  stepShop(g, dd);
  if (g.day >= g.nextMarket) { g.nextMarket += C.economy.marketEvery; if (unlocked(g, 'market')) market(g, false); } // markets open with fruiting
  stepEvents(g, dd);
  if (g.cash < 1 && !g.lots.length && !g.dried && g.slots.every(v => !v || v.state === 'lost' || v.state === 'spent' || v.contam.vis > 0)) endSeason(g, 'broke');
}

/** End of a week: build the report card, apply the verdict (master or repeat), start the next week's snapshot. */
function weekEnd(g) {
  const r = buildReview(g);
  const after = applyVerdict(g, r);
  g.reviews.push({ week: r.week, stage: r.stage, mastered: r.mastered, net: Math.round(r.money.net) });
  g.weekStart = weekSnapshot(g);
  emit('review', r);                       // the report card first...
  after.forEach(([t, d]) => emit(t, d));   // ...then the next stage's intro card
}

function stepEvents(g, dd) {
  if (!g.snap && !g.forecast && unlocked(g, 'room') && rand() < 1 - Math.exp(-C.room.coldSnapChance * dd)) {
    g.forecast = { start: g.day + 1 }; emit('forecast', { start: g.forecast.start });
    emit('toast', { text: `Forecast: cold snap tomorrow, −${RULES.coldSnapDrop}°F for ${RULES.coldSnapDays} days.`, c: 'bad' }); log(g, 'Forecast: cold snap tomorrow.', 'bad');
  }
  if (g.forecast && g.day >= g.forecast.start) { g.forecast = null; g.snap = { end: g.day + RULES.coldSnapDays }; emit('toast', { text: 'Cold snap! The room just lost ' + RULES.coldSnapDrop + '°F.', c: 'bad' }); }
  if (g.snap && g.day >= g.snap.end) { g.snap = null; emit('toast', { text: 'The cold snap is over.' }); }
  if (g.slots.some(v => v && v.kind === 'bed') && Math.floor(g.day) !== g.rainDay) { // one weather roll per game day
    g.rainDay = Math.floor(g.day);
    if (rand() < RULES.rainChance) {
      g.slots.forEach(v => { if (v && v.kind === 'bed') v.water = 1; });
      emit('toast', { text: 'Rain overnight: the wood-chip beds are soaked.' }); log(g, 'Rain overnight soaked the beds.', 'good'); emit('rain', {});
    }
  }
  if (!g.coffeeDone && unlocked(g, 'bag')) {
    if (g.coffeeAt == null) g.coffeeAt = g.day + 2 + rand() * 6;
    if (g.day >= g.coffeeAt) { g.coffeeDone = true; if (g.slots.some(v => !v)) emit('coffee'); }
  }
}

export function endSeason(g, reason) {
  if (g.over) return;
  market(g, true); g.over = true; g.endReason = reason;
  const profit = g.cash - g.startCash + (g.stats.gear || 0); // operating profit: gear is equipment you keep
  emit('track', { type: 'runEnd', data: { profit: Math.round(profit), day: Math.floor(g.day), reason, harvestKg: +g.stats.harvestKg.toFixed(2), lost: Object.values(g.stats.lost).reduce((a, b) => a + b, 0) } });
  emit('end', { profit });
}

/* ---------- player actions: return false when nothing happened (e.g. not enough cash) ---------- */
function place(g, i, v, msg) {
  if (!spotOpen(g, i) || g.slots[i]) { emit('toast', { text: 'That spot isn’t available.', c: 'bad' }); return false; }
  g.slots[i] = v; emit('sfx', { name: 'build' }); emit('placed', { slot: i }); log(g, msg);
  const fit = zoneFit(g, zoneOf(i), v); if (fit.level === 'bad') emit('toast', { text: fit.note, c: 'bad' });
  return true;
}
export function pourPlate(g, i, medium) {
  if (!spotOpen(g, i) || g.slots[i] || !pay(g, SUPPLIES.plate)) return false;
  const ws = workspace(g);
  if (ws !== 'open') count(g, 'platesClean');
  return place(g, i, mk(g, 'plate', { medium, ws }), `Poured a ${MEDIA[medium].name} plate ${ws === 'hood' ? 'at the flow hood' : ws === 'sab' ? 'in the still-air box' : 'on the open counter'}.`);
}
export { buy };
export function prepJar(g, i, prep) {
  if (!unlocked(g, 'jar') || !spotOpen(g, i) || g.slots[i]) return false;
  if (prep === 'ster' && !canSterilizeJars(g)) { emit('toast', { text: 'You need a pressure cooker to sterilize grain. The shop has two sizes.', c: 'bad' }); return false; }
  if (!pay(g, SUPPLIES.jar)) return false;
  const v = mk(g, 'jar', { prep, state: prep === 'ster' ? 'queued' : 'bath', scaled: !!g.gear.scale }); if (prep === 'ster') g.queue.push(v.id);
  return place(g, i, v, `Grain jar #${v.id}: ${prep === 'ster' ? 'queued for the pressure cooker' : 'into the hot-water bath'}.`);
}
export function prepBag(g, i, recipe, prep) {
  if (!unlocked(g, 'bag') || !spotOpen(g, i) || g.slots[i]) return false;
  if (prep === 'ster' && !canSterilizeBags(g)) { emit('toast', { text: 'Grow bags only fit the 23 qt pressure canner.', c: 'bad' }); return false; }
  const R = spg(g).recipes[recipe]; if (!R || R.bed) return false;
  if (!pay(g, R.cost)) return false;
  const v = mk(g, 'bag', { recipe, prep, state: prep === 'ster' ? 'queued' : 'bath', scaled: !!g.gear.scale, sealed: !!g.gear.sealer });
  if ((R.rich >= 3) === (prep === 'ster') && recipe !== 'coffee') count(g, 'matchedPrep');
  if (prep === 'ster' && R.rich >= 3) count(g, recipe === 'sawspawn' ? 'spawnBags' : 'hardwoodBags');
  if (prep === 'ster') g.queue.push(v.id);
  return place(g, i, v, `${R.name} bag #${v.id}: ${prep === 'ster' ? 'queued for the pressure cooker' : 'pasteurizing'}.`);
}
/** Colonized vessels that can inoculate target t (plates → jars, jars → bags, spawn bags → beds), same species only. */
export function sources(g, t) {
  const want = t.kind === 'jar' ? ['plate', 'lc'] : t.kind === 'lc' ? ['plate'] : t.kind === 'bed' ? ['bag'] : ['jar'];
  return g.slots.map((v, i) => ({ v, i })).filter(s => s.v && want.includes(s.v.kind) && s.v.state === 'colonized' && s.v.uses > 0 && (s.v.sp || 'pink-oyster') === (t.sp || 'pink-oyster'));
}
export function inoculate(g, ti, si) {
  const t = g.slots[ti], s = g.slots[si];
  t.state = 'colonizing'; t.prog = 0; t.parent = s.id; s.uses--;
  const why = inheritedCause(s);
  if (why) { t.contam.onset = g.day; t.contam.why = why; }
  else if (t.kind !== 'bed' && !C.dev.god && rand() < C.contam.openAirInoc * workFactor(workspace(g)) * C.contam.hazardScale * hazardMult(g)) {
    t.contam.onset = g.day; t.contam.why = workspace(g) === 'open' ? 'open_air' : 'luck'; // spores got in while the jar/bag was open
  }
  if (s.medium === 'super') t.medium = 'super'; // remember the super-agar lineage for hidden-mold attribution
  if (s.kind === 'lc') t.fromLC = true;
  if (!(s.contam.vis > 0)) { count(g, t.kind === 'jar' ? 'cleanSpawn' : t.kind === 'bed' ? 'bedSpawned' : t.kind === 'lc' ? 'lcSpawned' : 'bagSpawned'); if (s.kind === 'lc' && s.lc === 'dilute') count(g, 'lcToGrain'); }
  emit('sfx', { name: 'build' }); emit('float', { slot: ti, text: 'Spawned!', c: 'good' });
  log(g, `Spawned #${t.id} from #${s.id}${s.contam.vis > 0 ? ' (it had visible mold)' : ''}.`, s.contam.vis > 0 ? 'bad' : '');
  if (s.uses <= 0) { g.slots[si] = null; log(g, `#${s.id} is used up.`); }
  return true;
}
export function toss(g, i) {
  const v = g.slots[i]; if (!v) return false;
  g.queue = g.queue.filter(id => id !== v.id); g.cookers.forEach(k => { k.batch = k.batch.filter(id => id !== v.id); });
  g.slots[i] = null; emit('sfx', { name: 'tap' }); log(g, `Tossed #${v.id} ${vName(v)}.`); return true;
}
export function cutEdge(g, i) {
  const v = g.slots[i]; if (!pay(g, SUPPLIES.plate)) return false;
  v.contam = { onset: null, vis: 0, why: null }; v.prog = 0.3; v.state = 'colonizing'; v.uses = 0; v.ws = workspace(g);
  g.stats.rescued++; learn(g, 'agar_job'); emit('sfx', { name: 'good' }); emit('float', { slot: i, text: 'Rescued!', c: 'good' });
  log(g, `Cut a clean edge from #${v.id} onto a fresh plate.`, 'good'); return true;
}
export function shake(g, i) {
  const v = g.slots[i]; if (!canShake(v)) return false;
  v.shaken = true; v.prog += (1 - v.prog) * RULES.shakeBoost; learn(g, 'shake'); count(g, 'shaken');
  emit('sfx', { name: 'shake' }); emit('wobble', { slot: i }); emit('float', { slot: i, text: 'Shaken!' }); return true;
}
export function harvest(g, i) {
  const v = g.slots[i], h = harvestKg(v);
  g.lots.push({ kg: h.kg, age: 0, id: ++g.lotSeq, sp: v.sp || 'pink-oyster' }); g.stats.harvestKg += h.kg;
  if (v.kind === 'bed' && h.stage === 'peak') count(g, 'bedHarvests');
  if (h.qc < 0.8) learn(g, 'leggy');
  if (h.qh < 0.8) learn(g, 'dry_caps');
  if (v.flush >= 3) learn(g, 'flush3');
  if (h.stage === 'peak' && h.qual >= 0.8 && v.kind !== 'bed') count(g, 'goodHarvests');
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
/** Move a vessel to an empty, open spot (e.g. a colonized block from the closet into the grow tent). */
export function move(g, from, to) {
  const v = g.slots[from];
  if (!v || from === to || g.slots[to] || !spotOpen(g, to) || v.kind === 'bed') return false;
  if (['cooking', 'queued'].includes(v.state)) { emit('toast', { text: 'It’s waiting for the pressure cooker. Move it after.', c: 'bad' }); return false; }
  g.slots[to] = v; g.slots[from] = null;
  if (zoneOf(to) === 'tent' && zoneOf(from) !== 'tent' && ['pinning', 'growing', 'resting'].includes(v.state)) count(g, 'movedToTent');
  const z = ZONE_BY_ID[zoneOf(to)], fit = zoneFit(g, z.id, v);
  emit('sfx', { name: 'tap' }); emit('moved', { from, to });
  log(g, `Moved #${v.id} to the ${z.name.toLowerCase()}.`);
  if (fit.level === 'bad') emit('toast', { text: fit.note, c: 'bad' }); else if (fit.note && fit.level === 'good' && z.id === 'tent') emit('toast', { text: `#${v.id} is in the tent. ${fit.note}`, c: 'good' });
  return true;
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
  if (right) { g.cash += RULES.quizTip; g.stats.revenue += RULES.quizTip; emit('sfx', { name: 'coin' }); emit('cash', { delta: RULES.quizTip }); } else emit('sfx', { name: 'bad' });
  return right;
}
export { money };

/* ---------- wine cap beds (yard) ---------- */
/** Build an outdoor bed on a yard spot: 'chips' (free arborist hardwood chips), 'straw' or 'pine'. Waits for spawn. */
export function buildBed(g, i, type) {
  const B = (spg(g).beds || {})[type];
  if (!B || !unlocked(g, 'bed') || zoneOf(i) !== 'yard' || !spotOpen(g, i) || g.slots[i] || !pay(g, B.cost)) return false;
  if (type === 'chips') count(g, 'hardwoodBed');
  return place(g, i, mk(g, 'bed', { recipe: type, state: 'ready', water: 1 }), `Built a ${B.name.toLowerCase()} bed in the yard. It needs sawdust spawn.`);
}
/** Run the hose over a bed. */
export function water(g, i) {
  const v = g.slots[i]; if (!v || v.kind !== 'bed') return false;
  if ((v.water ?? 1) < 0.5) count(g, 'watered');
  v.water = 1; emit('sfx', { name: 'tap' }); emit('float', { slot: i, text: 'Watered' }); log(g, `Watered bed #${v.id}.`);
  return true;
}

/* ---------- species ---------- */
/** Move on to the next species once the current one is mastered. Stages repeat; what you learned carries over. */
export function startSpecies(g, id = nextSpecies(g.species), force = false) {
  if (!SPECIES_BY[id] || id === g.species) return false;
  if (!force && (!g.speciesDone || id !== nextSpecies(g.species))) return false;
  const prev = g.species || 'pink-oyster';
  g.masteredBy = { ...(g.masteredBy || {}), [prev]: [...g.mastered] };
  g.countsBy = { ...(g.countsBy || {}), [prev]: g.counts };
  if (!(g.speciesMastered || []).includes(prev) && force) g.speciesMastered = [...(g.speciesMastered || []), prev];
  g.species = id; g.stage = 0; g.units = 0; g.mastered = []; g.counts = {}; g.speciesDone = false;
  g.weekStart = weekSnapshot(g);
  const P = packOf(id);
  log(g, `New species: ${P.name} (${P.latin}). Back to agar, with everything you learned.`, 'good');
  emit('track', { type: 'speciesStart', data: { species: id, week: g.week } });
  emit('speciesStart', { species: id });
  emit('stage', { stage: 0, id: ladderOf(id)[0].id, species: id });
  return true;
}

/* ---------- Expert: liquid culture ---------- */
/** Mix an LC jar ('dilute' or 'rich') and queue it for the pressure cooker. Expert runs only. */
export function prepLC(g, i, lc) {
  if (!LC_MEDIA[lc] || !unlocked(g, 'lc') || !spotOpen(g, i) || g.slots[i]) return false;
  if (!canSterilizeJars(g)) { emit('toast', { text: 'Liquid culture has to be pressure-cooked. Buy a cooker in the shop.', c: 'bad' }); return false; }
  if (!pay(g, SUPPLIES.lc)) return false;
  const v = mk(g, 'lc', { lc, prep: 'ster', state: 'queued' }); g.queue.push(v.id);
  if (lc === 'dilute') count(g, 'diluteLC');
  return place(g, i, v, `Liquid culture #${v.id} (${LC_MEDIA[lc].name}): queued for the pressure cooker.`);
}
