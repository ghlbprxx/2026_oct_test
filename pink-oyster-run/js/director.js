// Story director: decides which scene (if any) a sim event triggers in story runs. Pure: no DOM, no Vue.
// Free play gets no script; the simulation is identical in every run type.
import { SCENES, GURU } from './content/story.js';
import { STAGES } from './content/stages.js';

/** Run types offered at setup. Expert unlocks after the first species win. */
export const RUN_TYPES = ['tutorial', 'story', 'free', 'expert'];
export const isStory = g => !!g && ['story', 'tutorial', 'expert'].includes(g.runType); // expert keeps the cast (and adds the LC scene)

/** The scene for `key`, marking once-only scenes as seen. Null in free play, for unknown keys, or when already seen. */
export function scene(g, key) {
  if (!isStory(g)) return null;
  const s = SCENES[key]; if (!s) return null;
  if (!g.story) g.story = { seen: [] };
  if (s.once && g.story.seen.includes(key)) return null;
  if (s.once) g.story.seen.push(key);
  return { key, lines: s.lines.slice(0, 3) };
}

/** Map a sim event to a scene key (or null). */
export function sceneKeyFor(type, d = {}) {
  if (type === 'stage') { const id = d.id || (STAGES[d.stage] && STAGES[d.stage].id); return id ? 'stage_' + id : null; }
  if (type === 'speciesStart') return 'species_' + d.species;
  if (type === 'sfx' && d.name === 'mold') return 'first_mold';
  if (type === 'forecast') return 'cold_snap';
  if (type === 'species') return !d.species || d.species === 'pink-oyster' ? 'species_done' : 'species_done_' + d.species;
  return null;
}

/** Story framing for a market quiz: the guru claims the statement is true, the mentor reacts after you answer. */
export function guruQuiz(m, rnd = Math.random) {
  const pick = list => list[Math.floor(rnd() * list.length) % list.length];
  return { open: pick(GURU.opener), claim: { id: 'guru_claim_' + m.id, who: 'guru', text: m.s }, react: pick(m.a ? GURU.guruRight : GURU.guruWrong), guruRight: !!m.a };
}
