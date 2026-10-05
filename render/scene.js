// Renderer, scene, lights, resize handling.
import * as THREE from 'three';

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dfeef7');
  scene.fog = new THREE.Fog('#dfeef7', 12, 30);

  scene.add(new THREE.HemisphereLight('#ffffff', '#b8c4a8', 1.4));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.0);
  sun.position.set(4, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    renderer, scene, camera,
    render() { renderer.render(scene, camera); },
    dispose() { observer.disconnect(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
