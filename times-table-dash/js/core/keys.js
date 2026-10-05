// Keyboard controls for the story reader and the practice round, plus auto-pause when the tab is hidden.
import { view, game } from './state.js';
import { syncMusic, unlockAudio } from './audio.js';
import { press, backspace, clearInput, submit, pauseGame, resumeGame } from './game.js';
import { story, beat, storyPress, storyBack, storyCheck, storyGo } from './story.js';

function onKey(e) {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (view.value === 'story') {
    const onBeat = story.page >= 1 && story.page <= story.beats.length;
    if (onBeat && !beat.value.status) {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); storyPress(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); storyBack(); }
      else if (e.key === 'Enter') { e.preventDefault(); storyCheck(); }
    } else if (e.key === 'Enter' && e.target === document.body && story.page <= story.beats.length) { e.preventDefault(); storyGo(story.page + 1); }
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
