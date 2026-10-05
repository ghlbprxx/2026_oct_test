# Walk This Way — Gait-Matching Browser Game

> **Status: Plan only.** Nothing is implemented yet. This document records the design decisions, architecture, and build order.

An educational browser game in the style of The Sims. Every character has its own human-like walk. The player watches a **Target** character walk, then reverse-engineers that walk by adjusting the **Player** character's body and gait parameters until the two match. Along the way, the player learns which physical factors shape how a person walks.

---

## 1. Tech Stack

| Concern | Choice |
|---|---|
| UI framework | Vue 3 `3.5.43`, ESM browser build via CDN, pinned |
| 3D | Three.js `0.186.1`, ES modules via CDN, pinned through an import map |
| Build tools | None |
| Platform | Desktop browsers only (Chrome, Firefox, Edge, Safari) |
| Persistence | `localStorage` behind a try/catch wrapper |

Import map (in `index.html`):

```html
<script type="importmap">
{
  "imports": {
    "vue": "https://unpkg.com/vue@3.5.43/dist/vue.esm-browser.prod.js",
    "three": "https://unpkg.com/three@0.186.1/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.186.1/examples/jsm/"
  }
}
</script>
```

---

## 2. Design Decisions

Each decision compares three approaches. The chosen one is marked ✅.

### 2.1 Character construction and rendering

| Approach | Pros | Cons |
|---|---|---|
| ✅ **A. Bone hierarchy of `Object3D`s, each with capsule/sphere meshes attached** | Simple; joints rotate naturally; each segment can be scaled from parameters; easy to debug | Visible seams at joints (hidden with sphere "joint caps") |
| B. One procedural `SkinnedMesh` (capsule geometry generated and skinned to a skeleton) | Smooth, continuous body; closest to a final glTF | Weight painting in code is fiddly; rebuilding on every proportion change is costly |
| C. `InstancedMesh` primitives driven by matrices computed in core | Fastest draw calls | Over-engineered for two characters; harder to attach jiggle children |

**Why A:** It's the fastest path to a readable, friendly figure, and proportion sliders map directly to segment lengths.

**Swap-proofing:** `core/` never sees meshes. It outputs a renderer-agnostic **`Pose`**: a map of bone name → `{ position?, quaternion }`, plus jiggle offsets. `render/` implements one interface:

```js
// render/characterView.js — the contract every character implementation follows
createCharacterView(scene, { colors }) → {
  build(bodyDims),       // (re)build segments from computed proportions
  applyPose(pose),       // per-frame update
  setOpacity(alpha),     // used by the ghost overlay
  dispose()
}
```

Later, a rigged glTF or a skinned-mesh view implements the same interface plus a bone-name map (`BONE_MAP` from canonical names to rig names). Nothing outside `render/` changes.

Canonical bones: `root, pelvis, spine, chest, neck, head, shoulder_{L,R}, upperArm_{L,R}, forearm_{L,R}, hand_{L,R}, thigh_{L,R}, shin_{L,R}, foot_{L,R}`. Jiggle nodes: `belly, chest_soft, cheek_{L,R}`.

### 2.2 Animation and gait system

| Approach | Pros | Cons |
|---|---|---|
| ✅ **A. Procedural parametric gait cycle (phase-driven) with an analytic 2-bone leg IK component** | Every parameter has a direct, explainable effect; deterministic, so it can be sampled for scoring; feet plant without sliding | Takes tuning to avoid a robotic look (fixed with phase offsets, easing, and secondary springs) |
| B. Full IK-driven foot placement (feet planned first, body solved to follow) | Very grounded | Parameters affect the motion indirectly, which weakens the teaching value; harder to sample deterministically |
| C. Keyframe blending (hand-authored clips blended by parameters) | Can look great | Needs authored clips; parameters become blend weights rather than physical factors; extrapolates poorly |

**Why A:** The game is about cause and effect between body and walk. A parametric model makes each slider a real physical knob, and IK keeps the feet honest.

**Model outline** (`core/gait.js`, pure functions):

