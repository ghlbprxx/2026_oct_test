// Sticker book.
import { earned } from '../core/state.js';
import { earnedCount } from '../core/game.js';
import { BADGES } from '../data/practice.js';

export default {
  setup() {
    return { earned, earnedCount, badges: BADGES };
  },
  template: `
<main class="stack">
  <div>
    <back-link to="home">Home</back-link>
    <div class="row-head"><h1 class="page-title">Sticker book</h1><span class="count">{{ earnedCount }} / {{ badges.length }}</span></div>
  </div>
  <ul class="stickers">
    <li v-for="b in badges" :key="b.id" class="sticker" :class="['tone-' + b.tone, {got: earned[b.id]}]">
      <span class="sticker-icon" aria-hidden="true">{{ b.icon }}</span>
      <span class="sticker-name">{{ b.name }}</span>
      <span class="sticker-how">{{ earned[b.id] ? 'Earned!' : b.how }}</span>
    </li>
  </ul>
</main>`
};
