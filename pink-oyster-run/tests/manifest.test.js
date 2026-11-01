// Pink Oyster Run: image manifest checks (no browser needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dir = new URL('../pink-oyster-run/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('assets/images.json', dir), 'utf8'));
const html = readFileSync(new URL('index.html', dir), 'utf8');

test('every manifest entry has the fields an image generator needs', () => {
  const ids = new Set();
  for (const m of manifest.images) {
    assert.ok(/^[a-z0-9_]+$/.test(m.id), `bad id ${m.id}`);
    assert.ok(!ids.has(m.id), `duplicate id ${m.id}`); ids.add(m.id);
    assert.ok(m.file.startsWith('assets/img/') && /\.(png|webp|jpg|jpeg)$/.test(m.file), `${m.id}: file path`);
    assert.ok(Number.isInteger(m.width) && Number.isInteger(m.height), `${m.id}: size`);
    assert.ok(m.background in manifest.backgroundSuffix, `${m.id}: background`);
    assert.ok(m.prompt && m.prompt.length > 40, `${m.id}: prompt`);
    if (m.alignWith) assert.ok(manifest.images.some(x => x.id === m.alignWith), `${m.id}: alignWith target`);
    if (m.reveal) assert.ok(['radial', 'top-down'].includes(m.reveal.type), `${m.id}: reveal type`);
  }
  assert.ok(manifest.stylePrompt && manifest.negativePrompt);
});

test('index.html embeds an up-to-date copy of images.json', () => {
  const m = html.match(/<script type="application\/json" id="image-manifest">([\s\S]*?)<\/script>/);
  assert.ok(m, 'embedded manifest block missing');
  assert.deepEqual(JSON.parse(m[1]), manifest, 'run: node pink-oyster-run/tools/sync-manifest.mjs');
});

test('every image id the game draws is in the manifest, and has placeholder art', () => {
  const used = new Set([...html.matchAll(/(?<![.\w])(?:src|add)\('([a-z_]+)'/g)].map(x => x[1]));
  for (const k of ["'block_ready'", "'block_pins'", "'cluster_young'", "'cluster_peak'", "'cluster_leggy'", "'cluster_dry'", "'cluster_overripe'", "'block_spent'", "'bag_straw'", "'bag_sawdust'", "'bag_coir'"]) used.add(k.slice(1, -1));
  const ids = new Set(manifest.images.map(m => m.id));
  for (const id of used) {
    assert.ok(ids.has(id), `game uses ${id} but images.json lacks it`);
    assert.ok(new RegExp(`\\b${id}: `).test(html), `no placeholder generator for ${id}`);
  }
});
