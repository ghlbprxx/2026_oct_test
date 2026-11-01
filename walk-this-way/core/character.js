// Per-character simulation: gait phase, travel distance, overlap and jiggle springs.
import { computeBody } from './body.js';
import { gaitInfo, poseAt } from './gait.js';
import { buildSkeleton, forwardKinematics, pointSpec, pointWorld } from './skeleton.js';
import { vSub, vScale, vLen, qRotate, qConj } from './math3.js';
import {
  createLinearSpring, stepLinearSpring, createAngularSpring, stepAngularSpring,
} from './springs.js';

const JIGGLE = [
  // [tissue bone, spring config / tissue key, parent bone]
  ['belly', 'belly', 'spine'],
  ['chestSoft_L', 'chest', 'chest'], ['chestSoft_R', 'chest', 'chest'],
  ['glute_L', 'glute', 'pelvis'], ['glute_R', 'glute', 'pelvis'],
  ['thighFat_L', 'thigh', 'thigh_L'], ['thighFat_R', 'thigh', 'thigh_R'],
  ['armFat_L', 'arm', 'upperArm_L'], ['armFat_R', 'arm', 'upperArm_R'],
  ['cheek_L', 'cheek', 'head'], ['cheek_R', 'cheek', 'head'],
  ['hairTail', 'hair', 'head'],
];
const OVERLAP = [
  // [bone, euler index, spring config key]
  ['upperArm_L', 0, 'upperArm'], ['upperArm_R', 0, 'upperArm'],
  ['forearm_L', 0, 'forearm'], ['forearm_R', 0, 'forearm'],
  ['hand_L', 0, 'hand'], ['hand_R', 0, 'hand'],
  ['chest', 2, 'chestRoll'],
];
const ACCEL_POINTS = ['neck'];

// Everything derived from one parameter set.
export function createBody(params) {
  const p = { ...params };
  const dims = computeBody(p);
  return { params: p, dims, info: gaitInfo(p, dims), skeleton: buildSkeleton(dims) };
}

let nextSeed = 1;

export function createCharacterSim(seed = nextSeed++) {
  return {
    seed,
    time: 0,       // sim seconds, for breathing and idle variation
    phase: 0,
    cycles: 0,     // total strides walked (never wraps); used for trail timing
    distance: 0,
    pose: null,
    jiggle: Object.fromEntries(JIGGLE.map(([n]) => [n, createLinearSpring()])),
    overlap: Object.fromEntries(OVERLAP.map(([b, i]) => [`${b}.${i}`, createAngularSpring()])),
    headPitch: createAngularSpring(),
    headRoll: createAngularSpring(),
    track: {},
    trail: [],     // [{ cycles, distance, pts: [[x,y,z] per trail point] }], oldest first
  };
}

export function resetCharacterSim(sim, body) {
  Object.assign(sim, createCharacterSim(sim.seed));
  sim.pose = poseAt(body.params, body.dims, 0, body.info);
}

// Finite-difference acceleration of a world point, clamped.
function accelOf(sim, key, p, dt, maxAccel) {
  const prev = sim.track[key];
  if (!prev) { sim.track[key] = { p, v: null }; return [0, 0, 0]; }
  const v = vScale(vSub(p, prev.p), 1 / dt);
  let a = prev.v ? vScale(vSub(v, prev.v), 1 / dt) : [0, 0, 0];
  const len = vLen(a);
  if (len > maxAccel) a = vScale(a, maxAccel / len);
  sim.track[key] = { p, v };
  return a;
}

const TRAIL_SAMPLES_PER_CYCLE = 90;
const DEG = Math.PI / 180;

// Smooth pseudo-random wiggle in [-1, 1], different per character seed and channel.
function wiggle(t, seed, channel) {
  const a = seed * 12.9898 + channel * 78.233;
  return 0.6 * Math.sin(t * (0.53 + 0.11 * channel) + a) + 0.4 * Math.sin(t * (1.31 + 0.07 * channel) + 1.7 * a);
}

