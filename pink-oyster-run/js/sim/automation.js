// Optional automation (see content/automation.js). Pure: it calls the same actions the player uses.
// Runs a few times per game day; fees are charged at each week end in game.js.
import { emit } from './events.js';
import { log } from './journal.js';
import { AUTOMATION } from '../content/automation.js';
import { spg } from '../content/species/index.js';
import { spotsIn, spotOpen, zoneOf } from './zones.js';
import { isBlock } from './contamination.js';
import { canShake } from './growth.js';
import { shelfLifeDays, dryAll } from './economy.js';
import { canSterilizeJars, canSterilizeBags, workspace } from './equipment.js';
import * as act from './game.js';
import { listDried, productOpen } from './shop.js';

/** Is automation `id` available (its stage mastered on the current species)? */
export const autoAvailable = (g, id) => !!AUTOMATION[id] && AUTOMATION[id].stages.some(s => (g.mastered || []).includes(s));
export const autoOn = (g, id) => !!(g.auto && g.auto[id]) && autoAvailable(g, id);
export function setAuto(g, id, on) {
  if (on && !autoAvailable(g, id)) return false;
  g.auto = { ...(g.auto || {}), [id]: !!on };
  log(g, `${AUTOMATION[id].name} switched ${on ? 'on' : 'off'}${on ? ` ($${AUTOMATION[id].fee}/week)` : ''}.`);
  emit('track', { type: 'automation', data: { id, on: !!on } });
  return true;
}
export const weeklyFee = g => Object.keys(AUTOMATION).filter(id => autoOn(g, id)).reduce((a, id) => a + AUTOMATION[id].fee, 0);

const INCUBATE = ['closet', 'kitchen'];
const freeSpot = g => INCUBATE.flatMap(spotsIn).find(i => !g.slots[i] && spotOpen(g, i));
const mine = g => v => v && (v.sp || 'pink-oyster') === (g.species || 'pink-oyster');
function did(g, id, ok) { if (ok) { g.stats.autoActions = (g.stats.autoActions || 0) + 1; g.stats.autoBy = g.stats.autoBy || {}; g.stats.autoBy[id] = (g.stats.autoBy[id] || 0) + 1; } return ok; }

/** One automation pass. Each routine does at most one placement per pass, like a person working through a list. */
export function stepAutomation(g) {
  if (!g.auto) return;
  const P = spg(g), own = mine(g);
  const each = (f) => g.slots.forEach((v, i) => { if (own(v)) f(v, i); });
  if (autoOn(g, 'harvest')) each((v, i) => {
    if (v.state === 'peak') did(g, 'harvest', act.harvest(g, i));
    else if (v.state === 'spent' && v.kind === 'bag') did(g, 'harvest', act.retire(g, i));
    else if (v.state === 'lost' && v.kind !== 'plate') did(g, 'harvest', act.toss(g, i));
  });
  if (autoOn(g, 'harvest') && g.gear.dehydrator && g.lots.some(l => l.age + (g.nextMarket - g.day) * 2.5 > shelfLifeDays(g, l.sp))) did(g, 'harvest', dryAll(g));
  if (autoOn(g, 'harvest') && productOpen(g, 'dried') && g.dried * 2.2046 >= 1) did(g, 'harvest', listDried(g));
  if (autoOn(g, 'bed')) each((v, i) => { if (v.kind === 'bed' && v.water < 0.4 && v.state !== 'spent') did(g, 'bed', act.water(g, i)); });
  if (autoOn(g, 'fruiting') && P.climate) {
    g.heater = g.gear.heatmat ? P.climate.heater : 0; g.fae = P.climate.fae; g.mist = g.gear.humidifier ? P.climate.mist : P.climate.handMist;
    each((v, i) => {
      if (isBlock(v) && ['pinning', 'growing', 'resting'].includes(v.state) && zoneOf(i) !== 'tent') {
        const t = spotsIn('tent').find(j => !g.slots[j] && spotOpen(g, j)); if (t != null) did(g, 'fruiting', act.move(g, i, t));
      }
    });
  }
  const clean = s => !(s.v.contam.vis > 0);
  if (autoOn(g, 'grain')) each((v, i) => {
    if (v.kind === 'jar' && v.state === 'ready') { const s = act.sources(g, v).filter(clean); if (s.length) did(g, 'grain', act.inoculate(g, i, (s.find(x => x.v.kind === 'lc') || s[0]).i)); }
    else if (v.kind === 'jar' && canShake(v)) did(g, 'grain', act.shake(g, i));
    else if (v.kind === 'jar' && v.contam.vis > 0) did(g, 'grain', act.toss(g, i));
  });
  if (autoOn(g, 'substrate')) each((v, i) => {
    if (v.kind === 'bag' && v.state === 'ready') { const s = act.sources(g, v).filter(clean); if (s.length) did(g, 'substrate', act.inoculate(g, i, s[0].i)); }
    else if (v.kind === 'bag' && v.contam.vis > 0 && !isBlock(v)) did(g, 'substrate', act.toss(g, i));
  });
  if (autoOn(g, 'agar')) each((v, i) => { if (v.kind === 'plate' && v.contam.vis > 0) did(g, 'agar', act.toss(g, i)); });
  // placements: one new vessel per routine per pass, while there's room and a reserve of cash
  const n = f => g.slots.filter(v => own(v) && f(v)).length, reserve = 40;
  let e = freeSpot(g);
  if (e != null && autoOn(g, 'substrate') && g.cash > reserve && n(v => v.kind === 'bag' && ['queued', 'cooking', 'bath', 'ready'].includes(v.state)) < 1 && n(v => v.kind === 'jar' && v.state === 'colonized')) {
    const r = P.basic.find(k => P.buyable[k].rich >= 3) || P.basic[0], ster = P.buyable[r].rich >= 3;
    if (!ster || canSterilizeBags(g)) { did(g, 'substrate', act.prepBag(g, e, r, ster ? 'ster' : 'past')); e = freeSpot(g); }
  }
  if (e != null && autoOn(g, 'grain') && g.cash > reserve && canSterilizeJars(g) && n(v => v.kind === 'jar' && v.state !== 'colonized') < 2) { did(g, 'grain', act.prepJar(g, e, 'ster')); e = freeSpot(g); }
  if (e != null && autoOn(g, 'agar') && g.cash > reserve && workspace(g) !== 'open' && n(v => v.kind === 'plate' && v.state === 'colonizing') < 2 && n(v => v.kind === 'plate' && v.state === 'colonized') < 2) did(g, 'agar', act.pourPlate(g, e, 'mea'));
}

/** Week end: charge fees; switch everything off if the money isn't there. Returns what was paid. */
export function chargeAutomation(g) {
  const fee = weeklyFee(g); if (!fee) return 0;
  if (g.cash < fee) {
    g.auto = {}; emit('toast', { text: 'Couldn’t pay for automation this week, so it’s all switched off.', c: 'bad' }); log(g, 'Automation switched off: not enough cash for the weekly fees.', 'bad');
    return 0;
  }
  g.cash -= fee; g.stats.spent += fee; g.stats.automation = (g.stats.automation || 0) + fee; emit('cash', { delta: -fee });
  return fee;
}
