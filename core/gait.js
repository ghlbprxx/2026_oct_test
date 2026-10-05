// Procedural parametric gait. phase ∈ [0,1) covers one full stride (left heel strike at 0,
// right heel strike at 0.5). Returns a renderer-agnostic Pose for the canonical skeleton.
//
// What the "walking test" motion capture taught (data/mocapGait.js, tools/extract-mocap-gait.mjs):
//  - the hips vault over a nearly straight stance leg instead of bobbing on a fixed sine, so the
//    pelvis height is solved from the legs (pelvisHeights) and the knee is ~15° at heel strike,
//  - the heel stays down until the other foot is about to land, then rolls up fast,
//  - the knee starts bending before toe-off and peaks ~60° early in swing,
//  - the swing foot leaves fast, peaks early, reaches slightly past the landing spot and pulls back.
// The parameters still set every size and timing. Where the clip is not physical (its stance foot
// slides ~20%) the gait keeps the foot planted and uses clinical gait norms instead.
import { qFromEulerYXZ, qRotate, qConj, vAdd, vSub, clamp, smoothstep } from './math3.js';
import { solveTwoBone } from './ik.js';
import { MOCAP_GAIT } from '../data/mocapGait.js';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const TOE_OUT = 7 * DEG;
// Stance foot
const HEEL_STRIKE_PITCH = 14 * DEG;   // toes up at heel contact
const TOE_OFF_PITCH = 55 * DEG;       // foot-to-floor angle at push-off (clinical ~50–60°)
const HEEL_RISE_START = 0.6;          // × stance: heel-off; the heel then rolls up ever faster,
const HEEL_RISE_POW = 2.2;            //   so the ankle is nearly still at toe-off
// Stance knee flexion (degrees) vs. stance progress: ~12° at heel strike, a ~15° loading response,
// ~5° at mid-stance, then bending again before toe-off (clinical norms and the mocap).
const STANCE_KNEE = [[0, 12], [0.1, 14], [0.2, 15], [0.4, 9], [0.6, 5], [0.75, 8], [0.85, 15], [1, 35]];
// Pelvis height
const MAX_BOB = 0.075;                // m; past this, long strides on short legs bend the knees instead
const LOAD_SAG = 0.01;                // × leg; extra hip drop as the landing leg takes the weight
const LOAD_SAG_AT = 0.08;             //   deepest this long after heel strike (× step)
const LOAD_SAG_WIDTH = 0.12;          //   width (× step)
const PELVIS_SAMPLES = 256;
const SOFT_MIN = 0.004;               // m; blends the hand-off between legs
const SMOOTH_WINDOW = 0.04;           // × stride; corners in the hip path are rounded over about twice this
const ROLL_REACH = 0.995;             // × leg; the trailing leg rolls onto its toes rather than stretch past this
const MAX_ROLL = 70 * DEG;            // steepest the trailing foot may roll up
// Swing foot
const SWING_WARP = 1.6;               // > 1 brings the swing foot forward sooner than the (sliding) mocap
const SWING_LIFT = 0.05;              // × leg; lift above the toe-off → heel-strike line (mocap: 0.039)
const TOE_CLEARANCE = 0.008;          // m at 1.7 m tall; minimum toe height while the foot passes under the body

// Length of a leg (hip → ankle) with the knee bent `kneeDeg`.
const legReach = (d, kneeDeg) => Math.sqrt(d.thigh ** 2 + d.shin ** 2 + 2 * d.thigh * d.shin * Math.cos(kneeDeg * DEG));

// Per-parameter-set constants; cache this alongside the body.
export function gaitInfo(p, d) {
  const legChain = d.thigh + d.shin;
  const maxStride = 2.25 * d.legM;
  const stride = Math.min(p.strideLength, maxStride);
  const beta = 0.5 + p.doubleSupport / 2;        // stance fraction per leg
  const f = p.cadence / 120;                      // strides per second
  const info = {
    f, stride, beta,
    speed: stride * f,
    lift: SWING_LIFT * legChain,
    toeClear: (TOE_CLEARANCE * d.H) / 1.7,
    armAmp: clamp(8 + 20 * (stride - 0.8), 5, 38) * DEG,
    strideClamped: p.strideLength > maxStride,
  };
  info.ahead = placeHeelStrike(p, d, info);
  // Swing endpoints, and the stance foot's velocity there (per unit of swing progress) so the swing
  // path leaves and lands without a hitch.
  const k = (1 - beta) / beta, e = 1e-4;
  const on = stanceFoot(0, info, d), on2 = stanceFoot(e, info, d);
  const off = stanceFoot(1, info, d), off2 = stanceFoot(1 - e, info, d);
  const vel = (p1, p0) => ({ z: ((p1.z - p0.z) / e) * k, y: ((p1.y - p0.y) / e) * k, pitch: ((p1.pitch - p0.pitch) / e) * k });
  info.swing = { a: off, b: on, va: vel(off, off2), vb: vel(on2, on) };
  info.pelvisY = pelvisHeights(p, d, info);
  let lo = Infinity, hi = -Infinity;
  for (const y of info.pelvisY) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  info.bob = hi - lo;
  return info;
}

