// Grow-room environment: temperature, CO2, humidity and their growth factors.
import { SPECIES } from '../content/species/pink-oyster.js';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Growth factors for a given temperature, CO2 and humidity, for a species' fruiting window F (default: pink oyster). */
export function envFrom(temp, co2, rh, F = SPECIES.fruiting) {
  const lo = F.rhLo ?? 85, hi = F.rhHi ?? 95;
  const tF = temp < F.minTemp ? 0.08 : temp < F.bestLo ? 0.4 + 0.6 * (temp - F.minTemp) / (F.bestLo - F.minTemp) : temp <= F.bestHi ? 1 : temp <= F.bestHi + 5 ? 1 - 0.05 * (temp - F.bestHi) : 0.6;
  const cF = co2 <= 1000 ? 1 : Math.max(0.3, 1 - (co2 - 1000) / 4200);
  const hF = rh >= lo && rh <= hi ? 1 : rh < lo ? Math.max(0.3, 1 - (lo - rh) * 0.035) : 0.9;
  return { temp, co2, rh, tF, cF, hF, score: tF * cF * hF };
}
/** The same conditions re-scored for another species' fruiting window (a tent can't suit two species at once). */
export const forSpecies = (env, F) => ({ ...env, ...envFrom(env.temp, env.co2, env.rh, F) });
/** Tent conditions from its controls: fan (fresh air exchanges/hr) and mist. */
export function envModel(temp, fae, mist, F) {
  const co2 = Math.round(400 + 4200 / (1 + fae * 1.15));
  const rh = clamp(Math.round(mist - fae * 2.2), 40, 100);
  return envFrom(temp, co2, rh, F);
}
/** Colonization speed factor by temperature. `shift` °F moves the curve down for cold-tolerant species (wine cap). */
export function colF(t, shift = 0) { t += shift; return t < 55 ? 0.25 : t < 65 ? 0.25 + 0.45 * (t - 55) / 10 : t < 75 ? 0.7 + 0.3 * (t - 65) / 10 : t <= 85 ? 1 : t <= 92 ? 1 - 0.05 * (t - 85) : 0.6; }
/** Temperature verdict for a species' fruiting window. */
export const tStat = (t, F = SPECIES.fruiting) => t < F.minTemp ? ['bad', 'No pins'] : t < F.bestLo ? ['ok', 'Cool'] : t <= F.bestHi ? ['good', 'Sweet spot'] : t <= (F.maxTemp ?? F.bestHi + 5) ? ['ok', 'Heat stress'] : ['bad', 'Too hot'];
export const cStat = c => c <= 1000 ? ['good', 'Fresh'] : c <= 2000 ? ['ok', 'Stuffy'] : ['bad', 'Leggy stems'];
export const hStat = h => h < 75 ? ['bad', 'Caps crack'] : h < 85 ? ['ok', 'A bit dry'] : h <= 95 ? ['good', 'Ideal'] : ['ok', 'Soggy'];
