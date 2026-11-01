// Phase 5: story script rules, the director, tutorial steps, and run-type saves.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { SCENES, GURU, CAST, allLines } from '../js/content/story.js';
import { MYTHS } from '../js/content/myths.js';
import { STAGES, MENTOR } from '../js/content/stages.js';
import { TUTORIAL, stepDone } from '../js/content/tutorial.js';
import { scene, sceneKeyFor, guruQuiz, isStory, RUN_TYPES } from '../js/director.js';
import { newGame, pourPlate, move } from '../js/sim/game.js';
import { buy } from '../js/sim/equipment.js';
import { migrateRun, saveRun, loadRun } from '../js/save.js';
import { on } from '../js/sim/events.js';
import { run } from './helpers.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };

test('every scene has 1–3 lines, each with a unique id and a known speaker', () => {
  const ids = new Set();
  for (const [key, s] of Object.entries(SCENES)) {
    assert.ok(s.lines.length >= 1 && s.lines.length <= 3, `${key}: ${s.lines.length} lines`);
  }
  for (const l of allLines()) {
    assert.match(l.id, /^(mentor|guru)_[a-z0-9_]+$/, l.id);
    assert.ok(!ids.has(l.id), 'duplicate id ' + l.id); ids.add(l.id);
    assert.ok(CAST[l.who], 'unknown speaker ' + l.who);
    assert.ok(l.id.startsWith(l.who + '_'), `${l.id} should start with its speaker`);
    assert.ok(l.text.length <= 140, `${l.id} is a text wall (${l.text.length} chars)`);
  }
  for (const list of Object.values(MENTOR)) for (const l of list) assert.ok(!ids.has(l.id), 'review id reused ' + l.id);
});

test('every stage after agar has an intro scene; realism beats are in the script', () => {
  for (const st of STAGES.slice(1)) assert.ok(SCENES['stage_' + st.id], 'missing scene stage_' + st.id);
  const text = allLines().map(l => l.text).join(' ');
  assert.match(text, /arborist/i, 'free wood chips from an arborist (wine cap)');
  assert.match(text, /golden/i, 'why golden oysters were skipped');
  assert.match(text, /invasive|crowd out native/i);
});

test('myths have stable unique ids; the guru is right about half the time', () => {
  const ids = MYTHS.map(m => m.id);
  assert.equal(new Set(ids).size, MYTHS.length);
  ids.forEach(id => assert.match(id, /^myth_\d\d$/));
  const right = MYTHS.filter(m => m.a).length / MYTHS.length;
  assert.ok(right > 0.35 && right < 0.65, `guru right ${Math.round(right * 100)}%`);
  const q = guruQuiz(MYTHS[0], () => 0);
  assert.equal(q.claim.id, 'guru_claim_myth_01');
  assert.equal(q.guruRight, false);
  assert.ok(GURU.guruWrong.includes(q.react));
  assert.ok(GURU.guruRight.includes(guruQuiz(MYTHS.find(m => m.a), () => 0.99).react), 'mentor grudgingly admits it when the guru is right');
});

test('director: story runs get each once-only scene once; free play gets none', () => {
  setup(1);
  const g = newGame('normal', 'story');
  assert.ok(isStory(g));
  assert.equal(scene(g, 'intro').lines.length, 3);
  assert.equal(scene(g, 'intro'), null, 'intro plays once');
  assert.equal(scene(g, 'nope'), null);
  assert.equal(scene(newGame('normal', 'free'), 'intro'), null, 'free play has no script');
  assert.ok(scene(newGame('normal', 'expert'), 'intro'), 'expert keeps the story (Phase 6)');
  assert.ok(isStory(newGame('normal', 'tutorial')));
  assert.deepEqual(RUN_TYPES, ['tutorial', 'story', 'free', 'expert']);
  assert.equal(sceneKeyFor('stage', { stage: 1 }), 'stage_grain');
  assert.equal(sceneKeyFor('sfx', { name: 'mold' }), 'first_mold');
  assert.equal(sceneKeyFor('sfx', { name: 'tap' }), null);
  assert.equal(sceneKeyFor('forecast'), 'cold_snap');
});

test('the sim emits a forecast event before a cold snap (story hook)', async () => {
  setup(3, c => { c.room.coldSnapChance = 5; return c; });
  const g = newGame('normal'); g.stage = 3; // cold snaps start once fruiting opens
  let seen = 0; on(t => { if (t === 'forecast') seen++; });
  await run(g, 2);
  assert.ok(seen >= 1);
});

test('newGame defaults to free play; the run type survives save/load; old saves migrate to free play', () => {
  setup(1);
  assert.equal(newGame('normal').runType, 'free');
  const s = mem(), g = newGame('relaxed', 'tutorial'); g.story.seen.push('intro');
  saveRun(g, s);
  const back = loadRun(s);
  assert.equal(back.runType, 'tutorial'); assert.deepEqual(back.story.seen, ['intro']);
  const old = migrateRun({ v: 2, g: { slots: [], cash: 5 } });
  assert.equal(old.runType, 'free'); assert.deepEqual(old.story, { seen: [] });
  assert.deepEqual(migrateRun({ v: 2, g: { slots: [], story: 'x' } }).story, { seen: [] });
});

test('tutorial: steps are short, targets exist, and action steps complete from real game actions', () => {
  setup(1);
  const ids = TUTORIAL.map(s => s.id);
  assert.deepEqual(ids, ['house', 'sab', 'pour', 'room', 'speed', 'notebook', 'mastery']);
  for (const s of TUTORIAL) { assert.ok(s.targets.length && s.title && s.text.length <= 200, s.id); }
  const g = newGame('normal', 'tutorial'), k = id => ids.indexOf(id);
  assert.equal(stepDone(k('house'), g), false, 'info steps wait for Next');
  assert.equal(stepDone(k('sab'), g), false);
  assert.ok(buy(g, 'sab')); assert.equal(stepDone(k('sab'), g), true);
  assert.equal(stepDone(k('pour'), g), false);
  assert.ok(pourPlate(g, 0, 'mea')); assert.equal(stepDone(k('pour'), g), true);
  assert.equal(stepDone(k('room'), g), false);
  assert.ok(move(g, 0, 2)); assert.equal(stepDone(k('room'), g), true, 'spot 2 is the closet');
});
