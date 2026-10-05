# Times Table Dash

A calm math game for kids. It's a single `index.html` file that loads Vue 3 from a CDN, so there's no build step. Open it through any static server, for example `python3 -m http.server`.

## Modes
- **Story mode**: five untimed stories with Kazu. Each page is a word problem you answer with the keypad. After a wrong answer you get a tip, then a picture hint, and after three misses the answer is shown so you can keep going. Stories are never locked. You can switch between them from the list or with the ‹ › buttons, and the dots let you go back to any page you've already reached.
  1. The Spring Picnic: addition
  2. The Windy Walk: subtraction
  3. The Bakery Morning: mixed + and −
  4. Lantern Night: division
  5. The School Festival: mixed +, − and ÷
- **Times table practice**: the original timed round, with presets and an optional "Customize" panel.
- **Sticker book** and **Cheat sheet**: linked from the home screen.

## Number rules (story mode)
Every answer is a positive whole number:
- addition uses addends of 1 or more
- subtraction picks the subtrahend from 1 to (minuend − 1)
- division builds the dividend as divisor × quotient, with both 2 or more, so there's never a remainder

## Motion
Views and story pages fade and slide 6–14px using one easing curve (`--ease`, 180/320/500ms). The mascot breathes slowly. A wrong answer gets one small nudge. Celebrations drop a few slow petals. All motion turns off under `prefers-reduced-motion`.
