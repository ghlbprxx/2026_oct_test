# Walk This Way — Gait-Matching Browser Game

An educational browser game in the style of The Sims. Every character has its own human-like walk. You watch a **Target** walk, then reverse-engineer it by adjusting your own character's body and gait sliders until the two walks match. Along the way, you learn which physical factors shape how a person walks.

- **Stack:** Vue 3 `3.5.43` + Three.js `0.186.1`, both ES modules from a CDN, pinned in an import map. No build step.
- **Platform:** desktop browsers.

---

## How to Run

ES modules don't load from `file://`. Serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000      # same as: npm start
```

Then open the printed URL (for example, `http://localhost:8000`). You need an internet connection the first time, because Vue and Three.js load from `unpkg.com`. If they can't load, the page says so after a few seconds instead of staying blank.

**Tests** (core logic, no browser needed, Node 18+):

```bash
npm test
```

## How to Play

1. Pick a **mode** (Sandbox / Challenge / Timed), a **Target**, and a **difficulty**.
2. Watch the Target (orange) and your walker (teal). Read the Target's bio for clues.
3. Drag the sliders on the right. The **match score** updates live.
4. Use **Biggest differences**, **Hint** (it gets more specific each time you click), and the **👻 Ghost** overlay to close the gap.

| Control | Action |
|---|---|
| `Space` / ⏸ | Pause / play |
| `.` / ⏭ | Step one frame (while paused) |
| 0.1×–2× | Playback speed (slow motion) |
| `G` / 👻 Ghost | Overlay the Target on your walker |
| `F` / Treadmill ↔ Floor | Walk in place, or walk across a looping floor |
| 3/4 · Side · Front | Camera presets. Drag to orbit, scroll to zoom |
| ⓘ next to a slider | What that factor is and how it changes a walk |

**Modes**

| Mode | Rules |
|---|---|
| **Sandbox** | All targets, no end, live score only |
| **Challenge** | Reach the difficulty threshold (Easy 85% · Normal 92% · Hard 97%) to win and unlock the next target |
| **Timed** | 90 seconds. Your best score is recorded |

Unlocked targets and best scores are saved in `localStorage`. If storage is blocked, the game still works and shows a "progress won't be saved" notice.

---

## Project Structure

```
index.html          import map, mount point, boot-failure message
styles.css          design tokens + layout
main.js             wiring: storage → game (reactive state) → Vue UI + Three.js render layer, frame loop, keys
package.json        only so Node treats .js as ES modules for tests (no dependencies)

core/               pure JS — no Three.js, no Vue, runs in Node
  math3.js          vectors, quaternions (Euler YXZ, same convention as Three.js)
  body.js           parameters → body dimensions
  skeleton.js       canonical bone list + forward kinematics
  ik.js             exact analytic two-bone leg IK
  gait.js           parametric gait cycle → Pose
  springs.js        damped linear + angular springs (fixed step)
  character.js      per-character sim: phase, travel, overlap + jiggle springs
  scoring.js        trajectory sampling, blended score, plain-language breakdown
  hints.js          progressive hints
  modes.js          Sandbox / Challenge / Timed rules
  clock.js          fixed-timestep accumulator, speed, pause, frame step
  storage.js        guarded localStorage with in-memory fallback
  game.js           top-level state + actions; state made reactive by injection (wrap)

render/             Three.js only
  index.js          render-layer facade: syncs scene to game frames, lane layout, name tags
  scene.js          renderer, lights, shadows, resize
  characterView.js  capsule/sphere character (the swappable view)
  ghost.js          translucent Target overlay
  floor.js          treadmills + tiled floor
  camera.js         presets, tweening, OrbitControls

ui/                 Vue components (template strings, compiled in the browser)
  App.js · ModePicker.js · ScorePanel.js · TargetCard.js · FeedbackPanel.js
  HintButton.js · PlaybackBar.js · ParamSidebar.js · ParamSlider.js · ResultModal.js

data/
  params.js         parameter registry (MVP groups + disabled "coming soon" groups)
  targets.js        5 Target presets
  config.js         thresholds, timer, score weights, spring tuning, render settings

tests/core.test.js  unit tests for core/
```

