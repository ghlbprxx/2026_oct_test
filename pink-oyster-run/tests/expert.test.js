// Phase 6: Expert mode and the liquid-culture stage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { newGame, prepLC, prepJar, inoculate, sources, startSpecies } from '../js/sim/game.js';
import { buy } from '../js/sim/equipment.js';
import { ladder, unlocked, isExpert, opensAt } from '../js/sim/stages.js';
import { ladderOf, LADDERS, opensIndex } from '../js/content/stages.js';
import { mk, phaseDays, stepVessel } from '../js/sim/growth.js';
import { baseHazard, revealLag, inheritedCause, causeOf } from '../js/sim/contamination.js';
import { zoneEnv } from '../js/sim/zones.js';
import { LESSONS } from '../js/content/lessons.js';
import { MYTHS } from '../js/content/myths.js';
import { autoplay } from '../js/sim/autoplay.js';

test('expert ladders insert liquid culture after agar; other runs are unchanged', () => {
  for (const sp of Object.keys(LADDERS)) {
    assert.deepEqual(ladderOf(sp, true).map(s => s.id), [LADDERS[sp][0].id, 'lc', ...LADDERS[sp].slice(1).map(s => s.id)], sp);
    assert.equal(ladderOf(sp), LADDERS[sp]);
  }
  const L = ladderOf('pink-oyster');
  assert.deepEqual(['plate', 'jar', 'bag', 'room', 'market', 'lc'].map(k => opensIndex(L, k)), [0, 1, 2, 3, 3, Infinity], 'pink openings by stage id = the old numeric table');
  assert.equal(opensIndex(ladderOf('pink-oyster', true), 'jar'), 1, 'expert: grain jars open with LC (LC seeds them)');
});

test('LC is Expert-only, needs a cooker, and is seeded from a plate', () => {
  setup(1);
  const free = newGame('normal', 'free'); free.stage = 3;
  assert.equal(unlocked(free, 'lc'), false); assert.equal(prepLC(free, 0, 'dilute'), false);
  const g = newGame('normal', 'expert'); g.cash = 1000;
  assert.ok(isExpert(g)); assert.equal(ladder(g).length, 6);
  assert.equal(unlocked(g, 'lc'), false, 'not during agar');
  g.stage = 1; assert.ok(unlocked(g, 'lc')); assert.ok(opensAt(1, g).includes('lc'));
  assert.equal(prepLC(g, 0, 'dilute'), false, 'needs a pressure cooker');
  assert.ok(buy(g, 'cooker16')); assert.ok(prepLC(g, 0, 'dilute')); assert.equal(g.counts.diluteLC, 1);
  const lc = g.slots[0]; assert.equal(lc.kind, 'lc'); assert.equal(lc.state, 'queued');
  lc.state = 'ready';
  g.slots[2] = mk(g, 'plate', { medium: 'mea', ws: 'sab', state: 'colonized', prog: 1, uses: 3 });
  assert.equal(sources(g, lc).length, 1);
  assert.ok(inoculate(g, 0, 2)); assert.equal(lc.state, 'colonizing');
  assert.ok(phaseDays(lc) > 5);
  // after the species is mastered, LC stays open for the next species in an expert run
  const g2 = newGame('normal', 'expert'); startSpecies(g2, 'lions-mane', true); assert.ok(unlocked(g2, 'lc'));
});

test('a colonized LC seeds many grain jars, which colonize faster', () => {
  setup(1, c => { c.dev.god = true; return c; });
  const g = newGame('normal', 'expert'); g.stage = 1;
  const lc = mk(g, 'lc', { lc: 'dilute', prep: 'ster', state: 'colonizing' });
  for (let k = 0; k < 200 && lc.state !== 'colonized'; k++) stepVessel(g, lc, 0.1, zoneEnv(g, 'closet'), 2);
  assert.equal(lc.state, 'colonized'); assert.equal(lc.uses, 6); assert.equal(g.counts.cleanLC, 1);
  g.slots[2] = lc; g.gear.cooker16 = true; g.cookers = [{ id: 'cooker16', batch: [], t: 0 }]; g.cash = 100;
  const plateJar = mk(g, 'jar', { prep: 'ster', state: 'colonizing' });
  assert.ok(prepJar(g, 0, 'ster')); g.slots[0].state = 'ready';
  assert.ok(inoculate(g, 0, 2));
  assert.ok(g.slots[0].fromLC); assert.equal(g.counts.lcToGrain, 1); assert.equal(lc.uses, 5);
  assert.ok(phaseDays(g.slots[0]) < phaseDays(plateJar) * 0.8, 'LC jars colonize ~25% faster');
});

test('rich “sugar bomb” LC: more infection, hides longer, and passes it to every jar', () => {
  setup(1);
  const g = newGame('normal', 'expert');
  const rich = mk(g, 'lc', { lc: 'rich', state: 'colonizing' }), dilute = mk(g, 'lc', { lc: 'dilute', state: 'colonizing' });
  const env = zoneEnv(g, 'closet');
  assert.ok(baseHazard(rich, env) > 5 * baseHazard(dilute, env));
  assert.ok(revealLag(rich) > 2 * revealLag(mk(g, 'jar', {})));
  assert.equal(causeOf(rich, env), 'rich_lc'); assert.ok(LESSONS.rich_lc);
  rich.contam.onset = 0; rich.contam.why = 'rich_lc';
  assert.equal(inheritedCause(rich), 'rich_lc', 'hidden infection travels into the grain');
  assert.ok(MYTHS.some(m => /liquid culture/i.test(m.s) && !m.a), 'the matching myth is in the quiz pool');
});

test('Expert is playable headlessly: LC mastered early, the ladder progresses, never broke', () => {
  const rs = [0, 1, 2, 3].map(k => { setup(2000 + k); return autoplay({ strategy: 'careful', mode: 'normal', weeks: 34, runType: 'expert' }); });
  assert.ok(rs.every(r => r.masteredAt.lc <= 6), rs.map(r => r.masteredAt.lc).join(','));
  assert.ok(rs.filter(r => r.masteredAt.fruiting).length >= 3, 'most runs reach fruiting');
  assert.ok(rs.every(r => !r.broke && r.minCash > 0));
});
