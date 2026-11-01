// Equipment: buying gear, and the capabilities it grants (clean work, cookers, readings, drying).
import { C } from './cfg.js';
import { emit } from './events.js';
import { log, learn } from './journal.js';
import { pay, money } from './economy.js';
import { unlocked, unlockWeek } from './stages.js';
import { weekOf } from './clock.js';
import { EQUIPMENT } from '../content/equipment.js';

export const priceOf = id => Math.round(EQUIPMENT[id].price * C.shop.priceScale * 100) / 100;
export const owns = (g, id) => !!g.gear[id];
const weekNeeded = it => it.week === 'room' ? unlockWeek('room') : it.week || 0;

/** Can the player buy item `id` now? Returns { ok, why }. */
export function canBuy(g, id) {
  const it = EQUIPMENT[id];
  if (!it) return { ok: false, why: 'Unknown item.' };
  if (owns(g, id)) return { ok: false, why: 'Owned.' };
  if (weekOf(g.day) < weekNeeded(it)) return { ok: false, why: `Sold from week ${weekNeeded(it)}.` };
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
