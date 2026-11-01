#!/usr/bin/env node
// Generates every missing image listed in assets/images.json by running YOUR command template from
// assets/tools/image.config.json once per image (no shell). Nothing is guessed about the fal.ai CLI.
//
//   node assets/tools/gen-images.mjs --dry-run          show what would run (works without a command set)
//   node assets/tools/gen-images.mjs                    generate missing files
//   node assets/tools/gen-images.mjs --only zone_tent,gear_sab   just these ids
//   node assets/tools/gen-images.mjs --force            regenerate even if the file exists
//   node assets/tools/gen-images.mjs --write-md         rewrite assets/IMAGE_PROMPTS.md (copy-paste prompts)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const gameRoot = resolve(here, '..', '..');
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const manifest = JSON.parse(readFileSync(join(gameRoot, 'assets', 'images.json'), 'utf8'));
const config = JSON.parse(readFileSync(opt('--config') || join(here, 'image.config.json'), 'utf8'));
const only = opt('--only') ? new Set(opt('--only').split(',').map(s => s.trim())) : null;
const byId = Object.fromEntries(manifest.images.map(m => [m.id, m]));

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const styleOf = m => (m.style && manifest.styles && manifest.styles[m.style]) || null;
export const negativeFor = m => (styleOf(m) ? styleOf(m).negative : manifest.negativePrompt) || '';
export function fullPrompt(m) {
  return [styleOf(m) ? styleOf(m).prompt : manifest.stylePrompt, m.prompt, m.framing ? `Framing: ${m.framing}` : '', manifest.backgroundSuffix[m.background] || ''].filter(Boolean).join(' ');
}
function tokens(m) {
  const d = gcd(m.width, m.height);
  return { prompt: fullPrompt(m), negative: negativeFor(m), file: resolve(gameRoot, m.file), width: String(m.width), height: String(m.height),
    aspect: `${m.width / d}:${m.height / d}`, id: m.id, background: m.background, ref: m.alignWith ? resolve(gameRoot, byId[m.alignWith].file) : '' };
}
const fill = (argv, t) => argv.map(a => a.replace(/\{(\w+)\}/g, (_, k) => (k in t ? t[k] : `{${k}}`)));
const show = argv => argv.map(a => (/[\s"']/.test(a) ? JSON.stringify(a) : a)).join(' ');

if (flag('--write-md')) {
  let md = `# Image prompts — Pink Oyster Run\n\nGenerated from \`assets/images.json\` by \`node assets/tools/gen-images.mjs --write-md\`. Edit the JSON, not this file.\n\n`;
  md += `Every prompt below already includes its style and background instructions. Default negative prompt: ${manifest.negativePrompt}\n\n`;
  md += `Images marked **align with** are layered over another image: make them by editing that image (image-to-image / inpaint) so outlines line up.\n\n`;
  for (const m of manifest.images) {
    md += `## ${m.id}\n\n- **Save as:** \`${m.file}\` (${m.width}×${m.height}, ${m.background})\n- **Used for:** ${m.usedFor}\n`;
    if (m.alignWith) md += `- **Align with:** \`${m.alignWith}\` (${byId[m.alignWith].file})\n`;
    if (m.style) md += `- **Negative prompt:** ${negativeFor(m)}\n`;
    md += `\n\`\`\`text\n${fullPrompt(m)}\n\`\`\`\n\n`;
  }
  writeFileSync(join(gameRoot, 'assets', 'IMAGE_PROMPTS.md'), md);
  console.log(`Wrote assets/IMAGE_PROMPTS.md (${manifest.images.length} prompts).`);
  process.exit(0);
}

const dry = flag('--dry-run'), force = flag('--force');
if (!dry && !Array.isArray(config.command)) {
  console.error('assets/tools/image.config.json has no "command" yet. Add your fal.ai CLI as an argv array (see "shape" and "$comment"), or run with --dry-run.');
  process.exit(2);
}
// Base images first, so alignWith references exist when their dependents run.
const todo = manifest.images.filter(m => (!only || only.has(m.id)) && (force || !existsSync(resolve(gameRoot, m.file))))
  .sort((a, b) => (a.alignWith ? 1 : 0) - (b.alignWith ? 1 : 0));
console.log(`${todo.length} image(s) to ${dry ? 'preview' : 'generate'}${only ? ` (only: ${[...only].join(', ')})` : ''}.`);
let ok = 0, fail = 0, skip = 0;
for (const m of todo) {
  const t = tokens(m);
  const useEdit = m.alignWith && Array.isArray(config.editCommand);
  const template = useEdit ? config.editCommand : (config.command || config.shape);
  if (m.alignWith && !useEdit) console.warn(`  note: ${m.id} should line up with ${m.alignWith}; set "editCommand" to pass {ref} for better alignment.`);
  if (useEdit && !existsSync(t.ref) && !dry) { console.warn(`  skip ${m.id}: generate ${m.alignWith} first (${t.ref} missing).`); skip++; continue; }
  const argv = fill(template, t);
  console.log(`\n# ${m.id} -> ${m.file}\n${show(argv)}`);
  if (dry) continue;
  mkdirSync(dirname(t.file), { recursive: true });
  const r = spawnSync(argv[0], argv.slice(1), { stdio: 'inherit', timeout: (config.timeoutSeconds || 300) * 1000 });
  if (r.error || r.status !== 0) { console.error(`  FAILED ${m.id}: ${r.error ? r.error.message : 'exit ' + r.status}`); fail++; continue; }
  if (!existsSync(t.file)) { console.error(`  FAILED ${m.id}: the command finished but ${m.file} was not written. Does your CLI save to the path given by {file}?`); fail++; continue; }
  ok++;
}
if (!dry) console.log(`\nDone: ${ok} generated, ${fail} failed, ${skip} skipped. Reload the game; Notebook › Art shows what it found.`);
process.exit(fail ? 1 : 0);
