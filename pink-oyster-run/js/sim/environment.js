// Grow-room environment: temperature, CO2, humidity and their growth factors.
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { seasonDays } from './clock.js';
import { unlocked } from './stages.js';
import { SPECIES } from '../content/species/pink-oyster.js';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function envModel(temp, fae, mist) {
  const F = SPECIES.fruiting;
  const co2 = Math.round(400 + 4200 / (1 + fae * 1.15));
  const rh = clamp(Math.round(mist - fae * 2.2), 40, 100);
  const tF = temp < F.minTemp ? 0.08 : temp < F.bestLo ? 0.4 + 0.6 * (temp - F.minTemp) / (F.bestLo - F.minTemp) : temp <= F.bestHi ? 1 : temp <= F.bestHi + 5 ? 1 - 0.05 * (temp - F.bestHi) : 0.6;
  const cF = co2 <= 1000 ? 1 : Math.max(0.3, 1 - (co2 - 1000) / 4200);
  const hF = rh >= 85 && rh <= 95 ? 1 : rh < 85 ? Math.max(0.3, 1 - (85 - rh) * 0.035) : 0.9;
  return { temp, co2, rh, tF, cF, hF, score: tF * cF * hF };
}
/** Unheated room temperature: season drift + daily wobble − cold snap. */
export function baseTemp(g) {
  const R = C.room, f = clamp(g.day / seasonDays(), 0, 1);
  return Math.round(lerp(R.seasonStartTemp, R.seasonEndTemp, f) + 1.5 * Math.sin(g.day * 0.9) - (g.snap ? RULES.coldSnapDrop : 0));
}
/** Before the grow room unlocks, everything incubates in a steady closet. */
export function envNow(g) {
  if (!unlocked(g, 'room')) return envModel(RULES.incubationTemp, 5, 98);
  return envModel(baseTemp(g) + g.heater * RULES.heaterStep, g.fae, g.mist);
}
/** Colonization speed factor by temperature. */
export function colF(t) { return t < 55 ? 0.25 : t < 65 ? 0.25 + 0.45 * (t - 55) / 10 : t < 75 ? 0.7 + 0.3 * (t - 65) / 10 : t <= 85 ? 1 : t <= 92 ? 1 - 0.05 * (t - 85) : 0.6; }
export const tStat = t => t < 64 ? ['bad', 'No pins'] : t < 70 ? ['ok', 'Cool'] : t <= 85 ? ['good', 'Sweet spot'] : t <= 90 ? ['ok', 'Heat stress'] : ['bad', 'Too hot'];
export const cStat = c => c <= 1000 ? ['good', 'Fresh'] : c <= 2000 ? ['ok', 'Stuffy'] : ['bad', 'Leggy stems'];
export const hStat = h => h < 75 ? ['bad', 'Caps crack'] : h < 85 ? ['ok', 'A bit dry'] : h <= 95 ? ['good', 'Ideal'] : ['ok', 'Soggy'];
