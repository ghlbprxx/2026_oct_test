# Decisions (one line each: decision — reason)

- 2026-11-01 Root Walk This Way project moved to `walk-this-way/` — matches the folder name another session already used on branch claude/calm-ui-story-mode-r6qdgz, so the repos converge.
- 2026-11-01 ES modules + import map (Vue `vue.esm-browser.prod.js` from jsDelivr, pinned 3.4.21) — brief requires ES modules; jsDelivr serves the npm dist file verbatim. Requires a local server; file:// shows a message.
- 2026-11-01 `CONFIG_SCHEMA` lives in `js/config-schema.js` (pure data), re-exported by `js/config.js` (ISF panel, template verbatim) — node tests can build default config without the DOM-bound panel.
- 2026-11-01 Sim modules take state + config via `sim/cfg.js` (`setConfig`) and randomness via `sim/rng.js` (`setRng`) — keeps `sim/` pure and seedable for tests; the app injects the reactive CONFIG.
- 2026-11-01 Sim → UI communication through an event bus (`sim/events.js`) — sim never touches DOM/Vue/audio; the UI maps events to toasts, SFX, floats, modals, ISF metrics.
- 2026-11-01 Added `sim/game.js` (newGame, update, player actions) beyond the brief's file list — needs a home for orchestration that isn't one subsystem.
- 2026-11-01 Embedded manifest copy + tools/sync-manifest.mjs removed — brief: fetch assets/images.json; on failure use SVG placeholders. ES modules already require a server, so the file:// reason for the copy is gone.
- 2026-11-01 Testing in this sandbox routes the jsDelivr Vue URL to the identical npm tarball file — the sandbox blocks CDNs; shipped code still uses the CDN.