// Where the heel lands (ankle, × stride ahead of the hips): the spot where the leading leg (knee as in
// STANCE_KNEE) and the trailing leg (heel just starting to rise) hold the hips equally high. Further
// ahead and the hips would drop abruptly onto the new leg; further back and the trailing knee would
// buckle first. Typically 0.22–0.26.
function placeHeelStrike(p, d, info) {
  const { sway, qP } = pelvisMotion(p, 0);
  const singleEnd = 0.5 / info.beta;
  const hipHeight = (sgn, foot, kneeDeg) => {
    const r = legReach(d, kneeDeg);
    const hip = qRotate(qP, [sgn * d.hipHalf, 0, 0]);
    const dx = sgn * d.stepHalfWidth - (sway + hip[0]);
    return foot.y + Math.sqrt(Math.max(r * r - dx * dx - (foot.z - hip[2]) ** 2, 0)) - hip[1];
  };
  const gap = (ahead) => {
    const t = { ...info, ahead };
    return hipHeight(1, stanceFoot(0, t, d), STANCE_KNEE[0][1]) - hipHeight(-1, stanceFoot(singleEnd, t, d), table(STANCE_KNEE, singleEnd));
  };
  let lo = 0.1, hi = 0.4;   // gap falls as the heel lands further ahead
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (gap(mid) > 0) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// Pelvis rotation and side-to-side sway (independent of its height).
function pelvisMotion(p, phase) {
  const s1 = Math.sin(TAU * phase);
  const c1 = Math.cos(TAU * phase);
  const c2 = Math.cos(2 * TAU * phase);
  const sway = (p.hipSway / 100) * s1;                       // over the stance leg
  const yaw = -p.pelvicRotation * DEG * c1;                  // swing hip forward
  const obliq = (1.5 + 0.55 * p.hipSway) * DEG * s1;         // swing hip drops
  const tilt = p.pelvicTilt * DEG + 1.5 * DEG * c2;
  return { sway, yaw, obliq, tilt, qP: qFromEulerYXZ(tilt, yaw, obliq) };
}

// Pelvis height over the cycle, from the legs: at every phase the hips sit as high as the supporting
// leg allows with its knee on the stance-flexion profile. That gives the inverted-pendulum vault of
// real walking (highest over a nearly straight leg at mid-stance, lowest at heel strike) with
// realistic knee angles. After each heel strike the hips sink a little more as the knee absorbs the
// landing (loading response), which also lets the trailing knee bend before toe-off.
function pelvisHeights(p, d, info) {
  const legChain = d.thigh + d.shin;
  const singleEnd = 0.5 / info.beta;    // stance progress at which the other heel strikes
  const ys = new Float64Array(PELVIS_SAMPLES + 1);
  for (let i = 0; i <= PELVIS_SAMPLES; i++) {
    const phase = i / PELVIS_SAMPLES;
    const { sway, qP } = pelvisMotion(p, phase);
    const limits = [];
    for (const [sgn, offset] of [[1, 0], [-1, 0.5]]) {
      const lp = (phase + offset) % 1;
      const hip = qRotate(qP, [sgn * d.hipHalf, 0, 0]);
      const dx = sgn * d.stepHalfWidth - (sway + hip[0]);
      // Highest pelvis from which this ankle position is reached with a leg `r` long.
      const limit = (foot, r) => {
        const dz = foot.z - hip[2];
        return foot.y + Math.sqrt(Math.max(r * r - dx * dx - dz * dz, 0.25 * legChain * legChain)) - hip[1];
      };
      const stance = lp < info.beta;
      const u = stance ? lp / info.beta : (lp - info.beta) / (1 - info.beta);
      const foot = stance ? stanceFoot(u, info, d) : swingFoot(u, info, d);
      if (stance) {
        // The supporting leg follows the stance-knee profile until the other heel is down; then it
        // hands over (it rolls onto its toes instead, below).
        const handOff = 0.5 * smoothstep((u - singleEnd) / 0.06);
        limits.push(limit(foot, legReach(d, table(STANCE_KNEE, u))) + handOff);
      }
      // Around toe-off the trailing foot may roll further onto its ball (rollToReach), but no further.
      if (stance ? u > singleEnd - 0.1 : u < 0.4) {
        limits.push(limit(rolledTo(foot, Math.min(foot.pitch, -MAX_ROLL), d), 0.99 * ROLL_REACH * legChain));
      }
    }
    let acc = 0;
    for (const y of limits) acc += Math.exp(-(y - limits[0]) / SOFT_MIN);
    ys[i] = limits[0] - SOFT_MIN * Math.log(acc);   // soft minimum: never above what any leg allows
  }
  // Past a natural bob, long strides on short legs are absorbed by bending the knees instead: the top
  // of the vault is softly clipped (only ever lowered, so every foot stays reachable).
  let lo = Infinity;
  for (const y of ys) lo = Math.min(lo, y);
  const k = 6 / MAX_BOB;
  for (let i = 0; i < ys.length; i++) ys[i] = lo - Math.log(Math.exp(-k * (ys[i] - lo)) + Math.exp(-6)) / k;
  for (let i = 0; i < ys.length; i++) {
    const x = (i / PELVIS_SAMPLES - LOAD_SAG_AT) * 2;   // two heel strikes per stride
    const dx = x - Math.round(x);
    ys[i] -= LOAD_SAG * legChain * Math.exp(-((dx / LOAD_SAG_WIDTH) ** 2));
  }
  return smoothBelow(ys);
}

// Rounds off the corners where support passes between legs (they would jolt the whole body) without
// ever raising the hips: a sliding minimum, then a Gaussian no wider than that window, so every
// smoothed value is an average of values at or below the original one.
function smoothBelow(ys) {
  const n = PELVIS_SAMPLES, w = Math.round(SMOOTH_WINDOW * n);
  const lowest = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let m = Infinity;
    for (let k = -w; k <= w; k++) m = Math.min(m, ys[(i + k + n) % n]);
    lowest[i] = m;
  }
  const g = [];
  let sum = 0;
  for (let k = -w; k <= w; k++) { const v = Math.exp(-0.5 * (k / (w / 2)) ** 2); g.push(v); sum += v; }
  const out = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let k = -w; k <= w; k++) acc += g[k + w] * lowest[(i + k + n) % n];
    out[i] = acc / sum;
  }
  out[n] = out[0];
  return out;
}

