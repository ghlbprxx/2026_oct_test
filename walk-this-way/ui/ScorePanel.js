import { inject, computed } from 'vue';

export default {
  name: 'ScorePanel',
  setup() {
    const game = inject('game');
    const state = game.state;
    const threshold = computed(() => game.config.thresholds[state.difficulty]);
    const band = computed(() => (state.score >= threshold.value ? 'good' : state.score >= 70 ? 'warm' : 'cold'));
    const time = computed(() => {
      const s = Math.ceil(state.timeLeft);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    });
    const best = computed(() => {
      const b = state.best[state.targetId];
      return b && b[state.mode] ? b[state.mode].score : null;
    });
    return { state, threshold, band, time, best };
  },
  template: `
    <div class="score-panel" :class="'band--' + band">
      <div v-if="state.mode === 'timed'" class="timer" :class="{ urgent: state.timeLeft < 10 }">
        <span class="timer__label">Time</span>{{ time }}
      </div>
      <div class="score">
        <div class="score__value" aria-live="polite">{{ state.score.toFixed(1) }}<small>%</small></div>
        <div class="score__bar">
          <div class="score__fill" :style="{ width: state.score + '%' }"></div>
          <div v-if="state.mode !== 'sandbox'" class="score__mark" :style="{ left: threshold + '%' }" :title="'Goal ' + threshold + '%'"></div>
        </div>
        <div class="score__meta">
          <span v-if="state.mode === 'challenge'">Goal {{ threshold }}%</span>
          <span v-else-if="state.mode === 'timed'">Best this run {{ state.timedBest.toFixed(1) }}%</span>
          <span v-else>Match score</span>
          <span v-if="best !== null"> · Record {{ best.toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  `,
};
