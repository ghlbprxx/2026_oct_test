// Every tunable number in one place: thresholds, timers, score weights, physics.

export const CONFIG = {
  storageKey: 'walkThisWay.v1',

  thresholds: { easy: 85, normal: 92, hard: 97 },
  timedSeconds: 90,

  score: {
    wTraj: 0.6,          // weight of visible-motion similarity
    wParam: 0.4,         // weight of parameter closeness
    kTraj: 25,           // falloff for trajectory RMS error (fraction of height)
    kParam: 6,           // falloff for weighted normalized parameter error
    samples: 32,         // phases sampled per gait cycle
    tracked: ['head', 'pelvis', 'hand_L', 'hand_R', 'foot_L', 'foot_R'],
    breakdownSize: 3,
  },

  sim: {
    fixedStep: 1 / 120,  // physics/spring step (s)
    frameStep: 1 / 60,   // sim time advanced by one "frame step" click (s)
    maxStepsPerFrame: 30,
    speeds: [0.1, 0.25, 0.5, 1, 1.5, 2],
    phaseLockTolerance: 0.02, // relative cadence difference under which Player syncs to Target
    phaseLockRate: 2,         // 1/s
  },

  springs: {
    // Soft-body jiggle (linear, driven by parent acceleration). max = clamp (m).
    belly: { k: 600, c: 18, gain: 1, max: 0.025 },
    chest: { k: 800, c: 20, gain: 1, max: 0.018 },
    cheek: { k: 1200, c: 22, gain: 1, max: 0.006 },
    // Overlap (angular, follow-through on joints).
    upperArm: { k: 220, c: 22 },
    forearm: { k: 140, c: 14 },
    head: { k: 260, c: 20, accelGain: 0.8 },
    chestRoll: { k: 300, c: 24 },
    maxAccel: 40,        // clamp for finite-difference accelerations (m/s²)
  },

  // Motion trails (history is recorded in core at the fixed sim rate; drawn by render/trails.js).
  trails: {
    cycles: 1.0,           // strides of history per trail
    width: 3,              // px
    points: [              // [point name, side] — see core/skeleton.js pointSpec
      ['toe_L', 'L'], ['toe_R', 'R'], ['hand_L', 'L'], ['hand_R', 'R'], ['headTop', 'C'], ['pelvis', 'C'],
    ],
  },

  render: {
    laneOffset: 0.8,     // ±x of Target / Player lanes (m)
    floorSpan: 8,        // looping-floor length (m)
    ghostOpacity: 0.35,
    // Marker/trail colors by body side.
    sideColors: { L: '#ff9f1c', R: '#7b61ff', C: '#1d3557' },
    cameras: [ // positions live in render/camera.js
      { id: 'threeQuarter', label: '3/4' },
      { id: 'side', label: 'Side' },
      { id: 'front', label: 'Front' },
    ],
  },
};
