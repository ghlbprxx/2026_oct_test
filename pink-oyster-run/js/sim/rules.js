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
  heaterStep: 6,                      // °F per heat-mat step in the tent
  handMistMax: 88,                    // tent mist cap without a humidifier
  snapHouseDrop: 2,                   // a cold snap chills the house a little, the garage a lot
  bagUnits: 3.5,                      // a grow bag takes 3.5 jar-spaces in a cooker
  scaleFactor: 0.85, sealerFactor: 0.8, // prep gear: mold multipliers
  garageLesson: 2,                    // real days colonizing below 60°F before the lesson fires
  coldSnapDrop: 8, coldSnapDays: 4,   // game days
  quizTip: 3, quizChance: 0.35,
  relaxedRotMult: 1.5,                // Relaxed: fresh lasts longer, peak lasts longer
  LB: 2.20462,
};
