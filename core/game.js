// Top-level game: owns UI-facing state (optionally made reactive via `wrap`) and the
// non-reactive simulation runtime. No rendering or framework imports.
import { createBody, createCharacterSim, resetCharacterSim, stepCharacterSim } from './character.js';
import { sampleTrajectory, scoreMatch } from './scoring.js';
import { nextHint } from './hints.js';
import { resetModeState, updateMode } from './modes.js';
import { createClock } from './clock.js';
import { clamp } from './math3.js';
import { poseAt } from './gait.js';

export function createGame({ registry, targets, config, storage, wrap = (o) => o }) {
  const defaults = Object.fromEntries(registry.map((p) => [p.id, p.default]));
  const byId = Object.fromEntries(registry.map((p) => [p.id, p]));
  const saved = storage.load({ unlocked: [targets[0].id], best: {} });
  if (!Array.isArray(saved.unlocked) || !saved.unlocked.length) saved.unlocked = [targets[0].id];

  const state = wrap({
    mode: 'sandbox',
    difficulty: 'normal',
    targetId: targets[0].id,
    params: { ...defaults, sex: targets[0].sex || 'M' },
    score: 0,
    breakdown: [],
    hint: null,
    hintsUsed: 0,
    status: 'playing',
    timeLeft: config.timedSeconds,
    timedBest: 0,
    unlocked: saved.unlocked,
    best: saved.best || {},
    playback: { speed: 1, paused: false, ghost: false, floor: false, camera: 'threeQuarter', markers: true, trails: true },
    storageOk: storage.ok,
    strideClamped: false,
    result: null,
  });

  const clock = createClock(config.sim);
  const rt = {
    player: createCharacterSim(),
    target: createCharacterSim(),
    playerBody: null,
    targetBody: null,
    targetSamples: null,
    playerVersion: 0,
    targetVersion: 0,
    dirty: true,
  };

  const target = () => targets.find((t) => t.id === state.targetId);
  // `sex` rides along with the numeric params (body shape only; it's not in the registry, so not scored).
  const targetParams = (t = target()) => ({ ...defaults, sex: t.sex || 'M', ...t.params });
  const threshold = () => config.thresholds[state.difficulty];

  function rebuildPlayer() {
    rt.playerBody = createBody(state.params);
    rt.playerVersion++;
    rt.dirty = true;
    // While paused no steps run, so refresh the pose directly to show the change.
    if (clock.paused && rt.player.pose) {
      const b = rt.playerBody;
      rt.player.pose = poseAt(b.params, b.dims, rt.player.phase, b.info);
    }
  }

  function rebuildTarget() {
    const tp = targetParams();
    rt.targetBody = createBody(tp);
    rt.targetSamples = sampleTrajectory(tp, config.score);
    rt.targetVersion++;
    rt.dirty = true;
  }

  function persist() {
    state.storageOk = storage.save({ unlocked: state.unlocked, best: state.best }) && storage.ok;
  }

  function recordBest(mode, score) {
    const entry = state.best[state.targetId] || (state.best[state.targetId] = {});
    const prev = entry[mode];
    if (!prev || score > prev.score) entry[mode] = { score, hints: state.hintsUsed };
  }

  // Fresh attempt on the current target: default Player, synced phases, mode reset.
  function restart() {
    state.params = { ...defaults, sex: target().sex || 'M' }; // Player starts with the Target's sex
    state.hint = null;
    state.hintsUsed = 0;
    state.result = null;
    resetModeState(state, config);
    rebuildPlayer();
    rebuildTarget();
    resetCharacterSim(rt.player, rt.playerBody);
    resetCharacterSim(rt.target, rt.targetBody);
    recompute();
  }

  function recompute() {
    const res = scoreMatch(rt.playerBody.params, rt.targetBody.params, rt.targetSamples, registry, config.score);
    state.score = res.score;
    state.breakdown = res.breakdown.slice(0, config.score.breakdownSize);
    state.strideClamped = rt.playerBody.info.strideClamped;
    rt.dirty = false;
  }

  // One fixed physics step for both characters.
  function step(dt) {
    stepCharacterSim(rt.target, rt.targetBody, dt, config.springs, config.trails);
    stepCharacterSim(rt.player, rt.playerBody, dt, config.springs, config.trails);
    // When cadences match, ease the Player's phase onto the Target's so the walks line up.
    const fT = rt.targetBody.info.f;
    if (Math.abs(rt.playerBody.info.f - fT) / fT < config.sim.phaseLockTolerance) {
      let diff = rt.target.phase - rt.player.phase;
      diff -= Math.round(diff);
      rt.player.phase = (rt.player.phase + diff * Math.min(1, config.sim.phaseLockRate * dt) + 1) % 1;
    }
  }

  const game = {
    state,
    registry,
    targets,
    config,

    isUnlocked(id) {
      return state.mode === 'sandbox' || state.unlocked.includes(id);
    },
    currentTarget: target,
    threshold,

    setParam(id, value) {
      const p = byId[id];
      if (!p || !p.enabled || state.status === 'timeup') return;
      state.params[id] = clamp(Number(value), p.min, p.max);
      rebuildPlayer();
    },
    setSex(sex) {
      if (sex !== 'M' && sex !== 'F') return;
      state.params.sex = sex;
      rebuildPlayer();
    },
    resetParams() {
      if (state.status === 'timeup') return;
      state.params = { ...defaults, sex: state.params.sex };
      rebuildPlayer();
    },
    selectTarget(id) {
      if (!targets.some((t) => t.id === id) || !game.isUnlocked(id)) return;
      state.targetId = id;
      restart();
    },
    setMode(mode) {
      state.mode = mode;
      if (!game.isUnlocked(state.targetId)) state.targetId = state.unlocked[state.unlocked.length - 1];
      restart();
    },
    setDifficulty(d) {
      if (!config.thresholds[d]) return;
      state.difficulty = d;
      if (state.mode === 'challenge' && state.status === 'won' && state.score < threshold()) state.status = 'playing';
    },
    restart,
    nextTarget() {
      const i = targets.findIndex((t) => t.id === state.targetId);
      const next = targets[i + 1];
      if (next && game.isUnlocked(next.id)) game.selectTarget(next.id);
      else state.result = null;
    },
    dismissResult() { state.result = null; },
    requestHint() {
      state.hint = nextHint(state.hint, state.breakdown, registry);
      if (state.hint.paramId) state.hintsUsed++;
    },

    // Playback
    togglePause() { clock.paused = state.playback.paused = !state.playback.paused; },
    frameStep() { if (state.playback.paused) clock.frameStep(); },
    setSpeed(s) { clock.speed = state.playback.speed = s; },
    toggleGhost() { state.playback.ghost = !state.playback.ghost; },
    toggleFloor() { state.playback.floor = !state.playback.floor; },
    toggleMarkers() { state.playback.markers = !state.playback.markers; },
    toggleTrails() { state.playback.trails = !state.playback.trails; },
    setCamera(c) { state.playback.camera = c; },

    // Called once per animation frame with real elapsed seconds.
    tick(realDt) {
      const n = clock.advance(realDt);
      for (let i = 0; i < n; i++) step(clock.fixedStep);
      if (rt.dirty) recompute();
      const event = updateMode(state, { score: state.score, dt: realDt, threshold: threshold() });
      if (event === 'won') {
        recordBest('challenge', state.score);
        const i = targets.findIndex((t) => t.id === state.targetId);
        const next = targets[i + 1];
        if (next && !state.unlocked.includes(next.id)) state.unlocked.push(next.id);
        persist();
        state.result = { kind: 'won', score: state.score, hints: state.hintsUsed, next: next ? next.name : null };
      } else if (event === 'timeup') {
        recordBest('timed', state.timedBest);
        persist();
        state.result = { kind: 'timeup', score: state.timedBest, hints: state.hintsUsed, next: null };
      }
    },

    // Read by the render layer every frame.
    getFrame() {
      return {
        target: { body: rt.targetBody, pose: rt.target.pose, distance: rt.target.distance, cycles: rt.target.cycles, trail: rt.target.trail, version: rt.targetVersion },
        player: { body: rt.playerBody, pose: rt.player.pose, distance: rt.player.distance, cycles: rt.player.cycles, trail: rt.player.trail, version: rt.playerVersion },
      };
    },
  };

  restart();
  return game;
}
