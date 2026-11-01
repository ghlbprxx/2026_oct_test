#!/usr/bin/env node
// Checks generated media against the manifests: what's present, what's missing, and whether files look right.
// Images (PNG): real PNG, aspect ratio matches, size ≥ the manifest's, and transparent entries really have alpha.
// Audio: non-empty and a real MP3 / WAV / OGG / M4A by its header bytes.
//   node assets/tools/check-media.mjs            summary + problems
//   node assets/tools/check-media.mjs --list     every file with its status
//   node assets/tools/check-media.mjs --json     machine-readable
//   node assets/tools/check-media.mjs --strict   exit 1 if any present file has a problem
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameRoot, readJson, cli } from './lib/media.mjs';

/** PNG header: { width, height, alpha } or null if not a PNG. Alpha = RGBA/grey+alpha color type, or a tRNS chunk. */
export function pngInfo(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 33 || !sig.every((b, i) => buf[i] === b) || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20), colorType = buf[25];
  let alpha = colorType === 4 || colorType === 6;
  for (let p = 8; !alpha && p + 8 <= buf.length;) { const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8); if (type === 'tRNS') alpha = true; if (type === 'IDAT' || type === 'IEND') break; p += 12 + len; }
  return { width, height, colorType, alpha };
}
/** Audio container from the first bytes, or null. */
export function audioKind(buf) {
  if (buf.length < 12) return null;
  if (buf.toString('ascii', 0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return 'mp3';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE') return 'wav';
  if (buf.toString('ascii', 0, 4) === 'OggS') return 'ogg';
  if (buf.toString('ascii', 4, 8) === 'ftyp') return 'm4a';
  return null;
}
export function checkImage(m, root = gameRoot) {
  const f = resolve(root, m.file); if (!existsSync(f)) return { id: m.id, file: m.file, status: 'missing' };
  const buf = readFileSync(f), problems = [];
  if (/\.png$/i.test(m.file)) {
    const p = pngInfo(buf);
    if (!p) problems.push('not a valid PNG (wrong format saved with a .png name?)');
    else {
      if (Math.abs(p.width / p.height - m.width / m.height) > 0.02) problems.push(`aspect ${p.width}×${p.height} ≠ ${m.width}×${m.height}`);
      if (p.width < m.width * 0.95) problems.push(`smaller than ${m.width}×${m.height} (${p.width}×${p.height})`);
      if (m.background === 'transparent' && !p.alpha) problems.push('no alpha channel, but this image must be transparent (run background removal)');
    }
  }
  return { id: m.id, file: m.file, status: problems.length ? 'problem' : 'ok', problems, bytes: buf.length };
}
export function checkAudio(a, root = gameRoot) {
  const f = resolve(root, a.file); if (!existsSync(f)) return { id: a.id, file: a.file, status: 'missing' };
  const buf = readFileSync(f), k = audioKind(buf), problems = [];
  if (!buf.length) problems.push('empty file'); else if (!k) problems.push('not a recognizable MP3/WAV/OGG/M4A (an error page or JSON saved as audio?)');
  else if (/\.mp3$/i.test(a.file) && k !== 'mp3') problems.push(`saved as .mp3 but it is ${k}; browsers may refuse it (convert or rename and update the manifest)`);
  return { id: a.id, file: a.file, status: problems.length ? 'problem' : 'ok', problems, bytes: statSync(f).size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { flag } = cli();
  const images = readJson(join(gameRoot, 'assets', 'images.json')).images.map(m => ({ kind: 'image', ...checkImage(m) }));
  const am = readJson(join(gameRoot, 'assets', 'audio', 'audio-manifest.json'));
  const voice = readJson(join(gameRoot, am.voiceLines)).lines;
  const audio = [...am.sfx.map(a => ({ kind: 'sfx', ...checkAudio(a) })), ...am.music.map(a => ({ kind: 'music', ...checkAudio(a) })), ...voice.map(a => ({ kind: 'voice', ...checkAudio(a) }))];
  const all = [...images, ...audio];
  if (flag('--json')) { console.log(JSON.stringify(all, null, 2)); }
  else {
    for (const kind of ['image', 'sfx', 'music', 'voice']) {
      const xs = all.filter(x => x.kind === kind), c = s => xs.filter(x => x.status === s).length;
      console.log(`${kind.padEnd(6)} ${String(c('ok')).padStart(3)} ok · ${String(c('problem')).padStart(3)} problem · ${String(c('missing')).padStart(3)} missing  (of ${xs.length})`);
    }
    for (const x of all) if (x.status === 'problem' || (flag('--list') && x.status !== 'problem')) console.log(`  ${x.status.padEnd(7)} ${x.kind.padEnd(5)} ${x.id.padEnd(28)} ${x.file}${x.problems && x.problems.length ? '\n          ' + x.problems.join('; ') : ''}`);
    console.log('\nMissing files are fine: the game uses placeholder art / synth sound / silence for them.');
  }
  process.exit(flag('--strict') && all.some(x => x.status === 'problem') ? 1 : 0);
}
