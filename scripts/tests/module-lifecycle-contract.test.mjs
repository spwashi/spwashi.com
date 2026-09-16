import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { createModuleExport } from '../../public/js/runtime/catalog/export-contract.js';
import { createModuleLoader } from '../../public/js/runtime/orchestration/loader.js';
import { createRegistry } from '../../public/js/kernel/module-registry.js';
import { readRuntimePolicy } from '../../public/js/runtime/orchestration/policy.js';

test('TypeScript validates portable mount arity and asynchronous cleanup handles', () => {
  const fixturePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'module-lifecycle-types.fixture.ts');
  const source = `
    import type { SpwModuleDef, SpwModuleExport, SpwModuleMountResult } from '../../types/module-catalog';
    import { createRegistry } from '../../public/ts/module-registry.js';

    const registry = createRegistry<{ id: string; count: number }>();
    registry.set('one', { id: 'one', count: 1 });
    const count: number | undefined = registry.get('one')?.count;
    // @ts-expect-error A generic registry preserves the owner's required fields.
    registry.set('two', { id: 'two' });
    void count;

    const portable = {
      async mount(ctx, root) {
        return { async destroy() {}, refresh(nextCtx, nextRoot) {} };
      },
      refresh(ctx, root) {},
    } satisfies SpwModuleExport;
    const cleanup: SpwModuleMountResult = async () => {};
    const handle: SpwModuleMountResult = { async cleanup() {}, async destroy() {} };
    const catalog: SpwModuleDef = {
      id: 'typed-lifecycle', layer: 'feature', when: 'immediate', load: async () => portable,
      mount(mod, ctx, root) { return handle; },
      async unmount(record) { await record.cleanup?.(); },
    };
    const invalid: SpwModuleExport = {
      // @ts-expect-error Portable mount has two arguments; only catalog adapters receive the module namespace.
      mount(mod: unknown, ctx: unknown, root: unknown) {},
    };
    // @ts-expect-error A destroy handle must be callable.
    const invalidHandle: SpwModuleMountResult = { destroy: true };
    // @ts-expect-error Authored catalog vocabulary is closed, not arbitrary strings.
    const invalidLayer: SpwModuleDef['layer'] = 'features';
    // @ts-expect-error A scheduling typo must not silently widen to string.
    const invalidWhen: SpwModuleDef['when'] = 'visibile';
    // @ts-expect-error Only single and each are root modes.
    const invalidRoot: SpwModuleDef['rootMode'] = 'all';
    // @ts-expect-error Cost classes use the canonical vocabulary.
    const invalidCost: SpwModuleDef['costClass'] = 'cheap';
    // @ts-expect-error Visual permissions use the canonical vocabulary.
    const invalidVisual: SpwModuleDef['visual'] = 'ornamental';
    void [portable, cleanup, catalog, invalid, invalidHandle];
  `;
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (filename, languageVersion, ...rest) => filename === fixturePath
    ? ts.createSourceFile(filename, source, languageVersion, true)
    : getSourceFile(filename, languageVersion, ...rest);
  const program = ts.createProgram([fixturePath], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (filename) => filename,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }));
});

function createHarness(definition, roots = []) {
  const def = { layer: 'feature', when: 'immediate', rootMode: 'single', ...definition };
  const loader = createModuleLoader({
    moduleDefs: [def],
    html: document.documentElement,
    body: document.body,
    matchesRoute: () => true,
    hasSelector: () => true,
    getRoots: () => roots,
    hasDebugOrQAMode: () => false,
    readConnectionPosture: () => 'fast',
    shouldPrefetchRuntimeResources: () => false,
    extractDynamicImportSpecifier: () => '',
    moduleSpecifierToUrl: () => '',
    ensureResourceHint: () => false,
    isRuntimeResourceCached: async () => false,
    requestServiceWorkerPrefetch: () => false,
    requestServiceWorkerCacheSummary: () => false,
    refreshRegionProfiles: () => {},
    setPageState: () => {},
  });
  const ctx = {
    registry: createRegistry(),
    runtimePolicy: readRuntimePolicy(),
    moduleAudit: [],
    bus: { emit() {} },
    html: document.documentElement,
    body: document.body,
    now: () => performance.now(),
  };
  return { loader, ctx, def };
}

