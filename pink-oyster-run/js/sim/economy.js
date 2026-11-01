// Money, the fresh crate (rot clock), drying, and market days.
import { C } from './cfg.js';
import { rand } from './rng.js';
import { emit } from './events.js';
import { log, learn } from './journal.js';
import { MYTHS } from '../content/myths.js';
import { RULES } from './rules.js';
import { toBio } from './clock.js';
import { rotMult, unlocked } from './stages.js';
import { count } from './mastery.js';
import { packOf, spg } from '../content/species/index.js';

/** Display helpers: yields are kg internally, players see pounds. */
export const lb = kg => kg * RULES.LB;
export const fmtLb = kg => lb(kg).toFixed(2) + ' lb';
/** Real days fresh product keeps: the shelfLife knob (pinks) × the species' keeping multiplier (lion's mane keeps longer). */
export const shelfLifeDays = (g, sp = g.species) => C.economy.shelfLife * rotMult(g) * packOf(sp).shelfMult;
/** $/lb at market for a species: the priceFresh knob (pinks) × the species' price multiplier. */
export const freshPrice = sp => C.economy.priceFresh * packOf(sp).priceMult;
export const driedPrice = g => C.economy.priceDried * spg(g).priceMult;
const lotValue = l => lb(l.kg) * freshPrice(l.sp);

/** $1.50 keeps its cents; whole and large amounts don't. */
export const money = (v, d) => { const a = Math.abs(v); d ??= (a < 100 && Math.abs(a - Math.round(a)) > 0.004) ? 2 : 0; return (v < 0 ? '−$' : '$') + a.toFixed(d); };
export function pay(g, cost) {
  if (g.cash < cost) { emit('toast', { text: `Not enough cash (${money(cost)}).`, c: 'bad' }); emit('sfx', { name: 'bad' }); return false; }
  g.cash -= cost; g.stats.spent += cost; if (cost >= 1) emit('cash', { delta: -cost }); return true;
}
export function stepLots(g, dd) {
  if (C.dev.god) return;
  let rot = 0; const keep = [];
  const db = toBio(dd);
  for (const l of g.lots) { l.age += db; if (l.age > shelfLifeDays(g, l.sp)) rot += l.kg; else keep.push(l); }
  if (rot > 0) {
    g.lots = keep; g.stats.rotKg += rot;
    emit('toast', { text: `${fmtLb(rot)} of fresh mushrooms turned to mush.`, c: 'bad' }); emit('sfx', { name: 'bad' });
    log(g, `${fmtLb(rot)} rotted in the crate.`, 'bad');
    learn(g, 'rot'); emit('track', { type: 'death', data: { cause: 'rot' } });
  }
}
export function dryAll(g) {
  if (!g.gear.dehydrator) { emit('toast', { text: 'You need a dehydrator to dry mushrooms. It’s in the shop.', c: 'bad' }); return false; }
  const kg = g.lots.reduce((a, l) => a + l.kg, 0); if (!kg) return false;
  g.dried += kg; g.lots = []; emit('sfx', { name: 'good' }); learn(g, 'dry_save'); count(g, 'driedBatches');
  log(g, `Dehydrated ${fmtLb(kg)}.`, 'good'); emit('toast', { text: `Dried ${fmtLb(kg)}. It keeps all season.` });
  return true;
}
/** Market day: fresh sells only here (up to what one market absorbs); dried sells here too. Booth fee only when you bring product. */
export function sellAtMarket(g) {
  const P = C.economy, fresh = g.lots.reduce((a, l) => a + l.kg, 0), cap = RULES.marketDemandLb / RULES.LB;
  if (!(fresh > 0 || g.dried > 0)) return { fresh: 0, dried: 0, rev: 0, fee: 0 };
  if (g.cash < P.boothFee) { emit('toast', { text: `Couldn’t afford the ${money(P.boothFee)} booth fee this market day.`, c: 'bad' }); return { fresh: 0, dried: 0, rev: 0, fee: 0 }; }
  g.cash -= P.boothFee; g.stats.spent += P.boothFee; emit('cash', { delta: -P.boothFee });
  let sold = 0, freshRev = 0; const keep = [];
  for (const l of [...g.lots].sort((a, b) => b.age - a.age)) { const take = Math.min(l.kg, cap - sold); sold += take; freshRev += lb(take) * freshPrice(l.sp); if (l.kg - take > 1e-6) keep.push({ ...l, kg: l.kg - take }); }
  const dried = g.dried, rev = freshRev + lb(dried) * driedPrice(g);
  g.lots = keep; g.dried = 0; g.cash += rev; g.stats.revenue += rev; g.stats.freshKg += sold; g.stats.driedKg += dried;
  if (rev > 0) emit('cash', { delta: rev });
  if (sold > 0) { count(g, 'marketDays'); count(g, 'marketLb', lb(sold)); }
  return { fresh: sold, dried, rev, fee: P.boothFee };
}
/** Is today's haul worth a booth? (fresh + dried value at least 3× the fee) */
export function haulWorthIt(g) {
  const P = C.economy;
  return g.lots.reduce((a, l) => a + lotValue(l), 0) + lb(g.dried) * driedPrice(g) >= 3 * P.boothFee;
}
/** Market mode: 'auto' books only when the haul is worth it; 'book' always; 'skip' never. */
export const attending = g => (g.marketMode || (g.attend === false ? 'skip' : 'auto')) === 'auto' ? haulWorthIt(g) : g.marketMode === 'book' || (!g.marketMode && g.attend !== false);
export function market(g, closing) {
  if (!closing && !attending(g)) { log(g, g.marketMode === 'skip' ? 'Skipped market day (booth not booked).' : 'Skipped market day: not enough to sell to cover the booth.'); return { rev: 0 }; }
  const s = sellAtMarket(g);
  if (s.rev > 0) {
    emit('sfx', { name: 'coin' });
    emit('toast', { text: `${closing ? 'Closing market' : 'Market day'}: sold ${fmtLb(s.fresh)} fresh + ${fmtLb(s.dried)} dried for ${money(s.rev)} (booth ${money(s.fee)}).`, c: 'good' });
    log(g, `Market: +${money(s.rev, 2)}.`, 'good');
  } else if (!closing) log(g, 'Market day: nothing to sell.');
  if (!closing && s.rev > 0 && rand() < RULES.quizChance) { // a customer at your stall
    const pool = MYTHS.filter(m => !g.asked.includes(m.s)); if (!pool.length) return s;
    const m = pool[Math.floor(rand() * pool.length)]; g.asked.push(m.s);
    emit('quiz', { m });
  }
  return s;
}
