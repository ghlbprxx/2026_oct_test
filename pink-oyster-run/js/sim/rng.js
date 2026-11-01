// Randomness for the sim. rand() is Math.random by default; tests call setRng(rngFrom(seed)) for repeatable runs.
export function rngFrom(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
let source = Math.random;
export const rand = () => source();
export function setRng(fn) { source = fn || Math.random; }
