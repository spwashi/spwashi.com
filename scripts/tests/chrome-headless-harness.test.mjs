import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BROWSER_DIAGNOSTIC_LIMIT,
  cellFromProbe,
  evaluateProbe,
  evaluateHardOk,
  formatBrowserDiagnostic,
  inspectHtmlShell,
  isBootPartial,
  isRuntimeSettled,
  isSoftOk,
  probeHttpRoutes,
  withDebugQuery,
} from '../lib/chrome-headless-harness.mjs';

test('evaluateProbe forwards a bounded CDP timeout', async () => {
  const calls = [];
  const session = {
    send: async (...args) => {
      calls.push(args);
      return { result: { value: { readyState: 'complete' } } };
    },
  };

  assert.deepEqual(await evaluateProbe(session, 'document.readyState', 1500), {
    readyState: 'complete',
  });
  assert.deepEqual(calls[0], [
    'Runtime.evaluate',
    {
      expression: 'document.readyState',
      returnByValue: true,
      awaitPromise: true,
    },
    1500,
  ]);
});

test('inspectHtmlShell requires the authored route shell and surface metadata', () => {
  assert.deepEqual(
    inspectHtmlShell(
      '<title>Spwashi</title><body data-spw-surface="home"><main><h1>Hello</h1></main></body>',
      { status: 200 },
    ),
    {
      status: 200,
      hasTitle: true,
      hasH1: true,
      hasMain: true,
      surface: 'home',
      ok: true,
    },
  );
  assert.equal(inspectHtmlShell('<title>Missing shell</title>', { status: 200 }).ok, false);
  assert.equal(
    inspectHtmlShell(
      '<title>Error</title><body data-spw-surface="error"><main><h1>Error</h1></main></body>',
      { status: 500 },
    ).ok,
    false,
  );
});

test('probeHttpRoutes preserves debug queries and reports fetch failures per route', async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(url);
    if (url.includes('/broken/')) throw new Error('offline');
    return {
      status: 200,
      text: async () => '<title>Route</title><body data-spw-surface="topic"><main><h1>Topic</h1></main></body>',
    };
  };

  const results = await probeHttpRoutes({
    base: 'http://127.0.0.1:4173',
    routes: ['/topics/', '/broken/'],
    queryOptions: { debugLayout: true },
    fetchImpl,
  });

  assert.match(requested[0], /\/topics\/\?debug=layout/);
  assert.equal(results[0].ok, true);
  assert.equal(results[0].surface, 'topic');
  assert.equal(results[1].ok, false);
  assert.equal(results[1].error, 'offline');
});

test('withDebugQuery adds layout and agent-qa search params', () => {
  assert.equal(withDebugQuery('/about/'), '/about/');
  assert.equal(
    withDebugQuery('/settings/', { debugLayout: true }),
    '/settings/?debug=layout&log=layout-shift&log-level=debug',
  );
  assert.equal(
    withDebugQuery('/topics/', { debugQa: true }),
    '/topics/?debug=qa%2Clayout%2Cagent&qa=agent&log=layout-shift&log-level=debug',
  );
  // debugQa wins over debugLayout when both are set
  assert.match(withDebugQuery('/', { debugLayout: true, debugQa: true }), /qa=agent/);
});

test('isRuntimeSettled recognizes ready stage, site-ready mark, and boot measure', () => {
  assert.equal(isRuntimeSettled(null), false);
  assert.equal(isRuntimeSettled({}), false);
  assert.equal(isRuntimeSettled({ runtimeStage: 'ready' }), true);
  assert.equal(isRuntimeSettled({ spw: { hasSiteReadyMark: true } }), true);
  assert.equal(isRuntimeSettled({ spw: { bootToReady: 120 } }), true);
  assert.equal(isRuntimeSettled({ pageState: 'booting' }), false);
  assert.equal(isRuntimeSettled({ pageState: 'interactive' }), true);
});

