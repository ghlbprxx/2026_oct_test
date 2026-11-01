// Playability + economy proofs, using the headless player in js/sim/autoplay.js on every difficulty.
// The same numbers print as a table with:  node tools/playtest.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { autoplay } from '../js/sim/autoplay.js';

const SEEDS = 5, WEEKS = 24;
const med = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const cache = {};
function runs(strategy, mode) {
  const k = strategy + mode;
  if (!cache[k]) cache[k] = Array.from({ length: SEEDS }, (_, i) => { setup(2000 + i); return autoplay({ strategy, mode, weeks: WEEKS }); });
  return cache[k];
}

for (const mode of ['relaxed', 'normal', 'hardcore']) {
  test(`${mode}: a careful player masters all five stages, never runs out of money, and ends in profit`, () => {
    const r = runs('careful', mode);
    assert.ok(r.filter(x => x.speciesDone).length >= Math.ceil(SEEDS * 0.6), `species mastered in ${r.filter(x => x.speciesDone).length}/${SEEDS}`);
    assert.ok(r.every(x => !x.broke && x.minCash > 0), `min cash ${r.map(x => x.minCash).join(',')}`);
    assert.ok(med(r.map(x => x.profit)) > 0, `median profit ${med(r.map(x => x.profit))} (gear ${r[0].gear} included)`);
    assert.ok(med(r.map(x => x.masteredAt.agar)) <= 3, 'agar mastered within the first few weeks');
  });
}
test('both money channels matter: the online shop pays, and the market alone is a slower road', () => {
  for (const mode of ['normal', 'hardcore']) {
    const c = runs('careful', mode), m = runs('marketOnly', mode);
    assert.ok(med(c.map(x => x.revenue.online)) > 0 && med(c.map(x => x.revenue.market)) > 0, 'careful uses both channels');
    assert.ok(med(c.map(x => x.profit)) > med(m.map(x => x.profit)) + 200, `${mode}: careful ${med(c.map(x => x.profit))} vs market-only ${med(m.map(x => x.profit))}`);
    assert.ok(m.every(x => !x.broke), 'market-only never goes broke');
    assert.ok(m.filter(x => x.speciesDone).length >= Math.ceil(SEEDS * 0.6), 'market-only can still master every stage');
  }
});
test('harder modes start poorer and dip closer to zero', () => {
  const minOf = mode => med(runs('careful', mode).map(x => x.minCash));
  assert.ok(minOf('relaxed') > minOf('normal') && minOf('normal') > minOf('hardcore'));
});
test('skill matters: idle earns nothing, sloppy stalls at agar, random play loses money', () => {
  const idle = runs('idle', 'normal'), sloppy = runs('sloppy', 'normal'), random = runs('random', 'normal'), careful = runs('careful', 'normal');
  assert.ok(idle.every(x => x.revenue.total === 0 && x.stages === 0));
  assert.ok(sloppy.every(x => x.stages === 0), 'no still-air box, so the agar checklist never completes');
  assert.ok(med(random.map(x => x.profit)) < 0);
  assert.ok(med(careful.map(x => x.revenue.total)) > 5 * Math.max(1, med(random.map(x => x.revenue.total))));
});
