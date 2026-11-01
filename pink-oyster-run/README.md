# Pink Oyster Run

You're learning to grow gourmet mushrooms at home, starting with pink oysters (*Pleurotus djamor*). The game opens one part of the craft per week, from agar plates to grain spawn to substrate to the grow room, and every loss is explained with a lesson card. It began as a quiz-and-simulator page (`original.html`) and is being rebuilt in phases; see `.ai/PLAN.md` for where it stands.

- **Stack:** ES modules, Vue 3.4.21 (pinned ESM build from jsDelivr), no build step. Placeholder art is generated inline as SVG, so it runs with zero image files.
- **Pacing:** 1 game day takes 3 real minutes at 1× (playback 0.5× to 8×, pause any time). A week is 5 game days. Biology is compressed: 1 game day ≈ 2.5 real growing days, and the game always shows real-world durations next to game time.

## Run it

ES modules don't load from `file://`, so serve this folder (the page tells you this if you open the file directly):

```bash
npx serve .
```

Or use `python3 -m http.server 8000` and open `http://localhost:8000`. You need internet the first time, for Vue and the fonts.

## Code layout

| Path | What's there |
|---|---|
| `index.html` | Shell: import map, `file://` / CDN-failure messages, loads `js/main.js` |
| `css/styles.css` | Design tokens, dark mode, layout |
| `js/main.js` | Boot, sim-event → UI wiring, game loop, keyboard, admin hooks |
| `js/config-schema.js`, `js/config.js` | Tuning knobs; the ISF admin panel (template verbatim) |
| `js/sim/` | Pure simulation (no DOM, no Vue): clock, environment, growth, contamination, economy, equipment, game |
| `js/content/` | Data: field guide, myths, lessons, species recipes |
| `js/ui/` | Vue template, root component, view helpers |
| `js/art.js`, `js/images.js` | SVG placeholders; image-manifest loader |
| `js/audio.js`, `js/fx.js`, `js/save.js` | Synth SFX; toasts/floats; versioned profile save |
| `.ai/` | Working notes: design, plan, progress log, decisions |

## How it plays

**New game:** pick Relaxed ($2,500; mold can be cut out of jars and bags, produce keeps longer), Normal ($1,500; gentle mold odds in weeks 0–1) or Hardcore ($800; full losses, grace only in week 0).

| Week | What opens | What it teaches |
|---|---|---|
| 0–1 | Agar plates, in a steady 72°F closet | Cleanliness. Plates poured on the open counter catch spores; a $15 DIY still-air box cuts that sharply. MEA vs super agar (fast, hides mold) vs CMA (slow, shows mold). |
| 2 | Grain jars + pressure cooker (7 quart jars per load) | Grain must be pressure-cooked. Shake at about a third. Spawning from a moldy (or secretly moldy) plate carries it downstream. |
| 3 | Substrate bags (coir, straw, sawdust + bran, Masters Mix) | Richer mixes yield more, mold more and colonize slower (straw 10–14 days, supplemented 14–21). Rich mixes must be sterilized; plain straw does worse sterilized. |
| 4+ | The grow room (heater, fresh air, mist) and market days | Pinks won't pin below ~64°F. Stale air gives leggy clusters, dry air cracks caps. Fresh pinks last 1–3 days: sell or dehydrate. |

The season ends after 12 weeks with a closing market and a report. Prices are in $/lb (fresh $14/lb; see `.ai/DESIGN.md` for how confident the researched numbers are).

**Controls:** tap or click a shelf. Keys: `1`–`9` shelves · `Space` pause · `[` `]` slower/faster · `H` heater · `D` dehydrate · `N` notebook · `M` mute · `` ` `` admin panel.

## Replacing the art with AI-generated images

Everything is driven by **`assets/images.json`**. Each of its 21 entries has:

| Field | Meaning |
|---|---|
| `id` | Name the game uses internally |
| `file` | Where to save the image, relative to `index.html` (e.g. `assets/img/cluster_peak.png`) |
| `width`, `height` | Size to generate (or a larger size with the same aspect ratio) |
| `background` | `transparent` or `opaque`; selects the `backgroundSuffix` to append |
| `prompt` | Subject description |
| `framing` | Where the subject must sit on the canvas |
| `alignWith` | This image is layered over another one, so make it by **editing** that image (img2img / inpaint) to keep the outlines lined up |
| `reveal` | The area the colonization mask sweeps over; adjust these numbers if your art is framed differently |

**Full prompt** = `stylePrompt` + `prompt` + `backgroundSuffix[background]`, plus `negativePrompt` where your generator supports one.

Workflow:

1. Generate each entry and save it at its `file` path. Do the non-`alignWith` ones first.
2. Reload the game. Any missing file falls back to placeholder art, so you can replace images one at a time.
3. Check **Notebook › Art** in the game to see which files it found. You can also flip `look.customImages` in the admin panel to compare against the placeholders.
4. Edits to `images.json` (paths, framing numbers) take effect on reload. If the JSON is missing or invalid, the game says so in Notebook › Art and uses placeholders for everything.

## Tuning (admin panel)

Press `` ` `` or tap ⚙. The values are live, grouped by system, and persist in your browser. **Copy report** gives you the config diff plus play metrics (runs, profit, what killed vessels). Set `ADMIN_ENABLED = false` in `index.html` for a release build.

Tune these first:

- `time.secondsPerDay` (and `time.bioDaysPerGameDay`) set the pace.
- `progression.unlockPace` sets how slow the slow start is.
- `contam.hazardScale` and `contam.sabFactor` set how hard mold bites and how much the still-air box helps.

## Tests

```bash
npm test
```

Run it from this folder (Node 18+, no dependencies). It covers playback speeds and compressed time, real-world colonization ranges per recipe, contamination (pasteurized vs sterilized, still-air box, difficulty modes, salvage), the week-by-week unlocks, save/migration, the image manifest, and a headless bot check (idle play earns nothing; careful play beats sloppy play).

## Design notes

Current design, plan, progress log and decisions live in `.ai/` (DESIGN.md, PLAN.md, PROGRESS.md, DECISIONS.md).
