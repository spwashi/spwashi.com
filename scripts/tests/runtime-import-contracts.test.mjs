import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  collectRuntimeImportReport,
  parseBrowserModuleImports,
} from '../typed/runtime-contracts/imports.mjs';

async function inspectFixture(t, files) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'spw-runtime-imports-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'public/js'), { recursive: true });
  await Promise.all(Object.entries(files).map(async ([file, source]) => {
    const destination = path.join(root, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, source);
  }));
  return collectRuntimeImportReport(root);
}

test('parses executable imports and re-exports, excluding comments, prose, and JSDoc', () => {
  const imports = parseBrowserModuleImports([
    '// import("../typed/comment.js");',
    '/** @typedef {import("../typed/type-only.js").Example} Example */',
    'const prose = "export * from ../typed/prose.js";',
    "import '../kernel/side-effect.js';",
    "import { value } from '../kernel/value.js';",
    "export * as contract from '../kernel/contract.js';",
    'const lazy = import(/* delay */ `../kernel/lazy.js`);',
    'const computed = import(modulePath);',
  ].join('\n'));
  assert.deepEqual(imports.map(({ kind, specifier, line }) => ({ kind, specifier, line })), [
    { kind: 'import', specifier: '../kernel/side-effect.js', line: 4 },
    { kind: 'import', specifier: '../kernel/value.js', line: 5 },
    { kind: 'export', specifier: '../kernel/contract.js', line: 6 },
    { kind: 'dynamic', specifier: '../kernel/lazy.js', line: 7 },
    { kind: 'dynamic', specifier: null, line: 8 },
  ]);
});

test('checks missing static, side-effect, re-export, and lazy import files', async (t) => {
  const report = await inspectFixture(t, {
    'public/js/runtime/missing.js': [
      "import { missing } from './named.js';",
      "import './side-effect.js';",
      "export * from './re-export.js';",
      "import('./lazy.js');",
    ].join('\n'),
  });
  assert.equal(report.errors.length, 4);
  for (const file of ['named', 'side-effect', 're-export', 'lazy']) {
    assert.ok(report.errors.some((error) => error.includes(`missing file ./${file}.js`)));
  }
});

test('browser imports require explicit .js and stay inside the public runtime', async (t) => {
  const report = await inspectFixture(t, {
    'public/js/runtime/paths.js': [
      "import './module';",
      "import './module.ts';",
      "import '/public/js-other/module.js';",
      "import '../../../scripts/tool.js';",
      "import '/public/js/%2e%2e/private.js';",
      "import 'node:fs';",
    ].join('\n'),
  });
  assert.equal(report.errors.length, 6);
  assert.equal(report.errors.filter((error) => error.includes('explicit .js')).length, 2);
  assert.equal(report.errors.filter((error) => error.includes('escapes public/js/')).length, 3);
  assert.ok(report.errors.some((error) => error.includes('browser-relative path')));
});

test('normalizes browser absolute URLs and query suffixes; external CDN URLs remain valid', async (t) => {
  const report = await inspectFixture(t, {
    'public/js/runtime/paths.js': [
      "import '/public/js/kernel/value.js?v=1#contract';",
      "import('../kernel/%76alue.js');",
      "import('https://esm.sh/package?bundle');",
      "import('//cdn.example/package');",
    ].join('\n'),
    'public/js/kernel/value.js': 'export const value = 1;',
  });
  assert.deepEqual(report.errors, []);
});

test('typed implementation edges remain behind kernel facades or lazy scheduling boundaries', async (t) => {
  const report = await inspectFixture(t, {
    'public/ts/example.ts': 'export const example = 1;',
    'public/js/typed/example.js': 'export const example = 1;',
    'public/js/kernel/example.js': "export * from '../typed/example.js';",
    'public/js/site.js': "import('./typed/example.js');",
    'public/js/runtime/catalog/feature.js': "import('../../typed/example.js');",
    'public/js/runtime/catalog/normalize.js': "import('../../typed/example.js');",
    'public/js/runtime/eager.js': "import '../typed/example.js';",
    'public/js/interface/lazy.js': "import('../kernel/../typed/example.js');",
    'public/js/modules/example/feature.js': "export * from '/public/js/typed/example.js';",
  });
  assert.equal(report.errors.length, 4);
  assert.equal(report.typedImportViolations.length, 4);
  assert.deepEqual(report.kernelTypedShims, ['kernel/example.js']);
});

