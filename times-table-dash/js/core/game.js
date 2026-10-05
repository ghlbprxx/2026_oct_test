// Timed rounds for practice and story mode: setup helpers, countdown, questions, scoring, results.
// A story round has a point goal; reaching it ends the round early as a win.
import { clamp, range, sameSet, pick, store } from './util.js';
import { PRESETS, BADGES, CHEERS, FAST_CHEERS } from '../data/practice.js';
import { OP_SYM, makeDeck, needsTables, pace } from '../data/problems.js';
import { view, settings, setupLabel, game, bests, earned, lastMissed, kazu, kazuReact, awardBadges } from './state.js';
import { audio, sfx, unlockAudio } from './audio.js';
import { fx } from './fx.js';
const { ref, reactive, computed, watch } = Vue;

export const presets = PRESETS;
export const earnedCount = computed(() => BADGES.filter(b => earned[b.id]).length);

// ---------- setup ----------
export const activePreset = computed(() => {
  const p = PRESETS.find(p => sameSet(p.ops, settings.ops)
    && (!(p.ops.includes('add') || p.ops.includes('sub')) || p.level === settings.level)
    && (!needsTables(p.ops) || (sameSet(p.tables, settings.tables) && p.from === settings.from && p.to === settings.to)));
  return p ? p.id : null;
});
export function applyPreset(p) { settings.ops = [...p.ops]; settings.level = p.level; settings.tables = [...p.tables]; settings.from = p.from; settings.to = p.to; sfx.tick(); }
export function toggleOp(op) { const i = settings.ops.indexOf(op); if (i >= 0) settings.ops.splice(i, 1); else settings.ops.push(op); }
export function toggleTable(n) { const i = settings.tables.indexOf(n); if (i >= 0) settings.tables.splice(i, 1); else settings.tables.push(n); }
export function selectAll() { settings.tables = range(1, 12); }
export function clearTables() { settings.tables = []; }
export function bump(which, d) {
  if (which === 'from') settings.from = clamp(settings.from + d, 1, settings.to);
  else settings.to = clamp(settings.to + d, settings.from, 12);
}
export const usesLevel = computed(() => settings.ops.includes('add') || settings.ops.includes('sub'));
export const usesTables = computed(() => needsTables(settings.ops));
export const setupError = computed(() => {
  if (!settings.ops.length) return 'Pick at least one problem type.';
  if (usesTables.value && !settings.tables.length) return 'Pick at least one times table for × and ÷.';
  return '';
});
const setupKey = computed(() => setupLabel.value + '|' + settings.duration);
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
let deck = null, endHook = null, raf = 0, lastTs = 0, qStart = 0, pausedAt = 0, timers = [], uid = 0;

export const mult = computed(() => Math.min(4, 1 + Math.floor(game.streak / 5)));
export const timePct = computed(() => game.cfg ? clamp(game.timeLeft / game.cfg.duration * 100, 0, 100) : 100);
// story rounds: share of the goal reached so far
export const goalPct = computed(() => game.cfg && game.cfg.goal ? clamp(game.score / game.cfg.goal * 100, 0, 100) : 0);
export const hintText = computed(() => {
  if (game.phase === 'countdown') return 'Get ready…';
  if (mult.value >= 4) return 'Top bonus: ×4 points';
  const left = 5 - (game.streak % 5);
  return (left === 1 ? 'One more' : left + ' more') + ' in a row for ×' + (mult.value + 1) + ' points';
});

function later(fn, ms) { const id = setTimeout(() => { timers = timers.filter(t => t !== id); fn(); }, ms); timers.push(id); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; if (raf) cancelAnimationFrame(raf); raf = 0; }

function nextQuestion() {
  game.q = deck.next();
  game.input = ''; game.feedback = null; game.qid++;
  qStart = performance.now();
}

// Start a round. With no argument it uses the practice settings; story mode passes its own
// cfg ({ mode: 'story', ops, level, tables, from, to, duration, goal }) plus onEnd(summary).
export function startGame(over) {
  const cfg = over && over.ops ? { mode: 'practice', ...over } : { mode: 'practice', ops: [...settings.ops], level: settings.level, tables: [...settings.tables], from: settings.from, to: settings.to, duration: settings.duration };
  if (!cfg.ops.length || (needsTables(cfg.ops) && !cfg.tables.length)) return;
  endHook = cfg.onEnd || null; delete cfg.onEnd;
  clearTimers();
  audio(); unlockAudio();
  deck = makeDeck(cfg);
  Object.assign(game, { cfg, phase: 'countdown', count: 3, timeLeft: cfg.duration, score: 0, streak: 0, bestStreak: 0, correct: 0, wrong: 0, sevens: 0, hits: 0, input: '', typed: '', feedback: null, missed: {}, times: [] });
  floats.value = []; shownScore.value = 0;
  view.value = 'play';
  window.scrollTo({ top: 0 });
  kazu.react = null; kazu.say = cfg.goal ? 'Goal: ' + cfg.goal + ' points!' : 'Ready?'; kazu.key++;
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
  if (game.input.length >= 4) return;
  game.input += d;
  if (game.input.length >= String(game.q.ans).length) check();
}
export function backspace() { if (game.phase === 'playing' && !game.feedback) game.input = game.input.slice(0, -1); }
export function clearInput() { if (game.phase === 'playing' && !game.feedback) game.input = ''; }
export function submit() { if (game.phase === 'playing' && !game.feedback && game.input) check(); }

