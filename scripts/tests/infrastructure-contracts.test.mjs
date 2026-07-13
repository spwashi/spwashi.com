import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { MOUNT_WHEN } from '../../public/js/runtime/module-catalog-constants.js';
import { ENHANCEMENT_DEFS } from '../../public/js/runtime/module-catalog-enhancement.js';
import { resolveModuleCatalogSpecifier } from '../../public/js/runtime/module-catalog-normalize.js';

import {
  shouldExcludeBuildPath,
  shouldIgnoreValidationPath,
} from '../typed/shared/build-topology.mjs';
import {
  collectLocalFragmentIssues,
  compareRouteRuntimeManifestSemantics,
} from '../typed/site-contracts/index.mjs';
import {
  collectOfflineDocumentDependencies,
  collectPwaContractReport,
  extractServiceWorkerPrecache,
  injectBuildPrecacheAssets,
} from '../typed/pwa-contracts.mjs';
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
  assert.equal(scripts.check, 'npm run audit && npm run check:local');
  assert.ok(scripts['check:local'].startsWith('npm run build:compile && node scripts/css-build.mjs'));
  assert.ok(scripts['check:local'].includes('npm run check:pwa:run'));
  assert.equal(scripts['check:pwa'], 'npm run build:tools && npm run check:pwa:run');
  assert.ok(scripts.typecheck.includes('tsconfig.scripts.json --noEmit'));
  assert.ok(scripts.typecheck.includes('tsconfig.runtime.json --noEmit'));
});

test('PWA build precache injection is deterministic and parseable', () => {
  const worker = `
const OFFLINE_URL = '/offline/';
const CORE_ROUTES = ['/', OFFLINE_URL];
const CORE_ASSETS = ['/manifest.webmanifest', '/public/js/site.js'];
const REQUIRED_PRECACHE_URLS = [OFFLINE_URL, '/manifest.webmanifest'];
const requiredPrecacheSet = new Set(REQUIRED_PRECACHE_URLS);
const OPTIONAL_PRECACHE_URLS = [...new Set([...CORE_ROUTES, ...CORE_ASSETS])]
  .filter((url) => !requiredPrecacheSet.has(url));
const PRECACHE_URLS = [...new Set([...CORE_ROUTES, ...CORE_ASSETS])];
Promise.all(REQUIRED_PRECACHE_URLS.map((url) => url));
Promise.allSettled(OPTIONAL_PRECACHE_URLS.map((url) => url));
`;
  const output = injectBuildPrecacheAssets(worker, [
    '/manifest.webmanifest',
    '/public/css/bundles/core.css',
    '/public/js/site.js',
    '/public/css/bundles/core.css',
  ]);
  const precache = extractServiceWorkerPrecache(output);

  assert.deepEqual(precache.routes, ['/', '/offline/']);
  assert.deepEqual(precache.buildAssets, [
    '/public/css/bundles/core.css',
    '/public/js/site.js',
  ]);
  assert.deepEqual(precache.required, [
    '/manifest.webmanifest',
    '/offline/',
    '/public/css/bundles/core.css',
    '/public/js/site.js',
  ]);
  assert.match(output, /\.\.\.BUILD_PRECACHE_ASSETS/);
  assert.match(
    output,
    /const PRECACHE_URLS = \[\.\.\.new Set\(\[\.\.\.REQUIRED_PRECACHE_URLS, \.\.\.OPTIONAL_PRECACHE_URLS\]\)\];/,
  );
  assert.equal(injectBuildPrecacheAssets(output, precache.buildAssets), output);
});

test('PWA offline dependencies include only local load-bearing assets', () => {
  const dependencies = collectOfflineDocumentDependencies(`
    <link rel="stylesheet" href="/public/css/core.css?v=1">
    <link rel="canonical" href="https://spwashi.com/offline/">
    <link rel="manifest" href="/manifest.webmanifest">
    <script type="module" src="/public/js/site.js"></script>
    <script src="https://example.com/external.js"></script>
  `);

  assert.deepEqual(dependencies, [
    '/manifest.webmanifest',
    '/public/css/core.css',
    '/public/js/site.js',
  ]);
});

test('runtime resource probes resolve from the module catalog directory', () => {
  assert.equal(
    resolveModuleCatalogSpecifier('./spells.js', 'https://spwashi.test'),
    'https://spwashi.test/public/js/runtime/spells.js',
  );
  assert.equal(
    resolveModuleCatalogSpecifier('../interface/guide.js', 'https://spwashi.test'),
    'https://spwashi.test/public/js/interface/guide.js',
  );
  assert.equal(resolveModuleCatalogSpecifier('/public/js/site.js', 'https://spwashi.test'), '');
});

test('source PWA contract keeps manifest, icons, routes, assets, and offline shell aligned', async () => {
  const report = await collectPwaContractReport({ mode: 'source', rootDir: ROOT });
  assert.deepEqual(report.errors, []);
  assert.ok(report.manifestIcons >= 3);
  assert.deepEqual(report.offlineDependencies, [
    '/favicon.ico',
    '/manifest.webmanifest',
    '/public/css/bundles/core.css',
    '/public/images/apple-touch-icon.png',
  ]);
});

test('same-page fragment validation accepts static targets and rejects missing targets', () => {
  assert.deepEqual(
    collectLocalFragmentIssues('<a href="#details">Details</a><section id="details"></section>', '/about/', []),
    [],
  );
  assert.deepEqual(
    collectLocalFragmentIssues('<a href="#missing">Missing</a>', '/about/', []),
    ['Same-page fragment #missing has no static target.'],
  );
});

test('RPG Wednesday runtime fragment targets require the rpg-gameplay feature owner', () => {
  const html = [
    '<a href="#rpgw-state-curator">State curator</a>',
    '<a href="#rpg-kit-notes">Kit notes</a>',
    '<a href="#rpg-kit-brief">Kit brief</a>',
  ].join('');

  assert.deepEqual(
    collectLocalFragmentIssues(html, '/play/rpg-wednesday/', ['rpg-gameplay']),
    [],
  );
  assert.deepEqual(
    collectLocalFragmentIssues(html, '/play/rpg-wednesday/', []),
    [
      'Same-page fragment #rpgw-state-curator has no static target.',
      'Same-page fragment #rpg-kit-notes has no static target.',
      'Same-page fragment #rpg-kit-brief has no static target.',
    ],
  );
});

test('settings momentum waits until idle because it only reacts to future events', () => {
  const definition = ENHANCEMENT_DEFS.find((entry) => entry.id === 'settings-momentum');

  assert.ok(definition);
  assert.equal(definition.when, MOUNT_WHEN.IDLE);
  assert.equal(definition.timingChunk, 'idle-chrome');
});
