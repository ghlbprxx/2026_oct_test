# Asset prompts: story mode

Every asset here is optional. The game already runs without any of them:
- **Portraits:** missing ones show the character's emoji.
- **Chapter backdrops:** missing ones show a drawn sky and ground.
- **Sounds:** missing ones play soft chiptune synth bleeps.
- **Music:** missing story tracks fall back to the game's existing menu and play music.

Save each file at the path shown and it's picked up on the next page load. No code changes are needed. The paths are listed in `js/data/stories.js` (cast, backdrops, music) and `js/data/assets.js` (sound effects).

**Audience:** 5th graders (ages 10–11). Aim for "cool retro adventure", not "baby cartoon". Use bold characters, a bit of attitude and clear silhouettes, and keep it friendly, never scary.

---

## Images: Gemini (Nano Banana)

**Format:** save as `.png` (what Gemini gives you) or `.webp` (smaller).

**Keep the look consistent:**
1. Start every prompt with the style line below.
2. Generate Kazu first.
3. For every other image, attach the Kazu image and add "match the art style of the attached image."

> **Style line:** 16-bit SNES-era pixel art, JRPG adventure style, crisp visible pixels, limited palette, bold readable silhouette, soft lighting, appealing to 10–11 year olds, no text, no letters, no numbers, no UI, no logos, no watermark.

### Portraits: 512×512 square, `art/portraits/<name>.png`
Shown at 64px in the dialogue box and about 96px in battles, so use a head-and-shoulders crop, one character only, and a plain flat background in the listed color.

