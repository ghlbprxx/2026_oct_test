# Audio prompts — Pink Oyster Run

Generated from `assets/audio/audio-manifest.json` and `assets/audio/voice-lines.json` by `node assets/tools/gen-audio.mjs --write-md`. Edit the JSON (or the game script), not this file.

## Music (Suno-style prompts: paste into the style box, instrumental, no lyrics)

### music_title

- **Save as:** `assets/audio/music/title.mp3` · ~60 s · loop
- **Used for:** Title and setup screens.

```text
cozy acoustic folk, warm nylon guitar, soft glockenspiel, light brushed percussion, gentle and curious, morning garden, instrumental, 92 bpm, loopable
```

### music_farm

- **Save as:** `assets/audio/music/farm.mp3` · ~120 s · loop
- **Used for:** While playing (quiet under the sound effects).

```text
calm lo-fi chillhop, mellow electric piano, soft upright bass, vinyl crackle, relaxed focus, home workshop, instrumental, 80 bpm, unobtrusive background, loopable
```

### music_review

- **Save as:** `assets/audio/music/review.mp3` · ~8 s · one-shot
- **Used for:** Short sting when a stage is mastered at the weekly review.

```text
short triumphant cozy sting, marimba and pizzicato strings, small cymbal swell, bright resolution, instrumental, 8 seconds
```

## Sound effects

Style for every effect: Clean, cozy, soft game UI sound effect, dry studio recording, no music, no voices, no reverb tail.

| id | file | seconds | prompt |
|---|---|---|---|
| tap | `assets/audio/sfx/tap.mp3` | 0.4 | A soft, short wooden tap, like a fingertip on a small wooden block. |
| build | `assets/audio/sfx/build.mp3` | 0.6 | A glass jar set down gently on a wooden counter, small clink. |
| harvest | `assets/audio/sfx/harvest.mp3` | 0.8 | A crisp, satisfying snap of a fresh mushroom cluster twisted off a block, with a light leafy rustle. |
| coin | `assets/audio/sfx/coin.mp3` | 0.7 | Two bright, friendly coin chimes, rising. |
| mold | `assets/audio/sfx/mold.mp3` | 1 | A low, slightly ominous squelchy wobble, cartoonish rather than scary. |
| bad | `assets/audio/sfx/bad.mp3` | 0.5 | A short, muted, gentle error buzz, two descending notes. |
| good | `assets/audio/sfx/good.mp3` | 0.7 | A gentle two-note marimba success chime, rising. |
| hiss | `assets/audio/sfx/hiss.mp3` | 1.2 | A pressure cooker releasing a short burst of steam, soft hiss fading out. |
| shake | `assets/audio/sfx/shake.mp3` | 0.8 | A glass jar of dry rye grain shaken three times, rattling kernels. |
| pop | `assets/audio/sfx/pop.mp3` | 0.4 | A soft, bubbly, cheerful pop. |
| sale | `assets/audio/sfx/sale.mp3` | 0.6 | A light, short notification ding, like a small shop bell. |

## Voices

- **mentor** (Dr. Ines Marlow): Woman in her late 60s, American, retired scientist. Dry wit, crisp diction, unhurried; turns theatrical when she sees mold. Warm underneath.
- **guru** (u/SporeLord_9000): Man in his late 20s, American, upbeat and overconfident internet poster. Fast, casual, grinning delivery; says emoji out loud only as tone, never as words.

66 lines in `assets/audio/voice-lines.json`, one file each at `assets/audio/voice/<id>.mp3`:

