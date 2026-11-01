// Root Vue component. Player actions call the pure sim (S.g) and then update UI state.
import template from './template.js';
import { ui, S, persist, nextModal } from './state.js';
import { CONFIG, ISF } from '../config.js';
import { RULES } from '../sim/rules.js';
import * as sim from '../sim/game.js';
import { envNow, baseTemp, tStat, cStat, hStat } from '../sim/environment.js';
import { isBlock, hazard, mediumSpeed } from '../sim/contamination.js';
import { SPEEDS, seasonDays, dayOfWeek, toGame, faster, slower } from '../sim/clock.js';
import { unlocked, unlockWeek, startCash, canSalvage } from '../sim/stages.js';
import { phaseDays } from '../sim/growth.js';
import { canShake, vName } from '../sim/growth.js';
import { money, fmtLb, shelfLifeDays } from '../sim/economy.js';
import * as eco from '../sim/economy.js';
import { layers, status, badge, barPct, barColor, slotCls, tipFor } from './views.js';
import { manifest, src } from '../images.js';
import { unlock, play, setMuted } from '../audio.js';
import { reduceMotion } from '../fx.js';
import { GUIDE, NUMS, PREP } from '../content/guide.js';
import { MYTHS } from '../content/myths.js';
import { LESSONS, LESSON_IDS } from '../content/lessons.js';
import { RECIPES, BUYABLE, MEDIA, SPECIES, SUPPLIES } from '../content/species/pink-oyster.js';
import { WEEK_INTRO } from '../content/weeks.js';

const NB_TABS = [['guide', 'Field guide'], ['lessons', 'Lessons'], ['cheat', 'Cheat sheet'], ['art', 'Art']];

/* ---------- actions shared by the component and keyboard ---------- */
export function start(mode = (S.g && S.g.mode) || 'normal') {
  unlock(); S.g = sim.newGame(mode); ui.screen = 'play'; ui.sheet = null; ui.paused = false; ui.autoPaused = false; ui.newBest = false;
  ui.modalQueue = []; ui.modal = weekModal(S.g.week, true);
  ISF.track('runStart', { mode }); window.scrollTo({ top: 0 });
}
/** Week-intro card: what opens this week (null when nothing new). */
export function weekModal(week, first = false) {
  const cards = [];
  if (first) cards.push(WEEK_INTRO.start);
  const news = ['jar', 'bag', 'room'].filter(w => unlockWeek(w) === week || (first && unlockWeek(w) < week));
  news.forEach(w => cards.push(WEEK_INTRO[w]));
  return cards.length ? { type: 'week', week, cards } : null;
}
export function setSpeed(sp) { ui.speed = sp; ui.paused = false; ui.autoPaused = false; play('tap'); }
export const speedUp = () => setSpeed(faster(ui.speed));
export const speedDown = () => setSpeed(slower(ui.speed));
const done = ok => { if (ok !== false) ui.sheet = null; return ok; };
export function openSheet(i) { ui.sheet = { slot: i }; }
export function tapSlot(i) {
  unlock(); const g = S.g, v = g.slots[i];
  if (!v) return openSheet(i);
  if (v.state === 'lost') return sim.toss(g, i);
  if (v.contam.vis > 0) return openSheet(i);
  if (v.state === 'peak' || v.state === 'overripe') return sim.harvest(g, i);
  if (v.state === 'ready') { const src = sim.sources(g, v); return src.length === 1 && !(src[0].v.contam.vis > 0) ? sim.inoculate(g, i, src[0].i) : openSheet(i); }
  if (canShake(v)) return sim.shake(g, i);
  play('tap'); openSheet(i);
}
export function setHeater(h) { S.g.heater = h; play('tap'); }
export function toggleMute() { ui.muted = !ui.muted; setMuted(ui.muted); persist(); unlock(); }
export function dryAll() { return eco.dryAll(S.g); }

