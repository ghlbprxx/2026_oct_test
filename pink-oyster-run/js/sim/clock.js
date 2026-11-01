// Converts real elapsed time into game days.
import { C } from './cfg.js';

export const MAX_FRAME = 1 / 20; // clamp long frames (tab switches, breakpoints) so the sim never jumps

/** Game days that pass for `rawSeconds` of real time. 0 when paused. */
export function gameDaysFor(rawSeconds, paused = false) {
  if (paused || C.dev.paused) return 0;
  const dt = Math.min(Math.max(0, rawSeconds), MAX_FRAME) * C.dev.timeScale;
  return dt / C.time.secondsPerDay;
}
