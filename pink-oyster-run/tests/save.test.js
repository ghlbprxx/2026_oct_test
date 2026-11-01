import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadProfile, saveProfile, SAVE_KEY, SAVE_VERSION } from '../js/save.js';

const memory = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), m }; };

test('profile round-trips', () => {
  const s = memory();
  saveProfile({ best: 42, lessons: { rot: true }, muted: true }, s);
  const p = loadProfile(s);
  assert.deepEqual(p, { v: SAVE_VERSION, best: 42, lessons: { rot: true }, muted: true });
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
