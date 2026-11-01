// Week 0 tutorial: one step at a time, game time paused, each step highlights a real UI element.
// `targets`: CSS selectors tried in order; the first one on screen gets the highlight ring.
//   The token "@plate" means "the spot holding your first plate that isn't in the closet yet".
// `done(g)`: action steps finish on their own when the game state matches; info steps wait for "Next".
import { zoneOf } from '../sim/zones.js';

const plateSpots = g => g.slots.map((v, i) => ({ v, i })).filter(s => s.v && s.v.kind === 'plate');

export const TUTORIAL = [
  { id: 'house', title: 'Your house, cut open', targets: ['.house'],
    text: 'Each room is a zone with its own temperature, humidity and cleanliness. Kitchen for work, closet for incubating, tent for fruiting, garage for the pressure cooker.' },
  { id: 'sab', title: 'Stop the moving air', targets: ['[data-item="sab"] button', '.shopbtn'],
    text: 'Moving air carries mold spores onto open plates. Open the shop and buy a still-air box.',
    done: g => !!(g.gear.sab || g.gear.flowhood) },
  { id: 'pour', title: 'Pour a plate', targets: ['.sheet .choice .opt', '[data-slot="0"]'],
    text: 'Tap a kitchen spot and pour an MEA plate. You’re working inside the still-air box now.',
    done: g => plateSpots(g).some(s => s.v.ws !== 'open') },
  { id: 'room', title: 'Read the room', targets: ['.movegrid [data-zone="closet"]', '@plate', '.z-closet'],
    text: 'Hover or tap a spot to read its conditions. The kitchen is drafty. Move your plate to the closet: dark, steady, about 72°F.',
    done: g => plateSpots(g).some(s => zoneOf(s.i) === 'closet') },
  { id: 'speed', title: 'Time controls', targets: ['.speeds'],
    text: 'Time is paused while we talk. Space pauses and resumes; [ and ] change speed. One game day is 2.5 real growing days.' },
  { id: 'notebook', title: 'The grower’s notebook', targets: ['[aria-label="Grower\'s notebook"]'],
    text: 'Field guide, every lesson you’ve learned, and a cheat sheet with real-world numbers. Press N any time.' },
  { id: 'mastery', title: 'How you advance', targets: ['#mastery'],
    text: 'Do the mentor’s checklist, then make enough good product. The review at the end of day 5 decides if the next stage opens.' },
];

/** Is step k finished? Info steps (no `done`) are finished only by the player pressing Next. */
export const stepDone = (k, g) => { const s = TUTORIAL[k]; return !!(s && s.done && s.done(g)); };
