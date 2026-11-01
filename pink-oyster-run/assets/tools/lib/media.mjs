// Shared helpers for the media generators (gen-audio.mjs, gen-voice.mjs). No dependencies, no shell:
// each job runs YOUR command template (an argv array from a config file) with {tokens} filled in.
import { existsSync, mkdirSync, statSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const gameRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
export function cli(argv = process.argv.slice(2)) {
  const flag = n => argv.includes(n), opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  return { flag, opt, only: opt('--only') ? new Set(opt('--only').split(',').map(s => s.trim()).filter(Boolean)) : null };
}
/** Replace {token} in every argv element; unknown tokens are left as-is so mistakes are visible in --dry-run. */
export const fill = (argv, t) => argv.map(a => String(a).replace(/\{(\w+)\}/g, (_, k) => (k in t ? String(t[k]) : `{${k}}`)));
export const show = argv => argv.map(a => (/[\s"'$`]/.test(a) ? JSON.stringify(a) : a)).join(' ');
export const unknownTokens = argv => [...new Set(argv.join(' ').match(/\{\w+\}/g) || [])];

/**
 * Run jobs: [{ id, file (abs), tokens, template }]. Skips existing files unless force. Returns { ok, fail, skip }.
 * A job succeeds only if the command exits 0 AND writes a non-empty file at {file}.
 */
export function runJobs(jobs, { dry = false, force = false, timeoutSeconds = 300, label = 'item' } = {}) {
  const todo = jobs.filter(j => force || !existsSync(j.file));
  console.log(`${todo.length} ${label}(s) to ${dry ? 'preview' : 'generate'} (${jobs.length - todo.length} already present).`);
  let ok = 0, fail = 0, skip = 0;
  for (const j of todo) {
    if (!Array.isArray(j.template)) { console.log(`\n# ${j.id}: no command configured`); skip++; continue; }
    const argv = fill(j.template, j.tokens), left = unknownTokens(argv);
    console.log(`\n# ${j.id} -> ${j.file.replace(gameRoot + '/', '')}\n${show(argv)}`);
    if (left.length) console.warn(`  warning: unknown token(s) ${left.join(' ')} — check the config.`);
    if (dry) continue;
    mkdirSync(dirname(j.file), { recursive: true });
    const r = spawnSync(argv[0], argv.slice(1), { stdio: 'inherit', timeout: timeoutSeconds * 1000 });
    if (r.error || r.status !== 0) { console.error(`  FAILED ${j.id}: ${r.error ? r.error.message : 'exit ' + r.status}`); fail++; continue; }
    if (!existsSync(j.file) || statSync(j.file).size === 0) { console.error(`  FAILED ${j.id}: the command finished but did not write ${j.file}. Does your CLI save to the path given by {file}?`); fail++; continue; }
    ok++;
  }
  if (!dry) console.log(`\nDone: ${ok} generated, ${fail} failed, ${skip} skipped.`);
  return { ok, fail, skip, planned: todo.length };
}
