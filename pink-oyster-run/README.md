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
| `js/sim/` | Pure simulation (no DOM, no Vue): clock, stages, zones, shop, environment, growth, contamination, economy, equipment (cookers), game |
| `js/content/` | Data: field guide, myths, lessons, species biology, zones, equipment, week cards |
| `js/ui/` | Vue template, root component, view helpers |
| `js/art.js`, `js/images.js` | SVG placeholders; image-manifest loader |
| `js/audio.js`, `js/fx.js`, `js/save.js` | Synth SFX; toasts, floats and GSAP motion; versioned profile save |
| `assets/tools/` | `gen-images.mjs` + `image.config.json`: optional image generation from images.json |
| `.ai/` | Working notes: design, plan, progress log, decisions |

## How it plays

**New game:** pick Relaxed ($2,500; mold can be cut out of jars and bags, produce keeps longer), Normal ($1,500; gentle mold odds in weeks 0–1) or Hardcore ($800; full losses, grace only in week 0).

**Your house, side view.** Every zone has its own temperature, humidity, CO₂ and cleanliness, and a vessel in the wrong zone shows a ⚠ with the reason:

| Zone | Spots | Conditions | What belongs there |
|---|---|---|---|
| Kitchen counter | 2 | ~70°F, dry, busy air (more spores) | Plate work. Your still-air box or flow hood lives here. |
| Closet shelf | 3 | Steady ~72°F, dark, still, cleanest | Incubating plates, jars and bags |
| Grow tent | 3 | You set it: heat mat, fan, mist | Fruiting blocks (bought from week 4) |
| Garage | 2 | Follows the weather, swings ±7°F, cold snaps hit hard | The pressure cooker; cheap storage |
| Back yard | 2 | Outdoors | Wine cap beds (a later species) |

Tap a vessel to see its zone's verdict and move it (moves animate between rooms). Exact readings need a hygrometer and a CO₂ monitor; without them you only get "warm / dry air / stale air".

**The shop** (approximate US prices): still-air box $15 (DIY tote), flow hood $900 (week 6+), pressure cooker 16 qt $100 (7 jars) or 23 qt $150 (7 jars or 2 grow bags; needed to sterilize bags), scale $25, impulse sealer $60, grow tent $90, heat mat $30, humidifier $45, hygrometer $12, CO₂ monitor $120, dehydrator $60. Each item changes what you can do or your odds; none is a flat "+X%".

**Stages, one per week (or more).** Each week ends with a **weekly review**: money in and out, clean rate, good plates/jars/bags, harvest and rot, mold causes with lesson cards, 2–3 tips, a word from the mentor, and a verdict. A stage is mastered in two steps, in order: the mentor's checklist, then a number of good units (counted only after the list is done). Not mastered means you repeat the week, with no penalty beyond time and costs. Everything earlier keeps running as your pipeline.

| Stage | Checklist (then units) | Opens | Sells online once mastered |
|---|---|---|---|
| Agar | 3 plates poured in a still-air box; a plate colonized in the closet (then 3 clean plates) | plates | Agar culture plates |
| Grain spawn | 2 jars pressure-cooked; a jar spawned from a clean plate; a jar shaken (then 2 clean jars) | grain jars | Grain spawn |
| Substrate | 2 bags prepped the right way; a bag spawned from a clean jar (then 2 clean bags) | substrate bags | Colonized grow kits |
| Fruiting | a block moved into the tent; a real day at 70–85°F and 85–95% RH (then 2 good peak harvests) | grow tent, farmers market | — |
| Harvest & market | sell fresh at a market; dehydrate a surplus (then 6 lb sold fresh) | — | Dried pinks |

**Online shop:** list a colonized plate, jar or kit from its spot, set the price with − / +, and it sells over time. Higher prices mean fewer sales; reputation (0–100) multiplies demand. Shipping a hidden infection means a refund and a 1★ review; reputation slowly recovers. **Farmers market:** every 2 game days once fruiting opens. Book the booth ($25, paid only when you bring product). Fresh sells only here, up to 20 lb a day; dried sells here too.

