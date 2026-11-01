// Persistent player profile (not the run): best profit, lessons ever learned, settings.
// Versioned, with migration from the pre-module build's loose keys. Storage is injectable for tests;
// every access is wrapped because storage can be blocked (private mode, sandboxed iframes).
export const SAVE_KEY = 'por:profile';
export const SAVE_VERSION = 1;
const LEGACY = { best: 'por2-best', lessons: 'por2-lessons', muted: 'por2-mute' };

export const blankProfile = () => ({ v: SAVE_VERSION, best: null, lessons: {}, muted: false });

function read(storage, key) { try { const v = storage.getItem(key); return v == null ? undefined : JSON.parse(v); } catch (e) { return undefined; } }

/** Bring any older profile shape up to the current version. */
export function migrate(data) {
  const p = { ...blankProfile(), ...(data && typeof data === 'object' ? data : {}) };
  if (!p.lessons || typeof p.lessons !== 'object') p.lessons = {};
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
