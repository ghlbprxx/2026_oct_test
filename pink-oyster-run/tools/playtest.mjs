#!/usr/bin/env node
// Headless economy report: plays many games per difficulty × strategy and prints medians.
//   node tools/playtest.mjs                      default: all difficulties, careful/marketOnly/sloppy/random/idle, 9 seeds, 20 weeks
//   node tools/playtest.mjs --weeks 30 --seeds 15 --strategies careful,sloppy --modes normal
//   node tools/playtest.mjs --json               machine-readable
//   node tools/playtest.mjs --start lions-mane    begin at a later species (earlier ones count as mastered)
//   node tools/playtest.mjs --continue --weeks 70 play pinks → lion's mane → wine cap in one run
//   node tools/playtest.mjs --expert              Expert runs (adds the liquid-culture stage)
import { defaultConfig } from '../js/config-schema.js';
import { setConfig } from '../js/sim/cfg.js';
import { setRng, rngFrom } from '../js/sim/rng.js';
import { autoplay, STAGE_IDS } from '../js/sim/autoplay.js';

const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const weeks = +opt('--weeks', 20), seeds = +opt('--seeds', 9);
const modes = opt('--modes', 'relaxed,normal,hardcore').split(','), strategies = opt('--strategies', 'careful,marketOnly,sloppy,random,idle').split(',');
const med = xs => { const s = xs.filter(x => x != null).sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : null; };

export function summarize(mode, strategy) {
  const runs = [];
  const extra = { start: opt('--start', null), continueSpecies: a.includes('--continue'), runType: a.includes('--expert') ? 'expert' : 'free' };
  for (let k = 0; k < seeds; k++) { setConfig(defaultConfig()); setRng(rngFrom(1000 + k)); runs.push(autoplay({ strategy, mode, weeks, ...extra })); }
  return {
    mode, strategy, runs: runs.length,
    stagesMastered: med(runs.map(r => r.stages)), allStagesPct: Math.round(100 * runs.filter(r => r.speciesDone).length / runs.length),
    weekMastered: Object.fromEntries(STAGE_IDS.map(id => [id, med(runs.map(r => r.masteredAt[id] ?? null))])),
    startCash: runs[0].startCash, minCash: med(runs.map(r => r.minCash)), worstMinCash: Math.min(...runs.map(r => r.minCash)), brokePct: Math.round(100 * runs.filter(r => r.broke).length / runs.length),
    revenue: med(runs.map(r => r.revenue.total)), online: med(runs.map(r => r.revenue.online)), market: med(runs.map(r => r.revenue.market)),
    gear: med(runs.map(r => r.gear)), profit: med(runs.map(r => r.profit)), harvestLb: med(runs.map(r => r.harvestLb)),
    species: runs.map(r => r.speciesMastered.length).join(','),
    freshLb: med(runs.map(r => r.freshLb)), driedLb: med(runs.map(r => r.driedLb)), rotLb: med(runs.map(r => r.rotLb)), lost: med(runs.map(r => r.lostToMold)),
  };
}
const rows = [];
for (const m of modes) for (const s of strategies) rows.push(summarize(m, s));
if (a.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else {
  console.log(`Pink Oyster Run economy · ${seeds} seeds × ${weeks} weeks · medians\n`);
  console.log('mode      strategy    stages  all%  agar grain sub fruit mkt   start  minCash broke%  revenue (online/market)   gear  profit  harvest');
  for (const r of rows) {
    const w = STAGE_IDS.map(id => String(r.weekMastered[id] ?? '–').padStart(id === 'agar' ? 4 : 5)).join('');
    console.log(`${r.mode.padEnd(9)} ${r.strategy.padEnd(11)} ${String(r.stagesMastered).padStart(4)}/5 ${String(r.allStagesPct).padStart(4)} ${w}  ${String(r.startCash).padStart(6)} ${String(Math.round(r.minCash)).padStart(8)} ${String(r.brokePct).padStart(6)}  ${String(r.revenue).padStart(7)} (${r.online}/${r.market})`.padEnd(118) + `${String(r.gear).padStart(6)} ${String(r.profit).padStart(7)} ${String(r.harvestLb).padStart(6)} lb  (fresh ${r.freshLb} · dried ${r.driedLb} · rot ${r.rotLb}) mold ${r.lost}` + (a.includes('--continue') ? ` · species mastered per run: ${r.species}` : ''));
  }
}
