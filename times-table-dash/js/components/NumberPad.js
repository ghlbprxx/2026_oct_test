// On-screen number pad shared by the story reader and the practice round.
export default {
  emits: ['digit', 'back', 'clear'],
  template: `
<div class="keypad" role="group" aria-label="Number pad">
  <button type="button" class="key" v-for="d in [1,2,3,4,5,6,7,8,9]" :key="d" @click="$emit('digit', String(d))">{{ d }}</button>
  <button type="button" class="key alt" @click="$emit('back')" aria-label="Delete last digit"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 7h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H11l-8-9z"></path><path d="M15 12l8 8M23 12l-8 8"></path></svg></button>
  <button type="button" class="key" @click="$emit('digit', '0')">0</button>
  <button type="button" class="key alt" @click="$emit('clear')" aria-label="Clear answer">C</button>
</div>`
};
