// Loads glTF models once each. A .gltf's binary buffers are checked first, so a missing
// scene.bin fails fast with a clear message instead of a cascade of 404s.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const cache = new Map();

// Resolves to the loaded glTF, or rejects with a readable message. onProgress(0..1) is optional.
export function loadModel(url, onProgress) {
  if (!cache.has(url)) {
    const loader = new GLTFLoader();
    cache.set(url, preflight(url).then(() => new Promise((resolve, reject) => {
      loader.load(url, resolve, (e) => {
        if (onProgress && e.total) onProgress(e.loaded / e.total);
      }, (err) => reject(new Error(`Could not load ${url}: ${err && err.message ? err.message : err}`)));
    })).catch((err) => { cache.delete(url); throw err; }));
  }
  return cache.get(url);
}

async function preflight(url) {
  if (!/\.gltf(\?|$)/i.test(url)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} not found (${res.status})`);
  const json = await res.json();
  const base = new URL(url, location.href);
  for (const b of json.buffers || []) {
    if (!b.uri || b.uri.startsWith('data:')) continue;
    const head = await fetch(new URL(b.uri, base), { method: 'HEAD' });
    if (!head.ok) throw new Error(`${url} needs ${b.uri}, which is missing (${head.status})`);
  }
}
