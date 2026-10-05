// Safe persistence. Every access is guarded; falls back to memory if storage is unavailable.

export function createStorage(key, backend) {
  let store = backend;
  let ok = true;
  let memory = null;
  try {
    if (store === undefined) store = globalThis.localStorage;
    const probe = `${key}.__probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
  } catch {
    ok = false;
  }

  return {
    get ok() { return ok; },
    load(defaults) {
      if (!ok) return structuredClone(memory ?? defaults);
      try {
        const raw = store.getItem(key);
        if (!raw) return structuredClone(defaults);
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return structuredClone(defaults);
        return { ...structuredClone(defaults), ...data };
      } catch {
        return structuredClone(defaults);
      }
    },
    save(data) {
      const plain = JSON.parse(JSON.stringify(data));
      if (!ok) { memory = plain; return false; }
      try {
        store.setItem(key, JSON.stringify(plain));
        return true;
      } catch {
        ok = false;
        memory = plain;
        return false;
      }
    },
  };
}
