// Exact analytic two-bone IK for a leg hanging along -Y.
// Thigh rotation is Euler YXZ [x, 0, abd] (abduct about Z, then swing about X); the knee
// bends about the thigh's local X. `d` is the hip→ankle vector in the pelvis frame.
import { clamp } from './math3.js';

export function solveTwoBone(d, l1, l2) {
  const raw = Math.hypot(d[0], d[1], d[2]);
  const maxReach = (l1 + l2) * 0.9999;
  const dist = clamp(raw, Math.abs(l1 - l2) + 1e-4, maxReach);
  const s = raw > 1e-9 ? dist / raw : 1;
  const [dx, dy, dz] = [d[0] * s, d[1] * s, d[2] * s];   // reachable target on the same ray

  // Knee from the law of cosines; positive = shin swings back.
  const kneeInner = Math.acos(clamp((l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2), -1, 1));
  const knee = Math.PI - kneeInner;

  // Leg vector in the thigh frame before hip rotation: (0, -(l1 + l2·cos k), -l2·sin k).
  const down = l1 + l2 * Math.cos(knee);
  const back = l2 * Math.sin(knee);
  const abd = Math.asin(clamp(dx / Math.max(down, 1e-6), -1, 1));
  // After abduction the leg lies at (y, z) = (-down·cos abd, -back); rotate it onto (dy, dz).
  const x = Math.atan2(dz, dy) - Math.atan2(-back, -down * Math.cos(abd));

  return { abd, x, knee, reached: raw <= maxReach };
}
