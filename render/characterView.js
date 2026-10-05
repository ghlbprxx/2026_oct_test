// Procedural human built on the canonical skeleton: tapered, anatomically shaped limbs and
// torso (lathe profiles), realistic head proportions, simple clothing, and optional joint markers.
// Implements the view contract:
//   build(dims) · applyPose(pose) · setPosition(x, z) · setVisible(v) · setOpacity(a) · dispose()
// plus setMarkersVisible(v) for the joint markers.
// A glTF or skinned-mesh view can replace this file by implementing the same contract.
import * as THREE from 'three';
import { buildSkeleton, pointSpec } from '../core/skeleton.js';

// Marker points: [name, side, bone it sits on (or a helper node created in build)].
export const MARKERS = [
  ['headTop', 'C'], ['pelvis', 'C'],
  ['shoulder_L', 'L', 'upperArm_L'], ['shoulder_R', 'R', 'upperArm_R'],
  ['elbow_L', 'L', 'forearm_L'], ['elbow_R', 'R', 'forearm_R'],
  ['hand_L', 'L'], ['hand_R', 'R'],
  ['hip_L', 'L', 'thigh_L'], ['hip_R', 'R', 'thigh_R'],
  ['knee_L', 'L', 'shin_L'], ['knee_R', 'R', 'shin_R'],
  ['ankle_L', 'L', 'foot_L'], ['ankle_R', 'R', 'foot_R'],
  ['toe_L', 'L'], ['toe_R', 'R'],
];

const smooth = (u) => u * u * (3 - 2 * u);

// Radius along a limb from [t, r] keys (t = 0 at the joint, 1 at the far end), eased between keys.
function radiusAt(keys, t) {
  for (let i = 1; i < keys.length; i++) {
    const [ta, ra] = keys[i - 1];
    const [tb, rb] = keys[i];
    if (t <= tb) return ra + (rb - ra) * smooth((t - ta) / (tb - ta || 1));
  }
  return keys[keys.length - 1][1];
}

// Lathe limb hanging along -Y from the joint (or rising along +Y), with rounded ends.
function limbGeometry(len, keys, up = false, segs = 22) {
  const r0 = keys[0][1];
  const r1 = keys[keys.length - 1][1];
  const c0 = r0 * 0.6, c1 = r1 * 0.6;
  const pts = [];
  const CAP = 5, BODY = 18;
  for (let i = 0; i <= CAP; i++) { const a = (i / CAP) * Math.PI / 2; pts.push([r1 * Math.sin(a), -len - c1 * Math.cos(a)]); }
  for (let i = BODY - 1; i >= 1; i--) { const t = i / BODY; pts.push([radiusAt(keys, t), -t * len]); }
  for (let i = 0; i <= CAP; i++) { const a = (i / CAP) * Math.PI / 2; pts.push([r0 * Math.cos(a), c0 * Math.sin(a)]); }
  const v = (up ? pts.map(([x, y]) => [x, -y]).reverse() : pts).map(([x, y]) => new THREE.Vector2(Math.max(x, 1e-4), y));
  return new THREE.LatheGeometry(v, segs);
}

// Torso section from a bottom→top [halfWidth, y] profile, squashed front-to-back.
function torsoGeometry(profile, depth) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), 28);
  g.scale(1, 1, depth);
  return g;
}

