// Wine cap (Stropharia rugosoannulata): an outdoor species grown in wood-chip beds in the back yard.
// Ladder: agar → grain → sawdust spawn (bags that colonize, then inoculate a bed) → outdoor bed → harvest.
// Durations are REAL days. Real beds take ~2–6 months to first flush (60–180 d) and produce for 2–4 years;
// aged hardwood chips are best, conifer chips inhibit, straw-only beds are faster but exhaust in a season.
// This game uses the fast end (rich fresh chips + good moisture) so a bed fruits within a few in-game weeks.
export const SPECIES = {
  id: 'wine-cap', name: 'Wine cap', latin: 'Stropharia rugosoannulata', short: 'wine caps',
  bio: {
    plateDays: 9, plateReal: '7–12 days',
    jarDays: 14, jarReal: '10–18 days',
    pinDays: 7, pinReal: 'about a week after a good rain once the bed is colonized',
    growDays: 5, growReal: '4–6 days pins to harvest',
    peakWindow: 1.5, peakReal: 'about a day: pick before the veil tears',
    restDays: 14, restReal: '2–4 weeks between flushes',
    cookerDays: 1, bathDays: 0.5,
  },
  contam: { plateOpenAir: 0.06, jarSterile: 0.007, jarPasteurized: 0.13, fruitingMult: 0.3 },
  // outdoors: humidity comes from bed moisture (watering, rain), not the air
  fruiting: { minTemp: 45, bestLo: 55, bestHi: 70, maxTemp: 85, rhLo: 60, rhHi: 100 },
  priceMult: 12 / 14, shelfMult: 1.6, bagFruits: false, colShift: 12,
  climate: null, climateText: 'outdoors: 55–70°F and a moist bed (rain or the hose)',
};
export const RECIPES = {
  // spawn bags (indoors, sterilized; they colonize and then inoculate a bed)
  sawspawn: { name: 'Hardwood sawdust spawn', short: 'Saw spawn', img: 'bag_sawdust', be: 0, cost: 4, rich: 3, colDays: 21, colReal: '3–4 weeks', hz: { ster: 0.008, past: 0.08 }, blurb: 'Grain spawn expanded into hardwood sawdust: what you inoculate a bed with.' },
  // beds (yard). be = fresh kg per flush from a ~4×8 ft bed (growers report roughly 10–20 lb over a good first season).
  chips: { bed: true, name: 'Fresh hardwood chips (free)', short: 'Chip', img: 'zone_yard', be: 2.0, cost: 0, rich: 2, colDays: 70, colReal: '2–6 months', maxFlush: 0, hz: { bed: 0.004 }, blurb: 'The arborist’s free truckload. Slow to colonize, fruits for years.' },
  straw: { bed: true, name: 'Straw-only bed', short: 'Straw', img: 'zone_yard', be: 1.6, cost: 8, rich: 1, colDays: 45, colReal: '6–10 weeks', maxFlush: 3, hz: { bed: 0.006 }, blurb: 'Faster, but used up after a season (3 flushes here).' },
  pine: { bed: true, name: 'Bagged pine bark mulch', short: 'Pine', img: 'zone_yard', be: 0.6, cost: 6, rich: 1, colDays: 70, colReal: 'slow, often fails', maxFlush: 0, pine: true, hz: { bed: 0.008 }, blurb: 'Cheap at the garden center. Conifer resins hold wine caps back.' },
};
export const BUYABLE = { sawspawn: RECIPES.sawspawn };
export const BEDS = { chips: RECIPES.chips, straw: RECIPES.straw, pine: RECIPES.pine };
export const PACK = { ...SPECIES, recipes: RECIPES, buyable: BUYABLE, beds: BEDS, basic: ['sawspawn'], flushMult: [1, 1, 1] };
