#!/usr/bin/env node
// Generates missing sound effects and music from assets/audio/audio-manifest.json with YOUR command templates
// in assets/tools/audio.config.json (no shell, nothing guessed about any CLI).
//   node assets/tools/gen-audio.mjs --dry-run              preview every command (works with no command set)
//   node assets/tools/gen-audio.mjs --kind sfx             only sound effects (or --kind music)
//   node assets/tools/gen-audio.mjs --only tap,coin        just these ids
//   node assets/tools/gen-audio.mjs --force                regenerate files that exist
//   node assets/tools/gen-audio.mjs --write-md             rewrite assets/audio/PROMPTS.md (music for Suno, sfx, voice casting)
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gameRoot, readJson, cli, runJobs } from './lib/media.mjs';

const { flag, opt, only } = cli();
const manifest = readJson(join(gameRoot, 'assets', 'audio', 'audio-manifest.json'));
const config = readJson(opt('--config') || join(gameRoot, 'assets', 'tools', 'audio.config.json'));

export const sfxPrompt = s => `${manifest.sfxStyle} ${s.prompt}`;

if (flag('--write-md')) {
  const voice = readJson(join(gameRoot, manifest.voiceLines));
  let md = `# Audio prompts — Pink Oyster Run\n\nGenerated from \`assets/audio/audio-manifest.json\` and \`assets/audio/voice-lines.json\` by \`node assets/tools/gen-audio.mjs --write-md\`. Edit the JSON (or the game script), not this file.\n\n`;
  md += `## Music (Suno-style prompts: paste into the style box, instrumental, no lyrics)\n\n`;
  for (const m of manifest.music) md += `### ${m.id}\n\n- **Save as:** \`${m.file}\` · ~${m.seconds} s · ${m.loop ? 'loop' : 'one-shot'}\n- **Used for:** ${m.usedFor}\n\n\`\`\`text\n${m.prompt}\n\`\`\`\n\n`;
  md += `## Sound effects\n\nStyle for every effect: ${manifest.sfxStyle}\n\n| id | file | seconds | prompt |\n|---|---|---|---|\n`;
  for (const s of manifest.sfx) md += `| ${s.id} | \`${s.file}\` | ${s.seconds} | ${s.prompt} |\n`;
  md += `\n## Voices\n\n`;
  for (const [who, c] of Object.entries(manifest.cast)) md += `- **${who}** (${c.name}): ${c.voice}\n`;
  md += `\n${voice.count} lines in \`assets/audio/voice-lines.json\`, one file each at \`assets/audio/voice/<id>.mp3\`:\n\n| id | who | line |\n|---|---|---|\n`;
  for (const l of voice.lines) md += `| ${l.id} | ${l.who} | ${l.speak.replace(/\|/g, '\\|')} |\n`;
  writeFileSync(join(gameRoot, 'assets', 'audio', 'PROMPTS.md'), md);
  console.log('Wrote assets/audio/PROMPTS.md.');
  process.exit(0);
}

const kinds = opt('--kind') ? [opt('--kind')] : ['sfx', 'music'];
const jobs = [];
for (const kind of kinds) {
  const list = manifest[kind]; if (!list) { console.error(`Unknown --kind ${kind} (sfx|music; voices: gen-voice.mjs)`); process.exit(2); }
  const template = (config[kind] && config[kind].command) || (flag('--dry-run') ? config[kind] && config[kind].shape : null);
  for (const s of list) if (!only || only.has(s.id)) jobs.push({ id: s.id, file: resolve(gameRoot, s.file), template,
    tokens: { prompt: kind === 'sfx' ? sfxPrompt(s) : s.prompt, seconds: s.seconds, file: resolve(gameRoot, s.file), id: s.id, kind, loop: !!s.loop } });
}
if (!flag('--dry-run') && jobs.some(j => !Array.isArray(j.template))) {
  console.error(`assets/tools/audio.config.json has no command for: ${kinds.filter(k => !(config[k] && config[k].command)).join(', ')}. Fill it in (see "$comment" and "shape"), or run with --dry-run.`);
  process.exit(2);
}
const r = runJobs(jobs, { dry: flag('--dry-run'), force: flag('--force'), timeoutSeconds: config.timeoutSeconds, label: kinds.join('/') + ' file' });
process.exit(r.fail ? 1 : 0);
