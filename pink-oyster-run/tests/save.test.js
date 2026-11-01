import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadProfile, saveProfile, SAVE_KEY, SAVE_VERSION } from '../js/save.js';

const memory = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), m }; };

test('profile round-trips', () => {
  const s = memory();
  saveProfile({ best: 42, lessons: { rot: true }, muted: true }, s);
  const p = loadProfile(s);
  assert.deepEqual(p, { v: SAVE_VERSION, best: 42, lessons: { rot: true }, muted: true, expert: false, playMode: 'basic', tutorialDone: false });
});
test('migrates the single-file build’s loose keys (v0)', () => {
  const s = memory({ 'por2-best': '17', 'por2-lessons': '{"shake":true}', 'por2-mute': 'true' });
  const p = loadProfile(s);
  assert.equal(p.v, SAVE_VERSION); assert.equal(p.best, 17); assert.deepEqual(p.lessons, { shake: true }); assert.equal(p.muted, true);
});
test('corrupt or blocked storage never throws', () => {
  assert.equal(loadProfile(memory({ [SAVE_KEY]: '{oops' })).best, null);
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(loadProfile(blocked).best, null);
  assert.equal(saveProfile({ best: 1 }, blocked), false);
});

import { saveRun, loadRun, migrateRun, RUN_VERSION } from '../js/save.js';
import { setup } from './helpers.js';
import { newGame } from '../js/sim/game.js';
test('a run round-trips through save/load', () => {
  setup();
  const s = memory(), g = newGame('hardcore'); g.cash = 123; g.stage = 2; g.counts.cleanPlates = 4;
  assert.equal(saveRun(g, s), true);
  const back = loadRun(s);
  assert.equal(back.mode, 'hardcore'); assert.equal(back.cash, 123); assert.equal(back.stage, 2); assert.equal(back.counts.cleanPlates, 4);
  assert.equal(JSON.parse(s.getItem('por:run')).v, RUN_VERSION);
});
test('migrates a phase-3 run (no ladder or shop fields) and rejects garbage', () => {
  const old = { v: 1, g: { mode: 'normal', day: 12, week: 2, cash: 900, slots: Array(12).fill(null), stats: { revenue: 0 }, gear: { sab: true } } };
  const g = migrateRun(old);
  assert.equal(g.stage, 0); assert.deepEqual(g.stock.plate, []); assert.equal(g.rep, 50); assert.ok(g.weekStart); assert.equal(g.gear.sab, true);
  assert.equal(migrateRun({ v: 2, g: { nope: 1 } }), null);
  assert.equal(migrateRun('x'), null);
});
