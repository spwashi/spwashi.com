import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { MOUNT_WHEN } from '../../public/js/runtime/module-catalog-constants.js';
import { ENHANCEMENT_DEFS } from '../../public/js/runtime/module-catalog-enhancement.js';
import {
  describeModuleOrchestration,
  resolveModuleCatalogSpecifier,
  resolveRuntimeModuleSpecifier,
} from '../../public/js/runtime/module-catalog-normalize.js';
import { describeModuleExport } from '../../public/js/runtime/module-export-contract.js';
import {
  listNamedInitAdapterExports,
  moduleSourceExportsName,
} from '../typed/runtime-contracts.mjs';
import {
  collectQuotedCustomProperties,
  fileHasClosedStyleTokenSet,
} from '../typed/style-property-contract.mjs';
import {
  composeOpBundle,
  getOperatorDefinition,
  getOperatorThresholdState,
  splitOperatorExpression,
  SPW_OPERATOR_THRESHOLD_SEQUENCE,
} from '../../public/js/kernel/shared.js';

import {
  isErrnoCode,
  shouldExcludeBuildPath,
  shouldIgnoreValidationPath,
} from '../typed/shared/build-topology.mjs';
import {
  isPublicSpecifier,
  resolvePublicSpecifier,
} from '../lib/resolve-public-specifier.mjs';
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
  catalogGeneratedAtFromText,
  collectHtmlImageReferences,
  createLineLocator,
  routeHrefForHtmlFile,
  shouldIgnoreRelativePath,
} from '../generate-design-catalog.mjs';
import {
  createSemanticModulePlan,
  semanticPackIdForDefinition,
} from '../typed/build/index.mjs';

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
  assert.equal(shouldIgnoreRelativePath('design/catalog/catalog.css', 'dist/design/catalog'), true);
  assert.equal(shouldIgnoreRelativePath('public/css/components/cards.css'), false);
});

test('design catalog image references retain route, alt text, and responsive sources', () => {
  const html = `<figure>
    <picture>
      <source srcset="/public/images/study-640.webp 640w, /public/images/study-1280.webp 1280w">
      <img src="/public/images/study.webp?rev=2" alt="A card study in its route">
    </picture>
  </figure>`;

  assert.deepEqual(collectHtmlImageReferences(html, 'design/components/index.html'), [
    {
      alt: '',
      file: 'design/components/index.html',
      line: 3,
      path: 'public/images/study-640.webp',
      route: '/design/components/',
    },
    {
      alt: '',
      file: 'design/components/index.html',
      line: 3,
      path: 'public/images/study-1280.webp',
      route: '/design/components/',
    },
    {
      alt: 'A card study in its route',
      file: 'design/components/index.html',
      line: 4,
      path: 'public/images/study.webp',
      route: '/design/components/',
    },
  ]);
  assert.equal(routeHrefForHtmlFile('index.html'), '/');
  assert.equal(routeHrefForHtmlFile('about/index.html'), '/about/');
});

test('design catalog checks reuse the authored generation instant', () => {
  const generatedAt = '2026-09-03T12:34:56.000Z';

  assert.equal(catalogGeneratedAtFromText(JSON.stringify({generatedAt})), generatedAt);
  assert.equal(catalogGeneratedAtFromText('{not-json'), null);
  assert.equal(catalogGeneratedAtFromText(JSON.stringify({generatedAt: 'eventually'})), null);
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
    'npm run build:compile && node scripts/css-build.mjs && node --import ./scripts/lib/register-public-imports.mjs scripts/build.mjs',
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
  const { MODULE_TEST_FILES } = await import('../module-tests.mjs');

  assert.equal(packageJson.scripts['test:modules:run'], 'node scripts/run-module-tests.mjs');
  assert.ok(
    checkLocalSource.includes('scripts/run-module-tests.mjs'),
    'check-local.mjs should run the shared module-test runner',
  );

  const { readdir } = await import('node:fs/promises');
  const testDirEntries = await readdir(path.join(ROOT, 'scripts/tests'), { withFileTypes: true });
  const allTestFiles = testDirEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
    .map((entry) => `scripts/tests/${entry.name}`)
    .sort();

  for (const testFile of allTestFiles) {
    assert.ok(
      MODULE_TEST_FILES.includes(testFile),
      `MODULE_TEST_FILES is missing test suite "${testFile}". Add it to scripts/module-tests.mjs.`,
    );
  }
});

test('narrow npm test scripts keep public-import loaders', async () => {
  const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const { MODULE_TEST_IMPORTS } = await import('../module-tests.mjs');
  const scripts = [
    'test:timing',
    'test:engagement:run',
    'test:components:run',
  ];

  for (const scriptName of scripts) {
    const script = packageJson.scripts[scriptName] || '';
    for (const specifier of MODULE_TEST_IMPORTS) {
      assert.ok(
        script.includes(`--import ${specifier}`),
        `${scriptName} should import ${specifier} so public runtime modules resolve`,
      );
    }
  }
});

