import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import { newGame } from '../js/sim/game.js';
import { mk } from '../js/sim/growth.js';
import { toBio } from '../js/sim/clock.js';
import { RECIPES } from '../js/content/species/pink-oyster.js';

async function measure(make, doneState) {
  setup(1, c => { c.dev.god = true; return c; });
  const g = newGame(); g.slots[0] = make(g);
  let t = null;
  await run(g, 20, gg => { if (t == null && gg.slots[0].state === doneState) t = gg.day; }, 0.01);
  return toBio(t);
}

test('grain jars colonize within the real-world 10–14 day range', async () => {
  const d = await measure(g => mk(g, 'jar', { prep: 'ster', state: 'colonizing' }), 'colonized');
  assert.ok(d >= 10 && d <= 14.5, `jar took ${d.toFixed(1)} real days`);
});
test('each recipe colonizes within its real-world range; richer = slower', async () => {
  const range = s => s.match(/(\d+)–(\d+)/).slice(1).map(Number);
  const days = {};
  for (const k of ['straw', 'saw', 'masters']) {
    days[k] = await measure(g => mk(g, 'bag', { recipe: k, prep: 'ster', state: 'colonizing' }), 'pinning');
    const [lo, hi] = range(RECIPES[k].colReal);
    assert.ok(days[k] >= lo && days[k] <= hi + 1, `${k}: ${days[k].toFixed(1)} vs ${RECIPES[k].colReal}`);
  }
  assert.ok(days.masters > days.straw);
});
test('cold stalls pinks: a block never pins below 64°F once in the grow room', async () => {
  setup(1, c => { c.dev.god = true; c.dev.startLevel = 4; c.room.seasonStartTemp = 58; c.room.seasonEndTemp = 58; return c; });
  const g = newGame(); g.heater = 0;
  g.slots[0] = mk(g, 'bag', { recipe: 'straw', prep: 'past', state: 'pinning', flush: 1 });
  await run(g, 4);
  assert.equal(g.slots[0].state, 'pinning');
  assert.equal(g.slots[0].prog, 0);
  assert.ok(g.learned.includes('cold_stall'));
});
test('slow start: jars and bags are locked until their week', async () => {
  setup();
  const { prepJar, prepBag } = await import('../js/sim/game.js');
  const g = newGame();
  assert.equal(prepJar(g, 0, 'ster'), false);
  assert.equal(prepBag(g, 0, 'straw', 'past'), false);
  g.day = 10; // week 2
  assert.equal(prepJar(g, 0, 'ster'), true);
  assert.equal(prepBag(g, 1, 'straw', 'past'), false);
  assert.equal(g.slots.filter(Boolean).length, 1, 'new games start with empty shelves');
});
