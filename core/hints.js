// Progressive hints for the current biggest mismatch:
// 1 vague → 2 names the parameter → 3 gives direction → 4 gives direction + magnitude.

function magnitude(norm) {
  const a = Math.abs(norm);
  if (a > 0.25) return 'a lot';
  if (a > 0.1) return 'a fair bit';
  return 'just a touch';
}

export function hintText(entry, mismatch, level) {
  switch (level) {
    case 1: return `${entry.hint.vague}.`;
    case 2: return `Look closely at ${entry.label.toLowerCase()}.`;
    case 3: return `${entry.hint[mismatch.direction]}.`;
    default: return `${entry.hint[mismatch.direction]} — ${magnitude(mismatch.norm)}.`;
  }
}

// Escalates while the same parameter stays on top; restarts at level 1 when it changes.
export function nextHint(prev, breakdown, registry) {
  if (!breakdown.length) return { paramId: null, level: 0, text: "Nothing left to fix — that's a match!" };
  const top = breakdown[0];
  const entry = registry.find((p) => p.id === top.id);
  const level = prev && prev.paramId === top.id ? Math.min(prev.level + 1, 4) : 1;
  return { paramId: top.id, level, text: hintText(entry, top, level) };
}
