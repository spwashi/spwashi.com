import assert from 'node:assert/strict';
import test from 'node:test';

import { writeStyleProperty } from '/public/js/kernel/dom-contracts.js';
import { BASELINE_BIRTH, diffAgainstBaseline, formatReceipt, locateRootWrite, scanRootWrites } from '../module-writer-audit.mjs';
import { scanChangeOnlyPaths } from '../lib/change-only-paths.mjs';

function countingStyle(initial = {}) {
  const values = new Map(Object.entries(initial));
  const calls = { set: 0, remove: 0 };
  return {
    calls,
    style: {
      getPropertyValue: (name) => values.get(name) ?? '',
      setProperty: (name, value) => { calls.set += 1; values.set(name, String(value)); },
      removeProperty: (name) => { calls.remove += 1; values.delete(name); },
    },
  };
}

test('root style writes skip unchanged values and remove empty ones', () => {
  const el = countingStyle({ '--spw-site-rhythm-tempo': '1.00' });

  assert.equal(writeStyleProperty(el, '--spw-site-rhythm-tempo', '1.00'), false);
  assert.equal(el.calls.set, 0, 'identical value never touches the root style');

  assert.equal(writeStyleProperty(el, '--spw-site-rhythm-tempo', 1.4), true);
  assert.equal(el.style.getPropertyValue('--spw-site-rhythm-tempo'), '1.4');

  assert.equal(writeStyleProperty(el, '--spw-absent', ''), false, 'removing an absent property is a no-op');
  assert.equal(writeStyleProperty(el, '--spw-site-rhythm-tempo', null), true);
  assert.equal(el.calls.remove, 1);
});

test('writer scan reads direct root writes and write-map keys, not nested options', () => {
  const found = scanRootWrites(`
    html.style.setProperty('--spw-runtime-layer-count', '3');
    writeStyleProperty(html, '--spw-site-rhythm-tempo', tempo);
    document.documentElement.dataset.spwBeat = '1';
    writeDatasetValue(html, 'spwPagePresence', presence);
    writeDatasetValues(document.documentElement, { spwTuningSurfaceCount: n, spwTuningMode: mode }, { source: 'x' });
    setStyleProperties(this.root, { '--font-size-scale': s, nested: { spwIgnored: 1 } });
    element.dataset.spwLocalOnly = 'true';
  `);

  assert.deepEqual([...found].sort(), [
    'attr:data-spw-beat',
    'attr:data-spw-page-presence',
    'attr:data-spw-tuning-mode',
    'attr:data-spw-tuning-surface-count',
    'css-var:--font-size-scale',
    'css-var:--spw-runtime-layer-count',
    'css-var:--spw-site-rhythm-tempo',
  ]);
});

test('baseline diff fails on new findings and on resolved entries left behind', () => {
  const report = {
    undeclared: { 'pulse-beat-tuner': ['attr:data-spw-beat', 'attr:data-spw-new'] },
    sharedWriters: {},
    multiWriter: { 'css-var:--spw-site-rhythm-tempo': ['(module-loader)', 'site-settings'] },
  };
  const baseline = {
    undeclared: { 'pulse-beat-tuner': ['attr:data-spw-beat'], 'loading-ecology': ['attr:data-spw-gone'] },
    multiWriter: { 'css-var:--spw-site-rhythm-tempo': ['(module-loader)', 'site-settings'] },
  };

  const { fresh, cleared } = diffAgainstBaseline(report, baseline);
  assert.deepEqual(fresh, ['undeclared pulse-beat-tuner attr:data-spw-new']);
  assert.deepEqual(cleared, ['undeclared loading-ecology attr:data-spw-gone']);
});

