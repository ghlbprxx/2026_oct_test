// Online shop: list products of mastered stages, set prices, sell over time by price vs demand, live with reputation.
// Shipping a hidden infection or a salvaged (low-quality) item costs refunds and reputation; good sales rebuild it.
import { C } from './cfg.js';
import { emit } from './events.js';
import { rand } from './rng.js';
import { log, learn } from './journal.js';
import { count } from './mastery.js';
import { money, lb } from './economy.js';
import { STAGES, PRODUCTS } from '../content/stages.js';

/** Which product a vessel would be, if any. Colonized plate → plate, colonized jar → jar, colonized bag not yet fruiting → kit. */
export function productFor(v) {
  if (!v || v.contam.vis > 0 || v.state === 'lost') return null;
  if (v.kind === 'plate' && v.state === 'colonized') return 'plate';
  if (v.kind === 'jar' && v.state === 'colonized') return 'jar';
  if (v.kind === 'bag' && v.state === 'pinning' && v.flush === 1 && !v.q.n) return 'kit';
  return null;
}
export const productOpen = (g, p) => g.mastered.includes(STAGES[PRODUCTS[p].stage].id);
export const basePrice = p => +(p === 'dried' ? C.economy.priceDried : PRODUCTS[p].base * Math.pow(C.shop.stageMult, PRODUCTS[p].stage)).toFixed(2);
export const priceOf = (g, p) => g.prices[p] ?? basePrice(p);
/** Expected sales per game day for product p at its current price and the current reputation. */
export function salesRate(g, p) {
  return C.shop.demand * (g.rep / 50) * Math.exp(-C.shop.elasticity * (priceOf(g, p) / basePrice(p) - 1));
}
export function setPrice(g, p, price) { g.prices[p] = Math.max(1, Math.round(price * 100) / 100); return g.prices[p]; }

export function listVessel(g, i) {
  const v = g.slots[i], p = productFor(v);
  if (!p || !productOpen(g, p)) return false;
  g.stock[p].push({ id: v.id, bad: v.contam.onset != null, meh: (v.salvage ?? 1) < 1 });
  g.slots[i] = null; emit('sfx', { name: 'build' }); emit('listed', { slot: i, product: p });
  log(g, `Listed #${v.id} in the online shop as “${PRODUCTS[p].name}”.`);
  return true;
}
/** Dried product is listed by the fresh-pound. */
export function listDried(g) {
  if (!productOpen(g, 'dried')) return false;
  const n = Math.floor(lb(g.dried)); if (n < 1) return false;
  for (let k = 0; k < n; k++) g.stock.dried.push({ bad: false, meh: false });
  g.dried -= n / 2.20462; emit('sfx', { name: 'build' }); log(g, `Listed ${n} lb (fresh weight) of dried pinks online.`); return true;
}

function sell(g, p) {
  const item = g.stock[p].shift(), price = priceOf(g, p);
  count(g, 'sales');
  if (item.bad) {
    g.rep = Math.max(0, g.rep - C.shop.refundHit); count(g, 'refunds');
    emit('toast', { text: `Refund: a ${PRODUCTS[p].name.toLowerCase()} arrived moldy. “Green fuzz in the box. 1★” Reputation −${C.shop.refundHit}.`, c: 'bad' });
    emit('sfx', { name: 'bad' }); log(g, `Refund + 1★ review: ${PRODUCTS[p].name} arrived contaminated.`, 'bad');
    learn(g, 'shipped_mold'); emit('track', { type: 'refund', data: { product: p } });
    return;
  }
  const paid = item.meh ? price / 2 : price;
  g.cash += paid; g.stats.revenue += paid; g.stats.byProduct = g.stats.byProduct || {}; g.stats.byProduct[p] = (g.stats.byProduct[p] || 0) + paid;
  g.rep = Math.min(100, g.rep + (item.meh ? -2 : 1));
  emit('cash', { delta: paid }); emit('sfx', { name: 'sale' });
  emit('track', { type: 'sale', data: { product: p, stage: STAGES[PRODUCTS[p].stage].id, price: paid } });
  if (item.meh) log(g, `Sold a ${PRODUCTS[p].name.toLowerCase()} at half price after a 3★ “a bit weak” review.`);
  else if (rand() < 0.3) log(g, `★★★★★ “${['Fast and clean!', 'Colonized like crazy.', 'Exactly as described.', 'Will buy again.'][Math.floor(rand() * 4)]}” — ${PRODUCTS[p].name} (${money(price)})`, 'good');
}
export function stepShop(g, dd) {
  for (const p of Object.keys(g.stock)) {
    if (!g.stock[p].length) continue;
    if (rand() < 1 - Math.exp(-salesRate(g, p) * dd)) sell(g, p);
  }
  if (g.rep < C.shop.startReputation) g.rep = Math.min(C.shop.startReputation, g.rep + C.shop.recovery * dd); // reviews fade
}
