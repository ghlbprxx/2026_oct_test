import { inject, reactive } from 'vue';
import ParamSlider from './ParamSlider.js';

// Groups and sliders are generated entirely from the registry.
export default {
  name: 'ParamSidebar',
  components: { ParamSlider },
  setup() {
    const game = inject('game');
    const groups = inject('groups');
    const sections = groups.map((g) => ({ ...g, params: game.registry.filter((p) => p.group === g.id) }));
    const collapsed = reactive(Object.fromEntries(groups.map((g) => [g.id, !g.enabled])));
    return { game, state: game.state, sections, collapsed };
  },
  template: `
    <aside class="sidebar">
      <div class="sidebar__head">
        <h2>Your walker</h2>
        <button class="btn btn--ghost" :disabled="state.status === 'timeup'" @click="game.resetParams()">Reset</button>
      </div>
      <section v-for="g in sections" :key="g.id" class="group" :class="{ 'group--soon': !g.enabled }">
        <button class="group__head" :aria-expanded="!collapsed[g.id]" @click="collapsed[g.id] = !collapsed[g.id]">
          <span>{{ collapsed[g.id] ? '▸' : '▾' }} {{ g.label }}</span>
          <span v-if="!g.enabled" class="chip chip--soon">Coming soon</span>
        </button>
        <div v-show="!collapsed[g.id]" class="group__body">
          <ParamSlider v-for="p in g.params" :key="p.id" :param="p"
                       :disabled="!p.enabled || state.status === 'timeup'" />
        </div>
      </section>
    </aside>
  `,
};
