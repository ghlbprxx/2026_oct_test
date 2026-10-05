// Procedural parametric gait. phase ∈ [0,1) covers one full stride (left heel strike at 0,
// right heel strike at 0.5). Returns a renderer-agnostic Pose for the canonical skeleton.
import { qFromEulerYXZ, qRotate, qConj, vAdd, vSub, clamp, smoothstep } from './math3.js';
import { solveTwoBone } from './ik.js';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const HEEL_STRIKE_PITCH = 14 * DEG;   // toes up at heel contact
const TOE_OFF_PITCH = 40 * DEG;       // heel up at push-off
const SWING_MID_PITCH = 6 * DEG;
const BOB_LAG = 0.045;                // pelvis bottoms out just after heel strike, flexing the knee
const BOB_AT_CONTACT = (1 + Math.cos(2 * TAU * BOB_LAG)) / 2;
const TOE_OUT = 7 * DEG;
const MAX_BOB = 0.07;                // m; real walking bobs ~3–7 cm

// Per-parameter-set constants; cache this alongside the body.
export function gaitInfo(p, d) {
  const legChain = d.thigh + d.shin;
  const maxStride = 2.25 * d.legM;
  const stride = Math.min(p.strideLength, maxStride);
  const beta = 0.5 + p.doubleSupport / 2;        // stance fraction per leg
  const f = p.cadence / 120;                      // strides per second
  // Pelvis height at mid-stance: knees nearly straight (~10–15° flex), like real walking.
  let baseY = d.ankleHeight + 0.98 * legChain;
  // Inverted-pendulum drop: the hip must sink far enough for the leading foot to reach the ground.
  const reach = 0.99 * legChain;
  const heelStrikeZ = 0.36 * stride * beta;
  const lowest = d.ankleHeight + Math.sqrt(Math.max(reach * reach - heelStrikeZ * heelStrikeZ, 0.01 * legChain * legChain));
  // The bob minimum lags heel strike (loading response), so size it for the height at contact.
  const neededBob = Math.max(0, baseY - lowest) / BOB_AT_CONTACT;
  // Past a natural bob, long strides on short legs are absorbed by bending the knees instead.
  const bob = clamp(neededBob, 0.004, MAX_BOB);
  baseY -= (neededBob - bob) * BOB_AT_CONTACT;
  return {
    f, stride, beta,
    speed: stride * f,
    baseY,
    // The bob minimum lags heel strike (loading response), so size it for the height at contact.
    bob,
    clearance: 0.08 * legChain,
    armAmp: clamp(8 + 20 * (stride - 0.8), 5, 38) * DEG,
    strideClamped: p.strideLength > maxStride,
  };
}

// Ankle position (z forward, y up) and foot pitch (toes-up positive) during stance, u ∈ [0,1].
function stanceFoot(u, info, d) {
  const zf = info.stride * info.beta * (0.36 - u); // flat-foot ankle; moves back at ground speed
  const ha = d.ankleHeight;
  let pitch = 0;
  if (u < 0.12) pitch = HEEL_STRIKE_PITCH * (1 - smoothstep(u / 0.12));
  else if (u > 0.55) pitch = -TOE_OFF_PITCH * Math.pow((u - 0.55) / (1 - 0.55), 1.6);
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

// Height of the ball of the foot above the ground for an ankle position + pitch.
function ballHeight(foot, d) {
  return foot.y + d.ballDist * Math.sin(foot.pitch) - d.ankleHeight * Math.cos(foot.pitch);
}

// If the trailing ankle is out of the leg's reach, roll further onto the ball of the foot (heel
// lifts earlier and higher) until it isn't — what real walkers do instead of crouching.
function rollToReach(foot, x, hip, reach, d) {
  const dist = (f) => Math.hypot(x - hip[0], f.y - hip[1], f.z - hip[2]);
  if (foot.pitch > 0 || foot.z > hip[2] || dist(foot) <= reach) return foot;
  const ha = d.ankleHeight, bd = d.ballDist;
  const c = Math.cos(foot.pitch), s = Math.sin(foot.pitch);
  const ballZ = foot.z + bd * c + ha * s;   // ball point implied by this ankle position and pitch
  const ballY = foot.y + bd * s - ha * c;
  const at = (th) => ({ z: ballZ - bd * Math.cos(th) - ha * Math.sin(th), y: ballY - bd * Math.sin(th) + ha * Math.cos(th), pitch: th });
  let lo = foot.pitch - 1.0, hi = foot.pitch;
  if (dist(at(lo)) > reach) return at(lo);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (dist(at(mid)) > reach) hi = mid; else lo = mid;
  }
  return at(lo);
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
  const pelvisY = info.baseY - info.bob * (1 + Math.cos(2 * TAU * (phase - BOB_LAG))) / 2; // lowest just after heel strikes
  rot.pelvis = [tilt, yaw, obliq];
  pos.pelvis = [sway, pelvisY - d.legM, 0];
  const qP = qFromEulerYXZ(tilt, yaw, obliq);
  const qPinv = qConj(qP);
  const pelvisW = [sway, pelvisY, 0];

  // Legs: place the ankle, then solve IK in the pelvis frame
  const feet = {};
  const reach = 0.995 * (d.thigh + d.shin);
  for (const [side, sgn, offset] of [['L', 1, 0], ['R', -1, 0.5]]) {
    const hip = vAdd(pelvisW, qRotate(qP, [sgn * d.hipHalf, 0, 0]));
    const foot = rollToReach(footAt((phase + offset) % 1, info, d), sgn * d.stepHalfWidth, hip, reach, d);
    feet[side] = foot;
    const ankle = [sgn * d.stepHalfWidth, foot.y, foot.z];
    const leg = solveTwoBone(qRotate(qPinv, vSub(ankle, hip)), d.thigh, d.shin);
    rot[`thigh_${side}`] = [leg.x, 0, leg.abd];
    rot[`shin_${side}`] = [leg.knee, 0, 0];
    rot[`foot_${side}`] = [-foot.pitch - (tilt + leg.x + leg.knee), -yaw + sgn * TOE_OUT, -(obliq + leg.abd)];
    // Toes stay flat on the ground while the heel rolls up (toe break at the ball of the foot).
    const grounded = clamp(1 - ballHeight(foot, d) / 0.04, 0, 1);   // eases back to straight after lift-off
    rot[`toes_${side}`] = [Math.min(0, foot.pitch) * grounded, 0, 0];
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
    const swing = -sgn * armPhase;                 // -1 … 1, forward positive
    const fwd = info.armAmp * swing;
    rot[`upperArm_${side}`] = [-fwd - trunkPitch, 0, sgn * 8 * DEG];
    rot[`forearm_${side}`] = [-(18 * DEG + 0.6 * Math.max(0, fwd)), 0, 0];
    rot[`hand_${side}`] = [-8 * DEG, sgn * 10 * DEG, 0];
    // Shoulder girdle: rolls forward with the arm and rises slightly each step.
    pos[`upperArm_${side}`] = [0, 0.004 * d.H * Math.cos(2 * TAU * (phase - 0.1)), 0.012 * d.H * swing];
  }

  return { rot, pos, feet };
}
