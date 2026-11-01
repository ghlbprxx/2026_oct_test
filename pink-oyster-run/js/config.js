// Admin panel. The ISF block below is the drop-in template, pasted verbatim; only the last line
// is the documented Vue 3 variant.
import { reactive } from 'vue';
import { CONFIG_SCHEMA } from './config-schema.js';

// ===== ISF Admin Panel (drop-in, no dependencies) =====
const ADMIN_ENABLED = true; // false hides the panel in a release build; CONFIG still works
const ISF = (() => {
  const S = CONFIG_SCHEMA, KEY = 'isf:' + location.pathname;
  const build = () => Object.fromEntries(Object.entries(S).map(([g, f]) =>
    [g, Object.fromEntries(Object.entries(f).map(([k, d]) => [k, d.value]))]));
  const defaults = build(), actions = [], rows = [];
  let C = build(), restart = null, bar = null, out = null;
  const m = { events: {}, deaths: {}, runs: [], runStart: performance.now() };

  function diff() {
    const d = {};
    for (const g in C) for (const k in C[g]) if (C[g][k] !== defaults[g][k]) (d[g] ??= {})[k] = C[g][k];
    return d;
  }
  function load(d) {
    for (const g in d || {}) for (const k in d[g]) if (g in C && k in C[g]) C[g][k] = d[g][k];
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(diff())); } catch (e) {} };
  const refresh = () => rows.forEach(sync => sync());
  try { load(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}

  function track(type, data = {}) {
    m.events[type] = (m.events[type] || 0) + 1;
    if (type === 'runStart') m.runStart = performance.now();
    if (type === 'death') { const c = data.cause || 'unknown'; m.deaths[c] = (m.deaths[c] || 0) + 1; }
    if (type === 'runEnd') m.runs.push({ ...data, seconds: Math.round((performance.now() - m.runStart) / 1000) });
  }
  const report = () => JSON.stringify({ configDiff: diff(), metrics: m }, null, 2);

  const kind = d => d.options ? 'enum' : typeof d.value === 'boolean' ? 'bool'
    : typeof d.value === 'number' ? 'num' : /^#[0-9a-f]{6}$/i.test(d.value) ? 'color' : 'text';

  function row(g, k) {
    const d = S[g][k], t = kind(d), r = document.createElement('div'), name = document.createElement('span');
    r.className = 'r'; r.title = d.note || '';
    name.textContent = k + (d.restart ? ' ↻' : '');
    let inp, num;
    if (t === 'enum') { inp = document.createElement('select'); d.options.forEach(o => inp.add(new Option(o, o))); }
    else { inp = document.createElement('input'); inp.type = { bool: 'checkbox', num: 'range', color: 'color', text: 'text' }[t]; }
    if (t === 'num') {
      Object.assign(inp, { min: d.min ?? 0, max: d.max ?? (Math.abs(d.value) * 4 || 1), step: d.step ?? 'any' });
      num = document.createElement('input'); num.type = 'number'; num.step = inp.step;
    }
    const sync = () => {
      const v = C[g][k];
      if (t === 'bool') inp.checked = v; else inp.value = v;
      if (num) num.value = v;
      r.classList.toggle('ch', v !== defaults[g][k]);
    };
    const onInput = el => {
      const v = t === 'bool' ? el.checked : t === 'num' ? +el.value : el.value;
      if (t === 'num' && (el.value === '' || !Number.isFinite(v))) return;
      C[g][k] = v; save();
      if (num) (el === num ? inp : num).value = v;
      r.classList.toggle('ch', v !== defaults[g][k]);
    };
    for (const el of [inp, num]) if (el) {
      el.addEventListener('input', () => onInput(el));
      el.addEventListener('change', () => { onInput(el); if (d.restart) restart?.(); });
    }
    name.ondblclick = () => { C[g][k] = defaults[g][k]; save(); sync(); if (d.restart) restart?.(); };
    r.append(name, inp); if (num) r.append(num);
    sync(); rows.push(sync); return r;
  }

  function addButton(label, fn) {
    const b = document.createElement('button'); b.textContent = label; b.onclick = fn; bar.append(b);
  }
  function emit(text) {
    out.value = text; out.focus(); out.select();
    try { navigator.clipboard?.writeText(text).catch(() => {}); } catch (e) {}
  }

  function mount() {
    const host = document.createElement('div'), root = host.attachShadow({ mode: 'open' });
    document.body.appendChild(host);
    for (const ev of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'mousedown', 'touchstart', 'wheel', 'click'])
      host.addEventListener(ev, e => e.stopPropagation()); // keep panel input away from the game
    root.innerHTML = `<style>
      *{box-sizing:border-box;font:12px/1.4 system-ui,sans-serif}
      .fab{position:fixed;right:10px;bottom:10px;z-index:2147483647;width:40px;height:40px;border-radius:50%;border:0;background:#000a;color:#fff;font-size:20px;cursor:pointer}
      .p{position:fixed;top:0;right:0;bottom:0;z-index:2147483646;width:min(360px,100vw);overflow:auto;background:#111e;color:#eee;padding:10px 10px 60px;transform:translateX(105%);transition:transform .15s}
      .p.o{transform:none}
      .bar{display:flex;flex-wrap:wrap;gap:4px}
      .h{color:#999;margin:6px 0}
      details{border-top:1px solid #333;padding:4px 0}
      summary{cursor:pointer;font-weight:600;color:#bbb;text-transform:uppercase}
      .r{display:grid;grid-template-columns:1fr 1.3fr 70px;gap:6px;align-items:center;min-height:28px}
      .r span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .r.ch span{color:#ffd166}
      input,select,textarea,button{background:#222;color:#eee;border:1px solid #444;border-radius:4px;padding:3px 5px;min-width:0}
      input[type=checkbox]{justify-self:start;width:18px;height:18px}
      textarea{width:100%;height:110px;margin-top:6px;font-family:ui-monospace,monospace}
    </style>
    <button class='fab' title='Admin panel (backtick key)'>⚙</button>
    <div class='p'><div class='bar'></div>
      <div class='h'>Yellow = changed · double-click a name to reset · ↻ restarts the game</div>
      <div class='g'></div>
      <textarea placeholder='Copied JSON shows here. Paste a diff or report, then Apply.'></textarea></div>`;
    const panel = root.querySelector('.p'), toggle = () => panel.classList.toggle('o');
    bar = root.querySelector('.bar'); out = root.querySelector('textarea');
    root.querySelector('.fab').onclick = toggle;
    addEventListener('keydown', e => { if (e.key === '`') { e.preventDefault(); toggle(); } });
    const groups = root.querySelector('.g');
    for (const g in S) {
      const det = document.createElement('details'), sum = document.createElement('summary');
      det.open = true; sum.textContent = g;
      det.append(sum, ...Object.keys(S[g]).map(k => row(g, k)));
      groups.append(det);
    }
    addButton('Copy diff', () => emit(JSON.stringify(diff(), null, 2)));
    addButton('Copy report', () => emit(report()));
    addButton('Apply', () => {
      try { const j = JSON.parse(out.value); load(j.configDiff || j); save(); refresh(); restart?.(); }
      catch (e) { out.value = 'Invalid JSON: ' + e.message; }
    });
    addButton('Reset all', () => { load(defaults); save(); refresh(); restart?.(); });
    addButton('Restart', () => restart?.());
    actions.forEach(([l, f]) => addButton(l, f));
  }
  if (ADMIN_ENABLED) document.body ? mount() : addEventListener('DOMContentLoaded', mount);

  return {
    get CONFIG() { return C; }, defaults, diff, report, track,
    bind: proxy => { C = proxy; },
    load: d => { load(d); save(); refresh(); },
    onRestart: fn => { restart = fn; },
    action: (label, fn) => { actions.push([label, fn]); if (bar) addButton(label, fn); },
  };
})();
const CONFIG = reactive(ISF.CONFIG); ISF.bind(CONFIG);

export { CONFIG, ISF, ADMIN_ENABLED, CONFIG_SCHEMA };
