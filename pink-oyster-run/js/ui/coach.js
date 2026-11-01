// Week 0 tutorial controller: tracks the current step, finds the element to highlight, and advances
// action steps when the game state matches. Game time stays paused while ui.tut is set (see main.js).
import { ui, S, persist } from './state.js';
import { TUTORIAL, stepDone } from '../content/tutorial.js';
import { zoneOf } from '../sim/zones.js';
import { play } from '../audio.js';
import { toast } from '../fx.js';

export const tutStep = () => (ui.tut ? TUTORIAL[ui.tut.k] : null);
export function startTutorial() { ui.tut = { k: 0, scrolled: -1 }; }
export function finishTutorial(skipped = false) {
  if (!ui.tut) return;
  ui.tut = null; ui.coach = null; ui.tutorialDone = true; persist();
  if (!skipped) play('good');
  toast(skipped ? 'Tutorial skipped. The clock is running: week 0, agar.' : 'Tutorial done. The clock is running: week 0, agar.', 'good');
}
export function nextStep() {
  if (!ui.tut) return;
  if (ui.tut.k >= TUTORIAL.length - 1) return finishTutorial();
  ui.tut.k++; play('tap');
}

/** "@plate" → the first plate not yet in the closet. */
function resolve(sel, g) {
  if (sel !== '@plate') return sel;
  const i = g.slots.findIndex((v, k) => v && v.kind === 'plate' && zoneOf(k) !== 'closet');
  return i >= 0 ? `[data-slot="${i}"]` : null;
}
function visible(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; }

/** Called every frame: auto-advance finished action steps, and place the highlight ring. */
export function tickCoach() {
  const g = S.g, st = tutStep();
  if (!st || !g || ui.screen !== 'play') { if (ui.coach) ui.coach = null; return; }
  if (ui.modal) { if (ui.coach) ui.coach = null; return; } // wait for scene/week cards to close
  if (stepDone(ui.tut.k, g)) { ui.coach = null; return nextStep(); }
  const overlay = !!(ui.sheet || ui.shop || ui.notebook);
  let rect = null, el = null;
  for (const raw of st.targets) {
    const sel = resolve(raw, g); if (!sel) continue;
    el = document.querySelector(sel); rect = el && visible(el);
    if (rect) break;
  }
  if (rect && !overlay && ui.tut.scrolled !== ui.tut.k) { // bring the target into view once per step
    ui.tut.scrolled = ui.tut.k;
    if (rect.top < 60 || rect.bottom > innerHeight - 160) el.scrollIntoView({ block: 'center' });
  }
  const pad = 6, ring = rect ? { x: rect.left - pad, y: rect.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 } : null;
  // put the card on whichever side the target leaves free; if neither, scroll the target clear once
  const card = document.querySelector('.coach'), need = (card ? card.offsetHeight : 180) + 24;
  let top;
  if (!ring) top = overlay;
  else if (ring.y + ring.h <= innerHeight - need) top = false;
  else if (ring.y >= need) top = true;
  else {
    if (ui.tut.fit !== ui.tut.k && ring.h < innerHeight - need * 1.2) { ui.tut.fit = ui.tut.k; el.scrollIntoView({ block: 'end' }); }
    top = ring.y + ring.h / 2 > innerHeight / 2;
  }
  const c = ui.coach;
  if (!c || c.k !== ui.tut.k || c.top !== top || !same(c.ring, ring)) ui.coach = { k: ui.tut.k, top, ring };
}
const same = (a, b) => (!a && !b) || (a && b && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1);
