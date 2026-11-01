// Root Vue component. Player actions call the pure sim (S.g) and then update UI state.
import template from './template.js';
import { ui, S, persist, nextModal, showModal } from './state.js';
import { CONFIG, ISF } from '../config.js';
import { RULES } from '../sim/rules.js';
import * as sim from '../sim/game.js';
import { tStat, cStat, hStat } from '../sim/environment.js';
import { SPOTS, zoneOf, spotsIn, zoneOpen, zoneEnv, zoneFit, spotOpen, houseTemp } from '../sim/zones.js';
import { buy, canBuy, priceOf as gearPrice, workspace, canSterilizeBags } from '../sim/equipment.js';
import * as shop from '../sim/shop.js';
import { ZONES, ZONE_BY_ID } from '../content/zones.js';
import { EQUIPMENT, EQUIPMENT_ORDER } from '../content/equipment.js';
import { isBlock, hazard, mediumSpeed } from '../sim/contamination.js';
import { SPEEDS, dayOfWeek, toGame, faster, slower } from '../sim/clock.js';
import { unlocked, startCash, canSalvage, currentStage, opensAt, ladder } from '../sim/stages.js';
import { checklist, unitsNeeded, forceMaster } from '../sim/mastery.js';
import { STAGES, PRODUCTS, ladderOf } from '../content/stages.js';
import { loadRun, saveRun, clearRun } from '../save.js';
import { setAdminVisible } from '../admin-help.js';
import { phaseDays } from '../sim/growth.js';
import { canShake, vName } from '../sim/growth.js';
import { money, fmtLb, shelfLifeDays } from '../sim/economy.js';
import * as eco from '../sim/economy.js';
import { layers, status, badge, barPct, barColor, slotCls, tipFor, fitOf, zoneReadout } from './views.js';
import { manifest, src } from '../images.js';
import { unlock, play, setMuted } from '../audio.js';
import { reduceMotion } from '../fx.js';
import { GUIDE, NUMS, PREP } from '../content/guide.js';
import { MYTHS } from '../content/myths.js';
import { LESSONS, LESSON_IDS } from '../content/lessons.js';
import { MEDIA, SUPPLIES } from '../content/species/pink-oyster.js';
import { spg, packOf, nextSpecies, recipeOf, SPECIES_BY } from '../content/species/index.js';
import { WEEK_INTRO } from '../content/weeks.js';
import { CAST } from '../content/story.js';
import { TUTORIAL } from '../content/tutorial.js';
import { isStory, scene } from '../director.js';
import { startTutorial, finishTutorial, nextStep, tutStep } from './coach.js';

const NB_TABS = [['guide', 'Field guide'], ['lessons', 'Lessons'], ['cheat', 'Cheat sheet'], ['art', 'Art']];

