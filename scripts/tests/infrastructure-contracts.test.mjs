import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { MOUNT_WHEN } from '../../public/js/runtime/module-catalog-constants.js';
import { ENHANCEMENT_DEFS } from '../../public/js/runtime/module-catalog-enhancement.js';
import { resolveModuleCatalogSpecifier } from '../../public/js/runtime/module-catalog-normalize.js';
import {
  composeOpBundle,
  getOperatorDefinition,
  getOperatorThresholdState,
  splitOperatorExpression,
  SPW_OPERATOR_THRESHOLD_SEQUENCE,
} from '../../public/js/kernel/shared.js';

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

  // build:compile and check:local are single orchestrator processes rather than
  // `npm run` chains, so the contract is asserted against the orchestrators.
  assert.equal(scripts['build:compile'], 'node scripts/build-compile.mjs');
  assert.equal(scripts['build:compile:serial'], 'node scripts/build-compile.mjs --serial');
  assert.equal(scripts['check:local'], 'node scripts/check-local.mjs');
  assert.equal(scripts['check:local:serial'], 'node scripts/check-local.mjs --serial');
  assert.equal(
    scripts.build,
    'npm run build:compile && node scripts/css-build.mjs && node scripts/build.mjs',
  );
  assert.equal(scripts.check, 'npm run audit && npm run check:local');
  assert.equal(scripts['check:pwa'], 'npm run build:tools && npm run check:pwa:run');
  assert.ok(scripts.typecheck.includes('tsconfig.scripts.json --noEmit'));
  assert.ok(scripts.typecheck.includes('tsconfig.runtime.json --noEmit'));

  // Each TypeScript project is compiled exactly once per compile wave.
  const compileSource = await readFile(path.join(ROOT, 'scripts/build-compile.mjs'), 'utf8');
  for (const project of ['--noEmit', 'tsconfig.scripts.json', 'tsconfig.runtime.json']) {
    assert.equal(
      compileSource.split(project).length - 1,
      1,
      `build-compile.mjs should reference ${project} exactly once`,
    );
  }
  assert.ok(compileSource.includes('fix-typed-imports'));

  // check:local still covers every validator the former npm-run chain ran.
  const checkLocalSource = await readFile(path.join(ROOT, 'scripts/check-local.mjs'), 'utf8');
  for (const validator of [
    'scripts/css-build.mjs',
    'scripts/check-site.mjs',
    'scripts/pwa-contracts.mjs',
    'scripts/check-generated.mjs',
    'scripts/component-contracts.mjs',
    'scripts/check-observation-locality.mjs',
  ]) {
    assert.ok(checkLocalSource.includes(validator), `check-local.mjs should run ${validator}`);
  }
  assert.ok(checkLocalSource.includes('runCompile'), 'check-local.mjs should run the compile wave');
});

test('check:local module tests match the test:modules script', async () => {
  const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const checkLocalSource = await readFile(path.join(ROOT, 'scripts/check-local.mjs'), 'utf8');

  // The orchestrator inlines the module test list; keep it identical to
  // `test:modules:run` so both entry points cover the same suites.
  const scriptSuites = [...packageJson.scripts['test:modules:run'].matchAll(/scripts\/tests\/[\w.-]+\.test\.mjs/g)]
    .map((match) => match[0])
    .sort();
  const orchestratorSuites = [...checkLocalSource.matchAll(/scripts\/tests\/[\w.-]+\.test\.mjs/g)]
    .map((match) => match[0])
    .sort();

  assert.deepEqual(orchestratorSuites, scriptSuites);
});

