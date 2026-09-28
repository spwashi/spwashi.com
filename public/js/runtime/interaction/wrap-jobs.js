/**
 * wrap-jobs.js
 * ---------------------------------------------------------------------------
 * Teaching wrap rail: sit / travel / enter / inspect.
 * Host: nav[data-spw-feature="wrap-jobs"] that contains a mode job.
 * Other chip rows stay .frame-operators. Do not mark them wrap-jobs —
 * key-events would rewrite direction/wonder hrefs on those rails.
 *
 * Keyboard physics still lives in spw-key-events.js. This module names
 * the HTML host so the catalog selector is not `html`.
 */

import { syncWrapJobLabels } from './spw-key-events.js';

const TEACHING_WRAP_SELECTOR = '[data-spw-feature="wrap-jobs"]';

export function initWrapJobs(root = document) {
  const scope = root instanceof HTMLElement || root?.nodeType === 9 ? root : document;
  const hosts = scope.matches?.(TEACHING_WRAP_SELECTOR)
    ? [scope]
    : [...(scope.querySelectorAll?.(TEACHING_WRAP_SELECTOR) || [])];
  if (!hosts.length) return () => {};
  syncWrapJobLabels();
  return () => {};
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'wrap-jobs',
  describes: 'wrap[rail]{sit.travel.enter.inspect}',
  updates: Object.freeze([
    'structural:data-spw-semantic-expression',
  ]),
  evaluates: 'wrap-jobs sit-travel-enter teaching-rail',
  timingArc: 'visible-keyboard',
  effectScope: 'local-dom listeners',
  mount: (_ctx, root) => initWrapJobs(root),
});

export const spwModule = SPW_MODULE_EXPORT;