// Spring settings for one tissue region: more tissue = more travel, softer tissue = lower stiffness.
function tissueSpring(base, amount, fatF) {
  const soft = 1 - 0.35 * Math.max(-1, Math.min(1.2, fatF));
  return { k: base.k * soft, c: base.c, gain: base.gain * amount ** 1.5, max: base.max * Math.max(amount, 0.3) };
}

// Things that make a walk look alive but are not part of the matched gait (not scored):
// breathing, small head turns and nods, and stride-to-stride arm-swing variation.
function addLiveliness(pose, sim, d) {
  const t = sim.time;
  const breath = Math.sin(t * Math.PI * 2 * 0.25);
  pose.rot.chest[0] += 0.6 * DEG * breath;
  pose.rot.head[1] += 3 * DEG * wiggle(t * 0.35, sim.seed, 1);
  pose.rot.head[0] += 1.5 * DEG * wiggle(t * 0.45, sim.seed, 2);
  const armVar = 1 + 0.1 * wiggle(t * 0.6, sim.seed, 3);
  for (const s of ['L', 'R']) pose.rot[`upperArm_${s}`][0] *= armVar;
  return 0.004 * d.H * breath; // chest/belly rise, added to the tissue bones
}

// Advances phase by dt, then computes the pose with secondary motion applied.
// trailCfg (optional) = { cycles, points: [[name, side]] } records motion-trail history.
export function stepCharacterSim(sim, body, dt, springCfg, trailCfg = null) {
  sim.time += dt;
  sim.phase = (sim.phase + body.info.f * dt) % 1;
  sim.cycles += body.info.f * dt;
  sim.distance += body.info.speed * dt;

  const pose = poseAt(body.params, body.dims, sim.phase, body.info);
  const breath = addLiveliness(pose, sim, body.dims);
  const world = forwardKinematics(body.skeleton, pose);
  const acc = {};
  for (const k of ACCEL_POINTS) acc[k] = accelOf(sim, k, world[k].p, dt, springCfg.maxAccel);
  // Each tissue bone is driven by the acceleration of its own rest anchor (includes limb rotation).
  for (const [node] of JIGGLE) acc[node] = accelOf(sim, node, world[node].p, dt, springCfg.maxAccel);

  // Overlap: joints chase their gait targets with lag.
  for (const [bone, i, key] of OVERLAP) {
    const r = pose.rot[bone];
    r[i] = stepAngularSpring(sim.overlap[`${bone}.${i}`], r[i], springCfg[key], dt);
  }
  // Head nods against vertical acceleration and rolls against lateral acceleration.
  const hc = springCfg.head;
  pose.rot.head[0] = stepAngularSpring(sim.headPitch, pose.rot.head[0], hc, dt, -hc.accelGain * acc.neck[1]);
  pose.rot.head[2] = stepAngularSpring(sim.headRoll, pose.rot.head[2], hc, dt, hc.accelGain * acc.neck[0]);

  // Jiggle: springs driven by the parent's acceleration, expressed in the parent frame.
  const { tissue, fatF } = body.dims;
  for (const [node, key, parent] of JIGGLE) {
    const local = qRotate(qConj(world[parent].q), acc[node]);
    const d = stepLinearSpring(sim.jiggle[node], local, tissueSpring(springCfg[key], tissue[key], fatF), dt).slice();
    if (node === 'belly' || node.startsWith('chestSoft')) d[2] += breath * (node === 'belly' ? 0.6 : 1);
    pose.pos[node] = d;
  }

  if (trailCfg) recordTrail(sim, body, pose, trailCfg);
  sim.pose = pose;
  return pose;
}

// Samples trail points from the final pose at a fixed density per stride, independent of frame rate.
function recordTrail(sim, body, pose, trailCfg) {
  const last = sim.trail[sim.trail.length - 1];
  if (!last || sim.cycles - last.cycles >= 1 / TRAIL_SAMPLES_PER_CYCLE) {
    const world = forwardKinematics(body.skeleton, pose);
    const pts = trailCfg.points.map(([name]) => pointWorld(world, pointSpec(name, body.dims)));
    sim.trail.push({ cycles: sim.cycles, distance: sim.distance, pts });
  }
  while (sim.trail.length && sim.trail[0].cycles < sim.cycles - trailCfg.cycles) sim.trail.shift();
}
