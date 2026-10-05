import { inject } from 'vue';

export default {
  name: 'HintButton',
  setup() {
    const game = inject('game');
    return { game, state: game.state };
  },
  template: `
    <div class="hint">
      <button class="btn btn--accent" @click="game.requestHint()">
        💡 {{ state.hint && state.hint.level > 0 && state.hint.level < 4 ? 'More specific hint' : 'Hint' }}
      </button>
      <span v-if="state.hint" class="hint__text">
        <span v-if="state.hint.level" class="hint__level">{{ state.hint.level }}/4</span>{{ state.hint.text }}
      </span>
      <span v-if="state.hintsUsed" class="hint__count">{{ state.hintsUsed }} used</span>
    </div>
  `,
};
