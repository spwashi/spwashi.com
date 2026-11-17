import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LENS_MODE_REQUEST_EVENT,
  buildLensModeLocation,
  isReaderLensSource,
  requestLensMode,
  resolveLensRovingIndex,
  resolveLensSeatSubject,
  lensFilterToggleCopy,
  resolveSustainedLensChoice,
  shouldUseLensViewTransition,
} from '../../public/js/runtime/page/lens-modes.js';
import {
  applyProfileLensField,
  classifyLensReach,
  describeLensReachSummary,
  readActiveProfile,
  syncProfileCopySelections,
} from '../../public/js/runtime/page/lens-reach.js';
import {
  readSustainedLens,
  writeSustainedLens,
} from '../../public/js/kernel/visit-intent.js';

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

function makeFakeStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
  };
}

function makeFakeEl(tagName = 'div', attrs = {}) {
  const map = new Map(Object.entries(attrs));
  const children = [];
  const dataset = {};
  for (const [key, val] of map.entries()) {
    if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      dataset[camel] = val;
    }
  }
  const el = {
    tagName: tagName.toUpperCase(),
    parentElement: null,
    children,
    dataset,
    attrs: map,
    getAttribute: (name) => (map.has(name) ? map.get(name) : null),
    setAttribute(name, value) {
      const next = String(value);
      map.set(name, next);
      if (name.startsWith('data-')) {
        const camel = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        dataset[camel] = next;
      }
    },
    removeAttribute(name) {
      map.delete(name);
      if (name.startsWith('data-')) {
        const camel = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        delete dataset[camel];
      }
    },
    hasAttribute: (name) => map.has(name),
    append(child) {
      child.parentElement = el;
      children.push(child);
      return child;
    },
    matches(selector) {
      const s = String(selector);
      if (s.includes('.spw-card') && (map.get('class') || '').includes('spw-card')) return true;
      if (s.includes('.frame-card') && (map.get('class') || '').includes('frame-card')) return true;
      if (s.includes('section.spw-frame[id]') && el.tagName === 'SECTION' && map.has('id')) return true;
      return false;
    },
    contains(other) {
      if (other === el) return true;
      return children.some((child) => child.contains(other));
    },
    closest: (selector) => (String(selector).includes('data-spw-lens-mode') && map.has('data-spw-lens-mode') ? el : el.parentElement?.closest?.(selector) || null),
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  return el;
}

test('the lens filter button says whether cards are hidden', () => {
  const open = lensFilterToggleCopy(false);
  const hidden = lensFilterToggleCopy(true);
  assert.equal(open.state, 'all');
  assert.equal(open.label, 'Hide other cards');
  assert.equal(hidden.state, 'matched');
  assert.equal(hidden.label, 'Show every card');
  assert.ok(open.title.includes(open.label));
  assert.ok(hidden.title.includes(hidden.label));
});

test('sustained lens round-trips via sessionStorage and drives resolveSustainedLensChoice', () => {
  const storage = makeFakeStorage();
  writeSustainedLens({ mode: 'systems', group: 'home-lens', operator: '^', filterMode: 'matched' }, storage);
  const restored = readSustainedLens(storage);
  assert.equal(restored.mode, 'systems');
  assert.equal(restored.group, 'home-lens');
  assert.equal(restored.operator, '^');
  assert.equal(restored.filterMode, 'matched');

  const prevSession = globalThis.sessionStorage;
  globalThis.sessionStorage = storage;
  try {
    const grouped = new Map([
      ['about-lens', [
        makeFakeEl('button', { 'data-set-mode': 'reading' }),
        makeFakeEl('button', { 'data-set-mode': 'systems' }),
      ]],
    ]);
    assert.deepEqual(resolveSustainedLensChoice(grouped, { documentElement: { dataset: {} } }), {
      group: 'about-lens',
      mode: 'systems',
      source: 'sustained',
    });
  } finally {
    globalThis.sessionStorage = prevSession;
  }
});

test('syncProfileCopySelections preserves sole default copy and switches theme-responsive copy', () => {
  const servicesGroup = makeFakeEl('div');
  const servicesOnly = servicesGroup.append(makeFakeEl('p', { 'data-spw-copy-lens': 'default' }));

  const themedGroup = makeFakeEl('div');
  const defCopy = themedGroup.append(makeFakeEl('p', { 'data-spw-copy-lens': 'default' }));
  const emberCopy = themedGroup.append(makeFakeEl('p', {
    'data-spw-copy-lens': 'banked-ember dark',
    'data-spw-semantic-expression': 'composition[ember]{contrast}<night>',
  }));
  const consoleCopy = themedGroup.append(makeFakeEl('p', {
    'data-spw-copy-lens': 'glass-console workbench',
    'data-spw-semantic-expression': 'workbench[console]{inspect}<seed>',
  }));

  const copyNodes = [servicesOnly, defCopy, emberCopy, consoleCopy];
  const fakeDoc = {
    documentElement: {
      dataset: {
        spwThemePack: 'banked-ember',
        spwColorMode: 'dark',
        spwActiveLensMode: 'systems',
        spwActiveLensSource: 'sustained',
      },
    },
    querySelectorAll: (sel) => (String(sel).includes('[data-spw-copy-lens]') ? copyNodes : []),
  };

  const profile = readActiveProfile(fakeDoc, { sustained: null, carried: null });
  syncProfileCopySelections(fakeDoc, profile);
  assert.equal(servicesOnly.dataset.spwVariantSelected, 'true', 'sole default stays visible under active lens');
  assert.equal(emberCopy.dataset.spwVariantSelected, 'true', 'theme-responsive copy matches banked-ember dark');
  assert.equal('spwVariantSelected' in defCopy.dataset, false);
  assert.equal('spwVariantSelected' in consoleCopy.dataset, false);
});

test('applyProfileLensField weights matching cards as profile and keeps parent sections visible', () => {
  const section = makeFakeEl('section', { id: 'cards', class: 'spw-frame' });
  const matchCard = section.append(makeFakeEl('article', {
    class: 'spw-card',
    'data-spw-semantic-expression': 'workbench[systems]{seed.parser}<inspect>',
  }));
  const otherCard = section.append(makeFakeEl('article', {
    class: 'spw-card',
    'data-spw-semantic-expression': 'play[table]{dice.lore}<story>',
  }));
  const targets = [section, matchCard, otherCard];

  const fakeDoc = {
    documentElement: {
      dataset: {
        spwActiveLensMode: 'systems',
        spwActiveLensSource: 'sustained',
      },
    },
    querySelectorAll(sel) {
      if (String(sel).includes('[data-spw-lens-pass]')) return [];
      if (String(sel).includes('.spw-card')) return targets;
      return [];
    },
  };

  const res = applyProfileLensField(fakeDoc, { source: 'sustained', profile: readActiveProfile(fakeDoc, { sustained: { mode: 'systems' }, carried: null }) });
  assert.equal(res.profileMatched, 1);
  assert.equal(matchCard.getAttribute('data-spw-lens-reach'), 'profile');
  assert.equal(otherCard.getAttribute('data-spw-lens-reach'), 'recede');
  assert.equal(section.getAttribute('data-spw-lens-reach'), null, 'parent section holding a matched card does not recede');
});
