// The set's text size (workers/lib/text-scale.js): spwashi.com's pinch and ladder, carried to each page in the set.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { TEXT_KEY, TEXT_STEPS } from '../../lib/text-scale.js';
import { peerScriptPath } from '../../lib/peer-kit.js';

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const UNITS = ['attention-productions', 'mutex-buzz', 'tealstripesvibes'];

test('the ladder is spwashi.com\'s, and the head and the styles name every step of it', () => {
  const site = /FONT_SCALE_STEPS = Object\.freeze\((\[[^\]]+\])\)/.exec(read('../../../public/js/runtime/attention/shared.js'));
  assert.deepEqual(TEXT_STEPS, JSON.parse(site[1].replace(/'/g, '"')));
  const head = read('../../lib/text-scale-head.js');
  const css = read('../../lib/text-scale.css');
  for (const step of TEXT_STEPS.filter((s) => s !== '100')) {
    assert.ok(head.includes(`"${step}"`), `the head keeps ${step}`);
    assert.ok(css.includes(`html[data-text-scale="${step}"] { font-size: ${step}%; --text-scale: ${Number(step) / 100}; }`), `the styles size ${step}`);
  }
  assert.ok(head.includes(JSON.stringify(TEXT_KEY)), 'the head reads where the step is kept');
});

test('each page in the set carries the text size and names the carried gesture it binds', () => {
  const pinch = peerScriptPath('pinch-text-scale');
  assert.match(pinch, /^\/peer\/pinch-text-scale\.[0-9a-f]{10}\.js$/);
  for (const unit of UNITS) {
    for (const file of ['text-scale.js', 'text-scale.css', 'text-scale-head.js']) assert.equal(read(`../../${unit}/assets/${file}`), read(`../../lib/${file}`), `${unit}/assets/${file}`);
    assert.ok(existsSync(new URL(`../../${unit}/assets${pinch}`, import.meta.url)), `${unit} carries ${pinch}`);
    const page = read(`../../${unit}/assets/index.html`);
    assert.ok(page.includes(`<link rel="modulepreload" id="text-pinch" href="${pinch}">`), `${unit} names it`);
    assert.ok(page.indexOf('/text-scale-head.js') < page.indexOf('<body'), `${unit} sets the kept size before the body paints`);
  }
});
