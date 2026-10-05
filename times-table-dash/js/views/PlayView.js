// The timed practice round.
import { settings, tablesLabel, game, kazu, sound } from '../core/state.js';
import { toggleSound } from '../core/audio.js';
import { floats, shownScore, mult, timePct, hintText, startGame, press, backspace, clearInput, submit, pauseGame, resumeGame, quitGame } from '../core/game.js';

export default {
  setup() {
    return { settings, tablesLabel, game, kazu, sound, toggleSound, floats, shownScore, mult, timePct, hintText, startGame, press, backspace, clearInput, submit, pauseGame, resumeGame, quitGame };
  },
  template: `
<main class="play">
  <div class="play-top">
    <button type="button" class="icon-btn solid" @click="pauseGame" :disabled="game.phase!=='playing'" aria-label="Pause">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"></path></svg>
    </button>
    <h1 class="play-title">{{ tablesLabel }}</h1>
    <button type="button" class="icon-btn solid" @click="toggleSound" :aria-label="sound ? 'Mute sound' : 'Turn sound on'">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"></path><path v-if="sound" d="M16.5 8.5a5 5 0 0 1 0 7"></path><path v-else d="M17 9l5 6M22 9l-5 6"></path></svg>
    </button>
  </div>

  <div class="hud">
    <div class="hud-cell"><span class="hud-label">Score</span><span class="hud-val">{{ shownScore }}</span></div>
    <div class="hud-cell"><span class="hud-label">Time</span><span class="hud-val">{{ Math.ceil(game.timeLeft) }}<small>s</small></span></div>
    <div class="hud-cell"><span class="hud-label">Streak</span><span class="hud-val">{{ game.streak }}<span class="mult" v-if="mult>1">×{{ mult }}</span></span></div>
  </div>
  <div class="timer" role="progressbar" aria-label="Time left" :aria-valuenow="Math.ceil(game.timeLeft)" aria-valuemin="0" :aria-valuemax="settings.duration">
    <div class="timer-fill" :class="{low: game.timeLeft<=10}" :style="{width: timePct + '%'}"></div>
  </div>
  <p class="hint-pill">{{ hintText }}</p>

  <div class="scene">
    <sakura-scene></sakura-scene>
    <span v-if="kazu.say" class="say" :key="'ps' + kazu.key">{{ kazu.say }}</span>
    <div class="mascot"><span class="kz-shadow" aria-hidden="true"></span><kazu-mascot :mood="kazu.react || 'idle'" :key="'pk' + kazu.key"></kazu-mascot></div>
  </div>

  <div class="qcard" aria-live="polite">
    <span v-for="f in floats" :key="f.id" class="float" :class="f.kind">{{ f.text }}</span>
    <transition name="fade" mode="out-in">
      <div v-if="game.phase==='countdown'" class="countdown" :key="'c' + game.count">{{ game.count > 0 ? game.count : 'Go' }}</div>
      <div v-else class="q-face" :key="'q' + game.qid">
        <div class="problem"><span>{{ game.q.a }}</span><span class="op">×</span><span>{{ game.q.b }}</span><span class="op">=</span></div>
        <div class="answer-box" :class="game.feedback" :aria-label="'Your answer: ' + (game.input || 'blank')">
          <template v-if="game.feedback==='wrong'">{{ game.q.a * game.q.b }}</template>
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
      <button type="button" class="btn" @click="startGame">Start over</button>
      <button type="button" class="btn" @click="quitGame">Quit to menu</button>
    </div>
  </div>
  </transition>
</main>`
};
