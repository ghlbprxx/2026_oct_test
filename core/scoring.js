// Match scoring: blend of visible-trajectory similarity and normalized parameter distance.
import { createBody } from './character.js';
import { poseAt } from './gait.js';
import { forwardKinematics } from './skeleton.js';

// Samples tracked points over one gait cycle (analytic, no springs → deterministic).
export function sampleTrajectory(params, scoreCfg) {
  const body = createBody(params);
  const frames = [];
  for (let i = 0; i < scoreCfg.samples; i++) {
    const pose = poseAt(body.params, body.dims, i / scoreCfg.samples, body.info);
    const world = forwardKinematics(body.skeleton, pose);
    frames.push(scoreCfg.tracked.map((n) => world[n].p));
  }
  return { frames, height: params.height };
}

// RMS distance between matching points, as a fraction of the reference (Target) height.
export function trajectoryError(a, ref) {
  let sum = 0, n = 0;
  for (let f = 0; f < ref.frames.length; f++) {
    for (let j = 0; j < ref.frames[f].length; j++) {
      const p = a.frames[f][j], q = ref.frames[f][j];
      sum += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
      n++;
    }
  }
  return Math.sqrt(sum / n) / ref.height;
}

export function parameterError(player, target, registry) {
  let err = 0;
  for (const p of registry) {
    if (!p.enabled) continue;
    const norm = (player[p.id] - target[p.id]) / (p.max - p.min);
    err += p.weight * norm * norm;
  }
  return err;
}

// Plain-language mismatches, biggest first. Differences within one step are ignored.
export function mismatches(player, target, registry) {
  const out = [];
  for (const p of registry) {
    if (!p.enabled) continue;
    const diff = player[p.id] - target[p.id];
    const range = p.max - p.min;
    const tolerance = Math.max(p.step, 0.015 * range);
    if (Math.abs(diff) <= tolerance + 1e-9) continue;
    const norm = diff / range;
    const direction = diff < 0 ? 'low' : 'high';
    out.push({
      id: p.id, label: p.label, group: p.group, diff, norm, direction,
      severity: p.weight * norm * norm,
      text: p.mismatch[direction],
    });
  }
  return out.sort((a, b) => b.severity - a.severity);
}

export function scoreMatch(playerParams, targetParams, targetSamples, registry, scoreCfg) {
  const trajErr = trajectoryError(sampleTrajectory(playerParams, scoreCfg), targetSamples);
  const paramErr = parameterError(playerParams, targetParams, registry);
  const { wTraj, wParam, kTraj, kParam } = scoreCfg;
  const raw = 100 * (wTraj * Math.exp(-kTraj * trajErr) + wParam * Math.exp(-kParam * paramErr));
  return {
    score: Math.round(raw * 10) / 10,
    trajErr,
    paramErr,
    breakdown: mismatches(playerParams, targetParams, registry),
  };
}
