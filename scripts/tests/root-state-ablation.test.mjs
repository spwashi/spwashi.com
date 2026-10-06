import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ABLATION_PAGE_SOURCE,
  AUTHORED_ROOTS_SOURCE,
  formatAblation,
  resolveAblationSet,
  summarizeAblation,
} from '../root-state-ablation.mjs';

const ROOTS = {
  html: {
    attrs: { lang: 'en', 'data-spw-color-mode': 'auto', 'data-spw-debug-mode': 'off', 'data-spw-module': 'pulse-beat-tuner' },
    props: { '--spw-section-step': '0.5', '--spw-only-html': '1' },
  },
  body: {
    attrs: {
      'data-spw-surface': 'home',
      'data-spw-color-mode': 'auto',
      'data-spw-debug-mode': 'on',
      'data-spw-module-trigger-status': 'queued',
      'data-spw-region-state': 'enhanced',
      class: 'x',
    },
    props: { '--spw-section-step': '0.5' },
  },
};

test('body-mirror takes the body copies html holds with the same value, and leaves authored markup', () => {
  const tokens = resolveAblationSet('body-mirror', ROOTS, { html: ['lang'], body: ['data-spw-surface', 'class'] });
  assert.deepEqual(tokens, [
    { side: 'body', kind: 'attr', name: 'data-spw-color-mode' },
    { side: 'body', kind: 'prop', name: '--spw-section-step' },
  ]);
});

test('an authored body attribute is never a mirror, even when html matches', () => {
  const roots = { html: { attrs: { 'data-spw-surface': 'home' }, props: {} }, body: { attrs: { 'data-spw-surface': 'home' }, props: {} } };
  assert.deepEqual(resolveAblationSet('body-mirror', roots, { html: [], body: ['data-spw-surface'] }), []);
});

test('html-to-body copies what <body> lacks, never authored html or what body already holds', () => {
  const tokens = resolveAblationSet('html-to-body', ROOTS, { html: ['lang'], body: [] });
  assert.deepEqual(tokens, [
    { side: 'body', kind: 'attr', name: 'data-spw-module', op: 'add', value: 'pulse-beat-tuner' },
    { side: 'body', kind: 'prop', name: '--spw-only-html', op: 'add', value: '1' },
  ]);
});

test('root-modules takes the loader annotation on either root', () => {
  const tokens = resolveAblationSet('root-modules', ROOTS, { html: [], body: [] });
  assert.deepEqual(tokens.map((token) => `${token.side}:${token.name}`), [
    'html:data-spw-module',
    'body:data-spw-module-trigger-status',
    'body:data-spw-region-state',
  ]);
});

test('a named token resolves only when the root carries it', () => {
  assert.deepEqual(resolveAblationSet('html:--spw-only-html', ROOTS), [{ side: 'html', kind: 'prop', name: '--spw-only-html' }]);
  assert.deepEqual(resolveAblationSet('body:--spw-only-html', ROOTS), []);
  assert.throws(() => resolveAblationSet('nowhere:data-x', ROOTS), /unknown token set/);
});

test('summary orders tokens by elements moved and properties by reach', () => {
  const summary = summarizeAblation({
    byToken: {
      'body:data-spw-debug-mode': { elements: 2, props: { width: 2 } },
      'body:data-spw-component-lifecycle': { elements: 40, props: { 'inline-size': 30, 'border-top-width': 1 } },
    },
  });
  assert.deepEqual(summary.map((entry) => entry.token), ['body:data-spw-component-lifecycle', 'body:data-spw-debug-mode']);
  assert.deepEqual(summary[0].props, ['inline-size', 'border-top-width']);
});

test('format names an inert set in one line', () => {
  const text = formatAblation('/', 'body-mirror', { tokens: ['body:a'], elements: 10, moved: 0, totalMs: 5 });
  assert.equal(text, '/  body-mirror: 1 token(s), 10 elements, 0 moved  (5ms)');
});

test('page sources parse as functions', () => {
  assert.doesNotThrow(() => new Function(`return ${AUTHORED_ROOTS_SOURCE}`));
  assert.equal(typeof new Function(`return ${ABLATION_PAGE_SOURCE}`)(), 'function');
});