**Dependency direction:** `ui → core`, `render → core`, `main → all`. Nothing in `core/` imports from `render/` or `ui/`, and `ui/` never imports `render/`. Vue reactivity is injected (`createGame({ wrap: reactive })`), so `core/` never imports Vue.

---

## Design Decisions

Each decision compared three approaches. The chosen one is marked ✅.

### 1. Character construction and rendering

| Approach | Pros | Cons |
|---|---|---|
| ✅ **Bone hierarchy of `Object3D`s with capsule/sphere meshes** | Simple; segment lengths map directly to sliders; easy to debug | Joint seams (hidden by capsule caps) |
| One procedural `SkinnedMesh` | Smooth body; closest to final art | Fiddly weights; expensive to rebuild when proportions change |
| `InstancedMesh` primitives | Fewest draw calls | Over-engineered for 2–3 characters |

**Swap-proofing:** `core/` outputs a renderer-agnostic **Pose** (`rot[bone] = [x, y, z]` Euler YXZ, `pos[bone]` = offset) on a canonical skeleton (`core/skeleton.js`). `render/characterView.js` implements `build(dims) · applyPose(pose) · setPosition · setVisible · setOpacity · dispose`. A glTF or skinned view only needs to implement the same contract plus a bone-name map. The test suite checks that core FK matches the Three.js scene to about 1e-16 m.

### 2. Animation and gait

| Approach | Pros | Cons |
|---|---|---|
| ✅ **Procedural parametric cycle with exact 2-bone leg IK** | Each slider is a real physical knob; deterministic, so it can be scored; feet don't slide | Needs tuning to look fluid |
| Full IK foot-planning | Very grounded | Indirect parameter effects; harder to sample |
| Keyframe blending | Can look great | Needs authored clips; sliders become blend weights |

How it works (`core/gait.js`):

- The phase covers one stride. Frequency is `cadence / 120`, and stance per leg is `0.5 + doubleSupport / 2`.
- **Stance:** the ankle moves back at ground speed. It rocks on the heel at contact and on the ball at push-off.
- **Swing:** a Hermite curve with clearance, with tangents matched to ground speed so the foot doesn't hitch.
- **Pelvis:** sway, yaw, obliquity (the swing hip drops), and tilt.
- **Vertical bob** comes from inverted-pendulum reach: the hip sinks just enough for the leading heel to touch down. Long strides on short legs therefore bounce more without a separate slider.
- **Trunk** counter-rotates so the head stays level. Arms counter-swing with a lag.
- **Exact IK** (`core/ik.js`): planted feet slide 0.0 mm in mid-stance for every preset, and a test enforces this.

### 3. Match scoring

| Approach | Pros | Cons |
|---|---|---|
| Joint-angle curves | Captures the walk's shape | Hard to explain; ignores size |
| End-effector trajectories | Matches what the eye sees | Can't name which parameter is wrong |
| ✅ **Weighted blend: trajectories + normalized parameter distance** | Score tracks the visible match; the parameter term drives the breakdown and hints | Two terms to tune |

`score = 100 · (0.6 · e^(−25 · trajErr) + 0.4 · e^(−6 · paramErr))`

- `trajErr` is the RMS distance of head, pelvis, hands, and feet over 32 phases, as a fraction of the Target's height. It's computed analytically, so it doesn't depend on frame rate.
- `paramErr` is the weighted sum of squared normalized differences.
- Cadence carries extra weight because phase-normalized trajectories can't see timing.
- All constants live in `data/config.js`.

