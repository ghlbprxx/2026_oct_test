// Pink oyster (Pleurotus djamor): biology, recipes and agar media.
// Durations are REAL-WORLD days ("bio days"); the sim compresses them with time.bioDaysPerGameDay.
// Hazards are chances per real day. `real` strings are what the UI shows players.
export const SPECIES = {
  id: 'pink-oyster', name: 'Pink oyster', latin: 'Pleurotus djamor',
  bio: {
    plateDays: 7, plateReal: '5–10 days',
    jarDays: 12, jarReal: '10–14 days (7–10 with a shake)',
    pinDays: 4, pinReal: '3–7 days to pins once warm',
    growDays: 4, growReal: '3–5 days pins to harvest',
    peakWindow: 1.5, peakReal: 'about a day at peak',
    restDays: 10, restReal: '7–14 days between flushes',
    cookerDays: 1, bathDays: 0.5,
  },
  contam: { plateOpenAir: 0.06, jarSterile: 0.007, jarPasteurized: 0.13, fruitingMult: 0.3 },
  fruiting: { minTemp: 64, bestLo: 70, bestHi: 85 },
};
export const RECIPES = {
  coir:    { name: 'Coir + vermiculite', short: 'Coir', img: 'bag_coir', be: 0.35, cost: 3, rich: 1, colDays: 12, colReal: '10–14 days', hz: { ster: 0.005, past: 0.0067 }, blurb: 'Lean and forgiving, low yield.' },
  straw:   { name: 'Chopped straw', short: 'Straw', img: 'bag_straw', be: 0.75, cost: 3, rich: 2, colDays: 12, colReal: '10–14 days', hz: { ster: 0.042, past: 0.01 }, blurb: 'The classic oyster substrate. Cheap, low-tech.' },
  saw:     { name: 'Sawdust + 15% bran', short: 'Saw+bran', img: 'bag_sawdust', be: 1.1, cost: 5, rich: 3, colDays: 16, colReal: '14–21 days', hz: { ster: 0.009, past: 0.0875 }, blurb: 'Supplemented hardwood block. Big yields.' },
  masters: { name: 'Masters Mix', short: 'Masters', img: 'bag_sawdust', be: 1.5, cost: 7, rich: 4, colDays: 18, colReal: '14–21 days', hz: { ster: 0.011, past: 0.1 }, blurb: 'Hardwood pellets + soy hulls. Highest yield, slowest.' },
  coffee:  { name: 'Week-old coffee grounds', short: 'Coffee', img: 'bag_coir', be: 0.9, cost: 0, rich: 3, colDays: 14, colReal: '10–14 days', hz: { ster: 0.14, past: 0.18 }, blurb: 'Free from a neighbor.' },
};
export const BUYABLE = { coir: RECIPES.coir, straw: RECIPES.straw, saw: RECIPES.saw, masters: RECIPES.masters };
export const MEDIA = {
  mea:   { name: 'MEA', full: 'MEA · malt extract agar', blurb: 'The gold standard. Honest growth you can read.' },
  super: { name: 'Super agar', full: 'Max-sugar “super agar”', blurb: 'Twice as fast, but hides mold for much longer.' },
  cma:   { name: 'CMA', full: 'CMA · cornmeal agar (lean)', blurb: 'Slow, but mold shows almost immediately.' },
};
/** Consumables (US hobby prices, approximate). */
export const SUPPLIES = { plate: 1.5, jar: 3, sab: 15 };
