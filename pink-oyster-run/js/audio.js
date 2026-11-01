// Audio: optional files from assets/audio/audio-manifest.json, with fallbacks.
// - Sound effects: a file if the manifest lists one and it loads, else the WebAudio synth below.
// - Music (title / farm loop / review sting) and voice lines: files only; missing means silence.
// Three buses with their own volume (Music / SFX / Voice, saved in the profile), all behind Mute.
// The first pointer/key press unlocks the AudioContext; files are fetched then (voice lines on demand).
import { reactive } from 'vue';
import { CONFIG } from './config.js';

let ac = null, muted = false, bus = null;
const vol = { music: 0.5, sfx: 1, voice: 1 };
export const audioStatus = reactive({ source: 'not loaded', sfx: {}, music: {}, voice: {}, voiceTotal: 0, voiceChecked: 0 });
const files = { sfx: {}, music: {}, voice: {} };   // id -> url
const buffers = {};                                // url -> AudioBuffer | 'missing' | Promise

export function setMuted(m) { muted = !!m; applyVolumes(); }
export function setVolumes(v) { Object.assign(vol, v); applyVolumes(); }
export const volumes = () => ({ ...vol });
function applyVolumes() {
  if (!bus) return;
  bus.music.gain.value = muted ? 0 : vol.music * 0.6;
  bus.sfx.gain.value = muted ? 0 : vol.sfx;
  bus.voice.gain.value = muted ? 0 : vol.voice;
}
export function unlock() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    bus = { music: ac.createGain(), sfx: ac.createGain(), voice: ac.createGain() };
    Object.values(bus).forEach(g => g.connect(ac.destination)); applyVolumes();
    preload();
  }
  if (ac.state === 'suspended') ac.resume();
}

/* ---------- manifest + loading ---------- */
let manifestLoaded = false;
export async function loadAudioManifest(url = 'assets/audio/audio-manifest.json') {
  try {
    const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status);
    const m = await r.json();
    for (const s of m.sfx || []) { files.sfx[s.id] = s.file; audioStatus.sfx[s.id] = 'unchecked'; }
    for (const s of m.music || []) { files.music[s.id] = s.file; audioStatus.music[s.id] = 'unchecked'; }
    if (m.voiceLines) {
      const v = await (await fetch(m.voiceLines, { cache: 'no-cache' })).json();
      for (const l of v.lines || []) files.voice[l.id] = l.file;
      audioStatus.voiceTotal = (v.lines || []).length;
    }
    audioStatus.source = url; manifestLoaded = true;
    if (ac) preload();
  } catch (e) { audioStatus.source = `could not load ${url} (${e.message}); synth sound only`; console.info('Audio manifest unavailable, synth only:', e.message); }
}
function load(url) {
  if (buffers[url]) return buffers[url];
  return (buffers[url] = fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then(ab => new Promise((ok, no) => ac.decodeAudioData(ab, ok, no)))
    .then(b => (buffers[url] = b), () => (buffers[url] = 'missing')));
}
function preload() {
  if (!manifestLoaded || !ac) return;
  for (const kind of ['sfx', 'music']) for (const [id, url] of Object.entries(files[kind])) {
    if (audioStatus[kind][id] !== 'unchecked') continue;
    audioStatus[kind][id] = 'checking';
    Promise.resolve(load(url)).then(b => { audioStatus[kind][id] = b === 'missing' ? 'missing' : 'loaded'; if (kind === 'music' && b !== 'missing' && wantMusic === id) startMusic(id); });
  }
}
const ready = url => { const b = buffers[url]; return b && b !== 'missing' && !(b instanceof Promise) ? b : null; };
function playBuffer(b, out, { loop = false, gain = 1 } = {}) {
  const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; s.loop = loop; g.gain.value = gain;
  s.connect(g).connect(out); s.start(); return { s, g };
}