Checked by tests: an exact match scores 100, and the default walker scores below 34% against every Target (well under Easy's 85%).

### 4. Secondary motion and jiggle

| Approach | Pros | Cons |
|---|---|---|
| ✅ **Damped springs (semi-implicit Euler, fixed 1/120 s step)** | Stable, tunable, deterministic; reacts to real motion; settles when paused | Needs a fixed-step accumulator |
| Verlet points | Good for chains and cloth | Overkill; harder to keep deterministic |
| Sine-based fake | Trivial | Doesn't react; looks fake in slow motion |

- **Belly, chest, and cheeks:** linear springs driven by their parent bone's acceleration in the parent's frame.
- **Overlap:** arms, forearms, and chest roll chase their targets with lag, and the head nods and rolls against neck acceleration.
- **Frame step** advances exactly 1/60 s of sim time at any playback speed.

---

## Parameter Registry

The sliders, scoring, breakdown, and hints are all generated from `data/params.js`. Each entry has `id, group, label, unit, min, max, step, default, enabled, weight, explain, hint {vague, low, high}, mismatch {low, high}`.

**To add a factor:** add an entry, then read `params[id]` in `core/gait.js` or `core/body.js`. The UI needs no changes.

| Group | Parameters (MVP, enabled) |
|---|---|
| Proportions | height, leg length, thigh/shin ratio, torso length, arm length |
| Timing | cadence, stride length, double-support time |
| Pelvis | hip sway, pelvic rotation, pelvic tilt |

The later groups are registered with `enabled: false`. They appear greyed out as "Coming soon" and are excluded from scoring. In priority order: **joint ranges → posture → arm swing → asymmetry/limp → body mass**.

## Targets

| # | Name | Difficulty | Bio |
|---|---|---|---|
| 1 | Stretch | Easy | Basketball coach — tall, long-legged, covers ground without hurrying. |
| 2 | Pip | Easy | Busy barista — short legs, always in a rush, tiny quick steps. |
| 3 | Rosa | Normal | Retired dancer — long legs and a big, confident hip sway. |
| 4 | Bo | Normal | Camp counselor — springy, long strides on short legs; bounces with every step. |
| 5 | Mr. Grey | Hard | Night-shift accountant — stiff hips, shuffles, both feet linger on the ground. |

---

## Verification Done

- `npm test` has 11 tests, all passing:
  - registry and preset validity
  - no NaN at slider extremes
  - knees never bend backward
  - zero mid-stance foot slide for all presets
  - exact match = 100, and the default walker scores below Easy for every Target
  - the score falls as a parameter moves away
  - hint escalation
  - frame-step determinism
  - storage fallback with corrupt or blocked storage
  - the Challenge win → unlock → save → reload flow
  - Timed mode ending and recording the best score
- Headless Chromium end-to-end (Vue and Three.js loaded from the exact pinned package versions):
  - no console errors or warnings
  - core FK matches the Three.js scene
  - sliders update the score
  - hints escalate
  - ghost, floor, and side camera work
  - a Challenge win shows the modal and unlocks the next target
  - Timed mode ends
  - progress persists across a reload
  - with `localStorage` blocked, the notice shows and everything else still works

## Known Limitations

- **Parameter equivalence:** some combinations look alike. For example, a longer stride with lower cadence can resemble the reverse at the same speed. The blended score softens this, but a hint can still name a factor you've compensated for with another slider.
- **Reach limits:** for very long strides on short legs, the trailing foot at push-off can be up to about 1 cm out of reach. The IK clamps, so the foot doesn't hyperextend. Strides beyond 2.25× leg length are capped, with a warning in the UI.
- **Primitive bodies:** visible capsule seams and no real skin deformation.
- **Simplified biomechanics:** there are no forces or muscles. The heel and toe rockers and the arm swing are scripted from parameters. Good for cause and effect, not clinical accuracy.
- **Arm swing amplitude** is currently derived from stride. It becomes its own slider when the Arm-swing group ships.
- **Floor mode** wraps each walker back to the start of an 8 m walkway, which is a visible teleport. In floor mode the Side camera keeps the side-by-side layout, so one walker can partly block the other.
- **Desktop only**, and it needs the CDN unless you copy Vue and Three.js into the folder and point the import map at them.

## Next Steps

1. **glTF swap:** add `render/gltfCharacterView.js` that implements the same view contract with a `BONE_MAP` from canonical bone names to the rig's bones, then pick the view in `render/index.js`.
2. **Remaining parameters**, in priority order: joint ranges (clamp IK and arm angles), posture (trunk lean, head carriage, shoulder slump), arm swing (amplitude, asymmetry), asymmetry/limp (per-side stride and stance time), and body mass (scale spring stiffness, damping, and bob).
3. Score timing directly (absolute-time trajectories), so cadence doesn't need a parameter-weight boost.
