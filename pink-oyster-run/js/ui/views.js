// View helpers: what each vessel card shows (image layers, status text, badge, bar) and the coaching line.
import { CONFIG } from '../config.js';
import { RULES } from '../sim/rules.js';
import { zoneEnv, zoneOf, zoneFit, spotOpen } from '../sim/zones.js';
import { canDry, seesClimate, seesCO2, canSterilizeJars } from '../sim/equipment.js';
import { ZONE_BY_ID } from '../content/zones.js';
import { FRUIT, isBlock } from '../sim/contamination.js';
import { canShake, phaseDays, peakWindow } from '../sim/growth.js';
import { unlocked } from '../sim/stages.js';
import { shelfLifeDays } from '../sim/economy.js';
import { spv, spg, recipeOf, packOf, nextSpecies } from '../content/species/index.js';
import { sources } from '../sim/game.js';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
import { revealStyle } from '../images.js';

/** Species art for growing / peak / overripe stages (pinning, resting and spent blocks are shared). */
const SPECIES_ART = { 'lions-mane': 'lm', 'wine-cap': 'wc' };
export function fruitImg(v, st) {
  const pre = SPECIES_ART[v.sp];
  if (pre && ['growing', 'peak', 'overripe'].includes(st)) return `${pre}_${st === 'overripe' ? 'overripe' : st === 'growing' && v.prog < 0.7 ? 'young' : 'peak'}`;
  const qc = v.q.n ? v.q.c / v.q.n : 1, qh = v.q.n ? v.q.h / v.q.n : 1;
  if (st === 'pinning') return v.prog < 0.5 ? 'block_ready' : 'block_pins';
  if (st === 'resting') return 'block_ready';
  if (st === 'spent') return 'block_spent';
  if (st === 'overripe') return 'cluster_overripe';
  if (st === 'growing' && v.prog < 0.7) return 'cluster_young';
  return qc < 0.8 ? 'cluster_leggy' : qh < 0.8 ? 'cluster_dry' : st === 'growing' ? 'cluster_young' : 'cluster_peak';
}
export function layers(v) {
  const L = [], st = v.state === 'lost' ? v.lostFrom : v.state, add = (id, style = {}) => L.push({ id, style });
  if (v.kind === 'lc') { add('lc_jar'); if (v.prog > 0) add('lc_growth', { opacity: (0.25 + 0.75 * v.prog).toFixed(2) }); }
  else if (v.kind === 'bed') { add('bed'); if (['growing', 'peak', 'overripe'].includes(st)) add(fruitImg(v, st)); }
  else if (v.kind === 'plate') { add('plate_empty'); if (v.prog > 0) add('plate_colonized', revealStyle('plate_colonized', v.prog)); }
  else if (v.kind === 'jar') { add('jar_empty'); if (['colonizing', 'colonized'].includes(st) && v.prog > 0) add('jar_colonized', revealStyle('jar_colonized', v.prog)); }
  else if (FRUIT.includes(st)) add(fruitImg(v, st), st === 'growing' ? { transform: `scale(${(0.88 + 0.12 * v.prog).toFixed(3)})` } : {});
  else { add(recipeOf(v).img); if (st === 'colonizing' && v.prog > 0) add('bag_colonized', revealStyle('bag_colonized', v.prog)); }
  if (v.contam.vis > 0) add('mold_overlay', { opacity: (0.3 + 0.7 * v.contam.vis).toFixed(2), transform: `scaleX(${v.id % 2 ? -1 : 1}) rotate(${(v.id * 37) % 40 - 20}deg) scale(${(0.7 + 0.4 * v.contam.vis).toFixed(2)})`, transformOrigin: '50% 60%' });
  return L;
}
export function status(g, v) {
  const pct = Math.round(v.prog * 100);
  if (v.state === 'lost') return 'Overrun · toss';
  if (v.contam.vis > 0) return 'Mold!';
  switch (v.state) {
    case 'queued': return 'Cooker queue';
    case 'cooking': return 'Sterilizing';
    case 'bath': return 'Pasteurizing…';
    case 'ready': return v.kind === 'bed' ? 'Needs spawn' : 'Tap to spawn';
    case 'colonizing': return v.kind === 'bed' && v.water < 0.25 ? `Dry! ${pct}%` : (canShake(v) ? 'Shake me · ' : 'Colonizing ') + pct + '%';
    case 'colonized': return `Ready · ${v.uses} use${v.uses > 1 ? 's' : ''}`;
    case 'pinning': return v.kind === 'bed' ? (v.water < 0.5 ? 'Waiting for rain' : 'Pinning ' + pct + '%') : tooCold(g, v) ? 'Too cold!' : tooHot(g, v) ? 'Too warm!' : 'Pinning ' + pct + '%';
    case 'growing': return (v.prog >= 0.6 ? 'Young · ' : 'Growing ') + pct + '%';
    case 'peak': return 'Peak! Harvest';
    case 'overripe': return 'Overripe! Pick now';
    case 'resting': return `Resting`;
    case 'spent': return v.kind === 'bed' ? 'Bed used up' : v.flush >= 3 ? 'Spent' : 'Flushes done';
  }
  return '';
}
export function badge(v) { if (v.state === 'lost' || v.contam.vis > 0) return '⚠'; if (v.state === 'peak' || v.state === 'overripe') return '✂'; if (v.state === 'ready') return '⤓'; if (v.kind === 'bed' && v.water < 0.25) return '💧'; if ((isBlock(v) || v.kind === 'bed') && v.flush) return 'F' + v.flush; return ''; }
const tooCold = (g, v) => envAt(g, v).temp < spv(v).fruiting.minTemp;
const tooHot = (g, v) => spv(v).fruiting.maxTemp != null && envAt(g, v).temp > spv(v).fruiting.maxTemp;
export function barPct(g, v) {
  const dur = phaseDays(v);
  if (v.contam.vis > 0) return v.contam.vis * 100;
  if (v.state === 'cooking') { const k = g.cookers.find(k => k.batch.includes(v.id)); return k ? k.t / CONFIG.equipment.cookerDays * 100 : 0; }
  if (v.state === 'bath') return v.t / dur * 100;
  if (v.state === 'peak' || v.state === 'overripe') return Math.max(0, 100 - v.t / peakWindow(g, v) * 100);
  if (v.state === 'resting') return v.t / dur * 100;
  if (['ready', 'queued', 'spent'].includes(v.state)) return 0;
  return v.prog * 100;
}
export function barColor(v) { return v.contam.vis > 0 ? 'var(--bad)' : v.state === 'overripe' ? 'var(--warn)' : v.state === 'peak' ? 'var(--good)' : 'var(--pink)'; }
export function slotCls(g, v) {
  if (!v) return '';
  if (v.state === 'lost') return 'lost attn-mold';
  if (v.contam.vis > 0) return 'attn-mold';
  if (v.state === 'overripe') return 'attn-urgent';
  if (v.state === 'peak') return 'attn-harvest';
  if (v.state === 'ready' && sources(g, v).length) return 'attn-ready';
  if (v.state === 'pinning' && v.kind !== 'bed' && (tooCold(g, v) || tooHot(g, v))) return 'attn-warn';
  if (v.kind === 'bed' && v.water < 0.25 && v.state !== 'spent') return 'attn-warn';
  if (fitOf(g, v).level === 'bad') return 'attn-warn';
  if (canShake(v)) return 'attn-ready';
  return '';
}

