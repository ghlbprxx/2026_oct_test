// Time: real seconds -> game days (playback speed), and game days <-> real-world "bio" days.
import { C } from './cfg.js';
import { RULES } from './rules.js';

export const MAX_FRAME = 1 / 20;            // clamp long frames (tab switches, breakpoints)
export const SPEEDS = [0.5, 1, 2, 4, 8];    // playback multipliers; pause is separate

/** Game days that pass for `rawSeconds` of real time at playback `speed`. 0 when paused. */
export function gameDaysFor(rawSeconds, paused = false, speed = 1) {
  if (paused || C.dev.paused || !speed) return 0;
  const dt = Math.min(Math.max(0, rawSeconds), MAX_FRAME) * C.dev.timeScale * speed;
  return dt / C.time.secondsPerDay;
}
/** Real-world growing days represented by `gameDays`. */
export const toBio = gameDays => gameDays * C.time.bioDaysPerGameDay;
/** Game days needed for `bioDays` of real-world growth. */
export const toGame = bioDays => bioDays / C.time.bioDaysPerGameDay;
export const seasonDays = () => C.time.seasonWeeks * RULES.daysPerWeek;
export const weekOf = day => Math.floor(day / RULES.daysPerWeek);
export const dayOfWeek = day => Math.floor(day % RULES.daysPerWeek) + 1;
/** Next/previous playback speed. */
export const faster = s => SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(s) + 1)] ?? 1;
export const slower = s => SPEEDS[Math.max(0, SPEEDS.indexOf(s) - 1)] ?? 1;
