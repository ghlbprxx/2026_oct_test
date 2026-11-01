// Bot check: doing nothing must earn nothing; careful play must clearly beat sloppy play.
// Gear is an investment (~$400 for the careful kit), so skill is compared on revenue, and net profit is reported.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import * as sim from '../js/sim/game.js';
import { canShake } from '../js/sim/growth.js';
import { dryAll } from '../js/sim/economy.js';
import { buy, canBuy } from '../js/sim/equipment.js';
import { forceMaster } from '../js/sim/mastery.js';
import { rand } from '../js/sim/rng.js';
import { spotsIn, spotOpen } from '../js/sim/zones.js';
import { isBlock } from '../js/sim/contamination.js';

const KITS = { good: ['sab', 'cooker23', 'hygrometer', 'tent', 'heatmat', 'humidifier', 'dehydrator'], sloppy: ['cooker16', 'tent'] };
export function bot(style) {
  return g => {
    if (style === 'idle') return;
    for (const id of KITS[style]) if (!g.gear[id] && canBuy(g, id).ok) buy(g, id);
    g.heater = 1; g.fae = 5; g.mist = style === 'good' ? 98 : 80;
    g.slots.forEach((v, i) => {
      if (!v) return;
      if (v.state === 'lost' || (v.contam.vis > 0 && v.kind !== 'plate')) return sim.toss(g, i);
      if (v.contam.vis > 0) return sim.cutEdge(g, i);
      if (v.state === 'peak' || v.state === 'overripe') return sim.harvest(g, i);
      if (v.state === 'spent') return sim.retire(g, i);
      if (canShake(v)) return sim.shake(g, i);
      if (v.state === 'ready') { const s = sim.sources(g, v).filter(x => !(x.v.contam.vis > 0)); if (s.length) sim.inoculate(g, i, s[0].i); }
      if (isBlock(v) && !spotsIn('tent').includes(i)) { const t = spotsIn('tent').find(j => !g.slots[j] && spotOpen(g, j)); if (t != null) sim.move(g, i, t); }
    });
    if (g.lots.length && g.gear.dehydrator) dryAll(g);
    const free = ['closet', 'kitchen'].flatMap(spotsIn).find(i => !g.slots[i]);
    if (free == null) return;
    const pending = k => g.slots.filter(v => v && v.kind === k && ['queued', 'cooking', 'bath', 'ready'].includes(v.state)).length;
    const spawn = g.slots.filter(v => v && v.kind === 'jar' && ['colonizing', 'colonized'].includes(v.state)).reduce((a, v) => a + (v.state === 'colonized' ? v.uses : 2), 0);
    const prep = style === 'sloppy' ? 'past' : 'ster';
    if (g.slots.filter(v => v && v.kind === 'plate').length < 1) sim.pourPlate(g, free, style === 'sloppy' ? 'super' : 'mea');
    else if (pending('bag') < spawn) sim.prepBag(g, free, 'masters', prep);
    else if (pending('jar') + spawn < 2) sim.prepJar(g, free, prep === 'ster' && !g.cookers.length ? 'past' : prep);
  };
}
/** Random actions: tap random spots with random choices. */
function randomBot(g) {
  if (rand() > 0.15) return;
  const i = Math.floor(rand() * g.slots.length), v = g.slots[i], r = rand();
  if (!v) { if (r < 0.4) sim.pourPlate(g, i, ['mea', 'super', 'cma'][Math.floor(rand() * 3)]); else if (r < 0.7) sim.prepJar(g, i, rand() < 0.5 ? 'ster' : 'past'); else sim.prepBag(g, i, ['coir', 'straw', 'saw', 'masters'][Math.floor(rand() * 4)], rand() < 0.5 ? 'ster' : 'past'); return; }
  if (r < 0.2) sim.toss(g, i); else if (r < 0.5 && v.state === 'ready') { const s = sim.sources(g, v); if (s.length) sim.inoculate(g, i, s[0].i); }
  else if (r < 0.7) sim.move(g, i, Math.floor(rand() * g.slots.length)); else if (v.state === 'peak') sim.harvest(g, i);
}
export async function season(style, seed, weeks = 12) {
  setup(seed);
  const g = sim.newGame();
  // the ladder gates systems; for a revenue comparison all styles start with the whole pipeline open
  g.stage = 3; g.mastered = ['agar', 'grain', 'substrate'];
  await run(g, weeks * 5 + 1, style === 'random' ? randomBot : bot(style), 0.1);
  return { revenue: g.stats.revenue, profit: g.cash - g.startCash, lost: g.stats.lost };
}
const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

test('idle earns nothing; careful play clearly out-earns sloppy play', async () => {
  const out = {};
  for (const st of ['idle', 'good', 'sloppy']) { const r = []; for (let k = 0; k < 7; k++) r.push(await season(st, 100 + k)); out[st] = { revenue: median(r.map(x => x.revenue)), profit: median(r.map(x => x.profit)) }; }
  console.log('# bot medians', JSON.stringify(out));
  assert.equal(out.idle.revenue, 0);
  assert.ok(out.idle.profit <= 0);
  assert.ok(out.good.revenue > out.sloppy.revenue * 1.5 + 50, JSON.stringify(out));
});
test('random actions earn far less than the sensible scripted strategy', async () => {
  const r = [], s = [];
  for (let k = 0; k < 5; k++) { r.push((await season('random', 300 + k)).revenue); s.push((await season('good', 300 + k)).revenue); }
  console.log('# random vs good revenue', median(r), median(s));
  assert.ok(median(s) > median(r) * 2 + 50);
});
