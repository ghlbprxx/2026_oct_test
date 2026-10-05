// Target presets: 5 women, 5 men. MVP parameters only; anything omitted uses the registry default.
// `sex` shapes the body (and where fat sits) but is not scored. Order is the Challenge unlock order.
// `focus` lists the ids the bio hints at.

export const TARGETS = [
  {
    id: 'stretch', name: 'Stretch', sex: 'M', difficulty: 'Easy',
    bio: 'Basketball coach — tall, long-legged, covers ground without hurrying.',
    focus: ['height', 'legLength', 'strideLength', 'cadence'],
    params: { height: 1.98, legLength: 0.52, strideLength: 1.80, cadence: 100, bodyFat: 16 },
  },
  {
    id: 'pip', name: 'Pip', sex: 'F', difficulty: 'Easy',
    bio: 'Busy barista — short legs, always in a rush, tiny quick steps.',
    focus: ['height', 'legLength', 'strideLength', 'cadence'],
    params: { height: 1.52, legLength: 0.46, strideLength: 0.95, cadence: 132, bodyFat: 26 },
  },
  {
    id: 'dana', name: 'Dana', sex: 'F', difficulty: 'Easy',
    bio: 'Track coach — lean and long-striding; powers along with brisk steps.',
    focus: ['bodyFat', 'strideLength', 'cadence', 'doubleSupport'],
    params: { height: 1.74, strideLength: 1.62, cadence: 122, doubleSupport: 0.14, bodyFat: 15 },
  },
  {
    id: 'rosa', name: 'Rosa', sex: 'F', difficulty: 'Normal',
    bio: 'Retired dancer — long legs and a big, confident hip sway.',
    focus: ['legLength', 'hipSway', 'pelvicRotation'],
    params: { height: 1.68, legLength: 0.51, hipSway: 6.5, pelvicRotation: 11, strideLength: 1.45, bodyFat: 20 },
  },
  {
    id: 'bo', name: 'Bo', sex: 'M', difficulty: 'Normal',
    bio: 'Camp counselor — springy, long strides on short legs; bounces with every step.',
    focus: ['legLength', 'strideLength', 'doubleSupport', 'cadence'],
    params: { legLength: 0.45, strideLength: 1.50, doubleSupport: 0.12, cadence: 118, bodyFat: 24 },
  },
  {
    id: 'marisol', name: 'Marisol', sex: 'F', difficulty: 'Normal',
    bio: 'Night-shift nurse — curvy, comfy shoes, relaxed rolling hips at the end of a long shift.',
    focus: ['bodyFat', 'hipSway', 'cadence', 'strideLength'],
    params: { height: 1.62, bodyFat: 36, hipSway: 4.8, pelvicRotation: 8, cadence: 104, strideLength: 1.20 },
  },
  {
    id: 'earl', name: 'Big Earl', sex: 'M', difficulty: 'Normal',
    bio: 'Long-haul trucker — heavyset, wide stance, slow rolling gait that lingers on both feet.',
    focus: ['bodyFat', 'cadence', 'strideLength', 'hipSway', 'doubleSupport'],
    params: { height: 1.80, bodyFat: 40, cadence: 94, strideLength: 1.25, hipSway: 4.2, pelvicRotation: 4, doubleSupport: 0.27 },
  },
  {
    id: 'kenji', name: 'Kenji', sex: 'M', difficulty: 'Hard',
    bio: 'Marathoner — wiry, light quick steps, barely any hip motion; efficiency over flair.',
    focus: ['bodyFat', 'cadence', 'hipSway', 'pelvicRotation', 'doubleSupport'],
    params: { height: 1.70, legLength: 0.50, bodyFat: 9, cadence: 124, strideLength: 1.55, hipSway: 1.2, pelvicRotation: 4, doubleSupport: 0.13 },
  },
  {
    id: 'june', name: 'June', sex: 'F', difficulty: 'Hard',
    bio: 'Retired librarian, 78 — careful, slow, short steps with both feet down a long time.',
    focus: ['cadence', 'strideLength', 'doubleSupport', 'hipSway', 'pelvicRotation'],
    params: {
      height: 1.56, bodyFat: 32, cadence: 92, strideLength: 0.85, doubleSupport: 0.34,
      hipSway: 1.5, pelvicRotation: 3, pelvicTilt: 3, torsoLength: 0.31,
    },
  },
  {
    id: 'grey', name: 'Mr. Grey', sex: 'M', difficulty: 'Hard',
    bio: 'Night-shift accountant — stiff hips, shuffles, both feet linger on the ground.',
    focus: ['hipSway', 'pelvicRotation', 'pelvicTilt', 'doubleSupport', 'strideLength'],
    params: {
      hipSway: 0.5, pelvicRotation: 1.5, pelvicTilt: -2,
      doubleSupport: 0.36, strideLength: 0.90, cadence: 96, torsoLength: 0.32, bodyFat: 25,
    },
  },
];
