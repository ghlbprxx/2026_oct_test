// A timed round. In story mode it also shows the chapter goal as a meter (a boss's HP or a quest's progress).
import { setupLabel, game, kazu, sound } from '../core/state.js';
import { toggleSound } from '../core/audio.js';
import { floats, shownScore, mult, timePct, goalPct, hintText, press, backspace, clearInput, submit, pauseGame, resumeGame, quitGame, restartGame } from '../core/game.js';
import { chapter } from '../core/story.js';
import { CAST } from '../data/stories.js';
import { OP_SYM } from '../data/problems.js';
import { artFor } from '../data/assets.js';
const { computed } = Vue;

export default {
  setup() {
    const isStory = computed(() => !!game.cfg && game.cfg.mode === 'story');
    const foe = computed(() => isStory.value && chapter.value.foe ? CAST[chapter.value.foe] : null);
    const foeSrc = computed(() => foe.value ? artFor(foe.value.art) : null);
    const title = computed(() => isStory.value ? chapter.value.title : setupLabel.value);
    return { game, kazu, sound, toggleSound, floats, shownScore, mult, timePct, goalPct, hintText, press, backspace, clearInput, submit, pauseGame, resumeGame, quitGame, restartGame,
      isStory, chapter, foe, foeSrc, title, OP_SYM };
  },
  template: `
<main class="play">
  <div class="play-top">
    <button type="button" class="icon-btn solid" @click="pauseGame" :disabled="game.phase!=='playing'" aria-label="Pause">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"></path></svg>
    </button>
    <h1 class="play-title">{{ title }}</h1>
    <button type="button" class="icon-btn solid" @click="toggleSound" :aria-label="sound ? 'Mute sound' : 'Turn sound on'">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"></path><path v-if="sound" d="M16.5 8.5a5 5 0 0 1 0 7"></path><path v-else d="M17 9l5 6M22 9l-5 6"></path></svg>
    </button>
  </div>

  <div class="hud">
    <div class="hud-cell"><span class="hud-label">Score</span><span class="hud-val">{{ shownScore }}</span></div>
    <div class="hud-cell"><span class="hud-label">Time</span><span class="hud-val">{{ Math.ceil(game.timeLeft) }}<small>s</small></span></div>
    <div class="hud-cell"><span class="hud-label">Streak</span><span class="hud-val">{{ game.streak }}<span class="mult" v-if="mult>1">×{{ mult }}</span></span></div>
  </div>
  <div class="timer" role="progressbar" aria-label="Time left" :aria-valuenow="Math.ceil(game.timeLeft)" aria-valuemin="0" :aria-valuemax="game.cfg ? game.cfg.duration : 60">
    <div class="timer-fill" :class="{low: game.timeLeft<=10}" :style="{width: timePct + '%'}"></div>
  </div>
  <!-- story goal: a boss's HP drains, a quest's meter fills -->
  <div v-if="isStory" class="goal" :class="{boss: !!foe}">
    <div class="goal-head"><span>{{ chapter.meter }}</span><span class="num">{{ foe ? Math.max(0, game.cfg.goal - shownScore) : Math.min(shownScore, game.cfg.goal) }} / {{ game.cfg.goal }}</span></div>
    <div class="goal-bar" role="progressbar" :aria-label="chapter.meter" :aria-valuenow="game.score" aria-valuemin="0" :aria-valuemax="game.cfg.goal"><div class="goal-fill" :style="{width: (foe ? 100 - goalPct : goalPct) + '%'}"></div></div>
  </div>
  <p class="hint-pill">{{ hintText }}</p>

  <div class="scene">
    <sakura-scene></sakura-scene>
    <span v-if="kazu.say" class="say" :key="'ps' + kazu.key">{{ kazu.say }}</span>
    <div class="mascot" :class="{left: !!foe}"><span class="kz-shadow" aria-hidden="true"></span><kazu-mascot :mood="kazu.react || 'idle'" :key="'pk' + kazu.key"></kazu-mascot></div>
    <div v-if="foe" class="foe" :class="{down: game.phase === 'finishing'}" aria-hidden="true">
      <span class="foe-body" :key="'h' + game.hits" :class="{hit: game.hits > 0}"><img v-if="foeSrc" :src="foeSrc" alt=""><span v-else>{{ foe.emoji }}</span></span>
    </div>
    <div v-if="game.phase === 'finishing'" class="ko" aria-hidden="true">{{ foe ? 'K.O.!' : 'Goal!' }}</div>
  </div>

  <div class="qcard" aria-live="polite">
    <span v-for="f in floats" :key="f.id" class="float" :class="f.kind">{{ f.text }}</span>
    <transition name="fade" mode="out-in">
      <div v-if="game.phase==='countdown'" class="countdown" :key="'c' + game.count">{{ game.count > 0 ? game.count : 'Go' }}</div>
      <div v-else class="q-face" :key="'q' + game.qid">
        <div class="problem"><span>{{ game.q.a }}</span><span class="op">{{ OP_SYM[game.q.op] }}</span><span>{{ game.q.b }}</span><span class="op">=</span></div>
        <div class="answer-box" :class="game.feedback" :aria-label="'Your answer: ' + (game.input || 'blank')">
          <template v-if="game.feedback==='wrong'">{{ game.q.ans }}</template>
          <template v-else><span v-if="game.input">{{ game.input }}</span><span v-if="!game.feedback" class="caret" aria-hidden="true"></span></template>
        </div>
        <p class="typed"><template v-if="game.feedback==='wrong'">You typed <s>{{ game.typed }}</s>. Here's the answer.</template></p>
      </div>
    </transition>
  </div>

  <number-pad @digit="press" @back="backspace" @clear="clearInput"></number-pad>
  <button type="button" class="check-btn" @click="submit" :disabled="game.phase!=='playing' || !game.input || !!game.feedback">
    Check answer <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
  </button>
  <p class="hint">Keyboard works too: numbers, Enter, Backspace, C to clear, Esc to pause.</p>

  <transition name="fade">
  <div class="overlay" v-if="game.phase==='paused'">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <h2 id="pause-title">Paused</h2>
      <p class="muted" style="margin:0">The clock is stopped. Score so far: <span class="num">{{ game.score }}</span></p>
      <button type="button" class="btn go" @click="resumeGame">Keep playing</button>
      <button type="button" class="btn" @click="restartGame">Start over</button>
      <button type="button" class="btn" @click="quitGame">{{ isStory ? 'Back to the story' : 'Quit to menu' }}</button>
    </div>
  </div>
  </transition>
</main>`
};
