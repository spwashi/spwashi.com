/**
 * Host mounting — one portable module on a page that does not run site.js.
 *
 * texture.website, lore.land, and any other origin can import a module file
 * from https://spwashi.com/public/js/… and mount it here with the same calling
 * convention the loader uses: the module's portable export receives
 * (ctx, root) and may return a cleanup function or { cleanup, refresh }.
 *
 * Nothing here schedules, gates, or reads the catalog. The host page decides
 * when and where; describeModuleHost() (catalog/normalize.js) and
 * `npm run audit:portable` say what the module needs from that page first.
 * Specifiers inside these files are relative or /public/js/ rooted, so they
 * resolve against spwashi.com from any origin that can fetch it (CORS).
 */

import { bus as sharedBus } from '../../kernel/bus.js';
import { mountModuleDefinition, normalizeMountHandle } from './lifecycle.js';

/**
 * The context a portable module reads. A host may pass its own bus; the
 * default is this site's bus module, loaded fresh in the host's page, so it
 * never shares events with spwashi.com.
 */
export function createHostContext({
  route = '',
  bus = sharedBus,
  features = [],
  policy = {},
} = {}) {
  const cleanups = [];
  const timers = new Set();
  const doc = globalThis.document;
  const ctx = {
    version: 'spw-host-v0.1',
    host: true,
    bus,
    html: doc?.documentElement || null,
    body: doc?.body || null,
    main: doc?.querySelector?.('main') || null,
    route,
    features: [...features],
    regions: [],
    runtimePolicy: { timing: 'default', audit: false, visuals: false, only: new Set(), skip: new Set(), ...policy },
    now: () => globalThis.performance?.now?.() ?? Date.now(),
    addCleanup(fn) {
      if (typeof fn === 'function') cleanups.push(fn);
      return fn;
    },
    addTimer(id) {
      timers.add(id);
      return id;
    },
    async cleanup() {
      for (const id of timers) {
        globalThis.clearTimeout?.(id);
        globalThis.clearInterval?.(id);
      }
      timers.clear();
      while (cleanups.length) {
        try {
          await cleanups.pop()();
        } catch (error) {
          globalThis.console?.warn?.('[spw-host] cleanup failed', error);
        }
      }
    },
  };
  return ctx;
}

/**
 * Mount a loaded module namespace on `root` (default: document). Returns a
 * handle whose cleanup tears down the mount and the context it created.
 */
export async function mountPortableModule(namespace, root = globalThis.document, { ctx, id = 'host-module' } = {}) {
  const context = ctx || createHostContext();
  const handle = normalizeMountHandle(await mountModuleDefinition({ id }, namespace, context, root));
  return {
    ctx: context,
    refresh: handle.refresh ? (next = context) => handle.refresh(next, root) : null,
    async cleanup() {
      await handle.cleanup?.();
      if (!ctx) await context.cleanup();
    },
  };
}

export const SPW_HOST_CONTRACT = Object.freeze({
  entry: '/public/js/runtime/orchestration/host.js',
  mount: 'mountPortableModule(namespace, root?, { ctx?, id? }) → { cleanup, refresh, ctx }',
  context: 'createHostContext({ route?, bus?, features?, policy? }) — bus, html, body, main, route, regions, runtimePolicy, addCleanup, addTimer',
  portability: 'Read describeModuleHost(def).portability before mounting: portable needs only its markup and stylesheet; host-policy lists needs per tier; site-only needs this site.',
});
