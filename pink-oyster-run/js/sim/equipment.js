// Equipment: buying gear and what it enables, plus the pressure cookers.
// Pressure cookers: each owned cooker runs its own load (jar = 1 space, bag = RULES.bagUnits; bags need the 23 qt).
// A cycle takes equipment.cookerDays real days including cooling.
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { emit } from './events.js';
import { toBio } from './clock.js';
import { EQUIPMENT } from '../content/equipment.js';
import { log, learn } from './journal.js';
import { count } from './mastery.js';
import { pay, money } from './economy.js';
import { unlocked, stageNameFor } from './stages.js';


export const findV = (g, id) => g.slots.find(v => v && v.id === id);
const size = v => v.kind === 'bag' ? RULES.bagUnits : 1;
/** Fill an idle cooker from the queue, in queue order, with what fits. */
function load(g, k) {
  const cap = EQUIPMENT[k.id].cooker, room = cap.jars;
  let used = 0, bags = 0; const keep = [];
  for (const id of g.queue) {
    const v = findV(g, id);
    if (!v) continue;
    const fits = v.kind === 'bag' ? bags < cap.bags && used + size(v) <= room : used + 1 <= room;
    if (fits) { k.batch.push(id); used += size(v); if (v.kind === 'bag') bags++; v.state = 'cooking'; } else keep.push(id);
  }
  g.queue = keep;
}
export function stepCooker(g, dd) {
  for (const k of g.cookers) {
    if (!k.batch.length && g.queue.length) { load(g, k); k.t = 0; if (k.batch.length) emit('sfx', { name: 'hiss' }); }
    if (!k.batch.length) continue;
    k.t += toBio(dd);
    if (k.t >= C.equipment.cookerDays) {
      let n = 0; k.batch.forEach(id => { const v = findV(g, id); if (v && v.state === 'cooking') { v.state = 'ready'; n++; if (v.kind === 'jar') count(g, 'cookedJars'); } });
      k.batch = []; k.t = 0;
      if (n) { emit('toast', { text: `${EQUIPMENT[k.id].name}: ${n} sterile vessel${n > 1 ? 's' : ''} ready for spawn.`, c: 'good' }); emit('sfx', { name: 'good' }); }
    }
  }
}

/* ---------- buying gear ---------- */
export const priceOf = id => Math.round(EQUIPMENT[id].price * C.shop.priceScale * 100) / 100;
export const owns = (g, id) => !!g.gear[id];

/** Can the player buy item `id` now? Returns { ok, why }. */
export function canBuy(g, id) {
  const it = EQUIPMENT[id];
  if (!it) return { ok: false, why: 'Unknown item.' };
  if (owns(g, id)) return { ok: false, why: 'Owned.' };
  if (it.opens && !unlocked(g, it.opens)) return { ok: false, why: `Sold from the ${stageNameFor(it.opens)} stage.` };
  if (it.needs && !owns(g, it.needs)) return { ok: false, why: `Needs the ${EQUIPMENT[it.needs].name.toLowerCase()} first.` };
  if (g.cash < priceOf(id)) return { ok: false, why: `Costs ${money(priceOf(id))}.` };
  return { ok: true, why: '' };
}
export function buy(g, id) {
  const c = canBuy(g, id);
  if (!c.ok) { emit('toast', { text: c.why, c: 'bad' }); return false; }
  if (!pay(g, priceOf(id))) return false;
  g.gear[id] = true; g.stats.gear = (g.stats.gear || 0) + priceOf(id);
  if (id === 'sab' || id === 'flowhood') learn(g, 'sab');
  if (EQUIPMENT[id].cooker) g.cookers.push({ id, batch: [], t: 0 });
  emit('sfx', { name: 'coin' }); emit('bought', { id });
  emit('track', { type: 'buy', data: { id, price: priceOf(id) } });
  log(g, `Bought: ${EQUIPMENT[id].name} (${money(priceOf(id))}).`, 'good');
  return true;
}

/** Spore multiplier for plate work and inoculations (flow hood > still-air box > open counter). */
export const workspace = g => g.gear.flowhood ? 'hood' : g.gear.sab ? 'sab' : 'open';
export const workFactor = ws => ws === 'hood' ? C.contam.flowHoodFactor : ws === 'sab' ? C.contam.sabFactor : 1;
export const canSterilizeJars = g => g.cookers.length > 0;
export const canSterilizeBags = g => g.cookers.some(k => EQUIPMENT[k.id].cooker.bags > 0);
export const canDry = g => owns(g, 'dehydrator');
export const seesClimate = g => owns(g, 'hygrometer');
export const seesCO2 = g => owns(g, 'co2');
