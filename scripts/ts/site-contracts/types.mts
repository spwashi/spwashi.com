import type {
  SpwCostClass,
  SpwIdleChunkId,
  SpwModuleCostCommitment,
  SpwModuleCostCopy,
  SpwModuleCostSpend,
  SpwModuleDef,
  SpwModuleExport,
  SpwModuleExportMirrorField,
  SpwModuleExportOrchestration,
  SpwModuleExportPortableField,
  SpwModuleExportRequiredField,
  SpwModuleLayer,
  SpwModuleMountWhen,
  SpwModuleRootMode,
  SpwModuleVisualEffect,
  SpwSameKeys,
  SpwTimingArcStem,
} from '../../../types/module-catalog';

export type {
  SpwCostClass,
  SpwIdleChunkId,
  SpwModuleCostCommitment,
  SpwModuleCostCopy,
  SpwModuleCostSpend,
  SpwModuleDef,
  SpwModuleExport,
  SpwModuleExportMirrorField,
  SpwModuleExportOrchestration,
  SpwModuleExportPortableField,
  SpwModuleExportRequiredField,
  SpwModuleLayer,
  SpwModuleMountWhen,
  SpwModuleRootMode,
  SpwModuleVisualEffect,
  SpwSameKeys,
  SpwTimingArcStem,
};

export const REQUIRED_BODY_DATA_KEYS = Object.freeze([
  'spwSurface',
  'spwFeatures',
  'spwRouteFamily',
  'spwContext',
  'spwWonder',
  'spwPageFamily',
  'spwPageModes',
  'spwPageRole',
] as const);

export const EXPECTED_STYLESHEET_PREFIX = '/public/css/style.css';
export const EXPECTED_SITE_SCRIPT_PREFIX = '/public/js/site.js';

/** Parsed catalog snapshot for the route-runtime manifest — a subset of SpwModuleDef. */
export type RuntimeDefinition = {
  id: string;
  importPath: string | null;
  layer: SpwModuleLayer | string;
  rootMode: SpwModuleRootMode | string | null;
  route: string[];
  selector: string | null;
  when: SpwModuleMountWhen | string;
};

export type SvgHost = {
  class: string | null;
  companion: string | null;
  hasDesc: boolean;
  hasFigureContract: boolean;
  hasSurfaceClass: boolean;
  hasTitle: boolean;
  hostId: string | null;
  kind: string | null;
  motion: string | null;
  role: string | null;
  scale: string | null;
  surfaceVariant: string | null;
  viewBox: string | null;
};

export type SvgHostWithRoute = SvgHost & {
  route: string;
  surface: string | null;
};

export type RouteSpecSummary = {
  gridCount: number;
  kickerCount: number;
  pillCount: number;
  route: string;
  stripCount: number;
  surface: string | null;
  title: string;
};

export type SvgRouteSummary = {
  featureEnabled: boolean;
  figureCount: number;
  hostCount: number;
  inlineCount: number;
  route: string;
  surface: string | null;
  surfaceCount: number;
  title: string;
};

export type ManifestRoute = {
  assets: {
    icons: string[];
    manifest: string | null;
    moduleScripts: string[];
    stylesheets: string[];
  };
  context: string | null;
  errors: string[];
  features: string[];
  file: string;
  layout: string | null;
  pageFamily: string | null;
  pageModes: string[];
  pageRole: string | null;
  pageSeed: string | null;
  relatedRoutes: string[];
  route: string;
  routeFamily: string | null;
  runtime?: {
    coreModules: string[];
    enhancementModules: string[];
    featureModules: RuntimeDefinition[];
    regionModules: string[];
  };
  spec: {
    featureEnabled: boolean;
    gridCount: number;
    kickerCount: number;
    pillCount: number;
    stripCount: number;
  };
  surface: string | null;
  title: string;
  warnings: string[];
  wonder: string[];
  svg: {
    featureEnabled: boolean;
    figureCount: number;
    hosts: SvgHost[];
    inlineCount: number;
    surfaceCount: number;
  };
};

export type RouteRuntimeManifest = {
  generatedAt: string;
  maps: {
    specRoutes: RouteSpecSummary[];
    svgAssets: string[];
    svgHosts: SvgHostWithRoute[];
    svgRoutes: SvgRouteSummary[];
  };
  repoRoot: string;
  routeCount: number;
  routes: ManifestRoute[];
  runtimeDefinitions: {
    coreModules: RuntimeDefinition[];
    enhancementModules: RuntimeDefinition[];
    featureModules: RuntimeDefinition[];
    regionModules: RuntimeDefinition[];
  };
  surfaces: Record<string, number>;
};

/** Mount timings accepted by module-catalog / runtime-contracts. */
export const VALID_MOUNT_WHEN = Object.freeze([
  'immediate',
  'visible',
  'idle',
  'interaction',
  'invited',
  'region',
  'settled',
] as const satisfies readonly SpwModuleMountWhen[]);

const _mountWhenEqual: SpwSameKeys<SpwModuleMountWhen, (typeof VALID_MOUNT_WHEN)[number]> = true;
void _mountWhenEqual;

