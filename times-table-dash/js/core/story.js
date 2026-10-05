// Story mode: which story is open, its generated pages, answer checking, hints and progress.
// Page 0 is the intro, pages 1..n are problems, page n + 1 is the ending.
import { clamp, pick, store } from './util.js';
import { STORIES, OP_SYM, OP_TIP, makeNums, toParts } from '../data/stories.js';
import { BADGES } from '../data/practice.js';
import { view, storyProg, earned, kazu, kazuReact, awardBadges } from './state.js';
import { sfx, unlockAudio } from './audio.js';
import { fx } from './fx.js';
const { ref, reactive, computed, nextTick } = Vue;

export const stories = STORIES;
// the "Next page" button, focused after a page is solved so Enter moves on
export const nextBtn = ref(null);

export const story = reactive({ id: STORIES[0].id, page: 0, reached: 0, beats: [], firstTry: 0, run: 0, dir: 1 });
export const curStory = computed(() => STORIES.find(s => s.id === story.id) || STORIES[0]);
export const storyIndex = computed(() => STORIES.findIndex(s => s.id === story.id));
export const beat = computed(() => story.beats[story.page - 1] || {});
export const storiesDone = computed(() => STORIES.filter(s => storyProg[s.id] && storyProg[s.id].done).length);
export const nextStoryId = computed(() => { const s = STORIES.find(s => !(storyProg[s.id] && storyProg[s.id].done)); return s ? s.id : null; });
export const storyHomeLine = computed(() => {
  if (!storiesDone.value) return 'Five gentle stories with +, − and ÷ puzzles.';
  if (!nextStoryId.value) return 'All ' + STORIES.length + ' stories read. Read a favorite again!';
  return storiesDone.value + ' of ' + STORIES.length + ' read · Next: ' + STORIES.find(s => s.id === nextStoryId.value).title;
});
export const storyStars = computed(() => {
  const n = story.beats.length; if (!n) return 0;
  const r = story.firstTry / n;
  return r === 1 ? 3 : r >= 0.6 ? 2 : 1;
});

export function openStory(id) {
  const s = STORIES.find(x => x.id === id); if (!s) return;
  story.dir = storyIndex.value <= STORIES.indexOf(s) ? 1 : -1;
  story.id = id; story.page = 0; story.reached = 0; story.firstTry = 0; story.run++;
  story.beats = s.beats.map(b => {
    const n = makeNums(b);
    return { op: b.op, icon: b.icon, a: n.a, b: n.b, ans: n.ans, parts: toParts(b.text(n)), ask: b.ask, input: '', tries: 0, status: null, hint: false, flash: false, msg: '' };
  });
  kazu.say = ''; kazu.react = null;
  if (view.value !== 'story') { view.value = 'story'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  unlockAudio();
}
export function storyGo(p) {
  const last = story.beats.length + 1;
  p = clamp(p, 0, last);
  if (p > story.reached + 1) return;
  // a beat must be solved (or revealed) before moving past it
  if (p > story.page && story.page >= 1 && story.page <= story.beats.length && !beat.value.status) return;
  story.dir = p >= story.page ? 1 : -1;
  story.page = p;
  story.reached = Math.max(story.reached, p);
  kazu.say = '';
  if (p === last) finishStory();
}
export function storyPress(d) { const b = beat.value; if (b.status || b.input.length >= 3) return; if (d === '0' && !b.input) return; b.input += d; b.flash = false; }
export function storyBack() { const b = beat.value; if (!b.status) b.input = b.input.slice(0, -1); }
export function storyCheck() {
  const b = beat.value; if (b.status || !b.input) return;
  if (parseInt(b.input, 10) === b.ans) {
    if (b.tries === 0) story.firstTry++;
    b.status = 'right';
    b.msg = pick(['That’s right!', 'Yes, exactly.', 'Well done!', 'Correct!']) + ' ' + b.a + ' ' + OP_SYM[b.op] + ' ' + b.b + ' = ' + b.ans + '.';
    sfx.correct(false);
    kazuReact('happy', 900, pick(['Thank you!', 'You got it!', 'Nice thinking.']));
    nextTick(() => { if (nextBtn.value) nextBtn.value.focus({ preventScroll: true }); });
  } else {
    b.tries++;
    b.flash = true;
    sfx.wrong();
    if (b.tries >= 3) {
      b.status = 'shown';
      b.msg = 'The answer is ' + b.ans + '. You’ll get the next one!';
      kazuReact('idle', 600, 'Let’s keep going together.');
      nextTick(() => { if (nextBtn.value) nextBtn.value.focus({ preventScroll: true }); });
    } else {
      b.input = '';
      if (b.tries === 2) b.hint = true;
      b.msg = b.tries === 1 ? 'Not quite. Try again. ' + OP_TIP[b.op] : 'Close! Look at the picture and try once more.';
      kazuReact('shock', 800);
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
  sfx.end();
  kazuReact('cheer', 1600, storyStars.value === 3 ? 'Perfect reading!' : 'The end. Thank you!');
  if (storyStars.value >= 2 || fresh.length) fx.rain(36);
}
export function dotClass(p) {
  const n = story.beats.length;
  return { cur: story.page === p, done: p === 0 ? story.reached > 0 : p === n + 1 ? story.reached > n : story.beats[p - 1] && story.beats[p - 1].status === 'right', shown: p >= 1 && p <= n && story.beats[p - 1].status === 'shown' };
}
export function dotLabel(p) { const n = story.beats.length; return p === 0 ? 'Start of story' : p === n + 1 ? 'The end' : 'Page ' + p + ' of ' + n; }
