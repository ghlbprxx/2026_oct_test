// Story list: every story is open; the first unread one is marked "Up next".
import { storyProg } from '../core/state.js';
import { stories, nextStoryId, openStory } from '../core/story.js';
import { OP_SYM, OP_NAME } from '../data/stories.js';

export default {
  setup() {
    return { stories, storyProg, nextStoryId, openStory, OP_SYM, OP_NAME };
  },
  template: `
<main class="stack">
  <div>
    <back-link to="home">Home</back-link>
    <h1 class="page-title">Story mode</h1>
    <p class="page-sub">Help Kazu through five short stories. Take your time: there's no clock here.</p>
  </div>
  <ol class="story-list">
    <li v-for="(s, i) in stories" :key="s.id">
      <button type="button" class="story-card" :class="['tone-' + s.tone, {next: s.id === nextStoryId}]" :style="{'--i': i}" @click="openStory(s.id)">
        <span class="story-num" aria-hidden="true">{{ s.icon }}</span>
        <span class="story-meta">
          <span class="story-kicker">Story {{ i + 1 }} · {{ s.kind }}</span>
          <span class="story-name">{{ s.title }}</span>
          <span class="ops" aria-label="Problem types"><span class="op-chip" v-for="o in s.ops" :key="o" :title="OP_NAME[o]">{{ OP_SYM[o] }}</span></span>
        </span>
        <span class="story-status">
          <template v-if="storyProg[s.id] && storyProg[s.id].done">
            <span class="mini-stars" :aria-label="storyProg[s.id].stars + ' of 3 stars'"><span v-for="k in 3" :key="k" :class="{off: k > storyProg[s.id].stars}">★</span></span>
            <span>Read</span>
          </template>
          <span v-else-if="s.id === nextStoryId" class="badge-next">Up next</span>
          <span v-else>New</span>
        </span>
      </button>
    </li>
  </ol>
</main>`
};
