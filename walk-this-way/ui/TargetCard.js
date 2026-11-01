import { inject, computed } from 'vue';

export default {
  name: 'TargetCard',
  setup() {
    const game = inject('game');
    const target = computed(() => game.targets.find((t) => t.id === game.state.targetId));
    return { target };
  },
  template: `
    <div class="card target-card">
      <div class="target-card__head">
        <strong>{{ target.name }}</strong>
        <span class="chip" :title="target.sex === 'F' ? 'Female' : 'Male'">{{ target.sex === 'F' ? '♀ F' : '♂ M' }}</span>
        <span class="chip" :class="'chip--' + target.difficulty.toLowerCase()">{{ target.difficulty }}</span>
      </div>
      <p class="target-card__bio">{{ target.bio }}</p>
    </div>
  `,
};