function check() {
  const q = game.q;
  const val = parseInt(game.input, 10);
  const secs = (performance.now() - qStart) / 1000;
  if (val === q.ans) {
    game.correct++; game.streak++; game.hits++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    game.times.push(secs);
    if (q.t === 7 || q.n === 7) game.sevens++;
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
      if (game.cfg.mode === 'story') sfx.hit(); else sfx.correct(fast);
      kazuReact('happy', 600, game.streak % 3 === 0 ? (fast ? pick(FAST_CHEERS) : pick(CHEERS)) : '');
    }
    // story goal reached: stop the clock and end the round as a win
    if (game.cfg.goal && game.score >= game.cfg.goal) {
      game.phase = 'finishing'; if (raf) cancelAnimationFrame(raf); raf = 0;
      later(endGame, 900);
      return;
    }
    later(nextQuestion, 420);
  } else {
    game.wrong++; game.streak = 0;
    const m = game.missed[q.key] || (game.missed[q.key] = { key: q.key, text: q.a + ' ' + OP_SYM[q.op] + ' ' + q.b + ' = ' + q.ans, fact: q.t ? q.t + 'x' + q.n : null, count: 0 });
    m.count++;
    game.typed = game.input;
    game.feedback = 'wrong';
    kazuReact('shock', 1100, "That's okay. Keep going.");
    sfx.wrong();
    deck.again(q);
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
export function quitGame() { clearTimers(); kazu.say = ''; game.phase = 'idle'; view.value = game.cfg && game.cfg.mode === 'story' ? 'story' : 'practice'; }
export function restartGame() { startGame(game.cfg.mode === 'story' ? { ...game.cfg, onEnd: endHook } : undefined); }

function endGame() {
  clearTimers();
  game.phase = 'over';
  game.feedback = null;
  const cfg = game.cfg;
  const missed = Object.values(game.missed).sort((a, b) => b.count - a.count);
  // missed × and ÷ facts are marked on the cheat sheet
  lastMissed.value = missed.filter(m => m.fact).map(m => m.fact);
  store.set('ttd.missed', lastMissed.value);
  if (cfg.mode === 'story') {
    if (endHook) endHook({ score: game.score, goal: cfg.goal, won: game.score >= cfg.goal, timeLeft: game.timeLeft, duration: cfg.duration, correct: game.correct, wrong: game.wrong, missed });
    return;
  }
  const answered = game.correct + game.wrong;
  const accuracy = answered ? Math.round(game.correct / answered * 100) : 0;
  const avgRaw = game.times.length ? game.times.reduce((a, b) => a + b, 0) / game.times.length : Infinity;
  // star thresholds scale with round length and with how long these questions usually take
  const scale = cfg.duration / 60 * pace(cfg);
  let stars = 0;
  if (game.correct >= 10 * scale) stars = 1;
  if (game.correct >= 20 * scale && accuracy >= 70) stars = 2;
  if (game.correct >= 30 * scale && accuracy >= 85) stars = 3;
  const fullSet = cfg.ops.length === 1 && cfg.ops[0] === 'mul' && cfg.tables.length === 12 && cfg.from <= 1 && cfg.to === 12;
  const key = setupKey.value;
  const newBest = game.score > 0 && game.score > (bests[key] || 0);
  if (newBest) { bests[key] = game.score; store.set('ttd.bests', { ...bests }); }
  const summary = { score: game.score, correct: game.correct, wrong: game.wrong, bestStreak: game.bestStreak, avgRaw, sevens: game.sevens, stars, fullSet, ops: cfg.ops.length };
  const newBadges = BADGES.filter(b => !b.story && !earned[b.id] && b.test(summary));
  awardBadges(newBadges);
  Object.assign(result, {
    score: game.score, correct: game.correct, wrong: game.wrong, accuracy, bestStreak: game.bestStreak,
    avg: isFinite(avgRaw) ? avgRaw.toFixed(1) : '–', stars, newBest, newBadges, missed,
    headline: ['Good warm-up', 'Nice work', 'Great round', 'Wonderful round'][stars],
    mood: stars >= 2 ? 'cheer' : (stars === 1 ? 'happy' : 'idle'),
    say: ['Every round helps.', 'Nice! One more?', 'Great job!', 'Amazing work!'][stars],
    setupLabel: setupLabel.value
  });
  view.value = 'over';
  sfx.end();
  if (stars >= 2 || newBest || newBadges.length) fx.rain(stars === 3 ? 60 : 36);
  window.scrollTo({ top: 0 });
}
