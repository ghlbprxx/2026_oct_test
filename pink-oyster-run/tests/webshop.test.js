import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import { newGame } from '../js/sim/game.js';
import { mk } from '../js/sim/growth.js';
import { productFor, productOpen, listVessel, salesRate, setPrice, basePrice, stepShop } from '../js/sim/shop.js';
import { sellAtMarket } from '../js/sim/economy.js';

const colonizedPlate = (g, bad = false) => { const v = mk(g, 'plate', { medium: 'mea', state: 'colonized', prog: 1, uses: 3 }); if (bad) v.contam.onset = 0; return v; };

test('products open only after their stage is mastered', () => {
  setup();
  const g = newGame(); g.slots[0] = colonizedPlate(g);
  assert.equal(productFor(g.slots[0]), 'plate');
  assert.equal(productOpen(g, 'plate'), false); assert.equal(listVessel(g, 0), false);
  g.mastered.push('agar'); assert.equal(listVessel(g, 0), true); assert.equal(g.stock.plate.length, 1); assert.equal(g.slots[0], null);
});
test('later stages are worth more', () => { setup(); assert.ok(basePrice('plate') < basePrice('jar') && basePrice('jar') < basePrice('kit')); });
test('price vs demand: higher price, fewer sales per day; better reputation, more', () => {
  setup();
  const g = newGame();
  const base = salesRate(g, 'plate'); setPrice(g, 'plate', basePrice('plate') * 2);
  assert.ok(salesRate(g, 'plate') < base / 3);
  setPrice(g, 'plate', basePrice('plate')); g.rep = 100; assert.ok(salesRate(g, 'plate') > base * 1.9);
});
test('stock sells over time; shipping hidden mold refunds and hurts reputation', async () => {
  setup(7);
  const g = newGame(); g.mastered.push('agar');
  for (let k = 0; k < 6; k++) g.stock.plate.push({ bad: false, meh: false });
  const cash = g.cash, rep = g.rep;
  await run(g, 4, gg => stepShop(gg, 0)); // run() already ticks the shop through update()
  assert.ok(g.stock.plate.length < 6 && g.cash > cash && g.rep >= rep, 'clean sales earn money and reputation');
  g.stock.plate = [{ bad: true }, { bad: true }]; const rep2 = g.rep, cash2 = g.cash;
  await run(g, 6);
  assert.ok(g.rep < rep2, 'refunds cost reputation'); assert.ok(g.cash <= cash2 + 1e-9, 'no money for refunded items');
  assert.ok(g.learned.includes('shipped_mold'));
});
test('farmers market: booth fee only when bringing product; one market absorbs a limited amount', () => {
  const C = setup();
  const g = newGame(); g.stage = 3;
  let s = sellAtMarket(g); assert.equal(s.fee, 0); 
  g.lots.push({ kg: 20, age: 0, id: 1 }); const cash = g.cash;
  s = sellAtMarket(g);
  assert.equal(s.fee, C.economy.boothFee);
  assert.ok(Math.abs(s.fresh * 2.20462 - 20) < 1e-6, 'sells up to 20 lb');
  assert.ok(g.lots.length === 1 && g.lots[0].kg > 0, 'the rest stays in the crate');
  assert.ok(g.cash > cash);
});