test('mounted workbench CLI scripts keep consumer-relative doctor/roots paths', async () => {
  const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const scripts = packageJson.scripts;

  assert.equal(scripts.spw, 'npm --prefix .spw/_workbench run spw --');
  assert.match(scripts['spw:doctor'], /doctor \.\.\/\.\./);
  assert.match(scripts['spw:roots'], /roots \.\.\/\.\./);
  assert.ok(scripts['spw:plan:check']);
  assert.ok(scripts['spw:plan:status']);
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
    '/public/js/site.js',
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

test('shared partials operator chips align data-spw-operator attributes and sigil prefixes', async () => {
  const cauldronHtml = await readFile(path.join(ROOT, '_partials/media-cauldron.html'), 'utf8');
  const footerHtml = await readFile(path.join(ROOT, '_partials/site-footer.html'), 'utf8');

  for (const html of [cauldronHtml, footerHtml]) {
    const chipMatches = html.matchAll(/class="[^"]*operator-chip[^"]*"[^>]*data-spw-operator="([^"]+)"[^>]*>([^<]+)</g);
    for (const [, opAttr, label] of chipMatches) {
      const definition = getOperatorDefinition(opAttr);
      assert.ok(definition, `Unknown operator type alias: ${opAttr}`);
      const decodedLabel = label.trim().replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
      if (/^[^a-zA-Z0-9\s]/.test(decodedLabel)) {
        assert.ok(
          decodedLabel.startsWith(definition.prefix),
          `Chip label "${decodedLabel}" sigil does not match prefix "${definition.prefix}" for operator "${opAttr}"`,
        );
      }
    }
  }
});

test('operator definitions and aliases resolve all canonical workbench roles', () => {
  const workbenchRoles = [
    'probe',
    'potential',
    'observer',
    'merge',
    'collapse',
    'integrate',
    'action',
    'constraint',
    'measure',
    'annotation',
    'ground_handle',
    'selector',
    'intrinsic',
  ];

  for (const role of workbenchRoles) {
    const definition = getOperatorDefinition(role);
    assert.ok(definition, `Workbench role "${role}" failed to resolve to an operator definition`);
    assert.ok(definition.prefix, `Workbench role "${role}" has no prefix`);
    assert.ok(definition.role, `Workbench role "${role}" has no role`);
    assert.ok(definition.physics, `Workbench role "${role}" has no physics field`);
  }
});

test('splits operators and operands with canonical positional dispatch', () => {
  const unspacedHandle = splitOperatorExpression('#>town_library');
  assert.equal(unspacedHandle.operator, 'frame');
  assert.equal(unspacedHandle.prefix, '#>');
  assert.equal(unspacedHandle.operand, 'town_library');
  assert.equal(unspacedHandle.position, 'prefix');

  const proseAction = splitOperatorExpression('! generate seed');
  assert.equal(proseAction.operator, 'action');
  assert.equal(proseAction.prefix, '!');
  assert.equal(proseAction.operand, 'generate seed');
  assert.equal(proseAction.position, 'prefix');

  const modeLens = splitOperatorExpression('[cozy]');
  assert.equal(modeLens.operator, 'mode');
  assert.equal(modeLens.prefix, '[');
  assert.equal(modeLens.operand, 'cozy');
  assert.equal(modeLens.position, 'prefix');

  const bundle = composeOpBundle('! generate seed');
  assert.match(bundle, /operator:action/);
  assert.match(bundle, /operand:generate_seed/);
  assert.match(bundle, /position:prefix/);
  assert.match(bundle, /threshold:acting/);
  assert.match(bundle, /dispatch:forward/);
});

test('maps operator threshold physics sequence states', () => {
  assert.equal(SPW_OPERATOR_THRESHOLD_SEQUENCE.length, 10);
  assert.equal(getOperatorThresholdState('~')?.state, 'latent');
  assert.equal(getOperatorThresholdState('wonder')?.state, 'probing');
  assert.equal(getOperatorThresholdState('action')?.state, 'acting');
  assert.equal(getOperatorThresholdState('ground')?.state, 'grounded');
});

test('settings apply stays off the UI module graph', async () => {
  const [barrel, coreCatalog, featureCatalog, engine] = await Promise.all([
    readFile(path.join(ROOT, 'public/js/kernel/site-settings.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/js/runtime/module-catalog-core.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/js/runtime/module-catalog-feature.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/js/kernel/site-settings-engine.js'), 'utf8'),
  ]);

  assert.doesNotMatch(barrel, /import\s+[^;]*site-settings-ui/);
  assert.doesNotMatch(barrel, /export\s+\*\s+from\s+['"]\.\/site-settings-ui/);
  assert.match(coreCatalog, /id:\s*'site-settings'[\s\S]*import\('\.\.\/kernel\/site-settings-engine\.js'\)/);
  assert.match(featureCatalog, /id:\s*'settings-page'[\s\S]*import\('\.\.\/kernel\/site-settings-ui\.js'\)/);
  assert.match(featureCatalog, /initSiteSettingsPage/);
  assert.match(engine, /import\('\.\/site-settings-ui\.js'\)/);
  assert.match(engine, /function scheduleSettingsUiBindings/);
});