// Periodic Catmull-Rom through the samples, so the hips' vertical speed has no kinks.
function pelvisYAt(info, phase) {
  const ys = info.pelvisY, n = PELVIS_SAMPLES;
  const x = phase * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const p0 = ys[(i + n - 1) % n], p1 = ys[i], p2 = ys[i + 1], p3 = ys[(i + 2) % n];
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
}

// Lookup in [[x, y], ...] knots, eased between knots.
function table(knots, x) {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    if (x <= knots[i][0]) {
      const [x0, y0] = knots[i - 1], [x1, y1] = knots[i];
      return y0 + (y1 - y0) * smoothstep((x - x0) / (x1 - x0));
    }
  }
  return knots[knots.length - 1][1];
}

// Catmull-Rom lookup in a profile sampled uniformly over u ∈ [0, 1], and its end slopes.
function profile(arr, u) {
  const n = arr.length - 1;
  const x = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const p0 = arr[Math.max(i - 1, 0)], p1 = arr[i], p2 = arr[i + 1], p3 = arr[Math.min(i + 2, n)];
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
}
const startSlope = (arr) => (arr[1] - arr[0]) * (arr.length - 1);
const endSlope = (arr) => (arr[arr.length - 1] - arr[arr.length - 2]) * (arr.length - 1);