/* ---------- actions shared by the component and keyboard ---------- */
export function start(mode = (S.g && S.g.mode) || 'normal') {
  const runType = ui.runType === 'expert' && !ui.expert ? 'free' : ui.runType;
  unlock(); S.g = sim.newGame(mode, runType); ui.screen = 'play'; ui.sheet = null; ui.paused = false; ui.autoPaused = false; ui.newBest = false;
  ui.modalQueue = []; ui.modal = null; ui.tut = null; ui.coach = null;
  showScene(scene(S.g, 'intro')); showModal(stageModal(0, true));
  if (runType === 'tutorial') startTutorial();
  if (ui.playMode !== 'advanced') ui.speed = 4; // quick play
  saveRun(S.g); ui.saved = savedSummary();
  ISF.track('runStart', { mode, playMode: ui.playMode, runType }); window.scrollTo({ top: 0 });
}
/** Resume the autosaved run. */
export function resume() {
  const g = loadRun(); if (!g) return false;
  unlock(); S.g = g; ui.screen = 'play'; ui.sheet = null; ui.modal = null; ui.modalQueue = []; ui.paused = true; ui.autoPaused = false; ui.tut = null; ui.coach = null;
  window.scrollTo({ top: 0 }); return true;
}
/** Basic (quick play) or Advanced (every option + admin panel). UI only: the simulation is identical. */
export function setPlayMode(m) { ui.playMode = m; persist(); setAdminVisible(m === 'advanced'); play('tap'); }
/** Story/tutorial/free/expert: picked on the setup screen, stored per run (g.runType). */
export function setRunType(t) { if (t === 'expert' && !ui.expert) return; ui.runType = t; play('tap'); }
/** Queue a story scene as a dialogue modal (one line at a time). */
export function showScene(s) { if (s && s.lines.length) showModal({ type: 'scene', key: s.key, lines: s.lines, i: 0 }); }
export const ESSENTIAL_GEAR = ['sab', 'cooker23', 'rack', 'hygrometer', 'tent', 'heatmat', 'humidifier', 'dehydrator'];
export function savedSummary() {
  const g = loadRun(); if (!g || g.over) return null;
  const L = ladderOf(g.species);
  return { week: g.week, stage: L[Math.min(g.stage, L.length - 1)].name, species: packOf(g.species).name, mode: g.mode, cash: g.cash, runType: g.runType || 'free' };
}
export function autosave() { if (S.g && ui.screen === 'play' && !S.g.over) { saveRun(S.g); ui.saved = savedSummary(); } }
/** Intro card for a stage: what it teaches and what it opens. */
export function stageModal(s, first = false) {
  const cards = [], g = S.g, L = ladder(g);
  if (first) cards.push(WEEK_INTRO.start);
  if (s === 0 && g && g.species && g.species !== 'pink-oyster' && WEEK_INTRO[g.species]) cards.push(WEEK_INTRO[g.species]);
  opensAt(s, g).forEach(w => { if (WEEK_INTRO[w]) cards.push(WEEK_INTRO[w]); });
  if (!first && !cards.length) cards.push({ title: `New stage: ${L[s].name}`, lines: ['A new stage, same rule: the mentor’s list first, then results.'] });
  return cards.length ? { type: 'week', week: g ? g.week : 0, stage: L[s].name, cards } : null;
}
export const SPOT_KEYS = '1234567890-=';
export function openShop() { ui.shop = true; play('tap'); }
export function setSpeed(sp) { ui.speed = sp; ui.paused = false; ui.autoPaused = false; play('tap'); }
export const speedUp = () => setSpeed(faster(ui.speed));
export const speedDown = () => setSpeed(slower(ui.speed));
const done = ok => { if (ok !== false) ui.sheet = null; return ok; };
export function openSheet(i) { ui.sheet = { slot: i }; ui.moreOpts = false; }
export function tapSlot(i) {
  unlock(); const g = S.g, v = g.slots[i];
  if (!v && !spotOpen(g, i)) { if ((zoneOf(i) === 'tent' && unlocked(g, 'room')) || (zoneOf(i) === 'closet')) openShop(); return; }
  if (!v) return openSheet(i);
  if (v.state === 'lost') return sim.toss(g, i);
  if (v.kind === 'bed' && v.water < 0.3 && !['spent', 'peak', 'overripe'].includes(v.state) && !(v.contam.vis > 0)) return sim.water(g, i);
  if (v.contam.vis > 0) return openSheet(i);
  if (v.state === 'peak' || v.state === 'overripe') return sim.harvest(g, i);
  if (v.state === 'ready') { const src = sim.sources(g, v); return src.length === 1 && !(src[0].v.contam.vis > 0) ? sim.inoculate(g, i, src[0].i) : openSheet(i); }
  if (canShake(v)) return sim.shake(g, i);
  play('tap'); openSheet(i);
}
export function masterNow() { if (S.g) forceMaster(S.g); }
export function setHeater(h) { S.g.heater = h; play('tap'); }
export function toggleMute() { ui.muted = !ui.muted; setMuted(ui.muted); persist(); unlock(); }
export function dryAll() { return eco.dryAll(S.g); }
/** Move on to the next species (after mastering the current one). */
export function startNextSpecies() { if (S.g && sim.startSpecies(S.g)) { play('good'); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); } }

