---
name: generate-media
description: Generate Pink Oyster Run's media (images, sound effects, music, voice lines) on this machine with the user's own local fal.ai CLI. Use when the user asks to generate, regenerate or fill in game art, sprites, sounds, music, voices or "media" for pink-oyster-run, or to set up assets/tools/image.config.json, audio.config.json or voice.config.json.
---

# Generate media for Pink Oyster Run

The game (`pink-oyster-run/`) works with zero media files: missing images use built-in SVG placeholders, missing
sound effects use a synth, missing music and voices are silent. This skill fills those files in with the user's own
fal.ai command-line tool, through generators that already exist in the repo. Your job is to **learn the user's CLI,
write its command templates into three config files, then run the generators carefully and check the results.**

Paths below are relative to `pink-oyster-run/` (run commands from there).

## What gets generated

| Kind | Manifest (source of truth) | Generator | Config you fill in | Count |
|---|---|---|---|---|
| Images | `assets/images.json` (prompts, sizes, transparent/opaque, `alignWith`) | `node assets/tools/gen-images.mjs` | `assets/tools/image.config.json` | ~50 |
| Sound effects | `assets/audio/audio-manifest.json` → `sfx` | `node assets/tools/gen-audio.mjs --kind sfx` | `assets/tools/audio.config.json` → `sfx.command` | 11 |
| Music | `assets/audio/audio-manifest.json` → `music` | `node assets/tools/gen-audio.mjs --kind music` | `assets/tools/audio.config.json` → `music.command` | 3 |
| Voice lines | `assets/audio/voice-lines.json` (built from the game script) + `cast` in the audio manifest | `node assets/tools/gen-voice.mjs` | `assets/tools/voice.config.json` (`command` + `voices`) | ~66 |

Get the live counts with `node assets/tools/check-media.mjs` (it reports ok / problem / missing per kind).

Every generator:
- runs the config's `command` (an **argv array, no shell**) once per missing file, with `{tokens}` filled in;
- skips files that already exist (`--force` to redo), takes `--only id1,id2`, and previews with `--dry-run`;
- counts a job as done only if the command exits 0 **and** writes a non-empty file at `{file}`.

Tokens: images `{prompt} {negative} {file} {width} {height} {aspect} {id} {background} {ref}` (`{ref}` = the image an
`alignWith` entry must line up with, for `editCommand`); audio `{prompt} {seconds} {file} {id} {kind} {loop}`; voice
`{text} {who} {voice} {voiceDescription} {file} {id}`. The `shape` arrays in each config show where they go.

## Rules (read before doing anything)

1. **Never guess the CLI's flags or model ids.** Everything you put in a config must come from the CLI's own help
   output, its README, or the user. The `shape` arrays are placeholders, not real flags.
2. **Ask before spending money.** Show the plan (how many calls of each kind, which models) and get a yes before any
   real generation. If the user wants a cost estimate, ask them for per-call prices or read them from the CLI/model
   docs; never invent prices.
3. **Test batch first, then the rest.** Never start with a full run.
4. **Never print, log, or commit an API key.** Check the key exists without showing it
   (e.g. `[ -n "$FAL_KEY" ] && echo "FAL_KEY is set"`). The configs must not contain keys.
5. Don't change ids, file paths, or sizes in the manifests to suit the tool. Adapt the command (or a wrapper) instead.
6. Ask before committing generated files (they are binary and can be large).

## Step 1: find the CLI (ask, don't search)

The user built their fal.ai CLI themselves. **Ask them where it is** (path to the executable or script, and how they
normally run it, e.g. `~/tools/falgen`, `node ~/code/fal-cli/index.js`, `python -m falcli`). Use AskUserQuestion if
available; otherwise ask in plain text and wait. Don't scan the disk for it.

Then confirm it runs: `<cli> --version` or `<cli> --help`. If it fails, show the error and ask; don't work around it.

## Step 2: learn how it works from its help

Run the top-level help, then the help of every subcommand that looks relevant (`<cli> <sub> --help`, `-h`, `help <sub>`),
and read a README next to the CLI if there is one. Write down, in a short table you show the user:

- how a model is chosen (flag / subcommand / config), and which models it lists or defaults to;
- text-to-image: prompt, negative prompt, size or aspect ratio, seed, output path vs. printing a URL, number of images;
- image editing / image-to-image with a reference image (needed for `alignWith` images, so layers line up);
- transparent output or background removal (needed: most `background: "transparent"` images are layered sprites);
- sound effects, music (prompt + duration), text-to-speech (text, voice selection, voice listing), output format;
- how it authenticates (env var name, config file) and how it reports errors (exit codes?).

If something needed isn't supported (e.g. no TTS, no background removal), say so and ask whether to skip that kind,
use a different model the CLI supports, or have the user extend their CLI. Don't fake it.

## Step 3: pick models with the user

