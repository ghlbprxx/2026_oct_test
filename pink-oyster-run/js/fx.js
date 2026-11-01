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

/* ===== GSAP motion (optional) =====
 * GSAP loads lazily from the CDN (import map: "gsap"). If it fails, every function below is a no-op and the game
 * still works with its CSS feedback. All motion is skipped when CONFIG.dev.juice is off or reduced motion is on. */
import { nextTick } from 'vue';
let gsap = null;
export const gsapReady = import('gsap').then(m => { gsap = m.gsap || m.default; }).catch(e => console.info('GSAP unavailable, using CSS-only feedback:', e.message));
const motion = () => !!gsap && CONFIG.dev.juice && !reduceMotion();
const artOf = i => document.querySelector(`[data-slot="${i}"] .art`);

/** Growth stage reached (colonized, pins, peak): springy pop. */
export function pop(i) { if (!motion()) return; const el = artOf(i); if (el) gsap.fromTo(el, { scale: 0.82 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' }); }
/** A new vessel lands on a spot. */
export function placed(i) {
  if (!motion()) return;
  nextTick(() => { const el = artOf(i); if (el) gsap.fromTo(el, { y: -40, scale: 0.7, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'bounce.out', clearProps: 'all' }); });
}
/** Carry a vessel from one spot to another (a fixed-position clone flies over the zone walls). */
export function moved(from, to) {
  if (!motion()) return;
  const src = artOf(from); if (!src) return;
  const r0 = src.getBoundingClientRect(), ghost = src.cloneNode(true);
  ghost.classList.add('fly-ghost');
  Object.assign(ghost.style, { position: 'fixed', left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px', zIndex: 70, pointerEvents: 'none', margin: 0 });
  document.body.appendChild(ghost);
  nextTick(() => {
    const dst = artOf(to); if (!dst) { ghost.remove(); return; }
    const r1 = dst.getBoundingClientRect(); dst.style.opacity = '0';
    gsap.timeline({ onComplete: () => { ghost.remove(); dst.style.opacity = ''; pop(to); } })
      .to(ghost, { y: -30, duration: 0.18, ease: 'power2.out' })
      .to(ghost, { left: r1.left, top: r1.top, width: r1.width, height: r1.height, y: 0, duration: 0.55, ease: 'power3.inOut' });
  });
}
/** Harvest: the cluster dips as it's picked, then springs back. */
export function pluck(i) { if (!motion()) return; const el = artOf(i); if (el) gsap.fromTo(el, { scale: 1 }, { keyframes: [{ scale: 0.86, duration: 0.12 }, { scale: 1.05, duration: 0.18 }, { scale: 1, duration: 0.25 }], ease: 'power2.out', clearProps: 'transform' }); }
/** Mold found: the zone flashes red. */
export function zoneAlarm(zone) {
  if (!motion()) return;
  const el = document.querySelector(`.zone[data-zone="${zone}"]`);
  if (el) gsap.fromTo(el, { boxShadow: '0 0 0 0 rgba(192,57,43,0)' }, { boxShadow: '0 0 0 6px rgba(192,57,43,.7)', duration: 0.25, yoyo: true, repeat: 3, clearProps: 'boxShadow' });
}
/** Money in or out: the HUD cash bumps and a +$/−$ floats off it. */
export function cash(delta) {
  const el = document.querySelector('.hs.cash'); if (!el || !CONFIG.dev.juice) return;
  const r = el.getBoundingClientRect(), id = ++seq;
  ui.floats.push({ id, kind: 't', x: r.left + r.width / 2, y: r.bottom + 34, text: (delta >= 0 ? '+$' : '−$') + Math.abs(delta).toFixed(Math.abs(delta) < 100 ? 2 : 0), c: delta >= 0 ? 'good' : 'bad' });
  setTimeout(() => drop(ui.floats, id), 1150);
  if (motion()) gsap.fromTo(el.querySelector('b'), { scale: 1.3, color: delta >= 0 ? 'var(--good)' : 'var(--bad)' }, { scale: 1, color: 'var(--ink)', duration: 0.6, ease: 'elastic.out(1,0.4)', clearProps: 'all' });
}
/** Week card and other sheets: lines slide in one by one. */
export function revealCard() {
  if (!motion()) return;
  nextTick(() => {
    const lines = document.querySelectorAll('.sheet .weeklines li, .sheet h3, .sheet .rc');
    if (lines.length) gsap.from(lines, { opacity: 0, y: 14, duration: 0.4, stagger: 0.12, ease: 'power2.out', clearProps: 'all' });
  });
}
/** Entering the house: zones rise in, one after another. */
export function enterHouse() {
  if (!motion()) return;
  nextTick(() => { const z = document.querySelectorAll('.house .zone'); if (z.length) gsap.from(z, { opacity: 0, y: 24, duration: 0.5, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }); });
}
/** Bought gear: the shop card pops and its icon spins once. */
export function bought(id) {
  if (!motion()) return;
  const el = document.querySelector(`.item[data-item="${id}"]`); if (!el) return;
  gsap.fromTo(el, { scale: 0.95 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' });
  const img = el.querySelector('img'); if (img) gsap.fromTo(img, { rotate: -20, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.6, ease: 'back.out(2.5)', clearProps: 'transform' });
}
