// Slims the "walking test" Sketchfab download (scene.gltf + 65 MB scene.bin) into
// assets/walking_test/walking_test.glb (~4 MB), keeping the skeleton, skin and walk clip:
//   - specular-glossiness → metal-rough materials (three.js no longer reads specGloss),
//   - strips the 56 facial blend shapes (59 MB of the 65 MB) and their animation channels,
//   - drops the mouth-interior meshes and unused vertex attributes (COLOR_0 is all white),
//   - prunes, dedups, resamples the clip and quantizes the geometry.
// Needs glTF-Transform, which the game itself doesn't:
//   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions
//   node tools/slim-walking-test.mjs path/to/walking_test/scene.gltf assets/walking_test/walking_test.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { metalRough, prune, dedup, quantize, resample, weld } from '@gltf-transform/functions';
const [src, dst] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
const root = doc.getRoot();
await doc.transform(metalRough());
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) for (const t of prim.listTargets()) { prim.removeTarget(t); t.dispose(); }
  mesh.setWeights([]);
}
for (const node of root.listNodes()) node.setWeights([]);
for (const anim of root.listAnimations()) {
  for (const ch of anim.listChannels()) if (ch.getTargetPath() === 'weights') { const s = ch.getSampler(); ch.dispose(); s.dispose(); }
}
for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) for (const sem of ['COLOR_0', 'TEXCOORD_1', 'TEXCOORD_2']) if (prim.getAttribute(sem)) prim.setAttribute(sem, null);
const DROP = /Teeth|Tongue/;
for (const node of root.listNodes()) {
  const m = node.getMesh();
  if (m && m.listPrimitives().some((p) => DROP.test(p.getMaterial()?.getName() || ''))) { node.setMesh(null); }
}
await doc.transform(prune(), dedup(), resample(), quantize({ quantizeNormal: 10, quantizePosition: 14 }));
await io.write(dst, doc);
