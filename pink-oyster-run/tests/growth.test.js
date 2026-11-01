import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import { newGame } from '../js/sim/game.js';
import { mk } from '../js/sim/growth.js';

test('a sterile grain jar colonizes in about jarDays at a warm temperature', async () => {
  const C = setup(1, c => { c.dev.god = true; c.room.seasonStartTemp = 76; c.room.seasonEndTemp = 76; return c; });
  const g = newGame(); g.slots.fill(null);
  g.slots[0] = mk(g, 'jar', { prep: 'ster', state: 'colonizing' });
  await run(g, C.growth.jarDays * 0.9);
  assert.equal(g.slots[0].state, 'colonizing');
  await run(g, C.growth.jarDays * 0.2);
  assert.equal(g.slots[0].state, 'colonized');
});
test('cold stalls pinks: a block never pins below 64°F', async () => {
  setup(1, c => { c.dev.god = true; c.room.seasonStartTemp = 58; c.room.seasonEndTemp = 58; return c; });
  const g = newGame(); g.slots.fill(null); g.heater = 0;
  g.slots[0] = mk(g, 'bag', { recipe: 'straw', prep: 'past', state: 'pinning', flush: 1 });
  await run(g, 10);
  assert.equal(g.slots[0].state, 'pinning');
  assert.equal(g.slots[0].prog, 0);
  assert.ok(g.learned.includes('cold_stall'));
});