test('portable exports receive context and root, and retain export refresh with an async destroy handle', async () => {
  const calls = [];
  const root = document.body;
  const { loader, ctx, def } = createHarness({
    id: 'portable-lifecycle',
    load: async () => createModuleExport({
      mount(...args) {
        calls.push(['mount', ...args]);
        return { async destroy() { calls.push(['destroy']); } };
      },
      refresh(...args) { calls.push(['refresh', ...args]); },
    }),
  }, [root]);

  const record = await loader.mountModuleById(def.id, ctx, { root });
  assert.equal(record.status, 'mounted');
  assert.deepEqual(calls[0], ['mount', ctx, root]);
  loader.refreshRuntime(ctx);
  assert.deepEqual(calls[1], ['refresh', ctx, root]);
  await ctx.registry.cleanupAll();
  assert.equal(record.status, 'unmounted');
  assert.equal(ctx.registry.has(def.id), false);
  assert.deepEqual(calls[2], ['destroy']);
});

test('catalog adapters receive module/context/root and returned refresh wins over export refresh', async () => {
  const calls = [];
  const mod = createModuleExport({ mount() {}, refresh() { assert.fail('export refresh must not replace instance refresh'); } });
  const { loader, ctx, def } = createHarness({
    id: 'adapter-lifecycle',
    load: async () => mod,
    mount(...args) {
      calls.push(args);
      return { refresh(nextCtx) { calls.push([nextCtx]); } };
    },
  });
  await loader.mountModuleById(def.id, ctx);
  assert.deepEqual(calls[0], [mod, ctx, null]);
  loader.refreshRuntime(ctx);
  assert.deepEqual(calls[1], [ctx]);
  await loader.unmountModuleById(def.id, ctx);

  const returnedRefresh = () => calls.push(['returned-refresh']);
  const portable = createHarness({
    id: 'portable-instance-refresh',
    load: async () => createModuleExport({
      mount: () => ({ refresh: returnedRefresh }),
      refresh() { assert.fail('returned refresh owns instance state'); },
    }),
  });
  const record = await portable.loader.mountModuleById(portable.def.id, portable.ctx);
  assert.equal(record.refresh, returnedRefresh);
  portable.loader.refreshRuntime(portable.ctx);
  assert.deepEqual(calls.at(-1), ['returned-refresh']);
  await portable.loader.unmountModuleById(portable.def.id, portable.ctx);
});

test('catalog unmount owns one teardown and overlapping releases block remount until it settles', async () => {
  for (const reject of [false, true]) {
    let release;
    let started;
    const startedCleanup = new Promise((resolve) => { started = resolve; });
    const cleanupGate = new Promise((resolve) => { release = resolve; });
    let mounts = 0;
    let adapters = 0;
    let cleanups = 0;
    const { loader, ctx, def } = createHarness({
      id: `catalog-unmount-${reject}`,
      load: async () => ({ initLifecycle() {
        mounts += 1;
        return () => { cleanups += 1; };
      } }),
      async unmount(record) {
        adapters += 1;
        assert.equal(record.baseId, def.id);
        assert.equal(record.status, 'unmounting');
        await record.cleanup();
        started();
        await cleanupGate;
        if (reject) throw new Error('catalog teardown failed');
      },
    });
    const initial = await loader.mountModuleById(def.id, ctx);
    const first = ctx.registry.cleanupAll(() => assert.fail('loader owns lifecycle events'));
    await startedCleanup;
    const repeatedDestroy = ctx.registry.cleanupAll();
    const second = loader.unmountModuleById(def.id, ctx);
    const all = loader.unmountAllModules(ctx);
    let remounted = false;
    const remount = loader.mountModuleById(def.id, ctx).then((record) => {
      remounted = true;
      return record;
    });
    await new Promise((resolve) => setImmediate(resolve));
    const during = { adapters, cleanups, mounts, remounted };
    release();
    const [destroyed, two, count, replacement] = await Promise.all([first, second, all, remount, repeatedDestroy]);
    assert.deepEqual(during, { adapters: 1, cleanups: 1, mounts: 1, remounted: false });
    assert.equal(destroyed[0].status, 'fulfilled');
    assert.deepEqual([two, count], [true, 1]);
    assert.equal(initial.status, 'unmounted');
    assert.equal(initial.cleanup, null);
    assert.equal(initial.unmount, null);
    assert.equal(replacement.status, 'mounted');
    assert.equal(mounts, 2);
    assert.equal(await loader.unmountModuleById(def.id, ctx), true);
    assert.equal(adapters, 2);
    assert.equal(cleanups, 2);
  }
});

test('an unresolved module export produces a failed lifecycle record', async () => {
  const { loader, ctx, def } = createHarness({ id: 'missing-mount-export', load: async () => ({ unrelated() {} }) });
  const errors = [];
  const previousError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    const record = await loader.mountModuleById(def.id, ctx);
    assert.equal(record.status, 'failed');
    assert.equal(record.cleanup, null);
    assert.match(record.error.message, /no resolvable mount export/);
    assert.equal(errors.length, 1);
  } finally {
    console.error = previousError;
  }
});
