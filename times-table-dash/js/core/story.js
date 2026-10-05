// Story mode: which story is open, its generated pages, the dialogue typewriter, answer checking,
// hints and progress. Page 0 is the title card, pages 1..n are challenges, page n + 1 is "stage clear".
import { clamp, pick, store } from './util.js';
import { STORIES, CAST, OP_SYM, OP_TIP, makeNums, toParts, sceneArt, storyMusic } from '../data/stories.js';
import { BADGES } from '../data/practice.js';
import { preloadArt } from '../data/assets.js';
import { view, storyProg, earned, storyTrack, awardBadges } from './state.js';
import { sfx, unlockAudio, loadStorySounds } from './audio.js';
import { fx } from './fx.js';
const { ref, reactive, computed, nextTick } = Vue;

export const stories = STORIES;
// the "Next" button, focused after a page is solved so Enter moves on
export const nextBtn = ref(null);

export const story = reactive({ id: STORIES[0].id, page: 0, reached: 0, beats: [], firstTry: 0, run: 0, dir: 1, talkI: 0, talkN: 0 });
export const curStory = computed(() => STORIES.find(s => s.id === story.id) || STORIES[0]);
export const storyIndex = computed(() => STORIES.findIndex(s => s.id === story.id));
export const beat = computed(() => story.beats[story.page - 1] || {});
export const onBeat = computed(() => story.page >= 1 && story.page <= story.beats.length);
export const storiesDone = computed(() => STORIES.filter(s => storyProg[s.id] && storyProg[s.id].done).length);
export const nextStoryId = computed(() => { const s = STORIES.find(s => !(storyProg[s.id] && storyProg[s.id].done)); return s ? s.id : null; });
export const storyHomeLine = computed(() => {
  if (!storiesDone.value) return 'Five little adventure worlds with +, − and ÷ challenges.';
  if (!nextStoryId.value) return 'All ' + STORIES.length + ' worlds clear! Replay a favorite.';
  return storiesDone.value + ' of ' + STORIES.length + ' worlds clear · Next: ' + STORIES.find(s => s.id === nextStoryId.value).title;
});
export const storyStars = computed(() => {
  const n = story.beats.length; if (!n) return 0;
  const r = story.firstTry / n;
  return r === 1 ? 3 : r >= 0.6 ? 2 : 1;
});

// ---------- dialogue ----------
const toLine = ([who, text]) => ({ who, text, cast: CAST[who] || null });
// the lines on the current page; a solved challenge adds its "win" line at the end
export const lines = computed(() => {
  const s = curStory.value;
  if (story.page === 0) return s.intro.map(toLine);
  if (story.page > story.beats.length) return s.outro.map(toLine);
  const b = beat.value; if (!b.lines) return [];
  const extra = b.status === 'right' ? [b.win] : b.status === 'shown' ? [['narr', 'The answer was ' + b.ans + '. On to the next one!']] : [];
  return b.lines.concat(extra).map(toLine);
});
export const line = computed(() => lines.value[story.talkI] || null);
export const lineParts = computed(() => line.value ? toParts(line.value.text.slice(0, story.talkN)) : []);
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
  }, 28);
}
function showAll() { stopTyping(); story.talkI = Math.max(0, lines.value.length - 1); story.talkN = line.value ? line.value.text.length : 0; }
// tap / Enter on the dialogue box: finish the current line, then go to the next one
export function talkAdvance() {
  if (!line.value) return;
  if (!lineTyped.value) { stopTyping(); story.talkN = line.value.text.length; return; }
  if (story.talkI < lines.value.length - 1) { sfx.tick(); talk(story.talkI + 1); }
}

