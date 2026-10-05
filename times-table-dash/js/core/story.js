// Story mode: chapter unlocks, the dialogue typewriter, and the intro → timed round → win / lose loop.
// A chapter unlocks when the one before it is cleared; cleared chapters can be replayed any time.
import { store } from './util.js';
import { CHAPTERS, CAST, sceneArt, STORY_MUSIC } from '../data/stories.js';
import { describe } from '../data/problems.js';
import { BADGES } from '../data/practice.js';
import { preloadArt } from '../data/assets.js';
import { view, storyProg, earned, storyTrack, battleTrack, awardBadges } from './state.js';
import { sfx, unlockAudio, loadStorySounds } from './audio.js';
import { startGame } from './game.js';
import { fx } from './fx.js';
const { reactive, computed } = Vue;

export const chapters = CHAPTERS;
// phase: 'intro' before the round, then 'win' or 'lose' after it
export const story = reactive({ id: CHAPTERS[0].id, phase: 'intro', tries: 0, last: null, run: 0, talkI: 0, talkN: 0 });
export const chapter = computed(() => CHAPTERS.find(c => c.id === story.id) || CHAPTERS[0]);
export const chapterIndex = computed(() => CHAPTERS.findIndex(c => c.id === story.id));
export const isCleared = (id) => !!(storyProg[id] && storyProg[id].done);
export const isUnlocked = (i) => i === 0 || isCleared(CHAPTERS[i - 1].id);
export const storiesDone = computed(() => CHAPTERS.filter(c => isCleared(c.id)).length);
export const nextStoryId = computed(() => { const c = CHAPTERS.find(c => !isCleared(c.id)); return c ? c.id : null; });
export const storyHomeLine = computed(() => {
  if (!storiesDone.value) return 'Count Calculo stopped the town clock. Beat the clock, chapter by chapter.';
  if (!nextStoryId.value) return 'All ' + CHAPTERS.length + ' chapters clear! Replay one to beat your stars.';
  return storiesDone.value + ' of ' + CHAPTERS.length + ' chapters clear · Next: ' + CHAPTERS.find(c => c.id === nextStoryId.value).title;
});
export const roundLabel = computed(() => describe(chapter.value.round));

// ---------- dialogue ----------
const toLine = ([who, text]) => ({ who, text, cast: CAST[who] || null });
export const lines = computed(() => {
  const c = chapter.value;
  if (story.phase === 'win') return c.win.map(toLine);
  if (story.phase === 'lose' && story.last) return c.lose(story.last).concat([['narr', 'TIP: ' + c.tip]]).map(toLine);
  return c.intro.map(toLine);
});
export const line = computed(() => lines.value[story.talkI] || null);
export const lineText = computed(() => line.value ? line.value.text.slice(0, story.talkN) : '');
export const lineTyped = computed(() => !line.value || story.talkN >= line.value.text.length);
export const talkDone = computed(() => story.talkI >= lines.value.length - 1 && lineTyped.value);

const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
let talkTimer = 0;
function stopTyping() { clearInterval(talkTimer); talkTimer = 0; }
function talk(i) {
  stopTyping();
  story.talkI = i; story.talkN = 0;
  const full = line.value ? line.value.text.length : 0;
  if (reduceMQ.matches) { story.talkN = full; return; }
  talkTimer = setInterval(() => {
    if (story.talkN >= full) { stopTyping(); return; }
    story.talkN++;
    if (story.talkN % 3 === 0 && line.value.text[story.talkN - 1] !== ' ') sfx.blip();
  }, 26);
}
// tap / Enter on the dialogue box: finish the current line, then go to the next one
export function talkAdvance() {
  if (!line.value) return;
  if (!lineTyped.value) { stopTyping(); story.talkN = line.value.text.length; return; }
  if (story.talkI < lines.value.length - 1) { sfx.tick(); talk(story.talkI + 1); }
}
export function talkSkip() { stopTyping(); story.talkI = Math.max(0, lines.value.length - 1); story.talkN = line.value ? line.value.text.length : 0; }

// ---------- chapter flow ----------
export function openChapter(id) {
  const i = CHAPTERS.findIndex(c => c.id === id);
  if (i < 0 || !isUnlocked(i)) return;
  story.id = id; story.phase = 'intro'; story.tries = 0; story.last = null; story.run++;
  preloadArt(sceneArt(id));
  Object.values(CAST).forEach(c => preloadArt(c.art));
  storyTrack.value = STORY_MUSIC.theme;
  if (view.value !== 'story') { view.value = 'story'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  unlockAudio(); loadStorySounds();
  sfx.start();
  talk(0);
}
export function startChapter() {
  const c = chapter.value;
  battleTrack.value = c.final ? STORY_MUSIC.final : c.foe ? STORY_MUSIC.boss : STORY_MUSIC.quest;
  startGame({ mode: 'story', ...c.round, onEnd: roundOver });
}
function roundOver(r) {
  const c = chapter.value;
  story.tries++;
  // stars: how much time was left when the goal was reached
  const left = r.timeLeft / r.duration;
  const stars = r.won ? (left >= 0.35 ? 3 : left >= 0.15 ? 2 : 1) : 0;
  story.last = { score: r.score, goal: r.goal, need: Math.max(0, r.goal - r.score), pct: Math.min(99, Math.round(r.score / r.goal * 100)), tries: story.tries, stars, missed: r.missed.slice(0, 6) };
  story.phase = r.won ? 'win' : 'lose';
  story.run++;
  view.value = 'story';
  window.scrollTo({ top: 0 });
  if (r.won) {
    const prev = storyProg[c.id] || {};
    storyProg[c.id] = { done: true, stars: Math.max(prev.stars || 0, stars) };
    store.set('ttd.story', { ...storyProg });
    const fresh = [];
    if (!earned.reader) fresh.push(BADGES.find(b => b.id === 'reader'));
    if (c.final && !earned.bookworm) fresh.push(BADGES.find(b => b.id === 'bookworm'));
    awardBadges(fresh);
    story.last.newBadges = fresh;
    sfx.clear();
    fx.rain(c.final ? 70 : 36);
  } else {
    sfx.lose();
  }
  talk(0);
}
export function nextChapter() { const n = CHAPTERS[chapterIndex.value + 1]; if (n) openChapter(n.id); }
// Enter once the dialogue is done: start / retry the round, or move on after a win
export function storyPrimary() {
  if (story.phase === 'win') { if (chapterIndex.value < CHAPTERS.length - 1) nextChapter(); }
  else startChapter();
}
