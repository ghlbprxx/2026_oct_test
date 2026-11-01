// Phase 6: optional automation after mastery, its weekly fees, and its metrics.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import * as sim from '../js/sim/game.js';
import { autoAvailable, autoOn, setAuto, weeklyFee, stepAutomation, chargeAutomation } from '../js/sim/automation.js';
import { AUTOMATION, AUTOMATION_ORDER } from '../js/content/automation.js';
import { STAGES } from '../js/content/stages.js';
import { buildReview } from '../js/sim/mastery.js';

function masteredPinks(seed = 500) {
  setup(seed);
  const g = sim.newGame('normal'); g.stage = 4; g.speciesDone = true; g.mastered = STAGES.map(s => s.id); g.speciesMastered = ['pink-oyster'];
  for (const id of ['sab', 'cooker23', 'rack', 'tent', 'heatmat', 'humidifier', 'dehydrator']) g.gear[id] = true;
  g.cookers = [{ id: 'cooker23', batch: [], t: 0 }];
  return g;
}

test('automation unlocks per stage mastered on the current species, and is opt-in', () => {
  setup(1);
  const g = sim.newGame('normal');
  for (const id of AUTOMATION_ORDER) assert.equal(autoAvailable(g, id), false, id);
  assert.equal(setAuto(g, 'agar', true), false);
  g.mastered = ['agar']; assert.ok(autoAvailable(g, 'agar')); assert.equal(autoOn(g, 'agar'), false, 'off until switched on');
  assert.ok(setAuto(g, 'agar', true)); assert.equal(weeklyFee(g), AUTOMATION.agar.fee);
  // a new species resets mastery, so automation pauses until that stage is mastered again
  g.speciesDone = true; g.mastered = STAGES.map(s => s.id); assert.ok(sim.startSpecies(g, 'lions-mane'));
  assert.equal(autoOn(g, 'agar'), false); assert.equal(weeklyFee(g), 0);
  for (const a of Object.values(AUTOMATION)) assert.ok(a.fee > 0 && a.name && a.effect && a.stages.length);
});

test('routines do real work with the player’s own actions', () => {
  const g = masteredPinks();
  AUTOMATION_ORDER.forEach(id => setAuto(g, id, true));
  stepAutomation(g);
  assert.ok(g.slots.some(v => v && v.kind === 'plate'), 'the lab helper poured a plate');
  assert.ok(g.slots.some(v => v && v.kind === 'jar'), 'the grain routine prepped a jar');
  assert.ok(g.stats.autoActions >= 2 && g.stats.autoBy.agar >= 1);
  // harvest crew picks at peak
  const i = 8; g.slots[i] = { id: 900, sp: 'pink-oyster', kind: 'bag', recipe: 'masters', prep: 'ster', state: 'peak', prog: 1, t: 0, uses: 0, flush: 1, shaken: false, stallT: 0, salvage: 1, q: { c: 1, h: 1, n: 1 }, contam: { onset: null, vis: 0, why: null }, lostFrom: null };
  stepAutomation(g);
  assert.ok(g.stats.harvestKg > 0 && g.slots[i].state !== 'peak', 'picked');
  assert.ok(g.lots.length + g.dried > 0, 'kept fresh or dried (pinks won’t last until market, so the crew dries them)');
});

test('weekly fees are charged at the review and shown in it; no cash switches everything off', () => {
  const g = masteredPinks();
  setAuto(g, 'agar', true); setAuto(g, 'harvest', true);
  const c = g.cash, fee = weeklyFee(g);
  for (let t = 0; t < 5; t += 0.05) sim.update(g, 0.05); // one week end
  assert.equal(g.stats.automation, fee);
  assert.ok(g.cash < c);
  g.cash = 1; assert.equal(chargeAutomation(g), 0); assert.deepEqual(g.auto, {}, 'switched off');
  const r = buildReview(g); assert.ok(r.money.out >= 0);
});

test('a fully automated pink farm keeps producing hands-off and roughly breaks even (attention, not profit)', () => {
  const nets = [0, 1, 2, 3].map(k => {
    const g = masteredPinks(500 + k), c0 = g.cash;
    AUTOMATION_ORDER.forEach(id => setAuto(g, id, true));
    for (let t = 0; t < 75; t += 0.05) sim.update(g, 0.05);
    assert.ok(g.stats.harvestKg > 10, `seed ${k}: harvested ${g.stats.harvestKg.toFixed(1)} kg`);
    assert.ok(!g.over);
    return g.cash - c0;
  });
  nets.forEach(n => assert.ok(n > -300 && n < 300, `15 hands-off weeks net ${Math.round(n)}`));
});
