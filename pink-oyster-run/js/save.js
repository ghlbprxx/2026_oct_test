// Persistent player profile (not the run): best profit, lessons ever learned, settings.
// Versioned, with migration from the pre-module build's loose keys. Storage is injectable for tests;
// every access is wrapped because storage can be blocked (private mode, sandboxed iframes).
export const SAVE_KEY = 'por:profile';
export const SAVE_VERSION = 1;
const LEGACY = { best: 'por2-best', lessons: 'por2-lessons', muted: 'por2-mute' };

export const blankProfile = () => ({ v: SAVE_VERSION, best: null, lessons: {}, muted: false, expert: false, playMode: 'basic', tutorialDone: false, vol: { music: 0.5, sfx: 1, voice: 1 } });

function read(storage, key) { try { const v = storage.getItem(key); return v == null ? undefined : JSON.parse(v); } catch (e) { return undefined; } }

/** Bring any older profile shape up to the current version. */
export function migrate(data) {
  const p = { ...blankProfile(), ...(data && typeof data === 'object' ? data : {}) };
  if (!p.lessons || typeof p.lessons !== 'object') p.lessons = {};
  p.vol = { music: 0.5, sfx: 1, voice: 1, ...(p.vol && typeof p.vol === 'object' ? p.vol : {}) };
  p.v = SAVE_VERSION;
  return p;
}

export function loadProfile(storage = globalThis.localStorage) {
  if (!storage) return blankProfile();
  const saved = read(storage, SAVE_KEY);
  if (saved) return migrate(saved);
  // v0: three separate keys written by the single-file build
  const legacy = { best: read(storage, LEGACY.best) ?? null, lessons: read(storage, LEGACY.lessons) ?? {}, muted: read(storage, LEGACY.muted) ?? false, v: 0 };
  return migrate(legacy);
}

export function saveProfile(profile, storage = globalThis.localStorage) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(migrate(profile))); return true; } catch (e) { return false; }
}

/* ---------- the current run (autosaved at each weekly review and when the tab is hidden) ---------- */
export const RUN_KEY = 'por:run';
export const RUN_VERSION = 4; // v1 = phase-3 runs (no stage ladder / online shop fields); v2 = phase 4; v3 = phase 5 (runType, story); v4 = phase 6 (species)
const deep = o => JSON.parse(JSON.stringify(o));

/** Bring an older saved run up to the current shape. Returns null for anything unusable. */
export function migrateRun(data) {
  if (!data || typeof data !== 'object' || !data.g || typeof data.g !== 'object' || !Array.isArray(data.g.slots)) return null;
  const g = { stage: 0, units: 0, mastered: [], counts: {}, speciesDone: false, weeksRepeated: 0, reviews: [],
    stock: { plate: [], jar: [], kit: [], dried: [] }, prices: {}, rep: 50, runType: 'free', story: { seen: [] }, species: 'pink-oyster', speciesMastered: [], masteredBy: {}, countsBy: {}, marketMode: 'auto', gear: {}, cookers: [], lots: [], log: [], learned: [], asked: [], ...deep(data.g) };
  for (const k of ['plate', 'jar', 'kit', 'dried']) if (!Array.isArray(g.stock[k])) g.stock[k] = [];
  if (!g.story || !Array.isArray(g.story.seen)) g.story = { seen: [] };
  if (g.speciesDone && !g.speciesMastered.length) g.speciesMastered = [g.species]; // v3 runs that already mastered pinks
  if (!g.weekStart) g.weekStart = deep({ stats: g.stats || {}, counts: g.counts, cash: g.cash, day: g.day });
  return g;
}
export function saveRun(g, storage = globalThis.localStorage) {
  try { storage.setItem(RUN_KEY, JSON.stringify({ v: RUN_VERSION, savedAt: Date.now(), g })); return true; } catch (e) { return false; }
}
export function loadRun(storage = globalThis.localStorage) {
  try { const raw = storage && storage.getItem(RUN_KEY); return raw ? migrateRun(JSON.parse(raw)) : null; } catch (e) { return null; }
}
export function clearRun(storage = globalThis.localStorage) { try { storage.removeItem(RUN_KEY); } catch (e) {} }
