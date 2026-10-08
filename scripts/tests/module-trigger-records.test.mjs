import assert from 'node:assert/strict';
import test from 'node:test';

import { createModuleExport } from '../../public/js/runtime/catalog/export-contract.js';
import { createModuleLoader } from '../../public/js/runtime/orchestration/loader.js';
import { createRegistry } from '../../public/js/kernel/module-registry.js';
import { readRuntimePolicy } from '../../public/js/runtime/orchestration/policy.js';

// A root two modules share: the dataset and listeners a scheduler touches.
class SharedRoot extends globalThis.HTMLElement {
  constructor() {
    super();
    this.tagName = 'FIGURE';
    this.dataset = {};
    this.listeners = new Map();
  }

  matches() { return true; }
  getAttribute() { return null; }
  addEventListener(type, fn) { this.listeners.set(type, fn); }
  removeEventListener(type) { this.listeners.delete(type); }
}

function createHarness(defs, root) {
  const loader = createModuleLoader({
    moduleDefs: defs,
    html: document.documentElement,
    body: document.body,
    matchesRoute: () => true,
    hasSelector: () => true,
    getRoots: () => [root],
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
  const cleanups = [];
  const ctx = {
    registry: createRegistry(),
    runtimePolicy: readRuntimePolicy(),
    moduleAudit: [],
    bus: { emit() {} },
    html: document.documentElement,
    body: document.body,
    now: () => performance.now(),
    addObserver(observer) { cleanups.push(() => observer.disconnect?.()); },
    addCleanup(fn) { cleanups.push(fn); },
  };
  return { loader, ctx, cleanup: () => cleanups.forEach((fn) => fn()) };
}

function withIntersectionObserver(run) {
  const previous = globalThis.IntersectionObserver;
  const observers = [];
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(el) { this.el = el; }
    unobserve() {}
    disconnect() {}
  };
  return Promise.resolve(run(observers)).finally(() => { globalThis.IntersectionObserver = previous; });
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test('a shared root shows the invitation, whichever module annotated it last', () => withIntersectionObserver(async (observers) => {
  const root = new SharedRoot();
  const mounted = [];
  const invited = {
    id: 'offer-module', layer: 'feature', when: 'invited', rootMode: 'each', selector: 'figure',
    load: async () => createModuleExport({ mount() { mounted.push('offer-module'); } }),
  };
  const visible = {
    id: 'scan-module', layer: 'enhancement', when: 'visible', rootMode: 'single', selector: 'figure',
    load: async () => createModuleExport({ mount() { mounted.push('scan-module'); } }),
  };
  const { loader, ctx, cleanup } = createHarness([invited, visible], root);
  try {
    await loader.mountInvitedFeatures([invited], ctx);
    await loader.mountVisibleFeatures([visible], ctx);
    assert.equal(root.dataset.spwModuleTriggerStatus, 'waiting', 'a later queue does not hide the invitation');
    assert.equal(root.dataset.spwModuleTriggerWhen, 'invited', 'the timing shown is the invitation\'s own');
    assert.equal(root.dataset.spwModuleTrigger, 'offer-module', 'and so is the module it names');

    observers[0].callback([{ target: root, isIntersecting: true }]);
    await flush();
    assert.equal(root.dataset.spwModuleTriggerStatus, 'waiting', 'a visible trigger on the same root does not consume it');
    assert.equal(root.dataset.spwModuleTriggerWhen, 'invited');

    root.listeners.get('pointerenter')({ type: 'pointerenter' });
    assert.equal(root.dataset.spwModuleTriggerStatus, 'loading', 'accepting starts the module arriving at once');
    assert.equal(root.dataset.spwModuleTriggerWhen, 'invited', 'the discharge belongs to the reader\'s acceptance');
    await flush();
    await flush();
    assert.ok(mounted.includes('offer-module'));
    assert.equal(root.dataset.spwModuleTriggerStatus, 'mounted', 'once arrived, the root shows the latest record');
  } finally {
    cleanup();
  }
}));

test('a visible trigger alone shows its own timing, so it draws no discharge', () => withIntersectionObserver(async (observers) => {
  const root = new SharedRoot();
  const visible = {
    id: 'scan-module', layer: 'enhancement', when: 'visible', rootMode: 'single', selector: 'figure',
    load: async () => createModuleExport({ mount() {} }),
  };
  const { loader, ctx, cleanup } = createHarness([visible], root);
  try {
    await loader.mountVisibleFeatures([visible], ctx);
    assert.equal(root.dataset.spwModuleTriggerStatus, 'queued');
    observers[0].callback([{ target: root, isIntersecting: true }]);
    assert.equal(root.dataset.spwModuleTriggerStatus, 'triggered');
    assert.equal(root.dataset.spwModuleTriggerWhen, 'visible');
  } finally {
    cleanup();
  }
}));
