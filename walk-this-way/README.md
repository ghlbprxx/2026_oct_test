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

1. Pick a **mode** (Sandbox / Challenge / Timed), a **Target** (5 women ♀, 5 men ♂), and a **difficulty**.
2. Watch the Target (orange) and your walker (teal). Read the Target's bio for clues.
3. Drag the sliders on the right. The **match score** updates live. Your walker starts with the Target's body type (♀/♂), and you can switch it at the top of the sidebar. Body type changes shape only and isn't scored.
4. Use **Biggest differences**, **Hint** (it gets more specific each time you click), the **👻 Ghost** overlay, and the **joint dots and trails** to close the gap.

| Control | Action |
|---|---|
| `Space` / ⏸ | Pause / play |
| `.` / ⏭ | Step one frame (while paused) |
| 0.1×–2× | Playback speed (slow motion) |
| `J` / ● Joints | Dots on the joints (amber = left, violet = right, navy = head and hips) |
| `T` / 〰 Trails | Long-exposure trails for toes, hands, head and hips |
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
  body.js           parameters → body dimensions, stance width, soft-tissue amounts (sex × body fat)
  skeleton.js       canonical bones (incl. soft-tissue + toe bones), forward kinematics, marker/trail points
  ik.js             exact analytic two-bone leg IK
  gait.js           parametric gait cycle → Pose
  springs.js        damped linear + angular springs (fixed step)
  character.js      per-character sim: phase, travel, overlap + jiggle springs, trail history
  scoring.js        trajectory sampling, blended score, plain-language breakdown
  hints.js          progressive hints
  modes.js          Sandbox / Challenge / Timed rules
  clock.js          fixed-timestep accumulator, speed, pause, frame step
  storage.js        guarded localStorage with in-memory fallback
  game.js           top-level state + actions; state made reactive by injection (wrap)

