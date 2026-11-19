import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeCssSource,
  collectPassiveRuntimeAttrs,
  collectPrepaintSettledRootAttrs,
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

test('matches exact attribute boundaries and ignores inspect/capture/editor gates', () => {
  const owners = collectPassiveRuntimeAttrs([
    { id: 'short-prefix', when: 'immediate', updates: ['structural:data-spw-op', 'structural:data-spw-module'] },
  ]);
  const css = `
    [data-spw-operator="frame"] { padding: 0.5rem; }
    [data-spw-module-visuals="on"] .panel { display: grid; }
    body[data-spw-display-layer="inspect"] [data-spw-op]::before { content: "#"; display: inline-flex; }
    html[data-spw-capture-mode="study"] [data-spw-module] { padding: 1rem; }
    [data-spw-op="probe"] { gap: 0.4rem; }
  `;
  const findings = analyzeCssSource(css, owners, 'public/css/test.css');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].attr, 'data-spw-op');
  assert.equal(findings[0].count, 1);
  assert.deepEqual(findings[0].props, ['gap']);
});

test('ignores out-of-flow absolute/fixed pseudo-elements while catching in-flow pseudo-elements', () => {
  const owners = collectPassiveRuntimeAttrs([
    { id: 'late-ornament', when: 'idle', updates: ['flourish:data-spw-late-dot'] },
  ]);
  const css = `
    [data-spw-late-dot="true"]::before { content: ""; position: absolute; width: 0.36rem; height: 0.36rem; }
    [data-spw-late-dot="true"]::after { content: "→"; display: inline-flex; width: 1rem; }
  `;
  const findings = analyzeCssSource(css, owners, 'public/css/test.css');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].count, 1);
  assert.deepEqual(findings[0].props, ['content', 'display', 'width']);
});

test('excludes site-settings root attributes that prepaint-state.js seeds synchronously before first paint', () => {
  const prepaintSettled = collectPrepaintSettledRootAttrs();
  assert.ok(prepaintSettled.has('data-spw-color-mode'), 'prepaint-state seeds data-spw-color-mode');
  assert.ok(prepaintSettled.has('data-spw-semantic-density'), 'prepaint-state seeds data-spw-semantic-density');

  const owners = collectPassiveRuntimeAttrs(
    [
      {
        id: 'site-settings',
        when: 'immediate',
        updates: ['html:structural:data-spw-color-mode', 'html:structural:data-spw-unprepainted'],
      },
    ],
    { prepaintSettled },
  );
  assert.equal(owners.has('data-spw-color-mode'), false);
  assert.equal(owners.has('data-spw-unprepainted'), true);
});

test('no authored CSS file has passive layout rules on [data-spw-component-kind]', () => {
  const scan = scanArrivalGeometry();
  const forbidden = scan.findings.filter(
    (row) => row.attr === 'data-spw-component-kind',
  );
  assert.deepEqual(forbidden, []);
});
