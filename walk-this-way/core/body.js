// Parameters → body dimensions (meters). Pure function, no rendering knowledge.
import { clamp } from './math3.js';

export function computeBody(p) {
  const H = p.height;
  const ankleHeight = 0.045 * H;
  const legM = p.legLength * H;              // hip-joint height when standing
  const legChain = legM - ankleHeight;       // thigh + shin
  const thigh = (legChain * p.thighShinRatio) / (1 + p.thighShinRatio);
  const shin = legChain - thigh;
  const torso = p.torsoLength * H;
  // Realistic head (about 1/7.5 of height); the neck absorbs what's left up to the top of the head.
  const headR = 0.066 * H;
  const neck = clamp(H - legM - torso - 2 * headR, 0.04 * H, 0.065 * H);
  const arm = p.armLength * H;
  const footLen = 0.15 * H;
  const female = p.sex === 'F';
  const fat = p.bodyFat ?? 22;
  const fatF = (fat - 22) / 20; // ≈ -0.7 (very lean) … +1.15 (heavy)
  const t = (base, perFat, lo = 0.1, hi = 2.4) => clamp(base + perFat * fatF, lo, hi);

  return {
    H, ankleHeight, legM, thigh, shin, torso, neck, headR,
    sex: female ? 'F' : 'M',
    fat, fatF,
    // How much each soft-tissue region moves (scales spring gain/range). Fat distribution differs by sex.
    tissue: {
      belly: female ? t(0.45, 0.6) : t(0.6, 1.1),
      chest: female ? t(1.0, 0.55, 0.5) : t(0.25, 0.6),
      glute: female ? t(1.0, 0.55) : t(0.6, 0.5),
      thigh: female ? t(0.8, 0.55) : t(0.5, 0.45),
      arm: female ? t(0.6, 0.5) : t(0.4, 0.45),
      cheek: t(0.6, 0.5),
      hair: female ? 1 : 0,
    },
    pelvisUp: 0.12 * torso,
    spineLen: 0.38 * torso,
    chestLen: 0.5 * torso,
    upperArm: 0.45 * arm,
    forearm: 0.40 * arm,
    hand: 0.15 * arm,
    hipHalf: 0.055 * H,
    shoulderHalf: 0.11 * H,
    stepHalfWidth: (0.04 + 0.01 * fatF) * H,   // heavier builds stand wider for balance
    footLen,
    heelDist: 0.25 * footLen,   // ankle → heel
    ballDist: 0.5 * footLen,    // ankle → ball of foot
    // Anatomical half-widths (torso) and limb radii, as fractions of height.
    radii: {
      hip: 0.095 * H, spine: 0.078 * H, chest: 0.09 * H, neck: 0.037 * H,
      upperArm: 0.029 * H, elbow: 0.021 * H, forearm: 0.023 * H, wrist: 0.016 * H, hand: 0.03 * H,
      thigh: 0.052 * H, knee: 0.034 * H, calf: 0.036 * H, ankle: 0.02 * H, foot: 0.026 * H,
    },
  };
}
