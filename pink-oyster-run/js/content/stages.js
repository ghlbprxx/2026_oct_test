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
/** What opens while learning stage index s (and stays open after). */
export const OPENS = { plate: 0, jar: 1, bag: 2, room: 3, market: 3 };

/** Online-shop products. Base prices are approximate US hobby retail; shop.stageMult scales later stages up. */
export const PRODUCTS = {
  plate: { name: 'Agar culture plate', stage: 0, base: 10, unit: 'plate', blurb: 'Clean, colonized pink oyster culture on MEA.' },
  jar:   { name: 'Grain spawn, 1 qt', stage: 1, base: 18, unit: 'jar', blurb: 'Fully colonized rye spawn, ready to mix into substrate.' },
  kit:   { name: 'Colonized grow kit', stage: 2, base: 25, unit: 'kit', blurb: 'A fully colonized block: cut an X, mist, and fruit at home.' },
  dried: { name: 'Dried pink oysters', stage: 4, base: 8, unit: 'fresh-lb', blurb: 'Dehydrated harvest, priced per pound of fresh weight.' },
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
