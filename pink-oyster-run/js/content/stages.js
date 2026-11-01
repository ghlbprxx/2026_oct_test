// Stage ladder for pink oyster. Mastery = the mentor's checklist (in order of the brief: checklist first),
// then `units` good units of the stage's product, counted only after the checklist is complete.
// Checklist items read counters in g.counts (incremented by the sim); `n` is how many are needed.
// `unlocks`: what opens while this stage is the one being learned. `product`: what the online shop can sell once mastered.
export const STAGES = [
  { id: 'agar', name: 'Agar', product: 'plate', unitName: 'clean colonized plates', units: 3, unitKey: 'cleanPlates', guide: 'agar',
    checklist: [
      { key: 'platesClean', n: 3, text: 'Pour 3 plates inside a still-air box (or at a flow hood)' },
      { key: 'closetPlates', n: 1, text: 'Incubate a plate on the closet shelf until it’s fully colonized' },
    ] },
  { id: 'grain', name: 'Grain spawn', product: 'jar', unitName: 'clean colonized grain jars', units: 2, unitKey: 'cleanJars', guide: 'grain',
    checklist: [
      { key: 'cookedJars', n: 2, text: 'Pressure-cook 2 jars of grain' },
      { key: 'cleanSpawn', n: 1, text: 'Spawn a jar from a plate with no visible mold' },
      { key: 'shaken', n: 1, text: 'Break and shake a jar about a third of the way through' },
    ] },
  { id: 'substrate', name: 'Substrate', product: 'kit', unitName: 'clean colonized bags', units: 2, unitKey: 'cleanBags', guide: 'sub',
    checklist: [
      { key: 'matchedPrep', n: 2, text: 'Prep 2 bags the right way: rich mixes sterilized, plain straw or coir pasteurized' },
      { key: 'bagSpawned', n: 1, text: 'Spawn a bag from a clean grain jar' },
    ] },
  { id: 'fruiting', name: 'Fruiting', product: null, unitName: 'clusters picked at peak with good quality', units: 2, unitKey: 'goodHarvests', guide: 'fruit',
    checklist: [
      { key: 'movedToTent', n: 1, text: 'Move a colonized block into the grow tent' },
      { key: 'goodTent', n: 1, text: 'Hold a block at 70–85°F and 85–95% RH for a real day while it pins' },
    ] },
  { id: 'harvest', name: 'Harvest & market', product: 'dried', unitName: 'lb sold fresh at the farmers market', units: 6, unitKey: 'marketLb', guide: 'harvest',
    checklist: [
      { key: 'marketDays', n: 1, text: 'Sell fresh pinks at a farmers market' },
      { key: 'driedBatches', n: 1, text: 'Dehydrate a surplus instead of letting it rot' },
    ] },
];

/** Lion's mane: same shape as pinks, with a cool, fresh-air fruiting checklist. Agar and grain repeat what you learned on pinks. */
export const LIONS_STAGES = [
  { ...STAGES[0], checklist: [{ key: 'platesClean', n: 2, text: 'Pour 2 lion’s mane plates in the still-air box (it’s slower than pinks)' }, STAGES[0].checklist[1]] },
  STAGES[1],
  { id: 'substrate', name: 'Substrate', product: 'kit', unitName: 'clean colonized hardwood blocks', units: 2, unitKey: 'cleanBags', guide: 'sub',
    checklist: [
      { key: 'hardwoodBags', n: 2, text: 'Sterilize 2 supplemented hardwood bags (lion’s mane barely fruits on straw)' },
      { key: 'bagSpawned', n: 1, text: 'Spawn a bag from a clean grain jar' },
    ] },
  { id: 'fruiting', name: 'Fruiting', product: null, unitName: 'heads picked at peak with good quality', units: 2, unitKey: 'goodHarvests', guide: 'fruit',
    checklist: [
      { key: 'movedToTent', n: 1, text: 'Move a colonized block into the grow tent' },
      { key: 'goodTent', n: 1, text: 'Hold a block at 60–70°F and 85–95% RH for a real day while it pins (heat mat off)' },
    ] },
  { id: 'harvest', name: 'Harvest & market', product: 'dried', unitName: 'lb of lion’s mane sold at the farmers market', units: 5, unitKey: 'marketLb', guide: 'harvest',
    checklist: [
      { key: 'marketDays', n: 1, text: 'Sell fresh lion’s mane at a farmers market' },
    ] },
];
/** Wine cap: indoor agar and grain, then sawdust spawn, an outdoor bed, and harvest from the yard. */
export const WINE_STAGES = [
  { ...STAGES[0], checklist: [{ key: 'platesClean', n: 2, text: 'Pour 2 wine cap plates in the still-air box' }, STAGES[0].checklist[1]] },
  STAGES[1],
  { id: 'spawn', name: 'Sawdust spawn', product: null, unitName: 'clean colonized spawn bags', units: 2, unitKey: 'cleanBags', guide: 'sub',
    checklist: [
      { key: 'spawnBags', n: 2, text: 'Sterilize 2 hardwood sawdust spawn bags' },
      { key: 'bagSpawned', n: 1, text: 'Spawn a bag from a clean grain jar' },
    ] },
  { id: 'bed', name: 'Outdoor bed', product: null, unitName: 'real days of a moist bed colonizing (summed over beds)', units: 20, unitKey: 'bedMoistDays', guide: 'sub',
    checklist: [
      { key: 'hardwoodBed', n: 1, text: 'Build a bed from fresh hardwood chips (not conifer)' },
      { key: 'bedSpawned', n: 1, text: 'Inoculate a bed with a clean spawn bag' },
      { key: 'watered', n: 1, text: 'Water a bed when it dries out' },
    ] },
  { id: 'harvest', name: 'Harvest & market', product: null, unitName: 'lb of wine caps sold at the farmers market', units: 3, unitKey: 'marketLb', guide: 'harvest',
    checklist: [
      { key: 'bedHarvests', n: 1, text: 'Pick a wine cap flush from the bed before the veil tears' },
      { key: 'marketDays', n: 1, text: 'Sell wine caps at a farmers market' },
    ] },
];
export const LADDERS = { 'pink-oyster': STAGES, 'lions-mane': LIONS_STAGES, 'wine-cap': WINE_STAGES };

