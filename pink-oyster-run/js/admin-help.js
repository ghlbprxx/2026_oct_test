// Adds a collapsible help block under every admin-panel row. The ISF panel template stays verbatim (brief);
// its shadow root is open, so this decorates it from the outside after it mounts. Rows are matched in schema order.
import { CONFIG_SCHEMA } from './config-schema.js';
import { CONFIG_HELP } from './config-help.js';

/** Knobs shown by default in Advanced mode; the rest are one click away. */
export const ESSENTIALS = ['time.secondsPerDay', 'time.bioDaysPerGameDay', 'growth.growthScale', 'growth.yieldScale', 'contam.hazardScale', 'contam.sabFactor',
  'economy.priceFresh', 'economy.boothFee', 'shop.demand', 'shop.priceScale', 'progression.unitsScale', 'look.tips', 'look.sfxVolume', 'dev.god', 'dev.juice'];

const STYLE = `
  details.help{grid-column:1/-1;margin:-2px 0 4px;border:none;padding:0}
  details.help>summary{list-style:none;cursor:pointer;color:#9aa;font-weight:400;text-transform:none;font-size:11px;padding:1px 0}
  details.help>summary::-webkit-details-marker{display:none}
  details.help>summary::before{content:'ⓘ ';color:#ffd166}
  details.help[open]>summary{color:#ddd}
  details.help dl{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;margin:4px 0 6px 12px;font-size:11px;color:#ccc}
  details.help dt{color:#999} details.help dd{margin:0}
  .helpall{margin:4px 0}`;

function fmt(d, which) {
  if (typeof d.value === 'boolean') return '';
  return which === 'min' ? ` (${d.min ?? '—'})` : which === 'max' ? ` (${d.max ?? '—'})` : ` (${d.value})`;
}
export function decoratePanel(root) {
  if (!root || root.querySelector('style[data-help]')) return false;
  const st = document.createElement('style'); st.dataset.help = '1'; st.textContent = STYLE; root.appendChild(st);
  const groups = root.querySelectorAll('.g > details');
  let added = 0;
  groups.forEach(det => {
    const g = det.querySelector('summary').textContent.trim(), keys = Object.keys(CONFIG_SCHEMA[g] || {}), rows = det.querySelectorAll(':scope > .r');
    rows.forEach((row, n) => {
      const k = keys[n], d = CONFIG_SCHEMA[g][k], h = (CONFIG_HELP[g] || {})[k];
      if (!k || !h) return;
      const box = document.createElement('details'); box.className = 'help';
      const sum = document.createElement('summary'); sum.textContent = h.what; box.appendChild(sum);
      const dl = document.createElement('dl');
      for (const [label, which] of [['Min', 'min'], ['Default', 'def'], ['Max', 'max']]) {
        if (!h[which] || h[which] === '—') continue;
        const dt = document.createElement('dt'); dt.textContent = label + fmt(d, which === 'def' ? 'def' : which);
        const dd = document.createElement('dd'); dd.textContent = h[which];
        dl.append(dt, dd);
      }
      if (d.restart) { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = '↻'; dd.textContent = 'Changing it restarts the game.'; dl.append(dt, dd); }
      box.appendChild(dl); row.after(box); added++;
    });
  });
  // essentials-first view: the knobs most worth touching; everything else behind "Show all knobs"
  const rowsByKey = [];
  root.querySelectorAll('.g > details').forEach(det => {
    const g = det.querySelector('summary').textContent.trim(), keys = Object.keys(CONFIG_SCHEMA[g] || {});
    det.querySelectorAll(':scope > .r').forEach((row, n) => rowsByKey.push({ det, row, help: row.nextElementSibling && row.nextElementSibling.classList.contains('help') ? row.nextElementSibling : null, id: g + '.' + keys[n] }));
  });
  const applyFilter = all => {
    rowsByKey.forEach(x => { const show = all || ESSENTIALS.includes(x.id); x.row.style.display = show ? '' : 'none'; if (x.help) x.help.style.display = show ? '' : 'none'; });
    root.querySelectorAll('.g > details').forEach(det => { det.style.display = [...det.querySelectorAll(':scope > .r')].some(r => r.style.display !== 'none') ? '' : 'none'; });
  };
  applyFilter(false);
  // one switch to open/close every help block
  const bar = root.querySelector('.bar');
  if (bar) { const b = document.createElement('button'); b.textContent = 'Help: open all'; b.className = 'helpall';
    b.onclick = () => { const all = root.querySelectorAll('details.help'), open = ![...all].every(x => x.open); all.forEach(x => { x.open = open; }); b.textContent = open ? 'Help: close all' : 'Help: open all'; };
    bar.append(b);
    const f = document.createElement('button'); let all = false; f.textContent = `Show all ${rowsByKey.length} knobs`; f.className = 'helpall';
    f.onclick = () => { all = !all; applyFilter(all); f.textContent = all ? `Essentials only (${ESSENTIALS.length})` : `Show all ${rowsByKey.length} knobs`; };
    bar.append(f); }
  return added;
}
/** Find the ISF panel's shadow root (an open shadow root containing the .p panel) and decorate it. */
export function attachAdminHelp() {
  const host = [...document.body.children].find(el => el.shadowRoot && el.shadowRoot.querySelector('.p'));
  return host ? decoratePanel(host.shadowRoot) : false;
}

/** Basic play hides the admin panel (and its ⚙ button) entirely; Advanced shows it. */
export function setAdminVisible(on) {
  const host = [...document.body.children].find(el => el.shadowRoot && el.shadowRoot.querySelector('.p'));
  if (host) host.style.display = on ? '' : 'none';
}
