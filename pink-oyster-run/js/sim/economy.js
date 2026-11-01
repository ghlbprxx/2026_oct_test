// Money, the fresh crate (rot clock), drying, and market days.
import { C } from './cfg.js';
import { rand } from './rng.js';
import { emit } from './events.js';
import { log, learn } from './journal.js';
import { MYTHS } from '../content/myths.js';

export const money = (v, d = 0) => (v < 0 ? '−$' : '$') + Math.abs(v).toFixed(d);
export function pay(g, cost) {
  if (g.cash < cost) { emit('toast', { text: `Not enough cash (${money(cost)}).`, c: 'bad' }); emit('sfx', { name: 'bad' }); return false; }
  g.cash -= cost; g.stats.spent += cost; return true;
}
export function stepLots(g, dd) {
  if (C.dev.god) return;
  let rot = 0; const keep = [];
  for (const l of g.lots) { l.age += dd; if (l.age > C.economy.shelfLife) rot += l.kg; else keep.push(l); }
  if (rot > 0) {
    g.lots = keep; g.stats.rotKg += rot;
    emit('toast', { text: `${rot.toFixed(2)} kg of fresh pinks turned to mush.`, c: 'bad' }); emit('sfx', { name: 'bad' });
    log(g, `${rot.toFixed(2)} kg rotted in the crate.`, 'bad');
    learn(g, 'rot'); emit('track', { type: 'death', data: { cause: 'rot' } });
  }
}
export function dryAll(g) {
  const kg = g.lots.reduce((a, l) => a + l.kg, 0); if (!kg) return false;
  g.dried += kg; g.lots = []; emit('sfx', { name: 'good' }); learn(g, 'dry_save');
  log(g, `Dehydrated ${kg.toFixed(2)} kg.`, 'good'); emit('toast', { text: `Dried ${kg.toFixed(2)} kg. It keeps all season.` });
  return true;
}
export function sellAll(g) {
  const P = C.economy, fresh = g.lots.reduce((a, l) => a + l.kg, 0), dried = g.dried, rev = fresh * P.priceFresh + dried * P.priceDried;
  g.cash += rev; g.stats.revenue += rev; g.stats.freshKg += fresh; g.stats.driedKg += dried; g.lots = []; g.dried = 0;
  return { fresh, dried, rev };
}
export function market(g, closing) {
  const s = sellAll(g);
  if (s.rev > 0) {
    emit('sfx', { name: 'coin' });
    emit('toast', { text: `${closing ? 'Closing market' : 'Market day'}: sold ${s.fresh.toFixed(2)} kg fresh + ${s.dried.toFixed(2)} kg dried for ${money(s.rev)}.`, c: 'good' });
    log(g, `Market: +${money(s.rev, 2)}.`, 'good');
  } else if (!closing) { emit('toast', { text: 'Market day: nothing to sell this time.' }); log(g, 'Market day: nothing to sell.'); }
  if (!closing && s.rev > 0 && rand() < C.economy.quizChance) { // a customer at your stall
    const pool = MYTHS.filter(m => !g.asked.includes(m.s)); if (!pool.length) return s;
    const m = pool[Math.floor(rand() * pool.length)]; g.asked.push(m.s);
    emit('quiz', { m });
  }
  return s;
}
