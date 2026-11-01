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
| `js/content/` | Data: field guide, myths, lessons, species biology, zones, equipment, week cards, story script (`story.js`), tutorial steps (`tutorial.js`) |
| `js/director.js` | Pure story director: which scene a sim event triggers in story runs |
| `js/ui/` | Vue template, root component, view helpers, tutorial coach (`coach.js`) |
| `js/art.js`, `js/images.js` | SVG placeholders; image-manifest loader |
| `js/audio.js`, `js/fx.js`, `js/save.js` | Synth SFX; toasts, floats and GSAP motion; versioned profile save |
| `assets/tools/` | `gen-images.mjs` + `image.config.json`: optional image generation from images.json |
| `.ai/` | Working notes: design, plan, progress log, decisions |

## How it plays

**New game:** choose a mode, a play style, then a difficulty.

Modes:
- **Tutorial** (default until you finish it once): story mode plus a walkthrough of week 0. Time stays paused while each step highlights a real part of the screen: the house zones, buying a still-air box, pouring a plate, moving it to the closet, the speed controls, the notebook and the mastery card. Steps that ask you to do something finish when you do it. **Skip tutorial** is always available.
- **Story:** short scenes (up to 3 speech-bubble lines) with your neighbor Dr. Ines Marlow, a retired mycologist, and u/SporeLord_9000, a forum guru who is confidently wrong about half the time. Scenes play at the start, at each new stage, at the first visible mold, before a cold snap, after the coffee-grounds offer, and when you master the species. On market days the myth quiz becomes a guru post: decide whether he's right, and the mentor reacts (grudgingly, when he is).
- **Free play:** the same systems with no script; a market customer asks the myth questions.
- **Expert:** unlocks when you master your first species. For now it's free play without the "Next:" coaching line; the liquid-culture stage arrives with Phase 6.

Every story line has a stable id (`mentor_…`, `guru_…`, `guru_claim_myth_NN`) for the voice manifest planned in Phase 7.

- **Basic** (default, quick play): each choice shows the recommended option first ("Show all options" reveals the rest), a one-tap **Set for pinks** climate button, fixed online prices, the market books itself only when your haul covers the booth fee, essential gear in the shop (the rest under "More gear"), no admin panel, and play starts at 4×.
- **Advanced:** every option: all agar media and preps, price controls, market booking (Auto / Always / Skip), all gear, fine climate sliders, and the admin panel (⚙), which opens on 15 essential knobs with **Show all knobs** for the rest.

Switch any time from the pause menu. Play style changes only the interface; the simulation and its numbers are identical.

Difficulty: pick Relaxed ($2,500; mold can be cut out of jars and bags, produce keeps longer), Normal ($1,500; gentle mold odds in weeks 0–1) or Hardcore ($800; full losses, grace only in week 0).

**Your house, side view.** Every zone has its own temperature, humidity, CO₂ and cleanliness, and a vessel in the wrong zone shows a ⚠ with the reason:

| Zone | Spots | Conditions | What belongs there |
|---|---|---|---|
| Kitchen counter | 2 | ~70°F, dry, busy air (more spores) | Plate work. Your still-air box or flow hood lives here. |
| Closet shelf | 3 | Steady ~72°F, dark, still, cleanest | Incubating plates, jars and bags |
| Grow tent | 3 | You set it: heat mat, fan, mist | Fruiting blocks (bought from week 4) |
| Garage | 2 | Follows the weather, swings ±7°F, cold snaps hit hard | The pressure cooker; cheap storage |
| Back yard | 2 | Outdoors, weather, rain | Wine cap beds (opens at the wine cap “outdoor bed” stage) |

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

**Three species.** Master pink oyster, then press **Start lion’s mane** on the mastery card, then wine cap. Each species starts back at agar; stages you already mastered on an earlier species need half the units. Gear, the online-shop products you opened, and your vessels carry over (each vessel and each harvest keeps its own species, price and shelf life).

| Species | What’s different | Fresh price · keeps |
|---|---|---|
| Pink oyster (*Pleurotus djamor*) | Tropical: fruits at 70–85°F with the heat mat on. Fast, easy to colonize. | $14/lb · ~2.5 days |
| Lion’s mane (*Hericium erinaceus*) | Cool: fruits at 60–70°F (heat mat off; it stalls above ~78°F), loves fresh air, hardwood blocks only (it barely fruits on straw), one big flush. Slower: about 32 real days from bag to harvest. | $20/lb · ~6 days |
| Wine cap (*Stropharia rugosoannulata*) | Outdoors. Agar and grain indoors, then **sawdust spawn** bags, then an **outdoor bed** in the yard: free hardwood chips (best), a straw-only bed (faster, used up after 3 flushes) or pine mulch (conifer resin holds it back). Beds colonize over weeks with the weather, need moisture (rain or tap a dry bed to water it), and flush after wet spells. | $12/lb · ~4 days |

The wine cap **outdoor bed** stage is mastered by keeping beds moist while they colonize (units = real days of a moist, colonizing bed).

