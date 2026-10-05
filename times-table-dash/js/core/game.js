// Times table practice: setup helpers and the timed round (countdown, questions, scoring, results).
import { clamp, range, shuffle, sameSet, pick, store } from './util.js';
import { PRESETS, BADGES, CHEERS, FAST_CHEERS } from '../data/practice.js';
import { view, settings, tablesLabel, game, bests, earned, lastMissed, kazu, kazuReact, awardBadges } from './state.js';
import { audio, sfx, unlockAudio } from './audio.js';
import { fx } from './fx.js';
const { ref, reactive, computed, watch } = Vue;

export const presets = PRESETS;
export const earnedCount = computed(() => BADGES.filter(b => earned[b.id]).length);

// ---------- setup ----------
export const activePreset = computed(() => { const p = PRESETS.find(p => sameSet(p.tables, settings.tables) && p.from === settings.from && p.to === settings.to); return p ? p.id : null; });
export function applyPreset(p) { settings.tables = [...p.tables]; settings.from = p.from; settings.to = p.to; sfx.tick(); }
export function toggleTable(n) { const i = settings.tables.indexOf(n); if (i >= 0) settings.tables.splice(i, 1); else settings.tables.push(n); }
export function selectAll() { settings.tables = range(1, 12); }
export function clearTables() { settings.tables = []; }
export function bump(which, d) {
  if (which === 'from') settings.from = clamp(settings.from + d, 0, settings.to);
  else settings.to = clamp(settings.to + d, Math.max(1, settings.from), 12);
}
const setupKey = computed(() => [...settings.tables].sort((a, b) => a - b).join(',') + '|' + settings.from + '-' + settings.to + '|' + settings.duration);
export const bestForSetup = computed(() => bests[setupKey.value] || 0);