export type MountWhen = SpwModuleMountWhen;

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
] as const satisfies readonly SpwTimingArcStem[]);

const _timingArcEqual: SpwSameKeys<SpwTimingArcStem, (typeof TIMING_ARC_STEMS)[number]> = true;
void _timingArcEqual;

export type TimingArcStem = SpwTimingArcStem;

export const STANDARD_IDLE_CHUNKS = Object.freeze([
  'idle-residue',
  'idle-collectible',
  'idle-chrome',
  'idle-lab',
  'idle-default',
] as const satisfies readonly SpwIdleChunkId[]);

const _idleChunksEqual: SpwSameKeys<SpwIdleChunkId, (typeof STANDARD_IDLE_CHUNKS)[number]> = true;
void _idleChunksEqual;

/** Catalog layers accepted by module-catalog / runtime-contracts. */
export const VALID_MODULE_LAYERS = Object.freeze([
  'core',
  'feature',
  'region',
  'enhancement',
] as const satisfies readonly SpwModuleLayer[]);

const _layersEqual: SpwSameKeys<SpwModuleLayer, (typeof VALID_MODULE_LAYERS)[number]> = true;
void _layersEqual;

export type ModuleLayer = SpwModuleLayer;

export const VALID_COST_COMMITMENTS = Object.freeze([
  'authored',
  'listen',
  'project',
  'residue',
] as const satisfies readonly SpwModuleCostCommitment[]);

const _commitmentsEqual: SpwSameKeys<SpwModuleCostCommitment, (typeof VALID_COST_COMMITMENTS)[number]> = true;
void _commitmentsEqual;

export const VALID_COST_SPENDS = Object.freeze([
  'none',
  'early',
  'wide',
  'fight',
  'paint',
] as const satisfies readonly SpwModuleCostSpend[]);

const _spendsEqual: SpwSameKeys<SpwModuleCostSpend, (typeof VALID_COST_SPENDS)[number]> = true;
void _spendsEqual;

export const VALID_COST_COPIES = Object.freeze([
  'follow',
  'keep',
  'pin',
] as const satisfies readonly SpwModuleCostCopy[]);

const _copiesEqual: SpwSameKeys<SpwModuleCostCopy, (typeof VALID_COST_COPIES)[number]> = true;
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
] as const satisfies readonly SpwCostClass[]);

const _costClassesEqual: SpwSameKeys<SpwCostClass, (typeof VALID_COST_CLASSES)[number]> = true;
void _costClassesEqual;

export const VALID_VISUAL_EFFECTS = Object.freeze([
  'authored',
  'annotate',
  'inspect',
  'layout',
  'express',
  'behavior',
] as const satisfies readonly SpwModuleVisualEffect[]);

const _visualEqual: SpwSameKeys<SpwModuleVisualEffect, (typeof VALID_VISUAL_EFFECTS)[number]> = true;
void _visualEqual;

export const SPW_MODULE_EXPORT_REQUIRED_FIELDS = Object.freeze([
  'mount',
] as const satisfies readonly SpwModuleExportRequiredField[]);

const _exportRequiredEqual: SpwSameKeys<
  SpwModuleExportRequiredField,
  (typeof SPW_MODULE_EXPORT_REQUIRED_FIELDS)[number]
> = true;
void _exportRequiredEqual;

export const SPW_MODULE_EXPORT_PORTABLE_FIELDS = Object.freeze([
  'id',
  'refresh',
  'contract',
  'updates',
  'describes',
] as const satisfies readonly SpwModuleExportPortableField[]);

const _exportPortableEqual: SpwSameKeys<
  SpwModuleExportPortableField,
  (typeof SPW_MODULE_EXPORT_PORTABLE_FIELDS)[number]
> = true;
void _exportPortableEqual;

export const SPW_MODULE_EXPORT_MIRROR_FIELDS = Object.freeze([
  'evaluates',
  'timingArc',
  'timingChunk',
  'effectScope',
] as const satisfies readonly SpwModuleExportMirrorField[]);

const _exportMirrorsEqual: SpwSameKeys<
  SpwModuleExportMirrorField,
  (typeof SPW_MODULE_EXPORT_MIRROR_FIELDS)[number]
> = true;
void _exportMirrorsEqual;

/**
 * Hygiene posture for new catalog entries (agentic-development audit).
 * Not enforced as errors — used as documentation + recommendation targets.
 */
export type CatalogHygieneHints = {
  /** Prefer VISIBLE/IDLE/INTERACTION unless CORE identity/settings/shell. */
  preferNonImmediate: boolean;
  /**
   * Pair features: with CSS BEHAVIOR_SCOPES when optional CSS is involved,
   * or with PRESENCE_FEATURE_KEYS (operators, navigator, …) for JS-only gates.
   */
  preferFeaturesGate: boolean;
  /** Stamp timingArc on IMMEDIATE enhancement with broad effectScope. */
  preferTimingArcWhenImmediate: boolean;
};
