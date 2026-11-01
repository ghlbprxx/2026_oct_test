# 2026_oct_test

Browser games, one per folder. None needs a build step, but both use ES modules, so serve the folder over http instead of opening the file directly.

| Project | What it is | Run it |
|---|---|---|
| [walk-this-way/](walk-this-way/) | Gait-matching game: tune a 3D walker's body and gait sliders until it matches a target's walk (Vue 3 + Three.js). | `cd walk-this-way && python3 -m http.server 8000`, then open http://localhost:8000. Tests: `npm test`. |
| [pink-oyster-run/](pink-oyster-run/) | Home mushroom-growing game: master each cultivation stage week by week and sell what you grow (Vue 3). | `cd pink-oyster-run && npx serve .` (or `python3 -m http.server 8000`), then open the printed URL. Tests: `npm test`. |
