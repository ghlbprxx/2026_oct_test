// Sound effects (recorded, with soft synth fallbacks) and looping background music with long crossfades.
// Audio starts only after the first tap or key press, as browsers require.
import { AUDIO } from '../data/assets.js';
import { store } from './util.js';
import { view, game, sound, music, storyTrack } from './state.js';
const { computed, watch } = Vue;

const HAS_MUSIC = Object.values(AUDIO.music).some(Boolean);
const MUSIC_VOL = 0.22;
const SFX_VOL = 0.55;
export const hasMusic = HAS_MUSIC;

let actx = null;
export function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (actx.state === 'suspended') actx.resume().catch(() => {});
  return actx;
}
function tone(freq, dur, type, vol, when) {
  if (!sound.value) return;
  const c = audio(); if (!c) return;
  const t = c.currentTime + (when || 0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol || 0.09, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
}
// recorded effects (decoded once), falling back to soft synth tones
const sfxBuf = {}, sfxLoaded = new Set();
function loadSfx(group) {
  if (sfxLoaded.has(group)) return; const c = audio(); if (!c) return; sfxLoaded.add(group);
  Object.keys(AUDIO[group]).forEach(k => {
    const src = AUDIO[group][k]; if (!src) return;
    fetch(src).then(r => { if (!r.ok) throw new Error(src); return r.arrayBuffer(); })
      .then(b => new Promise((res, rej) => c.decodeAudioData(b, res, rej)))
      .then(buf => { sfxBuf[k] = buf; }).catch(() => {});
  });
}
function playBuf(k, rate) {
  const b = sfxBuf[k]; if (!b) return false;
  const c = audio(); if (!c) return false;
  const src = c.createBufferSource(), g = c.createGain();
  src.buffer = b; src.playbackRate.value = rate || 1; g.gain.value = SFX_VOL;
  src.connect(g); g.connect(c.destination); src.start();
  return true;
}
function fxPlay(name, rate, synth) { if (!sound.value) return; if (!playBuf(name, rate)) synth(); }
export const sfx = {
  correct(fast) { fxPlay(fast && sfxBuf.fast ? 'fast' : 'correct', 1, () => { tone(523, 0.16, 'sine'); tone(784, 0.2, 'sine', 0.06, 0.08); }); },
  wrong() { fxPlay('wrong', 1, () => tone(262, 0.28, 'sine', 0.07)); },
  tick() { fxPlay('tap', 1, () => tone(660, 0.08, 'sine', 0.06)); },
  count() { fxPlay('count', 1, () => tone(587, 0.1, 'sine', 0.07)); },
  go() { fxPlay('go', 1, () => tone(784, 0.22, 'sine', 0.09)); },
  combo() { fxPlay('combo', 1, () => [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'sine', 0.07, i * 0.09))); },
  end() { fxPlay('end', 1, () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 'sine', 0.07, i * 0.12))); },
  // story mode: soft square-wave chiptune fallbacks
  blip() { fxPlay('blip', 1, () => tone(1046, 0.035, 'square', 0.012)); },
  start() { fxPlay('start', 1, () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.12, 'square', 0.025, i * 0.08))); },
  item() { fxPlay('item', 1, () => [784, 988, 1319].forEach((f, i) => tone(f, 0.1, 'square', 0.025, i * 0.07))); },
  clear() { fxPlay('clear', 1, () => [523, 659, 784, 1047, 0, 784, 1047].forEach((f, i) => f && tone(f, i === 6 ? 0.5 : 0.14, 'square', 0.025, i * 0.12))); }
};
export function loadStorySounds() { if (unlocked) loadSfx('storySfx'); }
export function toggleSound() { sound.value = !sound.value; store.set('ttd.sound', sound.value); unlockAudio(); if (sound.value) sfx.tick(); }

