import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG_SCHEMA } from '../js/config-schema.js';
import { CONFIG_HELP } from '../js/config-help.js';

test('every admin knob has a description and min / default / max effects', () => {
  for (const [g, f] of Object.entries(CONFIG_SCHEMA)) for (const k of Object.keys(f)) {
    const h = (CONFIG_HELP[g] || {})[k];
    assert.ok(h, `missing help for ${g}.${k}`);
    for (const f2 of ['what', 'min', 'def', 'max']) assert.ok(typeof h[f2] === 'string' && h[f2].length, `${g}.${k}.${f2}`);
    assert.ok(h.what.length <= 120, `${g}.${k}: keep "what" concise`);
  }
  for (const [g, f] of Object.entries(CONFIG_HELP)) for (const k of Object.keys(f)) assert.ok(CONFIG_SCHEMA[g] && CONFIG_SCHEMA[g][k], `help for unknown knob ${g}.${k}`);
});

import { ESSENTIALS } from '../js/admin-help.js';
test('the Advanced admin panel opens on a short essentials list of real knobs', () => {
  assert.ok(ESSENTIALS.length >= 8 && ESSENTIALS.length <= 16);
  for (const id of ESSENTIALS) { const [g, k] = id.split('.'); assert.ok(CONFIG_SCHEMA[g] && CONFIG_SCHEMA[g][k], id); }
});
