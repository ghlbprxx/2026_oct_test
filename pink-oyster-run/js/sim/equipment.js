// Pressure cooker: batches of queued vessels, fixed capacity, one cycle at a time.
import { C } from './cfg.js';
import { emit } from './events.js';

export const findV = (g, id) => g.slots.find(v => v && v.id === id);
export function stepCooker(g, dd) {
  const ck = g.cooker, E = C.equipment;
  if (!ck.batch.length && g.queue.length) {
    ck.batch = g.queue.splice(0, E.cookerCapacity); ck.t = 0;
    ck.batch.forEach(id => { const v = findV(g, id); if (v) v.state = 'cooking'; });
    emit('sfx', { name: 'hiss' });
  }
  if (ck.batch.length) {
    ck.t += dd;
    if (ck.t >= E.cookerDays) {
      let n = 0; ck.batch.forEach(id => { const v = findV(g, id); if (v && v.state === 'cooking') { v.state = 'ready'; n++; } });
      ck.batch = []; ck.t = 0;
      if (n) { emit('toast', { text: `Pressure cooker done: ${n} sterile vessel${n > 1 ? 's' : ''} ready for spawn.`, c: 'good' }); emit('sfx', { name: 'good' }); }
    }
  }
}