test('pre-commit syntax gate is JS-only', async () => {
  const hook = await readFile(path.join(ROOT, 'scripts/githooks/pre-commit'), 'utf8');
  assert.match(hook, /js\|mjs\|cjs/);
  assert.doesNotMatch(hook, /ts\|mts/);
  assert.match(hook, /tsc owns/);
});

test('generated-output check names uncommitted files, not stale outputs', async () => {
  const source = await readFile(path.join(ROOT, 'scripts/ts/check-generated.mts'), 'utf8');
  assert.match(source, /uncommitted=/);
  assert.match(source, /--allow-dirty/);
  assert.doesNotMatch(source, /\[generated\] stale=/);
});

test('public specifiers resolve onto a filesystem root', () => {
  assert.equal(isPublicSpecifier('/public/js/kernel/operator-detection.js'), true);
  assert.equal(isPublicSpecifier('../kernel/operator-detection.js'), false);
  assert.equal(
    resolvePublicSpecifier('/public/js/kernel/operator-detection.js', '/repo'),
    path.join('/repo', 'public/js/kernel/operator-detection.js'),
  );
  assert.equal(resolvePublicSpecifier('./local.js', '/repo'), null);
  assert.equal(isErrnoCode({ code: 'ENOENT' }, 'ENOENT'), true);
  assert.equal(isErrnoCode({ code: 'EACCES' }, 'ENOENT'), false);
  assert.equal(isErrnoCode('ENOENT', 'ENOENT'), false);
});

test('site build registers the public-js import hook before loading the catalog', async () => {
  const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const hook = './scripts/lib/register-public-imports.mjs';
  for (const scriptName of ['build', 'build:site', 'build:site:run']) {
    const script = packageJson.scripts[scriptName] || '';
    assert.ok(
      script.includes(`--import ${hook}`),
      `${scriptName} should register ${hook} so catalog /public/js specifiers resolve under Node`,
    );
  }

  const buildEntry = await readFile(path.join(ROOT, 'scripts/build.mjs'), 'utf8');
  assert.match(buildEntry, /register-public-imports/);

  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      hook,
      '-e',
      "import { MODULE_DEFS } from './public/js/runtime/module-catalog.js'; if (!Array.isArray(MODULE_DEFS) || !MODULE_DEFS.length) process.exit(2);",
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
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
  assert.equal(
    resolveModuleCatalogSpecifier('/public/js/kernel/site-settings-engine.js', 'https://spwashi.test'),
    'https://spwashi.test/public/js/kernel/site-settings-engine.js',
  );
  assert.equal(resolveModuleCatalogSpecifier('/public/css/style.css', 'https://spwashi.test'), '');
  assert.equal(
    resolveRuntimeModuleSpecifier(
      './spw-idle-lab-a1b2c3.js',
      'https://spwashi.test',
      'https://spwashi.test/public/js/site.js',
    ),
    'https://spwashi.test/public/js/spw-idle-lab-a1b2c3.js',
  );
});

test('module orchestration groups one flat catalog definition for loaders and inspectors', () => {
  const orchestration = describeModuleOrchestration({
    id: 'material-probe',
    layer: 'enhancement',
    when: 'visible',
    selector: '[data-material-probe]',
    rootMode: 'multiple',
    subfeatures: ['crop-projection'],
    triggers: ['viewport-encounter'],
    affordances: ['inspect-material-crop'],
    electrostatics: { role: 'capacitor', discharge: 'settle' },
    updates: ['flourish:--material-crop'],
    effectScope: 'local-dom css-vars',
    cost: { commitment: 'project', spend: 'none', copy: null },
    mount() {},
    unmount() {},
  });

  assert.equal(orchestration.schedule.when, 'visible');
  assert.equal(orchestration.gates.selector, '[data-material-probe]');
  assert.equal(orchestration.capabilities.complete, true);
  assert.deepEqual(orchestration.capabilities.affordances, ['inspect-material-crop']);
  assert.equal(orchestration.effects.electrostatics.role, 'capacitor');
  assert.equal(orchestration.lifecycle.mount, 'catalog-adapter');
  assert.equal(orchestration.lifecycle.cleanup, 'catalog-unmount');
});

test('named catalog mount adapters must match a real init export', () => {
  assert.deepEqual(
    listNamedInitAdapterExports("mount: (mod) => mod?.initImageMetaphysics?.()"),
    ['initImageMetaphysics'],
  );
  assert.deepEqual(
    listNamedInitAdapterExports("const fn = mod?.initSpwLogoRuntime || mod?.initLogoRuntime;"),
    ['initSpwLogoRuntime', 'initLogoRuntime'],
  );
  assert.equal(
    moduleSourceExportsName('export function initSpwImageMetaphysics() {}', 'initImageMetaphysics'),
    false,
  );
  assert.equal(
    moduleSourceExportsName('export function initSpwImageMetaphysics() {}', 'initSpwImageMetaphysics'),
    true,
  );
  assert.equal(
    moduleSourceExportsName(
      'const initFrameNavigator = () => {};\nexport { initFrameNavigator, unmountFrameNavigator as unmount };',
      'initFrameNavigator',
    ),
    true,
  );
  assert.equal(
    moduleSourceExportsName('export { initLocal as initFrameNavigator };', 'initFrameNavigator'),
    true,
  );
});

