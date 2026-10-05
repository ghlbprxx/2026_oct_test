// Auto-rigs a static, unrigged human mesh (e.g. a Sketchfab "base mesh" in A- or T-pose) to the
// game's canonical skeleton:
//   1. normalise: bake node transforms, face +Z, feet on y = 0, scale to a nominal height
//   2. find joints from the mesh itself (crotch/hips, arm axis, knees/ankles, toes, head)
//   3. compute skin weights: smooth blends across joints + soft-tissue bones (belly, chest,
//      glutes, thighs, upper arms, cheeks) so core's springs make the flesh bounce
//   4. add clothing (vertex colours) and hair fitted to the head, with a spring-driven ponytail
// Returns bind-pose data that riggedView.js turns into SkinnedMeshes per walker.
import * as THREE from 'three';
import { computeBody } from '../core/body.js';
import { buildSkeleton, forwardKinematics } from '../core/skeleton.js';

const BIND_HEIGHT = 1.7;          // metres; the runtime rescales to each walker's height
const smooth = (u) => { const t = Math.min(1, Math.max(0, u)); return t * t * (3 - 2 * t); };
const DOWN = new THREE.Vector3(0, -1, 0);

export function autoRig(gltf, defaults) {
  // ── 1. Collect meshes with baked transforms ─────────────────────────────────
  gltf.scene.updateMatrixWorld(true);
  const raw = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
    const kind = /eye/i.test(o.name) && !/brow|lash/i.test(o.name) ? 'eye' : /brow|lash/i.test(o.name) ? 'lash' : 'body';
    raw.push({ g, kind });
  });
  const body = raw.find((p) => p.kind === 'body') || raw[0];
  if (!body) throw new Error('model has no mesh');

  // Face +Z: the eyes sit in front of the body's centre.
  const centroid = (g) => { const c = new THREE.Vector3(); g.computeBoundingBox(); return g.boundingBox.getCenter(c); };
  const eye = raw.find((p) => p.kind === 'eye');
  const facesMinusZ = eye ? centroid(eye.g).z < centroid(body.g).z : false;
  const box = new THREE.Box3().setFromBufferAttribute(body.g.attributes.position);
  const scale = BIND_HEIGHT / (box.max.y - box.min.y);
  const norm = new THREE.Matrix4()
    .makeScale(scale, scale, scale)
    .multiply(new THREE.Matrix4().makeRotationY(facesMinusZ ? Math.PI : 0))
    .multiply(new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2));
  for (const p of raw) { p.g.applyMatrix4(norm); if (!p.g.attributes.normal) p.g.computeVertexNormals(); }
  const H = BIND_HEIGHT;
  const pos = body.g.attributes.position;
  const V = (i, out = new THREE.Vector3()) => out.fromBufferAttribute(pos, i);
  const all = [...Array(pos.count).keys()];
  const slice = (y, tol, filter = () => true) => all.filter((i) => Math.abs(pos.getY(i) - y) < tol && filter(i));
  const mean = (ids) => ids.reduce((c, i) => c.add(V(i, new THREE.Vector3())), new THREE.Vector3()).divideScalar(Math.max(ids.length, 1));

  // Re-centre x/z on the torso (arms can be asymmetric).
  const torsoIds = all.filter((i) => pos.getY(i) > 0.6 * H && pos.getY(i) < 0.75 * H && Math.abs(pos.getX(i)) < 0.15 * H);
  const tc = mean(torsoIds);
  for (const p of raw) p.g.translate(-tc.x, 0, -tc.z);

  // ── 2. Landmarks ─────────────────────────────────────────────────────────────
  let crotchY = 0.47 * H;
  for (let y = 0.3 * H; y < 0.6 * H; y += 0.004 * H) {
    if (slice(y, 0.004 * H, (i) => Math.abs(pos.getX(i)) < 0.012 * H).length) { crotchY = y; break; }
  }
  const hipY = crotchY + 0.04 * H;
  const neckBaseY = 0.82 * H;
  const chestHalf = Math.max(...slice(0.74 * H, 0.006 * H, (i) => Math.abs(pos.getX(i)) < 0.2 * H).map((i) => Math.abs(pos.getX(i))));

  // Head: everything above the chin line.
  const headIds = all.filter((i) => pos.getY(i) > 0.875 * H);
  const headBox = new THREE.Box3();
  headIds.forEach((i) => headBox.expandByPoint(V(i)));
  const headC = headBox.getCenter(new THREE.Vector3());
  const headR = headBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  headC.y = Math.min(headC.y, H - headR.y);

  const side = (sgn) => {
    // Arm: principal axis of the arm vertices clear of the torso.
    const armIds = all.filter((i) => sgn * pos.getX(i) > Math.max(0.24 * H, chestHalf + 0.06 * H) && pos.getY(i) > 0.4 * H);
    const m = mean(armIds);
    const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const t = new THREE.Vector3();
    for (const i of armIds) { V(i, t).sub(m); const a = t.toArray(); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cov[r][c] += a[r] * a[c]; }
    let d = new THREE.Vector3(sgn, -1, 0).normalize();
    for (let k = 0; k < 30; k++) {
      const a = d.toArray();
      d = new THREE.Vector3(...cov.map((row) => row[0] * a[0] + row[1] * a[1] + row[2] * a[2])).normalize();
    }
    if (d.x * sgn < 0) d.negate();
    const shoulderX = sgn * Math.max(chestHalf * 0.95, 0.09 * H);
    const shoulder = m.clone().add(d.clone().multiplyScalar((shoulderX - m.x) / d.x));
    let tipT = 0;
    for (const i of armIds) tipT = Math.max(tipT, V(i, t).sub(shoulder).dot(d));
    // Legs: hip from the thigh, ankle from the ankle slice.
    const thigh = mean(slice(crotchY - 0.06 * H, 0.006 * H, (i) => sgn * pos.getX(i) > 0));
    const ankle = mean(slice(0.05 * H, 0.008 * H, (i) => sgn * pos.getX(i) > 0));
    const hip = new THREE.Vector3(thigh.x, hipY, thigh.z * 0.5);
    let toeZ = -Infinity;
    for (const i of all) if (pos.getY(i) < 0.06 * H && sgn * pos.getX(i) > 0) toeZ = Math.max(toeZ, pos.getZ(i));
    return { armDir: d, shoulder, armLen: tipT, hip, ankle, toeZ };
  };
  const L = side(1), R = side(-1);
  const armLen = (L.armLen + R.armLen) / 2;

  // Fit the game's own parameters to the mesh, then build the bind skeleton from them.
  const fit = {
    ...defaults,
    height: H,
    legLength: hipY / H,
    torsoLength: (neckBaseY - hipY) / H,
    armLength: armLen / H,
  };
  const dims = computeBody(fit);
  const skeleton = buildSkeleton(dims);
  const rest = forwardKinematics(skeleton, { rot: {}, pos: {} });
  const bind = {};   // bone → { p: Vector3, q: Quaternion }
  for (const b of skeleton) bind[b.name] = { p: new THREE.Vector3(...rest[b.name].p), q: new THREE.Quaternion() };
  bind.neck.p.set(0, neckBaseY, headC.z - 0.25 * headR.z);
  bind.head.p.set(0, headC.y - headR.y * 0.95, headC.z - 0.1 * headR.z);
  for (const [s, S] of [['L', L], ['R', R]]) {
    const armQ = new THREE.Quaternion().setFromUnitVectors(DOWN, S.armDir);
    const along = (f) => S.shoulder.clone().add(S.armDir.clone().multiplyScalar(f));
    bind[`upperArm_${s}`] = { p: S.shoulder.clone(), q: armQ };
    bind[`forearm_${s}`] = { p: along(dims.upperArm), q: armQ.clone() };
    bind[`hand_${s}`] = { p: along(dims.upperArm + dims.forearm), q: armQ.clone() };
    bind[`armFat_${s}`] = { p: along(dims.upperArm * 0.5).add(new THREE.Vector3(0, 0, -0.012 * H)), q: armQ.clone() };
    const ankle = new THREE.Vector3(S.ankle.x, dims.ankleHeight, S.ankle.z);
    const legDir = ankle.clone().sub(S.hip).normalize();
    const legQ = new THREE.Quaternion().setFromUnitVectors(DOWN, legDir);
    const kneeFrac = dims.thigh / (dims.thigh + dims.shin);
    bind[`thigh_${s}`] = { p: S.hip.clone(), q: legQ };
    bind[`shin_${s}`] = { p: S.hip.clone().lerp(ankle, kneeFrac), q: legQ.clone() };
    bind[`thighFat_${s}`] = { p: S.hip.clone().lerp(ankle, kneeFrac * 0.35), q: legQ.clone() };
    bind[`foot_${s}`] = { p: ankle, q: new THREE.Quaternion() };
    const footLen = S.toeZ - ankle.z;
    bind[`toes_${s}`] = { p: new THREE.Vector3(ankle.x, 0, ankle.z + footLen * 0.62), q: new THREE.Quaternion() };
    bind[`chestSoft_${s}`].p.z = Math.max(bind[`chestSoft_${s}`].p.z, mean(slice(bind[`chestSoft_${s}`].p.y, 0.01 * H, (i) => (s === 'L' ? 1 : -1) * pos.getX(i) > 0.02 * H && Math.abs(pos.getX(i)) < 0.12 * H)).z);
  }
  bind.cheek_L.p.set(headR.x * 0.6, headC.y - headR.y * 0.2, headC.z + headR.z * 0.65);
  bind.cheek_R.p.set(-headR.x * 0.6, headC.y - headR.y * 0.2, headC.z + headR.z * 0.65);
  bind.hairTail.p.set(0, headC.y + headR.y * 0.25, headC.z - headR.z * 1.0);

  const boneIndex = Object.fromEntries(skeleton.map((b, i) => [b.name, i]));
  const legLine = (s) => ({ a: bind[`thigh_${s}`].p, b: bind[`foot_${s}`].p });

  // ── 3. Skin weights ──────────────────────────────────────────────────────────
  const blend = (x, x0, band, before, after) => { const w = smooth((x - (x0 - band)) / (2 * band)); return [[after, w], [before, 1 - w]]; };
  const tissue = (name, radius, maxW, facing = null) => ({ name, at: bind[name].p, radius, maxW, facing });
  const tissues = {
    torso: [tissue('belly', 0.11 * H, 0.7, 0), tissue('chestSoft_L', 0.07 * H, 0.85, 0.4), tissue('chestSoft_R', 0.07 * H, 0.85, -0.4),
      tissue('glute_L', 0.08 * H, 0.75, Math.PI - 0.5), tissue('glute_R', 0.08 * H, 0.75, Math.PI + 0.5)],
    L_leg: [tissue('thighFat_L', 0.1 * H, 0.5), tissue('glute_L', 0.08 * H, 0.6, Math.PI)],
    R_leg: [tissue('thighFat_R', 0.1 * H, 0.5), tissue('glute_R', 0.08 * H, 0.6, Math.PI)],
    L_arm: [tissue('armFat_L', 0.07 * H, 0.5, Math.PI)], R_arm: [tissue('armFat_R', 0.07 * H, 0.5, Math.PI)],
    head: [tissue('cheek_L', 0.45 * headR.x, 0.6), tissue('cheek_R', 0.45 * headR.x, 0.6)],
  };
  const tissueW = (t, v) => {
    const dist = v.distanceTo(t.at);
    if (dist >= t.radius) return 0;
    let dir = 1;
    if (t.facing !== null) {
      const th = Math.atan2(v.x - t.at.x * 0.3, v.z - (t.at.z - 0.05 * H));
      dir = Math.max(0, Math.cos(Math.atan2(Math.sin(th - t.facing), Math.cos(th - t.facing))));
    }
    return t.maxW * smooth(1 - dist / t.radius) * dir;
  };
  const finish = (base, list, v) => {
    const tw = list.map((t) => [t.name, tissueW(t, v)]).filter(([, w]) => w > 1e-3);
    const tSum = Math.min(0.85, tw.reduce((s, [, w]) => s + w, 0));
    const tScale = tw.length ? tSum / tw.reduce((s, [, w]) => s + w, 0) : 0;
    const merged = {};
    for (const [n, w] of base) merged[n] = (merged[n] || 0) + w * (1 - tSum);
    for (const [n, w] of tw) merged[n] = (merged[n] || 0) + w * tScale;
    const top = Object.entries(merged).filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = top.reduce((s, [, w]) => s + w, 0) || 1;
    return top.map(([n, w]) => [boneIndex[n], w / sum]);
  };
  const regionOf = (v) => {
    for (const [s, S] of [['L', L], ['R', R]]) {
      const tArm = v.clone().sub(S.shoulder).dot(S.armDir);
      const off = v.clone().sub(S.shoulder).sub(S.armDir.clone().multiplyScalar(tArm)).length();
      const reach = 0.07 * H + Math.max(0, 0.03 * H - tArm) * 0.6;
      if (tArm > -0.015 * H && off < reach && (s === 'L' ? v.x : -v.x) > chestHalf * 0.75 && v.y > hipY) return { r: 'arm', s, t: tArm };
    }
    if (v.y > neckBaseY - 0.01 * H) return { r: 'head' };
    if (v.y < hipY + 0.02 * H) {
      const s = v.x >= 0 ? 'L' : 'R';
      const { a, b } = legLine(s);
      const tLeg = v.clone().sub(a).dot(b.clone().sub(a).normalize());
      if (v.y < crotchY + 0.01 * H || Math.abs(v.x) > 0.04 * H) return { r: 'leg', s, t: tLeg };
    }
    return { r: 'torso' };
  };
  const weightsFor = (v) => {
    const reg = regionOf(v);
    if (reg.r === 'arm') {
      const s = reg.s, t = reg.t;
      let base;
      if (t < dims.upperArm * 0.5) base = blend(t, 0.02 * H, 0.035 * H, 'chest', `upperArm_${s}`);
      else if (t < dims.upperArm + dims.forearm * 0.5) base = blend(t, dims.upperArm, 0.03 * H, `upperArm_${s}`, `forearm_${s}`);
      else base = blend(t, dims.upperArm + dims.forearm, 0.015 * H, `forearm_${s}`, `hand_${s}`);
      return { w: finish(base, tissues[`${s}_arm`], v), reg };
    }
    if (reg.r === 'leg') {
      const s = reg.s, t = reg.t;
      const legLen = legLine(s).a.distanceTo(legLine(s).b);
      const kneeT = legLen * dims.thigh / (dims.thigh + dims.shin);
      let base;
      if (v.y < 0.07 * H) {
        base = v.y > dims.ankleHeight + 0.01 * H ? blend(v.y, dims.ankleHeight + 0.02 * H, 0.015 * H, `foot_${s}`, `shin_${s}`) : [[`foot_${s}`, 1]];
        if (v.z > bind[`toes_${s}`].p.z - 0.01 * H) base = blend(v.z, bind[`toes_${s}`].p.z, 0.012 * H, `foot_${s}`, `toes_${s}`);
      } else if (t < kneeT * 0.6) {
        base = [[`thigh_${s}`, 1]];
        const toPelvis = 0.55 * smooth((v.y - (hipY - 0.075 * H)) / (0.1 * H));
        if (toPelvis > 0) base = [[`thigh_${s}`, 1 - toPelvis], ['pelvis', toPelvis]];
      } else base = blend(t, kneeT, 0.035 * H, `thigh_${s}`, `shin_${s}`);
      return { w: finish(base, tissues[`${s}_leg`], v), reg };
    }
    if (reg.r === 'head') {
      const headY = bind.head.p.y;
      const base = v.y < (neckBaseY + headY) / 2
        ? blend(v.y, neckBaseY, 0.012 * H, 'chest', 'neck')   // same transition the torso ends with
        : blend(v.y, headY, 0.02 * H, 'neck', 'head');
      return { w: finish(base, tissues.head, v), reg };
    }
    const sY = bind.spine.p.y, cY = bind.chest.p.y;
    let base;
    if (v.y < (sY + cY) / 2) base = blend(v.y, sY - 0.01 * H, 0.03 * H, 'pelvis', 'spine');
    else if (v.y < (cY + neckBaseY) / 2) base = blend(v.y, cY, 0.035 * H, 'spine', 'chest');
    else base = blend(v.y, neckBaseY, 0.015 * H, 'chest', 'neck');
    return { w: finish(base, tissues.torso, v), reg };
  };

  const waistY = bind.spine.p.y + dims.spineLen * 0.2;
  const parts = [];
  const v = new THREE.Vector3();
  for (const p of raw) {
    const n = p.g.attributes.position.count;
    const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
    // Clothing as signed distance-like fields (metres), thresholded per pixel for crisp hems:
    //   x: above the waistband   y: below the neckline   z: inside the sleeve   w: inside the shorts leg
    const cloth = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(p.g.attributes.position, i);
      let w, reg;
      if (p.kind === 'body') ({ w, reg } = weightsFor(v));
      else { w = [[boneIndex.head, 1]]; reg = { r: 'face' }; }
      w.forEach(([b, x], k) => { skinIndex[i * 4 + k] = b; skinWeight[i * 4 + k] = x; });
      if (p.kind === 'body') {
        cloth[i * 4] = v.y - waistY;
        cloth[i * 4 + 1] = neckBaseY - 0.012 * H - v.y;
        cloth[i * 4 + 2] = reg.r === 'arm' ? dims.upperArm * 0.38 - reg.t : 1;
        cloth[i * 4 + 3] = reg.r === 'leg' ? dims.thigh * 0.45 - reg.t : reg.r === 'torso' ? 1 : -1;
      }
    }
    p.g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
    p.g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
    if (p.kind === 'body') p.g.setAttribute('cloth', new THREE.Float32BufferAttribute(cloth, 4));
    parts.push({ geometry: p.g, kind: p.kind });
  }

  // ── 4. Hair fitted to the head: cap (head bone) + ponytail (spring bone) ─────
  const cap = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
  cap.rotateX(-0.42);
  cap.scale(headR.x * 1.07, headR.y * 1.05, headR.z * 1.08);
  cap.translate(headC.x, headC.y + headR.y * 0.04, headC.z - headR.z * 0.04);
  const tail = new THREE.CapsuleGeometry(headR.x * 0.3, headR.y * 0.9, 8, 14);
  tail.rotateX(0.2);
  tail.translate(0, -headR.y * 0.45, -headR.z * 0.15);
  const tie = new THREE.SphereGeometry(headR.x * 0.34, 16, 12);
  const tailGeo = mergeSimple([tail, tie]);
  tailGeo.translate(bind.hairTail.p.x, bind.hairTail.p.y, bind.hairTail.p.z);
  for (const [g, bone] of [[cap, 'head'], [tailGeo, 'hairTail']]) {
    const n = g.attributes.position.count;
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).map((_, k) => (k % 4 === 0 ? boneIndex[bone] : 0)), 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, k) => (k % 4 === 0 ? 1 : 0)), 4));
    parts.push({ geometry: g, kind: 'hair' });
  }

  return { H, skeleton, bind, parts, dims };
}

function mergeSimple(geos) {
  const pos = [], nor = [], idx = [];
  let off = 0;
  for (const g of geos) {
    const gi = g.index ? g : g.toNonIndexed();
    pos.push(...gi.attributes.position.array);
    nor.push(...gi.attributes.normal.array);
    const ids = gi.index ? gi.index.array : [...Array(gi.attributes.position.count).keys()];
    for (const i of ids) idx.push(i + off);
    off += gi.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}
