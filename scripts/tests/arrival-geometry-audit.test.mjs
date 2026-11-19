import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeCssSource,
  collectPassiveRuntimeAttrs,
  diffAgainstBaseline,
  scanArrivalGeometry,
} from '../audit-arrival-geometry.mjs';

test('catches non-gated layout CSS rules keyed on passive runtime-written attributes', () => {
  const owners = collectPassiveRuntimeAttrs([
    { id: 'late-semantics', when: 'visible', updates: ['structural:data-spw-late-kind'] },
  ]);
  const css = `
    :where([data-spw-late-kind]) { container-type: inline-size; padding: 1rem; }
    :where([data-spw-late-kind]) { color: teal; opacity: 0.9; }
    :where([data-spw-late-kind]:hover) { padding: 2rem; }
    :where([data-spw-debug-mode="on"] [data-spw-late-kind]) { display: block; }
  `;
  const findings = analyzeCssSource(css, owners, 'public/css/components/test.css');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].attr, 'data-spw-late-kind');
  assert.equal(findings[0].count, 1);
  assert.deepEqual(findings[0].props, ['container-type', 'padding']);
});

test('ignores paint-only rules and invited-only module writes', () => {
  const owners = collectPassiveRuntimeAttrs([
    { id: 'on-demand-tool', when: 'invited', updates: ['structural:data-spw-invited-mode'] },
    { id: 'paint-flourish', when: 'idle', updates: ['flourish:data-spw-glow'] },
  ]);
  const css = `
    [data-spw-invited-mode] { display: grid; gap: 1rem; }
    [data-spw-glow] { color: var(--teal); box-shadow: 0 0 8px currentColor; }
  `;
  assert.deepEqual(analyzeCssSource(css, owners, 'public/css/test.css'), []);
});

test('flags added and grown couplings against baseline while tracking resolved entries', () => {
  const diff = diffAgainstBaseline(
    [
      { key: 'data-spw-a :: a.css', count: 2 },
      { key: 'data-spw-b :: b.css', count: 4 },
      { key: 'data-spw-c :: c.css', count: 1 },
    ],
    {
      'data-spw-a :: a.css': 2,
      'data-spw-b :: b.css': 3,
      'data-spw-old :: old.css': 1,
    },
  );
  assert.equal(diff.held.length, 1);
  assert.equal(diff.grown.length, 1);
  assert.equal(diff.added.length, 1);
  assert.deepEqual(diff.resolved, ['data-spw-old :: old.css']);
});

test('foundation.css and frames.css have zero passive layout rules on [data-spw-component-kind]', () => {
  const scan = scanArrivalGeometry();
  const forbidden = scan.findings.filter(
    (row) => row.attr === 'data-spw-component-kind'
      && (row.file === 'public/css/components/foundation.css' || row.file === 'public/css/components/frames.css'),
  );
  assert.deepEqual(forbidden, []);
});
