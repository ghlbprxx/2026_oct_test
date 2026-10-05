// Procedural skinned body. Builds one continuous skin (torso, legs, arms, neck, head) in the bind
// pose (all joint rotations zero: limbs hang straight, so every part is a vertical tube), with:
//   • smooth skin weights that blend across joints (knees, hips, elbows, shoulders, waist twist)
//   • partial weights to soft-tissue bones (belly, chest, glutes, thighs, upper arms, cheeks), so
//     when core's springs move those bones the surrounding flesh bounces
//   • sex- and body-fat-dependent shape, and per-vertex clothing colors.
import * as THREE from 'three';
import { forwardKinematics } from '../core/skeleton.js';

const TAU = Math.PI * 2;
const smooth = (u) => { const t = Math.min(1, Math.max(0, u)); return t * t * (3 - 2 * t); };
const gauss = (x, s) => Math.exp(-(x * x) / (2 * s * s));
const angDist = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// Eased interpolation through [y, value] keys (any order of y).
function curve(keys, y) {
  const k = [...keys].sort((a, b) => a[0] - b[0]);
  if (y <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (y <= k[i][0]) {
      const [y0, v0] = k[i - 1];
      const [y1, v1] = k[i];
      return v0 + (v1 - v0) * smooth((y - y0) / (y1 - y0 || 1));
    }
  }
  return k[k.length - 1][1];
}

// Vertical tube from yTop down to yBot with rounded/closed ends.
// shape(y) → { cx, cz, w, d } (half-width, half-depth); bump(y, θ) → radial fraction;
// θ = 0 faces +Z (front), increasing toward +X (character's left).
function tube({ yTop, yBot, rings, segs, shape, bump = () => 0, capTop = 0, capBot = 0, weights, color }) {
  const levels = [];
  const CAP = 6;
  for (let k = 0; k < CAP && capTop > 0; k++) {
    const a = (k / CAP) * Math.PI / 2;
    levels.push({ y: yTop + capTop * Math.cos(a), base: yTop, s: Math.sin(a) });
  }
  for (let i = 0; i <= rings; i++) {
    const y = yTop + ((yBot - yTop) * i) / rings;
    levels.push({ y, base: y, s: 1 });
  }
  for (let k = CAP - 1; k >= 0 && capBot > 0; k--) {
    const a = (k / CAP) * Math.PI / 2;
    levels.push({ y: yBot - capBot * Math.cos(a), base: yBot, s: Math.sin(a) });
  }

  const pos = [], col = [], wts = [], index = [];
  const push = (p, theta, base) => {
    pos.push(...p);
    col.push(...color(base, theta, p));
    wts.push(weights(p, base, theta));
  };
  for (const L of levels) {
    const sh = shape(L.base);
    for (let j = 0; j < segs; j++) {
      const th = (j / segs) * TAU;
      const r = 1 + bump(L.base, th);
      push([sh.cx + Math.sin(th) * sh.w * r * L.s, L.y, sh.cz + Math.cos(th) * sh.d * r * L.s], th, L.base);
    }
  }
  const ringCount = levels.length;
  for (let r = 0; r < ringCount - 1; r++) {
    for (let j = 0; j < segs; j++) {
      const a = r * segs + j, b = r * segs + ((j + 1) % segs);
      const c = (r + 1) * segs + j, d = (r + 1) * segs + ((j + 1) % segs);
      index.push(a, c, b, b, c, d);
    }
  }
  // Pole vertices close both ends.
  const top = levels[0], bot = levels[ringCount - 1];
  const shT = shape(top.base), shB = shape(bot.base);
  const iT = pos.length / 3;
  push([shT.cx, top.y + (capTop > 0 ? 0 : 0), shT.cz], 0, top.base);
  const iB = pos.length / 3;
  push([shB.cx, bot.y, shB.cz], 0, bot.base);
  const last = (ringCount - 1) * segs;
  for (let j = 0; j < segs; j++) {
    const j1 = (j + 1) % segs;
    index.push(iT, j, j1);
    index.push(iB, last + j1, last + j);
  }
  return { pos, col, wts, index };
}

