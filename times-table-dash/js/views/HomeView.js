// Home: a greeting, Kazu, and two clear choices (stories or practice).
import { settings, tablesLabel, kazu, kazuReact, go } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { earnedCount } from '../core/game.js';
import { storyHomeLine, storiesDone } from '../core/story.js';
import { openCheat } from '../core/cheat.js';
import { BADGES, HOME_LINES } from '../data/practice.js';
const { ref } = Vue;

export default {
  setup() {
    const homeLine = ref(0);
    function pokeKazu() { homeLine.value = (homeLine.value + 1) % HOME_LINES.length; kazuReact('happy', 700); sfx.tick(); }
    return { settings, tablesLabel, kazu, go, earnedCount, badges: BADGES, storyHomeLine, storiesDone, openCheat, homeLines: HOME_LINES, homeLine, pokeKazu };
  },
  template: `
<main class="stack">
  <section class="home-hero stack">
    <div>
      <h1 class="greet">Hi there! What shall we do today?</h1>
      <p class="page-sub">Read a story and solve its puzzles, or practice your times tables.</p>
    </div>
    <div class="scene">
      <sakura-scene></sakura-scene>
      <span class="say" :key="'h' + homeLine">{{ homeLines[homeLine] }}</span>
      <button type="button" class="mascot" @click="pokeKazu" aria-label="Tap Kazu for a tip">
        <span class="kz-shadow" aria-hidden="true"></span>
        <kazu-mascot :mood="kazu.react || 'idle'" :key="'hk' + kazu.key"></kazu-mascot>
      </button>
    </div>
  </section>

  <div class="choices">
    <button type="button" class="choice tone-rose" @click="go('stories')">
      <span class="choice-icon" aria-hidden="true">📖</span>
      <span class="choice-title">Story mode</span>
      <span class="choice-sub">{{ storyHomeLine }}</span>
      <span class="choice-go">{{ storiesDone ? 'Continue' : 'Start reading' }} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
    </button>
    <button type="button" class="choice tone-accent" @click="go('practice')">
      <span class="choice-icon" aria-hidden="true">⏱️</span>
      <span class="choice-title">Times table practice</span>
      <span class="choice-sub">{{ settings.tables.length ? tablesLabel : 'Pick your tables' }} · {{ settings.duration }} sec rounds</span>
      <span class="choice-go">Practice <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
    </button>
  </div>

  <nav class="quiet-links" aria-label="More">
    <button type="button" class="link" @click="go('stickers')">Sticker book ({{ earnedCount }}/{{ badges.length }})</button>
    <button type="button" class="link" @click="openCheat">Cheat sheet</button>
  </nav>
</main>`
};