/* ---------- coaching line: first thing worth doing ---------- */
export function tipFor(g) {
  const V = g.slots.map((v, i) => ({ v, i })).filter(s => s.v), env = zoneEnv(g, 'tent');
  const f = p => V.find(s => p(s.v));
  const T = (t, o = {}) => ({ t, ...o });
  let s;
  if ((s = f(v => v.state === 'lost'))) return T(`#${s.v.id} is overrun. Tap it to toss it and free the shelf.`, { slot: s.i });
  if ((s = f(v => v.contam.vis > 0))) return T(`Mold on #${s.v.id}. ${s.v.kind === 'plate' ? 'Cut a clean edge onto a fresh plate, or toss it.' : 'It won’t recover: toss it, and never spawn from it.'}`, { slot: s.i });
  if ((s = f(v => v.state === 'overripe'))) return T(`#${s.v.id} is over-ripening. Pick it now before it drops.`, { slot: s.i });
  if ((s = f(v => v.state === 'peak'))) return T(`#${s.v.id} is at peak. Tap it to harvest.`, { slot: s.i });
  if ((s = f(v => isBlock(v) && ['pinning', 'growing'].includes(v.state) && zoneOf(g.slots.indexOf(v)) !== 'tent'))) return T(g.gear.tent ? `#${s.v.id} is ready to fruit, but it’s in the ${ZONE_BY_ID[zoneOf(s.i)].short.toLowerCase()}. Move it to the grow tent.` : `#${s.v.id} is ready to fruit. It needs a grow tent: humid air and a fan. Open the shop.`, g.gear.tent ? { slot: s.i } : { shop: true });
  if ((s = f(v => v.kind === 'bed' && v.water < 0.3 && v.state !== 'spent'))) return T(`Bed #${s.v.id} is drying out. Tap it and water it: dry beds stall and invite competitor fungi.`, { slot: s.i });
  if ((s = f(v => v.kind === 'bed' && v.state === 'ready' && sources(g, v).length))) return T(`Bed #${s.v.id} is built. Tap it to inoculate it with a colonized spawn bag.`, { slot: s.i });
  if ((s = f(v => isBlock(v) && v.state === 'pinning' && zoneOf(g.slots.indexOf(v)) === 'tent' && (tooCold(g, v) || tooHot(g, v))))) {
    const P = spv(s.v), F = P.fruiting, t = envAt(g, s.v).temp, hot = tooHot(g, s.v);
    return T(`#${s.v.id} won’t pin at ${t}°F. ${P.name} ${P.id === "pink-oyster" ? "need" : "needs"} ${F.bestLo}–${F.bestHi}°F: ${hot ? 'turn the heat mat down or off' : g.gear.heatmat ? 'turn the heat mat up' : 'a heat mat in the tent fixes that (shop)'}.`, g.gear.heatmat ? { heat: !hot, room: hot } : { shop: true });
  }
  const fresh = g.lots.reduce((a, l) => a + l.kg, 0);
  if (fresh && g.lots.some(l => l.age + (g.nextMarket - g.day) * CONFIG.time.bioDaysPerGameDay > shelfLifeDays(g, l.sp))) return canDry(g) ? T(`Some fresh mushrooms won’t last until market day. Dehydrate them (D) or lose them.`, { dry: true }) : T(`Some fresh mushrooms won’t last until market day. A dehydrator (shop) would save them.`, { shop: true });
  if (f(v => isBlock(v) && ['pinning', 'growing'].includes(v.state))) {
    const F = spg(g).fruiting;
    if (env.co2 > 1000) return T(`CO₂ is ${env.co2} ppm: clusters will go leggy. Add fresh air.`, { room: true });
    if (env.rh < 85) return T(`Humidity is ${env.rh}%: caps will crack. Turn up the mist.`, { room: true });
    if (env.rh > 96) return T(`Humidity is ${env.rh}%: bacteria love that. Ease off the mist.`, { room: true });
    if (env.temp > F.bestHi) return T(`${env.temp}°F is warm for ${spg(g).short}: best is ${F.bestLo}–${F.bestHi}°F. ${g.gear.heatmat && g.heater ? 'Turn the heat mat down.' : ''}`, { room: true });
    if (env.temp < F.bestLo) return T(`${env.temp}°F is cool: pinning is slow. ${g.gear.heatmat ? 'More heat speeds it up.' : 'A heat mat (shop) fixes that.'}`, g.gear.heatmat ? { heat: true } : { shop: true });
  }
  if ((s = f(v => v.state === 'ready' && sources(g, v).length))) return T(`#${s.v.id} is ${s.v.prep === 'ster' ? 'sterile' : 'pasteurized'} and ready. Tap it to spawn into it.`, { slot: s.i });
  if ((s = f(v => canShake(v)))) return T(`Jar #${s.v.id} is about a third colonized. Tap to break and shake it.`, { slot: s.i });
  if ((s = f(v => v.kind === 'jar' && v.state === 'ready'))) return T(`Jar #${s.v.id} needs a culture. Pour a plate on an empty shelf.`);
  if ((s = f(v => v.kind === 'bag' && v.state === 'ready'))) return T(`Bag #${s.v.id} needs grain spawn. Prep and colonize a grain jar.`);
  if (!g.gear.sab && !g.gear.flowhood && f(v => v.kind === 'plate')) return T(`Plates poured on an open counter catch drifting spores. A still-air box ($15 DIY) is in the shop.`, { shop: true });
  if (unlocked(g, 'jar') && !canSterilizeJars(g)) return T(`Grain jars are open, but grain must be pressure-cooked. Buy a cooker in the shop.`, { shop: true });
  if ((s = f(v => v.kind === 'plate' && v.state === 'colonized')) && !unlocked(g, 'jar')) return T(`Plate #${s.v.id} is colonized. Pour a few more and compare: clean plates now mean clean jars next week.`);
  const e = g.slots.findIndex((v, i) => !v && spotOpen(g, i));
  if (g.speciesDone && nextSpecies(g.species)) return T(`${cap(spg(g).short)} mastered. When you’re ready, start ${packOf(nextSpecies(g.species)).name} from the mastery card.`, { mastery: true });
  if (e >= 0) return T(unlocked(g, 'bag') ? `Empty shelf. Tap it to pour a plate, prep a jar, or prep a substrate bag.` : unlocked(g, 'jar') ? `Empty shelf. Tap it to pour a plate or prep a grain jar.` : `Empty shelf. Tap it to pour an agar plate.`, { slot: e });
  return T(unlocked(g, 'room') ? `Market in ${(g.nextMarket - g.day).toFixed(1)} days. Keep the room warm, fresh and humid.` : `Plates and jars are incubating. Speed time up with the playback buttons ( ] ).`);
}

