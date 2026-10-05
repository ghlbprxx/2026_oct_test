// Chapter screen, 16-bit adventure style: a "game screen" with the chapter art, an RPG dialogue box
// (portraits, letter-by-letter text), then the round's goal card, or the win / lose result card.
import { go } from '../core/state.js';
import { chapters, story, chapter, chapterIndex, roundLabel, line, lineText, lineTyped, talkDone, talkAdvance, talkSkip, startChapter, nextChapter, openChapter } from '../core/story.js';
import { CAST, sceneArt } from '../data/stories.js';
import { artFor } from '../data/assets.js';
const { computed } = Vue;

export default {
  setup() {
    const sceneSrc = computed(() => artFor(sceneArt(story.id)));
    const portraitSrc = computed(() => line.value && line.value.cast ? artFor(line.value.cast.art) : null);
    const foe = computed(() => chapter.value.foe ? CAST[chapter.value.foe] : null);
    const foeSrc = computed(() => foe.value ? artFor(foe.value.art) : null);
    const screenStyle = computed(() => ({ '--s1': chapter.value.sky[0], '--s2': chapter.value.sky[1], '--g': chapter.value.ground }));
    const isLast = computed(() => chapterIndex.value === chapters.length - 1);
    // numbers in dialogue are shown in bold
    const parts = computed(() => lineText.value.split(/(\d+)/).filter(Boolean).map(t => ({ t, n: /^\d+$/.test(t) })));
    return { go, chapters, story, chapter, chapterIndex, roundLabel, line, parts, lineTyped, talkDone, talkAdvance, talkSkip, startChapter, nextChapter, openChapter,
      sceneSrc, portraitSrc, foe, foeSrc, screenStyle, isLast };
  },
  template: `
<main class="story">
  <div class="story-head">
    <back-link to="stories">Chapters</back-link>
    <div class="story-head-title">
      <strong>{{ chapter.title }}</strong>
      <span>Chapter {{ chapterIndex + 1 }} of {{ chapters.length }}</span>
    </div>
    <span></span>
  </div>

  <!-- the game screen -->
  <div class="screen" :class="{night: chapter.night}" :style="screenStyle" aria-hidden="true">
    <img v-if="sceneSrc" class="screen-art" :src="sceneSrc" alt="">
    <template v-else><span class="sky-orb"></span><span class="ground"></span></template>
    <span class="stage-tag">Chapter {{ chapterIndex + 1 }}</span>
    <transition name="fade" mode="out-in">
      <div v-if="story.phase === 'win'" class="title-card clear" :key="'w' + story.run"><span class="tc-big">{{ chapter.final ? 'The clock is saved!' : foe ? 'Victory!' : 'Quest clear!' }}</span><span class="tc-stars"><span v-for="i in 3" :key="i" :class="{off: i > story.last.stars}">★</span></span></div>
      <div v-else-if="story.phase === 'lose'" class="title-card lose" :key="'l' + story.run"><span class="tc-small">So close!</span><span class="tc-big">{{ story.last.score }} / {{ story.last.goal }}</span></div>
      <div v-else-if="story.talkI === 0 && !story.tries" class="title-card" :key="'t' + story.run"><span class="tc-small">Chapter {{ chapterIndex + 1 }}</span><span class="tc-big">{{ chapter.title }}</span></div>
      <div v-else class="sprite" :key="'s' + story.run"><img v-if="foeSrc" :src="foeSrc" alt=""><template v-else>{{ foe ? foe.emoji : chapter.icon }}</template></div>
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
      <span class="dialog-text" aria-hidden="true"><template v-for="(p, k) in parts" :key="k"><b v-if="p.n">{{ p.t }}</b><template v-else>{{ p.t }}</template></template></span>
    </span>
    <span class="more" v-if="lineTyped && !talkDone" aria-hidden="true">▼</span>
  </button>
  <p class="sr-only" aria-live="polite">{{ line ? (line.cast ? line.cast.name + ': ' : '') + line.text : '' }}</p>

  <transition name="page" mode="out-in">
    <div v-if="!talkDone" class="skip-row" key="talk">
      <span class="tap-hint">Tap the box to continue</span>
      <button type="button" class="link" @click="talkSkip">Skip ▶▶</button>
    </div>

    <!-- before the round: the goal -->
    <section v-else-if="story.phase === 'intro'" class="page center" :key="'goal' + story.run">
      <p class="eyebrow">{{ foe ? 'Boss battle' : 'Quest' }}</p>
      <p class="goal-line">Score <b>{{ chapter.round.goal }}</b> points in <b>{{ chapter.round.duration }}</b> seconds</p>
      <p class="muted" style="margin:0">{{ roundLabel }}</p>
      <button type="button" class="btn go big pixel" @click="startChapter">{{ foe ? 'Fight! ▶' : 'Start! ▶' }}</button>
    </section>

    <!-- lost: how close, and retry -->
    <section v-else-if="story.phase === 'lose'" class="page center" :key="'lose' + story.run">
      <div class="goal" :class="{boss: !!foe}" style="width:100%">
        <div class="goal-head"><span>{{ chapter.meter }}</span><span class="num">{{ story.last.pct }}%</span></div>
        <div class="goal-bar"><div class="goal-fill" :style="{width: (foe ? 100 - story.last.pct : story.last.pct) + '%'}"></div></div>
      </div>
      <p class="goal-line">You needed <b>{{ story.last.need }}</b> more points.</p>
      <div v-if="story.last.missed.length" class="facts">
        <span class="fact" v-for="m in story.last.missed" :key="m.key">{{ m.text }}</span>
      </div>
      <div class="actions">
        <button type="button" class="btn go big pixel" @click="startChapter">Try again ▶</button>
        <button type="button" class="btn soft" @click="go('stories')">Chapters</button>
      </div>
    </section>

    <!-- won: stars and on to the next chapter -->
    <section v-else class="page center" :key="'win' + story.run">
      <div class="stars" :aria-label="story.last.stars + ' out of 3 stars'">
        <span v-for="i in 3" :key="i" class="star" :class="{on: i <= story.last.stars}" :style="{animationDelay: (0.15 + i * 0.18) + 's'}">★</span>
      </div>
      <p class="muted" style="margin:0">Goal reached with {{ story.last.stars === 3 ? 'lots of' : story.last.stars === 2 ? 'some' : 'just a little' }} time to spare. Finish faster for more stars.</p>
      <p v-if="story.last.newBadges && story.last.newBadges.length" class="new-best">New sticker: {{ story.last.newBadges.map(b => b.icon + ' ' + b.name).join(', ') }}</p>
      <div class="actions">
        <button v-if="!isLast" type="button" class="btn go big pixel" @click="nextChapter">Next chapter ▶</button>
        <button type="button" class="btn" @click="openChapter(chapter.id)">Play again</button>
        <button type="button" class="btn soft" @click="go('stories')">Chapters</button>
      </div>
    </section>
  </transition>
  <p class="hint">Keyboard: Enter or Space continues the story, and Enter starts the round.</p>
</main>`
};
