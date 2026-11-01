// Image manifest: fetches assets/images.json and checks which custom files exist.
// Any failure (no server, missing JSON, missing file) falls back to the SVG placeholders in art.js.
import { reactive } from 'vue';
import { CONFIG } from './config.js';
import { ART } from './art.js';

export const manifest = reactive({ images: [], byId: {}, status: {}, source: 'loading…' });
const probed = {};
function useManifest(json, source) {
  if (!json || !Array.isArray(json.images)) throw new Error('images.json has no "images" array');
  manifest.images = json.images; manifest.byId = Object.fromEntries(json.images.map(m => [m.id, m])); manifest.source = source;
  for (const m of json.images) {
    if (probed[m.id] === m.file) continue; // same path already checked
    probed[m.id] = m.file; manifest.status[m.id] = 'checking';
    const im = new Image();
    im.onload = () => { manifest.status[m.id] = 'loaded'; };
    im.onerror = () => { manifest.status[m.id] = 'missing'; };
    im.src = m.file;
  }
}
export async function loadManifest(url = 'assets/images.json') {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    useManifest(await r.json(), url);
  } catch (e) {
    manifest.source = `could not load ${url} (${e.message}); every image uses placeholder art`;
    console.warn('Image manifest unavailable, using placeholders:', e.message);
  }
}
export function src(id) {
  const m = manifest.byId[id];
  return CONFIG.look.customImages && m && manifest.status[id] === 'loaded' ? m.file : ART.get(id);
}
// Growth mask: reveals a "colonized" image over its empty twin. Region comes from the manifest so new art can be re-fitted without code.
export function revealStyle(id, p) {
  const rv = manifest.byId[id] && manifest.byId[id].reveal;
  if (!rv || p >= 0.999) return {};
  let mask;
  if (rv.type === 'radial') { const r = rv.r * 100; mask = `radial-gradient(ellipse ${r}% ${r}% at ${rv.cx * 100}% ${rv.cy * 100}%, #000 ${Math.max(0, p * 100 - 8)}%, transparent ${p * 100}%)`; }
  else { const y = (rv.from + (rv.to - rv.from) * p) * 100; mask = `linear-gradient(to bottom, #000 ${Math.max(0, y - 4)}%, transparent ${y}%)`; }
  return { WebkitMaskImage: mask, maskImage: mask };
}
