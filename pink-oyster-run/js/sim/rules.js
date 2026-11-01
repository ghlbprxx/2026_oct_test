// Fixed simulation rules (not worth an admin knob).
export const RULES = {
  plateUses: 3, jarUses: 2,           // one plate -> 3 jars, one jar -> 2 bags
  bathDays: 0.5,                      // hot-water pasteurization time
  cmaSpeed: 0.65, cmaReveal: 0.35, superSpeed: 2,
  shakeFrom: 0.2, shakeTo: 0.65,      // shake window (share colonized)
  stallLesson: 1.5,                   // days stalled before the cold lesson fires
  graceDays: 4,                       // no new infections before this day: fair onboarding
  soggyHazard: 0.03, heatHazard: 0.03, flush3Hazard: 0.05,
  flushMult: [1, 0.5, 0.15],          // pinks front-load their yield
  stageMult: { young: 0.6, peak: 1, overripe: 0.7 },
  coldSnapDrop: 8, coldSnapDays: 4, quizTip: 3,
};
