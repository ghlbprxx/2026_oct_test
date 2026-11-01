// Week-intro cards (≤3 lines each). Phase 2 slow start: one new system per week.
// Phase 5 moves these lines to the mentor with voice ids.
export const WEEK_INTRO = {
  start: { title: 'Week 0: agar', lines: ['Everything starts on a petri dish.', 'Pour a few plates and watch them colonize.', 'Mold loves moving air. A still-air box keeps it out.'] },
  jar: { title: 'New: grain jars', lines: ['Jars of rye become spawn once a clean plate colonizes them.', 'Grain must be pressure-cooked: it’s too rich to pasteurize.', 'Shake jars around a third of the way through.'] },
  bag: { title: 'New: substrate bags', lines: ['Mix colonized grain into bulk substrate.', 'Richer mixes yield more, mold more, and colonize slower.', 'Rich mixes go in the cooker. Plain straw prefers a hot bath.'] },
  room: { title: 'New: the grow room', lines: ['Colonized blocks fruit in the spare room now. It’s cold in there.', 'Pinks pin at 70–85°F, need fresh air, and hate dry air.', 'Market every few days. Fresh pinks last 1–3 days.'] },
  plain: { title: 'Week {n}', lines: ['Keep the pipeline moving: plates feed jars, jars feed bags.'] },
};
