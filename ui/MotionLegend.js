import { inject } from 'vue';

// Explains marker/trail colors (same colors render/ uses, from config).
export default {
  name: 'MotionLegend',
  setup() {
    const game = inject('game');
    return { state: game.state, colors: game.config.render.sideColors };
  },
  template: `
    <div class="card legend">
      <div class="legend__row">
        <span><i class="legend__dot" :style="{ background: colors.L }"></i>Left</span>
        <span><i class="legend__dot" :style="{ background: colors.R }"></i>Right</span>
        <span><i class="legend__dot" :style="{ background: colors.C }"></i>Head &amp; hips</span>
      </div>
      <p v-if="state.playback.trails">Trails slide back at walking speed, like a long-exposure photo: compare the foot arcs, head-bob waves and step spacing.</p>
    </div>
  `,
};
