// Grow log + lessons for the current run. Persisting "ever learned" lessons is the UI's job (event 'lesson').
import { emit } from './events.js';
import { LESSONS } from '../content/lessons.js';

export function log(g, t, c = '') { g.log.unshift({ d: Math.floor(g.day) + 1, t, c }); if (g.log.length > 40) g.log.pop(); }
export function learn(g, id) {
  if (!LESSONS[id] || g.learned.includes(id)) return false;
  g.learned.push(id); emit('lesson', { id }); return true;
}