Propose one model per job from what the CLI supports: images (illustration style, good at clean shapes), image edit
(reference-based), background removal, sound effects, music, TTS. Mention the brief's preference: music prompts are
written Suno-style (`assets/audio/PROMPTS.md`); if the user would rather make music in Suno by hand, skip music.
For voices, show the two casting notes from `audio-manifest.json` → `cast` and ask which voice ids/names to use
(list voices with the CLI if it can). Put them in `voice.config.json` → `voices`.

## Step 4: write the configs

Fill `command` (and `editCommand` for images) as argv arrays using the tokens above, e.g. the *shape* of
`["/path/to/cli", "<subcommand>", "<prompt flag>", "{prompt}", "<out flag>", "{file}"]`, with the real flags from step 2.

Use a small wrapper script when the CLI can't do it in one call. Put wrappers in `assets/tools/local/` (create it;
ask the user whether to commit it) and point the config at `node assets/tools/local/<name>.mjs ...`. Typical cases:
- **the CLI prints a URL instead of saving**: run it, parse the URL from stdout/JSON, download to `{file}`;
- **transparent images**: generate, then run the CLI's background-removal step, then save the PNG with alpha to `{file}`
  (branch on `{background}`: only `transparent` images need it);
- **wrong format/size**: convert or resize (e.g. with `ffmpeg` for audio, if installed) so the file matches the manifest.
Wrappers must exit non-zero on failure and must not echo secrets.

## Step 5: dry run and plan

```bash
node assets/tools/gen-images.mjs --dry-run --only plate_empty,plate_colonized,title_hero
node assets/tools/gen-audio.mjs --dry-run --only tap,music_farm
node assets/tools/gen-voice.mjs --dry-run --only mentor_intro_1,guru_intro_1
node assets/tools/check-media.mjs
```

Check the printed commands: no `<placeholder>` or unknown `{token}` left (the runner warns about unknown tokens),
paths absolute, prompts complete. Show the user one command per kind plus the totals, and ask to proceed.

## Step 6: test batch

Generate a few representative items only:
- images: `plate_empty` (transparent base), `plate_colonized` (an `alignWith` layer: must line up with `plate_empty`),
  `title_hero` (opaque scene);
- audio: `tap` (sfx), and `music_review` (short music) if music is in scope;
- voice: one line per speaker (`mentor_intro_1`, `guru_intro_1`).

```bash
node assets/tools/gen-images.mjs --only plate_empty,plate_colonized,title_hero
node assets/tools/gen-audio.mjs --only tap
node assets/tools/gen-voice.mjs --only mentor_intro_1,guru_intro_1
node assets/tools/check-media.mjs --strict
```

Then **look at the images yourself** (open the PNGs with the Read tool): style matches `stylePrompt`, subject centered,
transparent background where required, layers line up. For audio, report duration/format (`ffprobe` if available)
and ask the user to listen. If something is off, fix the command, prompt handling or wrapper and redo just those ids
with `--force`. Get the user's OK on the test batch before the full run.

## Step 7: full run

Run kind by kind, in batches the user agreed to; generators skip what already exists, so re-running is safe:

```bash
node assets/tools/gen-images.mjs        # base images run before their alignWith layers
node assets/tools/gen-audio.mjs --kind sfx
node assets/tools/gen-audio.mjs --kind music
node assets/tools/gen-voice.mjs --who mentor && node assets/tools/gen-voice.mjs --who guru
```

On failures: read the error, fix, and rerun with `--only <failed ids>`. Stop and ask if failures repeat (quota,
auth, model errors) instead of retrying in a loop.

## Step 8: verify

```bash
node assets/tools/check-media.mjs --strict   # every present file is a real PNG/MP3, right aspect, alpha where needed
npm test                                     # manifests, voice-line coverage, everything else
npx serve .                                  # or: python3 -m http.server 8000
```

In the game: Notebook → Art lists every image as custom or placeholder and shows how many sounds were found (click
once first: browsers only load audio after a user gesture). Play a little: scenes speak, effects use the files.
If the script changed since `voice-lines.json` was built, run `node assets/tools/build-voice-lines.mjs` and generate
only the new lines.

## Step 9: report

Tell the user what was generated, what failed or was skipped and why, and any quality issues you noticed. Ask before
committing media files; if they agree, commit them with the configs (no keys) and any wrappers they chose to keep.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "finished but did not write {file}" | CLI saves elsewhere or prints a URL: add the output flag, or a download wrapper. |
| check-media: "no alpha channel" | Transparent image saved without alpha: add background removal for `background: transparent`. |
| check-media: "not a recognizable MP3" | An error page/JSON was saved as audio, or WAV saved as .mp3: check the CLI output; convert with ffmpeg. |
| Layer images don't line up | Use the CLI's image-edit/reference mode in `editCommand` with `{ref}`; regenerate those ids with `--force`. |
| Voice says "fire emoji" etc. | Use `{text}` (emoji already stripped), not the display text. |
| Missing `{voice}` error | Set `voices.mentor` / `voices.guru` in `voice.config.json`. |
