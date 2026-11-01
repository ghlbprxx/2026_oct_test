import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { baseHazard, hazard, causeOf, revealLag, inheritedCause } from '../js/sim/contamination.js';
import { hazardMult, startCash, canSalvage } from '../js/sim/stages.js';
import { mk } from '../js/sim/growth.js';

const env = { temp: 75, rh: 90 };
const g = (o = {}) => ({ seq: 0, day: 30, mode: 'normal', ...o });

test('pasteurized grain is far riskier than sterilized grain', () => {
  setup();
  const ster = mk(g(), 'jar', { prep: 'ster', state: 'colonizing' }), past = mk(g(), 'jar', { prep: 'past', state: 'colonizing' });
  assert.ok(baseHazard(past, env) >= 10 * baseHazard(ster, env));
  assert.equal(causeOf(past, env), 'past_grain');
});
test('rich mixes need sterilizing; plain straw does worse sterilized', () => {
  setup();
  const m = p => mk(g(), 'bag', { recipe: 'masters', prep: p, state: 'colonizing' }), s = p => mk(g(), 'bag', { recipe: 'straw', prep: p, state: 'colonizing' });
  assert.ok(baseHazard(m('past'), env) > 5 * baseHazard(m('ster'), env));
  assert.equal(causeOf(m('past'), env), 'past_supplement');
  assert.ok(baseHazard(s('ster'), env) > baseHazard(s('past'), env));
  assert.equal(causeOf(s('ster'), env), 'steril_straw');
});
test('a still-air box lowers plate risk, and open-air work gets its own lesson', () => {
  const C = setup();
  const open = mk(g(), 'plate', { medium: 'mea', ws: 'open' }), sab = mk(g(), 'plate', { medium: 'mea', ws: 'sab' });
  assert.ok(Math.abs(baseHazard(sab, env) - baseHazard(open, env) * C.contam.sabFactor) < 1e-12);
  assert.ok(baseHazard(sab, env) < baseHazard(open, env) / 2);
  assert.equal(causeOf(open, env), 'open_air');
  assert.equal(causeOf(sab, env), 'luck');
});
test('super agar hides mold longer than MEA; CMA shows it sooner', () => {
  setup();
  const p = medium => revealLag(mk(g(), 'plate', { medium }));
  assert.ok(p('super') > p('mea') && p('mea') > p('cma'));
});
test('hidden infections travel downstream, with the right lesson', () => {
  setup();
  const plate = mk(g(), 'plate', { medium: 'super', state: 'colonized' });
  assert.equal(inheritedCause(plate), null);
  plate.contam.onset = 1; plate.contam.why = 'luck';
  assert.equal(inheritedCause(plate), 'hidden_contam');
  plate.contam.vis = 0.3;
  assert.equal(inheritedCause(plate), 'expand_contam');
});
test('difficulty: grace weeks, Relaxed softer, Hardcore without grace after week 0', () => {
  const C = setup(); const D = C.difficulty;
  assert.equal(startCash('relaxed'), 2500); assert.equal(startCash('normal'), 1500); assert.equal(startCash('hardcore'), 800);
  assert.equal(hazardMult(g({ day: 2 })), D.graceHazard);                        // week 0, normal
  assert.equal(hazardMult(g({ day: 7 })), D.graceHazard);                        // week 1, normal
  assert.equal(hazardMult(g({ day: 7, mode: 'hardcore' })), 1);                  // week 1, hardcore: no grace
  assert.equal(hazardMult(g({ day: 2, mode: 'hardcore' })), D.graceHazard);      // tutorial week still graced
  assert.equal(hazardMult(g({ day: 30, mode: 'relaxed' })), D.relaxedHazard);
  assert.equal(hazardMult(g({ day: 30 })), 1);
  const plate = mk(g(), 'plate', { medium: 'mea' });
  assert.ok(hazard(g({ day: 30, mode: 'relaxed' }), plate, env) < hazard(g({ day: 30 }), plate, env));
});
test('Relaxed lets you cut mold out of jars and bags; other modes do not', () => {
  setup();
  const jar = mk(g(), 'jar', { prep: 'ster', state: 'colonizing' }); jar.contam.vis = 0.2;
  assert.equal(canSalvage(g({ mode: 'relaxed' }), jar), true);
  assert.equal(canSalvage(g({ mode: 'normal' }), jar), false);
  assert.equal(canSalvage(g({ mode: 'relaxed' }), mk(g(), 'plate', { medium: 'mea', contam: { vis: 0.2, onset: 1 } })), false);
});
