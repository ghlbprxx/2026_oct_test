// Headless playtesting: scripted strategies that play the real sim (same functions the UI calls), plus a runner
// that records how a whole game goes — weeks per stage, cash curve, lowest cash, revenue by source.
// Pure: no DOM. Used by tests/economy.test.js and tools/playtest.mjs.
import { C } from './cfg.js';
import { rand } from './rng.js';
import * as sim from './game.js';
import { buy, canBuy, priceOf } from './equipment.js';
import { listVessel, listDried, productFor, productOpen } from './shop.js';
import { dryAll, shelfLifeDays } from './economy.js';
import { canShake } from './growth.js';
import { isBlock } from './contamination.js';
import { spotsIn, spotOpen, zoneOf } from './zones.js';
import { unlocked } from './stages.js';
import { STAGES, OPENS } from '../content/stages.js';
import { spg, packOf, nextSpecies } from '../content/species/index.js';

const INCUBATE = ['closet', 'kitchen', 'garage'];
const free = (g, zones = INCUBATE) => zones.flatMap(spotsIn).find(i => !g.slots[i] && spotOpen(g, i));
const n = (g, f) => g.slots.filter(v => v && f(v)).length;

/** Gear the careful player buys, in order, once the stage needs it and cash allows (keeping a reserve). */
const KIT = [['sab', 0], ['hygrometer', 0], ['cooker23', 1], ['rack', 1], ['tent', 3], ['heatmat', 3], ['humidifier', 3], ['dehydrator', 3]];
function shopFor(g, reserve) {
  const indoor = spg(g).bagFruits; // outdoor wine cap needs no tent gear
  for (const [id, stage] of KIT) if (g.stage >= stage && !g.gear[id] && (indoor || !['tent', 'heatmat', 'humidifier'].includes(id)) && canBuy(g, id).ok && g.cash - priceOf(id) >= reserve) buy(g, id);
}
function tend(g, { moveToTent = true, cutPlates = true } = {}) {
  g.slots.forEach((v, i) => {
    if (!v) return;
    if (v.state === 'lost' || (v.contam.vis > 0 && v.kind !== 'plate')) return sim.toss(g, i);
    if (v.contam.vis > 0) return cutPlates && g.cash > 20 ? sim.cutEdge(g, i) : sim.toss(g, i);
    if (v.state === 'peak' || v.state === 'overripe') return sim.harvest(g, i);
    if (v.kind === 'bed' && (v.water ?? 1) < 0.4) return sim.water(g, i);
    if (v.state === 'spent') return sim.retire(g, i);
    if (canShake(v)) return sim.shake(g, i);
    if (v.state === 'ready') { const s = sim.sources(g, v).filter(x => !(x.v.contam.vis > 0)); if (s.length) return sim.inoculate(g, i, s[0].i); }
    if (moveToTent && isBlock(v) && zoneOf(i) !== 'tent') { const t = spotsIn('tent').find(j => !g.slots[j] && spotOpen(g, j)); if (t != null) return sim.move(g, i, t); }
    if (['kitchen', 'garage'].includes(zoneOf(i)) && v.state === 'colonizing') { const c = spotsIn('closet').find(j => !g.slots[j]); if (c != null) sim.move(g, i, c); }
  });
}

