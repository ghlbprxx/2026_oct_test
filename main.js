// Wiring: data + core game state → Vue UI, Three.js render layer, and the frame loop.
import { createApp, reactive } from 'vue';
import { PARAMS, GROUPS } from './data/params.js';
import { TARGETS } from './data/targets.js';
import { CONFIG } from './data/config.js';
import { createStorage } from './core/storage.js';
import { createGame } from './core/game.js';
import { createRenderLayer } from './render/index.js';
import App from './ui/App.js';

function showError(err) {
  const el = document.getElementById('error-overlay');
  el.hidden = false;
  el.innerHTML = '<h2>Something went wrong</h2><pre></pre><p>Reload the page to try again.</p>';
  el.querySelector('pre').textContent = String(err && err.stack ? err.stack : err);
  console.error(err);
}
window.addEventListener('error', (e) => showError(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => showError(e.reason));

const storage = createStorage(CONFIG.storageKey);
const game = createGame({ registry: PARAMS, targets: TARGETS, config: CONFIG, storage, wrap: reactive });

const app = createApp(App);
app.provide('game', game);
app.provide('groups', GROUPS);
app.config.errorHandler = showError;
app.mount('#app');

let renderLayer;
try {
  renderLayer = createRenderLayer(document.getElementById('viewport'), game, CONFIG);
} catch (err) {
  showError(new Error(`3D view could not start (is WebGL available?)\n${err.message}`));
}

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
  if (e.code === 'Space') { e.preventDefault(); game.togglePause(); }
  else if (e.key === '.') game.frameStep();
  else if (e.key === 'g' || e.key === 'G') game.toggleGhost();
  else if (e.key === 'f' || e.key === 'F') game.toggleFloor();
  else if (e.key === 'j' || e.key === 'J') game.toggleMarkers();
  else if (e.key === 't' || e.key === 'T') game.toggleTrails();
  else if (e.key === 'm' || e.key === 'M') game.toggleReference();
});

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  game.tick(dt);
  if (renderLayer) renderLayer.frame(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.__wtwBooted = true;
// Handy for debugging in the console.
window.walkThisWay = { game, renderLayer };
