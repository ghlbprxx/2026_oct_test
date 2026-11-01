// Phase 6: lion's mane and wine cap. Species data, the per-species ladder, transfer of skills,
// beds and weather, and headless proofs that each species is playable and the full journey pays.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, run } from './helpers.js';
import { SPECIES_BY, SPECIES_ORDER, packOf, nextSpecies, recipeOf } from '../js/content/species/index.js';
import { LADDERS, STAGES } from '../js/content/stages.js';
import { LESSONS } from '../js/content/lessons.js';
import { newGame, startSpecies, buildBed, water, inoculate, prepBag, update } from '../js/sim/game.js';
import { unlocked, currentStage, everMastered } from '../js/sim/stages.js';
import { unitsNeeded, forceMaster, buildReview, applyVerdict } from '../js/sim/mastery.js';
import { mk, stepVessel, harvestKg, phaseDays } from '../js/sim/growth.js';
import { zoneEnv, spotsIn, zoneOpen } from '../js/sim/zones.js';
import { envFrom, forSpecies } from '../js/sim/environment.js';
import { shelfLifeDays, freshPrice } from '../js/sim/economy.js';
import { productOpen, productFor } from '../js/sim/shop.js';
import { migrateRun } from '../js/save.js';
import { autoplay } from '../js/sim/autoplay.js';

test('three species in order, each with complete data', () => {
  assert.deepEqual(SPECIES_ORDER, ['pink-oyster', 'lions-mane', 'wine-cap']);
  for (const id of SPECIES_ORDER) {
    const P = SPECIES_BY[id];
    for (const k of ['plateDays', 'jarDays', 'pinDays', 'growDays', 'peakWindow', 'restDays']) assert.ok(P.bio[k] > 0, `${id} bio.${k}`);
    assert.ok(P.fruiting.bestLo < P.fruiting.bestHi && P.priceMult > 0 && P.shelfMult > 0, id);
    for (const r of P.basic) assert.ok(P.buyable[r], `${id} basic recipe ${r}`);
    assert.equal(LADDERS[id].length, 5, `${id} ladder`);
  }
  assert.equal(nextSpecies('pink-oyster'), 'lions-mane'); assert.equal(nextSpecies('wine-cap'), null);
  assert.equal(packOf(undefined).id, 'pink-oyster', 'no species means pink (old saves)');
  assert.deepEqual(LADDERS['wine-cap'].map(s => s.id), ['agar', 'grain', 'spawn', 'bed', 'harvest']);
  for (const k of ['too_warm', 'pine_chips', 'dry_bed']) assert.ok(LESSONS[k], k);
});

test('lion’s mane is a cool-weather species: a tent set for pinks is too warm for it', () => {
  setup(1);
  const pink = SPECIES_BY['pink-oyster'].fruiting, lm = SPECIES_BY['lions-mane'].fruiting;
  const warm = envFrom(78, 600, 90, pink), cool = envFrom(65, 600, 90, pink);
  assert.equal(warm.tF, 1); assert.ok(forSpecies(warm, lm).tF < 0.9, 'pink sweet spot is heat stress for lion’s mane');
  assert.ok(cool.tF < 1); assert.equal(forSpecies(cool, lm).tF, 1, '65°F suits lion’s mane');
  assert.ok(packOf('lions-mane').shelfMult > 2 && freshPrice('lions-mane') > freshPrice('pink-oyster'), 'keeps longer, sells higher');
  assert.ok(packOf('lions-mane').recipes.straw.be < packOf('lions-mane').recipes.masters.be / 3, 'straw is a poor choice');
});

test('a lion’s mane block stalls above its max temperature and teaches why', () => {
  setup(1, c => { c.dev.god = true; return c; });
  const g = newGame('normal'); startSpecies(g, 'lions-mane', true);
  const v = mk(g, 'bag', { recipe: 'masters', prep: 'ster', state: 'pinning', flush: 1 });
  const env = { ...envFrom(82, 600, 90), dirt: 1, zone: 'tent' };
  for (let k = 0; k < 40; k++) stepVessel(g, v, 0.1, env, 8);
  assert.equal(v.state, 'pinning'); assert.equal(v.prog, 0);
  assert.ok(g.learned.includes('too_warm'));
});

test('switching species: ladder resets, skills transfer, shop products stay open, pinks data archived', () => {
  setup(1);
  const g = newGame('normal');
  assert.equal(startSpecies(g, 'lions-mane'), false, 'not before pinks are mastered');
  g.stage = 4; forceMaster(g); const r = buildReview(g); applyVerdict(g, r);
  assert.ok(g.speciesDone); assert.deepEqual(g.speciesMastered, ['pink-oyster']);
  g.mastered = STAGES.map(s => s.id); // all five stages were mastered on the way
  assert.equal(startSpecies(g, 'wine-cap'), false, 'species go in order');
  assert.ok(startSpecies(g, 'lions-mane'));
  assert.equal(g.species, 'lions-mane'); assert.equal(g.stage, 0); assert.deepEqual(g.mastered, []); assert.deepEqual(g.counts, {});
  assert.equal(currentStage(g).checklist[0].n, 2, 'lion’s mane agar checklist');
  assert.equal(unitsNeeded(g), 2, 'agar needs half the units the second time (3 → 2)');
  assert.ok(productOpen(g, 'plate') && productOpen(g, 'kit') && productOpen(g, 'dried'), 'earlier products stay listed');
  assert.ok(unlocked(g, 'room') && unlocked(g, 'bag'), 'gear and systems stay open');
  assert.equal(unlocked(g, 'bed'), false, 'beds are wine cap only');
  assert.ok(everMastered(g, 0));
  assert.equal(mk(g, 'plate', {}).sp, 'lions-mane', 'new vessels belong to the current species');
});

