import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { MOUNT_WHEN } from '../../public/js/runtime/module-catalog-constants.js';
import { ENHANCEMENT_DEFS } from '../../public/js/runtime/module-catalog-enhancement.js';

import {
  shouldExcludeBuildPath,
  shouldIgnoreValidationPath,
} from '../typed/shared/build-topology.mjs';
import {
  compareRouteRuntimeManifestSemantics,
} from '../typed/site-contracts/index.mjs';
import {
  isAuthoredHtml,
  ROOT,
} from '../lib/spw-inventory-core.mjs';
import {
  createLineLocator,
  shouldIgnoreRelativePath,
} from '../generate-design-catalog.mjs';

test('component capture packs stay outside public build and authored inventories', () => {
  const captureIndex = 'design/components/captures/index.html';
  assert.equal(shouldExcludeBuildPath(captureIndex), true);
  assert.equal(shouldIgnoreValidationPath(captureIndex), true);
  assert.equal(isAuthoredHtml(path.join(ROOT, captureIndex)), false);
});

test('design catalog line lookup indexes each source once without line drift', () => {
  const lineAt = createLineLocator('alpha\nbeta\n\ngamma');

  assert.deepEqual(
    [0, 5, 6, 10, 11, 12, 17].map((index) => lineAt(index)),
    [1, 1, 2, 2, 3, 4, 4],
  );
});

test('design catalog scans authored CSS and ignores generated build copies', () => {
  assert.equal(shouldIgnoreRelativePath('dist-vite/assets/site.js'), true);
  assert.equal(shouldIgnoreRelativePath('public/css/bundles/core.css'), true);
  assert.equal(shouldIgnoreRelativePath('public/css/components/cards.css'), false);
});

test('manifest semantic comparison ignores volatile fields and catches runtime drift', () => {
  const live = {
    generatedAt: '2026-07-12T12:00:00.000Z',
    maps: { specRoutes: [], svgAssets: [], svgRoutes: [] },
    repoRoot: '/workspace/live',
    routeCount: 1,
    routes: [{ route: '/', runtime: { enhancementModules: ['one', 'two'] } }],
    runtimeDefinitions: { enhancementModules: ['one', 'two'] },
    surfaces: { home: { routes: ['/'] } },
  };
  const cached = structuredClone(live);
  cached.generatedAt = '2026-07-01T00:00:00.000Z';
  cached.repoRoot = '/workspace/cached';

  assert.equal(compareRouteRuntimeManifestSemantics(live, cached).matches, true);

  cached.runtimeDefinitions.enhancementModules.pop();
  const drift = compareRouteRuntimeManifestSemantics(live, cached);
  assert.equal(drift.matches, false);
  assert.ok(drift.details.some((detail) => detail.includes('runtimeDefinitions')));
});

test('composite build pipelines compile each TypeScript project once', async () => {
  const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const scripts = packageJson.scripts;

  assert.equal(
    scripts['build:compile'],
    'npm run typecheck:root && npm run build:tools && npm run build:runtime',
  );
  assert.equal(
    scripts.build,
    'npm run build:compile && node scripts/css-build.mjs && node scripts/build.mjs',
  );
  assert.ok(scripts['check:local'].startsWith('npm run build:compile && node scripts/css-build.mjs'));
  assert.ok(scripts.typecheck.includes('tsconfig.scripts.json --noEmit'));
  assert.ok(scripts.typecheck.includes('tsconfig.runtime.json --noEmit'));
});

test('settings momentum waits until idle because it only reacts to future events', () => {
  const definition = ENHANCEMENT_DEFS.find((entry) => entry.id === 'settings-momentum');

  assert.ok(definition);
  assert.equal(definition.when, MOUNT_WHEN.IDLE);
  assert.equal(definition.timingChunk, 'idle-chrome');
});
