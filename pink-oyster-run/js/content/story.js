// Story mode script: the mentor (retired-mycologist neighbor) and the forum guru.
// Rules (brief): at most 3 lines per scene, speech bubbles only, every line has a stable `id`
// (Phase 7 maps ids to audio/voice-lines.json). Free play uses none of this; the systems are identical.

export const CAST = {
  mentor: { name: 'Dr. Ines Marlow', role: 'Retired mycologist, next door', portrait: 'portrait_mentor', alt: 'Your neighbor, a retired mycologist with round glasses' },
  guru: { name: 'u/SporeLord_9000', role: 'Forum guru, 41k karma', portrait: 'portrait_guru', alt: 'The forum guru, grinning, holding a phone' },
};

const L = (id, who, text) => ({ id, who, text });

/** Scenes keyed by trigger. `once`: plays at most once per run (tracked in g.story.seen). */
export const SCENES = {
  intro: { once: true, lines: [
    L('mentor_intro_1', 'mentor', 'You. The one with the petri dishes in the recycling. I was a mycologist for forty years.'),
    L('mentor_intro_2', 'mentor', 'Mold is not bad luck. It is bad habits. I will teach you habits.'),
    L('guru_intro_1', 'guru', 'lol just inoculate on the counter bro, spores are everywhere anyway 🍄🔥'),
  ] },
  stage_grain: { once: true, lines: [
    L('mentor_stage_grain_1', 'mentor', 'Clean plates. Now grain. Rye, soaked, simmered, pressure-cooked. No shortcuts.'),
    L('guru_stage_grain_1', 'guru', 'Pasteurizing grain works fine if you believe in it.'),
    L('mentor_stage_grain_2', 'mentor', 'It does not. Grain is a buffet. Sterilize it or feed the mold.'),
  ] },
  stage_substrate: { once: true, lines: [
    L('mentor_stage_substrate_1', 'mentor', 'Bulk substrate. The richer the mix, the more it yields, and the more it molds.'),
    L('mentor_stage_substrate_2', 'mentor', 'Straw gets a hot bath. Anything with bran goes in the cooker. Write that on your hand.'),
  ] },
  stage_fruiting: { once: true, lines: [
    L('mentor_stage_fruiting_1', 'mentor', 'Fruiting. Pinks are tropical drama queens: warm, wet, and plenty of fresh air.'),
    L('guru_stage_fruiting_1', 'guru', 'Golden oysters are way prettier tho, why not grow those?'),
    L('mentor_golden_aside_1', 'mentor', 'Because goldens escaped grow kits and now crowd out native fungi in US forests. Pinks stay put. We grow pinks.'),
  ] },
  stage_harvest: { once: true, lines: [
    L('mentor_stage_harvest_1', 'mentor', 'Harvest and market. A pink oyster is perfect for about a day, then it is soup.'),
    L('mentor_stage_harvest_2', 'mentor', 'Sell it fresh, or dry it. Rotting it is not a sales strategy.'),
  ] },
  first_mold: { once: true, lines: [
    L('mentor_first_mold_1', 'mentor', 'Green. GREEN. Do you see that? That is Trichoderma waving at you.'),
    L('mentor_first_mold_2', 'mentor', 'Toss it, don’t open it indoors, and read the lesson card. Then do better.'),
  ] },
  coffee_yes: { once: true, lines: [
    L('mentor_coffee_yes_1', 'mentor', 'Week-old coffee grounds? They are already a mold farm. Watch that bag closely.'),
  ] },
  coffee_no: { once: true, lines: [
    L('mentor_coffee_no_1', 'mentor', 'You turned down free week-old grounds. Good. Fresh, same-day grounds only.'),
  ] },
  cold_snap: { once: true, lines: [
    L('mentor_cold_snap_1', 'mentor', 'Cold snap coming. Pinks stall below about 64°F. Heat mat on, garage jars inside.'),
  ] },
  species_done: { once: true, lines: [
    L('mentor_species_done_1', 'mentor', 'Plate to market table. I may have to stop calling you “the kid next door.”'),
    L('mentor_wood_chips_1', 'mentor', 'An arborist just dumped a free truckload of hardwood chips on my driveway. Wine caps love those.'),
    L('guru_wood_chips_1', 'guru', 'pine chips work too, chips are chips 🌲'),
  ] },
};

/** Forum-guru framing for the market myth quiz: the guru states the claim as fact.
 *  He is right exactly when the myth is a fact (6 of 13, so roughly half the time). */
export const GURU = {
  opener: [
    L('guru_quiz_open_1', 'guru', 'Posting this for the noobs. Trust me, I’ve grown for 3 months:'),
    L('guru_quiz_open_2', 'guru', 'Hot take, but I’m right as usual:'),
    L('guru_quiz_open_3', 'guru', 'PSA, upvote so people see it:'),
  ],
  // the mentor's reaction once you answer
  guruRight: [
    L('mentor_guru_right_1', 'mentor', '…He’s right. Once. Don’t tell him I said so.'),
    L('mentor_guru_right_2', 'mentor', 'Fine. A broken clock, et cetera. That one is true.'),
  ],
  guruWrong: [
    L('mentor_guru_wrong_1', 'mentor', 'Confidently wrong again. Remarkable consistency.'),
    L('mentor_guru_wrong_2', 'mentor', 'Forty years of research, and I lose to a man with a ring light.'),
  ],
};

/** All voice-line ids, for tests and the Phase 7 voice manifest. */
export function allLines() {
  const out = [];
  for (const s of Object.values(SCENES)) out.push(...s.lines);
  for (const list of Object.values(GURU)) out.push(...list);
  return out;
}
