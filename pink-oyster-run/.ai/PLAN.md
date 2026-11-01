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
- [ ] clock: playback 0/0.5/1/2/4/8×, bioDaysPerGameDay, secondsPerDay range 30–600
- [ ] research + fix numbers (prices, colonization per recipe, jars, rest, shelf life)
- [ ] difficulty picker (Relaxed/Normal/Hardcore) in CONFIG
- [ ] remove stocked bench; Week 0/1 slow start (one zone, one vessel type, cleanliness only)
- [ ] real-world durations in UI + notebook

## Phase 3 — zones + equipment shop
- [ ] side-view cutaway (kitchen, closet, tent, garage, yard), spots, per-zone env
- [ ] wrong-zone consequences + explanations
- [ ] equipment shop (SAB, flow hood, cookers 16/23 qt, tent, humidifier, heater, hygrometer, CO₂ monitor, dehydrator, etc.)

## Phase 4 — ladder, weekly review, mastery, shop, market
- [ ] stages.js + mastery.js (checklist → N units)
- [ ] weekly review screen
- [ ] online shop listings, price vs demand, reputation
- [ ] farmers market (booth fee, quiz)

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
- [ ] GSAP fx; images.json new entries + SVG placeholders

## Phase 8 — self-verify
- [ ] no console errors; full loop; admin; zero audio/image files; tests; desktop + mobile touch
