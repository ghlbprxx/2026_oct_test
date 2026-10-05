// Chapter map: chapters unlock one at a time; cleared ones show their best stars and can be replayed.
import { storyProg } from '../core/state.js';
import { chapters, nextStoryId, openChapter, isUnlocked } from '../core/story.js';
import { CAST } from '../data/stories.js';
import { OP_SYM, OP_NAME } from '../data/problems.js';

export default {
  setup() {
    return { chapters, storyProg, nextStoryId, openChapter, isUnlocked, CAST, OP_SYM, OP_NAME };
  },
  template: `
<main class="stack">
  <div>
    <back-link to="home">Home</back-link>
    <h1 class="page-title">Story mode</h1>
    <p class="page-sub">Count Calculo froze the town clock the night before the Sakura Festival. Beat each chapter's goal before time runs out to reach the tower.</p>
  </div>
  <ol class="story-list">
    <li v-for="(c, i) in chapters" :key="c.id">
      <button type="button" class="story-card" :class="['tone-' + c.tone, {next: c.id === nextStoryId, locked: !isUnlocked(i)}]" :style="{'--i': i}" :disabled="!isUnlocked(i)" @click="openChapter(c.id)">
        <span class="story-num" aria-hidden="true">{{ isUnlocked(i) ? c.icon : '🔒' }}</span>
        <span class="story-meta">
          <span class="story-kicker">Chapter {{ i + 1 }} · {{ c.foe ? 'Boss: ' + CAST[c.foe].name : 'Quest' }}</span>
          <span class="story-name">{{ c.title }}</span>
          <span class="ops" aria-label="Problem types">
            <span class="op-chip" v-for="o in c.round.ops" :key="o" :title="OP_NAME[o]">{{ OP_SYM[o] }}</span>
            <span class="op-chip goal-chip">{{ c.round.goal }} pts · {{ c.round.duration }}s</span>
          </span>
        </span>
        <span class="story-status">
          <template v-if="storyProg[c.id] && storyProg[c.id].done">
            <span class="mini-stars" :aria-label="storyProg[c.id].stars + ' of 3 stars'"><span v-for="k in 3" :key="k" :class="{off: k > storyProg[c.id].stars}">★</span></span>
            <span>Clear!</span>
          </template>
          <span v-else-if="c.id === nextStoryId" class="badge-next">Up next</span>
          <span v-else>Locked</span>
        </span>
      </button>
    </li>
  </ol>
</main>`
};
