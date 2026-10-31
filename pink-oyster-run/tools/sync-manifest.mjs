// Copies assets/images.json into the <script id="image-manifest"> block of index.html,
// so the game knows the image paths even when index.html is opened straight from disk (file://),
// where fetch() of the JSON is blocked. Run after editing images.json:
//   node pink-oyster-run/tools/sync-manifest.mjs          (writes)
//   node pink-oyster-run/tools/sync-manifest.mjs --check  (exit 1 if out of sync)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = join(root, 'assets', 'images.json');
const htmlPath = join(root, 'index.html');

const manifest = JSON.parse(readFileSync(jsonPath, 'utf8')); // throws on invalid JSON
const html = readFileSync(htmlPath, 'utf8');
const re = /(<script type="application\/json" id="image-manifest">)([\s\S]*?)(<\/script>)/;
if (!re.test(html)) { console.error('image-manifest block not found in index.html'); process.exit(2); }

const embedded = JSON.stringify(manifest).replace(/</g, '\\u003c');
const current = html.match(re)[2];
const inSync = (() => { try { return JSON.stringify(JSON.parse(current)) === JSON.stringify(manifest); } catch { return false; } })();

if (process.argv.includes('--check')) {
  console.log(inSync ? 'image manifest in sync' : 'image manifest OUT OF SYNC: run node pink-oyster-run/tools/sync-manifest.mjs');
  process.exit(inSync ? 0 : 1);
}
if (inSync) { console.log('Already in sync.'); process.exit(0); }
writeFileSync(htmlPath, html.replace(re, (_, a, _b, c) => a + embedded + c));
console.log(`Embedded ${manifest.images.length} image entries into index.html`);