export const STRATEGIES = {
  /** Does nothing. */
  idle: () => {},
  /** Taps random spots with random choices. */
  random(g) {
    if (rand() > 0.1) return;
    const i = Math.floor(rand() * g.slots.length), v = g.slots[i], r = rand();
    if (!v) { if (r < 0.4) sim.pourPlate(g, i, ['mea', 'super', 'cma'][Math.floor(rand() * 3)]); else if (r < 0.7) sim.prepJar(g, i, rand() < 0.5 ? 'ster' : 'past'); else sim.prepBag(g, i, ['coir', 'straw', 'saw', 'masters'][Math.floor(rand() * 4)], rand() < 0.5 ? 'ster' : 'past'); return; }
    if (r < 0.15) sim.toss(g, i); else if (r < 0.4 && v.state === 'ready') { const s = sim.sources(g, v); if (s.length) sim.inoculate(g, i, s[0].i); }
    else if (r < 0.6) sim.move(g, i, Math.floor(rand() * g.slots.length)); else if (r < 0.8 && v.state === 'peak') sim.harvest(g, i);
    else if (r < 0.85) { const ids = ['sab', 'cooker16', 'cooker23', 'tent', 'heatmat', 'scale']; const id = ids[Math.floor(rand() * ids.length)]; if (canBuy(g, id).ok) buy(g, id); }
  },
  /** Cuts corners: no still-air box, pasteurizes everything, super agar, never sells online. */
  sloppy(g) {
    if (g.stage >= 1 && !g.gear.cooker16 && canBuy(g, 'cooker16').ok) buy(g, 'cooker16');
    if (g.stage >= 3 && !g.gear.tent && canBuy(g, 'tent').ok) buy(g, 'tent');
    g.fae = 2; g.mist = 80;
    tend(g, { cutPlates: false });
    const e = free(g); if (e == null) return;
    if (n(g, v => v.kind === 'plate') < 2) sim.pourPlate(g, e, 'super');
    else if (unlocked(g, 'bag') && n(g, v => v.kind === 'bag' && v.state === 'ready') < 1) sim.prepBag(g, e, 'masters', 'past');
    else if (unlocked(g, 'jar') && n(g, v => v.kind === 'jar') < 2) sim.prepJar(g, e, 'past');
  },
  /** Careful technique and good climate, but never lists anything online (fresh/dried at market only). */
  marketOnly(g) { careful(g, { online: false }); },
  /** Careful technique, sells surplus plates, spawn and kits online, dries and lists the surplus harvest. */
  careful(g) { careful(g, { online: true }); },
};

/** Pipeline decisions follow the current species' ladder (for pinks this equals unlocked()). */
const atStage = (g, what) => (g.stage ?? 0) >= (OPENS[what] ?? 0);

function careful(g, { online }) {
  const reserve = g.mode === 'hardcore' ? 60 : 120;
  shopFor(g, reserve);
  const P = spg(g);
  if (P.id === 'pink-oyster') { if (g.gear.heatmat) g.heater = 1; g.fae = 5; g.mist = 98; }
  else if (P.climate) { g.heater = g.gear.heatmat ? P.climate.heater : 0; g.fae = P.climate.fae; g.mist = P.climate.mist; }
  // the game's own 'auto' booking (haul worth 3× the fee); book anyway if the checklist still needs a market day
  g.marketMode = g.stage === 4 && !(g.counts.marketDays > 0) && g.lots.length ? 'book' : 'auto';
  tend(g);
  if (g.lots.length && g.gear.dehydrator && (g.lots.some(l => l.age > (l.sp && l.sp !== 'pink-oyster' ? 0.85 * shelfLifeDays(g, l.sp) : 1.8)) || !atStage(g, 'market'))) dryAll(g);
  if (online) {
    // list surplus: keep 1 colonized plate (2 once jars are open) and enough jars for the bags we still need
    const keepPlates = atStage(g, 'jar') ? 2 : 0, keepJars = atStage(g, 'bag') ? 2 : 0;
    let plates = 0, jars = 0;
    g.slots.forEach((v, i) => {
      const p = productFor(v); if (!p || !productOpen(g, p)) return;
      if (p === 'plate' && ++plates > keepPlates) listVessel(g, i);
      else if (p === 'jar' && ++jars > keepJars) listVessel(g, i);
      else if (p === 'kit' && (!g.gear.tent || spotsIn('tent').every(j => g.slots[j]))) listVessel(g, i); // tent full: sell it as a grow kit
    });
    if (productOpen(g, 'dried')) listDried(g);
  }
  // keep the pipeline full, focused on what the current stage needs; never incubate in the cold garage
  const e = free(g, ['closet', 'kitchen']);
  const count = f => n(g, f), plate = v => v.kind === 'plate';
  const plates = count(plate), growingPlates = count(v => plate(v) && v.state === 'colonizing'), readyPlates = count(v => plate(v) && v.state === 'colonized');
  const jars = count(v => v.kind === 'jar'), bags = count(v => v.kind === 'bag' && !isBlock(v)), blocks = count(v => isBlock(v));
  const tentFree = g.gear.tent ? spotsIn('tent').filter(j => !g.slots[j]).length : 0;
  // colonized plates with no use yet: clear the oldest so plate work continues (agar stage only)
  if (e == null && readyPlates >= (atStage(g, 'jar') ? 2 : 3)) { const old = g.slots.findIndex(v => v && plate(v) && v.state === 'colonized'); if (old >= 0) (online && productOpen(g, 'plate') ? listVessel(g, old) : sim.toss(g, old)); return; }
  if (e == null) return;
  const canBags = atStage(g, 'bag') && g.cookers.some(k => k.id === 'cooker23'), canJars = atStage(g, 'jar') && g.cookers.length;
  if (!atStage(g, 'jar')) { if (growingPlates < 3 && g.cash > 10) sim.pourPlate(g, e, 'mea'); return; }
  if (plates < 1 && g.cash > 10) return void sim.pourPlate(g, e, 'mea');
  const kitsWanted = online && productOpen(g, 'kit') ? 2 : 0;
  if (P.id === 'wine-cap') { // spawn bags feed outdoor beds; build a chip bed when spawn is on the way
    const yard = spotsIn('yard').filter(j => !g.slots[j] && spotOpen(g, j));
    if (yard.length && count(v => v.kind === 'bag') > 0) sim.buildBed(g, yard[0], 'chips');
    const beds = count(v => v.kind === 'bed');
    if (canBags && jars > 0 && bags < Math.max(2, 2 - beds + spotsIn('yard').length) && g.cash > 30) return void sim.prepBag(g, e, 'sawspawn', 'ster');
  } else if (canBags && jars > 0 && bags < 2 + tentFree + kitsWanted && g.cash > 30) return void sim.prepBag(g, e, 'masters', 'ster');
  if (canJars && jars < (canBags ? 2 : 3) && g.cash > 20) return void sim.prepJar(g, e, 'ster');
  if (online && productOpen(g, 'plate') && plates < 2 && g.cash > 10) sim.pourPlate(g, e, 'mea'); // spare room: plates sell for ~$10
}

