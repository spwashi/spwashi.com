// texture.website as files: materials, readings and the page every path falls back to.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carried } from '../carry.mjs';
import { ALL, CATEGORIES, LAWS } from '../src/materials.js';

const root = path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
const assets = path.join(root, 'assets');

test('the unit is files only: no script, and every unknown path falls back to the page', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.main, undefined);
  assert.equal(config.assets.not_found_handling, 'single-page-application');
});

test('each carried file is what carry.mjs writes', async () => {
  for (const [file, body] of await carried()) assert.equal(readFileSync(path.join(assets, file), 'utf8'), body, `assets/${file}: run node workers/texture-website/carry.mjs`);
});

test('every material answers in each reading, sits in a known category, and has a history', () => {
  const catalog = JSON.parse(readFileSync(path.join(assets, 'catalog.json'), 'utf8'));
  assert.equal(catalog.materials.length, ALL.length);
  for (const m of catalog.materials) {
    assert.ok(CATEGORIES[m.category], m.id);
    for (const reading of Object.values(m.readings)) assert.ok(existsSync(path.join(assets, reading)), `${m.id} ${reading}`);
    // A photographed material has a commit a student can open; a drawn one is born in src/materials.js.
    if (!m.procedural) assert.ok(m.history.length > 0, `${m.id} has a commit a student can open`);
    assert.ok(m.provenance.generator, m.id);
  }
  for (const role of ['ground', 'figure']) assert.ok(ALL.some((m) => CATEGORIES[m.category].role === role), `a day has a ${role}`);
  assert.deepEqual(Object.keys(LAWS).filter(Boolean).join(''), '.^*~=@?!%');
});