- **Phase:** `φ ∈ [0,1)` per full stride (two steps). Cycle frequency `f = cadence / 120` Hz, with cadence in steps/min.
- **Speed:** `v = strideLength · f`. On the treadmill, the ground moves backward at `v`.
- **Stance fraction:** `stance = 0.5 + doubleSupport / 2`, where `doubleSupport` is the total double-support fraction of the cycle. Typical walking gives about 0.6.
- **Foot path** (in the pelvis frame): during stance, the foot moves backward linearly at ground speed (planted). During swing, a smooth eased arc moves it forward with clearance scaled to leg length. The right leg is offset by φ + 0.5.
- **Leg IK:** an analytic 2-bone solve (thigh and shin lengths from the proportions) gives hip flexion and knee flexion. The ankle keeps the foot flat during mid-stance and adds a heel-strike dorsiflexion and toe-off plantarflexion roll.
- **Pelvis:**
  - lateral sway `= hipSway · sin(2πφ)`
  - yaw rotation `= pelvicRotation · sin(2πφ)`
  - obliquity (frontal tilt) drops on the swing side
  - anterior tilt is set by `pelvicTilt` as a static offset plus a small 2× frequency wobble
- **Vertical bob:** from the inverted-pendulum model, `bob = L − √(L² − (stride/4)²)` at 2× frequency, where `L` is leg length. A longer stride or shorter legs means a bouncier walk, with no extra parameter needed.
- **Arms:** counter-swing opposite the same-side leg. Amplitude is derived from stride until the Arm-swing group ships. A small elbow flex keeps them from looking rigid.
- **Head:** counter-rotates against pelvis yaw to stay facing forward. Bob comes from the trunk.
- **Anti-stiffness:** cubic easing on the swing arcs, slight phase lags down the chain (pelvis → spine → chest → head), and secondary-motion springs (see 2.4) layered on top.

The output is `Pose` plus world foot positions, which the scorer also uses.

### 2.3 Match scoring

| Approach | Pros | Cons |
|---|---|---|
| A. Joint-angle curves over one gait cycle | Captures how the walk looks | Hard to explain which parameter is wrong; angle error doesn't reflect size differences such as height |
| B. End-effector trajectories (feet, hands, head, pelvis) over one cycle | Matches what the eye sees; reflects size | Different parameter combinations can produce near-identical paths, so it can't drive per-parameter hints alone |
| ✅ **C. Weighted blend: trajectory similarity plus normalized parameter distance** | Score tracks the visible match; the parameter term drives the plain-language breakdown and hints | Two terms to tune (weights live in config) |

**Why C:** Players are judged on what they see, but teaching needs to name the specific factor that's off.

**Formula** (`core/scoring.js`):

1. Sample both gaits analytically at `N = 32` evenly spaced phases. Sampling uses the math model, not the render, so the score is stable, cheap, and independent of frame rate.
2. **Trajectory error:** RMS distance across tracked points (`head, pelvis, hand_L/R, foot_L/R`), in meters, normalized by the Target's height.
3. **Parameter error:** `Σ wᵢ · ((pᵢ − tᵢ) / (maxᵢ − minᵢ))²` over enabled parameters.
4. `score = 100 · (wTraj · e^(−kTraj·trajErr) + wParam · e^(−kParam·paramErr))`, with `wTraj + wParam = 1`.

Defaults are `wTraj = 0.6` and `wParam = 0.4`. All of `k`, `w`, `N`, and the tracked points live in `data/config.js`.

The score is recomputed whenever a parameter changes, debounced to animation frames, so the display updates live.

**Breakdown:** parameters are sorted by weighted normalized error and shown as the top 3, phrased from the registry (`"Stride too short"` / `"Hip sway too large"`).

### 2.4 Secondary motion and jiggle

| Approach | Pros | Cons |
|---|---|---|
| ✅ **A. Damped springs per jiggle point and per lagging joint (semi-implicit Euler, fixed timestep)** | Stable; tunable per region (stiffness, damping); deterministic; maps cleanly to a future body-mass parameter | Needs a fixed-step accumulator |
| B. Verlet point masses with constraints | Good for chains and cloth | Overkill for 4 jiggle points; constraint tuning; harder to make deterministic under variable speed |
| C. Sine-based fake | Trivial | Doesn't respond to the actual motion; can't settle; looks fake in slow motion |

