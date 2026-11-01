#!/usr/bin/env node
// Builds assets/audio/voice-lines.json from the game script: story scenes and guru quiz lines (content/story.js),
// weekly-review mentor lines (content/stages.js MENTOR) and one guru claim per myth (content/myths.js).
//   node assets/tools/build-voice-lines.mjs           write the file
//   node assets/tools/build-voice-lines.mjs --check   exit 1 if the file is out of date (used by tests/CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allLines } from '../../js/content/story.js';
import { MENTOR } from '../../js/content/stages.js';
import { MYTHS } from '../../js/content/myths.js';

const here = dirname(fileURLToPath(import.meta.url)), gameRoot = resolve(here, '..', '..');
const OUT = join(gameRoot, 'assets', 'audio', 'voice-lines.json');

/** Text for a TTS engine: emoji and decorative symbols removed, whitespace tidied. */
export const speakable = t => t.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();

export function buildVoiceLines() {
  const lines = [], add = (id, who, text, source) => lines.push({ id, who, text, speak: speakable(text), file: `assets/audio/voice/${id}.mp3`, source });
  for (const l of allLines()) add(l.id, l.who, l.text, 'story');
  for (const list of Object.values(MENTOR)) for (const l of list) add(l.id, 'mentor', l.text, 'review');
  for (const m of MYTHS) add('guru_claim_' + m.id, 'guru', m.s, 'quiz');
  return { version: 1, generatedBy: 'node assets/tools/build-voice-lines.mjs (do not edit by hand: edit the game script)', count: lines.length, lines };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const json = JSON.stringify(buildVoiceLines(), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const ok = existsSync(OUT) && readFileSync(OUT, 'utf8') === json;
    console.log(ok ? 'voice-lines.json is up to date.' : 'voice-lines.json is out of date: run node assets/tools/build-voice-lines.mjs');
    process.exit(ok ? 0 : 1);
  }
  writeFileSync(OUT, json);
  console.log(`Wrote assets/audio/voice-lines.json (${JSON.parse(json).count} lines).`);
}
