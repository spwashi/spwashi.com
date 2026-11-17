// The set's ring (workers/lib/set-ring.js): its tables are the sites' own, and every page that mounts it carries the same file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIGHTS, SEEDS, SET, nearestLight, nearestSeed, slug } from '../../lib/set-ring.js';
import { SHAPES } from '../src/vocabulary.js';
import { SEEDS as STRIPES } from '../../tealstripes-vibes/src/vibe.js';
import { SET_HOSTS } from './set-hosts.mjs';

const lib = (file) => readFileSync(new URL(`../../lib/${file}`, import.meta.url), 'utf8');

test('the ring\'s lights are attention.productions\' and its seeds are Teal Stripes Vibes\'', () => {
  assert.deepEqual(LIGHTS, Object.fromEntries(Object.entries(SHAPES.light).map(([word, light]) => [word, light.key])));
  assert.deepEqual(SEEDS, Object.fromEntries(Object.entries(STRIPES).map(([name, seed]) => [name, { accent: seed.palette[1], mood: seed.mood }])));
  // A colour finds its nearest: each light finds itself, each seed's accent its seed.
  for (const [word, key] of Object.entries(LIGHTS)) assert.equal(nearestLight(key), word);
  for (const [name, seed] of Object.entries(SEEDS)) assert.equal(nearestSeed(seed.accent), name);
  assert.equal(slug('Teal Stripes Vibes wash'), 'teal-stripes-vibes-wash');
});

test('the ring names the set, and each page that mounts it carries the same file', () => {
  assert.deepEqual(SET.map((s) => s.host), SET_HOSTS);
  for (const unit of ['attention-productions', 'mutex-buzz', 'tealstripes-vibes']) {
    for (const file of ['set-ring.js', 'set-ring.css']) assert.equal(readFileSync(new URL(`../../${unit}/assets/${file}`, import.meta.url), 'utf8'), lib(file), `${unit}/assets/${file}`);
  }
});
