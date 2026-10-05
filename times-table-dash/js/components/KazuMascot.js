// Kazu, the chibi fox-cat mascot. Moods: idle, happy, shock, cheer. Drawn SVG fallback when art is missing.
import { ART, artOk } from '../data/assets.js';

const K = '#1c2240';
const starPts = (cx, cy, R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); } return p.join(' '); };
export default {
  props: { mood: { type: String, default: 'idle' } },
  setup() { return { ART, artOk, starL: starPts(50, 86, 13, 5.5), starR: starPts(90, 86, 13, 5.5) }; },
  template: `
<div v-if="artOk[mood]" class="kazu kazu-art" :class="mood"><img class="kz-all" :src="ART[mood]" alt="" draggable="false"></div>
<svg v-else class="kazu" :class="mood" viewBox="-14 -14 168 168" aria-hidden="true" focusable="false">
 <g class="kz-all">
<path d="M104 116 C138 114 146 82 130 62 C126 86 116 98 98 102 Z" fill="#f2b06a" stroke="${K}" stroke-width="3.5" stroke-linejoin="round"></path>
<path d="M128 66 C136 78 134 92 126 100 C128 88 126 76 122 70 Z" fill="#fff1dc"></path>
<g stroke-linecap="round">
 <path d="M30 104 L18 122" stroke="${K}" stroke-width="15"></path><path d="M30 104 L18 122" stroke="#f2b06a" stroke-width="9"></path>
 <path d="M110 104 L122 122" stroke="${K}" stroke-width="15"></path><path d="M110 104 L122 122" stroke="#f2b06a" stroke-width="9"></path>
</g>
<path d="M28 56 L32 10 L64 40 Z" fill="#f2b06a" stroke="${K}" stroke-width="3.5" stroke-linejoin="round"></path>
<path d="M35 44 L37 22 L53 38 Z" fill="#f2a9b6"></path>
<path d="M112 56 L108 10 L76 40 Z" fill="#f2b06a" stroke="${K}" stroke-width="3.5" stroke-linejoin="round"></path>
<path d="M105 44 L103 22 L87 38 Z" fill="#f2a9b6"></path>
<ellipse cx="70" cy="84" rx="52" ry="46" fill="#f2b06a" stroke="${K}" stroke-width="3.5"></ellipse>
<ellipse cx="70" cy="106" rx="31" ry="17" fill="#fff1dc"></ellipse>
<path d="M20 64 Q70 42 120 64 L119 76 Q70 56 21 76 Z" fill="#6f9c88" stroke="${K}" stroke-width="3.5" stroke-linejoin="round"></path>
<g v-if="mood==='idle'" class="kz-eyes">
 <ellipse cx="50" cy="88" rx="9.5" ry="12.5" fill="#2a2350"></ellipse><circle cx="46.5" cy="82.5" r="3.8" fill="#ffffff"></circle>
 <ellipse cx="90" cy="88" rx="9.5" ry="12.5" fill="#2a2350"></ellipse><circle cx="86.5" cy="82.5" r="3.8" fill="#ffffff"></circle>
</g>
<g v-if="mood==='happy'" fill="none" stroke="#2a2350" stroke-width="4.5" stroke-linecap="round">
 <path d="M40 92 Q50 79 60 92"></path><path d="M80 92 Q90 79 100 92"></path>
</g>
<g v-if="mood==='shock'">
 <ellipse cx="50" cy="88" rx="10" ry="12" fill="#ffffff" stroke="${K}" stroke-width="3"></ellipse><circle cx="50" cy="89" r="2.6" fill="${K}"></circle>
 <ellipse cx="90" cy="88" rx="10" ry="12" fill="#ffffff" stroke="${K}" stroke-width="3"></ellipse><circle cx="90" cy="89" r="2.6" fill="${K}"></circle>
</g>
<g v-if="mood==='cheer'">
 <polygon :points="starL" fill="#e8c46a" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"></polygon>
 <polygon :points="starR" fill="#e8c46a" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"></polygon>
</g>
<ellipse cx="34" cy="104" rx="8" ry="4.5" fill="#f2a9b6" opacity=".8"></ellipse>
<ellipse cx="106" cy="104" rx="8" ry="4.5" fill="#f2a9b6" opacity=".8"></ellipse>
<path v-if="mood==='idle'" d="M62 104 q4 5 8 0 q4 5 8 0" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
<path v-if="mood==='happy' || mood==='cheer'" d="M59 102 Q70 118 81 102 Z" fill="#c2566b" stroke="${K}" stroke-width="3" stroke-linejoin="round"></path>
<ellipse v-if="mood==='shock'" cx="70" cy="108" rx="5" ry="6" fill="#c2566b" stroke="${K}" stroke-width="3"></ellipse>
 </g>
</svg>`
};
