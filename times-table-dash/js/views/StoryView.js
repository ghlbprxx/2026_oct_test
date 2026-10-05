// Story reader, 16-bit adventure style: a "game screen" (title card, stage tag, sprite), an RPG dialogue
// box with portraits and letter-by-letter text, then the math challenge for that stage.
import { go } from '../core/state.js';
import { stories, story, curStory, storyIndex, beat, onBeat, storyStars, nextBtn, lines, line, lineParts, lineTyped, talkDone, talkAdvance,
  openStory, storyGo, storyPress, storyBack, storyClear, storyHint, storyCheck, dotClass, dotLabel } from '../core/story.js';
import { OP_SYM, OP_NAME, sceneArt } from '../data/stories.js';
import { artFor } from '../data/assets.js';
const { computed } = Vue;

export default {
  setup() {
    const isEnd = computed(() => story.page === story.beats.length + 1);
    const sceneSrc = computed(() => artFor(sceneArt(story.id)));
    const portraitSrc = computed(() => line.value && line.value.cast ? artFor(line.value.cast.art) : null);
    const stageTag = computed(() => onBeat.value ? curStory.value.world.toUpperCase() + '-' + story.page : curStory.value.world.toUpperCase());
    const screenStyle = computed(() => ({ '--s1': curStory.value.sky[0], '--s2': curStory.value.sky[1], '--g': curStory.value.ground }));
    return { go, stories, story, curStory, storyIndex, beat, onBeat, storyStars, nextBtn, lines, line, lineParts, lineTyped, talkDone, talkAdvance,
      openStory, storyGo, storyPress, storyBack, storyClear, storyHint, storyCheck, dotClass, dotLabel, OP_SYM, OP_NAME,
      isEnd, sceneSrc, portraitSrc, stageTag, screenStyle };
  },
  template: `
<main class="story">
  <div class="story-head">
    <back-link to="stories">Worlds</back-link>
    <div class="story-head-title">
      <strong>{{ curStory.title }}</strong>
      <span>{{ curStory.world }} of {{ stories.length }}</span>
    </div>
    <div class="story-switch">
      <button type="button" class="icon-btn" :disabled="storyIndex === 0" @click="openStory(stories[storyIndex - 1].id)" aria-label="Previous world" title="Previous world"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg></button>
      <button type="button" class="icon-btn" :disabled="storyIndex === stories.length - 1" @click="openStory(stories[storyIndex + 1].id)" aria-label="Next world" title="Next world"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg></button>
    </div>
  </div>

  <nav class="dots" aria-label="Stages">
    <span class="dot-wrap" v-for="p in story.beats.length + 2" :key="p">
      <button type="button" class="dot-btn" :class="dotClass(p - 1)" :disabled="p - 1 > story.reached" @click="storyGo(p - 1)" :aria-label="dotLabel(p - 1)" :aria-current="story.page === p - 1 ? 'step' : null"></button>
    </span>
  </nav>

  <!-- the game screen -->
  <div class="screen" :class="{night: curStory.night, art: !!sceneSrc}" :style="screenStyle" aria-hidden="true">
    <img v-if="sceneSrc" class="screen-art" :src="sceneSrc" alt="">
    <template v-else>
      <span class="sky-orb"></span>
      <span class="ground"></span>
    </template>
    <span v-if="onBeat" class="stage-tag">{{ stageTag }}</span>
    <transition name="fade" mode="out-in">
      <div v-if="story.page === 0" class="title-card" :key="'t' + story.run"><span class="tc-small">{{ curStory.world }}</span><span class="tc-big">{{ curStory.title }}</span></div>
      <div v-else-if="isEnd" class="title-card clear" :key="'c' + story.run"><span class="tc-big">Stage clear!</span><span class="tc-stars"><span v-for="i in 3" :key="i" :class="{off: i > storyStars}">★</span></span></div>
      <div v-else class="sprite" :key="'s' + story.run + '-' + story.page">{{ beat.icon }}</div>
    </transition>
  </div>

  <!-- RPG dialogue box: tap (or Enter / Space) to continue -->
  <button type="button" class="dialog" :class="{narr: line && !line.cast}" @click="talkAdvance" :aria-label="talkDone ? 'Dialogue' : 'Continue dialogue'">
    <span v-if="line && line.cast" class="portrait" :style="{background: line.cast.color}">
      <img v-if="portraitSrc" :src="portraitSrc" alt="">
      <span v-else class="portrait-emoji">{{ line.cast.emoji }}</span>
    </span>
    <span class="dialog-body">
      <span v-if="line && line.cast" class="speaker">{{ line.cast.name }}</span>
      <span class="dialog-text" aria-hidden="true"><template v-for="(part, k) in lineParts" :key="k"><b v-if="part.n">{{ part.t }}</b><template v-else>{{ part.t }}</template></template></span>
    </span>
    <span class="more" v-if="lineTyped && !talkDone" aria-hidden="true">▼</span>
  </button>
  <p class="sr-only" aria-live="polite">{{ line ? (line.cast ? line.cast.name + ': ' : '') + line.text : '' }}</p>

  <div :style="{'--dir-in': story.dir > 0 ? '14px' : '-14px', '--dir-out': story.dir > 0 ? '-14px' : '14px'}">
  <transition name="page" mode="out-in">
    <!-- title -->
    <section v-if="story.page === 0" class="page center" :key="'p0-' + story.run">
      <template v-if="talkDone">
        <div class="ops"><span class="op-chip" v-for="o in curStory.ops" :key="o">{{ OP_SYM[o] }} {{ OP_NAME[o] }}</span></div>
        <button type="button" class="btn go big pixel" @click="storyGo(1)">Start ▶</button>
      </template>
      <p v-else class="tap-hint">Tap the box to continue</p>
    </section>

    <!-- stage clear -->
    <section v-else-if="isEnd" class="page center" :key="'pf-' + story.run">
      <template v-if="talkDone">
        <div class="stars" :aria-label="storyStars + ' out of 3 stars'">
          <span v-for="i in 3" :key="i" class="star" :class="{on: i <= storyStars}" :style="{animationDelay: (0.15 + i * 0.18) + 's'}">★</span>
        </div>
        <p class="muted" style="margin:0">{{ story.firstTry }} of {{ story.beats.length }} solved on the first try.</p>
        <div class="actions">
          <button v-if="storyIndex < stories.length - 1" type="button" class="btn go big pixel" @click="openStory(stories[storyIndex + 1].id)">Next world ▶</button>
          <button type="button" class="btn" @click="openStory(curStory.id)">Play again</button>
          <button type="button" class="btn soft" @click="go('stories')">World map</button>
        </div>
      </template>
      <p v-else class="tap-hint">Tap the box to continue</p>
    </section>

    <!-- a challenge -->
    <section v-else class="page" :key="'pb-' + story.run + '-' + story.page">
      <p v-if="!talkDone && !beat.status" class="tap-hint">Tap the box to continue</p>
      <template v-else>
        <p class="story-ask"><span class="challenge-tag">Challenge</span> {{ beat.ask }}</p>

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
          <number-pad @digit="storyPress" @back="storyBack" @clear="storyClear"></number-pad>
          <div class="story-nav">
            <button type="button" class="btn soft" @click="storyHint" :disabled="beat.hint">{{ beat.hint ? 'Hint shown' : 'Show me a hint' }}</button>
            <button type="button" class="btn go" @click="storyCheck" :disabled="!beat.input">Check</button>
          </div>
        </template>
        <div v-else class="story-nav">
          <button type="button" class="btn" @click="storyGo(story.page - 1)">Back</button>
          <button type="button" class="btn go" @click="storyGo(story.page + 1)" ref="nextBtn">{{ story.page === story.beats.length ? 'Finish ▶' : 'Next ▶' }}</button>
        </div>
      </template>
    </section>
  </transition>
  </div>
  <p class="hint">Keyboard: Enter or Space continues the dialogue. Type numbers, then Enter to check.</p>
</main>`
};
