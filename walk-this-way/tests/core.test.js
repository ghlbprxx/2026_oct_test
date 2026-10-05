// Core-layer tests. Run with: npm test  (or: node --test tests/*.test.js)
// core/ has no DOM, Three.js, or Vue dependencies, so it runs directly in Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PARAMS } from '../data/params.js';
import { TARGETS } from '../data/targets.js';
import { CONFIG } from '../data/config.js';
import { createBody } from '../core/character.js';
import { poseAt } from '../core/gait.js';
import { vAdd, qRotate } from '../core/math3.js';
import { forwardKinematics } from '../core/skeleton.js';
import { sampleTrajectory, scoreMatch, mismatches } from '../core/scoring.js';
import { nextHint } from '../core/hints.js';
import { createClock } from '../core/clock.js';
import { createStorage } from '../core/storage.js';
import { createGame } from '../core/game.js';

const defaults = Object.fromEntries(PARAMS.map((p) => [p.id, p.default]));
const targetParams = (t) => ({ ...defaults, sex: t.sex, ...t.params });
const byId = (id) => TARGETS.find((t) => t.id === id);
const memoryStore = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test('registry entries are complete and targets use only enabled MVP params', () => {
  for (const p of PARAMS) {
    for (const k of ['id', 'group', 'label', 'min', 'max', 'step', 'default', 'explain', 'hint', 'mismatch']) {
      assert.ok(p[k] !== undefined, `${p.id} missing ${k}`);
    }
    assert.ok(p.min <= p.default && p.default <= p.max, `${p.id} default out of range`);
  }
  const enabled = new Set(PARAMS.filter((p) => p.enabled).map((p) => p.id));
  assert.equal(TARGETS.length, 10);
  assert.equal(TARGETS.filter((t) => t.sex === 'F').length, 5);
  assert.equal(TARGETS.filter((t) => t.sex === 'M').length, 5);
  for (const t of TARGETS) {
    for (const [k, v] of Object.entries(t.params)) {
      assert.ok(enabled.has(k), `${t.id} uses non-MVP param ${k}`);
      const p = PARAMS.find((q) => q.id === k);
      assert.ok(v >= p.min && v <= p.max, `${t.id}.${k} out of range`);
    }
  }
});

test('gait produces finite poses at parameter extremes', () => {
  for (const ext of ['min', 'max']) {
    const p = Object.fromEntries(PARAMS.map((q) => [q.id, q[ext]]));
    const b = createBody(p);
    for (let i = 0; i < 64; i++) {
      const pose = poseAt(p, b.dims, i / 64, b.info);
      for (const r of Object.values(pose.rot)) for (const x of r) assert.ok(Number.isFinite(x), `NaN at ${ext}`);
    }
  }
});

test('knees bend naturally and the planted foot never slides', () => {
  for (const params of [defaults, ...TARGETS.map(targetParams)]) {
    const b = createBody(params);
    let z0 = null, phase0 = 0;
    for (let i = 0; i < 400; i++) {
      const phase = i / 400;
      const pose = poseAt(params, b.dims, phase, b.info);
      const world = forwardKinematics(b.skeleton, pose);
      assert.ok(pose.rot.shin_L[0] >= -1e-9, 'knee bent backwards');
      // IK reaches the (possibly toe-rolled) ankle target exactly.
      const got = world.foot_L.p;
      assert.ok(Math.hypot(got[1] - pose.feet.L.y, got[2] - pose.feet.L.z) < 0.001, `IK misses at phase ${phase}`);
      // Mid-stance knee: soft but not crouched (real walking ≈ 5–20°).
      if (Math.abs(phase - b.info.beta / 2) < 0.0013) {
        const knee = pose.rot.shin_L[0] * 180 / Math.PI;
        assert.ok(knee > 3 && knee < 25, `mid-stance knee ${knee.toFixed(1)}°`);
      }
      // From foot-flat to toe-off the ball of the foot stays on the ground and moves with the belt.
      const u = phase / b.info.beta;
      if (u >= 0.15 && u <= 0.97) {
        const ball = vAdd(got, qRotate(world.foot_L.q, [0, -b.dims.ankleHeight, b.dims.ballDist]));
        if (z0 === null) { z0 = ball[2]; phase0 = phase; }
        assert.ok(Math.abs(ball[1]) < 0.003, `ball lifts ${ball[1]} at ${phase}`);
        assert.ok(Math.abs(ball[2] - (z0 - b.info.stride * (phase - phase0))) < 0.003, `ball slides at ${phase}`);
      }
    }
  }
});

test('exact match scores 100; default walker is below Easy for every target', () => {
  for (const t of TARGETS) {
    const tp = targetParams(t);
    const samples = sampleTrajectory(tp, CONFIG.score);
    assert.equal(scoreMatch(tp, tp, samples, PARAMS, CONFIG.score).score, 100);
    const fromDefault = scoreMatch(defaults, tp, samples, PARAMS, CONFIG.score).score;
    assert.ok(fromDefault < CONFIG.thresholds.easy, `${t.id}: default scores ${fromDefault}`);
  }
});

