// Game-mode rules. Operates on the game state's mode fields; returns an event or null.

export const MODES = [
  { id: 'sandbox', label: 'Sandbox', blurb: 'No goal — explore and watch the live score.' },
  { id: 'challenge', label: 'Challenge', blurb: 'Reach the difficulty threshold to win and unlock the next target.' },
  { id: 'timed', label: 'Timed', blurb: 'Get the highest score you can before the clock runs out.' },
];

export function resetModeState(s, config) {
  s.status = 'playing';
  s.timeLeft = config.timedSeconds;
  s.timedBest = 0;
}

export function updateMode(s, { score, dt, threshold }) {
  if (s.status !== 'playing') return null;
  if (s.mode === 'challenge' && score >= threshold) {
    s.status = 'won';
    return 'won';
  }
  if (s.mode === 'timed') {
    s.timedBest = Math.max(s.timedBest, score);
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    if (s.timeLeft === 0) {
      s.status = 'timeup';
      return 'timeup';
    }
  }
  return null;
}
