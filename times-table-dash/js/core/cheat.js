// Cheat sheet: a 12×12 grid with row/column highlight, cover-to-quiz, and last round's misses marked.
import { range } from './util.js';
import { settings, lastMissed, isLive, go } from './state.js';
import { sfx } from './audio.js';
const { reactive, computed, watch } = Vue;

export const cheat = reactive({ scope: settings.tables.length ? 'mine' : 'all', cover: false, sel: null, hov: null, revealed: {} });
watch(() => cheat.cover, () => { cheat.revealed = {}; cheat.sel = null; });
watch(() => settings.tables.length, n => { if (!n) cheat.scope = 'all'; });
export const cheatRows = computed(() => cheat.scope === 'mine' && settings.tables.length ? [...settings.tables].sort((a, b) => a - b) : range(1, 12));
export const cheatCols = computed(() => cheat.scope === 'mine' ? range(settings.from, settings.to) : range(1, 12));
export const focus = computed(() => cheat.hov || cheat.sel);
const missedSet = computed(() => new Set(lastMissed.value));
export function isCovered(a, b) { return cheat.cover && !cheat.revealed[a + 'x' + b]; }
export function cellClass(a, b) {
  const f = focus.value, s = cheat.sel;
  return {
    row: !!f && f.a === a, col: !!f && f.b === b,
    sel: !!s && s.a === a && s.b === b,
    sq: a === b,
    covered: isCovered(a, b),
    miss: missedSet.value.has(a + 'x' + b) || missedSet.value.has(b + 'x' + a)
  };
}
export function pickCell(a, b) {
  cheat.sel = { a, b };
  if (cheat.cover) cheat.revealed[a + 'x' + b] = true;
  sfx.tick();
}
export const skipCount = computed(() => {
  const s = cheat.sel; if (!s) return '';
  const out = []; for (let i = 1; i <= s.b; i++) out.push(s.a * i);
  return out.join(', ');
});
export function openCheat() { if (isLive.value) return; if (!settings.tables.length) cheat.scope = 'all'; go('cheat'); }