/** Conditions where vessel v sits. */
export function envAt(g, v) { return zoneEnv(g, zoneOf(g.slots.indexOf(v))); }
export function fitOf(g, v) { const i = g.slots.indexOf(v); return i < 0 ? { level: 'good', note: '' } : zoneFit(g, zoneOf(i), v); }

const word = (v, cuts, words) => words[cuts.findIndex(c => v < c) < 0 ? words.length - 1 : cuts.findIndex(c => v < c)];
/** Zone readout. Exact numbers need a hygrometer (temp/RH) or CO2 monitor; otherwise you get what you can feel. */
export function zoneReadout(g, zid) {
  const e = zoneEnv(g, zid), clim = seesClimate(g), co2 = seesCO2(g);
  const temp = clim ? `${e.temp}°F` : word(e.temp, [58, 66, 76, 86], ['cold', 'cool', 'mild', 'warm', 'hot']);
  const rh = clim ? `${e.rh}% RH` : word(e.rh, [60, 80, 92], ['dry air', 'so-so air', 'humid', 'damp']);
  const air = co2 ? `${e.co2} ppm CO₂` : word(e.co2, [1000, 2000], ['fresh air', 'stuffy', 'stale air']);
  const dirt = ZONE_BY_ID[zid].env.dirt, clean = dirt <= 0.85 ? 'clean' : dirt <= 1.05 ? 'normal' : dirt <= 1.35 ? 'busy, dusty' : 'outdoors';
  return { temp, rh, air, clean, exact: clim, e };
}