test('catalog and bootstrap may not eagerly import generated typed implementations', async (t) => {
  const report = await inspectFixture(t, {
    'public/ts/example.ts': 'export const example = 1;',
    'public/js/typed/example.js': 'export const example = 1;',
    'public/js/site.js': "import './typed/example.js';",
    'public/js/runtime/catalog/feature.js': "export * from '../../typed/example.js';",
  });
  assert.equal(report.errors.length, 2);
  assert.equal(report.typedImportViolations.length, 2);
});

test('nested emitted files and kernel facades preserve source-relative ownership', async (t) => {
  const report = await inspectFixture(t, {
    'public/ts/feeds/reader.ts': 'export const read = () => null;',
    'public/ts/feeds/value.ts': 'export const value = 1;',
    'public/ts/feeds/interfaces.d.ts': 'export interface Contract {}',
    'public/js/typed/feeds/reader.js': "import './value.js'; export const read = () => null;",
    'public/js/typed/feeds/value.js': 'export const value = 1;',
    'public/js/kernel/feeds/reader.js': "export * from '../../typed/feeds/reader.js';",
  });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.kernelTypedShims, ['kernel/feeds/reader.js']);
  assert.deepEqual(report.typedOutputs, ['public/js/typed/feeds/reader.js', 'public/js/typed/feeds/value.js']);
});

test('detects both orphan generated files and missing nested output after source moves', async (t) => {
  const report = await inspectFixture(t, {
    'public/ts/new/reader.ts': 'export const read = () => null;',
    'public/js/typed/old/reader.js': 'export const read = () => null;',
  });
  assert.equal(report.errors.length, 2);
  assert.ok(report.errors.some((error) => error.includes('no matching public/ts/old/reader.ts')));
  assert.ok(report.errors.some((error) => error.includes('no matching public/js/typed/new/reader.js')));
});

test('kernel re-exports must name the matching source rather than any typed implementation', async (t) => {
  const report = await inspectFixture(t, {
    'public/ts/other.ts': 'export const value = 1;',
    'public/js/typed/other.js': 'export const value = 1;',
    'public/js/kernel/example.js': "export * as value from '../typed/other.js';",
  });
  assert.equal(report.errors.length, 2);
  assert.ok(report.errors.some((error) => error.includes('public/ts/example.ts is missing')));
  assert.ok(report.errors.some((error) => error.includes('must re-export public/js/typed/example.js')));
});

test('computed imports require both the declared loader owner and its expression', async (t) => {
  const report = await inspectFixture(t, {
    'public/js/kernel/shared.js': 'import(specifier); import(other);',
    'public/js/semantic/pretext-utils.js': 'import(CDN_URL);',
    'public/js/runtime/feature.js': 'import(specifier);',
  });
  assert.equal(report.errors.length, 2);
  assert.ok(report.errors.some((error) => error.includes('import(other)')));
  assert.ok(report.errors.some((error) => error.includes('runtime/feature.js')));
});

test('entrypoints and module families keep their existing folder boundaries', async (t) => {
  const report = await inspectFixture(t, {
    'public/js/site.js': '',
    'public/js/compose.js': '',
    'public/js/extra.js': '',
    'public/js/unknown/module.js': '',
    'public/js/modules/loose.js': '',
    'public/js/modules/owned/module.js': '',
    'public/js/generated/feed.js': '',
  });
  assert.equal(report.errors.length, 3);
  assert.deepEqual(report.rootEntrypoints, ['compose.js', 'extra.js', 'site.js']);
  assert.deepEqual(report.topLevelModuleFiles, ['public/js/modules/loose.js']);
});

test('lower runtime layers cannot import the orchestration that consumes them', async (t) => {
  const report = await inspectFixture(t, {
    'public/js/runtime/browser-primitives.js': "import './orchestration/policy.js';",
    'public/js/runtime/catalog/constants.js': "export * from '../orchestration/loader.js';",
    'public/js/runtime/orchestration/policy.js': "import './loader.js';",
    'public/js/runtime/orchestration/features.js': "import './lifecycle.js';",
    'public/js/runtime/orchestration/loader.js': '',
    'public/js/runtime/orchestration/lifecycle.js': '',
    'public/js/typed/module-registry.js': "import '../kernel/dom-contracts.js';",
    'public/js/kernel/dom-contracts.js': '',
    'public/ts/module-registry.ts': 'export {};',
  });
  assert.equal(report.errors.length, 5);
  for (const owner of ['browser primitives', 'catalog vocabulary', 'policy or feature gates', 'portable registry']) {
    assert.ok(report.errors.some((error) => error.includes(owner)), owner);
  }
});