| id | who | line |
|---|---|---|
| mentor_intro_1 | mentor | You. The one with the petri dishes in the recycling. I was a mycologist for forty years. |
| mentor_intro_2 | mentor | Mold is not bad luck. It is bad habits. I will teach you habits. |
| guru_intro_1 | guru | lol just inoculate on the counter bro, spores are everywhere anyway |
| mentor_stage_grain_1 | mentor | Clean plates. Now grain. Rye, soaked, simmered, pressure-cooked. No shortcuts. |
| guru_stage_grain_1 | guru | Pasteurizing grain works fine if you believe in it. |
| mentor_stage_grain_2 | mentor | It does not. Grain is a buffet. Sterilize it or feed the mold. |
| mentor_stage_substrate_1 | mentor | Bulk substrate. The richer the mix, the more it yields, and the more it molds. |
| mentor_stage_substrate_2 | mentor | Straw gets a hot bath. Anything with bran goes in the cooker. Write that on your hand. |
| mentor_stage_fruiting_1 | mentor | Fruiting. Pinks are tropical drama queens: warm, wet, and plenty of fresh air. |
| guru_stage_fruiting_1 | guru | Golden oysters are way prettier tho, why not grow those? |
| mentor_golden_aside_1 | mentor | Because goldens escaped grow kits and now crowd out native fungi in US forests. Pinks stay put. We grow pinks. |
| mentor_stage_harvest_1 | mentor | Harvest and market. A pink oyster is perfect for about a day, then it is soup. |
| mentor_stage_harvest_2 | mentor | Sell it fresh, or dry it. Rotting it is not a sales strategy. |
| mentor_first_mold_1 | mentor | Green. GREEN. Do you see that? That is Trichoderma waving at you. |
| mentor_first_mold_2 | mentor | Toss it, don’t open it indoors, and read the lesson card. Then do better. |
| mentor_coffee_yes_1 | mentor | Week-old coffee grounds? They are already a mold farm. Watch that bag closely. |
| mentor_coffee_no_1 | mentor | You turned down free week-old grounds. Good. Fresh, same-day grounds only. |
| mentor_cold_snap_1 | mentor | Cold snap coming. Pinks stall below about 64°F. Heat mat on, garage jars inside. |
| mentor_species_done_1 | mentor | Plate to market table. I may have to stop calling you “the kid next door.” |
| mentor_species_done_2 | mentor | Next, something fussier. Lion’s mane. Cool, clean, and it punishes a warm tent. |
| mentor_lions_intro_1 | mentor | Lion’s mane wants 60 to 70 degrees and air like a mountain morning. Heat mat OFF. |
| guru_lions_intro_1 | guru | it cures brain fog bro, I eat it raw every day |
| mentor_lions_intro_2 | mentor | Cook it. And grow it on hardwood, not straw. It barely fruits on straw. |
| mentor_wood_chips_1 | mentor | An arborist just dumped a free truckload of hardwood chips on my driveway. Wine caps love those. |
| guru_wood_chips_1 | guru | pine chips work too, chips are chips |
| mentor_wood_chips_2 | mentor | Conifer resin stalls them. Hardwood. Grab a wheelbarrow. |
| mentor_winecap_intro_1 | mentor | Wine caps live outside. You make the spawn indoors, then the weather does the rest. |
| mentor_winecap_intro_2 | mentor | A good bed fruits for years. Keep it moist and be patient. |
| mentor_stage_lc_1 | mentor | Liquid culture. One jar of broth, six jars of grain. Also six ways to ruin everything at once. |
| guru_stage_lc_1 | guru | more sugar = more food = faster growth, it’s just math |
| mentor_stage_lc_2 | mentor | More sugar is more food for bacteria. Two percent. Not one gram more. |
| mentor_stage_spawn_1 | mentor | Grain into hardwood sawdust. More, cheaper spawn for a big outdoor bed. |
| mentor_stage_bed_1 | mentor | Build the bed, seed it with spawn, and water it when it dries. Then wait. |
| guru_stage_bed_1 | guru | just put the bag in the ground, nature handles it lol |
| mentor_stage_bed_2 | mentor | Nature handles dry beds by giving them to other fungi. |
| mentor_all_done_1 | mentor | Three species. Indoors, outdoors, warm, cool. You’re a grower now. |
| mentor_all_done_2 | mentor | I am… proud. Tell anyone and I’ll deny it. |
| guru_quiz_open_1 | guru | Posting this for the noobs. Trust me, I’ve grown for 3 months: |
| guru_quiz_open_2 | guru | Hot take, but I’m right as usual: |
| guru_quiz_open_3 | guru | PSA, upvote so people see it: |
| mentor_guru_right_1 | mentor | …He’s right. Once. Don’t tell him I said so. |
| mentor_guru_right_2 | mentor | Fine. A broken clock, et cetera. That one is true. |
| mentor_guru_wrong_1 | mentor | Confidently wrong again. Remarkable consistency. |
| mentor_guru_wrong_2 | mentor | Forty years of research, and I lose to a man with a ring light. |
| mentor_review_mastered_1 | mentor | Fine. FINE. That was clean work. Don’t let it go to your head. |
| mentor_review_mastered_2 | mentor | You did the boring parts right, which is the whole secret. Next stage. |
| mentor_review_checklist_1 | mentor | You’re rushing. Do the list first; the yield comes after the habits. |
| mentor_review_checklist_2 | mentor | Not yet. Technique before numbers. Look at the list again. |
| mentor_review_units_1 | mentor | Habits are there. Now show me you can do it more than once. |
| mentor_review_units_2 | mentor | Good list. Thin results. Another week, same care, more of it. |
| mentor_review_mold_1 | mentor | Green. GREEN. I can smell it from here. Toss it, wipe down, start clean. |
| mentor_review_mold_2 | mentor | Mold isn’t bad luck, it’s feedback. Read the cards below. |
| mentor_species_mastered_1 | mentor | Plate to market table. I may have to stop calling you “the kid next door.” |
| guru_claim_myth_01 | guru | Pink oysters stay bright pink after cooking. |
| guru_claim_myth_02 | guru | Pink oysters fruit best around 70–85°F. |
| guru_claim_myth_03 | guru | Fresh pink oysters keep about a week in the fridge. |
| guru_claim_myth_04 | guru | A richer, sweeter liquid culture grows faster. |
| guru_claim_myth_05 | guru | Grain spawn must be pressure-sterilized, not pasteurized. |
| guru_claim_myth_06 | guru | Growing from spores gives you a clone of the parent. |
| guru_claim_myth_07 | guru | Plain straw should be pasteurized, not sterilized. |
| guru_claim_myth_08 | guru | More bran always means more yield. |
| guru_claim_myth_09 | guru | Softwood sawdust like pine inhibits growth. |
| guru_claim_myth_10 | guru | Low fresh air is fine as long as humidity is high. |
| guru_claim_myth_11 | guru | Alkaline conditions (lime) help suppress Trichoderma. |
| guru_claim_myth_12 | guru | Pink oysters are hard to colonize. |
| guru_claim_myth_13 | guru | Pinks give you 1–2 strong flushes, then drop off. |
