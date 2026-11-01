// Fixed simulation rules (not worth an admin knob). Durations here are real-world (bio) days.
export const RULES = {
  daysPerWeek: 5,
  plateUses: 3, jarUses: 2,           // one plate -> 3 jars, one jar -> 2 bags
  cmaSpeed: 0.65, cmaReveal: 0.35, superSpeed: 2, superAgarHide: 3,
  shakeFrom: 0.2, shakeTo: 0.65,      // shake window (share colonized)
  shakeBoost: 0.35,                   // share of remaining jar time a shake removes
  stallLesson: 3,                     // real days stalled before the cold lesson fires
  soggyHazard: 0.015, heatHazard: 0.015, flush3Hazard: 0.025, // per real day
  flushMult: [1, 0.5, 0.15],          // pinks front-load their yield
  stageMult: { young: 0.6, peak: 1, overripe: 0.7 },
  heaterStep: 8,                      // °F per heater step
  incubationTemp: 72,                 // the closet before the grow room unlocks
  coldSnapDrop: 8, coldSnapDays: 4,   // game days
  quizTip: 3, quizChance: 0.35,
  relaxedRotMult: 1.5,                // Relaxed: fresh lasts longer, peak lasts longer
  LB: 2.20462,
};
