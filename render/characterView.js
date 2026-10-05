// Procedural human on the canonical skeleton: one continuous skinned body (smooth bends at every
// joint, soft tissue that bounces with core's springs), plus rigid accessories (hands, shoes, hair,
// eyes, ears) and optional joint markers.
// Implements the view contract:
//   build(dims) · applyPose(pose) · setPosition(x, z) · setVisible(v) · setOpacity(a) · dispose()
// plus setMarkersVisible(v) for the joint markers.
// A glTF view can replace this file by implementing the same contract.
import * as THREE from 'three';
import { buildSkeleton, pointSpec } from '../core/skeleton.js';
import { buildBodyGeometry } from './bodyMesh.js';

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

export function createCharacterView(scene, { palette, ghost = false, opacity = 1, sideColors = null }) {
  const group = new THREE.Group();
  scene.add(group);
  const materials = makeMaterials(palette, ghost, opacity);
  const markerMats = sideColors ? makeMarkerMaterials(sideColors) : null;
  let bones = {};
  let points = {};
  let markerMeshes = [];
  let skeleton = [];
  let skinSkeleton = null;
  let geometries = [];
  let markersVisible = true;

  function clear() {
    for (const g of geometries) g.dispose();
    geometries = [];
    markerMeshes = [];
    if (skinSkeleton) skinSkeleton.dispose();
    skinSkeleton = null;
    group.clear();
    bones = {};
    points = {};
  }

  function mesh(parent, geometry, mat, { pos, rot, scale } = {}) {
    geometries.push(geometry);
    const m = new THREE.Mesh(geometry, materials[mat]);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scale) m.scale.set(...scale);
    m.castShadow = !ghost;
    if (ghost) m.renderOrder = 10;
    bones[parent].add(m);
    return m;
  }
  const sphere = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
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
    const boneList = skeleton.map((b) => {
      const o = new THREE.Bone();
      o.name = b.name;
      o.rotation.order = 'YXZ';
      o.position.fromArray(b.offset);
      bones[b.name] = o;
      return o;
    });
    for (const b of skeleton) (b.parent ? bones[b.parent] : group).add(bones[b.name]);
    const H = d.H;
    const hr = d.headR;
    const F = d.sex === 'F';

    // Continuous skinned body.
    const bodyGeo = buildBodyGeometry(d, skeleton, palette);
    geometries.push(bodyGeo);
    const body = new THREE.SkinnedMesh(bodyGeo, materials.body);
    body.castShadow = !ghost;
    body.frustumCulled = false;
    if (ghost) body.renderOrder = 10;
    group.add(body);
    group.updateMatrixWorld(true);
    skinSkeleton = new THREE.Skeleton(boneList);
    body.bind(skinSkeleton);

    // Face details and hair (rigid on the head).
    for (const x of [1, -1]) {
      mesh('head', sphere(hr * 0.07, 12, 10), 'eye', { pos: [x * hr * 0.3, hr * 1.06, hr * 0.86] });
      mesh('head', new THREE.CapsuleGeometry(hr * 0.025, hr * 0.18, 4, 8), 'hair',
        { pos: [x * hr * 0.3, hr * 1.22, hr * 0.84], rot: [0, 0, Math.PI / 2 + x * 0.12] });
      mesh('head', sphere(hr * 0.2, 14, 10), 'skin', { pos: [x * hr * 0.78, hr * 0.98, -0.02 * hr], scale: [0.35, 1.0, 0.7] });
    }
    mesh('head', new THREE.SphereGeometry(hr * 1.04, 32, 16, 0, Math.PI * 2, 0, Math.PI * (F ? 0.55 : 0.43)), 'hair',
      { pos: [0, hr * 1.02, -0.03 * hr], rot: [-0.35, 0, 0], scale: [0.84, 1.0, 0.96] });
    if (F) {
      // Ponytail hangs from a spring-driven bone, so it swings with every step.
      mesh('hairTail', sphere(hr * 0.22, 14, 10), 'hair', { pos: [0, 0, 0] });
      mesh('hairTail', new THREE.CapsuleGeometry(hr * 0.16, hr * 0.7, 6, 12), 'hair',
        { pos: [0, -hr * 0.5, -hr * 0.12], rot: [0.25, 0, 0], scale: [1, 1, 0.8] });
    }

    // Hands: mitt with a thumb.
    for (const s of ['L', 'R']) {
      const hl = d.hand;
      mesh(`hand_${s}`, sphere(hl * 0.5, 20, 14), 'skin', { pos: [0, -hl * 0.45, 0.004 * H], scale: [0.36, 1.0, 0.62] });
      mesh(`hand_${s}`, new THREE.CapsuleGeometry(hl * 0.09, hl * 0.3, 4, 8), 'skin',
        { pos: [(s === 'L' ? -1 : 1) * hl * 0.06, -hl * 0.32, hl * 0.22], rot: [0.5, 0, 0] });
    }

    // Shoes: heel-to-ball piece on the foot bone, toe cap on the toes bone so the shoe bends at the ball.
    for (const s of ['L', 'R']) {
      const f = `foot_${s}`, t = `toes_${s}`;
      const rf = d.radii.foot;
      const rearLen = d.heelDist + d.ballDist;            // heel → ball
      const toeLen = d.footLen - rearLen;                 // ball → tip
      mesh(f, new THREE.CapsuleGeometry(rf, Math.max(rearLen - rf, 0.01), 8, 16), 'shoe',
        { pos: [0, -d.ankleHeight + rf * 1.05, (d.ballDist - d.heelDist) / 2], rot: [Math.PI / 2, 0, 0], scale: [1.2, 1, 0.8] });
      mesh(f, new THREE.BoxGeometry(rf * 2.3, 0.012 * H, rearLen), 'sole', { pos: [0, -d.ankleHeight + 0.006 * H, (d.ballDist - d.heelDist) / 2] });
      mesh(f, sphere(d.radii.ankle * 1.25, 14, 10), 'shoe', { pos: [0, -0.008 * H, -0.01 * H] });
      mesh(t, new THREE.CapsuleGeometry(rf * 0.95, Math.max(toeLen - rf, 0.01), 8, 16), 'shoe',
        { pos: [0, rf * 0.95, toeLen / 2 - rf * 0.2], rot: [Math.PI / 2, 0, 0], scale: [1.2, 1, 0.72] });
      mesh(t, new THREE.BoxGeometry(rf * 2.2, 0.012 * H, toeLen), 'sole', { pos: [0, 0.006 * H, toeLen / 2] });
      helper(`toe_${s}`, d);
    }
    helper('headTop', d);

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
      for (const m of new Set(Object.values(materials))) m.dispose();
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
    return Object.fromEntries(['body', 'skin', 'shoe', 'sole', 'hair', 'eye'].map((k) => [k, g]));
  }
  return {
    // Skin and clothing colors come from per-vertex colors on the skinned body.
    body: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 }),
    skin: new THREE.MeshStandardMaterial({ color: palette.skin, roughness: 0.6 }),
    shoe: new THREE.MeshStandardMaterial({ color: palette.shoe, roughness: 0.5 }),
    sole: new THREE.MeshStandardMaterial({ color: palette.sole, roughness: 0.8 }),
    hair: new THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.85 }),
    eye: new THREE.MeshStandardMaterial({ color: '#20160f', roughness: 0.2 }),
  };
}

// Markers draw on top of everything so joints stay visible through limbs and the other walker.
export function makeMarkerMaterials(sideColors) {
  const flat = (color) => new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true });
  return { L: flat(sideColors.L), R: flat(sideColors.R), C: flat(sideColors.C), outline: flat('#ffffff') };
}
