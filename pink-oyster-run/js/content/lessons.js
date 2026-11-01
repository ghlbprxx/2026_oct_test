// Lesson cards: every loss maps to one of these (title, why, fix).
export const LESSONS = {
  cold_stall:      { stage: 'fruit', title: 'Too cold to pin', why: 'Pinks are tropical. Below ~64°F colonized blocks just sit there.', fix: 'Keep the fruiting room at 70–85°F. Run the heater.' },
  leggy:           { stage: 'fruit', title: 'Stale air, leggy clusters', why: 'High CO₂ gives long stems and small caps.', fix: 'Raise fresh air exchange, and add mist to make up for the drying.' },
  dry_caps:        { stage: 'fruit', title: 'Fresh air without humidity', why: 'Air exchange dries caps. Edges crack and curl.', fix: 'Raise misting as you add airflow. Aim for 85–95% RH.' },
  soggy:           { stage: 'fruit', title: 'Soggy room', why: 'Humidity above ~96% invites bacterial blotch on blocks.', fix: 'Ease off the mist. 85–95% RH is plenty.' },
  past_supplement: { stage: 'sub', title: 'Pasteurized a rich mix', why: 'Bran or soy with pasteurization only is near-guaranteed Trichoderma.', fix: 'Sterilize anything with bran or soy.' },
  steril_straw:    { stage: 'sub', title: 'Sterilized plain straw', why: 'Sterilizing kills the harmless microbes that protect straw, leaving a nutrient vacuum.', fix: 'Pasteurize plain straw (hot water or cold lime).' },
  past_grain:      { stage: 'grain', title: 'Pasteurized grain', why: 'Grain is too nutritious to pasteurize. Contaminants win.', fix: 'Pressure-sterilize grain 90–120 min at 15 psi.' },
  hidden_contam:   { stage: 'agar', title: 'Rich agar hid the mold', why: 'Super-rich agar races ahead and hides slow contaminants until they are already in your jars.', fix: 'Use MEA, or lean CMA when you need to read growth.' },
  expand_contam:   { stage: 'agar', title: 'Expanded from a moldy culture', why: '“It’s mostly white” still carries spores into everything downstream.', fix: 'Cut a clean leading edge onto a fresh plate first.' },
  coffee:          { stage: 'sub', title: 'Old coffee grounds', why: 'Week-old grounds are already colonized by mold.', fix: 'Use grounds under 24 h old, pasteurized and cut with straw.' },
  open_air:        { stage: 'agar', title: 'Open-air work', why: 'Every breath of moving air carries mold spores. Plates and jars opened on a bare counter catch them.', fix: 'Do plate work and inoculations inside a still-air box (or, later, in front of a flow hood).' },
  sab:             { stage: 'agar', good: true, title: 'Still air, fewer spores', why: 'A still-air box stops air currents, so spores settle instead of drifting onto your plates.', fix: 'Wipe it down with alcohol, move slowly, and work near the bottom.' },
  luck:            { stage: 'agar', title: 'Some loss is normal', why: 'Even with clean technique, a few vessels contaminate.', fix: 'Keep a few plates and jars going so one loss doesn’t stall the pipeline, and catch it early.' },
  rot:             { stage: 'harvest', title: 'Pinks don’t keep', why: 'Fresh pink oysters last about 1–2 days.', fix: 'Sell fresh fast, or dehydrate the surplus.' },
  overripe:        { stage: 'harvest', title: 'Missed the peak', why: 'Overripe clusters flatten, drop spores, then collapse.', fix: 'Pick when caps are broad but edges still curl down.' },
  flush3:          { stage: 'harvest', title: 'Chasing a long tail', why: 'After 1–2 strong flushes, yields fall off fast and old blocks invite mold.', fix: 'Plan around 1–2 flushes, then replace blocks.' },
  agar_job:        { stage: 'agar', good: true, title: 'Agar did its job', why: 'You caught mold on a plate and left it behind.', fix: 'Catch it early on agar so it never reaches grain.' },
  shake:           { stage: 'grain', good: true, title: 'Break and shake', why: 'Shaking at ~30% spreads colonized kernels so jars finish faster.', fix: 'Shake partway through; gypsum keeps kernels loose.' },
  dry_save:        { stage: 'harvest', good: true, title: 'Drying beats rotting', why: 'Dried pinks keep for months.', fix: 'Dehydrate whatever won’t sell fresh within a day or two.' },
};
export const LESSON_IDS = Object.keys(LESSONS);
