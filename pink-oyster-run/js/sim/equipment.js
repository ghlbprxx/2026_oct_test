// Pressure cookers: each owned cooker runs its own load (jar = 1 space, bag = RULES.bagUnits; bags need the 23 qt).
// A cycle takes equipment.cookerDays real days including cooling.
import { C } from './cfg.js';
import { RULES } from './rules.js';
import { emit } from './events.js';
import { toBio } from './clock.js';
import { EQUIPMENT } from '../content/equipment.js';

export const findV = (g, id) => g.slots.find(v => v && v.id === id);
const size = v => v.kind === 'bag' ? RULES.bagUnits : 1;
/** Fill an idle cooker from the queue, in queue order, with what fits. */
function load(g, k) {
  const cap = EQUIPMENT[k.id].cooker, room = cap.jars;
  let used = 0, bags = 0; const keep = [];
  for (const id of g.queue) {
    const v = findV(g, id);
    if (!v) continue;
    const fits = v.kind === 'bag' ? bags < cap.bags && used + size(v) <= room : used + 1 <= room;
    if (fits) { k.batch.push(id); used += size(v); if (v.kind === 'bag') bags++; v.state = 'cooking'; } else keep.push(id);
  }
  g.queue = keep;
}
export function stepCooker(g, dd) {
  for (const k of g.cookers) {
    if (!k.batch.length && g.queue.length) { load(g, k); k.t = 0; if (k.batch.length) emit('sfx', { name: 'hiss' }); }
    if (!k.batch.length) continue;
    k.t += toBio(dd);
    if (k.t >= C.equipment.cookerDays) {
      let n = 0; k.batch.forEach(id => { const v = findV(g, id); if (v && v.state === 'cooking') { v.state = 'ready'; n++; } });
      k.batch = []; k.t = 0;
      if (n) { emit('toast', { text: `${EQUIPMENT[k.id].name}: ${n} sterile vessel${n > 1 ? 's' : ''} ready for spawn.`, c: 'good' }); emit('sfx', { name: 'good' }); }
    }
  }
}