// ---------- navigation ----------
export function openStory(id) {
  const s = STORIES.find(x => x.id === id); if (!s) return;
  story.dir = storyIndex.value <= STORIES.indexOf(s) ? 1 : -1;
  story.id = id; story.page = 0; story.reached = 0; story.firstTry = 0; story.run++;
  story.beats = s.beats.map(b => {
    const n = makeNums(b);
    return { op: b.op, icon: b.icon, a: n.a, b: n.b, ans: n.ans, lines: b.lines(n), win: b.win(n), ask: b.ask, input: '', tries: 0, status: null, hint: false, flash: false, msg: '' };
  });
  // optional art and music for this world; everything has a fallback
  preloadArt(sceneArt(id));
  Object.values(CAST).forEach(c => preloadArt(c.art));
  storyTrack.value = storyMusic(id);
  if (view.value !== 'story') { view.value = 'story'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  unlockAudio(); loadStorySounds();
  sfx.start();
  talk(0);
}
export function storyGo(p) {
  const last = story.beats.length + 1;
  p = clamp(p, 0, last);
  if (p > story.reached + 1) return;
  // a challenge must be solved (or revealed) before moving past it
  if (p > story.page && onBeat.value && !beat.value.status) return;
  const fresh = p > story.reached;
  story.dir = p >= story.page ? 1 : -1;
  story.page = p;
  story.reached = Math.max(story.reached, p);
  if (fresh) talk(0); else showAll();
  if (p === last && fresh) finishStory();
}

// ---------- answering ----------
export function storyPress(d) { const b = beat.value; if (b.status || b.input.length >= 3) return; if (d === '0' && !b.input) return; b.input += d; b.flash = false; }
export function storyBack() { const b = beat.value; if (!b.status) b.input = b.input.slice(0, -1); }
export function storyClear() { const b = beat.value; if (!b.status) b.input = ''; }
export function storyHint() { beat.value.hint = true; }
export function storyCheck() {
  const b = beat.value; if (b.status || !b.input) return;
  if (parseInt(b.input, 10) === b.ans) {
    if (b.tries === 0) story.firstTry++;
    b.status = 'right';
    b.msg = pick(['Correct!', 'Nailed it!', 'Yes!', 'Great job!']) + ' ' + b.a + ' ' + OP_SYM[b.op] + ' ' + b.b + ' = ' + b.ans;
    sfx.item();
    talk(lines.value.length - 1);
    nextTick(() => { if (nextBtn.value) nextBtn.value.focus({ preventScroll: true }); });
  } else {
    b.tries++;
    b.flash = true;
    sfx.wrong();
    if (b.tries >= 3) {
      b.status = 'shown';
      b.msg = 'The answer is ' + b.ans + '.';
      talk(lines.value.length - 1);
      nextTick(() => { if (nextBtn.value) nextBtn.value.focus({ preventScroll: true }); });
    } else {
      b.input = '';
      if (b.tries === 2) b.hint = true;
      b.msg = b.tries === 1 ? 'Not quite. Try again! ' + OP_TIP[b.op] : 'So close! Check the picture and try once more.';
    }
  }
}
function finishStory() {
  const prev = storyProg[story.id] || {};
  storyProg[story.id] = { done: true, stars: Math.max(prev.stars || 0, storyStars.value) };
  store.set('ttd.story', { ...storyProg });
  const fresh = [];
  if (!earned.reader) fresh.push(BADGES.find(b => b.id === 'reader'));
  if (!earned.bookworm && STORIES.every(s => storyProg[s.id] && storyProg[s.id].done)) fresh.push(BADGES.find(b => b.id === 'bookworm'));
  awardBadges(fresh);
  sfx.clear();
  if (storyStars.value >= 2 || fresh.length) fx.rain(36);
}
export function dotClass(p) {
  const n = story.beats.length;
  return { cur: story.page === p, done: p === 0 ? story.reached > 0 : p === n + 1 ? story.reached > n : story.beats[p - 1] && story.beats[p - 1].status === 'right', shown: p >= 1 && p <= n && story.beats[p - 1].status === 'shown' };
}
export function dotLabel(p) { const n = story.beats.length; return p === 0 ? 'Title' : p === n + 1 ? 'Stage clear' : 'Stage ' + p + ' of ' + n; }
