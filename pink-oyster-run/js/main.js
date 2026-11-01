// Boot: wire config into the sim, sim events into UI feedback, mount Vue, run the loop, handle input.
import { createApp } from 'vue';
import { CONFIG, ISF } from './config.js';
import { setConfig } from './sim/cfg.js';
import { on } from './sim/events.js';
import * as sim from './sim/game.js';
import { gameDaysFor } from './sim/clock.js';
import { allEnvs } from './sim/zones.js';
import { canShake } from './sim/growth.js';
import { ui, S, persist, showModal, nextModal } from './ui/state.js';
import { App, start, tapSlot, setHeater, toggleMute, dryAll, weekModal, speedUp, speedDown, openShop, SPOT_KEYS } from './ui/app.js';
import { unlocked } from './sim/stages.js';
import { loadManifest, manifest } from './images.js';
import { play, unlock, setMuted } from './audio.js';
import { toast, float, burst, wobble, pop, placed, moved, pluck, zoneAlarm, cash, revealCard, enterHouse, bought } from './fx.js';
import { watch } from 'vue';
import { zoneOf } from './sim/zones.js';
import { LESSONS } from './content/lessons.js';

setConfig(CONFIG);
setMuted(ui.muted);
loadManifest();

/* ---------- sim events -> feedback ---------- */
on((type, d) => {
  switch (type) {
    case 'toast': toast(d.text, d.c); break;
    case 'sfx': play(d.name); break;
    case 'float': float(d.slot, d.text, d.c); if (d.c !== 'bad') pop(d.slot); break;
    case 'burst': burst(d.slot); pluck(d.slot); break;
    case 'wobble': wobble(d.slot); zoneAlarm(zoneOf(d.slot)); break;
    case 'placed': placed(d.slot); break;
    case 'moved': moved(d.from, d.to); break;
    case 'cash': cash(d.delta); break;
    case 'bought': bought(d.id); break;
    case 'track': ISF.track(d.type, d.data); break;
    case 'quiz': showModal({ type: 'quiz', m: d.m, ans: null }); break;
    case 'coffee': showModal({ type: 'coffee' }); break;
    case 'week': { const m = weekModal(d.week); if (m) showModal(m); else toast(`Week ${d.week} begins.`); break; }
    case 'lesson': {
      const first = !ui.lessons[d.id];
      if (first) { ui.lessons[d.id] = true; persist(); }
      const L = LESSONS[d.id];
      toast(L.fix, 'lesson', (L.good ? '✓ ' : '') + L.title + (first ? ' · new lesson' : ''));
      break;
    }
    case 'end': {
      ui.newBest = ui.best == null || d.profit > ui.best;
      if (ui.newBest) { ui.best = d.profit; persist(); }
      ui.sheet = null; ui.modal = null; ui.modalQueue = []; ui.paused = false; ui.screen = 'report'; window.scrollTo({ top: 0 });
      break;
    }
  }
});

createApp(App).mount('#app');
watch(() => ui.modal, m => { if (m && m.type === 'week') revealCard(); });
watch(() => ui.screen, s => { if (s === 'play') enterHouse(); });
window.__porBooted = true;

/* ---------- loop ---------- */
const menuPause = () => ui.notebook || !!ui.modal || !!ui.sheet || ui.shop;
let last = performance.now();
function frame(now) {
  const raw = (now - last) / 1000; last = now;
  if (ui.screen === 'play' && S.g) sim.update(S.g, gameDaysFor(raw, ui.paused || ui.autoPaused || menuPause(), ui.speed));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- lifecycle + input ---------- */
const autoPause = () => { if (ui.screen === 'play') ui.autoPaused = true; };
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
window.addEventListener('blur', autoPause);
window.addEventListener('pointerdown', () => unlock(), { capture: true });
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (e.key === 'Escape') { if (ui.sheet) ui.sheet = null; else if (ui.shop) ui.shop = false; else if (ui.notebook) ui.notebook = false; else if (ui.modal && ((ui.modal.type === 'quiz' && ui.modal.ans !== null) || ui.modal.type === 'week')) nextModal(); return; }
  if (ui.screen !== 'play' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  if (e.key === ' ') { e.preventDefault(); if (ui.autoPaused) { ui.autoPaused = false; ui.paused = false; } else ui.paused = !ui.paused; return; }
  if (ui.modal || ui.sheet || ui.notebook || ui.shop) return;
  const n = SPOT_KEYS.indexOf(e.key);
  if (n >= 0 && n < S.g.slots.length) { e.preventDefault(); tapSlot(n); return; }
  const k = e.key.toLowerCase();
  if (e.key === ']') speedUp(); else if (e.key === '[') speedDown(); else if (k === 'd') dryAll(); else if (k === 'h' && S.g.gear.heatmat) setHeater((S.g.heater + 1) % 3); else if (k === 's') openShop(); else if (k === 'n') ui.notebook = true; else if (k === 'm') toggleMute();
});

/* ---------- admin hooks ---------- */
ISF.onRestart(() => { if (ui.screen !== 'title') start(); });
ISF.action('Skip to week end', () => { if (S.g && ui.screen === 'play') { const end = (S.g.week + 1) * 5 - 0.001; while (S.g.day < end && !S.g.over) sim.update(S.g, Math.min(0.05, end - S.g.day)); } });
ISF.action('Mold on a shelf', () => { const v = S.g && S.g.slots.find(x => x && x.state !== 'lost' && x.contam.onset == null); if (v) { v.contam.onset = S.g.day - 99; v.contam.why = 'luck'; } });
ISF.action('+$500', () => { if (S.g) S.g.cash += 500; });
ISF.action('Image check', () => { const miss = manifest.images.filter(m => manifest.status[m.id] !== 'loaded').map(m => m.file); console.table(manifest.images.map(m => ({ id: m.id, file: m.file, status: manifest.status[m.id] }))); toast(`${manifest.images.length - miss.length}/${manifest.images.length} custom images found. Details in the Notebook > Art tab.`); });

// Debug/test handle (devtools, Playwright bots). Not used by the game itself.
window.POR = { S, ui, CONFIG, ISF, sim, start, allEnvs, canShake, manifest };