export function createCharacterView(scene, { palette, ghost = false, opacity = 1, sideColors = null }) {
  const group = new THREE.Group();
  scene.add(group);
  const materials = makeMaterials(palette, ghost, opacity);
  const markerMats = sideColors ? makeMarkerMaterials(sideColors) : null;
  let bones = {};
  let points = {};
  let markerMeshes = [];
  let skeleton = [];
  let geometries = [];
  let markersVisible = true;

  function clear() {
    for (const g of geometries) g.dispose();
    geometries = [];
    markerMeshes = [];
    group.clear();
    bones = {};
    points = {};
  }

  function mesh(parent, geometry, mat, { pos, rot, scale } = {}) {
    geometries.push(geometry);
    const m = new THREE.Mesh(geometry, typeof mat === 'string' ? materials[mat] : mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scale) m.scale.set(...scale);
    m.castShadow = !ghost;
    if (ghost) m.renderOrder = 10;
    (typeof parent === 'string' ? bones[parent] : parent).add(m);
    return m;
  }
  const sphere = (r, w = 24, h = 16) => new THREE.SphereGeometry(r, w, h);
  // Helper node for a non-bone point, placed exactly where core's pointSpec says.
  function helper(name, d) {
    const [parent, pos] = pointSpec(name, d);
    const o = new THREE.Object3D();
    o.position.set(...pos);
    bones[parent].add(o);
    points[name] = o;
  }

  function build(d) {
    clear();
    skeleton = buildSkeleton(d);
    for (const b of skeleton) {
      const o = new THREE.Object3D();
      o.name = b.name;
      o.rotation.order = 'YXZ';
      o.position.fromArray(b.offset);
      (b.parent ? bones[b.parent] : group).add(o);
      bones[b.name] = o;
    }
    const H = d.H;
    const r = d.radii;
    const hr = d.headR;

    // ── Torso: hips (pelvis bone), abdomen (spine), ribcage (chest) ──
    const pu = d.pelvisUp;
    mesh('pelvis', torsoGeometry([
      [0, -0.07 * H], [0.05 * H, -0.066 * H], [0.08 * H, -0.045 * H], [r.hip, -0.012 * H],
      [r.hip * 0.97, pu * 0.5], [r.spine * 1.02, pu + 0.012 * H], [0, pu + 0.012 * H],
    ], 0.7), 'pants');
    const sl = d.spineLen;
    mesh('spine', torsoGeometry([
      [0, -0.015 * H], [r.spine * 1.0, -0.015 * H], [r.spine * 0.95, sl * 0.45], [r.spine * 1.03, sl], [0, sl + 0.01 * H],
    ], 0.66), 'shirt');
    mesh('belly', sphere(r.spine * 0.62), 'shirt', { scale: [1.15, 0.9, 0.42] });
    const cl = d.chestLen;
    mesh('chest', torsoGeometry([
      [0, -0.012 * H], [r.spine * 1.03, -0.012 * H], [r.chest * 0.98, cl * 0.35], [r.chest, cl * 0.62],
      [r.chest * 0.88, cl * 0.86], [r.neck * 1.6, cl * 1.0], [r.neck * 1.05, cl + 0.012 * H], [0, cl + 0.012 * H],
    ], 0.6), 'shirt');
    mesh('chestSoft', sphere(r.chest * 0.42), 'shirt', { scale: [1.5, 0.75, 0.38] });
    // Trapezius slope from neck to each shoulder.
    for (const x of [1, -1]) {
      const trap = new THREE.CapsuleGeometry(0.024 * H, d.shoulderHalf * 0.8, 6, 12);
      mesh('chest', trap, 'shirt', { pos: [x * d.shoulderHalf * 0.5, cl * 0.92, -0.005 * H], rot: [0, 0, x * (Math.PI / 2 - 0.25)] });
    }

    // ── Neck & head ──
    mesh('neck', limbGeometry(d.neck + hr * 0.35, [[0, r.neck * 1.05], [1, r.neck * 0.9]], true), 'skin');
    const skull = { pos: [0, hr, 0.02 * hr], scale: [0.8, 1.0, 0.93] };
    mesh('head', sphere(hr, 32, 24), 'skin', skull);
    mesh('head', sphere(hr * 0.62, 24, 16), 'skin', { pos: [0, hr * 0.52, hr * 0.28], scale: [1.0, 0.85, 1.0] }); // jaw
    mesh('head', new THREE.SphereGeometry(hr * 1.03, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), 'hair',
      { pos: [0, hr * 1.02, -0.02 * hr], rot: [-0.32, 0, 0], scale: [0.83, 1.0, 0.95] });
    for (const x of [1, -1]) {
      mesh('head', sphere(hr * 0.075, 12, 10), 'eye', { pos: [x * hr * 0.3, hr * 1.06, hr * 0.84] });
      mesh('head', sphere(hr * 0.2, 14, 10), 'skin', { pos: [x * hr * 0.78, hr * 0.98, -0.02 * hr], scale: [0.35, 1.0, 0.7] }); // ears
    }
    mesh('head', sphere(hr * 0.12, 14, 10), 'skin', { pos: [0, hr * 0.92, hr * 0.92], scale: [0.75, 1.25, 1.0] }); // nose
    mesh('cheek_L', sphere(hr * 0.13, 14, 10), 'cheek');
    mesh('cheek_R', sphere(hr * 0.13, 14, 10), 'cheek');
    helper('headTop', d);

    // ── Arms ──
    for (const s of ['L', 'R']) {
      const ua = `upperArm_${s}`;
      mesh(ua, limbGeometry(d.upperArm, [[0, r.upperArm], [0.25, r.upperArm * 0.97], [0.65, r.upperArm * 0.86], [1, r.elbow]]), 'skin');
      // Short sleeve over the shoulder and top of the arm.
      mesh(ua, limbGeometry(d.upperArm * 0.42, [[0, r.upperArm * 1.12], [1, r.upperArm * 1.06]]), 'shirt');
      mesh(`forearm_${s}`, limbGeometry(d.forearm, [[0, r.elbow], [0.22, r.forearm], [1, r.wrist]]), 'skin');
      // Hand: flat mitt (palm faces the body) with a thumb.
      const hl = d.hand;
      mesh(`hand_${s}`, sphere(hl * 0.5, 20, 14), 'skin', { pos: [0, -hl * 0.45, 0.004 * H], scale: [0.36, 1.0, 0.62] });
      mesh(`hand_${s}`, new THREE.CapsuleGeometry(hl * 0.09, hl * 0.3, 4, 8), 'skin',
        { pos: [(s === 'L' ? -1 : 1) * hl * 0.06, -hl * 0.32, hl * 0.22], rot: [0.5, 0, 0] });
    }

    // ── Legs ──
    for (const s of ['L', 'R']) {
      mesh(`thigh_${s}`, limbGeometry(d.thigh, [[0, r.thigh], [0.3, r.thigh * 0.95], [0.75, r.thigh * 0.74], [1, r.knee]]), 'pants');
      mesh(`shin_${s}`, sphere(r.knee * 1.02, 18, 12), 'pants');
      mesh(`shin_${s}`, limbGeometry(d.shin, [[0, r.knee], [0.28, r.calf], [0.78, r.ankle * 1.15], [1, r.ankle]]), 'pants');
      // Shoe: rounded upper + flat sole, heel at -heelDist, toe at footLen - heelDist.
      const f = `foot_${s}`;
      const fl = d.footLen;
      const midZ = fl / 2 - d.heelDist;
      mesh(f, new THREE.CapsuleGeometry(r.foot, Math.max(fl - 2 * r.foot, 0.01), 8, 16), 'shoe',
        { pos: [0, -d.ankleHeight + r.foot * 1.05, midZ], rot: [Math.PI / 2, 0, 0], scale: [1.2, 1, 0.8] });
      mesh(f, new THREE.BoxGeometry(r.foot * 2.3, 0.012 * H, fl * 0.98), 'sole',
        { pos: [0, -d.ankleHeight + 0.006 * H, midZ] });
      mesh(f, sphere(r.ankle * 1.2, 14, 10), 'shoe', { pos: [0, -0.01 * H, -0.01 * H] }); // ankle collar
      helper(`toe_${s}`, d);
    }

    // Marker points that are just bone origins.
    for (const [name, , bone] of MARKERS) if (!points[name]) points[name] = bones[bone || name];

    if (markerMats) {
      const rDot = 0.013 * H;
      const dot = new THREE.SphereGeometry(rDot, 14, 10);
      const ring = new THREE.SphereGeometry(rDot * 1.45, 14, 10);
      geometries.push(dot, ring);
      for (const [name, side] of MARKERS) {
        const o = new THREE.Mesh(ring, markerMats.outline); o.renderOrder = 30;
        const m = new THREE.Mesh(dot, markerMats[side]); m.renderOrder = 31;
        points[name].add(o, m);
        markerMeshes.push(o, m);
      }
      setMarkersVisible(markersVisible);
    }
  }

  function applyPose(pose) {
    for (const b of skeleton) {
      const o = bones[b.name];
      const dp = pose.pos[b.name];
      if (dp) o.position.set(b.offset[0] + dp[0], b.offset[1] + dp[1], b.offset[2] + dp[2]);
      else o.position.fromArray(b.offset);
      const r = pose.rot[b.name];
      if (r) o.rotation.set(r[0], r[1], r[2], 'YXZ');
      else o.rotation.set(0, 0, 0, 'YXZ');
    }
    group.updateMatrixWorld(true);
  }

  function setMarkersVisible(v) {
    markersVisible = v;
    for (const m of markerMeshes) m.visible = v;
  }

  return {
    group,
    build,
    applyPose,
    setMarkersVisible,
    bone: (name) => bones[name],
    setPosition(x, z) { group.position.set(x, 0, z); group.updateMatrixWorld(true); },
    setVisible(v) { group.visible = v; },
    setOpacity(a) { for (const m of Object.values(materials)) m.opacity = a; },
    dispose() {
      clear();
      for (const m of Object.values(materials)) m.dispose();
      scene.remove(group);
    },
  };
}