test('a finding can be located at its line, by the same patterns the scan uses', () => {
  const source = [
    'const html = document.documentElement;',
    'writeDatasetValue(html, \'spwPagePresence\', presence);',
    'html.dataset.spwBeat = \'1\';',
    'writeDatasetValues(html, {',
    '  spwTuningMode: mode,',
    '});',
    'html.style.setProperty(\'--spw-runtime-layer-count\', \'3\');',
  ].join('\n');

  assert.equal(locateRootWrite(source, 'attr:data-spw-page-presence'), 2);
  assert.equal(locateRootWrite(source, 'attr:data-spw-beat'), 3);
  assert.equal(locateRootWrite(source, 'attr:data-spw-tuning-mode'), 4, 'a write-map key is located at its call');
  assert.equal(locateRootWrite(source, 'css-var:--spw-runtime-layer-count'), 7);
  assert.equal(locateRootWrite(source, 'attr:data-spw-absent'), 0);
  for (const token of scanRootWrites(source)) assert.ok(locateRootWrite(source, token) > 0, `${token} is locatable`);
});

test('a pass says how far the baseline is from empty', () => {
  const line = formatReceipt({ undeclared: 276, shared: 42, multi: 11, changeOnly: 2 }, 148);
  assert.equal(line, `[audit:module-writers] ok — 276 held · ${BASELINE_BIRTH.undeclared} at birth · 42 in shared files · 11 shared tokens · 2 change-only held · 148 modules`);
});

/* The shell's own shape on 2026-11-12: a measured lane calls a sync function,
   which calls a helper in a second file, which writes. */
const lane = (write) => new Map([
  ['/m/entry.js', `
    import { createMeasuredLane } from '/public/js/kernel/measured-frame.js';
    import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
    import { syncChrome } from './chrome.js';
    export function init(header) {
      const lane = createMeasuredLane(() => { syncDisclosure(header); });
      header.addEventListener('click', () => { header.dataset.spwPressed = 'true'; });
      lane.schedule();
    }
    function syncDisclosure(header) { syncChrome(header); }
  `],
  ['/m/chrome.js', `
    import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
    export function syncChrome(header) {
      const disclosure = header.querySelector('details');
      ${write}
    }
  `],
]);
const resolveFixture = (fromFile, specifier) => (specifier.startsWith('.') ? `/m/${specifier.slice(2)}` : null);

test('a raw dataset write on a measured lane is found through two calls and a second file', () => {
  const findings = scanChangeOnlyPaths(lane("disclosure.dataset.spwShellTuneSurface = 'strip';"), { resolve: resolveFixture });
  assert.equal(findings.length, 1, 'the click listener\'s raw write is a reader\'s act, not a repeat path');
  assert.deepEqual(
    { file: findings[0].file, kind: findings[0].kind, root: findings[0].root, trail: findings[0].trail },
    { file: '/m/chrome.js', kind: 'dataset', root: 'measured lane', trail: ['syncDisclosure', 'syncChrome'] },
  );
});

test('the same write through writeDatasetValue passes, and so does a write inside its own guard', () => {
  assert.deepEqual(scanChangeOnlyPaths(lane("writeDatasetValue(disclosure, 'spwShellTuneSurface', 'strip');"), { resolve: resolveFixture }), []);
  assert.deepEqual(scanChangeOnlyPaths(lane("if (disclosure.textContent !== 'open') disclosure.textContent = 'open';"), { resolve: resolveFixture }), []);
  const unguarded = scanChangeOnlyPaths(lane("if (disclosure.open) disclosure.textContent = 'open';"), { resolve: resolveFixture });
  assert.equal(unguarded.length, 1, 'a guard on something else is not a comparison of the write');
  assert.equal(unguarded[0].kind, 'textContent');
});

test('sync tasks and observers are repeat paths too, by callback or by name', () => {
  const sources = new Map([['/m/entry.js', `
    registerDomSyncTask('rail', syncRail);
    new MutationObserver((records) => { records.forEach((record) => { record.target.dataset.spwSeen = 'true'; }); });
    function syncRail() { document.body.dataset.spwRail = 'on'; }
  `]]);
  const findings = scanChangeOnlyPaths(sources);
  assert.deepEqual(findings.map((finding) => finding.root).sort(), ['observer', 'sync task']);
});
