// Placeholder art: inline SVG for every image id, used whenever assets/images.json's file is missing.
// Same framing as the prompts describe.
import { rngFrom } from './sim/rng.js';

export const ART = (() => {
  const OL = '#2a1b2e', f = n => n.toFixed(1);
  const wrap = (w, h, d, b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${d}</defs>${b}</svg>`;
  const uri = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * 0.1)}" fill="#000" opacity=".13"/>`;
  const arc = (cx, cy, r, a0, a1) => `M${f(cx + Math.cos(a0) * r)} ${f(cy + Math.sin(a0) * r)} A${r} ${r} 0 0 1 ${f(cx + Math.cos(a1) * r)} ${f(cy + Math.sin(a1) * r)}`;

  function plate(p, col) {
    const r = rngFrom(7);
    let d = `<radialGradient id="${p}a"><stop offset="0" stop-color="#f1dfae"/><stop offset="1" stop-color="#dcbd78"/></radialGradient>`;
    let b = shadow(256, 478, 200) + `<circle cx="256" cy="250" r="222" fill="#f6f2f7" stroke="${OL}" stroke-width="6"/><circle cx="256" cy="250" r="208" fill="none" stroke="#d7cddb" stroke-width="3"/><circle cx="256" cy="250" r="200" fill="url(#${p}a)"/>`;
    if (col) {
      d += `<radialGradient id="${p}m"><stop offset="0" stop-color="#fffdf8"/><stop offset=".85" stop-color="#f7f2e6"/><stop offset="1" stop-color="#ebe0c8"/></radialGradient>`;
      b += `<circle cx="256" cy="250" r="198" fill="url(#${p}m)"/>`;
      let path = '';
      for (let i = 0; i < 70; i++) {
        let a = i / 70 * 6.283 + r() * 0.08, x = 256, y = 250; path += `M${x} ${y}`;
        for (let s = 0; s < 16; s++) { a += (r() - 0.5) * 0.35; x += Math.cos(a) * 12; y += Math.sin(a) * 12; if (Math.hypot(x - 256, y - 250) > 192) break; path += `L${f(x)} ${f(y)}`; }
      }
      b += `<path d="${path}" fill="none" stroke="#e1d5bc" stroke-width="2.2" stroke-linecap="round" opacity=".85"/><rect x="240" y="234" width="32" height="32" rx="4" fill="#e7d7b2" stroke="#c9b48a" stroke-width="2"/>`;
    }
    b += `<path d="${arc(256, 250, 214, 3.55, 4.35)}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".75"/>`;
    return wrap(512, 512, d, b);
  }

  function jar(p, col) {
    const r = rngFrom(11);
    const d = `<clipPath id="${p}c"><rect x="128" y="138" width="256" height="336" rx="36"/></clipPath>`;
    let k = '';
    for (let y = 146; y < 476; y += 11) for (let x = 132; x < 384; x += 16) {
      const c = ['#a9763f', '#b8854a', '#94632f', '#c2914f'][Math.floor(r() * 4)];
      k += `<ellipse cx="${f(x + (r() - 0.5) * 6)}" cy="${f(y + (r() - 0.5) * 5)}" rx="9.5" ry="6" transform="rotate(${Math.floor(r() * 180)} ${f(x)} ${f(y)})" fill="${c}" stroke="#6f4520" stroke-width="1.2"/>`;
    }
    let b = shadow(256, 490, 150) + `<rect x="120" y="92" width="272" height="390" rx="46" fill="#eaf3f6" opacity=".9"/>`;
    b += `<g clip-path="url(#${p}c)"><rect x="120" y="130" width="272" height="360" fill="#8f5f2e"/>${k}`;
    if (col) {
      b += `<rect x="120" y="130" width="272" height="360" fill="#fbf8f1" opacity=".9"/>`;
      let h = ''; for (let i = 0; i < 120; i++) { const x = 130 + r() * 252, y = 142 + r() * 330, a = r() * 6.283; h += `M${f(x)} ${f(y)}l${f(Math.cos(a) * 14)} ${f(Math.sin(a) * 14)}`; }
      b += `<path d="${h}" stroke="#e6dcc6" stroke-width="2" stroke-linecap="round"/>`;
    }
    b += `</g><rect x="120" y="92" width="272" height="390" rx="46" fill="none" stroke="${OL}" stroke-width="6"/><rect x="144" y="122" width="20" height="320" rx="10" fill="#fff" opacity=".5"/>`;
    b += `<rect x="146" y="40" width="220" height="58" rx="12" fill="#9aa0aa" stroke="${OL}" stroke-width="6"/><circle cx="256" cy="69" r="17" fill="#efe9de" stroke="#b9b0a2" stroke-width="3"/>`;
    return wrap(512, 512, d, b);
  }

  const BAG = 'M150 26 L362 26 L394 468 Q396 488 374 488 L138 488 Q116 488 118 468 Z';
  function bag(p, sub) {
    const r = rngFrom(sub.length * 13);
    const d = `<clipPath id="${p}c"><path d="${BAG}"/></clipPath>`;
    let s = '';
    if (sub === 'straw') { s = `<rect x="100" y="200" width="320" height="300" fill="#d9b65a"/>`; for (let i = 0; i < 170; i++) { const x = 115 + r() * 285, y = 205 + r() * 280, a = r() * 6.283, c = r() < 0.5 ? '#b8952f' : '#ecd27a'; s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * 22)} ${f(Math.sin(a) * 22)}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`; } }
    else if (sub === 'sawdust') { s = `<rect x="100" y="200" width="320" height="300" fill="#8a6040"/>`; for (let i = 0; i < 420; i++) { const c = ['#6e4a2e', '#a57a52', '#d2ad73'][Math.floor(r() * 3)]; s += `<circle cx="${f(110 + r() * 300)}" cy="${f(205 + r() * 285)}" r="${f(1.6 + r() * 2.4)}" fill="${c}"/>`; } }
    else if (sub === 'coir') { s = `<rect x="100" y="200" width="320" height="300" fill="#5e3b23"/>`; for (let i = 0; i < 260; i++) { const x = 110 + r() * 300, y = 205 + r() * 285, a = r() * 6.283; s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * 9)} ${f(Math.sin(a) * 9)}" stroke="#7a5032" stroke-width="2.5" stroke-linecap="round"/>`; } for (let i = 0; i < 90; i++) s += `<circle cx="${f(110 + r() * 300)}" cy="${f(205 + r() * 285)}" r="${f(2 + r() * 2)}" fill="#d8d2c4"/>`; }
    else { s = `<rect x="100" y="200" width="320" height="300" fill="#fbf8f1"/>`; for (let i = 0; i < 140; i++) { const x = 110 + r() * 300, y = 205 + r() * 285, a = r() * 6.283; s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * 16)} ${f(Math.sin(a) * 16)}" stroke="#e6dcc6" stroke-width="2.4" stroke-linecap="round"/>`; } }
    let b = shadow(256, 492, 150) + `<path d="${BAG}" fill="#f3f4f6" opacity=".85"/><g clip-path="url(#${p}c)">${s}<path d="M100 200 Q256 186 420 200" stroke="#000" stroke-opacity=".12" stroke-width="4" fill="none"/></g>`;
    b += `<path d="M138 150 L374 150" stroke="#cfd3da" stroke-width="3"/><rect x="214" y="54" width="84" height="50" rx="8" fill="#ece6db" stroke="#b9b0a2" stroke-width="3"/>`;
    for (let i = 0; i < 12; i++) b += `<circle cx="${226 + (i % 6) * 12}" cy="${70 + Math.floor(i / 6) * 16}" r="2" fill="#c9c0b0"/>`;
    b += `<path d="${BAG}" fill="none" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M152 60 L140 420" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".5"/>`;
    return wrap(512, 512, d, b);
  }

  function block(tone = '#fbf8f1', shrink = 0) {
    const r = rngFrom(5);
    let b = shadow(256, 490, 140) + `<rect x="${150 + shrink}" y="${262 + shrink * 1.4}" width="${212 - shrink * 2}" height="${222 - shrink * 1.4}" rx="28" fill="${tone}" stroke="${OL}" stroke-width="6"/>`;
    let t = ''; for (let i = 0; i < 40; i++) { const x = 168 + shrink + r() * (170 - shrink * 2), y = 282 + shrink + r() * 180, a = r() * 6.283; t += `M${f(x)} ${f(y)}l${f(Math.cos(a) * 12)} ${f(Math.sin(a) * 12)}`; }
    b += `<path d="${t}" stroke="#000" stroke-opacity=".07" stroke-width="2" stroke-linecap="round"/><path d="M236 318 L276 350 M276 318 L236 350" stroke="#cdbfa6" stroke-width="6" stroke-linecap="round"/>`;
    return b;
  }

  // Fan-shaped oyster caps growing out of a base point.
  function cluster(p, bx, by, o) {
    const r = rngFrom(o.seed || 5), caps = [], n = o.n;
    for (let i = 0; i < n; i++) { const fr = n === 1 ? 0.5 : i / (n - 1); caps.push({ a: -Math.PI + 0.28 + fr * (Math.PI - 0.56) + (r() - 0.5) * 0.18, k: 0.75 + r() * 0.4, ph: r() * 6, o: Math.abs(fr - 0.5) }); }
    caps.sort((x, y) => x.o - y.o);
    const d = `<radialGradient id="${p}g"><stop offset="0" stop-color="${o.col}"/><stop offset=".62" stop-color="${o.col}"/><stop offset="1" stop-color="${o.deep}"/></radialGradient>`;
    let b = `<ellipse cx="${bx}" cy="${by - 4}" rx="${f(o.size * 0.35)}" ry="${f(o.size * 0.22)}" fill="${o.gill}" stroke="${OL}" stroke-width="3"/>`;
    for (const c of caps) {
      const R = o.size * c.k, L = (o.stem + o.size * 0.55) * (0.8 + c.o * 0.6), sx = bx + Math.cos(c.a) * L, sy = by + Math.sin(c.a) * L * 0.9;
      const q = `M${bx} ${by} Q${f(bx + Math.cos(c.a) * L * 0.5)} ${f(by + Math.sin(c.a) * L * 0.6)} ${f(sx)} ${f(sy)}`, sw = Math.max(9, R * 0.3);
      b += `<path d="${q}" stroke="${OL}" stroke-width="${f(sw + 6)}" stroke-linecap="round" fill="none"/><path d="${q}" stroke="${o.gill}" stroke-width="${f(sw)}" stroke-linecap="round" fill="none"/>`;
      const pts = [], steps = 40, span = 0.95, sq = o.flat ? 0.55 : 0.8;
      for (let j = 0; j <= steps; j++) { const th = c.a - span + j / steps * span * 2, rad = R * (1 + o.amp * Math.sin(th * o.freq + c.ph)) * (1 - 0.18 * Math.abs(j / steps - 0.5) * 2); pts.push([sx + Math.cos(th) * rad, sy + Math.sin(th) * rad * sq]); }
      b += `<path d="M${f(sx)} ${f(sy)}${pts.map(q => `L${f(q[0])} ${f(q[1])}`).join('')}Z" fill="url(#${p}g)" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`;
      let gl = ''; for (let j = 1; j < steps; j += 2) { const q = pts[j]; gl += `M${f(sx)} ${f(sy)}L${f(sx + (q[0] - sx) * 0.9)} ${f(sy + (q[1] - sy) * 0.9)}`; }
      b += `<path d="${gl}" stroke="${o.gill}" stroke-width="1.6" opacity=".55"/>`;
      if (o.dry) { let cr = ''; for (let j = 3; j < steps; j += 6) { const q = pts[j]; cr += `M${f(q[0])} ${f(q[1])}L${f(q[0] + (sx - q[0]) * 0.22)} ${f(q[1] + (sy - q[1]) * 0.22)}`; } b += `<path d="${cr}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`; }
    }
    if (o.dust) for (let i = 0; i < 40; i++) b += `<circle cx="${f(170 + r() * 172)}" cy="${f(300 + r() * 170)}" r="${f(1.5 + r() * 2)}" fill="#f1dbe2" opacity=".85"/>`;
    return { d, b };
  }
  const C_PINK = { col: '#ee6a8c', deep: '#b8325a', gill: '#fde9ee', amp: 0.07, freq: 9 };
  const VARIANTS = {
    young: { ...C_PINK, n: 6, size: 30, stem: 14, seed: 4 },
    peak: { ...C_PINK, n: 9, size: 58, stem: 14, seed: 4 },
    leggy: { ...C_PINK, n: 7, size: 28, stem: 78, seed: 6, amp: 0.05 },
    dry: { ...C_PINK, col: '#e88aa3', deep: '#a7566c', n: 9, size: 54, stem: 14, seed: 4, amp: 0.16, freq: 17, dry: true },
    overripe: { col: '#efb4c3', deep: '#cf8ea1', gill: '#fbeef2', n: 9, size: 64, stem: 12, seed: 4, amp: 0.13, freq: 11, flat: true, dust: true },
  };
  function clusterImg(p, v) { const c = cluster(p, 256, 334, VARIANTS[v]); return wrap(512, 512, c.d, block() + c.b); }
  function pins() { const r = rngFrom(9); let b = block(); for (let i = 0; i < 18; i++) { const a = r() * 6.283, d = r() * 26; b += `<circle cx="${f(256 + Math.cos(a) * d)}" cy="${f(330 + Math.sin(a) * d * 0.7)}" r="${f(4 + r() * 6)}" fill="#e2557a" stroke="${OL}" stroke-width="2"/>`; } return wrap(512, 512, '', b); }
  function spent() { let b = block('#e6dcc6', 12); b += `<path d="M246 330 l-6 -16 M258 328 l2 -18 M268 332 l8 -12" stroke="#8a6040" stroke-width="7" stroke-linecap="round"/>`; return wrap(512, 512, '', b); }
  function mold(p) {
    const r = rngFrom(3), d = `<radialGradient id="${p}m"><stop offset="0" stop-color="#0f5a33"/><stop offset=".45" stop-color="#2f9b55"/><stop offset=".75" stop-color="#bfe6c8" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
    let b = ''; const spots = [[210, 300, 70], [320, 250, 56], [290, 380, 64], [180, 400, 44], [350, 350, 40], [250, 210, 38]];
    for (const [x, y, s] of spots) b += `<circle cx="${x}" cy="${y}" r="${s}" fill="url(#${p}m)"/>`;
    for (let i = 0; i < 60; i++) b += `<circle cx="${f(160 + r() * 220)}" cy="${f(190 + r() * 240)}" r="${f(1 + r() * 2)}" fill="#14633a" opacity=".6"/>`;
    return wrap(512, 512, d, b);
  }
  function crateFresh(p) {
    const c = cluster(p, 128, 120, { ...C_PINK, n: 7, size: 26, stem: 2, seed: 8 });
    let b = shadow(128, 236, 96) + c.b + `<path d="M34 120 L222 120 L200 228 L56 228 Z" fill="#c8945a" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
    for (let y = 140; y < 225; y += 18) b += `<path d="M${40 + (y - 120) * 0.2} ${y} L${216 - (y - 120) * 0.2} ${y}" stroke="#9e6d3b" stroke-width="4"/>`;
    return wrap(256, 256, c.d, b);
  }
  function crateDried() {
    const r = rngFrom(2); let b = shadow(128, 238, 80) + `<rect x="58" y="60" width="140" height="172" rx="26" fill="#eaf3f6" stroke="${OL}" stroke-width="5"/>`;
    for (let i = 0; i < 46; i++) b += `<ellipse cx="${f(76 + r() * 104)}" cy="${f(110 + r() * 110)}" rx="${f(8 + r() * 6)}" ry="${f(4 + r() * 3)}" transform="rotate(${Math.floor(r() * 180)} 128 160)" fill="${['#c9a27e', '#b98a6a', '#d9b3a0'][Math.floor(r() * 3)]}" stroke="#7a5a44" stroke-width="1.5"/>`;
    b += `<rect x="78" y="30" width="100" height="36" rx="8" fill="#c79a66" stroke="${OL}" stroke-width="5"/>`;
    return wrap(256, 256, '', b);
  }
  function cooker(p) {
    const d = `<linearGradient id="${p}s" x1="0" x2="1"><stop offset="0" stop-color="#c9ced6"/><stop offset=".5" stop-color="#f2f4f7"/><stop offset="1" stop-color="#aab1bb"/></linearGradient>`;
    let b = shadow(128, 236, 92) + `<rect x="40" y="96" width="176" height="132" rx="20" fill="url(#${p}s)" stroke="${OL}" stroke-width="5"/><path d="M36 100 Q128 50 220 100 Z" fill="url(#${p}s)" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
    b += `<rect x="6" y="122" width="38" height="16" rx="8" fill="#2a1b2e"/><rect x="212" y="122" width="38" height="16" rx="8" fill="#2a1b2e"/><circle cx="160" cy="74" r="16" fill="#fff" stroke="${OL}" stroke-width="4"/><path d="M160 74 L169 66" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/><rect x="118" y="56" width="12" height="18" rx="3" fill="#2a1b2e"/><path d="M124 48 q-10 -14 2 -26 q10 -10 -2 -20" stroke="#cfd6de" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`;
    return wrap(256, 256, d, b);
  }
  function hero() {
    const nest = (svg, x, y, w) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${w}" `).replace(/ width="512" height="512"/, '');
    let b = `<rect width="1280" height="720" fill="#f8e7ee"/>`;
    for (let x = 0; x < 1280; x += 32) b += `<path d="M${x} 0V720" stroke="#efd5df"/>`;
    for (let y = 0; y < 720; y += 32) b += `<path d="M0 ${y}H1280" stroke="#efd5df"/>`;
    b += `<rect x="40" y="300" width="640" height="22" rx="6" fill="#a07850"/><rect x="40" y="600" width="640" height="22" rx="6" fill="#a07850"/>`;
    b += nest(plate('h1', true), 50, 120, 190) + nest(jar('h2', true), 250, 110, 200) + nest(bag('h3', 'straw'), 460, 110, 200);
    b += nest(jar('h4', false), 60, 410, 200) + nest(bag('h5', 'col'), 270, 410, 200) + nest(pins(), 470, 410, 200);
    b += `<ellipse cx="960" cy="360" rx="330" ry="300" fill="#fff" opacity=".45"/>` + nest(clusterImg('h6', 'peak'), 700, 40, 620);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">${b}</svg>`;
  }
  const gen = {
    plate_empty: () => plate('a', false), plate_colonized: () => plate('a', true),
    jar_empty: () => jar('b', false), jar_colonized: () => jar('b', true),
    bag_straw: () => bag('c', 'straw'), bag_sawdust: () => bag('c', 'sawdust'), bag_coir: () => bag('c', 'coir'), bag_colonized: () => bag('c', 'col'),
    block_ready: () => wrap(512, 512, '', block()), block_pins: pins,
    cluster_young: () => clusterImg('d', 'young'), cluster_peak: () => clusterImg('d', 'peak'), cluster_leggy: () => clusterImg('d', 'leggy'),
    cluster_dry: () => clusterImg('d', 'dry'), cluster_overripe: () => clusterImg('d', 'overripe'), block_spent: spent,
    mold_overlay: () => mold('e'), crate_fresh: () => crateFresh('f'), crate_dried: crateDried, cooker: () => cooker('g'), title_hero: hero,
  };
  const cache = {};
  return {
    ids: Object.keys(gen),
    get(id) {
      if (!cache[id]) cache[id] = gen[id] ? uri(gen[id]()) : uri(wrap(256, 256, '', `<rect width="256" height="256" rx="20" fill="#ddd2e2"/><text x="128" y="134" font-family="monospace" font-size="16" text-anchor="middle" fill="#2a1b2e">${id}</text>`));
      return cache[id];
    },
  };
})();
