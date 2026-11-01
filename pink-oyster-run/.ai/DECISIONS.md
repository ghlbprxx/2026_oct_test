# Decisions (one line each: decision — reason)

- 2026-11-01 Root Walk This Way project moved to `walk-this-way/` — matches the folder name another session already used on branch claude/calm-ui-story-mode-r6qdgz, so the repos converge.
- 2026-11-01 ES modules + import map (Vue `vue.esm-browser.prod.js` from jsDelivr, pinned 3.4.21) — brief requires ES modules; jsDelivr serves the npm dist file verbatim. Requires a local server; file:// shows a message.
- 2026-11-01 `CONFIG_SCHEMA` lives in `js/config-schema.js` (pure data), re-exported by `js/config.js` (ISF panel, template verbatim) — node tests can build default config without the DOM-bound panel.
- 2026-11-01 Sim modules take state + config via `sim/cfg.js` (`setConfig`) and randomness via `sim/rng.js` (`setRng`) — keeps `sim/` pure and seedable for tests; the app injects the reactive CONFIG.
- 2026-11-01 Sim → UI communication through an event bus (`sim/events.js`) — sim never touches DOM/Vue/audio; the UI maps events to toasts, SFX, floats, modals, ISF metrics.
- 2026-11-01 Added `sim/game.js` (newGame, update, player actions) beyond the brief's file list — needs a home for orchestration that isn't one subsystem.
- 2026-11-01 Embedded manifest copy + tools/sync-manifest.mjs removed — brief: fetch assets/images.json; on failure use SVG placeholders. ES modules already require a server, so the file:// reason for the copy is gone.
- 2026-11-01 Testing in this sandbox routes the jsDelivr Vue URL to the identical npm tarball file — the sandbox blocks CDNs; shipped code still uses the CDN.
- 2026-11-01 package.json test script is `node --test "tests/*.test.js"`, not `node --test tests/` — Node 22 treats positional args as files/globs and fails on a bare directory; the quoted glob is expanded by Node itself (works on Windows too) and skips tests/helpers.js.
- 2026-11-01 Species biology (durations in real days, per-day hazards, yields, consumable prices) lives in `js/content/species/*.js`; the admin panel exposes ~30 cross-cutting knobs (scales, economy, difficulty) — resolves the brief's "all numbers as knobs" vs "20–30 knobs"; data files stay hand-editable.
- 2026-11-01 Time model: biology (growth, contamination, shelf life, cooker cycle) runs in bio days = game days × time.bioDaysPerGameDay; calendar things (weeks, market days, cold snaps, season) run in game days.
- 2026-11-01 Display units are lb and $/lb (US audience, matches researched prices); internal yields stay kg.
- 2026-11-01 Phase 2 slow start gates systems by week (plates → jars → bags → grow room, every progression.unlockPace weeks). Interim: Phase 4 replaces it with mastery.
- 2026-11-01 Still-air box is a one-time $15 DIY build offered in the build menu (cleanliness = the week-1 variable); Phase 3 folds it into the equipment shop.
- 2026-11-01 Relaxed "soft contamination" = mold on jars/bags can be cut out (keeps difficulty.salvageQuality of yield/uses) instead of tossing.
- 2026-11-01 (user add-on) Images stay optional: assets/tools/gen-images.mjs runs a user-filled command template from assets/tools/image.config.json per missing file; it never guesses fal.ai CLI flags, mirrors the brief's gen-voice.mjs design.
- 2026-11-01 GSAP 3.12.5 via import map ("gsap" → jsDelivr index.js, ESM), loaded with dynamic import() in fx.js so a CDN failure only drops animations; moves across zones animate a fixed-position clone because zones clip overflow.
- 2026-11-01 Season rank uses operating profit (cash change + gear bought); gear is equipment the player keeps — careful-bot season: ~$300 revenue vs ~$430 of gear, so cash profit punished good play. Phase 4 (shop sales of mastered stages) is where the money loop is meant to close.
