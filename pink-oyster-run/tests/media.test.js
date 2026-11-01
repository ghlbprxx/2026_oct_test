// Phase 7: audio + voice manifests and the media tooling (generators, checker). No network, no real CLI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import { buildVoiceLines, speakable } from '../assets/tools/build-voice-lines.mjs';
import { pngInfo, audioKind, checkImage, checkAudio } from '../assets/tools/check-media.mjs';
import { fill, unknownTokens } from '../assets/tools/lib/media.mjs';
import { allLines, CAST } from '../js/content/story.js';
import { MENTOR } from '../js/content/stages.js';
import { MYTHS } from '../js/content/myths.js';

const root = new URL('../', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(root, p), 'utf8'));
const node = (...a) => spawnSync(process.execPath, a, { cwd: root, encoding: 'utf8' });

test('voice-lines.json is generated from the script and up to date', () => {
  const file = read('assets/audio/voice-lines.json'), built = buildVoiceLines();
  assert.deepEqual(file, built, 'run: node assets/tools/build-voice-lines.mjs');
  const ids = new Set(file.lines.map(l => l.id));
  assert.equal(ids.size, file.lines.length, 'unique ids');
  for (const l of allLines()) assert.ok(ids.has(l.id), l.id);
  for (const list of Object.values(MENTOR)) for (const l of list) assert.ok(ids.has(l.id), l.id);
  for (const m of MYTHS) assert.ok(ids.has('guru_claim_' + m.id));
  for (const l of file.lines) { assert.ok(CAST[l.who]); assert.equal(l.file, `assets/audio/voice/${l.id}.mp3`); assert.ok(l.speak && !/\p{Extended_Pictographic}/u.test(l.speak), l.id); }
  assert.equal(speakable('lol bro 🍄🔥'), 'lol bro');
});

test('audio manifest: every synth sound has a file entry; music and cast are complete', () => {
  const m = read('assets/audio/audio-manifest.json');
  const synth = [...readFileSync(join(root, 'js/audio.js'), 'utf8').matchAll(/^\s{2}(\w+): \(\) =>/gm)].map(x => x[1]);
  assert.deepEqual(m.sfx.map(s => s.id).sort(), synth.sort());
  for (const s of [...m.sfx, ...m.music]) {
    assert.match(s.file, /^assets\/audio\/(sfx|music)\/[a-z_]+\.mp3$/, s.id);
    assert.ok(s.prompt.length > 20 && s.seconds > 0 && s.usedFor, s.id);
  }
  for (const id of ['music_title', 'music_farm', 'music_review']) assert.ok(m.music.some(x => x.id === id), id);
  assert.deepEqual(Object.keys(m.cast).sort(), Object.keys(CAST).sort());
  const prompts = readFileSync(join(root, 'assets/audio/PROMPTS.md'), 'utf8');
  for (const x of m.music) assert.ok(prompts.includes(x.prompt), 'PROMPTS.md is stale: node assets/tools/gen-audio.mjs --write-md');
});

test('generators: --dry-run previews without a CLI; real runs refuse until a command is configured', () => {
  for (const [script, n] of [['assets/tools/gen-audio.mjs', 14], ['assets/tools/gen-voice.mjs', 66]]) {
    const d = node(script, '--dry-run'); assert.equal(d.status, 0, d.stderr);
    assert.match(d.stdout, new RegExp(`${n} .*to preview`)); assert.match(d.stdout, /<your-cli>/);
    const r = node(script); assert.equal(r.status, 2); assert.match(r.stderr, /no .*command/i);
  }
  const g = node('assets/tools/gen-images.mjs', '--dry-run'); assert.equal(g.status, 0, g.stderr);
});

test('generators run YOUR command per item and verify the file was written', () => {
  const dir = mkdtempSync(join(tmpdir(), 'por-media-'));
  const fake = join(dir, 'fake-cli.mjs'); // stands in for a user's CLI: writes a tiny MP3 frame header to the --out path
  writeFileSync(fake, `import { writeFileSync } from 'node:fs'; const a = process.argv; writeFileSync(a[a.indexOf('--out') + 1], Buffer.from([0xff, 0xfb, 0x90, 0x64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));`);
  const cfg = join(dir, 'voice.config.json');
  writeFileSync(cfg, JSON.stringify({ command: [process.execPath, fake, 'tts', '--text', '{text}', '--voice', '{voice}', '--out', '{file}'], voices: { mentor: 'm1', guru: 'g1' }, timeoutSeconds: 30 }));
  // write into a scratch copy of the voice dir by pointing --only at one line and checking the real path, then clean up
  const id = 'mentor_intro_1', out = join(root, 'assets/audio/voice', id + '.mp3');
  const r = node('assets/tools/gen-voice.mjs', '--config', cfg, '--only', id, '--force');
  try {
    assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /1 generated/);
    assert.equal(checkAudio({ id, file: `assets/audio/voice/${id}.mp3` }).status, 'ok');
  } finally { spawnSync('rm', ['-f', out]); }
  // a command that exits 0 but writes nothing is a failure
  writeFileSync(cfg, JSON.stringify({ command: [process.execPath, '-e', '0'], voices: {}, timeoutSeconds: 30 }));
  const bad = node('assets/tools/gen-voice.mjs', '--config', cfg, '--only', id);
  assert.equal(bad.status, 1); assert.match(bad.stderr, /did not write/);
  assert.deepEqual(fill(['a', '{text}', '{nope}'], { text: 'hi' }), ['a', 'hi', '{nope}']);
  assert.deepEqual(unknownTokens(['{nope}', 'x']), ['{nope}']);
});

function png(w, h, colorType) { // minimal valid PNG: IHDR + one IDAT + IEND
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); return Buffer.concat([len, Buffer.from(type), data, Buffer.alloc(4)]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = colorType;
  const bpp = colorType === 6 ? 4 : 3, raw = Buffer.alloc(h * (1 + w * bpp));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
test('check-media: PNG size/alpha and audio signatures', () => {
  assert.deepEqual(pngInfo(png(512, 256, 6)), { width: 512, height: 256, colorType: 6, alpha: true });
  assert.equal(pngInfo(png(8, 8, 2)).alpha, false); assert.equal(pngInfo(Buffer.from('not a png at all, sorry')), null);
  assert.equal(audioKind(Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00\x00\x00')), 'mp3');
  assert.equal(audioKind(Buffer.from('RIFF\x00\x00\x00\x00WAVEfmt ')), 'wav');
  assert.equal(audioKind(Buffer.from('{"error":"unauthorized"}')), null);
  const dir = mkdtempSync(join(tmpdir(), 'por-check-')); mkdirSync(join(dir, 'assets', 'img'), { recursive: true });
  writeFileSync(join(dir, 'assets/img/a.png'), png(512, 512, 2));
  const r = checkImage({ id: 'a', file: 'assets/img/a.png', width: 512, height: 512, background: 'transparent' }, dir);
  assert.equal(r.status, 'problem'); assert.match(r.problems.join(), /alpha/);
  writeFileSync(join(dir, 'assets/img/a.png'), png(1024, 1024, 6));
  assert.equal(checkImage({ id: 'a', file: 'assets/img/a.png', width: 512, height: 512, background: 'transparent' }, dir).status, 'ok', 'larger, same aspect is fine');
  writeFileSync(join(dir, 'assets/img/x.mp3'), '{"detail":"Not found"}');
  assert.match(checkAudio({ id: 'x', file: 'assets/img/x.mp3' }, dir).problems.join(), /not a recognizable/);
  assert.equal(node('assets/tools/check-media.mjs', '--strict').status, 0);
});
