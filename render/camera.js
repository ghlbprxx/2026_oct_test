// Camera presets with smooth transitions; OrbitControls for free inspection.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const CAMERA_PRESETS = {
  threeQuarter: { label: '3/4', pos: [3.1, 1.6, 4.6], target: [0, 0.9, 0] },
  side: { label: 'Side', pos: [6.8, 1.25, 0], target: [0, 0.9, 0] },
  front: { label: 'Front', pos: [0, 1.4, 5.4], target: [0, 0.95, 0] },
};
const FLOOR_SCALE = 1.6; // pull back in floor mode so the whole walkway is visible

export function createCameraRig(camera, dom) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.minDistance = 1.5;
  controls.maxDistance = 16;
  controls.maxPolarAngle = Math.PI * 0.49;
  let tween = null;
  let current = null;

  function goTo(name, floorMode, instant = false) {
    const p = CAMERA_PRESETS[name] || CAMERA_PRESETS.threeQuarter;
    const k = floorMode ? FLOOR_SCALE : 1;
    const toPos = new THREE.Vector3(p.pos[0] * k, p.pos[1] * (floorMode ? 1.3 : 1), p.pos[2] * k);
    const toTarget = new THREE.Vector3(...p.target);
    if (instant) {
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      tween = null;
    } else {
      tween = { t: 0, fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos, toTarget };
    }
    current = `${name}:${floorMode}`;
  }

  return {
    controls,
    sync(name, floorMode) { if (current !== `${name}:${floorMode}`) goTo(name, floorMode, current === null); },
    update(dt) {
      if (tween) {
        tween.t = Math.min(1, tween.t + dt / 0.6);
        const e = tween.t * tween.t * (3 - 2 * tween.t);
        camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
        if (tween.t === 1) tween = null;
      }
      controls.update();
    },
  };
}
