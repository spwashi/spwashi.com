import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldUseLensViewTransition } from '../../public/js/runtime/lens-modes.js';

test('lens transitions stay off the initial and query hydration paths', () => {
  const supported = { supportsTransition: true, reduceMotion: false };

  assert.equal(shouldUseLensViewTransition({ ...supported, source: 'initial' }), false);
  assert.equal(shouldUseLensViewTransition({ ...supported, source: 'query' }), false);
  assert.equal(shouldUseLensViewTransition({ ...supported, source: 'mode-switch' }), true);
});

test('lens transitions respect capability and reduced motion', () => {
  assert.equal(shouldUseLensViewTransition({
    source: 'mode-switch',
    supportsTransition: false,
    reduceMotion: false,
  }), false);
  assert.equal(shouldUseLensViewTransition({
    source: 'mode-switch',
    supportsTransition: true,
    reduceMotion: true,
  }), false);
});
