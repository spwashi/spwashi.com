/**
 * Unit checks for incremental CSS bundle selection (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filterBundleTargets,
  listBundleTargets,
  normalizeCssSourceHref,
  onlyTokensForTargets,
  parseStyleImports,
  resolveCanonicalRouteSurface,
  resolveScopedStylesheets,
  routeBundleHref,
  targetsForSourcePaths,
} from '../typed/css-manifest.mjs';

describe('css-manifest incremental filters', () => {
  it('parseStyleImports preserves external query and hash components', () => {
    const imports = parseStyleImports(`
      @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap");
      @import url("https://fonts.googleapis.com/css2?family=Newsreader:wght@300;600&display=swap#latin");
      @import url('/public/css/tokens/core.css?v=2#tokens') layer(tokens);
    `);

    assert.deepEqual(imports, [
      {
        file: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
        layer: null,
        external: true,
      },
      {
        file: 'https://fonts.googleapis.com/css2?family=Newsreader:wght@300;600&display=swap#latin',
        layer: null,
        external: true,
      },
      {
        file: '/public/css/tokens/core.css',
        layer: 'tokens',
        external: false,
      },
    ]);
  });

  it('normalizeCssSourceHref accepts repo-relative and root href', () => {
    assert.equal(normalizeCssSourceHref('public/css/routes/surfaces/home.css'), '/public/css/routes/surfaces/home.css');
    assert.equal(normalizeCssSourceHref('/public/css/tokens/core.css'), '/public/css/tokens/core.css');
  });

  it('filterBundleTargets selects route and skips core', () => {
    const targets = listBundleTargets();
    const filtered = filterBundleTargets(targets, { only: ['home', 'console'], skipCore: true });
    assert.ok(filtered.every((t) => t.kind !== 'core'));
    assert.ok(filtered.some((t) => t.kind === 'route' && t.scope === 'home'));
    assert.ok(filtered.some((t) => t.kind === 'behavior' && t.scope === 'console'));
  });

  it('targetsForSourcePaths maps home surface CSS to home route', () => {
    const affected = targetsForSourcePaths(['public/css/routes/surfaces/home.css'], {
      coreSourceHrefs: ['/public/css/tokens/core.css'],
    });
    assert.equal(affected.length, 1);
    assert.equal(affected[0].kind, 'route');
    assert.equal(affected[0].scope, 'home');
    assert.deepEqual(onlyTokensForTargets(affected), ['route:home']);
  });

  it('targetsForSourcePaths maps core token to core when listed', () => {
    const affected = targetsForSourcePaths(['/public/css/tokens/core.css'], {
      coreSourceHrefs: ['/public/css/tokens/core.css'],
    });
    assert.ok(affected.some((t) => t.kind === 'core'));
  });

  it('targetsForSourcePaths ignores generated bundles', () => {
    const affected = targetsForSourcePaths(['public/css/bundles/routes/home.css'], {
      coreSourceHrefs: [],
    });
    assert.equal(affected.length, 0);
  });

  it('software surface aliases to topics route CSS', () => {
    assert.equal(resolveCanonicalRouteSurface('software'), 'topics');
    assert.equal(routeBundleHref('software'), '/public/css/bundles/routes/topics.css');
    const sheets = resolveScopedStylesheets({
      surface: 'software',
      features: ['metrics', 'console'],
    });
    assert.ok(sheets.some((s) => s.href === '/public/css/bundles/core.css'));
    assert.ok(sheets.some((s) => s.kind === 'route' && s.scope === 'topics'));
    assert.ok(sheets.some((s) => s.kind === 'behavior' && s.scope === 'metrics'));
  });

  it('folios surface aliases to website route CSS', () => {
    assert.equal(resolveCanonicalRouteSurface('folios'), 'website');
    assert.equal(routeBundleHref('folios'), '/public/css/bundles/routes/website.css');
    const sheets = resolveScopedStylesheets({ surface: 'folios' });
    assert.ok(sheets.some((s) => s.kind === 'route' && s.scope === 'website'));
  });

  it('literal parser tool owns a route-scoped proof bundle', () => {
    assert.equal(
      routeBundleHref('tools-spw-parser'),
      '/public/css/bundles/routes/tools-spw-parser.css',
    );
    const sheets = resolveScopedStylesheets({
      surface: 'tools-spw-parser',
      features: ['console'],
    });
    assert.ok(sheets.some((s) => s.kind === 'route' && s.scope === 'tools-spw-parser'));
  });

  it('filterBundleTargets resolves software alias to topics bundle', () => {
    const filtered = filterBundleTargets(listBundleTargets(), {
      only: ['software'],
      skipCore: true,
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].scope, 'topics');
  });
});
