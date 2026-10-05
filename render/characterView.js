// Capsule/sphere character built on the canonical skeleton. Implements the view contract:
//   build(dims) · applyPose(pose) · setPosition(x, z) · setVisible(v) · setOpacity(a) · dispose()
// A glTF or skinned-mesh view can replace this file by implementing the same contract.
import * as THREE from 'three';
import { buildSkeleton } from '../core/skeleton.js';

export function createCharacterView(scene, { palette, ghost = false, opacity = 1 }) {
  const group = new THREE.Group();
  scene.add(group);
  const materials = makeMaterials(palette, ghost, opacity);
  let bones = {};
  let skeleton = [];
  let geometries = [];

  function clear() {
    for (const g of geometries) g.dispose();
    geometries = [];
    group.clear();
    bones = {};
  }

  function mesh(bone, geometry, mat, { pos, rot, scale } = {}) {
    geometries.push(geometry);
    const m = new THREE.Mesh(geometry, materials[mat]);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scale) m.scale.set(...scale);
    m.castShadow = !ghost;
    if (ghost) m.renderOrder = 10;
    bones[bone].add(m);
    return m;
  }

  // Capsule hanging from the joint along -Y (or rising along +Y when up = true).
  function segment(bone, len, radius, mat, up = false) {
    const g = new THREE.CapsuleGeometry(radius, Math.max(len, 0.001), 6, 16);
    mesh(bone, g, mat, { pos: [0, up ? len / 2 : -len / 2, 0] });
  }
  const sphere = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);

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
    const r = d.radii;
    const hr = d.headR;

    // Trunk
    mesh('pelvis', new THREE.CapsuleGeometry(r.pelvis, d.hipHalf * 2, 6, 16), 'pants',
      { pos: [0, r.pelvis * 0.3, 0], rot: [0, 0, Math.PI / 2] });
    segment('spine', d.spineLen, r.spine, 'shirt', true);
    mesh('belly', sphere(r.spine * 0.75), 'shirt', { scale: [1.1, 0.95, 0.85] });
    mesh('chest', sphere(r.chest), 'shirt', { pos: [0, d.chestLen * 0.5, 0], scale: [1.15, 0.95, 0.78] });
    mesh('chestSoft', sphere(r.chest * 0.5), 'shirt', { scale: [1.3, 0.7, 0.6] });
    segment('neck', d.neck, r.neck, 'skin', true);

    // Head: skin ball, hair cap, eyes, nose, jiggly cheeks
    mesh('head', sphere(hr, 28, 20), 'skin', { pos: [0, hr, 0] });
    mesh('head', new THREE.SphereGeometry(hr * 1.05, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), 'hair',
      { pos: [0, hr, 0], rot: [-0.3, 0, 0] });
    for (const x of [1, -1]) mesh('head', sphere(hr * 0.12, 12, 10), 'eye', { pos: [x * hr * 0.33, hr * 1.12, hr * 0.9] });
    mesh('head', sphere(hr * 0.14, 12, 10), 'skin', { pos: [0, hr * 0.95, hr * 1.0] });
    mesh('cheek_L', sphere(hr * 0.2, 14, 10), 'cheek');
    mesh('cheek_R', sphere(hr * 0.2, 14, 10), 'cheek');

    for (const s of ['L', 'R']) {
      segment(`upperArm_${s}`, d.upperArm, r.upperArm, 'shirt');
      segment(`forearm_${s}`, d.forearm, r.forearm, 'skin');
      mesh(`hand_${s}`, sphere(r.hand), 'skin', { pos: [0, -r.hand * 0.6, 0], scale: [0.85, 1.1, 0.9] });
      segment(`thigh_${s}`, d.thigh, r.thigh, 'pants');
      segment(`shin_${s}`, d.shin, r.shin, 'pants');
      // Shoe runs along +Z from heel to toe, sole on the ground plane.
      mesh(`foot_${s}`, new THREE.CapsuleGeometry(r.foot, Math.max(d.footLen - 2 * r.foot, 0.01), 6, 12), 'shoe',
        { pos: [0, -d.ankleHeight + r.foot, d.footLen / 2 - d.heelDist], rot: [Math.PI / 2, 0, 0], scale: [1.25, 1, 1] });
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
  }

  return {
    group,
    build,
    applyPose,
    bone: (name) => bones[name],
    setPosition(x, z) { group.position.set(x, 0, z); },
    setVisible(v) { group.visible = v; },
    setOpacity(a) { for (const m of Object.values(materials)) { m.opacity = a; } },
    dispose() {
      clear();
      for (const m of Object.values(materials)) m.dispose();
      scene.remove(group);
    },
  };
}

function makeMaterials(palette, ghost, opacity) {
  const make = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0, ...extra });
  if (ghost) {
    const ghostMat = make(palette.ghost, {
      transparent: true, opacity, depthWrite: false, emissive: palette.ghost, emissiveIntensity: 0.25,
    });
    return { skin: ghostMat, shirt: ghostMat, pants: ghostMat, shoe: ghostMat, hair: ghostMat, eye: ghostMat, cheek: ghostMat };
  }
  return {
    skin: make(palette.skin),
    shirt: make(palette.shirt),
    pants: make(palette.pants),
    shoe: make(palette.shoe),
    hair: make(palette.hair, { roughness: 0.8 }),
    eye: make('#1d1d28', { roughness: 0.3 }),
    cheek: make(palette.cheek),
  };
}