export const App = {
  template,
  data() {
    return { ui, S, CONFIG, manifest, RULES, GUIDE, NUMS, PREP, MYTHS, LESSONS, LESSON_IDS, MEDIA, NB_TABS, SPEEDS, SUPPLIES, ZONES, EQUIPMENT, EQUIPMENT_ORDER, STAGES, PRODUCTS, CAST, TUTORIAL };
  },
  computed: {
    g() { return S.g; },
    MODES_UI() {
      return [
        { id: 'relaxed', name: 'Relaxed', cash: startCash('relaxed'), blurb: 'Mold costs quality, not everything: cut it out and keep going. Fresh product lasts longer.' },
        { id: 'normal', name: 'Normal', cash: startCash('normal'), blurb: 'Losses happen, like a real first year. Gentle mold odds in weeks 0–1. Recommended.' },
        { id: 'hardcore', name: 'Hardcore', cash: startCash('hardcore'), blurb: 'Tight money, full losses, and no grace after week 0.' },
      ];
    },
    RUN_TYPES_UI() {
      return [
        { id: 'tutorial', name: 'Tutorial', blurb: 'Story mode, plus a paused walkthrough of week 0. Best for a first run.' },
        { id: 'story', name: 'Story', blurb: 'Your mentor next door and a confidently wrong forum guru, in short scenes.' },
        { id: 'free', name: 'Free play', blurb: 'Same systems, no script. Market customers ask the myth questions.' },
        { id: 'expert', name: 'Expert', locked: !ui.expert, blurb: ui.expert ? 'Free play without the “Next:” coaching line. Liquid culture comes in a later update.' : 'Unlocks when you master your first species.' },
      ];
    },
    story() { return isStory(S.g); },
    scLine() { const m = ui.modal; return m && m.type === 'scene' ? m.lines[m.i] : null; },
    tutStep() { return ui.tut ? TUTORIAL[ui.tut.k] : null; },
    /** Keep toasts off the tutorial card and its highlight ring. */
    toastSpot() { const c = ui.coach; if (!c || c.top) return ''; return c.ring && c.ring.y < innerHeight * 0.3 ? 'mid' : 'up'; },
    showTip() { return CONFIG.look.tips && S.g.runType !== 'expert'; },
    sp() { return spg(S.g); },
    nextSp() { const n = nextSpecies(S.g.species); return n ? packOf(n) : null; },
    ladder() { return ladder(S.g); },
    isYard() { return !!this.sheetZone && this.sheetZone.id === 'yard'; },
    advanced() { return ui.playMode === 'advanced'; },
    showAll() { return this.advanced || ui.moreOpts; },
    mediaShown() { return this.showAll ? MEDIA : { mea: MEDIA.mea }; },
    bagsShown() { const P = this.sp; return this.showAll ? P.buyable : Object.fromEntries(P.basic.map(k => [k, P.buyable[k]])); },
    gearShown() { return this.advanced || ui.moreGear ? EQUIPMENT_ORDER : EQUIPMENT_ORDER.filter(id => ESSENTIAL_GEAR.includes(id) || S.g.gear[id]); },
    weekPct() { return (S.g.day % RULES.daysPerWeek) / RULES.daysPerWeek * 100; },
    stage() { return currentStage(S.g); },
    stageList() { return checklist(S.g); },
    need() { return unitsNeeded(S.g); },
    listDone() { return this.stageList.every(i => i.done); },
    products() {
      return Object.entries(PRODUCTS).map(([id, p]) => ({ id, ...p, open: shop.productOpen(S.g, id), stock: S.g.stock[id].length,
        price: shop.priceOf(S.g, id), base: shop.basePrice(id), rate: shop.salesRate(S.g, id), stageName: STAGES[p.stage].name }));
    },
    sheetProduct() { const v = this.sv; const p = v && shop.productFor(v); return p ? { id: p, open: shop.productOpen(S.g, p), price: shop.priceOf(S.g, p), name: PRODUCTS[p].name, stageName: STAGES[PRODUCTS[p].stage].name } : null; },
    dayOfWeek() { return dayOfWeek(S.g.day); },
    clockText() { const f = S.g.day % 1; const h = Math.floor(6 + f * 16); return (h % 12 || 12) + (h < 12 ? ' am' : ' pm'); },
    roomOpen() { return unlocked(S.g, 'room'); },
    shelfLife() { return +shelfLifeDays(S.g).toFixed(1); },
    timeline() {
      const P = this.sp, B = P.bio, r = d => toGame(d * CONFIG.growth.growthScale).toFixed(1);
      const subs = Object.values(P.recipes).filter(x => x.colDays && x.be !== undefined).slice(0, 3).map(x => [x.name + (x.bed ? ' (bed)' : ' bag'), x.colReal, r(x.colDays)]);
      return [['Agar plate (MEA)', B.plateReal, r(B.plateDays)], ['Grain jar', B.jarReal, r(B.jarDays)], ...subs,
        ['Pinning', B.pinReal, r(B.pinDays)], ['Pins → harvest', B.growReal, r(B.growDays)], ['Rest between flushes', B.restReal, r(B.restDays)],
        ['Fresh shelf life', `~${(CONFIG.economy.shelfLife * P.shelfMult).toFixed(1)} days`, toGame(CONFIG.economy.shelfLife * P.shelfMult).toFixed(1)]];
    },
    tentEnv() { return zoneEnv(S.g, 'tent'); },
    env() { return this.tentEnv; },
    houseTemp() { return houseTemp(S.g); },
    cooking() { return S.g.cookers.some(k => k.batch.length); },
    workspaceName() { return workspace(S.g); },
    canBags() { return canSterilizeBags(S.g); },
    tS() { return tStat(this.tentEnv.temp, this.sp.fruiting); }, cS() { return cStat(this.tentEnv.co2); }, hS() { return hStat(this.tentEnv.rh); },
    sheetZone() { return ui.sheet ? ZONE_BY_ID[zoneOf(ui.sheet.slot)] : null; },
    sheetFit() { return this.sv ? zoneFit(S.g, zoneOf(ui.sheet.slot), this.sv) : { level: 'good', note: '' }; },
    sheetZoneNote() { const z = this.sheetZone; if (!z || this.sv) return ''; const r = zoneReadout(S.g, z.id); return `${z.name}: ${r.temp}, ${r.rh}, ${r.clean}. ${z.purpose}`; },
    moveTargets() {
      const v = this.sv; if (!v || v.kind === 'bed') return [];
      return SPOTS.map((sp, i) => ({ i, sp })).filter(t => t.i !== ui.sheet.slot && !S.g.slots[t.i] && spotOpen(S.g, t.i))
        .filter((t, k, a) => a.findIndex(x => x.sp.zone === t.sp.zone) === k) // first free spot per zone
        .map(t => ({ i: t.i, zone: ZONE_BY_ID[t.sp.zone].name, fit: zoneFit(S.g, t.sp.zone, v) }));
    },
    marketIn() { return Math.max(0, S.g.nextMarket - S.g.day); },
    freshKg() { return S.g.lots.reduce((a, l) => a + l.kg, 0); },
    tip() { return tipFor(S.g); },
    sv() { return ui.sheet ? S.g.slots[ui.sheet.slot] : null; },
    sheetTitle() { const v = this.sv; return v ? vName(v) : 'Empty spot · ' + (this.sheetZone ? this.sheetZone.name : ''); },
    sheetImg() { const v = this.sv; if (!v) return this.isYard ? 'bed' : 'plate_empty'; return layers(v).filter(l => l.id !== 'mold_overlay').pop().id; },
    sheetGuide() { const v = this.sv; if (!v || v.kind === 'bed') return null; const id = v.kind === 'plate' ? 'agar' : v.kind === 'jar' ? 'grain' : isBlock(v) ? 'fruit' : 'sub'; return GUIDE.find(x => x.id === id); },
    sheetFacts() {
      const v = this.sv, out = [['Status', status(S.g, v)]];
      if (v.kind === 'plate') out.push(['Medium', MEDIA[v.medium].name]);
      if (v.kind !== 'plate' && v.kind !== 'bed') out.push(['Prep', v.prep === 'ster' ? 'Sterilized' : 'Pasteurized']);
      if (v.kind === 'bag' || v.kind === 'bed') out.push([v.kind === 'bed' ? 'Bed' : 'Substrate', recipeOf(v).name]);
      if (v.sp && v.sp !== 'pink-oyster') out.push(['Species', packOf(v.sp).name]);
      if (v.kind === 'bed') out.push(['Moisture', v.water >= 0.5 ? 'Moist' : v.water >= 0.25 ? 'Drying' : 'Dry!']);
      if (v.state === 'colonizing') out.push(['Colonized', Math.round(v.prog * 100) + '%']);
      if (isBlock(v) || (v.kind === 'bed' && v.flush)) out.push(['Flush', String(v.flush)]);
      const dur = phaseDays(v);
      if (dur && ['colonizing', 'pinning', 'growing'].includes(v.state)) { const left = Math.max(0, (1 - v.prog) * dur); out.push(['Time left', `~${left.toFixed(1)} real d (${toGame(left).toFixed(1)} game d)`]); }
      if (v.salvage < 1) out.push(['Salvaged', Math.round(v.salvage * 100) + '% yield']);
      out.push(['Mold', v.contam.vis > 0 ? 'Visible!' : 'None visible']);
      return out;
    },
    sheetNote() {
      const v = this.sv; if (!v) return '';
      if (v.state === 'colonized') return v.kind === 'plate' ? 'Tap a ready grain jar to spawn from this plate.' : 'Tap a ready substrate bag to spawn from this jar.';
      if (v.kind === 'bed') return v.state === 'ready' ? 'Inoculate it with a colonized spawn bag. Then keep it moist.' : v.state === 'pinning' && v.water < 0.5 ? 'Colonized. Wine caps flush after a good soak: rain, or the hose.' : '';
      const F = packOf(v.sp).fruiting, t = zoneEnv(S.g, zoneOf(ui.sheet.slot)).temp;
      if (v.state === 'pinning' && t < F.minTemp) return `${packOf(v.sp).name} won’t pin below ~${F.minTemp}°F. Warm it up.`;
      if (v.state === 'pinning' && F.maxTemp && t > F.maxTemp) return `${packOf(v.sp).name} won’t pin above ~${F.maxTemp}°F. Cool it down: heat mat off.`;
      if (v.state === 'queued') return 'Waiting for the pressure cooker to finish its current batch.';
      return '';
    },
    cookerLine() { const g = S.g; return `${g.cookers.length ? g.cookers.reduce((a, k) => a + k.batch.length, 0) + ' cooking, ' : ''}${g.queue.length} queued`; },
    nbGuide() { return GUIDE.find(x => x.id === ui.nbStage) || GUIDE[0]; },
    lessonCount() { return LESSON_IDS.filter(id => ui.lessons[id]).length; },
    artFound() { return manifest.images.filter(m => manifest.status[m.id] === 'loaded').length; },
    profit() { return S.g.cash - S.g.startCash + (S.g.stats.gear || 0); },
    lostTotal() { return Object.values(S.g.stats.lost).reduce((a, b) => a + b, 0); },
  },
  methods: {
    src, money, fmtLb, start, setSpeed, openShop, layers,
    priceOf(id) { return gearPrice(id); },
    resumeRun() { resume(); },
    nextStageName(s) { const L = ladder(S.g); return L[s] ? L[s].name : ''; },
    listIt(i) { done(shop.listVessel(S.g, i)); },
    listDried() { shop.listDried(S.g); },
    bumpPrice(id, d) { shop.setPrice(S.g, id, shop.priceOf(S.g, id) + d); },
    setMarket(m) { S.g.marketMode = m; play('tap'); },
    setPlayMode, setRunType,
    sceneNext() { const m = ui.modal; if (m.i < m.lines.length - 1) { m.i++; play('tap'); } else nextModal(); },
    sceneSkip() { nextModal(); },
    tutNext() { nextStep(); },
    tutSkip() { finishTutorial(true); },
    cast(who) { return CAST[who]; },
    autoClimate() { const g = S.g, c = spg(g).climate || packOf('pink-oyster').climate; g.heater = g.gear.heatmat ? c.heater : 0; g.fae = c.fae; g.mist = g.gear.humidifier ? c.mist : c.handMist; play('good'); },
    buildBed(i, t) { done(sim.buildBed(S.g, i, t)); },
    waterBed(i) { done(sim.water(S.g, i)); },
    startNextSpecies,
    spName(id) { return packOf(id).name; },
    keepGrowing() { nextModal(); }, spotsIn, badge, barColor, vName, isBlock, canShake, tapSlot, setHeater, toggleMute,
    status(v) { return status(S.g, v); },
    barPct(v) { return barPct(S.g, v); },
    slotCls(v) { return slotCls(S.g, v); },
    sources(v) { return sim.sources(S.g, v); },
    pourPlate(i, m) { done(sim.pourPlate(S.g, i, m)); },
    prepJar(i, p) { done(sim.prepJar(S.g, i, p)); },
    prepBag(i, r, p) { done(sim.prepBag(S.g, i, r, p)); },
    inoculate(ti, si) { done(sim.inoculate(S.g, ti, si)); },
    toss(i) { done(sim.toss(S.g, i)); },
    cutEdge(i) { done(sim.cutEdge(S.g, i)); },
    shake(i) { done(sim.shake(S.g, i)); },
    harvest(i) { done(sim.harvest(S.g, i)); },
    soak(i) { done(sim.soak(S.g, i)); },
    retire(i) { done(sim.retire(S.g, i)); },
    dryAll,
    fitOf(v) { return fitOf(S.g, v); },
    readout(zid) { return zoneReadout(S.g, zid); },
    zoneIsOpen(zid) { return zoneOpen(S.g, zid); },
    spotIsOpen(i) { return spotOpen(S.g, i); },
    zoneOfSpot(i) { return zoneOf(i); },
    zoneById(id) { return ZONE_BY_ID[id]; },
    keyFor(i) { return spotOpen(S.g, i) ? SPOT_KEYS[i] : ''; },
    lockText(z) { return z.locked || (z.needs === 'tent' ? (unlocked(S.g, 'room') ? 'Buy a grow tent in the shop to open these spots.' : `Fruiting starts at the ${STAGES[3].name.toLowerCase()} stage. The tent is sold then.`) : 'Locked'); },
    buyState(id) { return canBuy(S.g, id); },
    buyGear(id) { buy(S.g, id); },
    moveTo(from, to) { done(sim.move(S.g, from, to)); },
    salvage(i) { done(sim.salvage(S.g, i)); },
    canSalvage(v) { return canSalvage(S.g, v); },
    isOpen(what) { return unlocked(S.g, what); },
    gameDays(real) { return toGame(real).toFixed(1); },
    closeSheet() { ui.sheet = null; },
    slotAria(v, i) { const z = ZONE_BY_ID[zoneOf(i)]; return `${z.name}, spot ${SPOTS[i].k + 1}: ` + (v ? `#${v.id} ${vName(v)}, ${status(S.g, v)}` : spotOpen(S.g, i) ? 'empty' : 'locked'); },
    plateDaysFor(k) { return +(this.sp.bio.plateDays / mediumSpeed(k) * CONFIG.growth.growthScale).toFixed(1); },
    lotCls(l) { const left = shelfLifeDays(S.g) - l.age; return left < 0.75 ? 'dying' : left < 1.5 ? 'old' : ''; },
    guideName(id) { const x = GUIDE.find(s => s.id === id); return x ? x.name : id; },
    dbg(v) { const e = zoneEnv(S.g, zoneOf(S.g.slots.indexOf(v))); return `h=${hazard(S.g, v, e).toFixed(3)} on=${v.contam.onset == null ? '-' : v.contam.onset.toFixed(1)}\n${v.contam.why || ''} st=${v.state} t=${v.t.toFixed(2)}`; },
    doTip() {
      const t = this.tip; unlock();
      if (t.slot != null) return tapSlot(t.slot);
      if (t.dry) return dryAll();
      if (t.heat) { if (S.g.heater < 2) setHeater(S.g.heater + 1); return; }
      if (t.shop) return openShop();
      if (t.mastery) { const el = document.getElementById('mastery'); el && el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }); return; }
      if (t.room) { const el = document.getElementById('room'); el && el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }); }
    },
    togglePause() { ui.paused = !ui.paused; if (!ui.paused) ui.autoPaused = false; },
    resume() { ui.paused = false; ui.autoPaused = false; unlock(); },
    quit() { ui.paused = false; ui.autoPaused = false; sim.endSeason(S.g, 'season'); },
    openNb(tab) { if (tab) ui.nbTab = tab; ui.notebook = true; },
    closeModal() { nextModal(); },
    answer(v) { const m = ui.modal; m.ans = v; sim.answerQuiz(S.g, m.m, v); },
    coffee(yes) { nextModal(); sim.acceptCoffee(S.g, yes); showScene(scene(S.g, yes ? 'coffee_yes' : 'coffee_no')); },
  },
};