test('lots keep their own species: shelf life and price per lot', () => {
  setup(1);
  const g = newGame('normal');
  assert.ok(shelfLifeDays(g, 'lions-mane') > shelfLifeDays(g, 'pink-oyster') * 2);
  assert.equal(shelfLifeDays(g), shelfLifeDays(g, 'pink-oyster'));
});

test('wine cap beds: only in the yard at the bed stage, inoculated from a spawn bag, kept moist by rain or the hose', async () => {
  setup(5, c => { c.dev.god = true; return c; });
  const g = newGame('normal'); startSpecies(g, 'wine-cap', true); g.cash = 500;
  const yard = spotsIn('yard');
  assert.equal(zoneOpen(g, 'yard'), false); assert.equal(buildBed(g, yard[0], 'chips'), false);
  g.stage = 3; assert.ok(zoneOpen(g, 'yard'));
  assert.equal(buildBed(g, 0, 'chips'), false, 'not indoors');
  assert.ok(buildBed(g, yard[0], 'chips')); assert.equal(g.counts.hardwoodBed, 1);
  const bed = g.slots[yard[0]]; assert.equal(bed.kind, 'bed'); assert.equal(bed.state, 'ready');
  // a colonized wine cap spawn bag inoculates it
  g.slots[2] = mk(g, 'bag', { recipe: 'sawspawn', prep: 'ster', state: 'colonized', uses: 1, prog: 1 });
  assert.ok(inoculate(g, yard[0], 2)); assert.equal(bed.state, 'colonizing'); assert.equal(g.slots[2], null, 'spawn bag used up');
  assert.equal(g.counts.bedSpawned, 1);
  bed.water = 0.2; assert.ok(water(g, yard[0])); assert.equal(bed.water, 1); assert.equal(g.counts.watered, 1);
  let rained = 0; const { on } = await import('../js/sim/events.js'); on(t => { if (t === 'rain') rained++; });
  await run(g, 45, gg => { if (bed.water < 0.4) water(gg, yard[0]); });
  assert.ok(rained > 3, 'it rains now and then');
  assert.ok(g.counts.bedMoistDays > 20, 'moist colonizing days accrue (bed-stage units)');
  assert.ok(['pinning', 'growing', 'peak', 'overripe', 'resting'].includes(bed.state), `bed colonized after ~8 weeks (state ${bed.state})`);
  assert.equal(recipeOf(bed).name, 'Fresh hardwood chips (free)');
});

test('wine cap spawn bags don’t fruit indoors; pine beds teach a lesson and yield less', () => {
  setup(2, c => { c.dev.god = true; return c; });
  const g = newGame('normal'); startSpecies(g, 'wine-cap', true);
  const bag = mk(g, 'bag', { recipe: 'sawspawn', prep: 'ster', state: 'colonizing' });
  const env = { ...zoneEnv(g, 'closet') };
  for (let k = 0; k < 200 && bag.state === 'colonizing'; k++) stepVessel(g, bag, 0.2, env, 2);
  assert.equal(bag.state, 'colonized'); assert.equal(bag.uses, 1); assert.equal(productFor(bag), null, 'not sold as a grow kit');
  const pine = mk(g, 'bed', { recipe: 'pine', state: 'colonizing', water: 1 }), chips = mk(g, 'bed', { recipe: 'chips', state: 'colonizing', water: 1 });
  const yard = zoneEnv(g, 'yard');
  for (let k = 0; k < 20; k++) { stepVessel(g, pine, 0.2, yard, 13); stepVessel(g, chips, 0.2, yard, 14); }
  assert.ok(pine.prog < chips.prog * 0.5); assert.ok(g.learned.includes('pine_chips'));
  assert.ok(phaseDays(chips) > 40, 'beds take months of real time');
  for (const v of [pine, chips]) { v.state = 'peak'; v.flush = 1; v.q = { c: 1, h: 1, n: 1 }; }
  assert.ok(harvestKg(pine).kg < harvestKg(chips).kg / 2);
});

test('a v3 save that already mastered pinks migrates to the species model', () => {
  const g = migrateRun({ v: 3, g: { slots: [], speciesDone: true, mastered: ['agar'] } });
  assert.equal(g.species, 'pink-oyster'); assert.deepEqual(g.speciesMastered, ['pink-oyster']); assert.deepEqual(g.masteredBy, {});
});

// Headless proofs (careful player). Fewer seeds than the pink economy test: these runs are long.
const med = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
test('lion’s mane and wine cap are each masterable from a fresh start without going broke', () => {
  for (const start of ['lions-mane', 'wine-cap']) {
    const rs = [0, 1, 2].map(k => { setup(3000 + k); return autoplay({ strategy: 'careful', mode: 'normal', weeks: 30, start }); });
    assert.ok(rs.filter(r => r.speciesDone).length >= 2, `${start}: mastered in ${rs.filter(r => r.speciesDone).length}/3`);
    assert.ok(rs.every(r => !r.broke && r.minCash > 0), start);
  }
});
test('the full journey (pinks → lion’s mane → wine cap) is reachable and pays on Hardcore', () => {
  const rs = [0, 1, 2].map(k => { setup(4000 + k); return autoplay({ strategy: 'careful', mode: 'hardcore', weeks: 70, continueSpecies: true }); });
  assert.ok(rs.filter(r => r.speciesMastered.length === 3).length >= 2, rs.map(r => r.speciesMastered.join('>')).join(' | '));
  assert.ok(rs.every(r => !r.broke && r.minCash > 0));
  assert.ok(med(rs.map(r => r.profit)) > 500, `median cash profit ${med(rs.map(r => r.profit))}`);
});