| File | Prompt (after the style line) |
|---|---|
| `kazu.png` | Head-and-shoulders portrait of Kazu, a young fox-cat hero with orange fur, cream chest and cheeks, sharp purple eyes, pointed ears with pink insides, and a red headband with a small white "×" badge whose ends flutter. Confident, determined half-smile. Facing slightly right. Flat warm-orange background (#f2b06a). |
| `mimi.png` | Head-and-shoulders portrait of Mimi, a clever white rabbit with long ears (one bent), a pink bow, round glasses pushed up on her head, and a small satchel strap. Excited, quick-thinking expression. Facing slightly left. Flat soft-pink background (#f2c4cf). |
| `tanuki.png` | Head-and-shoulders portrait of Grandpa Tanuki, a round, jolly old tanuki shopkeeper with a white baker's cap, tiny round glasses, a bushy gray mustache, and a flour-dusted apron. Warm, laughing expression. Flat warm-tan background (#b8a48c). |
| `hoot.png` | Head-and-shoulders portrait of Professor Hoot, a wise owl mentor with brown and cream feathers, round spectacles, a small graduation cap with a tassel, and a dark-green scarf. Calm, knowing expression, one wing raised as if explaining. Flat light-tan background (#c9b38f). |
| `gusty.png` | Head-and-shoulders portrait of Gusty, a mischievous wind sprite made of swirling pale-blue air, with a puffy cloud body, a cheeky grin, bright mischievous eyes, and leaves caught in the swirl. Playful troublemaker, not scary. Flat pale-sky-blue background (#bcd6e8). |
| `golem.png` | Portrait of the Times Golem, a huge stone guardian whose body is built from carved stone blocks with faint glowing multiplication-sign runes (×) on its chest, mossy shoulders, and two glowing amber eyes. Stern but not frightening. Flat warm-gray background (#b9b2a6). |
| `riku.png` | Head-and-shoulders portrait of Riku, a sleek, cocky young raven rival with glossy blue-black feathers, a red scarf, a swoop of head feathers like a hairstyle, and a smug grin. Competitive, show-off energy. Flat slate-blue background (#8f9bb8). |
| `calculo.png` | Head-and-shoulders portrait of Count Calculo, a theatrical clockwork villain: a tall purple-cloaked figure with a high collar, a pocket-watch monocle, a waxed curly mustache, and gears visible in a top hat. Dramatic, scheming smile, more comical than evil. Flat lavender background (#c7a0d8). |

### Chapter backdrops: 1280×640 (2:1 wide), `art/story/<chapter-id>.png`
These sit behind the title card and the dialogue, and a "Chapter 1" tag covers the top-left corner. Keep the center and that corner fairly open, and show no characters, only the scenery.

| File | Prompt (after the style line) |
|---|---|
| `bridge.png` | Wide side-view scene of a broken wooden bridge over a rushing river at sunset, with missing planks floating in the water, cherry-blossom trees on both banks, and a tall clock tower far in the distance. Open sky in the middle. |
| `gale.png` | Wide side-view scene of a windswept grassy hilltop: grass bending hard, leaves, paper lanterns and picnic napkins swirling through the air, a small whirlwind on the right, streaky clouds, the clock tower on the horizon. |
| `market.png` | Wide scene of a lively Japanese-style town market street at midday: wooden stalls with striped awnings, baskets of fruit and buns, scattered price tags blowing around, paper lanterns overhead, a little chaotic and fun. |
| `tower.png` | Wide side-view scene of the base of a towering stone clock tower: a huge carved stone door with faint glowing × runes, steps leading up, stone pillars, twilight sky, a hint of purple magic in the air. |
| `lanterns.png` | Wide scene inside a dark tower: a long spiral stone staircase rising into shadow, unlit paper lanterns hanging along the walls, a few glowing warm gold, deep blue-purple darkness, cozy-mysterious mood. |
| `rival.png` | Wide scene of a moonlit tower balcony high above the town: stone railing, glowing town lights far below, a big moon, wind-blown banners, a dramatic dueling-ground feel. |
| `clock.png` | Wide scene of the inside of a giant clock face at the top of the tower: huge brass gears, a glowing frozen clock hand pointing near 12, swirling purple energy, stained-glass light, epic final-boss arena feel. |

---

## Music and sound: Suno

**Format:** download as `.mp3` and save under `audio/story/`.

**Settings:** turn on **Instrumental** for everything.

**Looping:** the game removes silence from the start and end and loops the rest, so ask for loopable tracks. If a track ends with a big finale, trim it.

**Volume:** keep the mix moderate, because effects and text bleeps play over it.

### Music: about 60–90 seconds, loopable

| File | Used for | Style prompt |
|---|---|---|
| `theme.mp3` | story and dialogue screens | 16-bit SNES JRPG chiptune, adventurous story theme, hopeful and curious, 96 BPM, catchy square-wave lead, warm bass, light percussion, loopable, instrumental |
| `quest.mp3` | quest rounds (bridge, market, lanterns) | 16-bit SNES chiptune, upbeat action theme for a timed challenge, driving rhythm, 132 BPM, energetic but not stressful, arpeggios, loopable, instrumental |
| `boss.mp3` | boss rounds (Gusty, Golem, Riku) | 16-bit SNES chiptune boss battle theme, intense and exciting, 148 BPM, punchy bass, fast arpeggios, dramatic but fun for kids, loopable, instrumental |
| `final-boss.mp3` | Count Calculo | 16-bit SNES chiptune final boss theme with a ticking-clock motif, epic and theatrical, 156 BPM, organ-like lead, heroic counter-melody, loopable, instrumental |

### Jingles and effects
Suno is built for songs, so these short clips may take a few tries. Generate them, then trim to the target length in any audio editor. For very short effects, a free tool like **jsfxr** or **ChipTone** is faster than Suno.

| File | Target | When it plays | Style prompt |
|---|---|---|---|
| `chapter-start.mp3` | 1–2 s | a chapter opens | 16-bit chiptune "level start" jingle, short rising square-wave fanfare, bright, ends cleanly, instrumental |
| `hit.mp3` | under 0.3 s | each correct answer in a story round | 16-bit chiptune hit / damage sound, short punchy blip with a quick pitch drop, retro game |
| `victory.mp3` | 3–4 s | the goal is reached | 16-bit chiptune victory fanfare, triumphant, ends on a held major chord, instrumental |
| `defeat.mp3` | 2–3 s | time runs out short of the goal | 16-bit chiptune "try again" jingle, gentle descending notes, a little sad but encouraging, not harsh, ends cleanly |
| `text-blip.mp3` | about 0.03 s | while dialogue types out | Optional. A single tiny soft square-wave blip; jsfxr makes this in seconds. The built-in synth blip already works well. |

---

## Ideas for more assets later
- **Victory poses:** `art/portraits/kazu-win.png` and `kazu-lose.png`, for the win and lose screens.
- **Defeated-boss portraits:** for example `gusty-defeated.png` (dizzy, swirly eyes), shown after a boss is beaten.
- **A title logo:** pixel art "Times Table Dash" logo for the home screen.

Each of these needs a few lines of code to display. They aren't wired in yet.
