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
const _mountWhenEqual = true;
void _mountWhenEqual;
/** timingArc stems — same union as public/ts/module-timing-contract.ts via types/module-catalog. */
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
const _timingArcEqual = true;
void _timingArcEqual;
export const STANDARD_IDLE_CHUNKS = Object.freeze([
    'idle-residue',
    'idle-collectible',
    'idle-chrome',
    'idle-lab',
    'idle-default',
]);
const _idleChunksEqual = true;
void _idleChunksEqual;
/** Catalog layers accepted by module-catalog / runtime-contracts. */
export const VALID_MODULE_LAYERS = Object.freeze([
    'core',
    'feature',
    'region',
    'enhancement',
]);
const _layersEqual = true;
void _layersEqual;
export const VALID_COST_COMMITMENTS = Object.freeze([
    'authored',
    'listen',
    'project',
    'residue',
]);
const _commitmentsEqual = true;
void _commitmentsEqual;
export const VALID_COST_SPENDS = Object.freeze([
    'none',
    'early',
    'wide',
    'fight',
    'paint',
]);
const _spendsEqual = true;
void _spendsEqual;
export const VALID_COST_COPIES = Object.freeze([
    'follow',
    'keep',
    'pin',
]);
const _copiesEqual = true;
void _copiesEqual;
/**
 * Single-token cost projection. Spend tokens first; listen/residue/demand_coupled
 * name the none-spend remainder. Keep aligned with catalog/constants.js COST_CLASS.
 */
export const VALID_COST_CLASSES = Object.freeze([
    'premature_commitment',
    'working_memory_pressure',
    'interference',
    'paint_composite',
    'authored_prior_safe',
    'listen',
    'residue',
    'demand_coupled',
]);
const _costClassesEqual = true;
void _costClassesEqual;
export const VALID_VISUAL_EFFECTS = Object.freeze([
    'authored',
    'annotate',
    'inspect',
    'layout',
    'express',
    'behavior',
]);
const _visualEqual = true;
void _visualEqual;
export const SPW_MODULE_EXPORT_REQUIRED_FIELDS = Object.freeze([
    'mount',
]);
const _exportRequiredEqual = true;
void _exportRequiredEqual;
export const SPW_MODULE_EXPORT_PORTABLE_FIELDS = Object.freeze([
    'id',
    'refresh',
    'contract',
    'updates',
    'describes',
]);
const _exportPortableEqual = true;
void _exportPortableEqual;
export const SPW_MODULE_EXPORT_MIRROR_FIELDS = Object.freeze([
    'evaluates',
    'timingArc',
    'timingChunk',
    'effectScope',
]);
const _exportMirrorsEqual = true;
void _exportMirrorsEqual;
