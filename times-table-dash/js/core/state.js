// Shared app state: current view, saved settings and progress, the live practice round, and Kazu's reactions.
// Everything here is a module-level singleton, so every view sees the same state.
import { store, clamp } from './util.js';
import { OPS, LEVEL_KEYS, describe } from '../data/problems.js';
const { ref, reactive, computed, watch } = Vue;

export const view = ref('home');
// music for story screens and story rounds (set by story.js, read by audio.js)
export const storyTrack = ref(null);
export const battleTrack = ref(null);

// ---------- persisted settings and progress ----------
// practice setup: which problem types, + / − level, × / ÷ tables and range, round length
export const settings = reactive({ ops: ['mul'], level: 'medium', tables: [6, 7, 8], from: 1, to: 10, duration: 60 });
const savedSettings = store.get('ttd.settings', null);
if (savedSettings && Array.isArray(savedSettings.tables)) {
  settings.tables = savedSettings.tables.filter(n => Number.isInteger(n) && n >= 1 && n <= 12);
  settings.from = clamp(parseInt(savedSettings.from, 10) || 0, 0, 12);
  settings.to = clamp(parseInt(savedSettings.to, 10) || 10, Math.max(1, settings.from), 12);
  settings.duration = [30, 60, 90].includes(savedSettings.duration) ? savedSettings.duration : 60;
  // saves from before + − ÷ existed have no ops: they were times tables
  const ops = Array.isArray(savedSettings.ops) ? savedSettings.ops.filter(o => OPS.includes(o)) : [];
  settings.ops = ops.length ? ops : ['mul'];
  settings.level = LEVEL_KEYS.includes(savedSettings.level) ? savedSettings.level : 'medium';
}
watch(settings, v => store.set('ttd.settings', { ops: [...v.ops], level: v.level, tables: [...v.tables], from: v.from, to: v.to, duration: v.duration }), { deep: true });
export const setupLabel = computed(() => describe(settings));

export const sound = ref(store.get('ttd.sound', true) !== false);
export const music = ref(store.get('ttd.music', true) !== false);
export const earned = reactive(store.get('ttd.badges', {}) || {});
export const bests = reactive(store.get('ttd.bests', {}) || {});
export const lastMissed = ref(store.get('ttd.missed', []) || []);
export const storyProg = reactive(store.get('ttd.story', {}) || {});

export function awardBadges(list) {
  list.forEach(b => { earned[b.id] = true; });
  if (list.length) store.set('ttd.badges', { ...earned });
}

// ---------- the practice round (logic lives in game.js) ----------
// cfg is the round being played: { mode: 'practice' | 'story', ops, level, tables, from, to, duration, goal? }
export const game = reactive({ cfg: null, phase: 'idle', count: 3, timeLeft: 60, score: 0, streak: 0, bestStreak: 0, correct: 0, wrong: 0, sevens: 0, q: { op: 'mul', a: 1, b: 1, ans: 1 }, qid: 0, input: '', typed: '', feedback: null, missed: {}, times: [] });
export const isLive = computed(() => view.value === 'play' && ['countdown', 'playing', 'paused'].includes(game.phase));

// ---------- Kazu reactions ----------
export const kazu = reactive({ react: null, say: '', key: 0 });
let kazuTimer = 0, sayTimer = 0;
export function kazuReact(mood, ms, say) {
  kazu.react = mood; kazu.key++;
  clearTimeout(kazuTimer); kazuTimer = setTimeout(() => { kazu.react = null; }, ms);
  if (say) { kazu.say = say; clearTimeout(sayTimer); sayTimer = setTimeout(() => { kazu.say = ''; }, Math.max(ms, 1800)); }
}

// ---------- navigation ----------
export function go(v) { if (isLive.value) return; kazu.say = ''; view.value = v; window.scrollTo({ top: 0, behavior: 'smooth' }); }
