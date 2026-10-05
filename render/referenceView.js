// The motion-captured reference walker: the "walking test" model playing its own recorded clip,
// untouched by the game's gait, so players can compare the procedural walks with a captured one.
// The clip is driven by the game's sim time, so pause, slow motion and frame-step apply to it too.
import * as THREE from 'three';
import { loadModel } from './modelLoader.js';

// Transparent cards (hair, brows, lashes) render as cut-outs so they sort correctly.
const CUTOUT = /Hair|Brow|Eyelash|Scalp/i;

export function createReferenceView(scene, { url, speed }) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  let mixer = null;
  let duration = 1;
  let head = null;
  let status = 'idle';   // idle → loading → ready | failed
  let error = '';

  function load() {
    if (status !== 'idle') return;
    status = 'loading';
    loadModel(url)
      .then((gltf) => {
        const model = gltf.scene;
        model.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.frustumCulled = false;   // skinned: the bind-pose bounds don't follow the walk
            for (const m of [].concat(o.material)) {
              if (m.transparent && CUTOUT.test(m.name)) {
                Object.assign(m, { transparent: false, alphaTest: 0.4, depthWrite: true, side: THREE.DoubleSide });
              } else if (m.transparent) {
                m.depthWrite = false;
              }
            }
          }
          if (o.isBone && /CC_Base_Head/.test(o.name)) head = o;
        });
        group.add(model);
        const clip = gltf.animations[0];
        if (!clip) throw new Error(`${url} has no animation`);
        duration = clip.duration;
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(clip).play();
        status = 'ready';
      })
      .catch((err) => {
        status = 'failed';
        error = err.message;
        console.warn(`[reference] ${err.message}`);
      });
  }

  return {
    // time = game sim seconds; floor mode walks it forward at the clip's own speed.
    update(visible, time, x, z, travelZ) {
      if (visible) load();
      group.visible = visible && status === 'ready';
      if (!group.visible) return;
      mixer.setTime(time % duration);
      group.position.set(x, 0, z + (travelZ ? travelZ(time * speed) : 0));
    },
    get status() { return status; },
    get error() { return error; },
    distance: (time) => time * speed,
    // Head position for the name tag.
    headWorld(out) { return head ? head.getWorldPosition(out) : null; },
    dispose() { scene.remove(group); },
  };
}
