// Learns gait shape from the "walking test" animation and writes data/mocapGait.js.
//   node tools/extract-mocap-gait.mjs [assets/walking_test/walking_test.glb]
// No dependencies: parses the .glb, evaluates the clip's bone transforms (forward kinematics),
// finds left heel strike / toe-off, and samples:
//   - normalized swing-foot profiles (forward travel, lift, pitch) that core/gait.js follows, and
//   - reference joint-angle curves + summary numbers, used by the tests and the README.
import fs from 'node:fs';

const src = process.argv[2] || 'assets/walking_test/walking_test.glb';
const out = process.argv[3] || 'data/mocapGait.js';

// ── glb + accessors ────────────────────────────────────────────
const file = fs.readFileSync(src);
const jsonLen = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLen).toString('utf8'));
const binStart = 20 + jsonLen + 8;
const COMP = { 5126: [Float32Array, 4], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5120: [Int8Array, 1], 5121: [Uint8Array, 1] };
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function accessor(i) {
  const a = gltf.accessors[i];
  const bv = gltf.bufferViews[a.bufferView];
  const [T, bytes] = COMP[a.componentType];
  const n = SIZE[a.type];
  const stride = bv.byteStride || bytes * n;
  const base = binStart + (bv.byteOffset || 0) + (a.byteOffset || 0);
  const dv = new DataView(file.buffer, file.byteOffset);
  const read = { 5126: 'getFloat32', 5122: 'getInt16', 5123: 'getUint16', 5120: 'getInt8', 5121: 'getUint8' }[a.componentType];
  const norm = { 5122: 32767, 5123: 65535, 5120: 127, 5121: 255 }[a.componentType];
  const res = [];
  for (let k = 0; k < a.count; k++) {
    const v = [];
    for (let c = 0; c < n; c++) {
      let x = dv[read](base + k * stride + c * bytes, true);
      if (a.normalized) x = Math.max(x / norm, -1);
      v.push(x);
    }
    res.push(v);
  }
  return res;
}

// ── math ───────────────────────────────────────────────────────
const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
function qrot(q, v) {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}
function slerp(a, b, u) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) { b = b.map((x) => -x); d = -d; }
  if (d > 0.9995) { const r = a.map((x, i) => x + (b[i] - x) * u); const l = Math.hypot(...r); return r.map((x) => x / l); }
  const th = Math.acos(d), s = Math.sin(th);
  return a.map((x, i) => (Math.sin((1 - u) * th) * x + Math.sin(u * th) * b[i]) / s);
}
// World transforms as {t, q, s} (scale kept uniform-ish; good enough for joint positions).
const compose = (P, L) => ({ t: P.t.map((x, i) => x + qrot(P.q, L.t.map((y, j) => y * P.s[j]))[i]), q: qmul(P.q, L.q), s: P.s.map((x, i) => x * L.s[i]) });
function fromMatrix(m) {   // column-major TRS matrix → {t, q, s}
  const sx = Math.hypot(m[0], m[1], m[2]), sy = Math.hypot(m[4], m[5], m[6]), sz = Math.hypot(m[8], m[9], m[10]);
  const r = [m[0] / sx, m[1] / sx, m[2] / sx, m[4] / sy, m[5] / sy, m[6] / sy, m[8] / sz, m[9] / sz, m[10] / sz];
  // Rotation matrix (columns) → quaternion. Negative scales are folded into a sign flip on Y/Z.
  let [a, b, c, d, e, f, g, h, i] = r; let sgn = [1, 1, 1];
  const det = a * (e * i - f * h) - d * (b * i - c * h) + g * (b * f - c * e);
  if (det < 0) { d = -d; e = -e; f = -f; g = -g; h = -h; i = -i; sgn = [1, -1, -1]; }
  const tr = a + e + i; let q;
  if (tr > 0) { const S = Math.sqrt(tr + 1) * 2; q = [(f - h) / S, (g - c) / S, (b - d) / S, S / 4]; }
  else if (a > e && a > i) { const S = Math.sqrt(1 + a - e - i) * 2; q = [S / 4, (d + b) / S, (g + c) / S, (f - h) / S]; }
  else if (e > i) { const S = Math.sqrt(1 + e - a - i) * 2; q = [(d + b) / S, S / 4, (h + f) / S, (g - c) / S]; }
  else { const S = Math.sqrt(1 + i - a - e) * 2; q = [(g + c) / S, (h + f) / S, S / 4, (b - d) / S]; }
  return { t: [m[12], m[13], m[14]], q, s: [sx * sgn[0], sy * sgn[1], sz * sgn[2]] };
}