test('image metaphysics and texture slice keep portable mounts instead of named adapters', () => {
  for (const id of ['image-metaphysics', 'texture-slice', 'logo-runtime']) {
    const definition = ENHANCEMENT_DEFS.find((entry) => entry.id === id);
    assert.ok(definition, id);
    assert.equal(typeof definition.mount, 'undefined', `${id} should resolve mount from the loaded module`);
  }
});

test('dynamic style writes are allowed when the file quotes a closed CSS token set', () => {
  const source = "const TOKENS = ['--spw-slice-u', '--spw-slice-v'];\nhost.style.setProperty(property, value);";
  const quoted = collectQuotedCustomProperties(source);
  assert.deepEqual(quoted, ['--spw-slice-u', '--spw-slice-v']);
  assert.equal(fileHasClosedStyleTokenSet(quoted, new Set(['--spw-slice-u', '--spw-slice-v'])), true);
  assert.equal(fileHasClosedStyleTokenSet(quoted, new Set(['--spw-slice-u'])), false);
  assert.equal(fileHasClosedStyleTokenSet([], new Set(['--spw-slice-u'])), false);
});

test('module export inspection reports catalog mirror drift without changing authority', () => {
  const report = describeModuleExport({
    SPW_MODULE_EXPORT: {
      id: 'material-probe',
      mount() {},
      updates: ['flourish:--material-crop'],
      timingArc: 'idle-visual',
      effectScope: 'local-dom css-vars',
    },
  }, {
    id: 'material-probe',
    updates: ['flourish:--material-crop'],
    timingArc: 'visible-media',
    effectScope: 'css-vars local-dom',
  });

  assert.equal(report.orchestration.authority, 'catalog');
  assert.equal(report.orchestration.status, 'drift');
  assert.deepEqual(report.orchestration.drift, ['timingArc']);
});

test('deploy packs preserve catalog timing language and module addresses', () => {
  const definitions = [
    {
      id: 'shell',
      when: 'immediate',
      describes: 'shell surface',
      updates: ['structural:data-spw-shell'],
      load: () => import('../../public/js/runtime/shell-disclosure.js'),
    },
    {
      id: 'console',
      when: 'idle',
      timingChunk: 'idle-chrome',
      load: () => import('../../public/js/runtime/console.js'),
    },
    {
      id: 'page-anatomy',
      when: 'visible',
      load: () => import('../../public/js/runtime/page-anatomy.js'),
    },
  ];

  assert.equal(semanticPackIdForDefinition(definitions[0]), 'foundation');
  assert.equal(semanticPackIdForDefinition(definitions[1]), 'idle-chrome');
  assert.equal(semanticPackIdForDefinition(definitions[2]), 'visible-page-anatomy');

  const plan = createSemanticModulePlan(definitions, path.join(ROOT, 'dist-test'));
  assert.deepEqual(plan.packs.map((pack) => pack.id), [
    'foundation',
    'idle-chrome',
    'visible-page-anatomy',
  ]);
  assert.deepEqual(plan.packs[0].moduleIds, ['shell']);
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
    const chipMatches = html.matchAll(/class="[^"]*spw-chip[^"]*"[^>]*data-spw-operator="([^"]+)"[^>]*>([^<]+)</g);
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
  const [barrel, coreCatalog, featureCatalog, engine, ui] = await Promise.all([
    readFile(path.join(ROOT, 'public/js/kernel/site-settings.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/js/runtime/module-catalog-core.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/js/runtime/module-catalog-feature.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/js/kernel/site-settings-engine.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/js/kernel/site-settings-ui.js'), 'utf8'),
  ]);

  assert.doesNotMatch(barrel, /import\s+[^;]*site-settings-ui/);
  assert.doesNotMatch(barrel, /export\s+\*\s+from\s+['"]\.\/site-settings-ui/);
  assert.match(coreCatalog, /id:\s*'site-settings'[\s\S]*import\('\.\.\/kernel\/site-settings-engine\.js'\)/);
  assert.match(featureCatalog, /id:\s*'settings-page'[\s\S]*import\('\.\.\/kernel\/site-settings-ui\.js'\)/);
  assert.doesNotMatch(featureCatalog, /initSiteSettingsPage/);
  assert.match(ui, /export const initSiteSettingsPage/);
  assert.match(ui, /SPW_MODULE_EXPORT/);
  assert.match(engine, /import\('\.\/site-settings-ui\.js'\)/);
  assert.match(engine, /function scheduleSettingsUiBindings/);
});
