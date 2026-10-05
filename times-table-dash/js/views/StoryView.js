// Story reader: one page at a time, with page dots, hints, and previous/next story buttons.
import { kazu } from '../core/state.js';
import { stories, story, curStory, storyIndex, beat, storyStars, nextBtn, openStory, storyGo, storyPress, storyBack, storyCheck, dotClass, dotLabel } from '../core/story.js';
import { OP_SYM, OP_NAME } from '../data/stories.js';

export default {
  setup() {
    return { kazu, stories, story, curStory, storyIndex, beat, storyStars, nextBtn, openStory, storyGo, storyPress, storyBack, storyCheck, dotClass, dotLabel, OP_SYM, OP_NAME };
  },
  template: `
<main class="story">
  <div class="story-head">
    <back-link to="stories">Stories</back-link>
    <div class="story-head-title">
      <strong>{{ curStory.title }}</strong>
      <span>Story {{ storyIndex + 1 }} of {{ stories.length }}</span>
    </div>
    <div class="story-switch">
      <button type="button" class="icon-btn" :disabled="storyIndex === 0" @click="openStory(stories[storyIndex - 1].id)" aria-label="Previous story" title="Previous story"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg></button>
      <button type="button" class="icon-btn" :disabled="storyIndex === stories.length - 1" @click="openStory(stories[storyIndex + 1].id)" aria-label="Next story" title="Next story"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg></button>
    </div>
  </div>

  <nav class="dots" aria-label="Story pages">
    <span class="dot-wrap" v-for="p in story.beats.length + 2" :key="p">
      <button type="button" class="dot-btn" :class="dotClass(p - 1)" :disabled="p - 1 > story.reached" @click="storyGo(p - 1)" :aria-label="dotLabel(p - 1)" :aria-current="story.page === p - 1 ? 'step' : null"></button>
    </span>
  </nav>

  <div :style="{'--dir-in': story.dir > 0 ? '14px' : '-14px', '--dir-out': story.dir > 0 ? '-14px' : '14px'}">
  <transition name="page" mode="out-in">
    <!-- intro -->
    <section v-if="story.page === 0" class="page" :key="'p0-' + story.run">
      <span class="page-icon" aria-hidden="true">{{ curStory.icon }}</span>
      <p class="story-text">{{ curStory.intro }}</p>
      <div class="ops"><span class="op-chip" v-for="o in curStory.ops" :key="o">{{ OP_SYM[o] }} {{ OP_NAME[o] }}</span></div>
      <button type="button" class="btn go big" @click="storyGo(1)">Begin the story</button>
    </section>

    <!-- finish -->
    <section v-else-if="story.page === story.beats.length + 1" class="page finish" :key="'pf-' + story.run">
      <span class="page-icon" aria-hidden="true">{{ curStory.icon }}</span>
      <p class="eyebrow">The end</p>
      <p class="story-text">{{ curStory.outro }}</p>
      <div class="stars" :aria-label="storyStars + ' out of 3 stars'">
        <span v-for="i in 3" :key="i" class="star" :class="{on: i <= storyStars}" :style="{animationDelay: (0.15 + i * 0.18) + 's'}">★</span>
      </div>
      <p class="muted" style="margin:0">{{ story.firstTry }} of {{ story.beats.length }} solved on the first try.</p>
      <div class="actions">
        <button v-if="storyIndex < stories.length - 1" type="button" class="btn go big" @click="openStory(stories[storyIndex + 1].id)">Next story</button>
        <button type="button" class="btn" @click="openStory(curStory.id)">Read again</button>
        <button type="button" class="btn soft" @click="go('stories')">All stories</button>
      </div>
    </section>

    <!-- a beat -->
    <section v-else class="page" :key="'pb-' + story.run + '-' + story.page">
      <p class="story-text"><template v-for="(part, k) in beat.parts" :key="k"><b v-if="part.n">{{ part.t }}</b><template v-else>{{ part.t }}</template></template></p>
      <p class="story-ask">{{ beat.ask }}</p>

      <transition name="fade">
        <div v-if="beat.hint || beat.status" class="picture" aria-hidden="true">
          <template v-if="beat.op === 'add'">
            <span class="grp"><span class="it" v-for="n in beat.a" :key="'a' + n">{{ beat.icon }}</span></span>
            <span class="sym">+</span>
            <span class="grp"><span class="it" v-for="n in beat.b" :key="'b' + n">{{ beat.icon }}</span></span>
          </template>
          <template v-else-if="beat.op === 'sub'">
            <span class="grp"><span class="it" v-for="n in beat.a" :key="'s' + n" :class="{gone: n > beat.a - beat.b}">{{ beat.icon }}</span></span>
          </template>
          <template v-else-if="beat.hint && !beat.status">
            <span class="grp"><span class="it" v-for="n in beat.a" :key="'p' + n">{{ beat.icon }}</span></span>
            <span class="sym">→</span>
            <span class="grp" v-for="g in beat.b" :key="'e' + g"><span class="sym" style="font-size:1rem">?</span></span>
          </template>
          <template v-else>
            <span class="grp" v-for="g in beat.b" :key="'g' + g"><span class="it" v-for="n in beat.ans" :key="'d' + g + '-' + n">{{ beat.icon }}</span></span>
          </template>
        </div>
      </transition>
      <p v-if="beat.op === 'div' && beat.hint && !beat.status" class="muted" style="margin:-4px 0 0;font-weight:700">{{ beat.a }} split into {{ beat.b }} equal groups. How many in each?</p>

      <div class="answer-row">
        <span class="eq" v-if="beat.hint || beat.status">{{ beat.a }} <span class="op">{{ OP_SYM[beat.op] }}</span> {{ beat.b }} <span class="op">=</span></span>
        <div class="answer-box" :class="{right: beat.status === 'right', wrong: beat.flash}" :key="'ab' + beat.tries" :aria-label="'Your answer: ' + (beat.input || 'blank')">
          <template v-if="beat.status">{{ beat.ans }}</template>
          <template v-else><span v-if="beat.input">{{ beat.input }}</span><span class="caret" aria-hidden="true"></span></template>
        </div>
      </div>
      <p class="feedback" :class="beat.status" aria-live="polite">{{ beat.msg }}</p>

      <template v-if="!beat.status">
        <number-pad @digit="storyPress" @back="storyBack" @clear="beat.input = ''"></number-pad>
        <div class="story-nav">
          <button type="button" class="btn soft" @click="beat.hint = true" :disabled="beat.hint">{{ beat.hint ? 'Hint shown' : 'Show me a hint' }}</button>
          <button type="button" class="btn go" @click="storyCheck" :disabled="!beat.input">Check</button>
        </div>
      </template>
      <div v-else class="story-nav">
        <button type="button" class="btn" @click="storyGo(story.page - 1)">Back</button>
        <button type="button" class="btn go" @click="storyGo(story.page + 1)" ref="nextBtn">{{ story.page === story.beats.length ? 'Finish' : 'Next page' }}</button>
      </div>
    </section>
  </transition>
  </div>

  <div class="scene" style="height:120px">
    <sakura-scene></sakura-scene>
    <span v-if="kazu.say" class="say" :key="'ss' + kazu.key">{{ kazu.say }}</span>
    <div class="mascot" style="width:100px;height:100px"><span class="kz-shadow" aria-hidden="true"></span><kazu-mascot :mood="kazu.react || 'idle'" :key="'sk' + kazu.key"></kazu-mascot></div>
  </div>
  <p class="hint">Keyboard works too: type numbers, Enter to check or go on.</p>
</main>`
};
