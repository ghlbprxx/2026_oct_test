import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import { newGame, prepJar, prepBag, pourPlate } from '../js/sim/game.js';
import { buy, canBuy, priceOf, workspace } from '../js/sim/shop.js';
import { baseHazard } from '../js/sim/contamination.js';
import { spotsIn } from '../js/sim/zones.js';
import { mk } from '../js/sim/growth.js';
import { dryAll } from '../js/sim/economy.js';

test('buying spends cash once and respects week and prerequisites', () => {
  setup();
  const g = newGame(), cash = g.cash;
  assert.equal(buy(g, 'sab'), true); assert.equal(g.cash, cash - priceOf('sab'));
  assert.equal(buy(g, 'sab'), false, 'already owned');
  assert.equal(canBuy(g, 'tent').ok, false, 'tent is sold from the fruiting week');
  assert.equal(canBuy(g, 'heatmat').ok, false, 'needs a tent');
  g.day = 20; assert.equal(buy(g, 'tent'), true); assert.equal(buy(g, 'heatmat'), true);
  g.cash = 5; assert.equal(buy(g, 'dehydrator'), false, 'not enough cash');
});
test('workspace: flow hood beats still-air box beats open counter', () => {
  const C = setup();
  const g = newGame(), plate = ws => mk(g, 'plate', { medium: 'mea', ws }), env = { temp: 72, rh: 50, dirt: 1 };
  assert.equal(workspace(g), 'open');
  g.gear.sab = true; assert.equal(workspace(g), 'sab');
  g.gear.flowhood = true; assert.equal(workspace(g), 'hood');
  assert.ok(baseHazard(plate('hood'), env) < baseHazard(plate('sab'), env) && baseHazard(plate('sab'), env) < baseHazard(plate('open'), env));
  assert.ok(Math.abs(baseHazard(plate('hood'), env) / baseHazard(plate('open'), env) - C.contam.flowHoodFactor) < 1e-9);
});
test('cookers: no cooker, no sterile grain; the 16 qt cannot take bags; the 23 qt can', () => {
  setup();
  const g = newGame(); g.day = 15; const [a, b] = spotsIn('closet');
  assert.equal(prepJar(g, a, 'ster'), false);
  buy(g, 'cooker16'); assert.equal(prepJar(g, a, 'ster'), true);
  assert.equal(prepBag(g, b, 'masters', 'ster'), false, '16 qt is too short for bags');
  buy(g, 'cooker23'); assert.equal(prepBag(g, b, 'masters', 'ster'), true);
});
test('the 23 qt loads 7 jars or 2 bags per cycle', async () => {
  const C = setup(1, c => { c.dev.god = true; return c; });
  const g = newGame(); g.day = 15; g.cash = 1e4; buy(g, 'cooker23');
  g.slots = g.slots.map(() => null);
  for (let k = 0; k < 9; k++) g.slots[k] = mk(g, 'jar', { prep: 'ster', state: 'queued' });
  g.queue = g.slots.filter(Boolean).map(v => v.id);
  await run(g, 0.01);
  assert.equal(g.cookers[0].batch.length, 7);
  g.slots = g.slots.map(() => null); g.queue = []; g.cookers[0].batch = [];
  for (let k = 0; k < 3; k++) g.slots[k] = mk(g, 'bag', { recipe: 'masters', prep: 'ster', state: 'queued' });
  g.queue = g.slots.filter(Boolean).map(v => v.id);
  await run(g, 0.01);
  assert.equal(g.cookers[0].batch.length, 2);
});
test('a scale and an impulse sealer lower mold odds on what you prep after buying them', () => {
  setup();
  const env = { temp: 72, rh: 50, dirt: 1 }, g = newGame(); g.day = 15; g.cash = 1e4; buy(g, 'cooker23');
  const [a, b] = spotsIn('closet');
  prepBag(g, a, 'masters', 'ster'); buy(g, 'scale'); buy(g, 'sealer'); prepBag(g, b, 'masters', 'ster');
  const plain = { ...g.slots[a], state: 'colonizing' }, geared = { ...g.slots[b], state: 'colonizing' };
  assert.ok(baseHazard(geared, env) < baseHazard(plain, env) * 0.75);
});
test('no dehydrator, no drying', () => {
  setup();
  const g = newGame(); g.lots.push({ kg: 1, age: 0, id: 1 });
  assert.equal(dryAll(g), false); g.gear.dehydrator = true; assert.equal(dryAll(g), true); assert.equal(g.dried, 1);
});
