// Procedural parametric gait. phase ∈ [0,1) covers one full stride (left heel strike at 0,
// right heel strike at 0.5). Returns a renderer-agnostic Pose for the canonical skeleton.
import { qFromEulerYXZ, qRotate, qConj, vAdd, vSub, clamp, smoothstep } from './math3.js';
import { solveTwoBone } from './ik.js';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const HEEL_STRIKE_PITCH = 14 * DEG;   // toes up at heel contact
const TOE_OFF_PITCH = 32 * DEG;       // heel up at push-off
const SWING_MID_PITCH = 6 * DEG;

// Per-parameter-set constants; cache this alongside the body.
export function gaitInfo(p, d) {
  const legChain = d.thigh + d.shin;
  const maxStride = 2.25 * d.legM;
  const stride = Math.min(p.strideLength, maxStride);
  const beta = 0.5 + p.doubleSupport / 2;        // stance fraction per leg
  const f = p.cadence / 120;                      // strides per second
  const baseY = d.ankleHeight + 0.94 * legChain; // pelvis height at mid-stance
  // Inverted-pendulum drop: the hip must sink far enough for the leading foot to reach the ground.
  const reach = 0.99 * legChain;
  const heelStrikeZ = 0.44 * stride * beta;
  const lowest = d.ankleHeight + Math.sqrt(Math.max(reach * reach - heelStrikeZ * heelStrikeZ, 0.01 * legChain * legChain));
  return {
    f, stride, beta,
    speed: stride * f,
    baseY,
    bob: clamp(baseY - lowest, 0.004, 0.12),
    clearance: 0.08 * legChain,
    armAmp: clamp(8 + 20 * (stride - 0.8), 5, 38) * DEG,
    strideClamped: p.strideLength > maxStride,
  };
}

// Ankle position (z forward, y up) and foot pitch (toes-up positive) during stance, u ∈ [0,1].
function stanceFoot(u, info, d) {
  const zf = info.stride * info.beta * (0.44 - u); // flat-foot ankle; moves back at ground speed
  const ha = d.ankleHeight;
  let pitch = 0;
  if (u < 0.12) pitch = HEEL_STRIKE_PITCH * (1 - smoothstep(u / 0.12));
  else if (u > 0.62) pitch = -TOE_OFF_PITCH * Math.pow((u - 0.62) / 0.38, 1.6);
  const c = Math.cos(pitch), s = Math.sin(pitch);
  if (pitch > 0) { // rock on the heel
    const heelZ = zf - d.heelDist;
    return { z: heelZ + d.heelDist * c - ha * s, y: d.heelDist * s + ha * c, pitch };
  }
  if (pitch < 0) { // rock on the ball of the foot
    const ballZ = zf + d.ballDist;
    return { z: ballZ - d.ballDist * c - ha * s, y: -d.ballDist * s + ha * c, pitch };
  }
  return { z: zf, y: ha, pitch: 0 };
}

// Swing: Hermite path from toe-off to the next heel strike, tangents matched to ground speed.
function swingFoot(u, info, d) {
  const a = stanceFoot(1, info, d);
  const b = stanceFoot(0, info, d);
  const m = -info.stride * (1 - info.beta);
  const u2 = u * u, u3 = u2 * u;
  const z = (2 * u3 - 3 * u2 + 1) * a.z + (u3 - 2 * u2 + u) * m + (-2 * u3 + 3 * u2) * b.z + (u3 - u2) * m;
  const y = a.y + (b.y - a.y) * smoothstep(u) + info.clearance * Math.sin(Math.PI * u);
  const pitch = u < 0.45
    ? a.pitch + (SWING_MID_PITCH - a.pitch) * smoothstep(u / 0.45)
    : SWING_MID_PITCH + (b.pitch - SWING_MID_PITCH) * smoothstep((u - 0.45) / 0.55);
  return { z, y, pitch };
}

export function footAt(legPhase, info, d) {
  return legPhase < info.beta
    ? stanceFoot(legPhase / info.beta, info, d)
    : swingFoot((legPhase - info.beta) / (1 - info.beta), info, d);
}

export function poseAt(p, d, phase, info = gaitInfo(p, d)) {
  const rot = {};
  const pos = {};
  const s1 = Math.sin(TAU * phase);
  const c1 = Math.cos(TAU * phase);
  const c2 = Math.cos(2 * TAU * phase);

  // Pelvis
  const sway = (p.hipSway / 100) * s1;                       // over the stance leg
  const yaw = -p.pelvicRotation * DEG * c1;                  // swing hip forward
  const obliq = (1.5 + 0.55 * p.hipSway) * DEG * s1;         // swing hip drops
  const tilt = p.pelvicTilt * DEG + 1.5 * DEG * c2;
  const pelvisY = info.baseY - info.bob * (1 + c2) / 2;      // lowest at heel strikes
  rot.pelvis = [tilt, yaw, obliq];
  pos.pelvis = [sway, pelvisY - d.legM, 0];
  const qP = qFromEulerYXZ(tilt, yaw, obliq);
  const qPinv = qConj(qP);
  const pelvisW = [sway, pelvisY, 0];

  // Legs: place the ankle, then solve IK in the pelvis frame
  for (const [side, sgn, offset] of [['L', 1, 0], ['R', -1, 0.5]]) {
    const foot = footAt((phase + offset) % 1, info, d);
    const ankle = [sgn * d.stepHalfWidth, foot.y, foot.z];
    const hip = vAdd(pelvisW, qRotate(qP, [sgn * d.hipHalf, 0, 0]));
    const leg = solveTwoBone(qRotate(qPinv, vSub(ankle, hip)), d.thigh, d.shin);
    rot[`thigh_${side}`] = [leg.x, 0, leg.abd];
    rot[`shin_${side}`] = [leg.knee, 0, 0];
    rot[`foot_${side}`] = [-foot.pitch - (tilt + leg.x + leg.knee), -yaw, -(obliq + leg.abd)];
  }

  // Trunk: counter-rotate so the chest twists against the pelvis and the head stays level
  const lean = clamp(3 + 2 * (info.speed - 1.2), 0, 8) * DEG;
  rot.spine = [-0.85 * tilt + 0.5 * lean, -0.45 * yaw, -0.6 * obliq];
  rot.chest = [0.5 * lean, -0.9 * yaw, -0.3 * obliq];
  const trunkPitch = 0.15 * tilt + lean;
  rot.neck = [-0.5 * trunkPitch, 0.15 * yaw, -0.05 * obliq];
  rot.head = [-0.5 * trunkPitch - 1.2 * DEG * c2, 0.2 * yaw, -0.05 * obliq];

  // Arms swing opposite the same-side leg, lagging slightly
  const armPhase = Math.cos(TAU * (phase - 0.03));
  for (const [side, sgn] of [['L', 1], ['R', -1]]) {
    const fwd = -sgn * info.armAmp * armPhase;
    rot[`upperArm_${side}`] = [-fwd - trunkPitch, 0, sgn * 7 * DEG];
    rot[`forearm_${side}`] = [-(12 * DEG + 0.55 * Math.max(0, fwd)), 0, 0];
  }

  return { rot, pos };
}
