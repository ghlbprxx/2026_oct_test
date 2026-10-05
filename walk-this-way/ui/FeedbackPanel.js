import { inject } from 'vue';
import HintButton from './HintButton.js';

// Top mismatches in plain language + the hint button.
export default {
  name: 'FeedbackPanel',
  components: { HintButton },
  setup() {
    const game = inject('game');
    return { state: game.state };
  },
  template: `
    <div class="card feedback">
      <div class="feedback__title">Biggest differences</div>
      <ul v-if="state.breakdown.length" class="mismatches">
        <li v-for="m in state.breakdown" :key="m.id">
          <span class="arrow">{{ m.direction === 'low' ? '▲' : '▼' }}</span>{{ m.text }}
        </li>
      </ul>
      <p v-else class="feedback__done">No differences left — perfect match!</p>
      <p v-if="state.strideClamped" class="warn">⚠ Stride is longer than these legs can reach; it's being capped.</p>
      <HintButton />
    </div>
  `,
};
