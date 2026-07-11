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
    'region',
    'settled',
]);
/** Catalog layers accepted by module-catalog / runtime-contracts. */
export const VALID_MODULE_LAYERS = Object.freeze([
    'core',
    'feature',
    'region',
    'enhancement',
]);
