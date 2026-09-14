import assert from 'node:assert/strict';
import test from 'node:test';

import { writeStyleProperty } from '/public/js/kernel/dom-contracts.js';
import { diffAgainstBaseline, scanRootWrites } from '../module-writer-audit.mjs';

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
