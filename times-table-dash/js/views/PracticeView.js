// Practice setup: quick starts up front; problem types, level, tables, range and time folded away.
import { settings, setupLabel } from '../core/state.js';
import { presets, activePreset, applyPreset, toggleOp, toggleTable, selectAll, clearTables, bump, usesLevel, usesTables, setupError, bestForSetup, startGame } from '../core/game.js';
import { OPS, OP_SYM, OP_NAME, LEVELS } from '../data/problems.js';

export default {
  setup() {
    return { settings, setupLabel, presets, activePreset, applyPreset, toggleOp, toggleTable, selectAll, clearTables, bump, usesLevel, usesTables, setupError, bestForSetup, startGame, OPS, OP_SYM, OP_NAME, LEVELS };
  },
  template: `
<main class="stack">
  <div>
    <back-link to="home">Home</back-link>
    <h1 class="page-title">Practice</h1>
    <p class="page-sub">Timed rounds of +, −, × and ÷. Five in a row doubles your points, and fast answers earn a bonus.</p>
  </div>

  <section class="panel">
    <h2 class="label">Quick start</h2>
    <div class="presets">
      <button type="button" v-for="p in presets" :key="p.id" class="preset" :class="{on: activePreset===p.id}" :aria-pressed="activePreset===p.id ? 'true' : 'false'" @click="applyPreset(p)">
        <span class="preset-name">{{ p.name }}</span>
        <span class="preset-tables">{{ p.ops.map(o => OP_SYM[o]).join(' ') }}</span>
      </button>
    </div>

    <details class="custom">
      <summary><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>Customize problem types, level, tables and time</summary>
      <div class="custom-body">
        <h3 class="label">Problem types</h3>
        <div class="op-toggles">
          <button type="button" v-for="o in OPS" :key="o" class="chip op" :class="{on: settings.ops.includes(o)}" :aria-pressed="settings.ops.includes(o) ? 'true' : 'false'" @click="toggleOp(o)"><span class="op-sym">{{ OP_SYM[o] }}</span> {{ OP_NAME[o] }}</button>
        </div>
        <div v-if="usesLevel" class="block">
          <h3 class="label">+ and − level</h3>
          <div class="seg" role="group" aria-label="Addition and subtraction level">
            <button type="button" v-for="(L, k) in LEVELS" :key="k" :class="{on: settings.level===k}" :aria-pressed="settings.level===k ? 'true' : 'false'" @click="settings.level=k" :title="L.note">{{ L.name }}</button>
          </div>
          <p class="muted small">{{ LEVELS[settings.level].note }} numbers</p>
        </div>
        <template v-if="usesTables">
        <div class="row-head block">
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
            <h3 class="label">Facts from</h3>
            <div class="range">
              <div class="stepper">
                <button type="button" @click="bump('from',-1)" :disabled="settings.from<=1" aria-label="Lower the starting number">−</button>
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
        </div>
        </template>
        <div class="block">
          <h3 class="label">Round length</h3>
          <div class="seg" role="group" aria-label="Round length">
            <button type="button" v-for="d in [30,60,90]" :key="d" :class="{on: settings.duration===d}" :aria-pressed="settings.duration===d ? 'true' : 'false'" @click="settings.duration=d">{{ d }} sec</button>
          </div>
        </div>
      </div>
    </details>
  </section>

  <div class="start-bar">
    <div class="summary">
      <strong>{{ setupLabel || 'Nothing picked yet' }}</strong>
      <span class="muted">{{ settings.duration }} seconds<template v-if="bestForSetup"> · Best: <span class="num">{{ bestForSetup }}</span></template></span>
    </div>
    <button type="button" class="btn go big" :disabled="!!setupError" @click="startGame()">Start round</button>
  </div>
  <p v-if="setupError" class="warn">{{ setupError }}</p>
</main>`
};
