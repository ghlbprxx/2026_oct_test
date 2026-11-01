// Bot check: doing nothing must not pay; careful play must beat sloppy play.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import * as sim from '../js/sim/game.js';
import { baseTemp } from '../js/sim/environment.js';
import { canShake } from '../js/sim/growth.js';
import { dryAll } from '../js/sim/economy.js';

function bot(style) {
  return g => {
    if (style === 'idle') return;
    g.heater = baseTemp(g) + 8 >= 72 ? 1 : 2; g.fae = 5; g.mist = 98;
    g.slots.forEach((v, i) => {
      if (!v) return;
      if (v.state === 'lost' || (v.contam.vis > 0 && v.kind !== 'plate')) return sim.toss(g, i);
      if (v.contam.vis > 0) return g.cash >= 1 ? sim.cutEdge(g, i) : sim.toss(g, i);
      if (v.state === 'peak' || v.state === 'overripe') return sim.harvest(g, i);
      if (v.state === 'spent') return sim.retire(g, i);
      if (canShake(v)) return sim.shake(g, i);
      if (v.state === 'ready') { const s = sim.sources(g, v).filter(x => !(x.v.contam.vis > 0)); if (s.length) sim.inoculate(g, i, s[0].i); }
    });
    if (g.lots.length) dryAll(g);
    const prep = style === 'sloppy' ? 'past' : 'ster', e = g.slots.findIndex(v => !v);
    const pending = k => g.slots.filter(v => v && v.kind === k && ['queued', 'cooking', 'bath', 'ready'].includes(v.state)).length;
    const spawn = g.slots.filter(v => v && v.kind === 'jar' && ['colonizing', 'colonized'].includes(v.state)).reduce((a, v) => a + (v.state === 'colonized' ? v.uses : 2), 0);
    if (e < 0) return;
    if (!g.slots.some(v => v && v.kind === 'plate') && g.cash >= 1) sim.pourPlate(g, e, style === 'sloppy' ? 'super' : 'mea');
    else if (pending('bag') < spawn && g.cash >= 8) sim.prepBag(g, e, 'masters', prep);
    else if (pending('jar') + spawn < 2 && g.cash >= 2) sim.prepJar(g, e, prep);
  };
}
async function median(style, n = 9) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const C = setup(100 + k);
    const g = sim.newGame();
    await run(g, C.time.seasonDays + 1, bot(style));
    out.push(g.cash - C.economy.startCash);
  }
  return out.sort((a, b) => a - b)[Math.floor(n / 2)];
}

test('idle earns nothing; careful play beats sloppy play', async () => {
  const idle = await median('idle'), good = await median('good'), sloppy = await median('sloppy');
  assert.ok(idle <= 0, `idle median ${idle}`);
  assert.ok(good > sloppy + 20, `good ${good} vs sloppy ${sloppy}`);
  assert.ok(good > 0, `good median ${good}`);
});