/** Expert mode only: liquid culture between agar and grain. Dilute broth, sterilized; one LC seeds many grain jars, and hides infection well. */
export const LC_STAGE = { id: 'lc', name: 'Liquid culture', product: null, unitName: 'grain jars seeded from clean, dilute LC', units: 3, unitKey: 'lcToGrain', guide: 'agar',
  checklist: [
    { key: 'diluteLC', n: 2, text: 'Mix and pressure-cook 2 LC jars at 1–4% light malt (not a rich “sugar bomb”)' },
    { key: 'cleanLC', n: 1, text: 'Colonize a liquid culture with no contamination' },
  ] };
/** A species' ladder; Expert runs insert the liquid-culture stage after agar. */
export const ladderOf = (species, expert = false) => { const L = LADDERS[species] || STAGES; return expert ? [L[0], LC_STAGE, ...L.slice(1)] : L; };

/** System → the stage ids that open it (the earliest one present in a ladder wins). */
export const OPENS_BY = { plate: ['agar'], lc: ['lc'], jar: ['lc', 'grain'], bag: ['substrate', 'spawn'], room: ['fruiting', 'bed'], market: ['fruiting', 'bed'], bed: ['bed'] };
/** Index in ladder L where `what` opens (Infinity if never). */
export function opensIndex(L, what) {
  const ix = (OPENS_BY[what] || []).map(id => L.findIndex(s => s.id === id)).filter(i => i >= 0);
  return OPENS_BY[what] ? (ix.length ? Math.min(...ix) : Infinity) : 0;
}

/** What opens while learning stage index s (and stays open after). `bed` is wine cap only. */
export const OPENS = { plate: 0, jar: 1, bag: 2, room: 3, market: 3, bed: 3 };

/** Online-shop products. Base prices are approximate US hobby retail; shop.stageMult scales later stages up. */
export const PRODUCTS = {
  plate: { name: 'Agar culture plate', stage: 0, base: 10, unit: 'plate', blurb: 'Clean, colonized pink oyster culture on MEA.' },
  jar:   { name: 'Grain spawn, 1 qt', stage: 1, base: 18, unit: 'jar', blurb: 'Fully colonized rye spawn, ready to mix into substrate.' },
  kit:   { name: 'Colonized grow kit', stage: 2, base: 25, unit: 'kit', blurb: 'A fully colonized block: cut an X, mist, and fruit at home.' },
  dried: { name: 'Dried mushrooms', stage: 4, base: 8, unit: 'fresh-lb', blurb: 'Dehydrated harvest, priced per pound of fresh weight.' },
};

/** Mentor (retired-mycologist neighbor) lines for weekly reviews. ≤3 lines per scene; ids map to audio/voice-lines.json later. */
export const MENTOR = {
  mastered: [
    { id: 'mentor_review_mastered_1', text: 'Fine. FINE. That was clean work. Don’t let it go to your head.' },
    { id: 'mentor_review_mastered_2', text: 'You did the boring parts right, which is the whole secret. Next stage.' },
  ],
  checklist: [
    { id: 'mentor_review_checklist_1', text: 'You’re rushing. Do the list first; the yield comes after the habits.' },
    { id: 'mentor_review_checklist_2', text: 'Not yet. Technique before numbers. Look at the list again.' },
  ],
  units: [
    { id: 'mentor_review_units_1', text: 'Habits are there. Now show me you can do it more than once.' },
    { id: 'mentor_review_units_2', text: 'Good list. Thin results. Another week, same care, more of it.' },
  ],
  mold: [
    { id: 'mentor_review_mold_1', text: 'Green. GREEN. I can smell it from here. Toss it, wipe down, start clean.' },
    { id: 'mentor_review_mold_2', text: 'Mold isn’t bad luck, it’s feedback. Read the cards below.' },
  ],
  species: [
    { id: 'mentor_species_mastered_1', text: 'Plate to market table. I may have to stop calling you “the kid next door.”' },
  ],
};
