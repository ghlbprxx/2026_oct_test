// Reactive UI state + the current run (S.g). The profile (best, lessons, mute) persists via save.js.
import { reactive } from 'vue';
import { loadProfile, saveProfile } from '../save.js';

const profile = loadProfile();
export const ui = reactive({ screen: 'title', sheet: null, modal: null, notebook: false, nbTab: 'guide', nbStage: 'agar', paused: false, autoPaused: false,
  toasts: [], floats: [], muted: profile.muted, best: profile.best, lessons: profile.lessons, newBest: false });
export const S = reactive({ g: null });
export function persist() { saveProfile({ best: ui.best, lessons: ui.lessons, muted: ui.muted }); }