// ── animation sampling ─────────────────────────────────────────
const nodes = gltf.nodes;
const parent = {};
nodes.forEach((n, i) => (n.children || []).forEach((c) => { parent[c] = i; }));
const anim = gltf.animations[0];
const tracks = {};
let duration = 0;
for (const ch of anim.channels) {
  const s = anim.samplers[ch.sampler];
  const times = accessor(s.input).map((v) => v[0]);
  let vals = accessor(s.output);
  if (s.interpolation === 'CUBICSPLINE') vals = vals.filter((_, k) => k % 3 === 1);
  tracks[`${ch.target.node}.${ch.target.path}`] = { times, vals, step: s.interpolation === 'STEP' };
  duration = Math.max(duration, times[times.length - 1]);
}
function sample(node, path, t, def) {
  const tr = tracks[`${node}.${path}`];
  if (!tr) return def;
  const { times, vals } = tr;
  if (t <= times[0]) return vals[0];
  if (t >= times[times.length - 1]) return vals[vals.length - 1];
  let k = 0;
  while (times[k + 1] < t) k++;
  const u = tr.step ? 0 : (t - times[k]) / (times[k + 1] - times[k]);
  return path === 'rotation' ? slerp(vals[k], vals[k + 1], u) : vals[k].map((x, i) => x + (vals[k + 1][i] - x) * u);
}
function localOf(i, t) {
  const n = nodes[i];
  if (n.matrix) return fromMatrix(n.matrix);
  return {
    t: sample(i, 'translation', t, n.translation || [0, 0, 0]),
    q: sample(i, 'rotation', t, n.rotation || [0, 0, 0, 1]),
    s: sample(i, 'scale', t, n.scale || [1, 1, 1]),
  };
}
function worldOf(i, t, cache) {
  if (cache[i]) return cache[i];
  const L = localOf(i, t);
  return (cache[i] = parent[i] === undefined ? L : compose(worldOf(parent[i], t, cache), L));
}
const byName = (suffix) => {
  const i = nodes.findIndex((n) => n.name && n.name.replace(/_\d+$/, '').endsWith(suffix));
  if (i < 0) throw new Error(`bone ${suffix} not found`);
  return i;
};
const J = {
  hip: 'Hip', thL: 'L_Thigh', knL: 'L_Calf', anL: 'L_Foot', toL: 'L_ToeBase',
  thR: 'R_Thigh', knR: 'R_Calf', anR: 'R_Foot', toR: 'R_ToeBase',
  shL: 'L_Upperarm', elL: 'L_Forearm', wrL: 'L_Hand', shR: 'R_Upperarm', elR: 'R_Forearm', wrR: 'R_Hand',
  neck: 'NeckTwist01', head: 'Head',
};
const idx = Object.fromEntries(Object.entries(J).map(([k, v]) => [k, byName(`CC_Base_${v}`)]));

const N = 256;
const frames = [];
for (let k = 0; k < N; k++) {
  const cache = {};
  frames.push(Object.fromEntries(Object.entries(idx).map(([k2, i]) => [k2, worldOf(i, (duration * k) / N, cache).t])));
}
const P = (name, k) => frames[((k % N) + N) % N][name];

// ── events (left leg) ──────────────────────────────────────────
const zL = (k) => P('anL', k)[2];
const vz = (k) => ((zL(k + 1) - zL(k - 1)) / 2) * (N / duration);
// Belt speed: median backward ankle speed while the foot is low.
const yMin = Math.min(...frames.map((f) => f.anL[1]));
const lowV = [];
for (let k = 0; k < N; k++) if (P('anL', k)[1] < yMin + 0.012) lowV.push(-vz(k));
lowV.sort((a, b) => a - b);
const belt = lowV[lowV.length >> 1];
let kMax = 0;
for (let k = 1; k < N; k++) if (zL(k) > zL(kMax)) kMax = k;
// Heel strike: after the foot's most forward point, once it is carried back at half belt speed.
let kHS = kMax;
while (vz(kHS) > -0.5 * belt) kHS++;
// Toe-off: the toe leaves the ground (rises 1 cm above its stance minimum) after mid-stance.
const toeY = (k) => P('toL', k)[1];
// The toe base sinks as the heel rolls up, so search from its lowest point.
let kTO = kHS;
for (let k = kHS; k < kHS + N * 0.75; k++) if (toeY(k) < toeY(kTO)) kTO = k;
const toeMin = toeY(kTO);
while (toeY(kTO) < toeMin + 0.01) kTO++;
const beta = (kTO - kHS) / N;

