import { inject, computed } from 'vue';

export default {
  name: 'ResultModal',
  setup() {
    const game = inject('game');
    const target = computed(() => game.targets.find((t) => t.id === game.state.targetId));
    return { game, state: game.state, target };
  },
  template: `
    <div v-if="state.result" class="modal-backdrop" @click.self="game.dismissResult()">
      <div class="modal" role="dialog" aria-modal="true">
        <template v-if="state.result.kind === 'won'">
          <h2>🎉 You matched {{ target.name }}!</h2>
          <p class="modal__score">{{ state.result.score.toFixed(1) }}%</p>
          <p>{{ state.result.hints ? state.result.hints + ' hint(s) used.' : 'No hints used!' }}</p>
          <p v-if="state.result.next">Unlocked: <strong>{{ state.result.next }}</strong></p>
          <p v-else>That was the last target — you've matched them all.</p>
          <div class="modal__actions">
            <button class="btn btn--ghost" @click="game.dismissResult()">Keep tweaking</button>
            <button v-if="state.result.next" class="btn btn--accent" @click="game.nextTarget()">Next target →</button>
          </div>
        </template>
        <template v-else>
          <h2>⏱ Time's up!</h2>
          <p class="modal__score">{{ state.result.score.toFixed(1) }}%</p>
          <p>Best score this run against {{ target.name }}.</p>
          <div class="modal__actions">
            <button class="btn btn--ghost" @click="game.dismissResult()">Close</button>
            <button class="btn btn--accent" @click="game.restart()">Try again</button>
          </div>
        </template>
      </div>
    </div>
  `,
};
