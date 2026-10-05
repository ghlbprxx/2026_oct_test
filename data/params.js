// Parameter registry. Adding a factor = add an entry here + read params[id] in core/.
// The sidebar, scoring, breakdown, and hints are all generated from this list.

export const GROUPS = [
  { id: 'proportions', label: 'Proportions', enabled: true },
  { id: 'timing', label: 'Timing', enabled: true },
  { id: 'pelvis', label: 'Pelvis', enabled: true },
  { id: 'joints', label: 'Joint ranges', enabled: false },
  { id: 'posture', label: 'Posture', enabled: false },
  { id: 'arms', label: 'Arm swing', enabled: false },
  { id: 'asymmetry', label: 'Asymmetry & limp', enabled: false },
  { id: 'mass', label: 'Body mass', enabled: false },
];

const entry = (e) => ({ weight: 1, enabled: true, ...e });

// Builds the plain-language strings shared by most entries.
const words = (noun, small = 'too small', large = 'too large') => ({
  hint: { vague: `Watch the ${noun}`, low: `Increase ${noun}`, high: `Decrease ${noun}` },
  mismatch: { low: `${cap(noun)} ${small}`, high: `${cap(noun)} ${large}` },
});
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export const PARAMS = [
  // ── Proportions ──────────────────────────────────────────────
  entry({
    id: 'height', group: 'proportions', label: 'Height', unit: 'm',
    min: 1.40, max: 2.05, step: 0.01, default: 1.70,
    explain: 'Overall body size. Taller people have longer limbs, so every motion covers more distance even at the same rhythm.',
    hint: { vague: 'Compare how big they are', low: 'Make the body taller', high: 'Make the body shorter' },
    mismatch: { low: 'Too short overall', high: 'Too tall overall' },
  }),
  entry({
    id: 'legLength', group: 'proportions', label: 'Leg length', unit: '× height',
    min: 0.44, max: 0.54, step: 0.005, default: 0.48,
    explain: 'Hip-joint height as a fraction of body height. Long legs reach farther per step and keep the body higher; short legs force a bouncier walk for the same stride.',
    ...words('leg length', 'too short', 'too long'),
    hint: { vague: 'Look at the legs', low: 'Lengthen the legs', high: 'Shorten the legs' },
  }),
  entry({
    id: 'thighShinRatio', group: 'proportions', label: 'Thigh / shin ratio', unit: '',
    min: 0.90, max: 1.30, step: 0.01, default: 1.08, weight: 0.7,
    explain: 'How the leg is split between thigh and shin. A longer thigh lifts the knee higher in swing; a longer shin lengthens the lower-leg reach.',
    hint: { vague: 'Watch where the knees are', low: 'Lengthen the thighs relative to the shins', high: 'Lengthen the shins relative to the thighs' },
    mismatch: { low: 'Thighs too short for the shins', high: 'Thighs too long for the shins' },
  }),
  entry({
    id: 'torsoLength', group: 'proportions', label: 'Torso length', unit: '× height',
    min: 0.26, max: 0.36, step: 0.005, default: 0.30, weight: 0.7,
    explain: 'Pelvis-to-neck length as a fraction of height. A longer torso puts the shoulders higher and swings the upper body over a longer lever.',
    ...words('torso length', 'too short', 'too long'),
  }),
  entry({
    id: 'armLength', group: 'proportions', label: 'Arm length', unit: '× height',
    min: 0.40, max: 0.48, step: 0.005, default: 0.44, weight: 0.7,
    explain: 'Shoulder-to-fingertip length. Longer arms swing in bigger arcs, and their hands hang lower beside the thighs.',
    ...words('arm length', 'too short', 'too long'),
    hint: { vague: 'Look at the hands', low: 'Lengthen the arms', high: 'Shorten the arms' },
  }),

  // ── Timing ───────────────────────────────────────────────────
  entry({
    id: 'cadence', group: 'timing', label: 'Cadence', unit: 'steps/min',
    min: 80, max: 140, step: 1, default: 110, weight: 4,
    explain: 'How many steps per minute. Hurried walkers take quick steps; relaxed or tall walkers often use a slower rhythm.',
    hint: { vague: 'Listen to the rhythm of the steps', low: 'Step faster (raise cadence)', high: 'Step slower (lower cadence)' },
    mismatch: { low: 'Steps too slow', high: 'Steps too fast' },
  }),
  entry({
    id: 'strideLength', group: 'timing', label: 'Stride length', unit: 'm',
    min: 0.80, max: 1.90, step: 0.01, default: 1.40, weight: 1.2,
    explain: 'Distance covered by one full stride (two steps). Speed = stride × stride frequency. Long strides on short legs make the body rise and fall more.',
    hint: { vague: 'Watch how far the feet travel', low: 'Lengthen the stride', high: 'Shorten the stride' },
    mismatch: { low: 'Stride too short', high: 'Stride too long' },
  }),
  entry({
    id: 'doubleSupport', group: 'timing', label: 'Double-support time', unit: '× cycle',
    min: 0.10, max: 0.40, step: 0.01, default: 0.20,
    explain: 'Fraction of each stride with both feet on the ground. Cautious or stiff walkers keep both feet down longer; brisk walkers spend more time on one leg.',
    hint: { vague: 'Watch when both feet are on the ground', low: 'Keep both feet down longer', high: 'Spend less time on both feet' },
    mismatch: { low: 'Both feet down too briefly', high: 'Both feet down too long' },
  }),

  // ── Pelvis ───────────────────────────────────────────────────
  entry({
    id: 'hipSway', group: 'pelvis', label: 'Hip sway', unit: 'cm',
    min: 0, max: 8, step: 0.1, default: 2.5, weight: 1.2,
    explain: 'Side-to-side shift of the pelvis over the standing leg. Wider hips, narrow foot placement, and a relaxed style increase it.',
    hint: { vague: 'Watch the hips', low: 'Increase hip sway', high: 'Decrease hip sway' },
    mismatch: { low: 'Hip sway too small', high: 'Hip sway too large' },
  }),
  entry({
    id: 'pelvicRotation', group: 'pelvis', label: 'Pelvic rotation', unit: '°',
    min: 0, max: 15, step: 0.5, default: 6,
    explain: 'How much the pelvis twists about the vertical axis each step, bringing the swinging hip forward. Bigger rotation lengthens the step without longer legs.',
    hint: { vague: 'Look at the hips from above', low: 'Twist the pelvis more', high: 'Twist the pelvis less' },
    mismatch: { low: 'Pelvis twists too little', high: 'Pelvis twists too much' },
  }),
  entry({
    id: 'pelvicTilt', group: 'pelvis', label: 'Pelvic tilt', unit: '°',
    min: -5, max: 20, step: 0.5, default: 8, weight: 0.8,
    explain: 'Forward (anterior) tilt of the pelvis. More tilt arches the lower back and sticks the hips out behind; negative tilt tucks the pelvis under.',
    hint: { vague: 'Look at the lower back', low: 'Tilt the pelvis forward more', high: 'Tuck the pelvis under more' },
    mismatch: { low: 'Pelvis tucked too much', high: 'Pelvis tilted forward too much' },
  }),

  // ── Later (registered, disabled) ─────────────────────────────
  ...[
    ['hipRange', 'Hip range', '°', 20, 60, 40],
    ['kneeRange', 'Knee range', '°', 30, 80, 60],
    ['ankleRange', 'Ankle range', '°', 15, 50, 30],
    ['shoulderRange', 'Shoulder range', '°', 10, 60, 35],
    ['elbowRange', 'Elbow range', '°', 5, 60, 25],
  ].map(([id, label, unit, min, max, def]) => stub(id, 'joints', label, unit, min, max, def)),
  stub('trunkLean', 'posture', 'Trunk lean', '°', -5, 20, 3),
  stub('headCarriage', 'posture', 'Head carriage', 'cm', -5, 10, 0),
  stub('shoulderSlump', 'posture', 'Shoulder slump', '°', 0, 25, 5),
  stub('armSwingAmp', 'arms', 'Arm swing amplitude', '°', 0, 45, 18),
  stub('armSwingAsym', 'arms', 'Arm swing asymmetry', '%', -50, 50, 0),
  stub('strideAsym', 'asymmetry', 'Stride asymmetry', '%', -30, 30, 0),
  stub('limp', 'asymmetry', 'Limp', '', 0, 1, 0),
  stub('bodyMass', 'mass', 'Body mass', 'kg', 40, 140, 70),
  stub('massDistribution', 'mass', 'Weight distribution', '', -1, 1, 0),
];

function stub(id, group, label, unit, min, max, def) {
  return entry({
    id, group, label, unit, min, max, default: def, enabled: false,
    step: (max - min) / 100,
    explain: 'Coming soon.',
    ...words(label.toLowerCase()),
  });
}

export const paramById = Object.fromEntries(PARAMS.map((p) => [p.id, p]));
