// Entry point: registers shared components, mounts the app, and wires up keyboard input.
import App from './App.js';
import SakuraScene from './components/SakuraScene.js';
import KazuMascot from './components/KazuMascot.js';
import NumberPad from './components/NumberPad.js';
import BackLink from './components/BackLink.js';
import { installInput } from './core/keys.js';

const app = Vue.createApp(App);
app.component('sakura-scene', SakuraScene);
app.component('kazu-mascot', KazuMascot);
app.component('number-pad', NumberPad);
app.component('back-link', BackLink);
app.mount('#app');
installInput();
