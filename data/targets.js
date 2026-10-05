// Target presets. MVP parameters only; anything omitted uses the registry default.
// Order is the Challenge unlock order. `focus` lists the ids the bio hints at.

export const TARGETS = [
  {
    id: 'stretch', name: 'Stretch', difficulty: 'Easy',
    bio: 'Basketball coach — tall, long-legged, covers ground without hurrying.',
    focus: ['height', 'legLength', 'strideLength', 'cadence'],
    params: { height: 1.98, legLength: 0.52, strideLength: 1.80, cadence: 100 },
  },
  {
    id: 'pip', name: 'Pip', difficulty: 'Easy',
    bio: 'Busy barista — short legs, always in a rush, tiny quick steps.',
    focus: ['height', 'legLength', 'strideLength', 'cadence'],
    params: { height: 1.52, legLength: 0.46, strideLength: 0.95, cadence: 132 },
  },
  {
    id: 'rosa', name: 'Rosa', difficulty: 'Normal',
    bio: 'Retired dancer — long legs and a big, confident hip sway.',
    focus: ['legLength', 'hipSway', 'pelvicRotation'],
    params: { legLength: 0.51, hipSway: 6.5, pelvicRotation: 11, strideLength: 1.45 },
  },
  {
    id: 'bo', name: 'Bo', difficulty: 'Normal',
    bio: 'Camp counselor — springy, long strides on short legs; bounces with every step.',
    focus: ['legLength', 'strideLength', 'doubleSupport', 'cadence'],
    params: { legLength: 0.45, strideLength: 1.65, doubleSupport: 0.12, cadence: 118 },
  },
  {
    id: 'grey', name: 'Mr. Grey', difficulty: 'Hard',
    bio: 'Night-shift accountant — stiff hips, shuffles, both feet linger on the ground.',
    focus: ['hipSway', 'pelvicRotation', 'pelvicTilt', 'doubleSupport', 'strideLength'],
    params: {
      hipSway: 0.5, pelvicRotation: 1.5, pelvicTilt: -2,
      doubleSupport: 0.36, strideLength: 0.90, cadence: 96, torsoLength: 0.32,
    },
  },
];
