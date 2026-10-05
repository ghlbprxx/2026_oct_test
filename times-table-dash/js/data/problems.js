// Question generator for timed rounds: addition, subtraction, multiplication and division.
// Every answer is a positive whole number: subtraction never goes below 1 and division never has a remainder.
import { rint, shuffle } from '../core/util.js';

export const OPS = ['add', 'sub', 'mul', 'div'];
export const OP_SYM = { add: '+', sub: '−', mul: '×', div: '÷' };
export const OP_NAME = { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division' };

// + and − difficulty, aimed at 4th–5th grade
export const LEVELS = {
  easy: { name: 'Easy', note: '2-digit and 1-digit', add: [[10, 99], [2, 9]], sub: [[11, 99], [2, 9]] },
  medium: { name: 'Medium', note: '2-digit and 2-digit', add: [[10, 99], [10, 99]], sub: [[20, 99], [10, 98]] },
  hard: { name: 'Hard', note: '3-digit and 2-digit', add: [[100, 899], [10, 99]], sub: [[100, 999], [10, 99]] }
};
export const LEVEL_KEYS = Object.keys(LEVELS);

// how long a question of this kind usually takes, relative to a times-table fact (used to scale practice stars)
export function pace(cfg) {
  const p = cfg.ops.map(op => op === 'mul' || op === 'div' ? 1 : { easy: 0.8, medium: 0.55, hard: 0.45 }[cfg.level] || 0.55);
  return p.reduce((a, b) => a + b, 0) / p.length;
}
export const needsTables = (ops) => ops.includes('mul') || ops.includes('div');

// A round's question source. cfg: { ops, level, tables, from, to }
export function makeDeck(cfg) {
  let facts = [], lastKey = '', retry = [], served = 0;
  const lo = Math.max(1, cfg.from);
  const refill = () => { facts = []; for (const t of cfg.tables) for (let n = lo; n <= cfg.to; n++) facts.push([t, n]); shuffle(facts); };
  function build(op) {
    const L = LEVELS[cfg.level] || LEVELS.medium;
    if (op === 'add') { const a = rint(...L.add[0]), b = rint(...L.add[1]); return { op, a, b, ans: a + b }; }
    if (op === 'sub') {
      const a = rint(...L.sub[0]);
      const b = rint(L.sub[1][0], Math.min(L.sub[1][1], a - 1));
      return { op, a, b, ans: a - b };
    }
    if (!facts.length) refill();
    const [t, n] = facts.pop();
    if (op === 'mul') return Math.random() < 0.4 && t !== n ? { op, a: n, b: t, ans: t * n, t, n } : { op, a: t, b: n, ans: t * n, t, n };
    return { op, a: t * n, b: t, ans: n, t, n }; // division: (t × n) ÷ t = n
  }
  return {
    next() {
      served++;
      // a missed question comes back a few questions later
      if (retry.length && retry[0].at <= served) return retry.shift().q;
      let q, tries = 0;
      do { q = build(cfg.ops[Math.floor(Math.random() * cfg.ops.length)]); q.key = q.op + ':' + q.a + ':' + q.b; } while (q.key === lastKey && ++tries < 5);
      lastKey = q.key;
      return q;
    },
    again(q) { retry.push({ q, at: served + 3 }); }
  };
}

export function describe(cfg) {
  const parts = [cfg.ops.map(o => OP_SYM[o]).join(' ')];
  if (cfg.ops.includes('add') || cfg.ops.includes('sub')) parts.push((LEVELS[cfg.level] || LEVELS.medium).name);
  if (needsTables(cfg.ops)) {
    const t = [...cfg.tables].sort((a, b) => a - b);
    const tl = t.length === 12 ? 'all tables' : t.length > 4 && t[t.length - 1] - t[0] === t.length - 1 ? t[0] + 's–' + t[t.length - 1] + 's' : t.map(n => n + 's').join(', ');
    parts.push(tl + ' · ' + Math.max(1, cfg.from) + '–' + cfg.to);
  }
  return parts.join(' · ');
}
