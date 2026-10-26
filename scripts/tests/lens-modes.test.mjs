import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LENS_MODE_REQUEST_EVENT,
  buildLensModeLocation,
  isReaderLensSource,
  requestLensMode,
  resolveLensRovingIndex,
  resolveLensSeatSubject,
  shouldUseLensViewTransition,
} from '../../public/js/runtime/page/lens-modes.js';
import { classifyLensReach, describeLensReachSummary } from '../../public/js/runtime/page/lens-reach.js';

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

test('lens transitions stay off coarse and hoverless pointers', () => {
  const supported = { source: 'mode-switch', supportsTransition: true, reduceMotion: false };

  assert.equal(shouldUseLensViewTransition({ ...supported, coarsePointer: true }), false);
  assert.equal(shouldUseLensViewTransition({ ...supported, hoverNone: true }), false);
  assert.equal(shouldUseLensViewTransition(supported), true);
});

test('roving tabindex wraps within the group and jumps to the edges', () => {
  assert.equal(resolveLensRovingIndex(3, 0, 'ArrowRight'), 1);
  assert.equal(resolveLensRovingIndex(3, 2, 'ArrowRight'), 0);
  assert.equal(resolveLensRovingIndex(3, 0, 'ArrowLeft'), 2);
  assert.equal(resolveLensRovingIndex(3, 1, 'ArrowUp'), 0);
  assert.equal(resolveLensRovingIndex(3, 2, 'Home'), 0);
  assert.equal(resolveLensRovingIndex(3, 0, 'End'), 2);
  assert.equal(resolveLensRovingIndex(3, 1, 'Enter'), -1);
  assert.equal(resolveLensRovingIndex(1, 0, 'ArrowRight'), -1);
  assert.equal(resolveLensRovingIndex(3, -1, 'ArrowRight'), -1);
});

test('the live seat expression keeps the authored subject and falls back to the frame', () => {
  assert.equal(resolveLensSeatSubject('about[reading]{open.sit}', 'about-frame'), 'about');
  assert.equal(resolveLensSeatSubject('  home[systems]{open.sit}<display>', 'x'), 'home');
  assert.equal(resolveLensSeatSubject('', 'about-frame'), 'about-frame');
  assert.equal(resolveLensSeatSubject('', ''), 'lens');
  assert.equal(resolveLensSeatSubject('[mode]{open.sit}', 'frame-id'), 'frame-id');
});

test('a lens request is one bus emit with the group, mode, and source', () => {
  const emitted = [];
  const fakeBus = { emit: (name, detail) => emitted.push({ name, detail }) };
  assert.equal(requestLensMode(fakeBus, { group: 'about-lens', mode: 'kernel', source: 'probe' }), true);
  assert.deepEqual(emitted, [{ name: LENS_MODE_REQUEST_EVENT, detail: { group: 'about-lens', mode: 'kernel', source: 'probe' } }]);
  assert.equal(requestLensMode(fakeBus, { group: '', mode: 'kernel' }), false);
  assert.equal(requestLensMode(null, { group: 'g', mode: 'm' }), false);
  assert.equal(emitted.length, 1);
});

test('only a reader’s own pick counts as a choice', () => {
  assert.equal(isReaderLensSource('mode-switch'), true);
  assert.equal(isReaderLensSource('keyboard'), true);
  for (const source of ['initial', 'query', 'request', 'probe', '', undefined]) {
    assert.equal(isReaderLensSource(source), false, String(source));
  }
});

test('the remembered address keeps the path, the reader’s hash, and other params', () => {
  assert.equal(
    buildLensModeLocation('home-lens', 'systems', { pathname: '/', search: '', hash: '' }),
    '/?spw-lens=home-lens%3Asystems',
  );
  assert.equal(
    buildLensModeLocation('home-lens', 'play', { pathname: '/', search: '?spw-lens=home-lens:systems&q=spw', hash: '#entry-loops' }),
    '/?spw-lens=home-lens%3Aplay&q=spw#entry-loops',
  );
  assert.equal(
    buildLensModeLocation('about-lens', 'kernel', { pathname: '/about/', search: '?spw-lens=about-lens:wake&lens=contrast&mode=dark', hash: '' }),
    '/about/?spw-lens=about-lens%3Akernel&lens=contrast&mode=dark',
  );
});

test('a frame leans toward a seat by lift over the page, never by one handle', () => {
  // The seat's mark is 10% of the page; a frame where it is 30% of six handles leans.
  assert.deepEqual(classifyLensReach({ count: 2, total: 6, pageCount: 10, pageTotal: 100 }).tokens, ['parsed']);
  // A single handle is a coincidence, however large its share.
  assert.deepEqual(classifyLensReach({ count: 1, total: 2, pageCount: 10, pageTotal: 100 }).tokens, []);
  // A frame that only matches the page's own share does not lean.
  assert.deepEqual(classifyLensReach({ count: 3, total: 30, pageCount: 10, pageTotal: 100 }).tokens, []);
  // Declared and parsed stay separate tokens.
  assert.deepEqual(classifyLensReach({ declared: true, count: 4, total: 8, pageCount: 10, pageTotal: 100 }).tokens, ['declared', 'parsed']);
  assert.deepEqual(classifyLensReach({ declared: true }).tokens, ['declared']);
});

test('a seat’s reach names its declared and parsed places apart', () => {
  assert.equal(describeLensReachSummary({}), '');
  assert.equal(describeLensReachSummary({ declared: 2, parsed: 4, both: 1 }), '2 declared, 4 lean its way in their Spw, 1 both');
  assert.equal(describeLensReachSummary({ parsed: 1 }), '1 leans its way in its Spw');
});
