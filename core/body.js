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
  const neck = 0.045 * H;
  const headR = clamp((H - legM - torso - neck) / 2, 0.06 * H, 0.1 * H);
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
    radii: {
      pelvis: 0.068 * H, spine: 0.075 * H, chest: 0.095 * H, neck: 0.03 * H,
      upperArm: 0.03 * H, forearm: 0.025 * H, hand: 0.03 * H,
      thigh: 0.047 * H, shin: 0.036 * H, foot: 0.024 * H,
    },
  };
}
