import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { SEED_TEMPLATES, readTemplateKeys } from '../../public/js/modules/cards/seed-card.js';

const read = (route) => readFileSync(new URL(`../../${route}`, import.meta.url), 'utf8');
const sheetPage = read('holidays/costuming/index.html');

test('the costume sheet reads the same rows with or without the module', () => {
  const staticKeys = [...sheetPage.matchAll(/class="seed-field" data-field="([a-z_]+)"/g)].map((match) => match[1]);
  assert.deepEqual(staticKeys, SEED_TEMPLATES.costuming.fields.map((field) => field.key));
  for (const field of SEED_TEMPLATES.costuming.fields) {
    assert.ok(sheetPage.includes(`<span class="seed-field-label">${field.label}</span>`), field.label);
  }
});

test('a pinned template is offered only where a host names it', () => {
  const unnamed = readTemplateKeys({ dataset: {} });
  assert.ok(!unnamed.includes('costuming'));
  assert.ok(unnamed.includes('newyear') && unnamed.includes('ask'));
  assert.deepEqual(readTemplateKeys({ dataset: { templates: 'costuming' } }), ['costuming']);
  assert.match(sheetPage, /data-template="costuming"\s+data-templates="costuming"/);
});

test('the costume sheet asks what stayed, not what came back', () => {
  const labels = SEED_TEMPLATES.costuming.fields.map((field) => field.label).join(' ');
  assert.match(labels, /what stayed/);
  assert.doesNotMatch(`${labels} ${sheetPage}`, /try(ing)? on|gave back|give it back/i);
});
