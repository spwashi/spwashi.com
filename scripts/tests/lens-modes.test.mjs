import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LENS_MODE_REQUEST_EVENT,
  buildLensModeLocation,
  describeLensReach,
  isReaderLensSource,
  requestLensMode,
  resolveLensRovingIndex,
  resolveLensSeatSubject,
  shouldUseLensViewTransition,
} from '../../public/js/runtime/page/lens-modes.js';

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

test('a seat’s reach reads as the places on the page that answer it', () => {
  assert.equal(describeLensReach(0), '');
  assert.equal(describeLensReach(undefined), '');
  assert.equal(describeLensReach(1), '1 place answers on this page');
  assert.equal(describeLensReach(8), '8 places answer on this page');
});
