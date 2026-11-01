import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { hazard, causeOf, revealLag, inheritedCause } from '../js/sim/contamination.js';
import { mk } from '../js/sim/growth.js';

const env = { temp: 75, rh: 90 };
const g = () => ({ seq: 0 });

test('pasteurized grain is far riskier than sterilized grain', () => {
  setup();
  const ster = mk(g(), 'jar', { prep: 'ster', state: 'colonizing' }), past = mk(g(), 'jar', { prep: 'past', state: 'colonizing' });
  assert.ok(hazard(past, env) >= 10 * hazard(ster, env));
  assert.equal(causeOf(past, env), 'past_grain');
});
test('rich mixes need sterilizing; plain straw does worse sterilized', () => {
  setup();
  const m = p => mk(g(), 'bag', { recipe: 'masters', prep: p, state: 'colonizing' }), s = p => mk(g(), 'bag', { recipe: 'straw', prep: p, state: 'colonizing' });
  assert.ok(hazard(m('past'), env) > 5 * hazard(m('ster'), env));
  assert.equal(causeOf(m('past'), env), 'past_supplement');
  assert.ok(hazard(s('ster'), env) > hazard(s('past'), env));
  assert.equal(causeOf(s('ster'), env), 'steril_straw');
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
