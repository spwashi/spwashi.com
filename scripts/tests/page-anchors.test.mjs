import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { anchorsOfPage, routeOfPage } from '../lib/page-anchors.mjs';

test('a page answers to its ids, its partials, and its runtime anchors', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'page-anchors-'));
  mkdirSync(path.join(root, '_partials'));
  writeFileSync(path.join(root, '_partials', 'skip-link.html'), '<a id="skip-target" href="#main">Skip</a>');
  const html = `
    <p id="home-frame-note"><span id="home-lede-atlas">A working atlas.</span></p>
    <!-- <p id="commented-example">Not an anchor.</p> -->
    <spw-include src="skip-link"></spw-include>
    <p aria-describedby="not-an-id" data-id="also-not">Attributes that end in id.</p>
  `;
  const ids = anchorsOfPage(html, '/play/rpg-wednesday/', root);
  assert.ok(ids.has('home-frame-note'));
  assert.ok(ids.has('home-lede-atlas'));
  assert.ok(ids.has('skip-target'));
  assert.ok(ids.has('rpgw-state-curator'), 'runtime anchors count for their route');
  assert.ok(!ids.has('commented-example'));
  assert.ok(!ids.has('not-an-id'));
  assert.ok(!ids.has('also-not'));
});

test('a page file names the route it serves', () => {
  const root = path.join(tmpdir(), 'site');
  assert.equal(routeOfPage(path.join(root, 'index.html'), root), '/');
  assert.equal(routeOfPage(path.join(root, 'about', 'index.html'), root), '/about/');
});
