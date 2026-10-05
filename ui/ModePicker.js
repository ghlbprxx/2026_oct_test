import { inject } from 'vue';
import { MODES } from '../core/modes.js';

export default {
  name: 'ModePicker',
  setup() {
    const game = inject('game');
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    return { game, state: game.state, targets: game.targets, thresholds: game.config.thresholds, modes: MODES, cap };
  },
  template: `
    <div class="mode-picker">
      <div class="seg" role="group" aria-label="Game mode">
        <button v-for="m in modes" :key="m.id" :class="{ active: state.mode === m.id }"
                :title="m.blurb" @click="game.setMode(m.id)">{{ m.label }}</button>
      </div>
      <label class="field">
        <span>Target</span>
        <select :value="state.targetId" @change="game.selectTarget($event.target.value)">
          <option v-for="(t, i) in targets" :key="t.id" :value="t.id" :disabled="!game.isUnlocked(t.id)">
            {{ game.isUnlocked(t.id) ? '' : '🔒 ' }}{{ i + 1 }}. {{ t.sex === 'F' ? '♀' : '♂' }} {{ t.name }} · {{ t.difficulty }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>Difficulty</span>
        <select :value="state.difficulty" @change="game.setDifficulty($event.target.value)">
          <option v-for="(v, k) in thresholds" :key="k" :value="k">{{ cap(k) }} · {{ v }}%</option>
        </select>
      </label>
      <button class="btn btn--ghost" title="Start this target over" @click="game.restart()">↺ Restart</button>
    </div>
  `,
};
