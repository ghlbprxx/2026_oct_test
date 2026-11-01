import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import { newGame, move, harvest } from '../js/sim/game.js';
import { mk } from '../js/sim/growth.js';
import { SPOTS, spotsIn, zoneEnv, zoneFit, spotOpen, zoneOf } from '../js/sim/zones.js';
import { ZONES } from '../js/content/zones.js';

test('the house has kitchen 2, closet 3 (+3 with a shelf rack), tent 3, garage 2, yard 2 spots', () => {
  setup();
  assert.deepEqual(ZONES.map(z => [z.id, z.spots]), [['kitchen', 2], ['closet', 6], ['tent', 3], ['garage', 2], ['yard', 2]]);
  assert.equal(SPOTS.length, 15); assert.equal(newGame().slots.length, 15);
  const g = newGame(), closet = spotsIn('closet');
  assert.deepEqual(closet.map(i => spotOpen(g, i)), [true, true, true, false, false, false]);
  g.gear.rack = true;
  assert.ok(closet.every(i => spotOpen(g, i)));
});
test('the closet is warm and steady; the garage swings with the weather and cold snaps', () => {
  setup();
  const g = newGame(), temps = { closet: new Set(), garage: [] };
  for (let d = 0; d < 5; d += 0.1) { g.day = d; temps.closet.add(zoneEnv(g, 'closet').temp); temps.garage.push(zoneEnv(g, 'garage').temp); }
  assert.deepEqual([...temps.closet], [72]);
  assert.ok(Math.max(...temps.garage) - Math.min(...temps.garage) >= 10, 'garage swings at least 10°F');
  const before = zoneEnv(g, 'garage').temp; g.snap = { end: 99 };
  assert.ok(zoneEnv(g, 'garage').temp < before - 5);
  assert.ok(zoneEnv(g, 'closet').temp >= 69, 'the house barely notices a cold snap');
});
test('tent spots stay locked until you own a tent; the yard is locked for now', () => {
  setup();
  const g = newGame(), tent = spotsIn('tent'), yard = spotsIn('yard');
  assert.ok(tent.every(i => !spotOpen(g, i)) && yard.every(i => !spotOpen(g, i)));
  g.gear.tent = true;
  assert.ok(tent.every(i => spotOpen(g, i)) && yard.every(i => !spotOpen(g, i)));
});
test('wrong zone has a visible, explained consequence', () => {
  setup();
  const g = newGame(); Object.assign(g.gear, { tent: true, heatmat: true, humidifier: true }); g.heater = 1; g.fae = 5; g.mist = 98;
  const block = mk(g, 'bag', { recipe: 'straw', prep: 'past', state: 'pinning', flush: 1 });
  const closetFit = zoneFit(g, 'closet', block), tentFit = zoneFit(g, 'tent', block);
  assert.equal(closetFit.level, 'bad'); assert.match(closetFit.note, /tent/i);
  assert.equal(tentFit.level, 'good');
  const coldJar = mk(g, 'jar', { prep: 'ster', state: 'colonizing' }); g.snap = { end: 99 };
  assert.equal(zoneFit(g, 'garage', coldJar).level, 'bad');
  assert.equal(zoneFit(g, 'closet', coldJar).level, 'good');
});
test('fruiting in the closet gives a poorer harvest than the tent', async () => {
  const harvestIn = async zid => {
    setup(3, c => { c.dev.god = true; c.dev.startLevel = 4; return c; });
    const g = newGame(); Object.assign(g.gear, { tent: true, heatmat: true, humidifier: true }); g.heater = 1; g.fae = 5; g.mist = 98;
    const i = spotsIn(zid)[0];
    g.slots[i] = mk(g, 'bag', { recipe: 'straw', prep: 'past', state: 'pinning', flush: 1 });
    let kg = null;
    await run(g, 12, gg => { if (kg == null && gg.slots[i] && gg.slots[i].state === 'peak') { const before = gg.stats.harvestKg; harvest(gg, i); kg = gg.stats.harvestKg - before; } }, 0.02);
    return kg ?? 0;
  };
  const tent = await harvestIn('tent'), closet = await harvestIn('closet');
  assert.ok(tent > 0); assert.ok(closet < tent * 0.6, `closet ${closet} vs tent ${tent}`);
});
test('move: only into empty, open spots, and not while in the cooker', () => {
  setup();
  const g = newGame(), [k0, k1] = spotsIn('kitchen'), c0 = spotsIn('closet')[0], t0 = spotsIn('tent')[0];
  g.slots[k0] = mk(g, 'plate', { medium: 'mea', ws: 'sab' });
  assert.equal(move(g, k0, t0), false, 'tent locked');
  assert.equal(move(g, k0, c0), true); assert.equal(zoneOf(c0), 'closet'); assert.ok(g.slots[c0] && !g.slots[k0]);
  g.slots[k1] = mk(g, 'jar', { prep: 'ster', state: 'cooking' });
  assert.equal(move(g, k1, k0), false);
});
