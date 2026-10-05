// Practice round results: stars, stats, new stickers and facts to practice.
import { go } from '../core/state.js';
import { result, startGame } from '../core/game.js';

export default {
  setup() {
    return { go, result, startGame };
  },
  template: `
<main class="stack">
  <section class="result-card">
    <div class="scene">
      <sakura-scene></sakura-scene>
      <span class="say">{{ result.say }}</span>
      <div class="mascot"><span class="kz-shadow" aria-hidden="true"></span><kazu-mascot :mood="result.mood"></kazu-mascot></div>
    </div>
    <div class="result-body">
      <p class="eyebrow">Round complete · {{ result.setupLabel }}</p>
      <div class="stars" :aria-label="result.stars + ' out of 3 stars'">
        <span v-for="i in 3" :key="i" class="star" :class="{on: i <= result.stars}" :style="{animationDelay: (0.15 + i * 0.18) + 's'}">★</span>
      </div>
      <h1 class="result-title">{{ result.headline }}</h1>
      <p v-if="result.newBest" class="new-best">New best score!</p>
      <div class="stats">
        <div class="stat" style="--i:0"><span class="stat-val">{{ result.score }}</span><span class="stat-label">Score</span></div>
        <div class="stat" style="--i:1"><span class="stat-val">{{ result.correct }}</span><span class="stat-label">Correct</span></div>
        <div class="stat" style="--i:2"><span class="stat-val">{{ result.wrong }}</span><span class="stat-label">Missed</span></div>
        <div class="stat" style="--i:3"><span class="stat-val">{{ result.accuracy }}%</span><span class="stat-label">Accuracy</span></div>
        <div class="stat" style="--i:4"><span class="stat-val">{{ result.bestStreak }}</span><span class="stat-label">Best streak</span></div>
        <div class="stat" style="--i:5"><span class="stat-val">{{ result.avg }}</span><span class="stat-label">Seconds each</span></div>
      </div>
    </div>
  </section>

  <section class="panel" v-if="result.newBadges.length">
    <h2 class="label">New stickers</h2>
    <ul class="stickers">
      <li v-for="b in result.newBadges" :key="b.id" class="sticker got" :class="'tone-' + b.tone">
        <span class="sticker-icon" aria-hidden="true">{{ b.icon }}</span>
        <span class="sticker-name">{{ b.name }}</span>
        <span class="sticker-how">{{ b.how }}</span>
      </li>
    </ul>
  </section>

  <section class="panel">
    <h2 class="label">Practice these</h2>
    <div class="facts" v-if="result.missed.length">
      <span class="fact" v-for="m in result.missed" :key="m.key">{{ m.t }} × {{ m.n }} = {{ m.t * m.n }}<small v-if="m.count > 1"> ×{{ m.count }}</small></span>
    </div>
    <p v-else class="good-news">No misses this round. Every answer was right!</p>
  </section>

  <div class="actions">
    <button type="button" class="btn go big" @click="startGame">Play again</button>
    <button type="button" class="btn" @click="go('practice')">Change tables</button>
    <button type="button" class="btn soft" @click="go('home')">Home</button>
  </div>
</main>`
};
