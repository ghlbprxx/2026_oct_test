# Pink Oyster Run

You run a tiny pink oyster (*Pleurotus djamor*) farm for one season, from petri dish to market table. It's a rebuild of the original quiz-and-simulator page (`original.html`) as a real-time game. All the cultivation content is still there, but you now learn it by doing it, and by watching what goes wrong when you don't.

- **Stack:** ES modules, Vue 3.4.21 (pinned ESM build from jsDelivr), no build step. Placeholder art is generated inline as SVG, so it runs with zero image files.
- **Session:** about 5 to 8 minutes per season. Works on desktop and phones.

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

| Stage | What you do | What it teaches |
|---|---|---|
| Plate | Pour MEA, super agar or CMA from a clean slant | Agar's job is **detection**. Super agar is twice as fast but hides mold; CMA is slow but shows mold right away. |
| Grain jar | Pressure-cook (waits for the cooker) or pasteurize (quick) | Grain is too rich to pasteurize. |
| Bag | Coir, straw, sawdust + bran or Masters Mix, sterilized or pasteurized | **The twist:** richer mixes give bigger flushes, more mold, and need the cooker, which is the bottleneck. Plain straw does *worse* sterilized. |
| Fruiting | Heater, fresh air and mist apply to the whole room | Below ~64°F pinks won't pin. Stale air gives leggy clusters; dry air cracks caps; too humid invites bacteria. |
| Harvest | Pick at peak, dehydrate, sell on market days | Fresh pinks last ~2 days. Plan for 1–2 flushes. |

Spawn from moldy (or secretly moldy) cultures and the contamination follows downstream. One plate feeds 3 jars, and one jar feeds 2 bags. Every loss is pinned to a cause and a lesson, which shows in the toast, the log and the season report, and is collected in the Notebook.

**Controls:** tap or click a shelf. Keys: `1`–`9` shelves · `Space` pause · `H` heater · `D` dehydrate · `N` notebook · `M` mute · `` ` `` admin panel.

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

- `time.secondsPerDay` sets the pace.
- `contam.bagScale` controls how hard the richness gamble bites.
- `economy.shelfLife` and `economy.marketEvery` control how much pressure the rot clock puts on you.

## Tests

```bash
npm test
```

Run it from this folder (Node 18+, no dependencies). It covers the clock, environment, contamination, growth, save/migration, the image manifest, and a headless bot check (idle play earns nothing; careful play beats sloppy play).

## Design notes (ISF pass 1)

- **Direction (chosen at gate 1):** run a tiny mushroom farm · pillars Challenge + Serious fun · casual 5–8 min, mobile-friendly · twist: richness is a gamble.
- **Core loop:** pour → spawn → bag → fruit → pick → sell, then reinvest in richer bags.
- **Bot check (12 seasons each, scripted):** careful sterile rich play has a median of +$65 and a max of +$148 · lean straw is a steadier +$62 median · sloppy play (pasteurized rich mixes, super agar) has a median of −$14 · idle earns $0. Rich play has the higher ceiling, sloppy play loses money, and doing nothing doesn't pay.
- **Not verified:** whether it *feels* fun. That needs a human playtest.
- **Cut from the original:** the situations quiz and the step-by-step simulator, which this game replaces. The field guide, cheat sheet and myths moved into the in-game Notebook; the myths also come up as market-day customer questions.