The run autosaves at every weekly review and when you leave the tab; **Continue** on the title screen picks it up.

**Controls:** tap or click a spot. Keys: `1`–`9`, `0`, `-`, `=` spots (left to right, top to bottom on phones) · `Space` pause · `[` `]` slower/faster · `S` shop · `H` heat mat · `D` dehydrate · `N` notebook · `M` mute · `` ` `` admin panel.

**Motion:** GSAP 3.12.5 (pinned, loaded lazily from jsDelivr) animates placing, moving, growth stages, harvests, money changes, mold alarms and week cards; CSS adds tent mist and cooker steam. Everything turns off with reduced motion or the admin panel's `dev.juice`, and if GSAP can't load the game still works.

## Images (optional): generating them with fal.ai or any CLI

The game ships with built-in placeholder art for every picture, so image files are optional. All 40 images are listed in **`assets/images.json`**: object art, five zone backgrounds, twelve equipment icons, and portraits of the mentor and the forum guru. Each entry has a file path, size, background, and a prompt. **`assets/IMAGE_PROMPTS.md`** has every assembled prompt ready to copy and paste.

**With your fal.ai CLI:**

1. Open `assets/tools/image.config.json` and set `command` to your CLI as an argv array. Use the tokens `{prompt}`, `{negative}`, `{file}`, `{width}`, `{height}`, `{aspect}`, `{id}` and `{background}`. The `shape` entry shows where they go; its flags are placeholders, not real fal.ai flags.
2. Optional: set `editCommand` to an image-to-image command that takes `{ref}`. It's used for images that must line up with another one (`alignWith`, e.g. the colonized plate over the empty plate).
3. Preview what will run:

   ```bash
   node assets/tools/gen-images.mjs --dry-run
   ```

4. Generate every missing file (add `--only id1,id2` for a few, `--force` to redo):

   ```bash
   node assets/tools/gen-images.mjs
   ```

5. Reload the game. **Notebook › Art** shows which files it found, and the admin panel's `look.customImages` toggles back to the placeholders to compare.

If your CLI prints a URL instead of saving a file, wrap it in a tiny script that downloads to the `{file}` path and point `command` at that script. After editing `images.json`, refresh the prompt list:

```bash
node assets/tools/gen-images.mjs --write-md
```

**How the full prompt is built:** a style preset (`stylePrompt`, or `styles.scene` / `styles.portrait` for rooms and characters), then the image's own prompt, its framing, and the transparent/opaque suffix. "Colonized" images reveal over their empty twin with a growing mask; the `reveal` numbers in the JSON say where, so adjust them instead of regenerating if your framing differs.

## Tuning (admin panel)

Press `` ` `` or tap ⚙. Every knob has an ⓘ line under it: click it for what the knob does and what happens at its minimum, default and maximum (or use **Help: open all**). The values are live, grouped by system, and persist in your browser. **Copy report** gives you the config diff plus play metrics (runs, profit, what killed vessels). Set `ADMIN_ENABLED = false` in `index.html` for a release build.

Tune these first:

- `time.secondsPerDay` (and `time.bioDaysPerGameDay`) set the pace.
- `shop.priceScale` sets how hard gear choices are (with each difficulty's starting cash).
- `contam.hazardScale` and `contam.sabFactor` set how hard mold bites and how much the still-air box helps.

## Tests

```bash
npm test
```

Run it from this folder (Node 18+, no dependencies). It covers playback speeds and compressed time, real-world colonization ranges per recipe, contamination (pasteurized vs sterilized, still-air box, difficulty modes, salvage), the week-by-week unlocks, save/migration, the image manifest, and a headless bot check (idle play earns nothing; careful play beats sloppy play).

## Design notes

Current design, plan, progress log and decisions live in `.ai/` (DESIGN.md, PLAN.md, PROGRESS.md, DECISIONS.md).
