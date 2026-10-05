# Times Table Dash

A timed math game for 4th–5th graders covering addition, subtraction, multiplication and division. It has a short retro-RPG story mode in which every chapter is won by hitting a point goal before the clock runs out.

Built with Vue 3 from a CDN and native ES modules. There's no build step.

## How to run

Serve this folder with any static web server, then open the address it prints:

```
python3 -m http.server 8000      # then open http://localhost:8000
```

Opening `index.html` straight from disk won't work, because browsers block ES modules on `file://` (the page shows a message saying so).

## Modes

### Story mode
Count Calculo has frozen the town clock the night before the Sakura Festival. Kazu and friends climb to the clock tower one chapter at a time.

**How each chapter plays:**
1. **Intro:** a short dialogue scene. Tap, Enter or Space advances it, and "Skip ▶▶" jumps to the end.
2. **Timed round:** score a set number of points in 30 or 60 seconds.
   - **Quest chapters:** a progress meter fills as you score.
   - **Boss chapters:** the foe's HP bar drains with every correct answer.
   - **Reaching the goal:** the round ends right away ("K.O.!" / "Goal!").
3. **Win:** stars depend on how much time was left. The next chapter unlocks.
4. **Lose:** the story responds with how close you got, shows the problems you missed and a strategy tip, and offers "Try again ▶". Retries skip the intro.

| # | Chapter | Type | Problems | Goal |
|---|---|---|---|---|
| 1 | The Broken Bridge | Quest | + (easy) | 80 pts in 30s |
| 2 | Gusty's Gale | Boss: Gusty | − (easy) | 80 pts in 30s |
| 3 | Market Mix-Up | Quest | + and − (medium) | 120 pts in 60s |
| 4 | The Times Tower | Boss: Times Golem | × (2s–9s) | 120 pts in 30s |
| 5 | The Lantern Stairs | Quest | ÷ (2s–9s) | 220 pts in 60s |
| 6 | Riku's Challenge | Boss: Riku | × and ÷ (2s–12s) | 260 pts in 60s |
| 7 | Count Calculo's Clock | Final boss | + − × ÷ | 220 pts in 60s |

The goals are first guesses, aimed at an average 5th grader. Tune them in `js/data/stories.js` after watching a few real kids play.

### Practice
Timed rounds of 30, 60 or 90 seconds.
- **Quick starts:** Addition, Subtraction, Times tables, Division facts, × and ÷, and All four.
- **Customize panel:** choose any mix of problem types, the + / − level, which times tables (used for × and ÷), the fact range, and the round length.
- **Results:** score, accuracy, best streak, stars and the problems you missed.

### Also
- **Sticker book:** badges for practice milestones and story victories.
- **Cheat sheet:** a times table grid. It marks the × and ÷ facts you missed last round.

## Scoring
- **Base:** 10 points per correct answer.
- **Streak bonus:** every 5 in a row raises the multiplier (×2, ×3, up to ×4) and adds 3 seconds to the clock.
- **Speed bonus:** answering in under 2 seconds adds +5 × the multiplier.
- **Missed problems:** they come back a few questions later.

## Number rules
Every answer is a positive whole number:

| Type | Easy | Medium | Hard |
|---|---|---|---|
| + | 2-digit + 1-digit | 2-digit + 2-digit | 3-digit + 2-digit |
| − | 2-digit − 1-digit | 2-digit − 2-digit | 3-digit − 2-digit |

- **Subtraction:** the number taken away is always smaller than the starting number, so the result is at least 1.
- **Multiplication:** uses the chosen tables times the chosen range.
- **Division:** built backwards from a multiplication fact, (table × n) ÷ table = n, so there's never a remainder.

## Files

```
index.html                 page shell: stylesheets, Vue, js/main.js
ASSET_PROMPTS.md           Gemini image prompts and Suno music/SFX prompts for the story, with file paths
css/
  tokens.css               colors (light + dark), fonts, motion timings: change the look here first
  base.css                 reset, layout, header, buttons, panels, view transitions, keyframes, reduced motion
  components.css           scene, Kazu, answer box, keypad, stars, stickers, modal
  home.css / practice.css / story.css / cheat.css   one file per screen
js/
  main.js                  entry: registers shared components, mounts App, installs keyboard input
  App.js                   header + the current view (cross-faded)
  data/
    problems.js            question generator for + − × ÷, difficulty levels, labels
    stories.js             cast, chapters (dialogue, goals, tips): edit this to add or change chapters
    practice.js            quick starts, stickers, Kazu's home tips
    assets.js              art and audio paths, optional-image loader
  core/                    state and logic, no templates
    state.js               current view, saved settings/progress, the round's state, Kazu reactions, go()
    game.js                timed rounds: setup helpers, countdown, scoring, story goals, results
    story.js               chapter unlocks, dialogue typewriter, intro → round → win / lose
    cheat.js               cheat sheet grid logic
    audio.js               sound effects + background music (story tracks load on demand)
    fx.js                  celebration petals on the #fx canvas
    keys.js                keyboard controls and auto-pause
    util.js                small helpers (storage, random, ranges)
  components/              SakuraScene, KazuMascot, NumberPad, BackLink
  views/                   one file per screen: Home, Stories (chapter map), Story, Practice, Play, Results, Stickers, Cheat
art/, audio/               optional assets; missing files fall back to emoji, drawings, synth tones or silence
```

State is shared through module-level singletons in `js/core/`, so a view just imports what it needs and returns it from `setup()`.

## Optional art and audio
Portraits, chapter backdrops, story music and story sound effects are all optional. See [ASSET_PROMPTS.md](ASSET_PROMPTS.md) for the prompts and file paths. A file that isn't there shows up as a harmless failed request in the browser's developer tools.

## Motion and accessibility
- **Motion:** views fade and slide a few pixels. The story uses short stepped, retro-style animations. All of it turns off under `prefers-reduced-motion`, and the dialogue then appears instantly.
- **Screen readers:** dialogue is announced through a hidden live region. Every control works from the keyboard.
