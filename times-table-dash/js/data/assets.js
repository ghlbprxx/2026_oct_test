// Art and audio published next to the page. Anything missing falls back to drawn art, synth tones or silence.
const { reactive } = Vue;

export const ART = { scene: 'art/scene.webp', idle: 'art/kazu-idle.webp', happy: 'art/kazu-happy.webp', shock: 'art/kazu-shock.webp', cheer: 'art/kazu-cheer.webp' };

// Leave a path blank to use the built-in synth sound (effects) or silence (music).
export const AUDIO = {
  music: { menu: 'audio/menu.mp3', play: 'audio/play.mp3', results: 'audio/results.mp3' },
  sfx: { tap: 'audio/tap.mp3', count: 'audio/count.mp3', go: 'audio/go.mp3', correct: 'audio/correct.mp3', fast: 'audio/fast.mp3', combo: 'audio/combo.mp3', wrong: 'audio/wrong.mp3', end: 'audio/end.mp3' },
  // story-mode sounds, loaded the first time a story opens; each has a chiptune synth fallback
  storySfx: { blip: 'audio/story/text-blip.mp3', start: 'audio/story/chapter-start.mp3', hit: 'audio/story/hit.mp3', clear: 'audio/story/victory.mp3', lose: 'audio/story/defeat.mp3' }
};

// which art files actually loaded
export const artOk = reactive({});
Object.keys(ART).forEach(k => { if (!ART[k]) return; const im = new Image(); im.onload = () => { artOk[k] = true; }; im.src = ART[k]; });

// Optional images with fallbacks: preloadArt(['a.webp', 'b.webp']) tries each path in order;
// artFor(paths) returns the first that loaded, or null (the caller then draws its own fallback).
const artCache = reactive({});
const keyOf = (paths) => paths.join('|');
export function preloadArt(paths) {
  const k = keyOf(paths);
  if (k in artCache) return;
  artCache[k] = null;
  const tryAt = (i) => {
    if (i >= paths.length) return;
    const im = new Image();
    im.onload = () => { artCache[k] = paths[i]; };
    im.onerror = () => tryAt(i + 1);
    im.src = paths[i];
  };
  tryAt(0);
}
export const artFor = (paths) => artCache[keyOf(paths)] || null;
