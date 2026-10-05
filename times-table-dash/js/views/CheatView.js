// Cheat sheet: the times table grid.
import { settings } from '../core/state.js';
import { startGame } from '../core/game.js';
// the grid is times tables, so its practice button starts a × round with your tables
import { cheat, cheatRows, cheatCols, focus, isCovered, cellClass, pickCell, skipCount } from '../core/cheat.js';

export default {
  setup() {
    function practiceTables() { settings.ops = ['mul']; startGame(); }
    return { settings, practiceTables, cheat, cheatRows, cheatCols, focus, isCovered, cellClass, pickCell, skipCount };
  },
  template: `
<main class="stack">
  <div>
    <back-link to="home">Home</back-link>
    <h1 class="page-title">Cheat sheet</h1>
    <p class="page-sub">Tap any square to see the fact, its turnaround, and how to skip-count to it.</p>
  </div>
  <div class="cheat-controls">
    <div class="seg" role="group" aria-label="Which tables">
      <button type="button" :class="{on: cheat.scope==='mine'}" @click="cheat.scope='mine'" :disabled="!settings.tables.length">My tables</button>
      <button type="button" :class="{on: cheat.scope==='all'}" @click="cheat.scope='all'">All 1–12</button>
    </div>
    <label class="toggle" for="cover-toggle"><input type="checkbox" id="cover-toggle" v-model="cheat.cover"> Cover answers (tap to peek)</label>
  </div>

  <div class="callout" aria-live="polite">
    <template v-if="cheat.sel">
      <span class="callout-main">{{ cheat.sel.a }} × {{ cheat.sel.b }} = {{ cheat.sel.a * cheat.sel.b }}</span>
      <span class="callout-sub" v-if="cheat.sel.a !== cheat.sel.b">Turn it around: {{ cheat.sel.b }} × {{ cheat.sel.a }} = {{ cheat.sel.a * cheat.sel.b }}</span>
      <span class="callout-sub" v-else>A square number: {{ cheat.sel.a }} rows of {{ cheat.sel.a }}.</span>
      <span class="callout-sub" v-if="cheat.sel.a > 0 && cheat.sel.b > 0">Count by {{ cheat.sel.a }}s: {{ skipCount }}</span>
    </template>
    <template v-else>
      <span class="callout-main">Pick a square</span>
      <span class="callout-sub">Rows are the times tables. Columns are what you multiply by.</span>
    </template>
  </div>

  <div class="grid-wrap" @mouseleave="cheat.hov = null">
    <table class="mult-grid">
      <thead>
        <tr>
          <th class="corner" scope="col">×</th>
          <th v-for="b in cheatCols" :key="'h' + b" scope="col" :class="{hi: focus && focus.b === b}">{{ b }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in cheatRows" :key="'r' + a">
          <th scope="row" :class="{hi: focus && focus.a === a}">{{ a }}</th>
          <td v-for="b in cheatCols" :key="a + 'x' + b">
            <button type="button" class="cell" :class="cellClass(a, b)" @click="pickCell(a, b)" @mouseenter="cheat.hov = {a: a, b: b}" @focus="cheat.hov = {a: a, b: b}" :aria-label="a + ' times ' + b + (isCovered(a, b) ? ', covered' : ' equals ' + (a * b))">{{ isCovered(a, b) ? '' : a * b }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="legend">
    <span><span class="dot" aria-hidden="true"></span>Missed in your last round</span>
    <span><span class="sq-key">Blue numbers</span> are square numbers (same number twice)</span>
  </p>
  <div class="actions">
    <button type="button" class="btn go big" @click="practiceTables" :disabled="!settings.tables.length">Practice my tables</button>
  </div>
</main>`
};
