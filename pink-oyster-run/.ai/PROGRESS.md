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
