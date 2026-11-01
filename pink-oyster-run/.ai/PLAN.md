# Plan (update after every task)

## Phase 0 — notes
- [x] Create .ai/ DESIGN, PLAN, PROGRESS, DECISIONS

## Phase 1 — restructure, ES modules, no behavior change
- [x] Move root Walk This Way project into walk-this-way/; root README.md lists projects
- [x] pink-oyster-run/package.json (type module, test, serve)
- [x] css/styles.css extracted
- [x] js/config-schema.js + js/config.js (ISF verbatim)
- [x] content/: guide.js, myths.js, lessons.js, species/pink-oyster.js
- [x] sim/: cfg, rng, events, clock, environment, contamination, growth, economy, equipment, game
- [x] save.js (versioned profile + migration from por2-* keys)
- [x] art.js, images.js (fetch manifest, no embedded copy), audio.js (synth), fx.js (toasts/floats)
- [x] ui/app.js (template + component), ui/views.js (layers/status/tips)
- [x] main.js (boot, loop, input, admin hooks); index.html shell + file:// / CDN-failure message
- [x] Remove tools/sync-manifest.mjs; move tests into pink-oyster-run/tests
- [x] tests: clock, environment, contamination, growth, save, manifest
- [x] Verify: Playwright smoke + bot parity with pre-refactor numbers

## Phase 2 — time, realism, difficulty, slow start
- [x] clock: playback 0/0.5/1/2/4/8×, bioDaysPerGameDay, secondsPerDay range 30–600
- [x] research numbers (see DESIGN.md › Researched numbers)
- [x] apply researched numbers to CONFIG (prices, colonization per recipe, jars, rest, shelf life)
- [x] difficulty picker (Relaxed/Normal/Hardcore) in CONFIG
- [x] remove stocked bench; Week 0/1 slow start (one zone, one vessel type, cleanliness only)
- [x] real-world durations in UI + notebook

- [x] browser verification (setup, playback, week cards, locks, SAB, mobile)

## Phase 3 — zones + equipment shop (+ user add-on 2026-11-01: more animations, optional fal.ai images)
- [x] sim/zones.js: kitchen 2, closet 3, tent 3, garage 2, yard 2 spots; per-zone temp/RH/CO₂/cleanliness; zone fit + explanations; move action; tests
- [x] content/equipment.js + shop: buy gear (SAB, flow hood, cookers 16/23 qt, scale, sealer, tent, humidifier, heat mat, hygrometer, CO₂ monitor, dehydrator); capability effects; tests
- [x] UI: side-view house cutaway replacing the shelf grid; spot hover/tap readouts; shop sheet; locked-zone states
- [x] fx: GSAP (pinned CDN ESM, lazy, optional) for place/move/stage pops/cash/week cards; CSS ambient (tent mist, cooker steam); no-ops when juice off / reduced motion
- [x] art: images.json entries for zones, house, equipment, mentor + guru portraits; SVG placeholders for each
- [x] assets/tools/gen-images.mjs + image.config.json (command template, never guessed fal flags; --dry-run, --only, --force) + assets/IMAGE_PROMPTS.md
- [x] verify (tests, Playwright desktop + mobile, zero image files) + commit

## Phase 4 — ladder, weekly review, mastery, online shop, market (+ user add-on: admin help)
- [x] content/stages.js: pink stages (agar, grain, substrate, fruiting, harvest) with checklist, product, mentor lines
- [x] sim/mastery.js: counters, checklist, units after checklist, weekly stats, review builder, verdict (master / repeat)
- [x] stages gate features (replaces week ladder); species-mastered end; seasonWeeks/unlockPace/targetProfit removed
- [x] restructure: gear buying → sim/equipment.js; sim/shop.js = online shop (listings, price vs demand, reputation, refunds)
- [x] farmers market: booth fee, attend toggle, demand cap, quiz kept
- [x] save.js run save/continue (versioned) + migration test
- [x] UI: stage HUD chip + mastery card, weekly review modal (GSAP reveal), online shop sheet, list-in-shop action, market card
- [x] admin: js/admin-help.js (details per knob: what, min, default, max) attached to the verbatim panel; actions Master current stage, Unlock expert; metrics weeksRepeated, revenueByStage
- [x] tests: mastery, shop, save, bot (idle can't master week 1; random < scripted); verify + commit

## Phase 5 — story, tutorial, free play
- [ ] story.js (mentor + forum guru), speech bubbles with ids
- [ ] tutorial.js Week 0 with highlights
- [ ] mode select (Story / Free play / Tutorial / Expert)

## Phase 6 — species + expert + automation
- [ ] lion's mane
- [ ] wine cap (yard bed, weather)
- [ ] expert mode + LC stage
- [ ] optional automation + metrics

## Phase 7 — audio, GSAP polish, art manifest
- [ ] audio-manifest.json, PROMPTS.md, voice-lines.json, gen-voice.mjs (+ voice.config.json, --dry-run)
- [ ] audio.js loader w/ synth fallback; settings volumes
- [ ] GSAP polish pass; images.json species entries (lion's mane, wine cap) + placeholders

## Phase 8 — self-verify
- [ ] no console errors; full loop; admin; zero audio/image files; tests; desktop + mobile touch
