// Pink oyster (Pleurotus djamor): substrate recipes and agar media.
export const RECIPES = {
  coir:    { name: 'Coir + vermiculite', short: 'Coir', img: 'bag_coir', be: 0.35, cost: 2, rich: 1, hz: { ster: 0.006, past: 0.008 }, blurb: 'Lean and forgiving, low yield.' },
  straw:   { name: 'Chopped straw', short: 'Straw', img: 'bag_straw', be: 0.75, cost: 2, rich: 2, hz: { ster: 0.05, past: 0.012 }, blurb: 'The classic oyster substrate. Cheap, low-tech.' },
  saw:     { name: 'Sawdust + 15% bran', short: 'Saw+bran', img: 'bag_sawdust', be: 1.1, cost: 4, rich: 3, hz: { ster: 0.014, past: 0.14 }, blurb: 'Supplemented hardwood block. Big yields.' },
  masters: { name: 'Masters Mix', short: 'Masters', img: 'bag_sawdust', be: 1.5, cost: 6, rich: 4, hz: { ster: 0.02, past: 0.18 }, blurb: 'Hardwood pellets + soy hulls. Highest yield.' },
  coffee:  { name: 'Week-old coffee grounds', short: 'Coffee', img: 'bag_coir', be: 0.9, cost: 0, rich: 3, hz: { ster: 0.2, past: 0.25 }, blurb: 'Free from a neighbor.' },
};
export const BUYABLE = { coir: RECIPES.coir, straw: RECIPES.straw, saw: RECIPES.saw, masters: RECIPES.masters };
export const MEDIA = {
  mea:   { name: 'MEA', full: 'MEA · malt extract agar', blurb: 'The gold standard. Honest growth you can read.' },
  super: { name: 'Super agar', full: 'Max-sugar “super agar”', blurb: 'Twice as fast, but hides mold for much longer.' },
  cma:   { name: 'CMA', full: 'CMA · cornmeal agar (lean)', blurb: 'Slow, but mold shows almost immediately.' },
};
