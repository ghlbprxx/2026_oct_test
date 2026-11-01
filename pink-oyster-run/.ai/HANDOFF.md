# Handoff: Pink Oyster Run (for the next session)

Written 2026-11-01. Read this first, then `DESIGN.md`, `PLAN.md`, the last entry of `PROGRESS.md`, and `DECISIONS.md` (all in this folder). Update `PLAN.md` and `PROGRESS.md` after every task (the brief requires it; sessions can die at any time).

## 1. Where things stand

| | |
|---|---|
| Repo | `ghlbprxx/2026_oct_test`. Default branch: `claude/gifted-tesla-f2wgdx` |
| Work branch | `claude/optimistic-mayer-07fju9` (pushed, clean). **No PR exists; don't open one unless the user asks.** |
| Last commit | `6d0f680` Pink Oyster Run: headless economy playtests, shelf rack, Basic/Advanced play |
| Tests | `cd pink-oyster-run && npm test` → **58/58 pass** (Node 22, no dependencies) |
| Done | Phases 0–4 of the brief, plus 4.5 (user requests: admin help, headless economy proof, Basic/Advanced play) |
| Next | **Phase 5**: story mode (mentor + forum guru), Week 0 tutorial, mode select. Details in §6. |

Repo layout: the root holds only `README.md` and two projects: `walk-this-way/` (a different game, other sessions work on it; leave it alone) and `pink-oyster-run/` (this game).

## 2. The original brief (summary)

The user's brief, given as a message on 2026-11-01, is the spec. Its main points:

- Multi-species, stage-mastery home mushroom game: pink oyster → lion's mane → wine cap.
- Each in-game week (5 game days), you work on mastering one stage. Mastery = the mentor's checklist, then N good units.
- Mastered stages sell in an online shop; fresh mushrooms sell only at the farmers market.
- Side-view house zones, equipment shop, real numbers, difficulty picker, slow start.
- Story with a mentor and a forum guru, a tutorial, and audio/voice manifests.
- Vue 3 via CDN ESM, GSAP, **no** build tools, Pixi, Three, Lottie or Anime.
- ISF admin panel: **its template must stay verbatim**.
- Phases 1–8 (see `PLAN.md`), with a one-screen report per phase: what changed / verified / unverified / 3 knobs / next step.

User add-ons since the brief:
- More animations, and optional images generated with the fal.ai CLI, with prompts provided (done in Phase 3).
- An admin description per knob, with min/avg/max effects in a details tag (done; "avg" implemented as **Default**, which was flagged to the user).
- Extract the sim so tests prove playability and money on each difficulty (done).
- A Basic vs Advanced play mode (done).

User preferences (from their profile):
- Be blunt and truthful.
- List the unknowns first when troubleshooting.
- Prefer Vue 3 CDN with no build tools.
- Prefer Markdown over docx.

## 3. Run, test, inspect

```bash
cd pink-oyster-run
npm test                      # 58 node:test tests (tests/*.test.js)
node tools/playtest.mjs       # headless economy table: 3 difficulties × 5 strategies, ~3 s
npx serve .                   # or python3 -m http.server 8000 (ES modules: file:// shows a message instead)
node assets/tools/gen-images.mjs --dry-run   # image generation preview (no CLI command configured yet)
```

