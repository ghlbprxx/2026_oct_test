// Small helpers shared across modules.
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
export const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
export const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
