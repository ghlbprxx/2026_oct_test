// Practice setup: presets up front, custom tables/range/time folded away.
import { settings, tablesLabel } from '../core/state.js';
import { presets, activePreset, applyPreset, toggleTable, selectAll, clearTables, bump, bestForSetup, startGame } from '../core/game.js';

export default {
  setup() {
    return { settings, tablesLabel, presets, activePreset, applyPreset, toggleTable, selectAll, clearTables, bump, bestForSetup, startGame };
  },
  template: `
<main class="stack">
  <div>
    <back-link to="home">Home</back-link>
    <h1 class="page-title">Times table practice</h1>
    <p class="page-sub">Pick a set and go. Fast answers earn bonus points.</p>
  </div>

  <section class="panel">
    <h2 class="label">Choose a set</h2>
    <div class="presets">
      <button type="button" v-for="p in presets" :key="p.id" class="preset" :class="{on: activePreset===p.id}" :aria-pressed="activePreset===p.id ? 'true' : 'false'" @click="applyPreset(p)">
        <span class="preset-name">{{ p.name }}</span>
        <span class="preset-tables">{{ p.label }} · ×{{ p.from }}–{{ p.to }}</span>
      </button>
    </div>

    <details class="custom">
      <summary><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>Customize tables, range and time</summary>
      <div class="custom-body">
        <div class="row-head">
          <h3 class="label">Times tables</h3>
          <div>
            <button type="button" class="link" @click="selectAll">All</button>
            <button type="button" class="link" @click="clearTables">Clear</button>
          </div>
        </div>
        <div class="chips">
          <button type="button" v-for="n in 12" :key="n" class="chip" :class="{on: settings.tables.includes(n)}" :aria-pressed="settings.tables.includes(n) ? 'true' : 'false'" @click="toggleTable(n)">{{ n }}s</button>
        </div>
        <div class="settings-grid">
          <div>
            <h3 class="label">Multiply by</h3>
            <div class="range">
              <div class="stepper">
                <button type="button" @click="bump('from',-1)" :disabled="settings.from<=0" aria-label="Lower the starting number">−</button>
                <output aria-label="Start">{{ settings.from }}</output>
                <button type="button" @click="bump('from',1)" :disabled="settings.from>=settings.to" aria-label="Raise the starting number">+</button>
              </div>
              <span class="range-word">to</span>
              <div class="stepper">
                <button type="button" @click="bump('to',-1)" :disabled="settings.to<=Math.max(1,settings.from)" aria-label="Lower the ending number">−</button>
                <output aria-label="End">{{ settings.to }}</output>
                <button type="button" @click="bump('to',1)" :disabled="settings.to>=12" aria-label="Raise the ending number">+</button>
              </div>
            </div>
          </div>
          <div>
            <h3 class="label">Round length</h3>
            <div class="seg" role="group" aria-label="Round length">
              <button type="button" v-for="d in [30,60,90]" :key="d" :class="{on: settings.duration===d}" :aria-pressed="settings.duration===d ? 'true' : 'false'" @click="settings.duration=d">{{ d }} sec</button>
            </div>
          </div>
        </div>
      </div>
    </details>
  </section>

  <div class="start-bar">
    <div class="summary">
      <strong>{{ settings.tables.length ? tablesLabel : 'No tables picked' }}</strong>
      <span class="muted">×{{ settings.from }}–{{ settings.to }} · {{ settings.duration }} seconds<template v-if="bestForSetup"> · Best: <span class="num">{{ bestForSetup }}</span></template></span>
    </div>
    <button type="button" class="btn go big" :disabled="!settings.tables.length" @click="startGame">Start round</button>
  </div>
  <p v-if="!settings.tables.length" class="warn">Pick at least one times table to start.</p>
</main>`
};
