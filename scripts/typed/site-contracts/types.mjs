export const REQUIRED_BODY_DATA_KEYS = Object.freeze([
    'spwSurface',
    'spwFeatures',
    'spwRouteFamily',
    'spwContext',
    'spwWonder',
    'spwPageFamily',
    'spwPageModes',
    'spwPageRole',
]);
export const EXPECTED_STYLESHEET_PREFIX = '/public/css/style.css';
export const EXPECTED_SITE_SCRIPT_PREFIX = '/public/js/site.js';
/** Mount timings accepted by module-catalog / runtime-contracts. */
export const VALID_MOUNT_WHEN = Object.freeze([
    'immediate',
    'visible',
    'idle',
    'interaction',
    'invited',
    'region',
    'settled',
]);
/** timingArc stems — keep aligned with public/ts/module-timing-contract.ts */
export const TIMING_ARC_STEMS = Object.freeze([
    'boot',
    'immediate',
    'feature',
    'visible',
    'enhance',
    'idle',
    'settled',
    'region',
]);
export const STANDARD_IDLE_CHUNKS = Object.freeze([
    'idle-residue',
    'idle-collectible',
    'idle-chrome',
    'idle-lab',
    'idle-default',
]);
/** Catalog layers accepted by module-catalog / runtime-contracts. */
export const VALID_MODULE_LAYERS = Object.freeze([
    'core',
    'feature',
    'region',
    'enhancement',
]);
