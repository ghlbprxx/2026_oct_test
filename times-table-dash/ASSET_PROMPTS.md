# Asset prompts: story mode

Every asset here is optional. The game already runs without any of them:
- **Images:** missing ones fall back to emoji portraits and a drawn backdrop.
- **Sounds:** missing ones fall back to soft chiptune synth bleeps.
- **Music:** a missing world track falls back to the menu music.

Drop a file in at the listed path and it's picked up on the next page load. No code changes are needed.

## Images: Gemini (Nano Banana)

**Format:** save as `.png` or `.webp` under the path shown. `.webp` is smaller and loads faster.

**Keep the look consistent:** paste the style line below at the start of every image prompt. Generate Kazu first, then attach that image to the other prompts and say "same art style as the attached image."

> **Style line:** 16-bit SNES-era pixel art, cozy JRPG style, crisp visible pixels, limited soft pastel palette, gentle lighting, cute and friendly for young kids, no text, no letters, no UI, no logos.

### Character portraits: 512×512, square, `art/portraits/<name>.png`
Shown at 64px in the dialogue box, so keep each one a simple head-and-shoulders shot with a bold silhouette and a plain flat background in the listed color.

| File | Prompt (after the style line) |
|---|---|
| `kazu.png` | Head-and-shoulders portrait of Kazu, a chibi fox-cat hero with orange fur, cream chest and cheeks, big purple eyes, pointed ears with pink insides, and a red headband with a small white "×" badge. Cheerful, confident smile. Facing slightly right. Flat warm-orange background (#f2b06a). |
| `mimi.png` | Head-and-shoulders portrait of Mimi, a chibi white bunny girl with long floppy ears, a pink bow on one ear, rosy cheeks, and big friendly eyes. Happy, excited expression. Facing slightly left. Flat soft-pink background (#f2c4cf). |
| `tanuki.png` | Head-and-shoulders portrait of Grandpa Tanuki, a round, kind old tanuki baker with a white baker's hat, small round glasses, a bushy gray mustache, and a flour-dusted apron. Warm, jolly smile. Flat warm-tan background (#b8a48c). |
| `gusty.png` | Head-and-shoulders portrait of Gusty, a small mischievous wind sprite made of swirling pale-blue air, with a cloud-puff body, cheeky grin, and little leaves caught in the swirl. Playful, not scary. Flat pale-sky-blue background (#bcd6e8). |
| `hoot.png` | Head-and-shoulders portrait of Professor Hoot, a wise, gentle owl with brown and cream feathers, round spectacles, a tiny graduation cap, and a soft scarf. Calm, encouraging expression. Flat light-tan background (#c9b38f). |

### World backdrops: 1280×640 (2:1 wide), `art/story/<id>.png`
The backdrop sits behind a bouncing item and a "WORLD 1-3" tag in the top-left corner, so leave that corner and the center fairly open. Show no characters, only the scenery.

| File | Prompt (after the style line) |
|---|---|
| `picnic.png` | Wide side-view background of a sunny spring park: blooming cherry trees, a gentle green hill, a small pond with a wooden bridge, a checkered picnic blanket on the grass, fluffy clouds, a soft blue sky. Open space in the middle. |
| `windy.png` | Wide side-view background of breezy rolling hills on a windy afternoon: grass bending in the wind, leaves and petals swirling through the air, a wooden fence, a winding path to a small cottage on the horizon, streaky clouds. Open space in the middle. |
| `bakery.png` | Wide background of a cozy Japanese-style bakery interior: wooden shelves of melon buns, croissants and cupcakes, a counter with a tip jar and paper bags, warm morning light from the windows, a little door chime. Open space in the middle. |
| `lanterns.png` | Wide side-view background of a riverside lantern festival at dusk: a deep-blue to purple twilight sky with first stars, glowing paper lanterns strung between trees, lanterns floating on a calm river, soft gold reflections. Open space in the middle. |
| `festival.png` | Wide side-view background of a cheerful school festival: a school building with cherry trees, colorful booths with striped awnings, balloons, bunting flags, a lemonade stand, a warm sunset-orange sky. Open space in the middle. |

## Music and jingles: Suno

**Format:** download as `.mp3` and save under the path shown.

**Settings:** turn on **Instrumental** for every track.

**Looping:** the game removes silence from the start and end and loops the rest without a gap. If a track ends on a big finale, trim it so the end flows back into the start.

**Volume:** keep the music gentle, because the dialogue box adds its own text bleeps over it.

### World themes: `audio/story/<id>.mp3`, about 60–90 seconds each

| File | Style prompt |
|---|---|
| `picnic.mp3` | 16-bit SNES chiptune, cheerful spring overworld theme, bouncy but relaxed, 100 BPM, bright square-wave lead melody, soft triangle bass, light percussion, loopable, instrumental, kids game |
| `windy.mp3` | 16-bit SNES chiptune, playful mischievous theme, swirling arpeggios that sound like wind, light staccato melody, 110 BPM, a bit sneaky but fun, loopable, instrumental, kids game |
| `bakery.mp3` | 16-bit SNES chiptune, cozy shop/town theme, warm and homey, gentle swing, 92 BPM, music-box-like lead, soft bass, loopable, instrumental, kids game |
| `lanterns.mp3` | 16-bit SNES chiptune, calm night festival theme, dreamy and twinkly, pentatonic melody, soft bells, slow 76 BPM, peaceful and magical, loopable, instrumental, kids game |
| `festival.mp3` | 16-bit SNES chiptune, upbeat final-world festival theme, joyful and triumphant but not intense, 120 BPM, catchy lead, claps, loopable, instrumental, kids game |

### Jingles and effects: `audio/story/`
Suno is built for songs, so these short clips may take a few tries. Generate them, then trim to the target length in any audio editor.

| File | Target | Style prompt |
|---|---|---|
| `world-start.mp3` | 1–2 s | 16-bit chiptune "level start" jingle, short rising square-wave fanfare, bright and happy, ends cleanly, instrumental |
| `item-get.mp3` | under 1 s | 16-bit chiptune "item get" sound, quick three-note rising arpeggio, sparkly, ends cleanly, instrumental |
| `stage-clear.mp3` | 3–4 s | 16-bit chiptune "stage clear" victory jingle, cheerful fanfare, ends on a held major chord, instrumental |
| `text-blip.mp3` | about 0.03 s | A single tiny soft square-wave "blip" for dialogue text. Honestly, skip this one. The built-in synth blip is already what you'd want, and a recorded blip is easier to make in a tool like jsfxr or ChipTone than in Suno. |
