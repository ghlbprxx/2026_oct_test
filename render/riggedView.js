// A walker drawn with an auto-rigged mesh (see autoRig.js). Implements the view contract:
//   build(dims) · applyPose(pose) · setPosition(x, z) · setVisible(v) · setOpacity(a) · dispose()
// plus setMarkersVisible(v) and bone(name) like characterView.js.
//
// Bones are free-floating: each frame every bone's matrix is written straight from core's skeleton,
//   bone = T(our joint) · R(our rotation) · S(size, length, size)
// so joints land exactly where core's IK put them, the mesh takes the walker's proportions
// (each segment stretches along its own axis; thickness scales with height), and the soft-tissue
// bones move with core's springs.
import * as THREE from 'three';
import { buildSkeleton, forwardKinematics, pointSpec, pointWorld } from '../core/skeleton.js';
import { MARKERS, makeMarkerMaterials } from './characterView.js';

// Bone → the child joint that defines its length (others scale uniformly with height).
const LENGTH_CHILD = {
  spine: 'chest', chest: 'neck', neck: 'head',
  upperArm_L: 'forearm_L', forearm_L: 'hand_L', upperArm_R: 'forearm_R', forearm_R: 'hand_R',
  thigh_L: 'shin_L', shin_L: 'foot_L', thigh_R: 'shin_R', shin_R: 'foot_R',
};

// How much each bone's girth grows per unit of body fat (dims.fatF ≈ -0.7 lean … +1.15 heavy).
const FAT_GIRTH = {
  pelvis: 0.16, spine: 0.2, chest: 0.08, belly: 0.2, glute_L: 0.16, glute_R: 0.16,
  thigh_L: 0.13, thigh_R: 0.13, thighFat_L: 0.13, thighFat_R: 0.13,
  upperArm_L: 0.1, upperArm_R: 0.1, armFat_L: 0.1, armFat_R: 0.1, neck: 0.06,
};

export function createRiggedView(scene, { rig, palette, sideColors = null }) {
  const group = new THREE.Group();
  scene.add(group);
  const markerMats = sideColors ? makeMarkerMaterials(sideColors) : null;
  const materials = {
    body: clothedSkinMaterial(palette),
    eye: new THREE.MeshStandardMaterial({ color: '#2a1d16', roughness: 0.15 }),
    lash: new THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.9, side: THREE.DoubleSide }),
    hair: new THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.85, side: THREE.DoubleSide }),
  };
  // Bones in the rig's skeleton order; bind matrices are fixed by the rig.
  const names = rig.skeleton.map((b) => b.name);
  const bindLen = {};
  for (const [b, c] of Object.entries(LENGTH_CHILD)) bindLen[b] = rig.bind[b].p.distanceTo(rig.bind[c].p);
  const inverses = names.map((n) => new THREE.Matrix4().compose(rig.bind[n].p, rig.bind[n].q, new THREE.Vector3(1, 1, 1)).invert());

  let meshes = [];
  let bones = [];
  let skeleton = [];
  let skin = null;
  let dims = null;
  let anchors = {};
  let markerMeshes = [];
  let markerGeos = [];
  let markersVisible = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();

  function clear() {
    for (const me of meshes) group.remove(me);   // geometry is shared by all walkers (owned by the rig)
    for (const a of Object.values(anchors)) group.remove(a);
    for (const g of markerGeos) g.dispose();
    if (skin) skin.dispose();
    meshes = []; anchors = {}; markerMeshes = []; markerGeos = []; skin = null;
  }

  function build(d) {
    clear();
    dims = d;
    skeleton = buildSkeleton(d);
    bones = names.map(() => { const b = new THREE.Bone(); b.matrixAutoUpdate = false; return b; });
    skin = new THREE.Skeleton(bones, inverses);
    for (const part of rig.parts) {
      const mesh = new THREE.SkinnedMesh(part.geometry, materials[part.kind] || materials.body);
      mesh.bindMode = THREE.DetachedBindMode;      // bone matrices are written in this group's frame
      mesh.bind(skin, new THREE.Matrix4());
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      group.add(mesh);
      meshes.push(mesh);
    }

    for (const b of skeleton) anchors[b.name] = new THREE.Object3D();
    for (const name of ['headTop', 'toe_L', 'toe_R']) anchors[name] = new THREE.Object3D();
    for (const a of Object.values(anchors)) group.add(a);
    if (markerMats) {
      const rDot = 0.013 * d.H;
      const dot = new THREE.SphereGeometry(rDot, 14, 10);
      const ring = new THREE.SphereGeometry(rDot * 1.45, 14, 10);
      markerGeos.push(dot, ring);
      for (const [name, sideKey, boneName] of MARKERS) {
        const o = new THREE.Mesh(ring, markerMats.outline); o.renderOrder = 30;
        const mk = new THREE.Mesh(dot, markerMats[sideKey]); mk.renderOrder = 31;
        anchors[boneName || name].add(o, mk);
        markerMeshes.push(o, mk);
      }
      setMarkersVisible(markersVisible);
    }
  }

  function applyPose(pose) {
    if (!dims) return;
    const world = forwardKinematics(skeleton, pose);
    const size = dims.H / rig.H;   // thickness, head, hands and feet follow height
    names.forEach((n, i) => {
      const w = world[n];
      p.set(...w.p);
      q.set(...w.q);
      const child = LENGTH_CHILD[n];
      const len = child ? Math.hypot(...world[child].p.map((x, k) => x - w.p[k])) / bindLen[n] : size;
      const girth = size * (1 + (FAT_GIRTH[n] || 0) * dims.fatF);
      s.set(girth, child ? len : size, girth);   // bone-local Y is the limb axis for every bone
      bones[i].matrixWorld.compose(p, q, s);
    });
    for (const b of skeleton) anchors[b.name].position.set(...world[b.name].p);
    for (const name of ['headTop', 'toe_L', 'toe_R']) anchors[name].position.set(...pointWorld(world, pointSpec(name, dims)));
    group.updateMatrixWorld(true);
  }

  function setMarkersVisible(v) {
    markersVisible = v;
    for (const mk of markerMeshes) mk.visible = v;
  }

  return {
    group,
    build,
    applyPose,
    setMarkersVisible,
    bone: (name) => anchors[name],
    meshes: () => meshes,
    setPosition(x, z) { group.position.set(x, 0, z); group.updateMatrixWorld(true); },
    setVisible(v) { group.visible = v; },
    setOpacity() {},
    dispose() { clear(); for (const mt of Object.values(materials)) mt.dispose(); scene.remove(group); },
  };
}

// Skin-coloured material that paints a T-shirt and shorts from the rig's `cloth` fields.
// Thresholding interpolated fields per pixel gives crisp hems even on large triangles.
function clothedSkinMaterial(palette) {
  const mat = new THREE.MeshStandardMaterial({ color: palette.skin, roughness: 0.62 });
  const uniforms = { shirtColor: { value: new THREE.Color(palette.shirt) }, shortsColor: { value: new THREE.Color(palette.pants) } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 cloth;\nvarying vec4 vCloth;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCloth = cloth;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vCloth;\nuniform vec3 shirtColor;\nuniform vec3 shortsColor;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (vCloth.x > 0.0 && vCloth.y > 0.0 && vCloth.z > 0.0) diffuseColor.rgb = shirtColor;
        else if (vCloth.x <= 0.0 && vCloth.w > 0.0) diffuseColor.rgb = shortsColor;`);
  };
  return mat;
}