render/             Three.js only
  index.js          render-layer facade: syncs scene to game frames, lane layout, name tags
  scene.js          renderer, lights, shadows, resize
  characterView.js  skinned human + accessories + joint markers (the swappable view)
  bodyMesh.js       procedural skinned body: shape by sex/body fat, joint + soft-tissue skin weights
  modelLoader.js    loads glTF models once (checks .bin buffers first for a clean failure)
  autoRig.js        auto-rigs a static human mesh to the game skeleton (joints, skin weights, clothing, hair)
  riggedView.js     walker drawn with an auto-rigged model (bones written straight from core's skeleton)
  trails.js         long-exposure motion trails (Line2 fat lines)
  ghost.js          translucent Target overlay
  floor.js          treadmills + tiled floor
  camera.js         presets, tweening, OrbitControls

ui/                 Vue components (template strings, compiled in the browser)
  App.js · ModePicker.js · ScorePanel.js · TargetCard.js · FeedbackPanel.js
  HintButton.js · PlaybackBar.js · ParamSidebar.js · ParamSlider.js · ResultModal.js · MotionLegend.js

assets/
  person_v2/        “Female base mesh” by AK_anna, CC BY 4.0 (scene.gltf + scene.bin)

data/
  params.js         parameter registry (MVP groups + disabled "coming soon" groups)
  targets.js        10 Target presets (5 ♀, 5 ♂)
  config.js         thresholds, timer, score weights, spring tuning, trails, render settings

tests/core.test.js  unit tests for core/
```

**Dependency direction:** `ui → core`, `render → core`, `main → all`. Nothing in `core/` imports from `render/` or `ui/`, and `ui/` never imports `render/`. Vue reactivity is injected (`createGame({ wrap: reactive })`), so `core/` never imports Vue.

---

## Design Decisions

Each decision compared three approaches. The chosen one is marked ✅.

### 1. Character construction and rendering

| Approach | Pros | Cons |
|---|---|---|
| Bone hierarchy with a rigid mesh per bone (used first) | Simple; easy to debug | Joints crease like a mannequin; nothing deforms |
| ✅ **Procedural `SkinnedMesh` on the canonical skeleton** | One continuous skin that bends smoothly; soft tissue can bounce | Skin weights to design; rebuilt when proportions change (cheap: ~5k vertices) |
| `InstancedMesh` primitives | Fewest draw calls | Over-engineered for 2–3 characters |

**How the look evolved:** rounded "Sims-lite" capsules came first, then shaped rigid pieces. Those still looked stiff, so the body is now a skinned mesh. I compared three ways to fix the stiffness:

| Approach | Verdict |
|---|---|
| Stronger springs on the rigid pieces | Still a mannequin |
| Rigged glTF model from the web | Real skin, but needs an external asset and breaks the proportion sliders |
| ✅ **Procedural skinned mesh + soft-tissue bones** | Continuous skin, real bounce, keeps every slider and the glTF swap point |

The skinned body (`render/bodyMesh.js`) works like this:
- **Bind pose:** every part (torso, legs, arms, neck, head) is built as a vertical tube, because in the bind pose the limbs hang straight down.
- **Joint blending:** skin weights blend across each joint, so knees, hips, elbows and shoulders bend smoothly and the waist visibly twists against the hips.
- **Soft tissue:** vertices near the belly, chest, glutes, thighs, upper arms and cheeks are partly weighted to **soft-tissue bones**. Core's springs move those bones, so the surrounding flesh jiggles.
- **Shape:** depends on **sex** (hips, waist, bust or pecs, shoulders) and **body fat** (belly, love handles, thighs, upper arms; distributed differently by sex). It never changes the skeleton, so body type can't affect the score.
- **Clothing:** per-vertex colours, all in one draw call.
- **Rigid accessories:** mitt hands, shoes that bend at the ball of the foot (separate toes bone), hair (women get a spring-driven ponytail), eyes, brows and ears.
- **Lighting:** a studio room environment with ACES tone mapping.

**Swap-proofing:** `core/` outputs a renderer-agnostic **Pose** (`rot[bone] = [x, y, z]` Euler YXZ, `pos[bone]` = offset) on a canonical skeleton (`core/skeleton.js`). `render/characterView.js` implements `build(dims) · applyPose(pose) · setPosition · setVisible · setOpacity · dispose`. A glTF or skinned view only needs to implement the same contract plus a bone-name map. The test suite checks that core FK matches the Three.js scene to about 1e-16 m.

**Realistic female model (current):** female walkers use `assets/person_v2`, "Female base mesh" by [AK_anna](https://sketchfab.com/AK_anna) on Sketchfab, [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Attribution is shown in the viewport whenever the model is on screen. The mesh ships with no skeleton, textures, clothes or hair, so `render/autoRig.js` rigs it at load time:

1. **Normalise:** bake the node transforms, turn it to face +Z, put the feet on the floor, and scale it to 1.70 m.
2. **Find the joints from the mesh:** the crotch (and so the hips), the arm axis (a principal-component fit of the arm vertices), the ankle and thigh centres from cross-sections, the toe tips, and the head bounds. Then fit the game's own parameters to it and build the bind skeleton.
3. **Skin weights:** each vertex is classified as arm, leg, head or torso, and blended smoothly across the joints. Soft-tissue weights are added for the belly, chest, glutes, thighs, upper arms and cheeks, so core's springs make the flesh bounce.
4. **Clothing:** a T-shirt and shorts drawn by a shader from per-vertex distance fields, giving crisp hems.
5. **Hair:** a cap fitted to the head, plus a ponytail on the spring-driven hair bone.

At runtime (`render/riggedView.js`), every bone's matrix is written straight from core's skeleton:
- **Position and rotation:** each bone gets our joint's position and rotation, so the feet land exactly where the IK puts them. Measured lowest skinned vertex over a stride: within 1 mm of the floor.
- **Length:** each segment stretches along its own axis to the walker's proportions.
- **Size:** thickness scales with height, and torso and limb girth grow mildly with body fat.

If the model can't load, the procedural body is used and a short notice appears. Male walkers still use the procedural body until a male model is added in `config.render.models.M`.

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
- **Vertical bob** comes from inverted-pendulum reach: the hip sinks just enough for the leading heel to touch down, so long strides on short legs bounce more. The bob is capped at 7.5 cm; anything beyond that is absorbed by bending the knees, as real walkers do.
- **Soft knees, not crouched:** the hip sits at 99% of leg length at mid-stance, giving about 11–21° of knee bend (real walking is about 5–20°). An earlier version sat at 93%, about 40°, which looked like walking with bent knees. A test now enforces 3–25°.
- **Loading response:** the bob bottoms out just after heel strike, so the knee gives a little on impact.
- **Toe-off roll:** if the trailing ankle is out of reach, the foot rolls further onto its ball (the heel lifts earlier and higher) instead of the hip dropping. The ball of the foot stays planted, within 3 mm, from foot-flat to toe-off, and the toes stay flat on the ground.
- **Natural details:** about 7° of toe-out, elbows that bend more on the forward swing, wrist lag, and shoulders that roll forward and bob with each step.
- **Trunk** counter-rotates so the head stays level. Arms counter-swing with a lag.
- **Exact IK** (`core/ik.js`): the ankle always lands exactly on its (possibly toe-rolled) target.

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

- **Soft-tissue bones:** belly, left and right chest, left and right glutes, thighs, upper arms, cheeks and ponytail. Each is a linear spring driven by the acceleration of its own rest anchor, expressed in its parent bone's frame.
- **Per-character tuning:** spring gain and range scale with `tissue` amounts from `core/body.js` (sex × body fat); more fat also means softer tissue.
- **Measured peak bounce:**
  - Big Earl's belly: about 3.3 cm. Lean Kenji's: 0.4 cm.
  - Marisol's chest: about 3 cm.
  - Glutes and thighs: about 1–1.5 cm.
  - Ponytails: 4–8 cm.
- **Overlap:** upper arms, forearms, wrists and chest roll chase their targets with lag, and the head nods and rolls against neck acceleration.
- **Liveliness** (sim-only, not scored, so scoring stays deterministic): breathing, small head turns and nods, and ±10% stride-to-stride arm-swing variation, seeded per character so no two walkers move in lockstep.
- **Frame step** advances exactly 1/60 s of sim time at any playback speed.

### 5. Making the motion readable

| Approach | Verdict |
|---|---|
| Joint dots only | Shows where joints are, not how they move |
| World-space trails | On a treadmill every point just traces a small loop |
| ✅ **Joint dots + trails that slide back with the ground** | Foot clearance arcs, head-bob waves, hand arcs and stride spacing become directly comparable, the way gait is shown in labs |
| X-ray stick figure | Clear, but hides the body you're matching |

- **Where the trail data comes from:** core records each trail point (toes, hands, head top, pelvis) at the fixed 120 Hz sim rate, so trails are smooth even at low frame rates.
- **How it's drawn:** `render/trails.js` shifts each sample back by the distance walked since it was taken and fades it out over one stride.
- **Markers:** they draw on top of the bodies, so the far leg's joints stay visible.
- **Colours:** left = amber, right = violet, centre = navy. This makes it easy to tell which leg is which.

---

## Parameter Registry

The sliders, scoring, breakdown, and hints are all generated from `data/params.js`. Each entry has `id, group, label, unit, min, max, step, default, enabled, weight, explain, hint {vague, low, high}, mismatch {low, high}`.

**To add a factor:** add an entry, then read `params[id]` in `core/gait.js` or `core/body.js`. The UI needs no changes.

| Group | Parameters (MVP, enabled) |
|---|---|
| Proportions | height, leg length, thigh/shin ratio, torso length, arm length |
| Timing | cadence, stride length, double-support time |
| Pelvis | hip sway, pelvic rotation, pelvic tilt |
| Build | body fat (soft-tissue bounce, body shape, slightly wider stance) |

The later groups are registered with `enabled: false`. They appear greyed out as "Coming soon" and are excluded from scoring. In priority order: **joint ranges → posture → arm swing → asymmetry/limp → weight distribution**.

**Body type (♀/♂)** isn't a registry slider. It rides along in each walker's params as `sex`, changes only body shape and where fat sits, and isn't scored.

## Targets

| # | Name | Sex | Difficulty | Bio |
|---|---|---|---|---|
| 1 | Stretch | ♂ | Easy | Basketball coach — tall, long-legged, covers ground without hurrying. |
| 2 | Pip | ♀ | Easy | Busy barista — short legs, always in a rush, tiny quick steps. |
| 3 | Dana | ♀ | Easy | Track coach — lean and long-striding; powers along with brisk steps. |
| 4 | Rosa | ♀ | Normal | Retired dancer — long legs and a big, confident hip sway. |
| 5 | Bo | ♂ | Normal | Camp counselor — springy, long strides on short legs; bounces with every step. |
| 6 | Marisol | ♀ | Normal | Night-shift nurse — curvy, comfy shoes, relaxed rolling hips at the end of a long shift. |
| 7 | Big Earl | ♂ | Normal | Long-haul trucker — heavyset, wide stance, slow rolling gait that lingers on both feet. |
| 8 | Kenji | ♂ | Hard | Marathoner — wiry, light quick steps, barely any hip motion; efficiency over flair. |
| 9 | June | ♀ | Hard | Retired librarian, 78 — careful, slow, short steps with both feet down a long time. |
| 10 | Mr. Grey | ♂ | Hard | Night-shift accountant — stiff hips, shuffles, both feet linger on the ground. |

No two presets are close: the most similar pair, Dana and Kenji, scores 62% against each other, and the default walker scores 43% or less against every Target.

---

## Verification Done

- `npm test` has 12 tests, all passing (including the new posture and planting checks):
  - registry and preset validity
  - no NaN at slider extremes
  - knees never bend backward, and mid-stance knee bend stays at a realistic 3–25°
  - the ball of the foot stays planted (within 3 mm) from foot-flat to toe-off for all presets
  - 10 presets, 5 per sex
  - exact match = 100, and the default walker scores below Easy for every Target
  - the score falls as a parameter moves away
  - hint escalation
  - frame-step determinism
  - storage fallback with corrupt or blocked storage
  - the Challenge win → unlock → save → reload flow
  - Timed mode ending and recording the best score
  - trail history: dense, bounded to one stride, toes reaching the ground, cleared on restart
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
- **Long strides on short legs** (Bo, for example) bend the knees more at mid-stance (up to about 21°), because the bob is capped at 7.5 cm. That's realistic, but it's the most crouched walk in the set. Strides beyond 2.25× leg length are capped, with a warning in the UI.
- **Realistic model limits:** the clothes are painted on, so they follow the body like a bodysuit (no cloth folds and no texture maps). The model is barefoot, and its hands stay in their open A-pose. Skin weights are computed automatically, so expect minor creasing at the armpits and groin at extreme poses. Body fat changes this model's girth only mildly.
- **Only one realistic model:** male walkers still use the procedural body.
- **Unused file:** `assets/scene.gltf` (the Character Creator model) isn't used. It needs its 74 MB `scene.bin` and textures, which aren't in the repo, so it can be deleted.
- **Procedural skin** (male walkers and fallback): one skinned mesh, but simple. There are no muscles that bulge, no clothing folds, and hands and feet are rigid. A sculpted glTF model would still look better.
- **Not yet seen in motion on a real screen:** posture, foot planting and bounce amounts were checked numerically and with frame-by-frame screenshots, not at full speed on a GPU. Spring stiffness and gain (`data/config.js`) and the shape numbers (`render/bodyMesh.js`) are expected to need taste-tuning.
- **Rendering cost:** the studio environment lighting is the most expensive effect. It's free on any real GPU, but with software rendering (no GPU) it roughly halves the frame rate. Trails and markers add a little more. If that matters, remove `scene.environment` in `render/scene.js`.
- **Simplified biomechanics:** there are no forces or muscles. The heel and toe rockers and the arm swing are scripted from parameters. Good for cause and effect, not clinical accuracy.
- **Arm swing amplitude** is currently derived from stride. It becomes its own slider when the Arm-swing group ships.
- **Floor mode** wraps each walker back to the start of an 8 m walkway, which is a visible teleport. In floor mode the Side camera keeps the side-by-side layout, so one walker can partly block the other.
- **Desktop only**, and it needs the CDN unless you copy Vue and Three.js into the folder and point the import map at them.

## Next Steps

1. **glTF swap:** add `render/gltfCharacterView.js` that implements the same view contract with a `BONE_MAP` from canonical bone names to the rig's bones, then pick the view in `render/index.js`.
2. **Remaining parameters**, in priority order: joint ranges (clamp IK and arm angles), posture (trunk lean, head carriage, shoulder slump), arm swing (amplitude, asymmetry), asymmetry/limp (per-side stride and stance time), and weight distribution.
3. Score timing directly (absolute-time trajectories), so cadence doesn't need a parameter-weight boost.
