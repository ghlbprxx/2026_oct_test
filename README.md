# 2026_oct_test

Browser game projects. Each project lives in its own folder, and each folder has its own README with full details.

| Folder | Project | Summary |
|---|---|---|
| [`times-table-dash/`](times-table-dash/README.md) | **Times Table Dash** | A timed math game for 4th–5th graders: +, −, × and ÷ practice rounds, plus a retro-RPG story mode where each chapter is won by hitting a point goal before time runs out. Vue 3 from a CDN, native ES modules, no build step. |
| [`walk-this-way/`](walk-this-way/README.md) | **Walk This Way** | A gait-matching game: watch a target character walk, then tune body and gait sliders until your character's walk matches. Vue 3 + Three.js from a CDN, no build step; Node tests for the core logic. |

## Running a project
Both projects are static sites that use ES modules, which browsers won't load from `file://`. Serve the project's folder and open the address it prints:

```
cd times-table-dash        # or walk-this-way
python3 -m http.server 8000
```

Walk This Way's core tests run with `npm test` from inside `walk-this-way/`.
