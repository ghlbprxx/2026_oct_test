// Root component: the header (hidden during a practice round) and the current view, cross-faded on change.
import { view, sound, music, go } from './core/state.js';
import { hasMusic, toggleSound, toggleMusic } from './core/audio.js';
import HomeView from './views/HomeView.js';
import StoriesView from './views/StoriesView.js';
import StoryView from './views/StoryView.js';
import PracticeView from './views/PracticeView.js';
import PlayView from './views/PlayView.js';
import ResultsView from './views/ResultsView.js';
import StickersView from './views/StickersView.js';
import CheatView from './views/CheatView.js';
const { computed } = Vue;

const VIEWS = { home: HomeView, stories: StoriesView, story: StoryView, practice: PracticeView, play: PlayView, over: ResultsView, stickers: StickersView, cheat: CheatView };

export default {
  setup() {
    const current = computed(() => VIEWS[view.value] || HomeView);
    return { view, current, go, sound, music, hasMusic, toggleSound, toggleMusic };
  },
  template: `
<header class="top" v-if="view!=='play'">
  <button class="brand" type="button" @click="go('home')">
    <span class="brand-mark" aria-hidden="true">×</span><span>Times Table Dash</span>
  </button>
  <nav class="top-actions" aria-label="Sound">
    <button type="button" class="icon-btn" v-if="hasMusic" @click="toggleMusic" :aria-label="music ? 'Turn music off' : 'Turn music on'" :title="music ? 'Music on' : 'Music off'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"></path><circle cx="6.5" cy="18" r="2.5"></circle><circle cx="16.5" cy="16" r="2.5"></circle><path v-if="!music" d="M3 3l18 18"></path></svg></button>
    <button type="button" class="icon-btn" @click="toggleSound" :aria-label="sound ? 'Mute sound' : 'Turn sound on'" :title="sound ? 'Sound on' : 'Sound off'">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"></path><path v-if="sound" d="M16.5 8.5a5 5 0 0 1 0 7"></path><path v-else d="M17 9l5 6M22 9l-5 6"></path></svg>
    </button>
  </nav>
</header>
<transition name="view" mode="out-in">
  <component :is="current" :key="view"></component>
</transition>`
};
