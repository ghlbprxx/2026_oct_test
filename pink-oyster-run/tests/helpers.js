// Shared test setup: default config from the schema + a seeded RNG, so runs are repeatable.
import { defaultConfig } from '../js/config-schema.js';
import { setConfig } from '../js/sim/cfg.js';
import { setRng, rngFrom } from '../js/sim/rng.js';
import { clearListeners } from '../js/sim/events.js';

export function setup(seed = 1, tweak = c => c) {
  clearListeners();
  const C = tweak(defaultConfig());
  setConfig(C); setRng(rngFrom(seed));
  return C;
}
/** Run the sim for `days` game days in small steps, calling `each(g)` before every step. */
export async function run(g, days, each = () => {}, step = 0.05) {
  const { update } = await import('../js/sim/game.js');
  for (let t = 0; t < days && !g.over; t += step) { each(g); update(g, step); }
  return g;
}
