// Keyboard controls for the story reader and the practice round, plus auto-pause when the tab is hidden.
import { view, game } from './state.js';
import { syncMusic, unlockAudio } from './audio.js';
import { press, backspace, clearInput, submit, pauseGame, resumeGame } from './game.js';
import { talkDone, talkAdvance, storyPrimary } from './story.js';

function onKey(e) {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (view.value === 'story') {
    // Enter / Space finish the line, then show the next one; once the dialogue is done, Enter starts the round
    if (!talkDone.value) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); talkAdvance(); } return; }
    if (e.key === 'Enter' && (e.target === document.body || e.target.classList.contains('dialog'))) { e.preventDefault(); storyPrimary(); }
    return;
  }
  if (view.value !== 'play') return;
  if (game.phase === 'paused') { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); resumeGame(); } return; }
  if (game.phase !== 'playing') return;
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
  else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') { e.preventDefault(); clearInput(); }
  else if (e.key === 'Enter') { e.preventDefault(); submit(); }
  else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { e.preventDefault(); pauseGame(); }
}
function onVis() { if (document.hidden) pauseGame(); syncMusic(); }

export function installInput() {
  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}
