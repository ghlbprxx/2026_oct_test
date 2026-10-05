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
    // Soft-tissue jiggle (linear, driven by the tissue anchor's acceleration). max = clamp (m).
    // gain and max are scaled per character by body fat and sex (core/body.js `tissue`).
    belly: { k: 230, c: 7, gain: 0.75, max: 0.04 },
    chest: { k: 200, c: 6, gain: 0.6, max: 0.035 },
    glute: { k: 260, c: 7, gain: 0.5, max: 0.025 },
    thigh: { k: 380, c: 10, gain: 0.4, max: 0.012 },
    arm: { k: 300, c: 8, gain: 0.8, max: 0.016 },
    cheek: { k: 800, c: 16, gain: 0.45, max: 0.006 },
    hair: { k: 45, c: 3.5, gain: 1, max: 0.09 },
    // Overlap (angular, follow-through on joints).
    upperArm: { k: 220, c: 22 },
    forearm: { k: 140, c: 14 },
    hand: { k: 160, c: 10 },
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
    // Realistic models per body type: static (unrigged) glTF meshes, auto-rigged at load. null → procedural body.
    // If a model fails to load (missing .bin/textures), the procedural body is used instead.
    models: { F: 'assets/person_v2/scene.gltf', M: null },
    modelCredits: { F: '“Female base mesh” by AK_anna (Sketchfab), CC BY 4.0' },
    // Marker/trail colors by body side.
    sideColors: { L: '#ff9f1c', R: '#7b61ff', C: '#1d3557' },
    cameras: [ // positions live in render/camera.js
      { id: 'threeQuarter', label: '3/4' },
      { id: 'side', label: 'Side' },
      { id: 'front', label: 'Front' },
    ],
  },
};