test('scores stay within 0..100 and drop as a parameter moves away', () => {
  const tp = targetParams(byId('rosa'));
  const samples = sampleTrajectory(tp, CONFIG.score);
  let prev = 101;
  for (const v of [6.5, 5.5, 4, 2, 0]) {
    const s = scoreMatch({ ...tp, hipSway: v }, tp, samples, PARAMS, CONFIG.score).score;
    assert.ok(s >= 0 && s <= 100);
    assert.ok(s < prev, `score did not fall at hipSway ${v}`);
    prev = s;
  }
});

test('breakdown is plain language and sorted by severity', () => {
  const tp = targetParams(TARGETS[0]);
  const list = mismatches(defaults, tp, PARAMS);
  assert.ok(list.length > 0);
  for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].severity >= list[i].severity);
  assert.ok(list.some((m) => m.text === 'Stride too short'));
});

test('hints escalate from vague to specific, then restart on a new parameter', () => {
  const tp = targetParams(byId('rosa'));
  const breakdown = mismatches(defaults, tp, PARAMS);
  let h = null;
  const texts = [];
  for (let i = 0; i < 5; i++) { h = nextHint(h, breakdown, PARAMS); texts.push(h); }
  assert.deepEqual(texts.map((t) => t.level), [1, 2, 3, 4, 4]);
  assert.equal(texts[0].text, 'Watch the hips.');
  assert.equal(texts[2].text, 'Increase hip sway.');
  const other = nextHint(h, breakdown.slice(1), PARAMS);
  assert.equal(other.level, 1);
});

test('clock: frame step advances exactly one frame of sim time regardless of speed', () => {
  for (const speed of [0.1, 1, 2]) {
    const clock = createClock(CONFIG.sim);
    clock.speed = speed;
    clock.paused = true;
    assert.equal(clock.advance(0.5), 0);
    clock.frameStep();
    assert.equal(clock.advance(0.5), Math.round(CONFIG.sim.frameStep / CONFIG.sim.fixedStep));
  }
});

test('storage falls back gracefully when unavailable or corrupt', () => {
  const throwing = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {} };
  const s = createStorage('k', throwing);
  assert.equal(s.ok, false);
  assert.deepEqual(s.load({ a: 1 }), { a: 1 });
  assert.equal(s.save({ a: 2 }), false);
  assert.deepEqual(s.load({ a: 1 }), { a: 2 }); // remembered in memory

  const corrupt = memoryStore();
  corrupt.setItem('k', '{not json');
  assert.deepEqual(createStorage('k', corrupt).load({ a: 1 }), { a: 1 });
});

test('challenge: matching the target wins, unlocks the next one, and persists', () => {
  const store = memoryStore();
  const storage = createStorage(CONFIG.storageKey, store);
  const game = createGame({ registry: PARAMS, targets: TARGETS, config: CONFIG, storage });
  game.setMode('challenge');
  assert.equal(game.isUnlocked('pip'), false);
  game.selectTarget('pip'); // locked → ignored
  assert.equal(game.state.targetId, 'stretch');
  for (const [k, v] of Object.entries(TARGETS[0].params)) game.setParam(k, v);
  game.tick(1 / 60);
  assert.equal(game.state.score, 100);
  assert.equal(game.state.status, 'won');
  assert.deepEqual(game.state.unlocked, ['stretch', 'pip']);
  const saved = JSON.parse(store.getItem(CONFIG.storageKey));
  assert.deepEqual(saved.unlocked, ['stretch', 'pip']);
  assert.equal(saved.best.stretch.challenge.score, 100);

  const reloaded = createGame({ registry: PARAMS, targets: TARGETS, config: CONFIG, storage: createStorage(CONFIG.storageKey, store) });
  reloaded.setMode('challenge');
  assert.equal(reloaded.isUnlocked('pip'), true);
});

test('timed mode ends and records the best score', () => {
  const game = createGame({ registry: PARAMS, targets: TARGETS, config: CONFIG, storage: createStorage('t', memoryStore()) });
  game.setMode('timed');
  for (let i = 0; i < CONFIG.timedSeconds * 10 + 5; i++) game.tick(0.1);
  assert.equal(game.state.status, 'timeup');
  assert.equal(game.state.result.kind, 'timeup');
  assert.ok(game.state.best.stretch.timed.score > 0);
  game.setParam('height', 1.9); // ignored after time is up
  assert.equal(game.state.params.height, 1.7);
});

test('trail history is dense, bounded to the configured window, and sits on the ground at stance', () => {
  const game = createGame({ registry: PARAMS, targets: TARGETS, config: CONFIG, storage: createStorage('tr', memoryStore()) });
  for (let i = 0; i < 240; i++) game.tick(1 / 60);
  const { trail, cycles } = game.getFrame().player;
  assert.ok(trail.length > 60, `only ${trail.length} samples`);
  assert.ok(cycles - trail[0].cycles <= CONFIG.trails.cycles + 1e-9);
  for (let i = 1; i < trail.length; i++) assert.ok(trail[i].cycles - trail[i - 1].cycles < 0.02, 'gap in trail');
  const toe = CONFIG.trails.points.findIndex(([n]) => n === 'toe_L');
  const minToeY = Math.min(...trail.map((s) => s.pts[toe][1]));
  assert.ok(minToeY > -0.01 && minToeY < 0.04, `toe min height ${minToeY}`);
  game.restart();
  assert.equal(game.getFrame().player.trail.length, 0);
});
