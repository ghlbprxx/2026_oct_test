// Lion's mane (Hericium erinaceus): a cool-weather hardwood species. Durations are REAL days.
// Sources are hobby/grower guides (medium-low confidence); see .ai/DESIGN.md › Researched numbers.
// Contrast with pinks: fruits COOL (60–70°F, no heat mat), wants very fresh air (CO₂ makes "coral" shapes),
// only does well on supplemented hardwood sawdust, one big flush, and keeps ~5–7 days in the fridge.
export const SPECIES = {
  id: 'lions-mane', name: 'Lion’s mane', latin: 'Hericium erinaceus', short: 'lion’s mane',
  bio: {
    plateDays: 10, plateReal: '7–14 days',
    jarDays: 16, jarReal: '14–21 days',
    pinDays: 6, pinReal: '5–10 days to pins once cool and fresh',
    growDays: 8, growReal: '7–10 days pins to harvest',
    peakWindow: 2.5, peakReal: '2–3 days at peak (spines lengthen, then yellow)',
    restDays: 12, restReal: '10–14 days between flushes',
    cookerDays: 1, bathDays: 0.5,
  },
  contam: { plateOpenAir: 0.06, jarSterile: 0.008, jarPasteurized: 0.14, fruitingMult: 0.3 },
  fruiting: { minTemp: 55, bestLo: 60, bestHi: 70, maxTemp: 78, rhLo: 85, rhHi: 95 },
  priceMult: 20 / 14, shelfMult: 2.5, bagFruits: true, colShift: 0,
  climate: { heater: 0, fae: 7, mist: 104, handMist: 88, label: 'heat mat off, fan 7' },
  climateText: '60–70°F, 85–95% RH, lots of fresh air',
};
export const RECIPES = {
  saw:     { name: 'Hardwood sawdust + 20% bran', short: 'Saw+bran', img: 'bag_sawdust', be: 0.7, cost: 5, rich: 3, colDays: 17, colReal: '14–21 days', hz: { ster: 0.01, past: 0.09 }, blurb: 'The standard lion’s mane block.' },
  masters: { name: 'Masters Mix', short: 'Masters', img: 'bag_sawdust', be: 0.85, cost: 7, rich: 4, colDays: 18, colReal: '14–21 days', hz: { ster: 0.012, past: 0.1 }, blurb: 'Hardwood pellets + soy hulls. Best yields.' },
  straw:   { name: 'Chopped straw', short: 'Straw', img: 'bag_straw', be: 0.2, cost: 3, rich: 2, colDays: 16, colReal: '14–21 days', hz: { ster: 0.042, past: 0.012 }, blurb: 'Lion’s mane barely fruits on straw: it wants hardwood.' },
};
export const BUYABLE = RECIPES;
export const PACK = { ...SPECIES, recipes: RECIPES, buyable: BUYABLE, basic: ['saw', 'masters'], flushMult: [1, 0.35, 0.1] };
