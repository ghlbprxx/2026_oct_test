// Render-layer facade: reads game frames, keeps the Three.js scene in sync.
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createCharacterView } from './characterView.js';
import { createGhost } from './ghost.js';
import { createStage } from './floor.js';
import { createCameraRig } from './camera.js';
import { createTrails } from './trails.js';
import { createRiggedView } from './riggedView.js';
import { loadModel } from './modelLoader.js';
import { autoRig } from './autoRig.js';

const PALETTES = {
  target: { skin: '#e3b08e', cheek: '#e2a487', shirt: '#e0674a', pants: '#3c4f75', shoe: '#2b2b30', sole: '#d9d4cc', hair: '#4a3020' },
  player: { skin: '#b9825c', cheek: '#b77b58', shirt: '#2a9d8f', pants: '#45414f', shoe: '#f2f2f2', sole: '#6b6b70', hair: '#17141a' },
};
const GHOST_COLOR = '#ffb08f';

export function createRenderLayer(container, game, config) {
  const { scene, camera, renderer, render, dispose: disposeScene } = createScene(container);
  const lane = config.render.laneOffset;
  // [x, z] per lane. Side-by-side across X normally; staggered along Z for the side camera
  // (looking down -X), where X lanes would hide one character behind the other.
  const LAYOUTS = {
    across: { target: [-lane, 0], player: [lane, 0] },
    staggered: { target: [0, 1.45], player: [0, -1.45] }, // treadmills are 2.6 m long
  };
  let layoutName = 'across';
  const stage = createStage(scene, [LAYOUTS.across.target[0], LAYOUTS.across.player[0]]);
  const rig = createCameraRig(camera, renderer.domElement);
  const sideColors = config.render.sideColors;
  const procedural = {
    target: createCharacterView(scene, { palette: PALETTES.target, sideColors }),
    player: createCharacterView(scene, { palette: PALETTES.player, sideColors }),
  };
  // Realistic models load and auto-rig in the background; until then (or if they fail) the
  // procedural body is used.
  const realistic = { target: {}, player: {} };   // sex → rigged view
  const defaults = Object.fromEntries(game.registry.map((p) => [p.id, p.default]));
  const views = { ...procedural };                 // what each walker currently shows
  const notice = document.createElement('div');
  notice.className = 'model-notice';
  container.appendChild(notice);
  const credit = document.createElement('div');   // CC BY attribution for loaded models
  credit.className = 'model-credit';
  container.appendChild(credit);
  for (const [sex, url] of Object.entries(config.render.models || {})) {
    if (!url) continue;
    notice.textContent = 'Loading realistic model…';
    loadModel(url, (f) => { notice.textContent = `Loading realistic model… ${Math.round(f * 100)}%`; })
      .then((gltf) => {
        const rig = autoRig(gltf, { ...defaults, sex });
        for (const key of ['target', 'player']) {
          realistic[key][sex] = createRiggedView(scene, { rig, palette: PALETTES[key], sideColors });
          realistic[key][sex].setVisible(false);
        }
        if (config.render.modelCredits && config.render.modelCredits[sex]) credit.textContent = config.render.modelCredits[sex];
        built.target = built.player = -1;   // rebuild with the model on the next frame
        notice.textContent = '';
      })
      .catch((err) => {
        console.warn(`[models] ${err.message} — using the procedural body for ${sex}.`);
        notice.textContent = `Realistic ${sex === 'F' ? 'female' : 'male'} model unavailable — using the built-in body.`;
        setTimeout(() => { notice.textContent = ''; }, 6000);
      });
  }
  const trails = createTrails(scene, config.trails, config.render.sideColors);
  const ghost = createGhost(scene, { color: GHOST_COLOR, opacity: config.render.ghostOpacity });
  const built = { target: -1, player: -1 };

  // Floating name tags projected from each head.
  const labels = {};
  for (const [key, text] of [['target', 'Target'], ['player', 'You']]) {
    const el = document.createElement('div');
    el.className = `lane-label lane-label--${key}`;
    el.textContent = text;
    container.appendChild(el);
    labels[key] = el;
  }
  const tmp = new THREE.Vector3();

  const span = config.render.floorSpan;
  const travelZ = (distance) => (((distance + span / 2) % span) + span) % span - span / 2;

  function frame(dt) {
    const f = game.getFrame();
    const { floor, ghost: showGhost, camera: camName, markers, trails: showTrails } = game.state.playback;
    const wanted = camName === 'side' && !floor ? 'staggered' : 'across';
    if (wanted !== layoutName) {
      layoutName = wanted;
      stage.setLanes([LAYOUTS[wanted].target, LAYOUTS[wanted].player]);
    }
    const lanes = LAYOUTS[layoutName];
    const at = {};
    for (const key of ['target', 'player']) {
      const c = f[key];
      if (built[key] !== c.version) {
        const next = realistic[key][c.body.dims.sex] || procedural[key];
        if (next !== views[key]) views[key].setVisible(false);
        views[key] = next;
        views[key].setVisible(true);
        try {
          views[key].build(c.body.dims);
        } catch (err) {   // a model that loaded but doesn't fit the rig → fall back for good
          console.warn(`[models] ${err.message} — using the procedural body.`);
          realistic[key][c.body.dims.sex] = null;
          views[key].setVisible(false);
          views[key] = procedural[key];
          views[key].setVisible(true);
          views[key].build(c.body.dims);
        }
        built[key] = c.version;
      }
      views[key].applyPose(c.pose);
      at[key] = [lanes[key][0], lanes[key][1] + (floor ? travelZ(c.distance) : 0)];
      views[key].setPosition(at[key][0], at[key][1]);
      views[key].setMarkersVisible(markers);
      trails.update(key, c, lanes[key], floor ? travelZ : null, showTrails);
    }
    ghost.update(showGhost, f.target, at.player[0], at.player[1]);
    stage.update(floor, [f.target.distance, f.player.distance]);
    rig.sync(camName, floor);
    rig.update(dt);
    render();

    const w = container.clientWidth, h = container.clientHeight;
    for (const key of ['target', 'player']) {
      const head = views[key].bone('head');
      if (!head) continue;
      head.getWorldPosition(tmp);
      tmp.y += f[key].body.dims.headR * 2.6;
      tmp.project(camera);
      const visible = tmp.z < 1;
      labels[key].style.display = visible ? '' : 'none';
      labels[key].style.transform = `translate(-50%, -100%) translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px)`;
    }
  }

  return {
    frame,
    // Verification: CPU-skins the realistic body and reports its extent (group frame, metres).
    __rigReport(key = 'player') {
      const v = views[key];
      if (!v.meshes) return 'procedural';
      const mesh = v.meshes()[0];
      const n = mesh.geometry.attributes.position.count;
      const t = new THREE.Vector3();
      let minY = Infinity, maxY = -Infinity, maxZ = -Infinity, minZ = Infinity;
      for (let i = 0; i < n; i += 3) {
        mesh.getVertexPosition(i, t);
        minY = Math.min(minY, t.y); maxY = Math.max(maxY, t.y); maxZ = Math.max(maxZ, t.z); minZ = Math.min(minZ, t.z);
        if (!Number.isFinite(t.y)) return { error: 'NaN vertex' };
      }
      return { minY: +minY.toFixed(4), maxY: +maxY.toFixed(3), zRange: [+minZ.toFixed(3), +maxZ.toFixed(3)], height: game.getFrame()[key].body.dims.H };
    },
    // Exposed for verification/debugging: world position of a bone in the scene.
    boneWorld(key, name) {
      const b = views[key].bone(name);
      return b ? b.getWorldPosition(new THREE.Vector3()).toArray() : null;
    },
    dispose() {
      Object.values(procedural).forEach((v) => v.dispose());
      Object.values(realistic).forEach((m) => Object.values(m).forEach((v) => v && v.dispose()));
      notice.remove();
      credit.remove();
      ghost.dispose();
      trails.dispose();
      Object.values(labels).forEach((el) => el.remove());
      disposeScene();
    },
  };
}
