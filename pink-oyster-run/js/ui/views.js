// View helpers: what each vessel card shows (image layers, status text, badge, bar) and the coaching line.
import { CONFIG } from '../config.js';
import { RULES } from '../sim/rules.js';
import { envNow } from '../sim/environment.js';
import { FRUIT, isBlock } from '../sim/contamination.js';
import { canShake, phaseDays, peakWindow } from '../sim/growth.js';
import { unlocked } from '../sim/stages.js';
import { shelfLifeDays } from '../sim/economy.js';
import { SPECIES } from '../content/species/pink-oyster.js';
import { sources } from '../sim/game.js';
import { RECIPES } from '../content/species/pink-oyster.js';
import { revealStyle } from '../images.js';

export function fruitImg(v, st) {
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
  if (v.kind === 'plate') { add('plate_empty'); if (v.prog > 0) add('plate_colonized', revealStyle('plate_colonized', v.prog)); }
  else if (v.kind === 'jar') { add('jar_empty'); if (['colonizing', 'colonized'].includes(st) && v.prog > 0) add('jar_colonized', revealStyle('jar_colonized', v.prog)); }
  else if (FRUIT.includes(st)) add(fruitImg(v, st), st === 'growing' ? { transform: `scale(${(0.88 + 0.12 * v.prog).toFixed(3)})` } : {});
  else { add(RECIPES[v.recipe].img); if (st === 'colonizing' && v.prog > 0) add('bag_colonized', revealStyle('bag_colonized', v.prog)); }
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
    case 'ready': return 'Tap to spawn';
    case 'colonizing': return (canShake(v) ? 'Shake me · ' : 'Colonizing ') + pct + '%';
    case 'colonized': return `Ready · ${v.uses} use${v.uses > 1 ? 's' : ''}`;
    case 'pinning': return envNow(g).temp < SPECIES.fruiting.minTemp ? 'Too cold!' : 'Pinning ' + pct + '%';
    case 'growing': return (v.prog >= 0.6 ? 'Young · ' : 'Growing ') + pct + '%';
    case 'peak': return 'Peak! Harvest';
    case 'overripe': return 'Overripe! Pick now';
    case 'resting': return `Resting`;
    case 'spent': return v.flush >= 3 ? 'Spent' : 'Flushes done';
  }
  return '';
}
export function badge(v) { if (v.state === 'lost' || v.contam.vis > 0) return '⚠'; if (v.state === 'peak' || v.state === 'overripe') return '✂'; if (v.state === 'ready') return '⤓'; if (isBlock(v) && v.flush) return 'F' + v.flush; return ''; }
export function barPct(g, v) {
  const dur = phaseDays(v);
  if (v.contam.vis > 0) return v.contam.vis * 100;
  if (v.state === 'cooking') return g.cooker.t / CONFIG.equipment.cookerDays * 100;
  if (v.state === 'bath') return v.t / dur * 100;
  if (v.state === 'peak' || v.state === 'overripe') return Math.max(0, 100 - v.t / peakWindow(g) * 100);
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
  if (v.state === 'pinning' && envNow(g).temp < SPECIES.fruiting.minTemp) return 'attn-warn';
  if (canShake(v)) return 'attn-ready';
  return '';
}

/* ---------- coaching line: first thing worth doing ---------- */
export function tipFor(g) {
  const env = envNow(g), V = g.slots.map((v, i) => ({ v, i })).filter(s => s.v);
  const f = p => V.find(s => p(s.v));
  const T = (t, o = {}) => ({ t, ...o });
  let s;
  if ((s = f(v => v.state === 'lost'))) return T(`#${s.v.id} is overrun. Tap it to toss it and free the shelf.`, { slot: s.i });
  if ((s = f(v => v.contam.vis > 0))) return T(`Mold on #${s.v.id}. ${s.v.kind === 'plate' ? 'Cut a clean edge onto a fresh plate, or toss it.' : 'It won’t recover: toss it, and never spawn from it.'}`, { slot: s.i });
  if ((s = f(v => v.state === 'overripe'))) return T(`#${s.v.id} is over-ripening. Pick it now before it drops.`, { slot: s.i });
  if ((s = f(v => v.state === 'peak'))) return T(`#${s.v.id} is at peak. Tap it to harvest.`, { slot: s.i });
  if ((s = f(v => v.state === 'pinning')) && env.temp < SPECIES.fruiting.minTemp) return T(`#${s.v.id} won’t pin at ${env.temp}°F. Pinks need 70–85°F: turn the heater up.`, { heat: true });
  const fresh = g.lots.reduce((a, l) => a + l.kg, 0);
  if (fresh && g.lots.some(l => l.age + (g.nextMarket - g.day) * CONFIG.time.bioDaysPerGameDay > shelfLifeDays(g))) return T(`Some fresh pinks won’t last until market day. Dehydrate them (D) or lose them.`, { dry: true });
  if (f(v => isBlock(v) && ['pinning', 'growing'].includes(v.state))) {
    if (env.co2 > 1000) return T(`CO₂ is ${env.co2} ppm: clusters will go leggy. Add fresh air.`, { room: true });
    if (env.rh < 85) return T(`Humidity is ${env.rh}%: caps will crack. Turn up the mist.`, { room: true });
    if (env.rh > 96) return T(`Humidity is ${env.rh}%: bacteria love that. Ease off the mist.`, { room: true });
    if (env.temp < 70) return T(`${env.temp}°F is cool: pinning is slow. More heat speeds it up.`, { heat: true });
  }
  if ((s = f(v => v.state === 'ready' && sources(g, v).length))) return T(`#${s.v.id} is ${s.v.prep === 'ster' ? 'sterile' : 'pasteurized'} and ready. Tap it to spawn into it.`, { slot: s.i });
  if ((s = f(v => canShake(v)))) return T(`Jar #${s.v.id} is about a third colonized. Tap to break and shake it.`, { slot: s.i });
  if ((s = f(v => v.kind === 'jar' && v.state === 'ready'))) return T(`Jar #${s.v.id} needs a culture. Pour a plate on an empty shelf.`);
  if ((s = f(v => v.kind === 'bag' && v.state === 'ready'))) return T(`Bag #${s.v.id} needs grain spawn. Prep and colonize a grain jar.`);
  if (!g.hasSab && f(v => v.kind === 'plate')) return T(`Plates on an open counter catch drifting spores. Build a still-air box ($15) from the build menu.`, { slot: g.slots.findIndex(v => !v) >= 0 ? g.slots.findIndex(v => !v) : null });
  if ((s = f(v => v.kind === 'plate' && v.state === 'colonized')) && !unlocked(g, 'jar')) return T(`Plate #${s.v.id} is colonized. Pour a few more and compare: clean plates now mean clean jars next week.`);
  const e = g.slots.findIndex(v => !v);
  if (e >= 0) return T(unlocked(g, 'bag') ? `Empty shelf. Tap it to pour a plate, prep a jar, or prep a substrate bag.` : unlocked(g, 'jar') ? `Empty shelf. Tap it to pour a plate or prep a grain jar.` : `Empty shelf. Tap it to pour an agar plate.`, { slot: e });
  return T(unlocked(g, 'room') ? `Market in ${(g.nextMarket - g.day).toFixed(1)} days. Keep the room warm, fresh and humid.` : `Plates and jars are incubating. Speed time up with the playback buttons ( ] ).`);
}
