/**
 * Shared catalog / module-export contracts.
 *
 * Included by every tsconfig (root, scripts, runtime, public-sources, public).
 * Runtime values stay next to their owners (`catalog/constants.js`,
 * `public/ts/module-timing-contract.ts`, `scripts/ts/site-contracts/types.mts`);
 * those arrays `satisfies` these unions so the copies cannot drift.
 *
 * Cost: stamp `cost: { commitment, spend, copy? }` when you know the axes.
 * `costClass` is the single-token projection of that object (spend first,
 * then commitment when spend is none) — not a kind of module.
 */

/** Assign `true` to a value of this type; it becomes `never` when A and B differ. */
export type SpwSameKeys<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

export type SpwModuleLayer = 'core' | 'feature' | 'region' | 'enhancement';

export type SpwModuleMountWhen =
  | 'immediate'
  | 'visible'
  | 'idle'
  | 'interaction'
  | 'invited'
  | 'region'
  | 'settled';

export type SpwModuleRootMode = 'single' | 'each';

export type SpwTimingArcStem =
  | 'boot'
  | 'immediate'
  | 'feature'
  | 'visible'
  | 'enhance'
  | 'idle'
  | 'settled'
  | 'region';

export type SpwIdleChunkId =
  | 'idle-residue'
  | 'idle-collectible'
  | 'idle-chrome'
  | 'idle-lab'
  | 'idle-default';

/** How much survives unmount. */
export type SpwModuleCostCommitment = 'authored' | 'listen' | 'project' | 'residue';

/** How the act hurts if mistimed. `none` is a clean spend, not a missing value. */
export type SpwModuleCostSpend = 'none' | 'early' | 'wide' | 'fight' | 'paint';

/** Only meaningful at commitment=residue. */
export type SpwModuleCostCopy = 'follow' | 'keep' | 'pin';

/**
 * Single-token projection of `{ commitment, spend, copy? }`.
 * Spend tokens win; commitment tokens name the none-spend remainder so
 * listen/residue/project are not collapsed into one catch-all.
 */
export type SpwCostClass =
  | 'premature_commitment'
  | 'working_memory_pressure'
  | 'interference'
  | 'paint_composite'
  | 'authored_prior_safe'
  | 'listen'
  | 'residue'
  | 'demand_coupled';

export type SpwModuleCost = {
  commitment: SpwModuleCostCommitment;
  spend: SpwModuleCostSpend;
  copy?: SpwModuleCostCopy | null;
};

/**
 * Where a module's effects land. Closed: cost inference and host tiers read
 * the tokens exactly (catalog/constants.js EFFECT_SCOPE satisfies this).
 */
export type SpwModuleEffectScope =
  | 'local-dom'
  | 'element-state'
  | 'css-vars'
  | 'geometry'
  | 'listeners'
  | 'observers'
  | 'timers'
  | 'root-state'
  | 'window'
  | 'navigation'
  | 'chrome'
  | 'floating-chrome'
  | 'storage'
  | 'bus'
  | 'network'
  | 'service-worker'
  | 'clipboard';

/** What a page must provide for an effect scope token (EFFECT_SCOPE_TIER). */
export type SpwModuleHostTier = 'host' | 'document' | 'shell' | 'memory' | 'channel' | 'platform';

/** Rail dimensions stamped as data-spw-module-evaluates (MODULE_DIMENSION). */
export type SpwModuleDimension =
  | 'routing'
  | 'semantics'
  | 'semantic-density'
  | 'visual'
  | 'visual-model'
  | 'spacing-semantics'
  | 'state'
  | 'interaction'
  | 'surface'
  | 'lifecycle'
  | 'qa-observation';

export type SpwModuleUpdateScope = 'html' | 'root' | 'body' | 'document' | 'frame';

export type SpwModuleUpdateRole =
  | 'structural'
  | 'flourish'
  | 'inspect'
  | 'residue'
  | 'measure'
  | 'diagnostic'
  | 'temporal';

/**
 * One `updates` entry: `[scope:]role:name`. The role is required so every
 * module's offer (the strongest role it writes) is computable.
 */
export type SpwModuleUpdate =
  | `${SpwModuleUpdateRole}:${string}`
  | `${SpwModuleUpdateScope}:${SpwModuleUpdateRole}:${string}`;

/** `<stem>-<noun>`; the stem is checked, the noun names the arc. */
export type SpwModuleTimingArc = `${SpwTimingArcStem}-${string}`;

/** Field kinds from catalog/constants.js CATALOG_DEF_FIELDS. */
export type SpwCatalogFieldKind = 'gate' | 'schedule' | 'effect' | 'capability' | 'voice' | 'lifecycle';

/** First-paint geometry permission. `express` is authored ornament, not layout. */
export type SpwModuleVisualEffect = 'authored' | 'annotate' | 'inspect' | 'layout' | 'express' | 'behavior';

export type SpwModuleElectrostatics = {
  role?: string;
  discharge?: string;
  dielectric?: boolean;
  field?: string;
};