test('isBootPartial accepts immediate-layer progress under cold headless', () => {
  assert.equal(isBootPartial(null), false);
  assert.equal(isBootPartial({ spw: { immediateCore: 40 } }), true);
  assert.equal(isBootPartial({ spw: { hasBootStartMark: true }, measureCount: 2 }), true);
  assert.equal(isBootPartial({ spw: { hasBootStartMark: true }, measureCount: 0 }), false);
  assert.equal(isBootPartial({ runtimeStage: 'ready' }), true);
});

test('isSoftOk requires surface and interactive document', () => {
  assert.equal(isSoftOk(null), false);
  assert.equal(isSoftOk({ surface: 'home', readyState: 'loading' }), false);
  assert.equal(isSoftOk({ surface: 'home', readyState: 'interactive' }), true);
  assert.equal(isSoftOk({ surface: 'home', readyState: 'complete' }), true);
  assert.equal(isSoftOk({ readyState: 'complete' }), false);
});

test('formatBrowserDiagnostic truncates and labels console / exception payloads', () => {
  assert.equal(
    formatBrowserDiagnostic('console', {
      type: 'error',
      args: [{ value: 'boom' }, { description: 'detail' }],
    }),
    '[error] boom detail',
  );
  assert.equal(
    formatBrowserDiagnostic('exception', {
      exceptionDetails: { exception: { description: 'TypeError: x' } },
    }),
    '[exception] TypeError: x',
  );
  const long = 'x'.repeat(500);
  assert.equal(formatBrowserDiagnostic('console', { type: 'warning', args: [{ value: long }] }).length, 400);
  assert.ok(BROWSER_DIAGNOSTIC_LIMIT >= 8);
});

test('cellFromProbe surfaces console diagnostics and evaluateHardOk gates', () => {
  const row = {
    url: 'http://127.0.0.1:4173/',
    wallMs: 900,
    ok: true,
    settled: true,
    partial: true,
    loadOutcome: 'load',
    attempt: 1,
    hasConsoleError: true,
    consoleErrors: ['[error] fail', '[exception] TypeError'],
    consoleWarnings: ['[warning] slow'],
    diagnostics: ['[error] fail', '[exception] TypeError', '[warning] slow'],
    probe: {
      href: 'http://127.0.0.1:4173/',
      surface: 'home',
      runtimeStage: 'ready',
      pageState: 'ready',
      packing: { packLocal: 1, overflowXFrames: 2, bodyOverflowX: false },
      navigation: { domContentLoaded: 100, loadEventEnd: 200, duration: 210, transferSize: 12 },
      spw: { bootToReady: 180, immediateLayer: 90 },
      main: { width: 720, height: 900 },
      viewport: { innerWidth: 1280, innerHeight: 800 },
      resources: { scripts: 4, scriptTransfer: 1000 },
    },
  };

  const cell = cellFromProbe(row, { route: '/' });
  assert.equal(cell.route, '/');
  assert.equal(cell.settled, true);
  assert.equal(cell.consoleErrorCount, 2);
  assert.equal(cell.consoleWarningCount, 1);
  assert.equal(cell.hasConsoleError, true);
  assert.equal(cell.bootToReady, 180);
  assert.equal(cell.overflowXFrames, 2);
  assert.equal(cell.lastMark, null);

  const withMark = cellFromProbe({
    ...row,
    consoleErrors: [],
    hasConsoleError: false,
    probe: {
      ...row.probe,
      packing: { packLocal: 0, overflowXFrames: 0, bodyOverflowX: false },
      spw: {
        ...row.probe.spw,
        lastMark: 'spw:site-ready',
        moduleStages: { settled: 12, observed: 3 },
      },
    },
  }, { route: '/' });
  assert.equal(withMark.lastMark, 'spw:site-ready');
  assert.deepEqual(withMark.moduleStages, { settled: 12, observed: 3 });

  assert.equal(evaluateHardOk(cell, {}), true);
  assert.equal(evaluateHardOk(cell, { failOnConsoleError: true }), false);
  assert.equal(evaluateHardOk(cell, { failOnOverflowX: true }), false);
  assert.equal(evaluateHardOk({ ...cell, settled: false }, { requireSettled: true }), false);
  assert.equal(evaluateHardOk({ ...cell, ok: false }, {}), false);
});