// Ankle position (z forward, y up) and foot pitch (toes-up positive) during stance, u ∈ [0,1].
function stanceFoot(u, info, d) {
  const zf = info.stride * (info.ahead - info.beta * u); // flat-foot ankle; moves back at ground speed
  const ha = d.ankleHeight;
  let pitch = 0;
  if (u < 0.12) pitch = HEEL_STRIKE_PITCH * (1 - smoothstep(u / 0.12));
  else if (u > HEEL_RISE_START) pitch = -TOE_OFF_PITCH * ((u - HEEL_RISE_START) / (1 - HEEL_RISE_START)) ** HEEL_RISE_POW;
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

// Swing: the mocap's normalized foot path, stretched from toe-off to the next heel strike. The foot
// leaves fast, the ankle peaks early (~25% of swing), and the leg reaches slightly past the landing
// spot before pulling back to strike. Foot pitch follows clinical data instead of the mocap, which
// keeps the toes pointed down until mid-swing (after a full 55° push-off that drags them on the floor).
// Short correction terms (slope 1 at their own end, zero elsewhere) match the stance foot's velocity
// at both ends, so the foot never hitches.
const SW = MOCAP_GAIT.swing;
// Foot pitch through swing, 1 = toe-off pitch → 0 = heel-strike pitch (sampled uniformly over u).
const SWING_PITCH = [1, 0.83, 0.7, 0.6, 0.5, 0.41, 0.33, 0.27, 0.21, 0.16, 0.11, 0.06, 0];
function swingFoot(u, info, d) {
  const { a, b, va, vb } = info.swing;
  const h10 = u * (1 - u) ** 4, h11 = u ** 4 * (u - 1);
  const dz = b.z - a.z, dp = a.pitch - b.pitch, dy = b.y - a.y, L = info.lift;
  // The mocap's foot slides, so it leaves the ground closer under the hips than a planted foot can;
  // its forward travel is time-warped to make up that ground early in swing.
  const uz = 1 - (1 - u) ** SWING_WARP, dUz0 = SWING_WARP;
  const z = a.z + dz * profile(SW.z, uz)
    + h10 * (va.z - dz * dUz0 * startSlope(SW.z)) + h11 * (vb.z);
  const pitch = b.pitch + dp * profile(SWING_PITCH, u)
    + u * (1 - u) ** 10 * (va.pitch - dp * startSlope(SWING_PITCH))   // roll is spent quickly after toe-off
    + h11 * (vb.pitch - dp * endSlope(SWING_PITCH));
  let y = a.y + dy * u + L * profile(SW.lift, u)
    + h10 * (va.y - dy - L * startSlope(SW.lift)) + h11 * (vb.y - dy - L * endSlope(SW.lift));
  // Keep the toes off the ground while the foot passes under the body (smooth max, zero at the ends).
  const toe = y + (d.footLen - d.heelDist) * Math.sin(pitch) - d.ankleHeight * Math.cos(pitch);
  const bump = Math.sin(Math.PI * u), deficit = info.toeClear * bump - toe;
  y += bump * 0.5 * (deficit + Math.hypot(deficit, 0.004));
  return { z, y, pitch };
}

// Height of the ball of the foot above the ground for an ankle position + pitch.
function ballHeight(foot, d) {
  return foot.y + d.ballDist * Math.sin(foot.pitch) - d.ankleHeight * Math.cos(foot.pitch);
}

// The same ball-of-foot contact with the foot rolled to pitch `th` (heel further up).
function rolledTo(foot, th, d) {
  const ha = d.ankleHeight, bd = d.ballDist;
  const ballZ = foot.z + bd * Math.cos(foot.pitch) + ha * Math.sin(foot.pitch);
  const ballY = foot.y + bd * Math.sin(foot.pitch) - ha * Math.cos(foot.pitch);
  return { z: ballZ - bd * Math.cos(th) - ha * Math.sin(th), y: ballY - bd * Math.sin(th) + ha * Math.cos(th), pitch: th };
}

// If the trailing ankle is out of the leg's reach, roll further onto the ball of the foot (heel
// lifts earlier and higher) until it isn't — what real walkers do instead of crouching.
function rollToReach(foot, x, hip, reach, d) {
  const dist = (f) => Math.hypot(x - hip[0], f.y - hip[1], f.z - hip[2]);
  if (foot.pitch > 0 || foot.z > hip[2] || dist(foot) <= reach) return foot;
  // Rolling up brings the ankle closer only until the foot is near vertical, so search above that.
  let lo = Math.min(foot.pitch, -MAX_ROLL), hi = foot.pitch;
  if (dist(rolledTo(foot, lo, d)) > reach) return rolledTo(foot, lo, d);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (dist(rolledTo(foot, mid, d)) > reach) hi = mid; else lo = mid;
  }
  return rolledTo(foot, lo, d);
}