/* ---------- sound effects ---------- */
const on = () => ac && !muted && CONFIG.dev.juice && CONFIG.look.sfxVolume > 0 && vol.sfx > 0;
function tone(fr, dur = 0.12, type = 'sine', v = 1, slide = 0, delay = 0) {
  if (!on()) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain(), p = fr * (1 + (Math.random() - 0.5) * 0.1);
  o.type = type; o.frequency.setValueAtTime(p, t); if (slide) o.frequency.exponentialRampToValueAtTime(p * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.22 * v * CONFIG.look.sfxVolume), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus.sfx); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur = 0.4, v = 0.5, freq = 1800) {
  if (!on()) return;
  const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = buf; fl.type = 'bandpass'; fl.frequency.value = freq;
  g.gain.value = 0.25 * v * CONFIG.look.sfxVolume; s.connect(fl).connect(g).connect(bus.sfx); s.start();
}
export const SFX = {
  tap: () => tone(520, 0.06, 'triangle', 0.5),
  build: () => { tone(440, 0.08, 'triangle', 0.6); tone(660, 0.08, 'triangle', 0.5, 0, 0.06); },
  harvest: () => { tone(620, 0.1, 'sine', 1, 1.5); tone(930, 0.14, 'sine', 0.8, 0, 0.07); },
  coin: () => { tone(988, 0.08, 'square', 0.35); tone(1319, 0.18, 'square', 0.35, 0, 0.08); },
  mold: () => { tone(160, 0.35, 'sawtooth', 0.5, 0.7); },
  bad: () => tone(230, 0.25, 'square', 0.3, 0.6),
  good: () => { tone(523, 0.1, 'sine', 0.6); tone(784, 0.16, 'sine', 0.6, 0, 0.08); },
  hiss: () => noise(0.6, 0.6, 2400),
  shake: () => { for (let i = 0; i < 5; i++) tone(300 + i * 40, 0.04, 'square', 0.25, 0, i * 0.05); },
  pop: () => tone(880, 0.07, 'sine', 0.5, 1.3),
  sale: () => { tone(1175, 0.06, 'triangle', 0.35); tone(1568, 0.12, 'triangle', 0.35, 0, 0.06); },
};
/** Play a sound effect: the file if loaded, else the synth. */
export function play(name) {
  if (!on()) return;
  const b = files.sfx[name] && ready(files.sfx[name]);
  if (b) { playBuffer(b, bus.sfx, { gain: CONFIG.look.sfxVolume }); return; }
  const f = SFX[name]; if (f) f();
}

/* ---------- music ---------- */
let wantMusic = null, current = null;
function startMusic(id) {
  const b = ready(files.music[id]); if (!b) return;
  if (current && current.id === id) return;
  stopMusic(0.8);
  const p = playBuffer(b, bus.music, { loop: true, gain: 0.0001 }); p.g.gain.exponentialRampToValueAtTime(1, ac.currentTime + 1.2);
  current = { id, ...p };
}
function stopMusic(fade = 0.8) {
  if (!current) return; const c = current; current = null;
  try { c.g.gain.setValueAtTime(c.g.gain.value, ac.currentTime); c.g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + fade); c.s.stop(ac.currentTime + fade + 0.05); } catch (e) {}
}
/** Ask for a looping track (or null for silence). Starts when the file is ready; missing files stay silent. */
export function setMusic(id) {
  wantMusic = id;
  if (!ac) return;
  if (!id) return stopMusic();
  if (ready(files.music[id])) startMusic(id);
}
/** One-shot sting over the music (e.g. a stage mastered). */
export function sting(id) { const b = ac && files.music[id] && ready(files.music[id]); if (b && !muted) playBuffer(b, bus.music, { gain: 1.2 }); }

/* ---------- voice ---------- */
let speaking = null, sayQueue = [], gen = 0;
/** Speak a list of line ids in order (replacing whatever is being said). Missing files are skipped silently. */
export function say(ids) {
  sayQueue = (Array.isArray(ids) ? ids : [ids]).filter(Boolean); gen++;
  if (speaking) { try { speaking.s.onended = null; speaking.s.stop(); } catch (e) {} speaking = null; }
  next();
}
function next() {
  if (!ac || muted || !sayQueue.length) return;
  const id = sayQueue.shift(), url = files.voice[id], mine = gen;
  if (!url) return next();
  Promise.resolve(load(url)).then(b => {
    if (mine !== gen) return; // a newer line was requested meanwhile
    if (audioStatus.voice[id] !== (b === 'missing' ? 'missing' : 'loaded')) { audioStatus.voice[id] = b === 'missing' ? 'missing' : 'loaded'; audioStatus.voiceChecked = Object.keys(audioStatus.voice).length; }
    if (b === 'missing' || !b) return next();
    const p = playBuffer(b, bus.voice); speaking = p; p.s.onended = () => { if (speaking === p) { speaking = null; next(); } };
  });
}
export const stopVoice = () => say([]);
