import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import { newGame, pourPlate, move } from '../js/sim/game.js';
import { count, checklist, checklistDone, isMastered, unitsNeeded, buildReview, forceMaster } from '../js/sim/mastery.js';
import { buy } from '../js/sim/equipment.js';
import { spotsIn } from '../js/sim/zones.js';
import { unlocked } from '../js/sim/stages.js';
import { on } from '../js/sim/events.js';

test('mastery is two steps in order: units only count after the checklist', () => {
  setup();
  const g = newGame();
  count(g, 'cleanPlates', 5);
  assert.equal(g.units, 0, 'units before the checklist do not count');
  count(g, 'platesClean', 3); count(g, 'closetPlates', 1);
  assert.ok(checklistDone(g));
  assert.equal(isMastered(g), false);
  count(g, 'cleanPlates', unitsNeeded(g));
  assert.ok(isMastered(g));
});
test('the weekly review masters the stage and opens the next one; otherwise the week repeats', async () => {
  setup(2, c => { c.dev.god = true; return c; });
  const g = newGame(), events = [];
  on((t, d) => events.push([t, d]));
  await run(g, 5.01);
  assert.equal(g.week, 1); assert.equal(g.stage, 0); assert.equal(g.weeksRepeated, 1);
  const r1 = events.find(e => e[0] === 'review')[1];
  assert.equal(r1.mastered, false); assert.ok(r1.tips.length >= 1); assert.ok(r1.mentor.id.startsWith('mentor_review'));
  forceMaster(g); await run(g, 5);
  assert.equal(g.stage, 1); assert.deepEqual(g.mastered, ['agar']); assert.ok(unlocked(g, 'jar'));
  assert.ok(events.some(e => e[0] === 'stage' && e[1].stage === 1));
});
test('playing agar properly masters it within a few weeks', async () => {
  setup(4);
  const g = newGame(); buy(g, 'sab');
  const [k0, k1] = spotsIn('kitchen'), closet = spotsIn('closet');
  await run(g, 25, gg => {
    if (gg.stage > 0) return;
    for (const i of [k0, k1]) if (!gg.slots[i]) { pourPlate(gg, i, 'mea'); const c = closet.find(j => !gg.slots[j]); if (c != null) move(gg, i, c); }
    closet.forEach(i => { const v = gg.slots[i]; if (v && (v.state === 'colonized' || v.contam.vis > 0)) gg.slots[i] = null; }); // clear finished plates (sold / tossed)
  }, 0.05);
  assert.equal(g.stage, 1, `stage ${g.stage}, counts ${JSON.stringify(g.counts)}, units ${g.units}`);
});
test('an idle player cannot master week 1', async () => {
  setup(5);
  const g = newGame();
  await run(g, 10.01);
  assert.equal(g.stage, 0); assert.equal(g.mastered.length, 0);
  assert.equal(buildReview(g).mastered, false);
});
