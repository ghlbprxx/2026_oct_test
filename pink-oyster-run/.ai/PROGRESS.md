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

## 2026-11-01 04:40 UTC — Phase 3 complete (+ animations, optional image generation)
- Changed: content/zones.js + sim/zones.js (5 zones, 12 spots, per-zone env, zoneFit reasons, move); content/equipment.js + sim/shop.js (12 items; workspace open/SAB/hood; cookers 16 qt 7 jars / 23 qt 7 jars or 2 bags; scale/sealer odds; hygrometer/CO₂ gate readings; dehydrator gates drying); equipment.js multi-cooker loading; house cutaway UI, spot info bar, shop sheet, move list, zone-aware tips; GSAP fx (lazy, optional) + CSS ambient; 19 new images.json entries (zones, gear, portraits) with style presets + SVG placeholders; assets/tools/gen-images.mjs + image.config.json + assets/IMAGE_PROMPTS.md; operating-profit ranking.
- Files: js/content/{zones,equipment,weeks,lessons}.js, js/sim/{zones,shop,equipment,environment,contamination,growth,game,economy,rules}.js, js/config-schema.js, js/ui/{template,app,views,state}.js, js/fx.js, js/main.js, js/art.js, css/styles.css, index.html (gsap import map), assets/images.json, assets/IMAGE_PROMPTS.md, assets/tools/*, tests/{zones,shop,bot,growth,contamination}.test.js, README.md, .ai/*
- Verified: npm test 39/39 (zones env/locks/fit/move, closet fruiting yields <60% of tent, shop rules, workspace odds, cooker capacities, scale/sealer, dehydrator gate, bot: idle $0, careful revenue ≫ sloppy). Playwright desktop + 390px mobile: shop, buy, pour, move (GSAP clone flight fixed), week-4 tent kit, wrong-zone warning, no console errors, zero image files. gen-images: --dry-run, --write-md, refuses to run without a command.
- Known: careful-bot season = ~$300 revenue vs ~$430 gear (money loop closes in Phase 4 via shop sales). Knob count 33 (+6 dev), slightly over the 20–30 target.
- Next step: Phase 4 task 1 — js/sim/stages.js + js/sim/mastery.js: per-stage mentor checklist (e.g. "pour 3 plates in the still-air box", "catch mold on agar before it reaches grain") then N good units; Weekly Review pause at each week end replacing the week-unlock ladder.

## 2026-11-01 05:00 UTC — Phase 4 started
- User asked: admin options need concise descriptions incl. what happens at min / avg / max, in a details tag; then Phase 4.
- Plan: build Phase 4 sim first (it removes seasonWeeks/unlockPace/targetProfit and adds shop/market knobs), then write help for the final knob set.
- Next step: content/stages.js + sim/mastery.js.

## 2026-11-01 06:30 UTC — Phase 4 complete (+ admin help)
- Changed: content/stages.js (ladder, checklists, products, mentor lines); sim/mastery.js (counters, checklist → units, weekly review, verdict, forceMaster); sim/stages.js (stage-gated opens); gear → sim/equipment.js; sim/shop.js online shop (list, price, demand, reputation, refunds, recovery); economy market (booth fee, attend toggle, 20 lb cap); save.js run autosave/continue v2 + migration; UI: stage chip, mastery card, online shop card, list action, market toggle, weekly review modal (mentor bubble, GSAP reveal), stage intro after review, Continue; admin: config-help.js + admin-help.js (details per knob: what/min/default/max, Help: open all), actions Master current stage / Unlock expert, per-week runEnd metrics. Removed knobs seasonWeeks, unlockPace, targetProfit; added shop.demand/elasticity/stageMult/startReputation/refundHit/recovery, economy.boothFee, progression.unitsScale.
- Files: js/content/{stages,lessons,equipment}.js, js/sim/{mastery,stages,shop,equipment,economy,game,growth,clock,rules,contamination}.js, js/{save,config-schema,config-help,admin-help,main,fx,audio}.js, js/ui/{app,template,state,views}.js, css/styles.css, tests/{mastery,webshop,equipment,save,bot,growth,admin-help}.test.js, README.md, .ai/*
- Verified: npm test 52/52 (mastery order, review → next stage, agar masterable by sensible play in ≤5 weeks, idle can't master week 1, random bot ≪ scripted, shop price/demand/reputation/refunds, market fee/cap, run save round-trip + migration, every knob has help). Playwright: review modal order fixed (review then stage card), list-in-shop action, admin help blocks (44), Continue after reload, mobile 390px, no console errors.
- Known: scripted careful bot that sells only at market nets ~$360 revenue vs ~$430 gear per 12 weeks; online listings (not used by the bot) are the intended profit path, unmeasured. 44 knobs (+6 dev) vs the 20–30 target.
- Next step: Phase 5 task 1 — content/story.js (mentor + forum guru scenes, ≤3 lines, ids), speech-bubble component with portraits; forum guru delivers market quizzes.

## 2026-11-01 06:45 UTC — Phase 4.5 started (user request)
- Ask: extract simulation so tests prove playability and that money works at each level; Basic vs Advanced mode so quick play isn't overwhelming.
- Next step: js/sim/autoplay.js strategies + tools/playtest.mjs; measure; tune; then UI modes.

## 2026-11-01 07:40 UTC — Phase 4.5 complete (playtest harness + Basic/Advanced)
- Changed: js/sim/autoplay.js, tools/playtest.mjs, tests/economy.test.js (bot.test.js removed); rack gear + per-spot locks; marketMode auto/book/skip + haulWorthIt; species-done no longer re-masters; Basic/Advanced play style (setup + pause menu), basic-only filtered build menu/shop, Set for pinks, admin panel hidden in Basic, essentials filter in Advanced; gear_rack art + manifest entry.
- Verified: npm test 58/58; playtest table (README + DESIGN); Playwright: Basic default hides admin, starts 4×, build menu 1 medium / 2 bag rows / 2 buttons, Show all → 3 / 4; shop 8 vs 13 items; switch to Advanced shows admin with 15 essential rows; no console errors.
- Next step: Phase 5 task 1 — content/story.js (mentor + forum guru scenes, ≤3 lines, ids), speech-bubble component with portraits; forum guru delivers market quizzes.

## 2026-11-01 07:55 UTC — Handoff written
- Changed: .ai/HANDOFF.md (state, how to run/test, sandbox gotchas, architecture map, conventions, economy invariants, Phase 5 plan, open questions); PLAN.md points to it.
- Verified: npm test 58/58 at handoff time.
- Next step: Phase 5 task 1 — js/content/story.js (mentor + forum guru scenes with ids).

## 2026-11-01 03:04 UTC (system clock; earlier entries' times run ahead of it) — Phase 5 complete (story, tutorial, mode select)
- Changed: js/content/story.js (cast, 10 scenes, guru opener/reaction lines, all id'd), js/director.js (pure: run types, once-only scenes, event → scene, guru quiz framing), js/content/tutorial.js (7 steps, done(g) for action steps), js/ui/coach.js (highlight ring, card placement, auto-advance, finish/skip); myths get ids; sim: newGame(mode, runType), `forecast` event; save: run v3 (runType, story.seen), profile.tutorialDone; UI: mode select on setup, dialogue bar modal (one line at a time, Skip), guru quiz variant with mentor reaction, coach overlay, Expert hides the Next: line, expert unlocks on species win, admin action "Reset tutorial".
- Files: js/content/{story,tutorial,myths}.js, js/director.js, js/ui/{coach,app,state,template}.js, js/main.js, js/sim/game.js, js/save.js, css/styles.css, tests/{story,save}.test.js, README.md, .ai/*
- Verified: npm test 65/65; node tools/playtest.mjs unchanged; Playwright desktop 1280 + mobile 390 (touch): tutorial end to end (time frozen during steps, all 7 steps, action steps advance from real clicks, clock runs after), intro scene 3 lines with ids, guru quiz + mentor reaction, review → stage_grain scene → week card order, Skip; free play + Advanced: no scenes, customer quiz, admin panel shown; species win unlocks Expert; Expert run hides Next:. No console errors.
- Fixed during verification: the "Read the room" ring pointed at the kitchen move option (now the closet); on 390px the coach card covered its own target (now placed on the free side, scrolls target clear); toasts covered the coach card and then the speed-bar ring (toasts move up or to mid-screen while the coach shows).
- Unverified: real CDN loading (sandbox), screen readers on the dialogue bar, how the guru's tone lands with players.
- Next step: Phase 6 task 1 — lion's mane species (content/species/lions-mane.js, stage ladder reuse, species select after pinks).

## 2026-11-01 03:19 UTC — Phase 6 checkpoint: species sim (lion's mane, wine cap) — UI not yet
- Changed: content/species/{index,lions-mane,wine-cap}.js (+ PACK in pink-oyster.js); per-species ladders in content/stages.js (LADDERS, ladderOf); vessels carry v.sp, lots carry l.sp; env/growth/contamination/economy look species up per vessel/lot; g.species, speciesMastered, masteredBy, countsBy; startSpecies(); wine cap beds (buildBed, water, rain, stepBed); unitsNeeded halves for stages mastered on an earlier species (RULES.transferUnits); 3 lessons; run save v4; autoplay: start / continueSpecies options and species-aware careful play.
- Verified: npm test 75/75 (tests/species.test.js); playtest table for pinks byte-identical to before the refactor; full journey bot (70 wks): 4/5 seeds master all three species, never broke, cash profit $800–2,400.
- Next step: UI for species (HUD/notebook/build menu per species, yard beds sheet, "Start next species" button, stage modal per ladder, species art tint, story scenes).

## 2026-11-01 03:33 UTC — Phase 6 complete (species, Expert LC, automation)
- Changed since the checkpoint: species UI (HUD species + ladder, per-species build menu/notebook/timeline/climate preset, yard bed menu + watering, Start-next-species, species intro cards, species story scenes incl. arborist chips before wine cap and an LC scene, CSS species tint, bed art); Expert: LC_STAGE inserted by ladderOf(species, true), openings by stage id (OPENS_BY/opensIndex), prepLC + LC_MEDIA (dilute/rich), lesson rich_lc, LC art; automation: content/automation.js, sim/automation.js, card + review line + runEnd metrics; playtest CLI --start/--continue/--expert; Expert keeps the story cast.
- Files: js/content/{automation,stages,story,weeks,lessons,zones}.js, js/content/species/*, js/sim/{automation,game,growth,contamination,economy,environment,zones,stages,mastery,shop,autoplay,rules}.js, js/ui/{app,template,views}.js, js/{main,director,art,save}.js, css/styles.css, assets/images.json + IMAGE_PROMPTS.md, tools/playtest.mjs, tests/{species,expert,automation,story}.test.js, README.md, .ai/*
- Verified: npm test 84/84; pink playtest table byte-identical to Phase 5; headless: full journey masters 3 species in 4/5 runs (70 wks), never broke; Expert masters LC by week 4 in all runs; automation hands-off pink farm nets −$150..+$30 over 15 weeks. Playwright desktop 1280 + 390px: species switch (scene → card), LM warm-tent warning + Set for lion's mane (heat 0/fan 7/mist 104), yard bed build → inoculate → dry tip → water → pick, Expert LC menu/facts/stage scene/card, automation toggle + fee + review line, Phase 5 tutorial regression; no console errors, no horizontal scroll.
- Unverified / known: real CDN load; headless Expert player is weak at the grain stage (crowds the closet with LC jars), so Expert numbers are a floor; lion's mane harvest stage is slow from a fresh start (~10 weeks; real biology, halved when continuing from pinks); no species-specific art yet (tinted pink art).
- Next step: Phase 7 task 1 — audio manifest + voice-lines.json generated from content/story.js allLines() + MENTOR + guru claims.