function makeMaterials(palette, ghost, opacity) {
  if (ghost) {
    const g = new THREE.MeshStandardMaterial({
      color: palette.ghost, roughness: 0.6, transparent: true, opacity, depthWrite: false,
      emissive: palette.ghost, emissiveIntensity: 0.25,
    });
    return Object.fromEntries(['skin', 'shirt', 'pants', 'shoe', 'sole', 'hair', 'eye', 'cheek'].map((k) => [k, g]));
  }
  // Standard (not Physical) materials: the room environment supplies soft realistic shading
  // without sheen/clearcoat shader cost.
  const cloth = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const skin = new THREE.MeshStandardMaterial({ color: palette.skin, roughness: 0.6 });
  return {
    skin,
    cheek: new THREE.MeshStandardMaterial({ color: palette.cheek, roughness: 0.6 }),
    shirt: cloth(palette.shirt),
    pants: cloth(palette.pants),
    shoe: new THREE.MeshStandardMaterial({ color: palette.shoe, roughness: 0.5 }),
    sole: new THREE.MeshStandardMaterial({ color: palette.sole, roughness: 0.8 }),
    hair: new THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.85 }),
    eye: new THREE.MeshStandardMaterial({ color: '#20160f', roughness: 0.2 }),
  };
}

// Markers draw on top of everything so joints stay visible through limbs and the other walker.
function makeMarkerMaterials(sideColors) {
  const flat = (color) => new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true });
  return { L: flat(sideColors.L), R: flat(sideColors.R), C: flat(sideColors.C), outline: flat('#ffffff') };
}
