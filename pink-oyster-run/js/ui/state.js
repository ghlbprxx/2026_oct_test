// Reactive UI state + the current run (S.g). The profile (best, lessons, mute) persists via save.js.
import { reactive } from 'vue';
import { loadProfile, saveProfile } from '../save.js';

const profile = loadProfile();
export const ui = reactive({ screen: 'title', sheet: null, modal: null, notebook: false, nbTab: 'guide', nbStage: 'agar', paused: false, autoPaused: false, speed: 1, modalQueue: [], shop: false, hover: null, saved: null, moreOpts: false, moreGear: false,
  toasts: [], floats: [], muted: profile.muted, best: profile.best, expert: !!profile.expert, playMode: profile.playMode || 'basic', lessons: profile.lessons, newBest: false,
  tutorialDone: !!profile.tutorialDone, runType: profile.tutorialDone ? 'story' : 'tutorial', tut: null, coach: null });
export const S = reactive({ g: null });
/** Modals queue up instead of overwriting each other (e.g. a week card and a market quiz in one tick). */
export function showModal(m) { if (!m) return; if (ui.modal) ui.modalQueue.push(m); else ui.modal = m; }
export function nextModal() { ui.modal = ui.modalQueue.shift() || null; }
export function persist() { saveProfile({ best: ui.best, lessons: ui.lessons, muted: ui.muted, expert: ui.expert, playMode: ui.playMode, tutorialDone: ui.tutorialDone }); }