// ---------- the round ----------
export const floats = ref([]);
export const shownScore = ref(0);
let scoreRaf = 0;
watch(() => game.score, v => {
  cancelAnimationFrame(scoreRaf);
  const from = shownScore.value, t0 = performance.now();
  if (v <= from) { shownScore.value = v; return; }
  const step = t => { const k = Math.min(1, (t - t0) / 500); shownScore.value = Math.round(from + (v - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) scoreRaf = requestAnimationFrame(step); };
  scoreRaf = requestAnimationFrame(step);
});

export const result = reactive({});
let deck = [], raf = 0, lastTs = 0, qStart = 0, pausedAt = 0, timers = [], uid = 0, lastKey = '';

export const mult = computed(() => Math.min(4, 1 + Math.floor(game.streak / 5)));
export const timePct = computed(() => clamp(game.timeLeft / settings.duration * 100, 0, 100));
export const hintText = computed(() => {
  if (game.phase === 'countdown') return 'Get ready…';
  if (mult.value >= 4) return 'Top bonus: ×4 points';
  const left = 5 - (game.streak % 5);
  return (left === 1 ? 'One more' : left + ' more') + ' in a row for ×' + (mult.value + 1) + ' points';
});

function later(fn, ms) { const id = setTimeout(() => { timers = timers.filter(t => t !== id); fn(); }, ms); timers.push(id); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; if (raf) cancelAnimationFrame(raf); raf = 0; }

function buildFacts() { const f = []; for (const t of settings.tables) for (let n = settings.from; n <= settings.to; n++) f.push([t, n]); return f; }
function nextQuestion() {
  if (!deck.length) deck = shuffle(buildFacts());
  let f = deck.pop();
  if (f[0] + 'x' + f[1] === lastKey && deck.length) { const g = deck.pop(); deck.unshift(f); f = g; }
  if (!deck.length) deck = shuffle(buildFacts());
  lastKey = f[0] + 'x' + f[1];
  const flip = f[0] !== f[1] && Math.random() < 0.4;
  game.q = flip ? { a: f[1], b: f[0], t: f[0], n: f[1] } : { a: f[0], b: f[1], t: f[0], n: f[1] };
  game.input = ''; game.feedback = null; game.qid++;
  qStart = performance.now();
}

export function startGame() {
  if (!settings.tables.length) return;
  clearTimers();
  audio(); unlockAudio();
  Object.assign(game, { phase: 'countdown', count: 3, timeLeft: settings.duration, score: 0, streak: 0, bestStreak: 0, correct: 0, wrong: 0, sevens: 0, input: '', typed: '', feedback: null, missed: {}, times: [] });
  floats.value = []; shownScore.value = 0; deck = []; lastKey = '';
  view.value = 'play';
  window.scrollTo({ top: 0 });
  kazu.react = null; kazu.say = 'Ready?'; kazu.key++;
  sfx.count();
  const stepCount = () => {
    if (game.phase !== 'countdown') return;
    if (game.count > 1) { game.count--; sfx.count(); later(stepCount, 800); }
    else if (game.count === 1) { game.count = 0; sfx.go(); kazuReact('happy', 700, "Let's go."); later(stepCount, 550); }
    else { game.phase = 'playing'; nextQuestion(); lastTs = performance.now(); raf = requestAnimationFrame(tick); }
  };
  later(stepCount, 800);
}

function tick(ts) {
  if (game.phase !== 'playing') { raf = 0; return; }
  const dt = Math.max(0, (ts - lastTs) / 1000); lastTs = ts;
  game.timeLeft = Math.max(0, game.timeLeft - dt);
  if (game.timeLeft <= 0) { raf = 0; endGame(); return; }
  raf = requestAnimationFrame(tick);
}

function addFloat(text, kind) {
  const f = { id: ++uid, text, kind };
  floats.value.push(f);
  later(() => { floats.value = floats.value.filter(x => x.id !== f.id); }, 1050);
}

export function press(d) {
  if (game.phase !== 'playing' || game.feedback) return;
  if (game.input.length >= 3) return;
  game.input += d;
  if (game.input.length >= String(game.q.a * game.q.b).length) check();
}
export function backspace() { if (game.phase === 'playing' && !game.feedback) game.input = game.input.slice(0, -1); }
export function clearInput() { if (game.phase === 'playing' && !game.feedback) game.input = ''; }
export function submit() { if (game.phase === 'playing' && !game.feedback && game.input) check(); }

function check() {
  const ans = game.q.a * game.q.b;
  const val = parseInt(game.input, 10);
  const secs = (performance.now() - qStart) / 1000;
  const { t, n } = game.q;
  if (val === ans) {
    game.correct++; game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    game.times.push(secs);
    if (t === 7 || n === 7) game.sevens++;
    const m = Math.min(4, 1 + Math.floor(game.streak / 5));
    const fast = secs < 2;
    const pts = 10 * m + (fast ? 5 * m : 0);
    game.score += pts;
    game.feedback = 'right';
    addFloat('+' + pts, fast ? 'fast' : 'pts');
    if (game.streak % 5 === 0) {
      game.timeLeft += 3;
      addFloat('+3 sec', 'time');
      sfx.combo();
      kazuReact('cheer', 1200, game.streak + ' in a row!');
    } else {
      sfx.correct(fast);
      kazuReact('happy', 600, game.streak % 3 === 0 ? (fast ? pick(FAST_CHEERS) : pick(CHEERS)) : '');
    }
    later(nextQuestion, 420);
  } else {
    game.wrong++; game.streak = 0;
    const key = t + 'x' + n;
    game.missed[key] = (game.missed[key] || 0) + 1;
    game.typed = game.input;
    game.feedback = 'wrong';
    kazuReact('shock', 1100, "That's okay. Keep going.");
    sfx.wrong();
    deck.splice(Math.max(0, deck.length - 3), 0, [t, n]);
    later(nextQuestion, 1500);
  }
}

export function pauseGame() {
  if (game.phase !== 'playing') return;
  game.phase = 'paused'; pausedAt = performance.now();
  if (raf) cancelAnimationFrame(raf); raf = 0;
}
export function resumeGame() {
  if (game.phase !== 'paused') return;
  qStart += performance.now() - pausedAt;
  game.phase = 'playing'; lastTs = performance.now(); raf = requestAnimationFrame(tick);
}
export function quitGame() { clearTimers(); kazu.say = ''; game.phase = 'idle'; view.value = 'practice'; }

function endGame() {
  clearTimers();
  game.phase = 'over';
  game.feedback = null;
  const answered = game.correct + game.wrong;
  const accuracy = answered ? Math.round(game.correct / answered * 100) : 0;
  const avgRaw = game.times.length ? game.times.reduce((a, b) => a + b, 0) / game.times.length : Infinity;
  const scale = settings.duration / 60;
  let stars = 0;
  if (game.correct >= 10 * scale) stars = 1;
  if (game.correct >= 20 * scale && accuracy >= 70) stars = 2;
  if (game.correct >= 30 * scale && accuracy >= 85) stars = 3;
  const fullSet = settings.tables.length === 12 && settings.from <= 1 && settings.to === 12;
  const key = setupKey.value;
  const newBest = game.score > 0 && game.score > (bests[key] || 0);
  if (newBest) { bests[key] = game.score; store.set('ttd.bests', { ...bests }); }
  const summary = { score: game.score, correct: game.correct, wrong: game.wrong, bestStreak: game.bestStreak, avgRaw, sevens: game.sevens, stars, fullSet };
  const newBadges = BADGES.filter(b => !b.story && !earned[b.id] && b.test(summary));
  awardBadges(newBadges);
  const missed = Object.entries(game.missed).map(([k, count]) => { const [t, n] = k.split('x').map(Number); return { key: k, t, n, count }; }).sort((a, b) => b.count - a.count || a.t - b.t || a.n - b.n);
  lastMissed.value = missed.map(m => m.key);
  store.set('ttd.missed', lastMissed.value);
  Object.assign(result, {
    score: game.score, correct: game.correct, wrong: game.wrong, accuracy, bestStreak: game.bestStreak,
    avg: isFinite(avgRaw) ? avgRaw.toFixed(1) : '–', stars, newBest, newBadges, missed,
    headline: ['Good warm-up', 'Nice work', 'Great round', 'Wonderful round'][stars],
    mood: stars >= 2 ? 'cheer' : (stars === 1 ? 'happy' : 'idle'),
    say: ['Every round helps.', 'Nice! One more?', 'Great job!', 'Amazing work!'][stars],
    setupLabel: tablesLabel.value + ' · ×' + settings.from + '–' + settings.to
  });
  view.value = 'over';
  sfx.end();
  if (stars >= 2 || newBest || newBadges.length) fx.rain(stars === 3 ? 60 : 36);
  window.scrollTo({ top: 0 });
}