**Why A:** Springs react to the real accelerations of the gait and settle naturally when the walk is paused or stepped. They're also pure math, so they live in `core/`.

- `core/springs.js`: 3D vector springs (belly, chest, cheeks) driven by their parent bone's world acceleration, plus angular springs for overlap (head, forearms, chest lag behind their parents).
- The fixed step is 1/120 s, run through an accumulator. Playback speed scales simulation time. **Frame step** advances exactly 1/60 s of simulation time.
- Displacement is clamped per region to prevent explosions at extreme slider values.

---

## 3. Architecture

```
index.html          import map, app mount point, canvas container
styles.css          design tokens (CSS custom properties), layout
main.js             wiring: creates core state, render layer, Vue app; runs the RAF loop

core/               pure JS — NO three.js, NO vue imports
  gait.js           parametric gait → Pose + tracked points for a phase
  body.js           parameters → body dimensions (segment lengths, radii)
  ik.js             analytic 2-bone IK
  springs.js        fixed-step damped linear/angular springs
  scoring.js        sampling, trajectory + parameter error, breakdown
  hints.js          progressive hint generator
  modes.js          Sandbox / Challenge / Timed state machines
  game.js           top-level game state (selected target, mode, params, playback)
  clock.js          fixed-timestep accumulator, speed, pause, frame step
  storage.js        safe localStorage wrapper (try/catch, in-memory fallback)

render/             three.js only
  scene.js          renderer, lights, floor/treadmill, resize handling
  characterView.js  capsule/sphere bone-hierarchy implementation of the view contract
  ghost.js          translucent Target overlay on the Player position
  camera.js         framing both characters, orbit limits
  floor.js          treadmill belt vs. looping floor tiles

ui/                 Vue components (core state wrapped with reactive(); three objects markRaw'd)
  App.js            layout shell
  ParamSidebar.js   grouped sliders generated from the registry
  ParamSlider.js    one slider + tooltip (real-world explanation)
  ScorePanel.js     overall % + top mismatches
  HintButton.js     progressive hints
  ModePicker.js     mode, target, difficulty selectors
  PlaybackBar.js    speed, pause, frame step, ghost toggle, treadmill/floor toggle
  ResultModal.js    win / time-up summary

data/
  params.js         parameter registry
  targets.js        5 Target presets
  config.js         thresholds, timers, score weights, spring tuning, sampling
```

**Data flow per frame:** `clock.tick(dt)` → `game.step(simDt)` → `gait.pose(params, φ)` + `springs.step()` → `characterView.applyPose()` for both the Target and the Player → Vue displays reactive state (score, timer). Scoring runs only when parameters change, not every frame.

**Rule:** `core/` must be importable and testable in Node with no DOM. This is enforced by keeping all browser and Three.js access in `render/`, `ui/`, `main.js`, and `core/storage.js`, which guards `localStorage` access.

---

## 4. Parameter Registry

Every entry in `data/params.js`:

```js
{
  id: 'hipSway',
  group: 'pelvis',               // proportions | timing | pelvis | joints | posture | arms | asymmetry | mass
  label: 'Hip sway',
  unit: 'cm',
  min: 0, max: 8, step: 0.1, default: 2.5,
  enabled: true,
  weight: 1.0,                   // weight in the parameter-error term
  explain: 'Side-to-side shift of the pelvis over the stance leg. Wider hips and a narrow step width increase it.',
  hint: { low: 'Increase hip sway', high: 'Decrease hip sway', vague: 'Watch the hips' },
  mismatch: { low: 'Hip sway too small', high: 'Hip sway too large' }
}
```

**Adding a new factor** takes two steps: add a registry entry, then read `params[id]` in `core/gait.js` (or `body.js`). The sidebar renders groups and sliders from the registry, so the UI doesn't change.

### MVP parameters (enabled)

