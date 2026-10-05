// Art and audio published next to the page. Anything missing falls back to drawn art, synth tones or silence.
const { reactive } = Vue;

export const ART = { scene: 'art/scene.webp', idle: 'art/kazu-idle.webp', happy: 'art/kazu-happy.webp', shock: 'art/kazu-shock.webp', cheer: 'art/kazu-cheer.webp' };

// Leave a path blank to use the built-in synth sound (effects) or silence (music).
export const AUDIO = {
  music: { menu: 'audio/menu.mp3', play: 'audio/play.mp3', results: 'audio/results.mp3' },
  sfx: { tap: 'audio/tap.mp3', count: 'audio/count.mp3', go: 'audio/go.mp3', correct: 'audio/correct.mp3', fast: 'audio/fast.mp3', combo: 'audio/combo.mp3', wrong: 'audio/wrong.mp3', end: 'audio/end.mp3' }
};

// which art files actually loaded
export const artOk = reactive({});
Object.keys(ART).forEach(k => { if (!ART[k]) return; const im = new Image(); im.onload = () => { artOk[k] = true; }; im.src = ART[k]; });