/** Teardown may finish asynchronously; remount waits for it to settle. */
export type SpwModuleCleanup = () => void | Promise<void>;

export type SpwModuleRefresh = (ctx?: unknown, root?: unknown) => unknown;

/**
 * Loader-mounted modules return this handle. `destroy` is the supported legacy
 * alias for cleanup; when both exist, cleanup wins. Do not also ctx.addCleanup
 * the same function — site destruction would run it twice.
 */
export type SpwModuleMountResult =
  | void
  | SpwModuleCleanup
  | { cleanup?: SpwModuleCleanup; destroy?: SpwModuleCleanup; refresh?: SpwModuleRefresh };

/** The live instance passed to an authoritative catalog unmount adapter. */
export type SpwModuleUnmountRecord = {
  id: string;
  baseId: string;
  status: 'unmounting';
  root: unknown;
  cleanup: SpwModuleCleanup | null;
  refresh: SpwModuleRefresh | null;
};

/**
 * One catalog definition. Authors keep this flat; normalize.js groups it for
 * inspectors. `load` is required; `mount` is optional when the loaded module
 * exposes SPW_MODULE_EXPORT / spwModule / init*.
 */
export type SpwModuleDef = {
  id: string;
  layer: SpwModuleLayer;
  when: SpwModuleMountWhen;
  load: () => Promise<unknown>;
  mount?: (mod?: unknown, ctx?: unknown, root?: unknown) => SpwModuleMountResult | Promise<SpwModuleMountResult>;
  /** Owns teardown when present; may delegate to record.cleanup exactly once. */
  unmount?: (record: SpwModuleUnmountRecord) => void | Promise<void>;
  cost?: SpwModuleCost;
  costClass?: SpwCostClass;
  features?: string | readonly string[];
  route?: string | readonly string[];
  selector?: string;
  rootMode?: SpwModuleRootMode;
  debugOnly?: boolean;
  /** voice: subject[mode]{direction}<capsule> clauses, optional trailing gloss. */
  describes?: string;
  /** effect: every entry carries a role. */
  updates?: readonly SpwModuleUpdate[];
  /** effect: rail dimensions. */
  evaluates?: readonly SpwModuleDimension[];
  timingArc?: SpwModuleTimingArc;
  timingChunk?: SpwIdleChunkId;
  /** effect: where writes and holds land; tiers say what a host must provide. */
  effectScope?: readonly SpwModuleEffectScope[];
  visual?: SpwModuleVisualEffect;
  subfeatures?: readonly string[];
  triggers?: readonly string[];
  affordances?: readonly string[];
  pageFamily?: string | readonly string[];
  pageRole?: string | readonly string[];
  pageModes?: string | readonly string[];
  pageContext?: string | readonly string[];
  pageSurface?: string | readonly string[];
  electrostatics?: SpwModuleElectrostatics;
  guild?: string;
  familiarity?: string;
};

export type SpwModuleExportRequiredField = 'mount';
export type SpwModuleExportPortableField = 'id' | 'refresh' | 'contract' | 'updates' | 'describes';
export type SpwModuleExportMirrorField = 'evaluates' | 'timingArc' | 'timingChunk' | 'effectScope';
export type SpwModuleExportOptionalField =
  | SpwModuleExportPortableField
  | SpwModuleExportMirrorField
  | 'guild';
export type SpwModuleExportField = SpwModuleExportRequiredField | SpwModuleExportOptionalField;

export type SpwModuleCleanupOwnership = 'handle' | 'none';

/**
 * Portable export shape from module-export-contract.js.
 * Catalog owns gates, schedule, effects, and cost. This owns mount/refresh.
 * Extra keys are inspectable extras — they must not reschedule the catalog.
 */
export type SpwModuleExport = {
  mount: (
    ctx?: unknown,
    root?: unknown,
  ) => SpwModuleMountResult | Promise<SpwModuleMountResult>;
  id?: string;
  refresh?: SpwModuleRefresh;
  contract?: unknown;
  updates?: string | readonly string[];
  describes?: string;
  guild?: string;
  evaluates?: readonly SpwModuleDimension[];
  timingArc?: string;
  timingChunk?: string;
  effectScope?: readonly SpwModuleEffectScope[];
};

export type SpwModuleExportOrchestration = {
  authority: 'catalog' | 'export';
  status: 'aligned' | 'drift' | 'portable';
  drift: string[];
  catalogMirrors: readonly SpwModuleExportMirrorField[];
  extras: string[];
  cost: SpwModuleCost | null;
  visual: SpwModuleVisualEffect | string | null;
  lifecycle: {
    mount: 'catalog-adapter' | 'portable-export' | string;
    cleanup: 'catalog-unmount' | 'mount-result' | string;
  } | null;
  /** Stamped after mount: whether the instance returned a teardown handle. */
  cleanup: SpwModuleCleanupOwnership | null;
  refreshReturned: boolean;
};
