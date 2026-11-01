import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { gameDaysFor, MAX_FRAME, toBio, toGame, SPEEDS, faster, slower, weekOf } from '../js/sim/clock.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

test('paused clock advances nothing, at any speed', () => {
  setup();
  for (const s of SPEEDS) assert.equal(gameDaysFor(0.016, true, s), 0);
});
test('default pacing: one game day takes about 3 real minutes at 1×', () => {
  const C = setup();
  assert.equal(C.time.secondsPerDay, 180);
  close(gameDaysFor(0.05, false, 1), 0.05 / 180);
});
test('playback speeds scale time linearly (0.5× to 8×)', () => {
  setup();
  const base = gameDaysFor(0.04, false, 1);
  for (const s of SPEEDS) close(gameDaysFor(0.04, false, s), base * s);
  assert.equal(faster(8), 8); assert.equal(slower(0.5), 0.5); assert.equal(faster(1), 2); assert.equal(slower(2), 1);
});
test('long frames are clamped so the sim never jumps', () => {
  const C = setup();
  close(gameDaysFor(10, false, 1), MAX_FRAME / C.time.secondsPerDay);
});
test('admin dev.paused stops time too', () => {
  const C = setup(); C.dev.paused = true;
  assert.equal(gameDaysFor(0.016, false, 1), 0);
});
test('compressed biology: 1 game day = bioDaysPerGameDay real days', () => {
  const C = setup();
  close(toBio(1), C.time.bioDaysPerGameDay);
  close(toGame(toBio(3.3)), 3.3);
  C.time.bioDaysPerGameDay = 4; close(toBio(2), 8);
});
test('weeks are 5 game days', () => { assert.equal(weekOf(4.99), 0); assert.equal(weekOf(5), 1); assert.equal(weekOf(12), 2); });
