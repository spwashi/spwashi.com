import assert from 'node:assert/strict';
import test from 'node:test';

import {
  diffSelfReferences,
  findPeriodicRootWrites,
  findSelfReferences,
  selectorSubject,
} from '../css-custom-property-audit.mjs';

test('self-referencing custom properties are found; second names and comments are not', () => {
  const findings = findSelfReferences(`
    :root {
      --spw-a: 1;
      /* --spw-b: max(var(--spw-b), 1); stays a comment */
      --spw-b: max(var(--spw-b, 0), 0.4);
      --spw-c: calc(var(--spw-c-base) * 2);
      --blog-mix: calc(var(--blog-mix) + 3%);
    }
  `);

  assert.deepEqual(findings.map((finding) => [finding.property, finding.line]), [
    ['--spw-b', 5],
    ['--blog-mix', 7],
  ]);
});

test('selector subject unwraps :where and ignores functional pseudo-classes', () => {
  assert.equal(selectorSubject(':where(html[data-spw-beat="1"]) :where(.spw-chip)'), '.spw-chip');
  assert.equal(selectorSubject(':where(html[data-spw-beat="1"] body[data-spw-surface="blog"])'), 'body[data-spw-surface="blog"]');
  assert.equal(selectorSubject('html:not([data-spw-reduce-motion="on"])[data-spw-playing="on"]'), 'html[data-spw-playing="on"]');
  assert.equal(selectorSubject(':root[data-spw-palette-treat-active="on"]'), ':root[data-spw-palette-treat-active="on"]');
});

test('periodic root writes are flagged; scoped consumers, plain rules, and allowed windows are not', () => {
  const source = `
    :where(html[data-spw-playing="on"][data-spw-beat="5"]) { --spw-ecology-twinkle: 0.2; }
    :root[data-spw-palette-treat-probe="1"] { --spw-palette-treat-accent: red; }
    :where(html[data-spw-playing="on"]) :where(.spw-chip) { --spw-ecology-beat-align: 0.3; }
    :where(html[data-spw-beat="1"]) .spw-site-rhythm__node { background: red; }
    :where(html[data-spw-color-mode="dark"]) { --spw-ink: white; }
    :where(html[data-spw-loading-ecology-phase="settling"][data-spw-playing="on"]) { --spw-ecology-beat-align: 0.2; }
    @media (prefers-reduced-motion: reduce) {
      html[data-spw-freshness-pulse] { --spw-pulse: 0; }
    }
  `;

  const findings = findPeriodicRootWrites(source, {
    allow: { 'data-spw-loading-ecology-phase="settling"': 'bounded settle window' },
  });

  assert.deepEqual(findings.map((finding) => finding.line), [2, 3, 9]);
});

test('self-reference baseline diff reports growth and resolution per file and property', () => {
  const { grown, shrunk } = diffSelfReferences(
    { 'a.css': { '--x': 2 }, 'b.css': { '--y': 1 } },
    { 'a.css': { '--x': 1 }, 'c.css': { '--z': 3 } },
  );
  assert.deepEqual(grown, ['a.css --x 1 → 2', 'b.css --y 0 → 1']);
  assert.deepEqual(shrunk, ['c.css --z 3 → 0']);
});
