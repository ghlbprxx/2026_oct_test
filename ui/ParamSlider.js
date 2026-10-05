import { inject, ref, computed } from 'vue';

export default {
  name: 'ParamSlider',
  props: { param: { type: Object, required: true }, disabled: Boolean },
  setup(props) {
    const game = inject('game');
    const open = ref(false);
    const decimals = computed(() => {
      const s = String(props.param.step);
      return s.includes('.') ? Math.min(s.split('.')[1].length, 3) : 0;
    });
    const value = computed(() => game.state.params[props.param.id]);
    const display = computed(() => Number(value.value).toFixed(decimals.value));
    const highlighted = computed(() => game.state.hint && game.state.hint.level >= 2 && game.state.hint.paramId === props.param.id);
    const onInput = (e) => game.setParam(props.param.id, e.target.value);
    return { open, value, display, onInput, highlighted };
  },
  template: `
    <div class="slider" :class="{ 'slider--disabled': disabled, 'slider--hinted': highlighted }">
      <div class="slider__row">
        <label :for="'p-' + param.id">{{ param.label }}</label>
        <button class="info" :aria-expanded="open" :title="param.explain" @click="open = !open">ⓘ</button>
        <span class="slider__value">{{ display }}<small v-if="param.unit"> {{ param.unit }}</small></span>
      </div>
      <input :id="'p-' + param.id" type="range" :min="param.min" :max="param.max" :step="param.step"
             :value="value" :disabled="disabled" @input="onInput" />
      <p v-if="open" class="slider__explain">{{ param.explain }}</p>
    </div>
  `,
};
