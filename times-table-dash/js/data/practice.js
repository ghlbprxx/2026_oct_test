// Times table presets, stickers and Kazu's lines.
import { range } from '../core/util.js';

// Quick starts on the practice screen. `level` applies to + and −; tables/from/to apply to × and ÷.
export const PRESETS = [
  { id: 'add', name: 'Addition', ops: ['add'], level: 'medium', tables: range(2, 12), from: 1, to: 12 },
  { id: 'sub', name: 'Subtraction', ops: ['sub'], level: 'medium', tables: range(2, 12), from: 1, to: 12 },
  { id: 'mul', name: 'Times tables', ops: ['mul'], level: 'medium', tables: range(2, 12), from: 1, to: 12 },
  { id: 'div', name: 'Division facts', ops: ['div'], level: 'medium', tables: range(2, 12), from: 1, to: 12 },
  { id: 'muldiv', name: '× and ÷', ops: ['mul', 'div'], level: 'medium', tables: range(2, 12), from: 1, to: 12 },
  { id: 'all', name: 'All four', ops: ['add', 'sub', 'mul', 'div'], level: 'medium', tables: range(2, 12), from: 1, to: 12 }
];

// `test` runs on a practice round summary; `story` badges are awarded from story mode instead.
export const BADGES = [
  { id: 'first', icon: '🎒', name: 'First Round', how: 'Finish any practice round', tone: 'accent', test: r => true },
  { id: 'streak10', icon: '🔥', name: 'Hot Streak', how: 'Get 10 right in a row', tone: 'sun', test: r => r.bestStreak >= 10 },
  { id: 'streak25', icon: '☄️', name: 'Comet', how: 'Get 25 right in a row', tone: 'rose', test: r => r.bestStreak >= 25 },
  { id: 'sharp', icon: '🎯', name: 'Sharpshooter', how: '15 or more right with zero misses', tone: 'blue', test: r => r.correct >= 15 && r.wrong === 0 },
  { id: 'lightning', icon: '⚡', name: 'Lightning', how: 'Average under 2 seconds (10+ right)', tone: 'sun', test: r => r.correct >= 10 && r.avgRaw < 2 },
  { id: 'sevens', icon: '🦖', name: 'Seven Slayer', how: 'Answer 10 × or ÷ facts with a 7 in one round', tone: 'accent', test: r => r.sevens >= 10 },
  { id: 'allfour', icon: '🧮', name: 'All-Rounder', how: '15 right in an "All four" round', tone: 'blue', test: r => r.ops === 4 && r.correct >= 15 },
  { id: 'thousand', icon: '🏆', name: 'Grand Score', how: 'Score 1,000 in one round', tone: 'sun', test: r => r.score >= 1000 },
  { id: 'crown', icon: '👑', name: 'Full House', how: '3 stars on all 12 times tables, ×1–12', tone: 'rose', test: r => r.stars === 3 && r.fullSet },
  { id: 'reader', icon: '⚔️', name: 'First Victory', how: 'Clear a story chapter', tone: 'blue', story: true },
  { id: 'bookworm', icon: '🕰️', name: 'Clock Saver', how: 'Defeat Count Calculo', tone: 'rose', story: true }
];

export const CHEERS = ['Nice!', 'Correct!', 'Yes!', 'Well done.', 'Lovely.'];
export const FAST_CHEERS = ['Quick!', 'Speedy!', 'So fast!'];
export const HOME_LINES = ["Hi, I'm Kazu. Tap me for tips!", 'Count Calculo stopped the town clock. Help me in Story mode!', '5 right in a row doubles your points.', 'Answer in under 2 seconds for a speed bonus.', 'Stuck on a fact? Check the cheat sheet.'];
