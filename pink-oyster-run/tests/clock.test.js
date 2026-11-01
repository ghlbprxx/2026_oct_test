import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { gameDaysFor, MAX_FRAME } from '../js/sim/clock.js';

test('paused clock advances nothing', () => {
  setup();
  assert.equal(gameDaysFor(0.016, true), 0);
});
test('real seconds map to game days through secondsPerDay and timeScale', () => {
  const C = setup();
  C.time.secondsPerDay = 5; C.dev.timeScale = 1;
  assert.ok(Math.abs(gameDaysFor(0.05) - 0.01) < 1e-9);
  C.dev.timeScale = 2;
  assert.ok(Math.abs(gameDaysFor(0.05) - 0.02) < 1e-9);
});
test('long frames are clamped so the sim never jumps', () => {
  const C = setup(); C.dev.timeScale = 1;
  assert.equal(gameDaysFor(10), MAX_FRAME / C.time.secondsPerDay);
});
test('admin dev.paused stops time too', () => {
  const C = setup(); C.dev.paused = true;
  assert.equal(gameDaysFor(0.016), 0);
});
