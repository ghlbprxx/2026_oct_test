// Small "‹ Label" link back to another view.
import { go } from '../core/state.js';

export default {
  props: { to: { type: String, required: true } },
  setup() { return { go }; },
  template: `<button type="button" class="back" @click="go(to)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg><slot></slot></button>`
};
