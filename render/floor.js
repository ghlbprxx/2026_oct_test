// Ground: a treadmill per lane (default) or a long tiled floor the characters walk across.
import * as THREE from 'three';

const BELT_LENGTH = 2.6;
const BELT_WIDTH = 0.9;
const BELT_REPEAT = 6;

function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#3a3f4b'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#4b5261'; g.fillRect(0, 0, 64, 10);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, BELT_REPEAT);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function checkerTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4efe6'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#e6dccb'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(40, 40);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createStage(scene, laneXs) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ map: checkerTexture(), roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const frameMat = new THREE.MeshStandardMaterial({ color: '#8c96a8', roughness: 0.5, metalness: 0.2 });
  const treadmills = laneXs.map((x) => {
    const g = new THREE.Group();
    const tex = stripeTexture();
    const belt = new THREE.Mesh(
      new THREE.PlaneGeometry(BELT_WIDTH, BELT_LENGTH),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
    );
    belt.rotation.x = -Math.PI / 2;
    belt.position.y = 0.002;
    belt.receiveShadow = true;
    g.add(belt);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, BELT_LENGTH + 0.1), frameMat);
      rail.position.set(side * (BELT_WIDTH / 2 + 0.03), 0.03, 0);
      rail.castShadow = true;
      g.add(rail);
    }
    g.position.x = x;
    scene.add(g);
    return { group: g, tex };
  });

  return {
    setLanes(positions) { treadmills.forEach((t, i) => t.group.position.set(positions[i][0], 0, positions[i][1])); },
    // distances: meters walked per lane; the belt texture scrolls backward to match.
    // shown (optional): which lanes are in use.
    update(floorMode, distances, shown = []) {
      treadmills.forEach((t, i) => {
        t.group.visible = !floorMode && shown[i] !== false;
        t.tex.offset.y = -(distances[i] / BELT_LENGTH) * BELT_REPEAT;
      });
    },
  };
}
