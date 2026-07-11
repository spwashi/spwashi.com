/**
 * Shared catalog constants (layers + mount when).
 * Definition families live in module-catalog-*.js for reviewability.
 */

export const MODULE_LAYERS = Object.freeze({
  CORE: 'core',
  FEATURE: 'feature',
  REGION: 'region',
  ENHANCEMENT: 'enhancement',
});

export const MOUNT_WHEN = Object.freeze({
  IMMEDIATE: 'immediate',
  VISIBLE: 'visible',
  IDLE: 'idle',
  INTERACTION: 'interaction',
  REGION: 'region',
  SETTLED: 'settled',
});

/** Live pretext hosts that should mount measurement/physics (not static specimens). */
export const PRETEXT_LIVE_SELECTOR =
  '[data-spw-flow="pretext"][data-spw-pretext-live="true"]:not([data-spw-pretext-static])';

/**
 * Region mount targets — keep in sync with REGION_SELECTORS in kernel/dom-contracts.js.
 * Duplicated here so catalog families stay Node-importable without the bus/DOM chain.
 */
export const REGION_SELECTOR = [
  '.site-frame',
  '[data-spw-kind="frame"]',
  '[data-spw-kind="panel"]',
  '[data-spw-kind="card"]',
  '[data-spw-kind="surface"]',
  '[data-spw-kind="hook"]',
  '[data-spw-kind="lens"]',
  '[data-spw-kind="metric"]',
  '[data-spw-component-kind="frame"]',
  '[data-spw-component-kind="panel"]',
  '[data-spw-component-kind="card"]',
  '[data-spw-component-kind="surface"]',
  '[data-spw-component-kind="hook"]',
  '[data-spw-component-kind="lens"]',
  '[data-spw-component-kind="metric"]',
  '[data-spw-role]',
  '[data-spw-slot]',
].join(', ');

/** Pure predicate so catalog families stay Node-importable without runtime-helpers DOM. */
export function isFn(value) {
  return typeof value === 'function';
}
