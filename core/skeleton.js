// Canonical skeleton + forward kinematics. Character faces +Z, Y is up, its left is +X.
// render/ builds its node tree from the same list, so core FK and the scene always agree.
import { vAdd, qMul, qRotate, qFromEulerYXZ, IDENTITY_Q } from './math3.js';

export function buildSkeleton(d) {
  const r = d.radii;
  const bones = [
    ['root', null, [0, 0, 0]],
    ['pelvis', 'root', [0, d.legM, 0]],
    ['spine', 'pelvis', [0, d.pelvisUp, 0]],
    ['chest', 'spine', [0, d.spineLen, 0]],
    ['neck', 'chest', [0, d.chestLen, 0]],
    ['head', 'neck', [0, d.neck, 0]],
    // Soft-tissue bones (spring-driven; the skinned body is partly weighted to them).
    ['belly', 'spine', [0, d.spineLen * 0.3, r.spine * 0.5]],
    ['cheek_L', 'head', [d.headR * 0.58, d.headR * 0.82, d.headR * 0.7]],
    ['cheek_R', 'head', [-d.headR * 0.58, d.headR * 0.82, d.headR * 0.7]],
    ['hairTail', 'head', [0, d.headR * 1.25, -d.headR * 0.95]],
  ];
  for (const [s, x] of [['L', 1], ['R', -1]]) {
    bones.push(
      [`upperArm_${s}`, 'chest', [x * d.shoulderHalf, d.chestLen * 0.88, 0]],
      [`forearm_${s}`, `upperArm_${s}`, [0, -d.upperArm, 0]],
      [`hand_${s}`, `forearm_${s}`, [0, -d.forearm, 0]],
      [`thigh_${s}`, 'pelvis', [x * d.hipHalf, 0, 0]],
      [`shin_${s}`, `thigh_${s}`, [0, -d.thigh, 0]],
      [`foot_${s}`, `shin_${s}`, [0, -d.shin, 0]],
      [`toes_${s}`, `foot_${s}`, [0, -d.ankleHeight, d.ballDist]],   // toe break at the ball, on the sole
      [`chestSoft_${s}`, 'chest', [x * 0.045 * d.H, d.chestLen * 0.5, r.chest * 0.55]],
      [`glute_${s}`, 'pelvis', [x * 0.048 * d.H, -0.035 * d.H, -0.075 * d.H]],
      [`thighFat_${s}`, `thigh_${s}`, [0, -0.35 * d.thigh, 0]],
      [`armFat_${s}`, `upperArm_${s}`, [0, -0.5 * d.upperArm, -0.005 * d.H]],
    );
  }
  return bones.map(([name, parent, offset]) => ({ name, parent, offset }));
}

// Visualization points that aren't bone origins: [bone, offset in that bone's frame].
export function pointSpec(name, d) {
  if (name === 'headTop') return ['head', [0, 2 * d.headR, 0]];
  if (name === 'toe_L' || name === 'toe_R') {
    return [`toes_${name.slice(-1)}`, [0, 0.012 * d.H, d.footLen - d.heelDist - d.ballDist - 0.01 * d.H]];
  }
  return [name, [0, 0, 0]];
}

export function pointWorld(world, spec) {
  const w = world[spec[0]];
  return vAdd(w.p, qRotate(w.q, spec[1]));
}

// pose = { rot: { bone: [x, y, z] Euler YXZ }, pos: { bone: [dx, dy, dz] added to offset } }
export function forwardKinematics(skeleton, pose) {
  const world = {};
  for (const b of skeleton) {
    const r = pose.rot[b.name];
    const dp = pose.pos[b.name];
    const lq = r ? qFromEulerYXZ(r[0], r[1], r[2]) : IDENTITY_Q;
    const lp = dp ? vAdd(b.offset, dp) : b.offset;
    if (!b.parent) {
      world[b.name] = { p: lp, q: lq };
    } else {
      const pw = world[b.parent];
      world[b.name] = { p: vAdd(pw.p, qRotate(pw.q, lp)), q: qMul(pw.q, lq) };
    }
  }
  return world;
}