// ── curves, rephased so left heel strike = phase 0 ──────────────
const deg = (r) => (r * 180) / Math.PI;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const sag = (v) => deg(Math.atan2(v[2], -v[1]));
const inner = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.hypot(...a) / Math.hypot(...b)))));
const pitchOf = (k, s) => { const f = sub(P(`to${s}`, k), P(`an${s}`, k)); return deg(Math.atan2(f[1], Math.hypot(f[0], f[2]))); };
// Foot pitch is measured from the ankle→toe-base line; zero it at flat foot (mid-stance).
const flatPitch = pitchOf(kHS + Math.round(beta * N * 0.4), 'L');

const at = (ph) => kHS + Math.round(ph * N);
const curve = (fn, n = 32) => Array.from({ length: n }, (_, i) => +fn(at(i / n)).toFixed(1));
const reference = {
  hipFlexion: curve((k) => sag(sub(P('knL', k), P('thL', k)))),
  kneeFlexion: curve((k) => inner(sub(P('knL', k), P('thL', k)), sub(P('anL', k), P('knL', k)))),
  footPitch: curve((k) => pitchOf(k, 'L') - flatPitch),
  shoulderFlexion: curve((k) => sag(sub(P('elL', k), P('shL', k)))),
  elbowFlexion: curve((k) => inner(sub(P('elL', k), P('shL', k)), sub(P('wrL', k), P('elL', k)))),
  pelvisHeight: curve((k) => (P('hip', k)[1] - P('hip', kHS)[1]) * 100),   // cm relative to heel strike
};

// Swing profiles over u ∈ [0, 1] from toe-off to the next heel strike.
const M = 24;
const swingK = (u) => kTO + Math.round(u * (N - (kTO - kHS)));
const z0 = zL(kTO), z1 = zL(kHS + N);
const y0 = P('anL', kTO)[1], y1 = P('anL', kHS + N)[1];
const p0 = pitchOf(kTO, 'L'), p1 = pitchOf(kHS + N, 'L');
const us = Array.from({ length: M + 1 }, (_, i) => i / M);
const lift = us.map((u) => P('anL', swingK(u))[1] - (y0 + (y1 - y0) * u));
const liftPeak = Math.max(...lift);
const swing = {
  z: us.map((u) => +((zL(swingK(u)) - z0) / (z1 - z0)).toFixed(4)),
  lift: lift.map((v) => +(v / liftPeak).toFixed(4)),
  pitch: us.map((u) => +((pitchOf(swingK(u), 'L') - p1) / (p0 - p1)).toFixed(4)),
};

const legChain = Math.hypot(...sub(P('knL', kHS), P('thL', kHS))) + Math.hypot(...sub(P('anL', kHS), P('knL', kHS)));
const kneeSwing = reference.kneeFlexion.slice(Math.floor(32 * beta));
const summary = {
  cycleSeconds: +duration.toFixed(3),
  cadence: +((2 * 60) / duration).toFixed(1),
  strideLength: +(belt * duration).toFixed(3),
  stanceFraction: +beta.toFixed(3),
  legChain: +legChain.toFixed(3),
  kneeAtHeelStrike: reference.kneeFlexion[0],
  kneeMidStanceMin: Math.min(...reference.kneeFlexion.slice(0, Math.floor(32 * beta))),
  kneePeakSwing: Math.max(...kneeSwing),
  kneePeakSwingPhase: +((reference.kneeFlexion.indexOf(Math.max(...kneeSwing))) / 32).toFixed(3),
  swingLiftPeak: +liftPeak.toFixed(3),
  swingLiftPeakU: us[lift.indexOf(liftPeak)],
  swingOvershoot: +(Math.max(...swing.z) - 1).toFixed(3),
  bobCm: +(Math.max(...reference.pelvisHeight) - Math.min(...reference.pelvisHeight)).toFixed(1),
};

const text = `// GENERATED by tools/extract-mocap-gait.mjs from assets/walking_test (“walking test” by
// Oussama.Lamrani, CC BY 4.0). Do not edit by hand; re-run the tool instead.
//
// Phase 0 = left heel strike. swing.* are sampled at u = i/${M} from toe-off (u = 0) to heel strike (u = 1):
//   z     forward ankle travel, 0 at toe-off → 1 at heel strike (> 1 = reaches past, then pulls back)
//   lift  ankle height above the straight line between toe-off and heel strike, peak = 1
//   pitch foot pitch, 1 = toe-off pitch → 0 = heel-strike pitch (> 1 = keeps pointing the toes)
// reference.* are left-side curves at phase i/32, in degrees (pelvisHeight in cm).

export const MOCAP_GAIT = ${JSON.stringify({ summary, swing, reference }, null, 2).replace(/\[\n\s+([^\]]+?)\n\s+\]/gs, (_, s) => `[${s.replace(/\s+/g, ' ')}]`)};
`;
fs.writeFileSync(out, text);
console.log(summary);