**Expert mode** (unlocks after your first species win) adds a **liquid culture** stage after agar on every species. Mix a dilute broth (2% light malt), pressure-cook it, and seed it from a clean plate. One colonized LC seeds six grain jars, which colonize 25% faster. A rich 8% honey “sugar bomb” LC feeds bacteria, hides the infection longer, and passes it to every jar it touches. Expert also hides the “Next:” coaching line, and it keeps the story cast.

**Automation (optional).** Once you master a stage on the species you’re growing, you can switch on that stage’s routine for a weekly fee: lab helper for plates ($3), grain routine ($4), bag routine ($5), climate controller ($3), drip irrigation for beds ($2), harvest crew ($5, also dries and lists surplus online). Fees are paid at each weekly review, which shows the tasks done and the fees paid. It pauses when you start a new species, and turns off if you can’t pay. A fully automated pink farm roughly breaks even: automation buys back attention, not profit.

**Online shop:** list a colonized plate, jar or kit from its spot, set the price with − / +, and it sells over time. Higher prices mean fewer sales; reputation (0–100) multiplies demand. Shipping a hidden infection means a refund and a 1★ review; reputation slowly recovers. **Farmers market:** every 2 game days once fruiting opens. Book the booth ($25, paid only when you bring product). Fresh sells only here, up to 20 lb a day; dried sells here too.

The run autosaves at every weekly review and when you leave the tab; **Continue** on the title screen picks it up.

**Controls:** tap or click a spot. Keys: `1`–`9`, `0`, `-`, `=` spots (left to right, top to bottom on phones) · `Space` pause · `[` `]` slower/faster · `S` shop · `H` heat mat · `D` dehydrate · `N` notebook · `M` mute · `` ` `` admin panel.

**Motion:** GSAP 3.12.5 (pinned, loaded lazily from jsDelivr) animates placing, moving, growth stages, harvests, money changes, mold alarms and week cards; CSS adds tent mist and cooker steam. Everything turns off with reduced motion or the admin panel's `dev.juice`, and if GSAP can't load the game still works.

## Playtesting the economy (headless)

The simulation in `js/sim/` is pure JavaScript with no browser needed. `js/sim/autoplay.js` plays complete games with scripted strategies through the same functions the UI calls: `careful` (good technique, sells online and at market), `marketOnly`, `sloppy`, `random` and `idle`. Print a report:

```bash
node tools/playtest.mjs
```

Options: `--weeks 30`, `--seeds 15`, `--modes normal,hardcore`, `--strategies careful,sloppy`, `--json`, `--start lions-mane` (begin at a later species), `--continue --weeks 70` (the whole pinks → lion’s mane → wine cap journey), `--expert` (with the liquid-culture stage).

Later species and Expert (careful player, Normal): lion’s mane alone is mastered in about 16–21 weeks from a fresh start, wine cap in 15–23. The full journey masters all three species in 4 of 5 runs within 70 weeks, never goes broke, and ends $800–2,400 up. Expert runs master liquid culture by week 4, reach fruiting, and stay solvent. The headless player is weaker at Expert than a person would be (it crowds the closet), so treat those Expert numbers as a floor.

`tests/economy.test.js` turns the important rows into assertions, so `npm test` fails if a tuning change breaks the money. On every difficulty a careful player must master all five stages, never run out of cash, and end in profit, and must beat market-only, sloppy, random and idle play.

Medians from 9 seeds × 24 weeks (profit includes about $460 of gear):

| Difficulty | Strategy | Stages | Lowest cash | Revenue (online / market) | Profit |
|---|---|---|---|---|---|
| Relaxed | careful | 5/5 | ~$1,960 | ~$1,830 (1,420 / 460) | **+$600** |
| Normal | careful | 5/5 | ~$950 | ~$1,650 (1,190 / 430) | **+$380** |
| Hardcore | careful | 5/5 | ~$260 | ~$1,650 (1,170 / 500) | **+$380** |
| Normal | market only | 5/5 | ~$930 | ~$1,030 (0 / 1,030) | about −$100 to −$200 |
| Normal | sloppy | 0/5 | — | $0 | −$22 |
| Normal | random | 1/5 | — | $0 | −$310 |

What the numbers say: the online shop (plates, spawn, grow kits, dried) is where a small home operation makes its money. Fresh pinks rarely last until market day, so market-only growers dry most of their harvest at a lower price. The $60 shelf rack (+3 closet spots) is what lets a grower make enough product to sell.

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

Run it from this folder (Node 18+, no dependencies). It covers playback speeds and compressed time, real-world colonization ranges per recipe, contamination (pasteurized vs sterilized, still-air box, difficulty modes, salvage), the stage ladder, save/migration, the image manifest, the story script rules (≤3 lines per scene, unique voice ids, required story beats), the story director, tutorial steps completing from real actions, headless economy playtests on every difficulty, the three species (data, cool/warm fruiting, beds, rain, skill transfer, the full journey), Expert liquid culture, and automation (unlock, fees, hands-off break-even).

## Design notes

Current design, plan, progress log and decisions live in `.ai/` (DESIGN.md, PLAN.md, PROGRESS.md, DECISIONS.md).
