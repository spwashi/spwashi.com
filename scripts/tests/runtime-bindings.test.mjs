import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { collectRuntimeBindingFindings } from '../typed/runtime-contracts/bindings.mjs';

async function fixture(t, files, options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'spw-bindings-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      allowJs: true, checkJs: true, noEmit: true, strict: false,
      target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler',
      types: [], ...options,
    },
    include: ['*.js'],
  }));
  for (const [file, source] of Object.entries(files)) await writeFile(path.join(root, file), source);
  return path.join(root, 'tsconfig.json');
}

test('binding gate checks suggestions, unexported names, and every literal import form', async (t) => {
  const project = await fixture(t, {
    'source.js': 'const hidden = 1; export const greeting = 2;',
    'consumer.js': `import { hidden, greting } from './source.js';
      import './absent-side-effect.js';
      export { thing } from './absent-export.js';
      const greeting = 1;
      console.log(gretingName, greetng, hidden, greting, greeting);
      import('./absent-lazy.js');`,
  });
  const findings = collectRuntimeBindingFindings(project);
  assert.ok(findings.some((item) => item.code === 2459));
  assert.ok(findings.some((item) => item.code === 2724));
  assert.ok(findings.some((item) => item.code === 2304));
  assert.ok(findings.some((item) => item.code === 2552));
  for (const target of ['absent-side-effect', 'absent-export', 'absent-lazy']) {
    assert.ok(findings.some((item) => item.message.includes(target)), target);
  }
});

test('binding gate fails malformed source and configuration', async (t) => {
  const project = await fixture(t, { 'source.js': 'export const = ;' });
  assert.ok(collectRuntimeBindingFindings(project).some((item) => item.code < 2000));
  await writeFile(project, '{ "compilerOptions": { "module": "not-a-module-kind" } }');
  assert.ok(collectRuntimeBindingFindings(project).some((item) => item.code === 6046));
  await writeFile(project, '{');
  assert.ok(collectRuntimeBindingFindings(project).length > 0);
  assert.ok(collectRuntimeBindingFindings(`${project}.missing`).length > 0);
});

test('binding gate leaves ordinary JS inference errors to the type audit', async (t) => {
  const project = await fixture(t, {
    'source.js': '/** @param {string} value */ export function length(value) { return value.length; } length(123);',
  });
  assert.deepEqual(collectRuntimeBindingFindings(project), []);
});

test('inherited compile policy preserves generated output when a source has type errors', async (t) => {
  const project = await fixture(t, { 'source.js': '' });
  const root = path.dirname(project);
  await writeFile(path.join(root, 'source.ts'), 'export const value: string = 42;');
  await writeFile(project, JSON.stringify({
    extends: new URL('../../tsconfig.json', import.meta.url).pathname,
    compilerOptions: { noEmit: false, outDir: './output', types: [] },
    include: ['source.ts'],
  }));
  const config = ts.readConfigFile(project, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const writes = [];
  const result = program.emit(undefined, (file) => writes.push(file));
  assert.equal(result.emitSkipped, true);
  assert.ok(result.diagnostics.some((item) => item.code === 2322));
  assert.deepEqual(writes, []);
});
