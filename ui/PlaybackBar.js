import { inject } from 'vue';

export default {
  name: 'PlaybackBar',
  setup() {
    const game = inject('game');
    return { game, state: game.state, speeds: game.config.sim.speeds, cameras: game.config.render.cameras };
  },
  template: `
    <footer class="playback">
      <button class="btn icon" :title="state.playback.paused ? 'Play (Space)' : 'Pause (Space)'" @click="game.togglePause()">
        {{ state.playback.paused ? '▶' : '⏸' }}
      </button>
      <button class="btn icon" title="Step one frame (.)" :disabled="!state.playback.paused" @click="game.frameStep()">⏭</button>
      <div class="seg seg--small" role="group" aria-label="Playback speed">
        <button v-for="s in speeds" :key="s" :class="{ active: state.playback.speed === s }" @click="game.setSpeed(s)">{{ s }}×</button>
      </div>
      <span class="spacer"></span>
      <button class="btn toggle" :class="{ on: state.playback.markers }" title="Dots on the joints (J)" @click="game.toggleMarkers()">● Joints</button>
      <button class="btn toggle" :class="{ on: state.playback.trails }" title="Motion trails for feet, hands, head and hips (T)" @click="game.toggleTrails()">〰 Trails</button>
      <button class="btn toggle" :class="{ on: state.playback.ghost }" title="Overlay the Target on your character (G)" @click="game.toggleGhost()">👻 Ghost</button>
      <button class="btn toggle" :class="{ on: state.playback.floor }" title="Treadmill or walk across the floor (F)" @click="game.toggleFloor()">
        {{ state.playback.floor ? '🚶 Floor' : '🏃 Treadmill' }}
      </button>
      <div class="seg seg--small" role="group" aria-label="Camera">
        <button v-for="c in cameras" :key="c.id" :class="{ active: state.playback.camera === c.id }" @click="game.setCamera(c.id)">{{ c.label }}</button>
      </div>
    </footer>
  `,
};