| Group | id | Range (default) | Effect |
|---|---|---|---|
| Proportions | `height` | 1.40–2.05 m (1.70) | global scale |
| | `legLength` | 0.44–0.54 × height (0.48) | IK lengths, bob, stride feasibility |
| | `thighShinRatio` | 0.9–1.3 (1.08) | knee position, knee bend shape |
| | `torsoLength` | 0.26–0.36 × height (0.30) | trunk segment |
| | `armLength` | 0.40–0.48 × height (0.44) | arm segments, hand path |
| Timing | `cadence` | 80–140 steps/min (110) | cycle frequency |
| | `strideLength` | 0.8–1.9 m (1.40) | speed, bob, hip flexion range |
| | `doubleSupport` | 0.10–0.40 (0.20) | stance/swing split |
| Pelvis | `hipSway` | 0–8 cm (2.5) | lateral pelvis shift |
| | `pelvicRotation` | 0–15° (6) | pelvis yaw |
| | `pelvicTilt` | −5–20° (8) | anterior tilt offset |

`strideLength` is soft-clamped against `legLength` (a "stride exceeds what these legs can reach" warning appears) so the IK never fails.

### Later groups (registered, `enabled: false`, priority order)

1. **Joint ranges:** hip, knee, ankle, shoulder, and elbow limits
2. **Posture:** trunk lean, head carriage, shoulder slump
3. **Arm swing:** amplitude, left/right asymmetry
4. **Asymmetry and limp:** per-side stride, stance-time asymmetry
5. **Body mass and distribution:** drives spring stiffness, damping, and amplitude, plus bob damping

Disabled entries show as greyed-out "Coming soon" groups and are excluded from scoring.

---

## 5. Targets (`data/targets.js`)

Presets use MVP parameters only. Unlocking follows list order in Challenge mode.

| # | Name | Difficulty | Bio (hints at cause) | Key values |
|---|---|---|---|---|
| 1 | **Stretch** | Easy | "Basketball coach — tall, long-legged, covers ground without hurrying." | height 1.98, legLength 0.52, stride 1.80, cadence 100 |
| 2 | **Pip** | Easy | "Busy barista — short legs, always in a rush, tiny quick steps." | height 1.52, legLength 0.46, stride 0.95, cadence 132 |
| 3 | **Rosa** | Normal | "Retired dancer — long legs and a big, confident hip sway." | legLength 0.51, hipSway 6.5, pelvicRotation 11, stride 1.45 |
| 4 | **Bo** | Normal | "Camp counselor — springy, long strides on short legs; bounces with every step." | legLength 0.45, stride 1.65, doubleSupport 0.12, cadence 118 |
| 5 | **Mr. Grey** | Hard | "Night-shift accountant — stiff hips, shuffles, both feet linger on the ground." | hipSway 0.5, pelvicRotation 1.5, pelvicTilt −2, doubleSupport 0.36, stride 0.90, cadence 96 |

Unlisted parameters use registry defaults. Each preset also lists a `focus` array, the ids its hints prioritize.

---

## 6. Feedback and Teaching

- **Live score:** 0–100% with a color band (red < 70, amber < threshold, green ≥ threshold).
- **Breakdown:** the 3 biggest mismatches in plain language from `mismatch.low/high`, filtered to differences larger than one slider step.
- **Ghost overlay:** a translucent Target (about 35% opacity, tinted) rendered at the Player's position and phase-synced, so differences show up as visible offsets.
- **Progressive hints** (`core/hints.js`), escalating on each click for the current biggest mismatch:
  1. Vague, group-level: `hint.vague` ("Watch the hips")
  2. Names the parameter ("Look at hip sway")
  3. Gives the direction: `hint.low/high` ("Increase hip sway")
  4. Gives the magnitude ("Increase hip sway a lot")

  The level resets when that parameter is fixed. In Challenge mode, the number of hints used is recorded with the best score.

---

## 7. Game Modes (`core/modes.js`)

| Mode | Rules |
|---|---|
| **Sandbox** | Any unlocked or all targets, no end, live score only |
| **Challenge** | Pick a difficulty. Win when the score ≥ threshold. Winning unlocks the next target and saves the best score |
| **Timed** | Countdown. The highest score reached before time runs out is saved |

All values live in `data/config.js`:

