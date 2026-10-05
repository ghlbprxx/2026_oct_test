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
  const neck = clamp(H - legM - torso - 2 * headR, 0.04 * H, 0.08 * H);
  const arm = p.armLength * H;
  const footLen = 0.15 * H;

  return {
    H, ankleHeight, legM, thigh, shin, torso, neck, headR,
    pelvisUp: 0.12 * torso,
    spineLen: 0.38 * torso,
    chestLen: 0.5 * torso,
    upperArm: 0.45 * arm,
    forearm: 0.40 * arm,
    hand: 0.15 * arm,
    hipHalf: 0.055 * H,
    shoulderHalf: 0.11 * H,
    stepHalfWidth: 0.04 * H,
    footLen,
    heelDist: 0.25 * footLen,   // ankle → heel
    ballDist: 0.5 * footLen,    // ankle → ball of foot
    // Anatomical half-widths (torso) and limb radii, as fractions of height.
    radii: {
      hip: 0.095 * H, spine: 0.078 * H, chest: 0.09 * H, neck: 0.034 * H,
      upperArm: 0.029 * H, elbow: 0.021 * H, forearm: 0.023 * H, wrist: 0.016 * H, hand: 0.03 * H,
      thigh: 0.052 * H, knee: 0.034 * H, calf: 0.036 * H, ankle: 0.02 * H, foot: 0.026 * H,
    },
  };
}
