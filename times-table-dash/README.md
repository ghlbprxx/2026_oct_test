# Times Table Dash

A calm math game for kids, built with Vue 3 from a CDN and native ES modules, so there's no build step.

Run it through any static web server, for example `python3 -m http.server` in this folder, then open http://localhost:8000. Opening `index.html` straight from disk won't work, because browsers block ES modules on `file://` (the page shows a message saying so).

## Files

```
index.html                 page shell: stylesheets, Vue, js/main.js
css/
  tokens.css               colors (light + dark), fonts, motion timings — change the look here first
  base.css                 reset, layout, header, buttons, panels, view/page transitions, keyframes, reduced motion
  components.css           scene, Kazu, answer box, keypad, stars, stickers, modal
  home.css / practice.css / story.css / cheat.css   one file per screen
js/
  main.js                  entry: registers shared components, mounts App, installs keyboard input
  App.js                   header + the current view (cross-faded)
  data/
    stories.js             cast, world dialogue, number ranges and the generator (edit this to add or change stories)
    practice.js            times table presets, stickers, Kazu's home tips
    assets.js              art and audio paths (+ which art loaded)
  core/                    state and logic, no templates
    state.js               current view, saved settings/progress, the round's state, Kazu reactions, go()
    game.js                practice round: setup helpers, countdown, scoring, results
    story.js               story reader: pages, checking, hints, stars, progress
    cheat.js               cheat sheet grid logic
    audio.js               sound effects + background music
    fx.js                  celebration petals on the #fx canvas
    keys.js                keyboard controls and auto-pause
    util.js                small helpers (storage, random, ranges)
  components/              SakuraScene, KazuMascot, NumberPad, BackLink
  views/                   one file per screen: Home, Stories, Story, Practice, Play, Results, Stickers, Cheat
art/, audio/               optional assets; missing files fall back to drawings, synth tones or silence
```

State is shared through module-level singletons in `js/core/`, so a view just imports what it needs and returns it from `setup()`.

## Modes
- **Story mode**: five untimed "worlds" told like a 16-bit adventure. Each world has a title card, an RPG dialogue box with character portraits and letter-by-letter text (tap, Enter or Space to continue), one math challenge per stage, and a "Stage clear!" ending. The cast is Kazu, Mimi, Grandpa Tanuki, Gusty the wind sprite and Professor Hoot.
  - **Wrong answers:** the first miss gives a tip, the second shows a picture hint, and after three misses the answer is shown so the child can keep going.
  - **Navigation:** every world is open. Use the world map or the ‹ › buttons to switch, and the stage dots to revisit earlier stages.
  1. The Spring Picnic: addition
  2. The Windy Walk: subtraction (Gusty keeps taking things away)
  3. The Bakery Morning: mixed + and −
  4. Lantern Night: division (sharing fairly)
  5. The School Festival: mixed +, − and ÷
  - **Optional art and audio:** each world can have its own backdrop and music, and each character a portrait. Everything falls back to emoji, a drawn backdrop and synth chiptune sounds. See [ASSET_PROMPTS.md](ASSET_PROMPTS.md) for the file paths and generation prompts.
- **Times table practice**: the original timed round, with presets and an optional "Customize" panel.
- **Sticker book** and **Cheat sheet**: linked from the home screen.

## Number rules (story mode)
Every answer is a positive whole number:
- addition uses addends of 1 or more
- subtraction picks the subtrahend from 1 to (minuend − 1)
- division builds the dividend as divisor × quotient, with both 2 or more, so there's never a remainder

## Motion
Views and story pages fade and slide 6–14px using one easing curve (`--ease`, 180/320/500ms). The mascot breathes slowly. A wrong answer gets one small nudge. Celebrations drop a few slow petals. All motion turns off under `prefers-reduced-motion`.
