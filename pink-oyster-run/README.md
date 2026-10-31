# Pink Oyster Run

You run a tiny pink oyster (*Pleurotus djamor*) farm for one season, from petri dish to market table. It's a rebuild of the original quiz-and-simulator page (`original.html`) as a real-time game. All the cultivation content is still there, but you now learn it by doing it, and by watching what goes wrong when you don't.

- **Stack:** one `index.html`, Vue 3.4.21 from cdnjs, no build step. Placeholder art is generated inline as SVG, so it runs with zero image files.
- **Session:** about 5 to 8 minutes per season. Works on desktop and phones.

## Run it

Open `index.html` in a browser (Vue and fonts load from a CDN, so you need internet), or serve the folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/pink-oyster-run/`.

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
4. If you change `images.json` (paths, new framing numbers), run:

   ```bash
   node pink-oyster-run/tools/sync-manifest.mjs
   ```

   This copies the manifest into `index.html`, so it also works when the page is opened from disk, where the browser blocks reading the JSON. Over http the game reads `images.json` directly.

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

This runs from the repo root. It checks that the manifest is valid, that the embedded copy is in sync, and that every image the game draws has a manifest entry and placeholder art.

## Design notes (ISF pass 1)

- **Direction (chosen at gate 1):** run a tiny mushroom farm · pillars Challenge + Serious fun · casual 5–8 min, mobile-friendly · twist: richness is a gamble.
- **Core loop:** pour → spawn → bag → fruit → pick → sell, then reinvest in richer bags.
- **Bot check (12 seasons each, scripted):** careful sterile rich play has a median of +$65 and a max of +$148 · lean straw is a steadier +$62 median · sloppy play (pasteurized rich mixes, super agar) has a median of −$14 · idle earns $0. Rich play has the higher ceiling, sloppy play loses money, and doing nothing doesn't pay.
- **Not verified:** whether it *feels* fun. That needs a human playtest.
- **Cut from the original:** the situations quiz and the step-by-step simulator, which this game replaces. The field guide, cheat sheet and myths moved into the in-game Notebook; the myths also come up as market-day customer questions.
