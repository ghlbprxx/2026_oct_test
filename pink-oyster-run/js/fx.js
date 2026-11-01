// Visual feedback: toasts, floating text, spore bursts, card wobble. Floats/bursts/wobble are skipped
// when CONFIG.dev.juice is off or the player prefers reduced motion.
import { CONFIG } from './config.js';
import { ui } from './ui/state.js';

let seq = 0;
export const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const drop = (list, id) => { const k = list.findIndex(x => x.id === id); if (k >= 0) list.splice(k, 1); };
export function toast(text, c = '', title = '') {
  const id = ++seq; ui.toasts.push({ id, text, c, title }); if (ui.toasts.length > 3) ui.toasts.shift();
  setTimeout(() => drop(ui.toasts, id), title ? 5200 : 3400);
}
function slotRect(i) { const el = document.querySelector(`[data-slot="${i}"]`); return el ? el.getBoundingClientRect() : null; }
export function float(i, text, c = '') {
  if (!CONFIG.dev.juice) return;
  const r = slotRect(i); if (!r) return; const id = ++seq;
  ui.floats.push({ id, kind: 't', x: r.left + r.width / 2, y: r.top + r.height * 0.4, text, c });
  setTimeout(() => drop(ui.floats, id), 1150);
}
export function burst(i) {
  if (!CONFIG.dev.juice || reduceMotion()) return;
  const r = slotRect(i); if (!r) return;
  for (let k = 0; k < 9; k++) { const id = ++seq, a = k / 9 * 6.283; ui.floats.push({ id, kind: 'p', x: r.left + r.width / 2, y: r.top + r.height * 0.45, dx: Math.cos(a) * 60, dy: Math.sin(a) * 60 - 20 }); setTimeout(() => drop(ui.floats, id), 750); }
}
export function wobble(i) {
  if (!CONFIG.dev.juice || reduceMotion()) return;
  const el = document.querySelector(`[data-slot="${i}"]`); if (!el) return;
  el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble');
}