In the browser, `window.POR` exposes `{ S, ui, CONFIG, ISF, sim, start, masterNow, tapSlot, ... }` for debugging and Playwright. Press `` ` `` for the admin panel (Advanced play style only).

### Sandbox gotchas (this cloud environment)
- **CDNs are blocked** (cdnjs, jsDelivr, unpkg return 403). npm works. For Playwright, `npm pack vue@3.4.21` and `gsap@3.12.5` into the scratchpad, then route:
  - `/vue\.esm-browser\.prod\.js/` → `npmvue/package/dist/vue.esm-browser.prod.js`
  - `/cdn\.jsdelivr\.net\/npm\/gsap@3\.12\.5\/(.*)/` → `npmgsap/package/$1`
  - `/fonts\.(googleapis|gstatic)/` → abort

  The shipped code still uses the CDNs. Real CDN loading has never been verified.
- Playwright/Chromium is preinstalled (`require('playwright')`). Serve the repo root with `python3 -m http.server 8765` and open `/pink-oyster-run/index.html`.
- The Node 22 test script uses the quoted glob `node --test "tests/*.test.js"`; `node --test tests/` fails.
- Expected noise: 404s in the console for missing `assets/img/*.png` (custom images are optional; placeholders are used).

## 4. Architecture (what lives where)

```
pink-oyster-run/
  index.html            shell: import map (vue 3.4.21 ESM, gsap 3.12.5 from jsDelivr), file:// and CDN-failure messages
  css/styles.css        tokens, dark mode, house/zones, review, shop, play-style styles
  js/main.js            boot: setConfig, sim-event → UI wiring, loop, keyboard, autosave, admin actions, window.POR
  js/config-schema.js   CONFIG_SCHEMA (44 knobs + 6 dev) + defaultConfig()  ← pure, used by tests
  js/config.js          ISF admin panel, TEMPLATE VERBATIM (only the last line is the Vue reactive variant)
  js/config-help.js     what/min/def/max text per knob (test enforces completeness)
  js/admin-help.js      decorates the panel's open shadow root: ⓘ details per row, Essentials/All filter, hide in Basic
  js/sim/               PURE simulation (no DOM, no Vue). State in g, side effects only via events.emit()
    cfg.js rng.js events.js clock.js rules.js journal.js
    environment.js zones.js contamination.js growth.js equipment.js (gear + cookers)
    economy.js (crate, drying, market) shop.js (online shop) stages.js mastery.js game.js (newGame, update, actions)
    autoplay.js         headless strategies + runner (used by tests/economy.test.js and tools/playtest.mjs)
  js/content/           data: species/pink-oyster.js (biology in REAL days), stages.js (ladder, checklists, products, mentor lines),
                        zones.js, equipment.js, lessons.js, guide.js, myths.js, weeks.js (stage intro cards)
  js/ui/                template.js (one big Vue template string), app.js (root component + actions), views.js (card helpers, tips), state.js
  js/art.js js/images.js   SVG placeholders for every image id; images.json loader (missing → placeholder)
  js/audio.js js/fx.js js/save.js   synth SFX; toasts/floats + GSAP motion (lazy, optional); profile + run saves (versioned)
  assets/images.json    41 image entries with prompts, styles, alignWith/reveal; assets/IMAGE_PROMPTS.md (generated)
  assets/tools/         gen-images.mjs + image.config.json (user fills the fal.ai command; flags are never guessed)
  tools/playtest.mjs    economy report CLI
  tests/                13 test files + helpers.js (setup(seed, tweak) / run(g, days, each, step))
  original.html         the first single-file version (reference only)
```

Key conventions:
- **Time:** game days drive the calendar (weeks = 5 game days, markets, cold snaps). Biology runs in real "bio" days = game days × `time.bioDaysPerGameDay` (2.5). Species durations in `content/species/*` are real days; the UI shows real days alongside game days. 1 game day = 180 s at 1×.
- **The sim never touches DOM, Vue or audio.** It emits events (`toast`, `sfx`, `float`, `lesson`, `review`, `stage`, `cash`, `track`, …), and `main.js` maps them to UI.
- **Spots:** `g.slots` has 15 indices in zone order: kitchen 0–1, closet 2–7 (3–5 need the `rack` gear), tent 8–10 (need `tent`), garage 11–12, yard 13–14 (locked until wine cap). Use `spotOpen(g, i)` and `zoneOf(i)`.
- **Stages:** `g.stage` indexes `STAGES`; `unlocked(g, 'jar'|'bag'|'room'|'market')` gates features. `count(g, key)` bumps checklist counters; units count only after the checklist is done.
- **Saves:** `save.js` holds the profile (`por:profile`) and the run (`por:run`, v2, with `migrateRun`). The run autosaves at each weekly review and on tab hide/pagehide.
- **Play style** (Basic/Advanced) is UI-only and stored in the profile. Never make the sim depend on it.
- **Knobs:** species/biology numbers belong in content files; cross-cutting multipliers belong in CONFIG. There are already 44 knobs (over the brief's 20–30), so prefer content data or `RULES` over new knobs.

## 5. Economy facts (don't break them)

`tests/economy.test.js` asserts, for every difficulty: a careful player masters all stages, never goes broke, and ends 24 weeks in profit; careful play beats market-only by more than $200; sloppy play stalls at agar; random play loses money; idle earns $0. Current medians (9 seeds × 24 weeks):

- careful: +$608 (Relaxed), +$384 (Normal), +$384 (Hardcore); lowest cash $1,961 / $946 / $259.
- market-only: about −$64 to −$199.

Run `node tools/playtest.mjs` after any tuning change.

What made it work: the online shop is the main income; the wire shelf rack (+3 closet spots, $60); market `auto` booking (only when the haul is worth at least 3× the $25 fee).

Known risks:
- **Grow kits may be a dominant strategy:** listing every colonized bag as a $39 kit beats fruiting.
- Difficulty mostly changes cash and the dip toward zero, not careful-play outcomes.
- About 11–22% of careful runs haven't finished the species by week 24.

## 6. Next: Phase 5 (from PLAN.md)

1. `js/content/story.js`: mentor (retired-mycologist neighbor: blunt, dramatic about mold, secretly proud) and forum guru (confidently wrong about half the time) scenes. Max 3 lines each, every line with an `id` (Phase 7 maps ids to `audio/voice-lines.json`). Include the realism beats from the brief: free wood chips from an arborist (wine cap), and the mentor's aside on why golden oysters were skipped (invasive in US forests). Weekly-review mentor lines already exist in `content/stages.js` `MENTOR` with ids.
2. A speech-bubble component (portraits `portrait_mentor` / `portrait_guru` already exist in `images.json` and `art.js`; the bubble CSS `.mentor`/`.bubble` exists from the review modal). In-world, never text walls.
3. The forum guru takes over the market myth/fact quiz (`economy.market` → `emit('quiz')`; modal in `template.js`, type `quiz`). When the guru is right, the mentor grudgingly admits it.
4. `js/content/tutorial.js` + a Week 0 tutorial: skippable, one step at a time, time paused, highlighting real UI elements. Steps: zones, pour a plate in the still-air box, read the room, playback controls, notebook. It ends by unlocking week 1. The current "Next:" tip line and stage intro cards (`content/weeks.js`) are the stopgap.
5. Mode select: Story / Free play (same systems, no script) / Tutorial / Expert (after the first win; `ui.expert` exists, set by the admin action "Unlock expert").
6. Verify with tests, Playwright desktop + 390px mobile, and Basic + Advanced; update the `.ai/` notes; commit; push; give the one-screen phase report.

After that: Phase 6 (lion's mane, wine cap in the yard, expert mode with liquid culture, optional automation), Phase 7 (audio manifest, Suno `PROMPTS.md`, `voice-lines.json`, `gen-voice.mjs` with a configurable command and `--dry-run`, GSAP polish, species art), Phase 8 (full self-verification).

## 7. Open questions to raise with the user

- fal.ai: the user hasn't provided their CLI syntax. `assets/tools/image.config.json` has `command: null` by design.
- Should the admin help show the arithmetic midpoint instead of Default (the user wrote "avg")?
- Knob count (44 vs the brief's 20–30): trim, or keep the Essentials filter as the answer?
- The pressure cooker research contradicted the brief: the 16-qt also holds 7 quart jars. Implemented as "16 qt can't fit bags; 23 qt fits 2 bags".
- Price data for pinks and lion's mane is low-confidence (see `DESIGN.md` › Researched numbers).

## 8. Working rules that have mattered

- Small steps, each runnable. Update `.ai/` after every task. Commit per phase with a descriptive message ending in the Co-Authored-By and Claude-Session lines from the session's system reminder.
- Run `npm test` and `node tools/playtest.mjs` before every commit that touches `js/sim/` or content numbers.
- Look at screenshots (Read the PNG) after UI changes. Several real bugs were caught only that way: the oversized fly-animation clone, modal order, the hidden move list.
- Don't edit the ISF template in `config.js`; decorate it from `admin-help.js`.
- Keep `README.md` (user-facing) and `DESIGN.md` (current design, `[now]` vs `[target]`) in sync with behavior.