export function buildBodyGeometry(d, skeleton, palette) {
  const H = d.H;
  const F = d.sex === 'F';
  const fat = d.fatF;
  const fatPos = Math.max(0, fat);
  const bind = forwardKinematics(skeleton, { rot: {}, pos: {} });
  const P = (n) => bind[n].p;
  const boneIndex = Object.fromEntries(skeleton.map((b, i) => [b.name, i]));
  const C = (hex) => new THREE.Color(hex).toArray();
  const skin = C(palette.skin), shirt = C(palette.shirt), pants = C(palette.pants);

  // Soft-tissue influence: weight falls off with distance from the bone's rest anchor.
  const tissue = (name, radius, maxW, facing = null) => ({ name, at: P(name), radius, maxW, facing });
  const tissueWeight = (t, p, theta) => {
    const dist = Math.hypot(p[0] - t.at[0], p[1] - t.at[1], p[2] - t.at[2]);
    if (dist >= t.radius) return 0;
    const dir = t.facing === null ? 1 : Math.max(0, Math.cos(angDist(theta, t.facing)));
    return t.maxW * smooth(1 - dist / t.radius) * dir;
  };
  // Combine skeletal weights with tissue weights; keep the four largest.
  const mix = (base, tissues, p, theta) => {
    const tw = tissues.map((t) => [t.name, tissueWeight(t, p, theta)]).filter(([, w]) => w > 1e-3);
    const tSum = Math.min(0.9, tw.reduce((s, [, w]) => s + w, 0));
    const scale = tw.length ? tSum / tw.reduce((s, [, w]) => s + w, 0) : 0;
    const all = [...base.map(([n, w]) => [n, w * (1 - tSum)]), ...tw.map(([n, w]) => [n, w * scale])]
      .filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = all.reduce((s, [, w]) => s + w, 0) || 1;
    return all.map(([n, w]) => [boneIndex[n], w / sum]);
  };
  // Two-bone blend across a joint at height yJ over ±band.
  const blend = (y, yJ, band, upper, lower) => {
    const w = smooth((y - (yJ - band)) / (2 * band));
    return [[upper, w], [lower, 1 - w]].filter(([, x]) => x > 0);
  };

  const parts = [];
  const hipY = P('pelvis')[1];
  const spineY = P('spine')[1];
  const chestY = P('chest')[1];
  const neckY = P('neck')[1];
  const headY = P('head')[1];

  // ── Torso ────────────────────────────────────────────────────────────
  {
    const yBot = hipY - 0.078 * H;
    const yTop = neckY + 0.028 * H;   // trapezius rises a little up the neck
    const waistY = spineY + d.spineLen * 0.45;
    const bustY = chestY + d.chestLen * 0.5;
    const shoulderY = neckY - 0.012 * H;
    const hipW = (F ? 0.113 : 0.093) * (1 + (F ? 0.2 : 0.1) * fat);
    const waistW = (F ? 0.067 : 0.079) * (1 + (F ? 0.18 : 0.3) * fat);
    const chestW = (F ? 0.083 : 0.095) * (1 + 0.1 * fat);
    const shoulderW = F ? 0.094 : 0.108;
    const hipD = (F ? 0.078 : 0.068) * (1 + 0.16 * fat);
    const waistD = 0.056 * (1 + (F ? 0.25 : 0.45) * fat);
    const chestD = (F ? 0.06 : 0.068) * (1 + 0.12 * fat);
    const widthKeys = [[yBot, hipW * 0.72], [hipY - 0.025 * H, hipW], [hipY + 0.02 * H, hipW * 0.97], [waistY, waistW],
      [bustY, chestW], [shoulderY, shoulderW], [yTop, 0.036]].map(([y, v]) => [y, v * (v < 1 ? H : 1)]);
    const depthKeys = [[yBot, hipD * 0.75], [hipY - 0.02 * H, hipD], [waistY, waistD], [bustY, chestD],
      [shoulderY, 0.05], [yTop, 0.034]].map(([y, v]) => [y, v * H]);
    const glute = (F ? 0.13 : 0.07) * (1 + 0.45 * fat);
    const belly = Math.max(0, (F ? 0.05 : 0.08) + (F ? 0.12 : 0.24) * fat);
    const bust = F ? 0.34 * (1 + 0.45 * fat) : 0.06;
    const handles = 0.08 * fatPos;
    parts.push(tube({
      yTop, yBot, rings: 46, segs: 36, capBot: 0.02 * H,
      shape: (y) => ({ cx: 0, cz: y > chestY ? 0.004 * H : 0, w: curve(widthKeys, y), d: curve(depthKeys, y) }),
      bump: (y, th) =>
        glute * gauss((y - (hipY - 0.012 * H)) / H, 0.045) * (gauss(angDist(th, Math.PI - 0.5), 0.42) + gauss(angDist(th, Math.PI + 0.5), 0.42))
        + belly * gauss((y - (waistY - 0.012 * H)) / H, 0.05) * gauss(angDist(th, 0), 0.75)
        + handles * gauss((y - waistY) / H, 0.035) * (gauss(angDist(th, TAU / 4), 0.4) + gauss(angDist(th, -TAU / 4), 0.4))
        + bust * gauss((y - (bustY - (F ? 0.012 + 0.008 * fatPos : -0.01) * H)) / H, F ? 0.032 : 0.04)
          * (gauss(angDist(th, 0.42), F ? 0.32 : 0.45) + gauss(angDist(th, -0.42), F ? 0.32 : 0.45)),
      weights: (p, y, th) => {
        // Each transition completes well before the midpoint to the next, so weights stay continuous.
        let base;
        if (y < (spineY + chestY) / 2) base = blend(y, spineY - 0.01 * H, 0.03 * H, 'spine', 'pelvis');
        else if (y < (chestY + neckY) / 2) base = blend(y, chestY, 0.035 * H, 'chest', 'spine');
        else base = blend(y, neckY + 0.005 * H, 0.015 * H, 'neck', 'chest');
        return mix(base, [
          tissue('belly', 0.11 * H, 0.75, 0),
          tissue('chestSoft_L', 0.065 * H, 0.85, 0.42), tissue('chestSoft_R', 0.065 * H, 0.85, -0.42),
          tissue('glute_L', 0.075 * H, 0.8, Math.PI - 0.5), tissue('glute_R', 0.075 * H, 0.8, Math.PI + 0.5),
        ], p, th);
      },
      color: (y) => (y < spineY + d.spineLen * 0.15 ? pants : shirt),
    }));
  }

  // ── Legs ─────────────────────────────────────────────────────────────
  for (const s of ['L', 'R']) {
    const x = P(`thigh_${s}`)[0];
    const kneeY = P(`shin_${s}`)[1];
    const ankleY = P(`foot_${s}`)[1];
    const r = d.radii;
    const thighR = r.thigh * (1 + (F ? 0.26 : 0.12) * fat + (F ? 0.08 : 0));
    const calfR = r.calf * (1 + 0.1 * fat);
    const keys = [[hipY + 0.03 * H, thighR * 0.92], [hipY - 0.03 * H, thighR], [kneeY + d.thigh * 0.35, thighR * 0.84],
      [kneeY + 0.05 * H, r.knee * 1.05], [kneeY, r.knee], [kneeY - d.shin * 0.28, calfR], [ankleY + d.shin * 0.15, r.ankle * 1.15],
      [ankleY, r.ankle]];
    parts.push(tube({
      yTop: hipY + 0.03 * H, yBot: ankleY - 0.004 * H, rings: 40, segs: 24, capTop: 0.03 * H, capBot: 0.012 * H,
      shape: (y) => ({ cx: x, cz: 0, w: curve(keys, y), d: curve(keys, y) }),
      bump: (y, th) => 0.09 * gauss((y - (kneeY - d.shin * 0.3)) / H, 0.05) * gauss(angDist(th, Math.PI), 0.9),
      weights: (p, y, th) => {
        let base = blend(y, kneeY, 0.035 * H, `thigh_${s}`, `shin_${s}`);
        const toPelvis = 0.55 * smooth((y - (hipY - 0.075 * H)) / (0.1 * H));
        if (toPelvis > 0) base = [...base.map(([n, w]) => [n, w * (1 - toPelvis)]), ['pelvis', toPelvis]];
        return mix(base, [
          tissue(`thighFat_${s}`, 0.1 * H, 0.55),
          tissue(`glute_${s}`, 0.07 * H, 0.6, Math.PI),
        ], p, th);
      },
      color: () => pants,
    }));
  }

  // ── Arms ─────────────────────────────────────────────────────────────
  for (const s of ['L', 'R']) {
    const sh = P(`upperArm_${s}`);
    const elbowY = P(`forearm_${s}`)[1];
    const wristY = P(`hand_${s}`)[1];
    const r = d.radii;
    const delt = r.upperArm * (F ? 1.0 : 1.1) * (1 + 0.08 * fat);
    const bicep = r.upperArm * (1 + 0.25 * fat);
    const keys = [[sh[1] + 0.008 * H, delt * 0.8], [sh[1] - 0.015 * H, delt], [sh[1] - d.upperArm * 0.3, bicep],
      [elbowY + 0.03 * H, r.elbow * 1.05], [elbowY, r.elbow], [elbowY - d.forearm * 0.25, r.forearm], [wristY, r.wrist]];
    const sleeveY = sh[1] - d.upperArm * 0.42;
    parts.push(tube({
      yTop: sh[1] + 0.008 * H, yBot: wristY, rings: 34, segs: 20, capTop: 0.02 * H, capBot: 0.008 * H,
      shape: (y) => ({ cx: sh[0], cz: sh[2], w: curve(keys, y), d: curve(keys, y) * 0.95 }),
      weights: (p, y, th) => {
        let base = blend(y, elbowY, 0.03 * H, `upperArm_${s}`, `forearm_${s}`);
        const toChest = 0.5 * smooth((y - (sh[1] - 0.05 * H)) / (0.07 * H));
        if (toChest > 0) base = [...base.map(([n, w]) => [n, w * (1 - toChest)]), ['chest', toChest]];
        return mix(base, [tissue(`armFat_${s}`, 0.08 * H, 0.6, Math.PI)], p, th);
      },
      color: (y) => (y > sleeveY ? shirt : skin),
    }));
  }

  // ── Neck ─────────────────────────────────────────────────────────────
  {
    const yTop = headY + d.headR * 0.4;
    const yBot = neckY - 0.012 * H;
    parts.push(tube({
      yTop, yBot, rings: 10, segs: 20,
      shape: (y) => ({ cx: 0, cz: -0.003 * H, w: curve([[yTop, d.radii.neck * 0.92], [yBot, d.radii.neck * 1.15]], y), d: curve([[yTop, d.radii.neck * 0.95], [yBot, d.radii.neck * 1.1]], y) }),
      weights: (p, y) => mix(y > headY ? blend(y, headY + 0.01 * H, 0.02 * H, 'head', 'neck') : blend(y, neckY, 0.012 * H, 'neck', 'chest'), [], p, 0),
      color: () => skin,
    }));
  }

  // ── Head (ellipsoid with jaw, nose, cheeks; skinned so the cheeks can jiggle) ──
  {
    const hr = d.headR;
    const yc = headY + hr;
    const ry = hr * 1.0;
    const yTop = yc + ry * 0.999, yBot = yc - ry * 0.999;
    const ell = (y) => Math.sqrt(Math.max(0, 1 - ((y - yc) / ry) ** 2));
    const cheek = 0.05 * (1 + 0.6 * fat);
    parts.push(tube({
      yTop, yBot, rings: 30, segs: 32,
      shape: (y) => ({ cx: 0, cz: 0.02 * hr, w: 0.8 * hr * ell(y), d: 0.93 * hr * ell(y) }),
      bump: (y, th) =>
        0.14 * gauss((y - (yc - 0.5 * hr)) / hr, 0.2) * gauss(angDist(th, 0), 0.9)            // jaw / chin
        + 0.16 * gauss((y - (yc - 0.08 * hr)) / hr, 0.1) * gauss(angDist(th, 0), 0.13)       // nose
        + cheek * gauss((y - (yc - 0.18 * hr)) / hr, 0.14) * (gauss(angDist(th, 0.75), 0.35) + gauss(angDist(th, -0.75), 0.35)),
      weights: (p, y, th) => mix([['head', 1]], [
        tissue('cheek_L', 0.4 * hr, 0.6, 0.75), tissue('cheek_R', 0.4 * hr, 0.6, -0.75),
      ], p, th),
      color: () => skin,
    }));
  }

  return mergeParts(parts);
}

function mergeParts(parts) {
  const pos = [], col = [], si = [], sw = [], index = [];
  let offset = 0;
  for (const part of parts) {
    pos.push(...part.pos);
    col.push(...part.col);
    for (const w of part.wts) {
      for (let k = 0; k < 4; k++) { si.push(w[k] ? w[k][0] : 0); sw.push(w[k] ? w[k][1] : 0); }
    }
    for (const i of part.index) index.push(i + offset);
    offset += part.pos.length / 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}
