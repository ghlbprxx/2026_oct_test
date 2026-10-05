// Schoolyard backdrop: illustrated art when it loads, otherwise a drawn SVG fallback. Petals drift slowly.
import { ART, artOk } from '../data/assets.js';

const BLOSSOMS = (function () {
  const out = []; let s = 11;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const cluster = (cx, cy, w, h, n) => { for (let i = 0; i < n; i++) { const r = rnd(); out.push({ cx: (cx + (rnd() - 0.5) * w).toFixed(1), cy: (cy + (rnd() - 0.5) * h).toFixed(1), r: (7 + rnd() * 10).toFixed(1), c: r < 0.4 ? 's-bl1' : r < 0.85 ? 's-bl2' : 's-bl3' }); } };
  cluster(20, 18, 90, 52, 18); cluster(384, 16, 96, 50, 18); cluster(376, 98, 52, 44, 10); cluster(12, 110, 40, 46, 9);
  return out;
})();
const PETALS = Array.from({ length: 5 }, (_, i) => ({ left: (12 + i * 18) + '%', animationDuration: (11 + (i % 3) * 2.5) + 's', animationDelay: (-i * 2.4) + 's' }));
const WIN_LOW = [32, 48, 64, 80, 96, 112, 128], WIN_UP = [58, 74, 90, 106];
export default {
  setup() { return { BLOSSOMS, PETALS, WIN_LOW, WIN_UP, ART, artOk }; },
  template: `
<div class="scene-bg" :style="artOk.scene ? {backgroundImage: 'url(' + ART.scene + ')'} : null" aria-hidden="true">
 <svg v-if="!artOk.scene" class="scene-svg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice">
<defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-sky1"></stop><stop offset="1" class="s-sky2"></stop></linearGradient></defs>
<rect width="400" height="160" fill="url(#skyG)"></rect>
<g class="s-cloud"><ellipse cx="150" cy="34" rx="34" ry="10"></ellipse><ellipse cx="168" cy="27" rx="20" ry="11"></ellipse><ellipse cx="276" cy="48" rx="28" ry="8"></ellipse><ellipse cx="290" cy="42" rx="16" ry="9"></ellipse></g>
<path class="s-hill2" d="M0 116 Q70 88 150 108 T300 98 T400 104 V160 H0Z"></path>
<path class="s-hill" d="M0 126 Q90 108 190 122 T400 118 V160 H0Z"></path>
<rect class="s-wall" x="48" y="58" width="72" height="26"></rect>
<rect class="s-win" v-for="x in WIN_UP" :key="'u'+x" :x="x" y="64" width="8" height="9" rx="1"></rect>
<path class="s-roof" d="M34 64 Q52 60 58 50 L110 50 Q116 60 134 64 Z"></path>
<rect class="s-wall" x="24" y="88" width="120" height="48"></rect>
<rect class="s-win" v-for="x in WIN_LOW" :key="'a'+x" :x="x" y="98" width="9" height="10" rx="1"></rect>
<rect class="s-win" v-for="x in WIN_LOW" :key="'b'+x" :x="x" y="116" width="9" height="10" rx="1"></rect>
<path class="s-roof" d="M10 94 Q32 88 40 78 L128 78 Q136 88 158 94 Z"></path>
<rect class="s-wall" x="300" y="104" width="56" height="32"></rect>
<rect class="s-win" x="310" y="112" width="10" height="10" rx="1"></rect><rect class="s-win" x="336" y="112" width="10" height="10" rx="1"></rect>
<path class="s-roof" d="M286 110 Q300 106 306 96 L350 96 Q356 106 370 110 Z"></path>
<path class="s-roof" d="M306 98 Q316 94 320 86 L336 86 Q340 94 350 98 Z"></path>
<rect class="s-ground" x="0" y="136" width="400" height="24"></rect>
<path class="s-trunk" stroke-width="7" d="M-6 160 C8 132 6 112 22 88"></path>
<path class="s-trunk" stroke-width="5" d="M-4 30 C18 28 40 22 60 28"></path>
<path class="s-trunk" stroke-width="7" d="M406 160 C394 134 398 116 382 96"></path>
<path class="s-trunk" stroke-width="5" d="M404 34 C384 28 362 24 344 30"></path>
<circle v-for="(b, i) in BLOSSOMS" :key="i" :class="b.c" :cx="b.cx" :cy="b.cy" :r="b.r"></circle>
 </svg>
 <span v-for="(p, i) in PETALS" :key="'p'+i" class="petal" :style="p"></span>
</div>`
};