/**
 * Play a whole game headlessly. Returns a summary: weeks to master each stage, weekly cash, lowest cash,
 * revenue by source, gear spend, and whether the run went broke.
 */
export function autoplay({ strategy = 'careful', mode = 'normal', weeks = 20, step = 0.05, onWeek, start = null, continueSpecies = false } = {}) {
  const base = typeof strategy === 'function' ? strategy : STRATEGIES[strategy];
  const g = sim.newGame(mode);
  if (start) sim.startSpecies(g, start, true); // begin directly at a later species (earlier ones count as mastered)
  const play = continueSpecies ? gg => { if (gg.speciesDone && nextSpecies(gg.species)) sim.startSpecies(gg); base(gg); } : base;
  const res = { strategy: typeof strategy === 'string' ? strategy : 'custom', mode, startCash: g.cash, masteredAt: {}, cashByWeek: [], minCash: g.cash, broke: false };
  let week = g.week;
  for (let t = 0; t < weeks * 5 && !g.over; t += step) {
    play(g); sim.update(g, step);
    res.minCash = Math.min(res.minCash, g.cash);
    if (g.week !== week) {
      week = g.week; res.cashByWeek.push(Math.round(g.cash));
      for (const id of g.mastered) if (!(id in res.masteredAt)) res.masteredAt[id] = week;
      if (onWeek) onWeek(g);
    }
  }
  const bp = g.stats.byProduct || {};
  return {
    ...res, broke: g.over && g.endReason === 'broke', endCash: Math.round(g.cash), profit: Math.round(g.cash - g.startCash), gear: Math.round(g.stats.gear || 0),
    stages: g.mastered.length, speciesDone: g.speciesDone, species: g.species, speciesMastered: [...(g.speciesMastered || [])], weeksRepeated: g.weeksRepeated, rep: Math.round(g.rep),
    revenue: { total: Math.round(g.stats.revenue), online: Math.round(Object.values(bp).reduce((a, b) => a + b, 0)), market: Math.round(g.stats.revenue - Object.values(bp).reduce((a, b) => a + b, 0)), byProduct: Object.fromEntries(Object.entries(bp).map(([k, v]) => [k, Math.round(v)])) },
    harvestLb: +(g.stats.harvestKg * 2.20462).toFixed(1), freshLb: +(g.stats.freshKg * 2.20462).toFixed(1), driedLb: +(g.stats.driedKg * 2.20462).toFixed(1), rotLb: +(g.stats.rotKg * 2.20462).toFixed(1), lostToMold: Object.values(g.stats.lost).reduce((a, b) => a + b, 0),
  };
}
export const STAGE_IDS = STAGES.map(s => s.id);
