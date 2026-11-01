// Sound effects: WebAudio synth (no files). The first pointer/key press unlocks the AudioContext.
import { CONFIG } from './config.js';

let ac = null, muted = false;
export function setMuted(m) { muted = !!m; }
export function unlock() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') ac.resume(); }
const on = () => ac && !muted && CONFIG.dev.juice && CONFIG.look.sfxVolume > 0;
function tone(fr, dur = 0.12, type = 'sine', vol = 1, slide = 0, delay = 0) {
  if (!on()) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain(), p = fr * (1 + (Math.random() - 0.5) * 0.1);
  o.type = type; o.frequency.setValueAtTime(p, t); if (slide) o.frequency.exponentialRampToValueAtTime(p * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.22 * vol * CONFIG.look.sfxVolume), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur = 0.4, vol = 0.5, freq = 1800) {
  if (!on()) return;
  const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = buf; fl.type = 'bandpass'; fl.frequency.value = freq;
  g.gain.value = 0.25 * vol * CONFIG.look.sfxVolume; s.connect(fl).connect(g).connect(ac.destination); s.start();
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
export function play(name) { const f = SFX[name]; if (f) f(); }
