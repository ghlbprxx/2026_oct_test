// Zones: where each spot is, what conditions it has, and whether a vessel belongs there.
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { envFrom, envModel, lerp, clamp } from './environment.js';
import { seasonDays } from './clock.js';
import { FRUIT } from './contamination.js';
import { ZONES, ZONE_BY_ID } from '../content/zones.js';

/** Flat spot list in zone order: index -> { zone, k }. g.slots uses the same indices. */
export const SPOTS = ZONES.flatMap(z => Array.from({ length: z.spots }, (_, k) => ({ zone: z.id, k })));
export const zoneOf = i => SPOTS[i] && SPOTS[i].zone;
export const spotsIn = zid => SPOTS.map((s, i) => s.zone === zid ? i : -1).filter(i => i >= 0);

export function zoneOpen(g, zid) {
  const z = ZONE_BY_ID[zid];
  if (z.locked) return false;
  return z.needs ? !!g.gear[z.needs] : true;
}
/** A spot is open when its zone is, and (for extra spots like the closet rack) its gear is owned. */
export function spotOpen(g, i) {
  const sp = SPOTS[i]; if (!sp || !zoneOpen(g, sp.zone)) return false;
  const x = ZONE_BY_ID[sp.zone].extra;
  return !(x && sp.k >= x.from && !g.gear[x.needs]);
}

/** Outdoor temperature: season drift + daily swing − cold snap. */
export function outdoorTemp(g, swing = 0) {
  const R = C.room, f = clamp(g.day / seasonDays(), 0, 1);
  return Math.round(lerp(R.seasonStartTemp, R.seasonEndTemp, f) + swing * Math.sin(g.day * 2.4) - (g.snap ? RULES.coldSnapDrop : 0));
}
export const houseTemp = g => C.room.houseTemp - (g.snap ? RULES.snapHouseDrop : 0);

/** Conditions in a zone right now (temperature, CO2, RH, growth factors, dirt). */
export function zoneEnv(g, zid) {
  const z = ZONE_BY_ID[zid], E = z.env;
  if (zid === 'tent') {
    const temp = houseTemp(g) + (g.gear.heatmat ? g.heater * RULES.heaterStep : 0);
    const mist = Math.min(g.mist, g.gear.humidifier ? 110 : RULES.handMistMax);
    return { ...envModel(temp, g.fae, mist), dirt: E.dirt, zone: zid };
  }
  const temp = E.outdoor ? outdoorTemp(g, E.swing) + E.dT : houseTemp(g) + E.dT;
  return { ...envFrom(temp, E.co2, E.rh), dirt: E.dirt, zone: zid };
}
export const allEnvs = g => Object.fromEntries(ZONES.map(z => [z.id, zoneEnv(g, z.id)]));

/** What kind of thing a vessel is, for zone fit. */
export function role(v) {
  if (!v) return null;
  const st = v.state === 'lost' ? v.lostFrom : v.state;
  if (v.kind === 'bag' && FRUIT.includes(st)) return st === 'spent' ? 'spent' : 'block';
  if (['queued', 'cooking', 'bath', 'ready', 'colonized'].includes(st) || st === 'lost') return 'storage';
  return v.kind; // colonizing plate / jar / bag
}
/**
 * Does vessel v belong in zone zid? Returns { level: 'good' | 'ok' | 'bad', note } with a plain-language reason.
 * The reasons mirror what the sim actually does (temperature, CO2, humidity, dirt).
 */
export function zoneFit(g, zid, v) {
  const r = role(v), env = zoneEnv(g, zid), z = ZONE_BY_ID[zid];
  if (!r || r === 'storage' || r === 'spent') return { level: 'good', note: '' };
  if (r === 'block') {
    if (zid === 'tent') return env.score > 0.8 ? { level: 'good', note: 'Fruiting conditions are right.' } : { level: 'ok', note: 'Right place; tune heat, air and mist.' };
    const why = env.temp < 64 ? `too cold (${env.temp}°F) to pin` : env.co2 > 1500 ? `stale air (${env.co2} ppm CO₂) makes leggy clusters` : env.rh < 80 ? `dry air (${env.rh}% RH) cracks the caps` : 'not set up for fruiting';
    return { level: 'bad', note: `${z.short}: ${why}. Move it to the grow tent.` };
  }
  // colonizing plate / jar / bag
  if (env.temp < 60) return { level: 'bad', note: `${z.short} is ${env.temp}°F: colonization crawls and may stall. The closet stays warmer.` };
  if (z.env.dirt > 1.1) return { level: 'ok', note: `${z.short}: busy, dusty air means more mold risk. The closet is cleaner.` };
  if (zid === 'tent') return { level: 'ok', note: 'Humid tent air is fine, but the closet is cleaner and frees tent space for fruiting.' };
  return { level: 'good', note: 'Good spot to incubate.' };
}