```js
export const CONFIG = {
  thresholds: { easy: 85, normal: 92, hard: 97 },
  timedSeconds: 90,
  score: { wTraj: 0.6, wParam: 0.4, kTraj: 25, kParam: 6, samples: 32,
           tracked: ['head','pelvis','hand_L','hand_R','foot_L','foot_R'] },
  sim: { fixedStep: 1/120, frameStep: 1/60, speeds: [0.1, 0.25, 0.5, 1, 1.5, 2] },
  springs: { belly: { k: 120, c: 9, max: 0.03 }, chest: { k: 160, c: 10, max: 0.02 },
             cheek: { k: 220, c: 8, max: 0.008 }, overlap: { k: 90, c: 12 } },
  ghostOpacity: 0.35
};
```

---

## 8. UI Layout

```
┌───────────────────────────────────────────────┬──────────────────────┐
│ [Mode ▾] [Target ▾] [Difficulty ▾]   Score 87%│  PROPORTIONS         │
│                                               │   Height     ──●──   │
│        3D viewport                            │   Leg length ─●───   │
│     Target          Player                    │   …                  │
│                                               │  TIMING              │
│                                               │   Cadence    ───●─   │
│                                               │  PELVIS              │
│  Top mismatches: Stride too short · …   [Hint]│   Hip sway   ─●───   │
├───────────────────────────────────────────────┤  JOINTS (soon) ░░░   │
│ ⏸  ⏭frame  speed [0.25×|0.5×|1×|2×]  👻 ghost  ▭ treadmill/floor     │
└───────────────────────────────────────────────┴──────────────────────┘
```

Each slider has an ⓘ tooltip that shows its `explain` text.

---

## 9. Persistence (`core/storage.js`)

- Key `walkThisWay.v1` holds `{ unlocked: [targetIds], best: { [targetId]: { [mode]: { score, hints } } } }`.
- Every read and write is wrapped in try/catch. If storage is unavailable (private mode, quota, blocked), the game falls back to an in-memory object and shows a small "progress won't be saved" notice. Corrupt JSON resets to defaults.

---

## 10. Build Plan (milestones)

| # | Milestone | Done when |
|---|---|---|
| M1 | Skeleton: files, import map, Vue shell, Three scene with floor and camera | Page loads from a static server with no console errors |
| M2 | `core/body.js` + `core/gait.js` + `ik.js`; capsule character walking on the treadmill | Default character walks fluidly; feet don't slide during stance |
| M3 | Parameter registry + generated sliders; Player responds live | Every MVP slider visibly changes the walk |
| M4 | Target presets; side-by-side Target and Player; ghost overlay | All 5 Targets look visibly different |
| M5 | Scoring + breakdown + hints | Matching a preset exactly scores 100%; the default vs. each preset scores below the Easy threshold |
| M6 | Springs: overlap + jiggle; playback (speed, pause, frame step); floor toggle | Jiggle settles when paused; frame step is deterministic |
| M7 | Modes + persistence | Challenge unlock chain works across reloads; works with storage blocked |
| M8 | Polish: tooltips, disabled "coming soon" groups, known-limitations pass | Checklist below passes |

**Verification checklist:** no console errors; each slider has a visible effect; scores are 100% at the exact preset and 0–100 everywhere else; no NaN at slider extremes; the IK never flips the knee backward; storage-blocked mode works; frame step stays the same across speeds.

---

## 11. How to Run (once implemented)

ES modules don't load from `file://`. Serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL (for example, `http://localhost:8000`) in a desktop browser.

---

## 12. Known Limitations and Next Steps

- **Parameter equivalence:** different combinations (for example, a long stride with low cadence vs. a shorter stride with higher cadence at the same speed) can look similar. Blended scoring partly hides this, and the hint system may name a factor the player compensated for elsewhere.
- **Primitive bodies:** capsule seams and no real skin deformation. Next step: a glTF rig or procedural skinned mesh behind the same `characterView` contract plus `BONE_MAP`.
- **Simplified biomechanics:** no ground-reaction forces or real muscle model. Bob comes from the inverted pendulum and the ankle roll is scripted. This is fine for teaching cause and effect, not clinical accuracy.
- **Remaining parameter groups:** joint ranges → posture → arm swing → asymmetry/limp → body mass, in that order. Each is a registry entry plus its effect in core.
- **Desktop only:** no touch controls or mobile layout.
- **CDN dependency:** needs a network connection unless the pinned files are vendored locally.
