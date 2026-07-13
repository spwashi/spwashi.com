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
  resolveCanonicalRouteSurface,
  resolveScopedStylesheets,
  routeBundleHref,
  targetsForSourcePaths,
} from '../typed/css-manifest.mjs';

describe('css-manifest incremental filters', () => {
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

  it('filterBundleTargets resolves software alias to topics bundle', () => {
    const filtered = filterBundleTargets(listBundleTargets(), {
      only: ['software'],
      skipCore: true,
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].scope, 'topics');
  });
});
