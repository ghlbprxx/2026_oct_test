// Damped springs, semi-implicit Euler. Call only with a fixed dt.
import { vLen } from './math3.js';

// Linear spring for soft-body jiggle: d'' = -k·d - c·d' - gain·a_parent (in the parent frame).
export function createLinearSpring() {
  return { d: [0, 0, 0], v: [0, 0, 0] };
}

export function stepLinearSpring(s, accel, cfg, dt) {
  for (let i = 0; i < 3; i++) {
    const a = -cfg.k * s.d[i] - cfg.c * s.v[i] - cfg.gain * accel[i];
    s.v[i] += a * dt;
    s.d[i] += s.v[i] * dt;
  }
  const len = vLen(s.d);
  if (len > cfg.max) {
    const f = cfg.max / len;
    for (let i = 0; i < 3; i++) { s.d[i] *= f; s.v[i] *= 0.5; }
  }
  return s.d;
}

// Angular follow-through: x chases `target` with lag; `drive` adds an external torque.
export function createAngularSpring() {
  return { x: 0, v: 0, ready: false };
}

export function stepAngularSpring(s, target, cfg, dt, drive = 0) {
  if (!s.ready) { s.x = target; s.v = 0; s.ready = true; }
  const a = cfg.k * (target - s.x) - cfg.c * s.v + drive;
  s.v += a * dt;
  s.x += s.v * dt;
  return s.x;
}