export const App = {
  template,
  data() {
    return { ui, S, CONFIG, manifest, RULES, GUIDE, NUMS, PREP, MYTHS, LESSONS, LESSON_IDS, RECIPES, BUYABLE, MEDIA, NB_TABS, SPEEDS, SPECIES, SUPPLIES };
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
    season() { return seasonDays(); },
    dayOfWeek() { return dayOfWeek(S.g.day); },
    clockText() { const f = S.g.day % 1; const h = Math.floor(6 + f * 16); return (h % 12 || 12) + (h < 12 ? ' am' : ' pm'); },
    roomOpen() { return unlocked(S.g, 'room'); },
    shelfLife() { return +shelfLifeDays(S.g).toFixed(1); },
    timeline() {
      const B = SPECIES.bio, r = d => toGame(d * CONFIG.growth.growthScale).toFixed(1);
      return [['Agar plate (MEA)', B.plateReal, r(B.plateDays)], ['Grain jar', B.jarReal, r(B.jarDays)], ['Straw bag', RECIPES.straw.colReal, r(RECIPES.straw.colDays)],
        ['Masters Mix bag', RECIPES.masters.colReal, r(RECIPES.masters.colDays)], ['Pinning', B.pinReal, r(B.pinDays)], ['Pins → harvest', B.growReal, r(B.growDays)], ['Rest between flushes', B.restReal, r(B.restDays)],
        ['Fresh shelf life', '1–3 days', toGame(CONFIG.economy.shelfLife).toFixed(1)]];
    },
    env() { return envNow(S.g); },
    baseTemp() { return baseTemp(S.g); },
    tS() { return tStat(this.env.temp); }, cS() { return cStat(this.env.co2); }, hS() { return hStat(this.env.rh); },
    marketIn() { return Math.max(0, S.g.nextMarket - S.g.day); },
    freshKg() { return S.g.lots.reduce((a, l) => a + l.kg, 0); },
    tip() { return tipFor(S.g); },
    sv() { return ui.sheet ? S.g.slots[ui.sheet.slot] : null; },
    sheetTitle() { const v = this.sv; return v ? vName(v) : 'Empty shelf'; },
    sheetImg() { const v = this.sv; if (!v) return 'plate_empty'; return layers(v).filter(l => l.id !== 'mold_overlay').pop().id; },
    sheetGuide() { const v = this.sv; if (!v) return null; const id = v.kind === 'plate' ? 'agar' : v.kind === 'jar' ? 'grain' : isBlock(v) ? 'fruit' : 'sub'; return GUIDE.find(x => x.id === id); },
    sheetFacts() {
      const v = this.sv, out = [['Status', status(S.g, v)]];
      if (v.kind === 'plate') out.push(['Medium', MEDIA[v.medium].name]);
      if (v.kind !== 'plate') out.push(['Prep', v.prep === 'ster' ? 'Sterilized' : 'Pasteurized']);
      if (v.kind === 'bag') out.push(['Substrate', RECIPES[v.recipe].name]);
      if (v.state === 'colonizing') out.push(['Colonized', Math.round(v.prog * 100) + '%']);
      if (isBlock(v)) out.push(['Flush', String(v.flush)]);
      const dur = phaseDays(v);
      if (dur && ['colonizing', 'pinning', 'growing'].includes(v.state)) { const left = Math.max(0, (1 - v.prog) * dur); out.push(['Time left', `~${left.toFixed(1)} real d (${toGame(left).toFixed(1)} game d)`]); }
      if (v.salvage < 1) out.push(['Salvaged', Math.round(v.salvage * 100) + '% yield']);
      out.push(['Mold', v.contam.vis > 0 ? 'Visible!' : 'None visible']);
      return out;
    },
    sheetNote() {
      const v = this.sv; if (!v) return '';
      if (v.state === 'colonized') return v.kind === 'plate' ? 'Tap a ready grain jar to spawn from this plate.' : 'Tap a ready substrate bag to spawn from this jar.';
      if (v.state === 'pinning' && this.env.temp < SPECIES.fruiting.minTemp) return 'Pinks won’t pin below ~64°F. Warm the room.';
      if (v.state === 'queued') return 'Waiting for the pressure cooker to finish its current batch.';
      return '';
    },
    cookerLine() { const g = S.g; return `${g.cooker.batch.length}/${CONFIG.equipment.cookerCapacity} cooking, ${g.queue.length} queued`; },
    nbGuide() { return GUIDE.find(x => x.id === ui.nbStage) || GUIDE[0]; },
    lessonCount() { return LESSON_IDS.filter(id => ui.lessons[id]).length; },
    artFound() { return manifest.images.filter(m => manifest.status[m.id] === 'loaded').length; },
    profit() { return S.g.cash - S.g.startCash; },
    lostTotal() { return Object.values(S.g.stats.lost).reduce((a, b) => a + b, 0); },
    rank() {
      const r = this.profit / CONFIG.economy.targetProfit;
      if (r >= 1) return ['Pleurotus Whisperer', 'Clean technique, a warm room and fast sales. This is a market-table operation.'];
      if (r >= 0.6) return ['Flush Master', 'A solid season with a couple of costly habits. Fix the rows below and you’re top tier.'];
      if (r >= 0.25) return ['Grain Jar Apprentice', 'You can grow mycelium. Contamination, conditions or timing still cost you.'];
      return ['Spore Tourist', 'The mushrooms weren’t the problem. Read the lessons below, then try another season.'];
    },
  },
  methods: {
    src, money, fmtLb, start, setSpeed, unlockWeek, layers, badge, barColor, vName, isBlock, canShake, tapSlot, setHeater, toggleMute,
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
    buildSab() { sim.buildSab(S.g); },
    salvage(i) { done(sim.salvage(S.g, i)); },
    canSalvage(v) { return canSalvage(S.g, v); },
    isOpen(what) { return unlocked(S.g, what); },
    gameDays(real) { return toGame(real).toFixed(1); },
    closeSheet() { ui.sheet = null; },
    slotAria(v, i) { return `Shelf ${i + 1}: ` + (v ? `#${v.id} ${vName(v)}, ${status(S.g, v)}` : 'empty'); },
    plateDaysFor(k) { return +(SPECIES.bio.plateDays / mediumSpeed(k) * CONFIG.growth.growthScale).toFixed(1); },
    lotCls(l) { const left = shelfLifeDays(S.g) - l.age; return left < 0.75 ? 'dying' : left < 1.5 ? 'old' : ''; },
    guideName(id) { const x = GUIDE.find(s => s.id === id); return x ? x.name : id; },
    dbg(v) { const e = envNow(S.g); return `h=${hazard(S.g, v, e).toFixed(3)} on=${v.contam.onset == null ? '-' : v.contam.onset.toFixed(1)}\n${v.contam.why || ''} st=${v.state} t=${v.t.toFixed(2)}`; },
    doTip() {
      const t = this.tip; unlock();
      if (t.slot != null) return tapSlot(t.slot);
      if (t.dry) return dryAll();
      if (t.heat) { if (S.g.heater < 2) setHeater(S.g.heater + 1); return; }
      if (t.room) { const el = document.getElementById('room'); el && el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }); }
    },
    togglePause() { ui.paused = !ui.paused; if (!ui.paused) ui.autoPaused = false; },
    resume() { ui.paused = false; ui.autoPaused = false; unlock(); },
    quit() { ui.paused = false; ui.autoPaused = false; sim.endSeason(S.g, 'season'); },
    openNb(tab) { if (tab) ui.nbTab = tab; ui.notebook = true; },
    closeModal() { nextModal(); },
    answer(v) { const m = ui.modal; m.ans = v; sim.answerQuiz(S.g, m.m, v); },
    coffee(yes) { nextModal(); sim.acceptCoffee(S.g, yes); },
  },
};