// ---------- background music (decoded buffers loop gaplessly, long crossfades) ----------
const musicBuf = {}, musicState = {}, offsets = {};
let cur = null, pendingK = null, resultsTimer = 0, unlocked = false;
function loopBounds(buf) {
  const d = buf.getChannelData(0); let a = 0, b = d.length - 1;
  while (a < d.length && Math.abs(d[a]) < 1e-4) a++;
  while (b > a && Math.abs(d[b]) < 1e-4) b--;
  return [a / buf.sampleRate, (b + 1) / buf.sampleRate];
}
const trackSrc = (k) => k.startsWith('story:') ? k.slice(6) : AUDIO.music[k];
function loadMusic(k) {
  if (!trackSrc(k) || musicState[k]) return;
  const c = audio(); if (!c) return;
  musicState[k] = 'loading';
  fetch(trackSrc(k)).then(r => { if (!r.ok) throw new Error(k); return r.arrayBuffer(); })
    .then(b => new Promise((res, rej) => c.decodeAudioData(b, res, rej)))
    .then(buf => { musicBuf[k] = { buf, bounds: loopBounds(buf) }; musicState[k] = 'ok'; syncMusic(); })
    .catch(() => { musicState[k] = 'bad'; syncMusic(); });
}
// first track in the list that isn't known to be missing; story tracks load on demand
function resolveTrack(want) {
  const order = want.startsWith('story:') ? [want, 'menu'] : ({ results: ['results', 'menu'], play: ['play'], menu: ['menu'] }[want] || []);
  for (const k of order) {
    if (!trackSrc(k) || musicState[k] === 'bad') continue;
    if (!musicState[k]) loadMusic(k);
    return k;
  }
  return null;
}
const wantMusic = computed(() => {
  if (view.value === 'play') return 'play';
  if (view.value === 'over') return 'results';
  if (view.value === 'story' && storyTrack.value) return 'story:' + storyTrack.value;
  return 'menu';
});
function rampGain(g, v, sec) { const c = audio(), now = c.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(v, now + sec); }
function startTrack(k) {
  const c = audio(), m = musicBuf[k], len = m.bounds[1] - m.bounds[0];
  const src = c.createBufferSource(), g = c.createGain();
  src.buffer = m.buf; src.loop = true; src.loopStart = m.bounds[0]; src.loopEnd = m.bounds[1];
  g.gain.value = 0; src.connect(g); g.connect(c.destination);
  const off = (offsets[k] || 0) % len;
  src.start(0, m.bounds[0] + off);
  return { k, src, g, startedAt: c.currentTime, off, len };
}
function stopCur() {
  const c = audio(), t = cur; cur = null;
  if (t.k === 'menu' || t.k === 'play') offsets[t.k] = (t.off + (c.currentTime - t.startedAt)) % t.len;
  rampGain(t.g.gain, 0, 1.2);
  try { t.src.stop(c.currentTime + 1.25); } catch (e) { /* already stopped */ }
}
function applyLevel() {
  if (!cur) return;
  const quiet = (view.value === 'play' && game.phase === 'paused') || (view.value === 'story' && cur.k === 'menu');
  rampGain(cur.g.gain, quiet ? MUSIC_VOL * 0.45 : MUSIC_VOL, 1.2);
}
export function syncMusic() {
  if (!HAS_MUSIC || !unlocked) return;
  const k = music.value && !document.hidden ? resolveTrack(wantMusic.value) : null;
  if (k && musicState[k] === 'loading') { applyLevel(); return; } // keep the current track until this one is ready
  const target = k && musicState[k] === 'ok' ? k : null;
  if ((cur ? cur.k : pendingK) !== target) {
    if (cur) stopCur();
    clearTimeout(resultsTimer); pendingK = null;
    if (target === 'results' && sound.value) {
      // let the end-of-round chime finish before the results theme comes in
      pendingK = 'results';
      resultsTimer = setTimeout(() => { pendingK = null; if (!cur) { cur = startTrack('results'); applyLevel(); } }, 2400);
    } else if (target) cur = startTrack(target);
  }
  applyLevel();
}
export function unlockAudio() { if (unlocked) return; unlocked = true; audio(); loadSfx('sfx'); Object.keys(AUDIO.music).forEach(loadMusic); if (view.value === 'story') loadSfx('storySfx'); syncMusic(); }
export function toggleMusic() { music.value = !music.value; store.set('ttd.music', music.value); unlockAudio(); syncMusic(); }

watch([view, music, storyTrack, () => game.phase], () => syncMusic());
