import { inject } from 'vue';
import ModePicker from './ModePicker.js';
import ScorePanel from './ScorePanel.js';
import TargetCard from './TargetCard.js';
import FeedbackPanel from './FeedbackPanel.js';
import PlaybackBar from './PlaybackBar.js';
import ParamSidebar from './ParamSidebar.js';
import ResultModal from './ResultModal.js';
import MotionLegend from './MotionLegend.js';

export default {
  name: 'App',
  components: { ModePicker, ScorePanel, TargetCard, FeedbackPanel, PlaybackBar, ParamSidebar, ResultModal, MotionLegend },
  setup() {
    const game = inject('game');
    return { state: game.state };
  },
  template: `
    <div class="app">
      <main class="stage-col">
        <header class="topbar">
          <div class="brand">Walk <span>This</span> Way</div>
          <ModePicker />
        </header>
        <section class="viewport-wrap">
          <div id="viewport" class="viewport" aria-label="3D view of the Target and your character"></div>
          <TargetCard class="overlay overlay--tl" />
          <ScorePanel class="overlay overlay--tr card" />
          <FeedbackPanel class="overlay overlay--bl" />
          <MotionLegend v-if="state.playback.markers || state.playback.trails" class="overlay overlay--br" />
          <div v-if="!state.storageOk" class="overlay overlay--tc notice">Storage unavailable — progress won't be saved.</div>
        </section>
        <PlaybackBar />
      </main>
      <ParamSidebar />
      <ResultModal />
    </div>
  `,
};
