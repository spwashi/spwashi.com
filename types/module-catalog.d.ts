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

/** First-paint geometry permission. `express` is authored ornament, not layout. */
export type SpwModuleVisualEffect = 'authored' | 'annotate' | 'inspect' | 'layout' | 'express';

export type SpwModuleElectrostatics = {
  role?: string;
  discharge?: string;
  dielectric?: boolean;
  field?: string;
};

export type SpwModuleMountResult =
  | void
  | (() => void)
  | { cleanup?: () => void; refresh?: (ctx?: unknown) => unknown };

/**
 * One catalog definition. Authors keep this flat; normalize.js groups it for
 * inspectors. `load` is required; `mount` is optional when the loaded module
 * exposes SPW_MODULE_EXPORT / spwModule / init*.
 */
export type SpwModuleDef = {
  id: string;
  layer: SpwModuleLayer | string;
  when: SpwModuleMountWhen | string;
  load: () => Promise<unknown>;
  mount?: (mod?: unknown, ctx?: unknown, root?: unknown) => SpwModuleMountResult | Promise<SpwModuleMountResult>;
  unmount?: (record?: unknown) => unknown;
  cost?: SpwModuleCost;
  costClass?: SpwCostClass | string;
  features?: string | readonly string[];
  route?: string | readonly string[];
  selector?: string;
  rootMode?: SpwModuleRootMode | string;
  debugOnly?: boolean;
  describes?: string;
  updates?: string | readonly string[];
  evaluates?: string | readonly string[];
  timingArc?: string;
  timingChunk?: string;
  effectScope?: string | readonly string[];
  visual?: SpwModuleVisualEffect | string;
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

/**
 * Portable export shape from module-export-contract.js.
 * Catalog owns gates/schedule; this owns mount/refresh portability.
 */
export type SpwModuleExport = {
  mount: (
    mod?: unknown,
    ctx?: unknown,
    root?: unknown,
  ) => SpwModuleMountResult | Promise<SpwModuleMountResult>;
  id?: string;
  refresh?: (ctx?: unknown) => unknown;
  contract?: unknown;
  updates?: string | readonly string[];
  describes?: string;
  guild?: string;
  evaluates?: string | readonly string[];
  timingArc?: string;
  timingChunk?: string;
  effectScope?: string | readonly string[];
};
