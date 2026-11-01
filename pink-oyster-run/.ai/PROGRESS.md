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
