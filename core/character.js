// Per-character simulation: gait phase, travel distance, overlap and jiggle springs.
import { computeBody } from './body.js';
import { gaitInfo, poseAt } from './gait.js';
import { buildSkeleton, forwardKinematics } from './skeleton.js';
import { vSub, vScale, vLen, qRotate, qConj } from './math3.js';
import {
  createLinearSpring, stepLinearSpring, createAngularSpring, stepAngularSpring,
} from './springs.js';

const JIGGLE = [
  // [node, spring config key, parent bone]
  ['belly', 'belly', 'spine'],
  ['chestSoft', 'chest', 'chest'],
  ['cheek_L', 'cheek', 'head'],
  ['cheek_R', 'cheek', 'head'],
];
const OVERLAP = [
  // [bone, euler index, spring config key]
  ['upperArm_L', 0, 'upperArm'], ['upperArm_R', 0, 'upperArm'],
  ['forearm_L', 0, 'forearm'], ['forearm_R', 0, 'forearm'],
  ['chest', 2, 'chestRoll'],
];
const ACCEL_POINTS = ['neck', 'spine', 'chest', 'head'];

// Everything derived from one parameter set.
export function createBody(params) {
  const p = { ...params };
  const dims = computeBody(p);
  return { params: p, dims, info: gaitInfo(p, dims), skeleton: buildSkeleton(dims) };
}

export function createCharacterSim() {
  return {
    phase: 0,
    distance: 0,
    pose: null,
    jiggle: Object.fromEntries(JIGGLE.map(([n]) => [n, createLinearSpring()])),
    overlap: Object.fromEntries(OVERLAP.map(([b, i]) => [`${b}.${i}`, createAngularSpring()])),
    headPitch: createAngularSpring(),
    headRoll: createAngularSpring(),
    track: {},
  };
}

export function resetCharacterSim(sim, body) {
  Object.assign(sim, createCharacterSim());
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

// Advances phase by dt, then computes the pose with secondary motion applied.
export function stepCharacterSim(sim, body, dt, springCfg) {
  sim.phase = (sim.phase + body.info.f * dt) % 1;
  sim.distance += body.info.speed * dt;

  const pose = poseAt(body.params, body.dims, sim.phase, body.info);
  const world = forwardKinematics(body.skeleton, pose);
  const acc = {};
  for (const k of ACCEL_POINTS) acc[k] = accelOf(sim, k, world[k].p, dt, springCfg.maxAccel);

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
  for (const [node, key, parent] of JIGGLE) {
    const local = qRotate(qConj(world[parent].q), acc[parent]);
    pose.pos[node] = stepLinearSpring(sim.jiggle[node], local, springCfg[key], dt).slice();
  }

  sim.pose = pose;
  return pose;
}
