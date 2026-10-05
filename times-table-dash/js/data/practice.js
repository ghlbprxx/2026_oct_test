// Times table presets, stickers and Kazu's lines.
import { range, labelTables } from '../core/util.js';

export const PRESETS = [
  { id: 'easy', name: 'Easy', tables: [2, 5, 10], from: 1, to: 10 },
  { id: 'doubles', name: 'Doubles', tables: [2, 4, 8], from: 1, to: 10 },
  { id: 'mixed', name: 'Mixed Bag', tables: [3, 4, 6, 9], from: 1, to: 10 },
  { id: 'tricky', name: 'Tricky Ones', tables: [6, 7, 8], from: 1, to: 10 },
  { id: 'big', name: 'Big Ones', tables: [9, 11, 12], from: 1, to: 12 },
  { id: 'full', name: 'Everything', tables: range(1, 12), from: 1, to: 12 }
].map(p => Object.assign(p, { label: labelTables(p.tables) }));

// `test` runs on a practice round summary; `story` badges are awarded from story mode instead.
export const BADGES = [
  { id: 'first', icon: '🎒', name: 'First Round', how: 'Finish any practice round', tone: 'accent', test: r => true },
  { id: 'streak10', icon: '🔥', name: 'Hot Streak', how: 'Get 10 right in a row', tone: 'sun', test: r => r.bestStreak >= 10 },
  { id: 'streak25', icon: '☄️', name: 'Comet', how: 'Get 25 right in a row', tone: 'rose', test: r => r.bestStreak >= 25 },
  { id: 'sharp', icon: '🎯', name: 'Sharpshooter', how: '15 or more right with zero misses', tone: 'blue', test: r => r.correct >= 15 && r.wrong === 0 },
  { id: 'lightning', icon: '⚡', name: 'Lightning', how: 'Average under 2 seconds (10+ right)', tone: 'sun', test: r => r.correct >= 10 && r.avgRaw < 2 },
  { id: 'sevens', icon: '🦖', name: 'Seven Slayer', how: 'Answer 10 sevens facts in one round', tone: 'accent', test: r => r.sevens >= 10 },
  { id: 'thousand', icon: '🏆', name: 'Grand Score', how: 'Score 1,000 in one round', tone: 'sun', test: r => r.score >= 1000 },
  { id: 'crown', icon: '👑', name: 'Full House', how: '3 stars on all 12 tables, ×1–12', tone: 'rose', test: r => r.stars === 3 && r.fullSet },
  { id: 'reader', icon: '📖', name: 'First Story', how: 'Finish any story', tone: 'blue', story: true },
  { id: 'bookworm', icon: '📚', name: 'Bookworm', how: 'Finish every story', tone: 'rose', story: true }
];

export const CHEERS = ['Nice!', 'Correct!', 'Yes!', 'Well done.', 'Lovely.'];
export const FAST_CHEERS = ['Quick!', 'Speedy!', 'So fast!'];
export const HOME_LINES = ["Hi, I'm Kazu. Tap me for tips!", 'Stories have no timer. Take your time.', 'Stuck in a story? Ask for a hint.', 'Fast practice answers earn bonus points.', 'The cheat sheet is there whenever you need it.'];
