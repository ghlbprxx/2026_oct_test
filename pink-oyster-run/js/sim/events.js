// Sim -> UI event bus. The sim emits plain data ('toast', 'sfx', 'float', 'lesson', 'track', 'quiz', ...);
// the UI decides how to show or play it. With no listeners (tests), emit is a no-op.
const handlers = new Set();
export function on(fn) { handlers.add(fn); return () => handlers.delete(fn); }
export function emit(type, data = {}) { for (const h of handlers) h(type, data); }
export function clearListeners() { handlers.clear(); }
