#!/usr/bin/env node
// Generates missing voice lines (assets/audio/voice-lines.json) with YOUR text-to-speech command template in
// assets/tools/voice.config.json (no shell, nothing guessed about any CLI).
//   node assets/tools/gen-voice.mjs --dry-run                      preview every command
//   node assets/tools/gen-voice.mjs --who mentor                   one speaker only
//   node assets/tools/gen-voice.mjs --only mentor_intro_1,guru_intro_1
//   node assets/tools/gen-voice.mjs --force                        regenerate existing files
// Rebuild the line list first if the script changed: node assets/tools/build-voice-lines.mjs
import { join, resolve } from 'node:path';
import { gameRoot, readJson, cli, runJobs } from './lib/media.mjs';

const { flag, opt, only } = cli();
const manifest = readJson(join(gameRoot, 'assets', 'audio', 'audio-manifest.json'));
const lines = readJson(join(gameRoot, manifest.voiceLines)).lines;
const config = readJson(opt('--config') || join(gameRoot, 'assets', 'tools', 'voice.config.json'));
const who = opt('--who'), dry = flag('--dry-run');
const template = config.command || (dry ? config.shape : null);
if (!template) { console.error('assets/tools/voice.config.json has no "command" yet. Fill it in (see "$comment" and "shape"), or run with --dry-run.'); process.exit(2); }
const usesVoice = template.some(a => String(a).includes('{voice}'));
const missingVoice = Object.keys(manifest.cast).filter(w => usesVoice && !config.voices[w] && (!who || who === w));
if (!dry && missingVoice.length) { console.error(`Your command uses {voice}, but voices.${missingVoice.join(' and voices.')} is not set in voice.config.json.`); process.exit(2); }
const jobs = lines.filter(l => (!only || only.has(l.id)) && (!who || l.who === who)).map(l => ({
  id: l.id, file: resolve(gameRoot, l.file), template,
  tokens: { text: l.speak, who: l.who, voice: config.voices[l.who] ?? `<${l.who}-voice>`, voiceDescription: manifest.cast[l.who].voice, file: resolve(gameRoot, l.file), id: l.id },
}));
const r = runJobs(jobs, { dry, force: flag('--force'), timeoutSeconds: config.timeoutSeconds, label: 'voice line' });
process.exit(r.fail ? 1 : 0);
