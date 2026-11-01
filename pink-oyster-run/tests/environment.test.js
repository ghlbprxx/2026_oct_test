import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { envModel, colF } from '../js/sim/environment.js';

test('pinks fruit best at 70–85°F and nearly stop below 64°F', () => {
  setup();
  assert.equal(envModel(75, 5, 98).tF, 1);
  assert.ok(envModel(62, 5, 98).tF < 0.1);
});
test('fresh air lowers CO2 but dries the room', () => {
  setup();
  const stale = envModel(75, 0, 90), fresh = envModel(75, 8, 90);
  assert.ok(fresh.co2 < stale.co2);
  assert.ok(fresh.rh < stale.rh);
});
test('cold slows colonization', () => { assert.ok(colF(58) < colF(75)); });