// A swing foot reaching further than the leg can stretch stops short (along the hip→ankle line).
function reachToward(foot, x, hip, reach) {
  const dy = foot.y - hip[1], dz = foot.z - hip[2], dx = x - hip[0];
  const dist = Math.hypot(dx, dy, dz);
  if (dist <= reach) return foot;
  const lat = Math.sqrt(Math.max(reach * reach - dx * dx, 0)) / Math.hypot(dy, dz);
  return { ...foot, y: hip[1] + dy * lat, z: hip[2] + dz * lat };
}

export function footAt(legPhase, info, d) {
  return legPhase < info.beta
    ? stanceFoot(legPhase / info.beta, info, d)
    : swingFoot((legPhase - info.beta) / (1 - info.beta), info, d);
}

export function poseAt(p, d, phase, info = gaitInfo(p, d)) {
  const rot = {};
  const pos = {};
  const c2 = Math.cos(2 * TAU * phase);

  // Pelvis: rotation from the parameters, height from the legs (see pelvisHeights)
  const { sway, yaw, obliq, tilt, qP } = pelvisMotion(p, phase);
  const pelvisY = pelvisYAt(info, phase);
  rot.pelvis = [tilt, yaw, obliq];
  pos.pelvis = [sway, pelvisY - d.legM, 0];
  const qPinv = qConj(qP);
  const pelvisW = [sway, pelvisY, 0];

  // Legs: place the ankle, then solve IK in the pelvis frame
  const feet = {};
  const reach = ROLL_REACH * (d.thigh + d.shin);
  for (const [side, sgn, offset] of [['L', 1, 0], ['R', -1, 0.5]]) {
    const hip = vAdd(pelvisW, qRotate(qP, [sgn * d.hipHalf, 0, 0]));
    const legPhase = (phase + offset) % 1;
    let foot = rollToReach(footAt(legPhase, info, d), sgn * d.stepHalfWidth, hip, reach, d);
    if (legPhase >= info.beta) foot = reachToward(foot, sgn * d.stepHalfWidth, hip, reach);
    feet[side] = foot;
    const ankle = [sgn * d.stepHalfWidth, foot.y, foot.z];
    const leg = solveTwoBone(qRotate(qPinv, vSub(ankle, hip)), d.thigh, d.shin);
    rot[`thigh_${side}`] = [leg.x, 0, leg.abd];
    rot[`shin_${side}`] = [leg.knee, 0, 0];
    rot[`foot_${side}`] = [-foot.pitch - (tilt + leg.x + leg.knee), -yaw + sgn * TOE_OUT, -(obliq + leg.abd)];
    // Toes stay flat on the ground while the heel rolls up (toe break at the ball of the foot).
    const grounded = clamp(1 - ballHeight(foot, d) / 0.08, 0, 1);   // eases back to straight as the foot lifts
    rot[`toes_${side}`] = [Math.min(0, foot.pitch) * grounded, 0, 0];
  }

  // Trunk: counter-rotate so the chest twists against the pelvis and the head stays level
  const lean = clamp(3 + 2 * (info.speed - 1.2), 0, 8) * DEG;
  rot.spine = [-0.85 * tilt + 0.5 * lean, -0.45 * yaw, -0.6 * obliq];
  rot.chest = [0.5 * lean, -0.9 * yaw, -0.3 * obliq];
  const trunkPitch = 0.15 * tilt + lean;
  rot.neck = [-0.5 * trunkPitch, 0.15 * yaw, -0.05 * obliq];
  rot.head = [-0.5 * trunkPitch - 1.2 * DEG * c2, 0.2 * yaw, -0.05 * obliq];

  // Arms swing opposite the same-side leg, further back than forward, and the elbow bends more as
  // the arm comes forward (as in the mocap: shoulder ≈ -22…+10°, elbow ≈ 20…38°).
  const armPhase = Math.cos(TAU * phase);
  for (const [side, sgn] of [['L', 1], ['R', -1]]) {
    const swing = -sgn * armPhase;                 // -1 … 1, forward positive
    const fwd = info.armAmp * (swing - 0.35);
    rot[`upperArm_${side}`] = [-fwd - trunkPitch, 0, sgn * 8 * DEG];
    rot[`forearm_${side}`] = [-(20 * DEG + 0.55 * info.armAmp * (swing + 1)), 0, 0];
    rot[`hand_${side}`] = [-8 * DEG, sgn * 10 * DEG, 0];
    // Shoulder girdle: rolls forward with the arm and rises slightly each step.
    pos[`upperArm_${side}`] = [0, 0.004 * d.H * Math.cos(2 * TAU * (phase - 0.1)), 0.012 * d.H * swing];
  }

  return { rot, pos, feet };
}
