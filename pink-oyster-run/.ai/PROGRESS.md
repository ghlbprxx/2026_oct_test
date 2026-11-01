# Progress log (append-only)

## 2026-11-01 01:10 UTC — Phase 0
- Changed: created .ai/DESIGN.md, PLAN.md, PROGRESS.md, DECISIONS.md.
- Files: pink-oyster-run/.ai/*
- Verified: n/a (notes only).
- Next step: Phase 1, task 1 — git mv the root Walk This Way files into walk-this-way/ and write the root README.md.

## 2026-11-01 01:16 UTC — Phase 1: repo restructure
- Changed: Walk This Way moved to walk-this-way/ (git mv, history kept); root README.md lists both projects; pink-oyster-run/package.json added; manifest test moved to pink-oyster-run/tests/manifest.test.js (still references old paths until the split).
- Files: walk-this-way/**, README.md, pink-oyster-run/package.json, pink-oyster-run/tests/manifest.test.js
- Verified: walk-this-way `npm test` 12/12 pass from the new folder.
- Next step: extract css/styles.css and split the <script> into js/ modules (config-schema, config, content, sim, ui, main).

## 2026-11-01 01:55 UTC — Phase 1 complete: ES modules, no behavior change
- Changed: index.html split into css/styles.css + js/ (config-schema, config [ISF verbatim], main, save, art, images, audio, fx, sim/{cfg,rng,events,clock,environment,contamination,growth,economy,equipment,journal,rules,game}, content/{guide,myths,lessons,species/pink-oyster}, ui/{template,app,views,state}). Sim is pure and talks to the UI through sim/events.js. Embedded manifest + tools/sync-manifest.mjs removed; images.json is fetched, failure → placeholders. index.html shows a message on file:// and if the CDN fails. Profile save is versioned (por:profile v1) with migration from por2-* keys. window.POR debug handle for tests.
- Files: pink-oyster-run/index.html, css/, js/**, tests/*.test.js, package.json, README.md, .ai/*
- Verified: npm test 19/19 (clock, environment, contamination, growth, save + migration, manifest, headless bot: idle ≤ 0, good > sloppy). Playwright: title → play → report, admin panel, mobile 390px, no console errors; missing images.json → placeholders, no crash; file:// → message. Screens match the single-file build.
- Not verified: real CDN load of jsDelivr Vue ESM (sandbox blocks CDNs; tested with the identical npm file).
- Next step: Phase 2 task 1 — clock playback speeds (0/0.5/1/2/4/8×), bioDaysPerGameDay, secondsPerDay 30–600; then research real numbers (web search) before changing CONFIG defaults.

## 2026-11-01 02:05 UTC — Phase 2 prep: number research (no code change)
- Changed: DESIGN.md gained "Researched numbers" (prices, canner capacity, SAB/hood cost and effect, wine cap timing) with confidence levels and proposed knob defaults.
- Flag for the user: Presto 16-qt holds 7 quart jars per HealthyCanning, not ~4 as the brief says; price data for pinks/lion's mane is low-confidence.
- Files: .ai/DESIGN.md, .ai/PLAN.md, .ai/PROGRESS.md
- Verified: n/a (research only).
- Next step: Phase 2 task 1 — js/sim/clock.js playback speeds (0, 0.5, 1, 2, 4, 8×) + time.bioDaysPerGameDay (2.5) + secondsPerDay 180 (30–600); growth durations in CONFIG become real bio days; HUD playback bar with keys `[` `]`; update tests/clock.test.js.

## 2026-11-01 02:55 UTC — Phase 2 sim + UI tasks done (browser check pending)
- Changed: clock.js playback speeds (0.5–8× + pause), toBio/toGame, weeks; secondsPerDay 180 (30–600), bioDaysPerGameDay 2.5. Species biology moved to content/species/pink-oyster.js in real days (plate 7, jar 12, straw 12, saw 16, masters 18, pin 4, grow 4, rest 10, cooker 1, peak 1.5) with per-real-day hazards. Prices $/lb (fresh $14, dried $8/fresh-lb), consumables (plate $1.5, jar $3, SAB $15, bags $3–7), cooker 7 jars. Difficulty picker (Relaxed/Normal/Hardcore: $2,500/$1,500/$800; grace weeks; Relaxed salvage + longer shelf life). Slow start: empty shelves, plates only weeks 0–1, jars wk2, bags wk3, grow room wk4 (closet 72°F before); week-intro cards. Still-air box ($15) = week-1 cleanliness variable; open-air inoculation risk; new lessons open_air, sab. Real-world vs game durations in sheets + notebook timeline. Admin knobs regrouped (time, growth, contam, economy, equipment, room, progression, difficulty, look, dev); actions Skip to week end, +$500. Season default 12 weeks; heater $1/step/game day after the bot check showed 8 weeks + $2 heater lost money.
- Files: js/config-schema.js, js/sim/{clock,stages,environment,contamination,growth,equipment,economy,game,rules}.js, js/content/{species/pink-oyster,lessons,weeks}.js, js/ui/{template,app,views,state}.js, js/main.js, css/styles.css, tests/*.test.js, .ai/*
- Verified: npm test 27/27 (speeds, bio time, recipe colonization ranges, SAB effect, difficulty modes, salvage, week locks, bot: idle ≤ 0, careful > sloppy). Diagnostic bot (careful, 12 weeks): profit +$125..+$352, first harvest ~game day 26.
- Next step: Playwright check of setup → week card → play with playback speeds → locked jar/bag sections → build SAB → week 4 room; mobile 390px; then commit Phase 2.

## 2026-11-01 03:20 UTC — Phase 2 complete
- Changed (since last entry): modal queue (week card + quiz/coffee in one tick no longer overwrite each other); markets start when the grow room opens (no "nothing to sell" spam in weeks 0–3); money() keeps cents under $100; week-aware empty-shelf tip; README + DESIGN updated.
- Files: js/ui/{state,app,views}.js, js/main.js, js/sim/{economy,game}.js, README.md, .ai/*
- Verified: npm test 27/27; Playwright: setup → Normal → week-0 card → SAB build → MEA plate → 8× (0.0697 game days in 1.5 s, matches 1.5×8/180) → pause holds → weeks 2/3/4 cards queue in order → room unlocks; notebook timeline; Relaxed on mobile 390px, no horizontal scroll; no console errors.
- Unverified: feel of 3-minute days (likely slow at 1×; that's what 8× is for), real CDN load.
- Next step: Phase 3 task 1 — design the side-view house cutaway (js/ui/house.js + css): kitchen counter, closet shelf, grow tent, garage, back yard; each zone 2–3 spots with own temp/RH/cleanliness in js/sim/zones.js (pure) replacing g.slots with zone spots; keep keyboard 1–9 mapping across spots.
