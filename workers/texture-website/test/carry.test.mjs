// texture.website as files: a vocabulary for material prompts, its readings, and the page every path falls back to.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carried } from '../carry.mjs';
import { CLASSES, FORMATS, LADDERS, MATERIALS, PHRASES, RELATIONS, slug } from '../src/vocabulary.js';

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

test('every material has a class, a unique slug and its readings; every ladder word has its phrase', () => {
  assert.equal(new Set(MATERIALS.map((m) => m.slug)).size, MATERIALS.length, 'no two materials share a path word');
  for (const m of MATERIALS) {
    assert.ok(CLASSES[m.cls].qualities.length >= 2, m.slug);
    for (const ext of ['txt', 'spw']) assert.ok(existsSync(path.join(assets, `${m.slug}.${ext}`)), `${m.slug}.${ext}`);
  }
  for (const key of ['scale', 'light', 'wear', 'process', 'scene']) for (const word of LADDERS[key]) assert.ok(word in PHRASES[key], `${key} ${word}`);
  for (const word of LADDERS.format) assert.ok(FORMATS[word]?.params, word);
  for (const words of Object.values(LADDERS)) assert.equal(new Set(words.map(slug)).size, words.length, 'ladder words read apart in the address');
  assert.equal(Object.keys(RELATIONS).filter(Boolean).join(''), '.^*~=@?!%');
});
