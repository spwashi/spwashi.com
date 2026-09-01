/**
 * Spw Design System - Global Dataset typings
 * Enforces compile-time checking for element.dataset.* properties.
 */

declare global {
  interface DOMStringMap {
    /** Page-level semantic surface */
    spwSurface?:
      | 'software'
      | 'systems'
      | 'curriculum'
      | 'about'
      | 'contact'
      | 'services'
      | 'recipes'
      | 'play'
      | 'craft'
      | 'blog'
      | 'settings'
      | 'rpg'
      | 'tools'
      | 'website'
      | 'home'
      | string;

    /** Active runtime/CSS features enabled on the page */
    spwFeatures?: string;

    /** Conceptual route family tags */
    spwRouteFamily?: string;

    /** Attention or narrative context of the section/page */
    spwContext?: string;

    /** active wonder memories or attributes */
    spwWonder?: string;

    /** Family classification for layout/theme lookup */
    spwPageFamily?: string;

    /** Available presentation or view modes */
    spwPageModes?: string;

    /** Role of the page in navigation grids */
    spwPageRole?: string;

    /** Random seed value for page generation */
    spwPageSeed?: string;

    /** Connected page routes for navigation/context logic */
    spwRelatedRoutes?: string;

    /** Identifies a localized functional component layout */
    spwFeature?: string;

    /** Chooses when an opted-in feature becomes a discovery encounter */
    spwFeatureTrigger?: 'view' | 'attention-settle' | 'manual';

    /** Type classification of a sigil or operator */
    spwOperator?:
      | 'frame'
      | 'layer'
      | 'vibration'
      | 'ground'
      | 'integration'
      | 'potential'
      | 'wonder'
      | 'perspective'
      | 'value'
      | 'subject'
      | 'binding'
      | 'meta'
      | 'normalize'
      | 'action'
      | 'concept-edge'
      | 'concept'
      | 'scene'
      | 'mode'
      | 'direction'
      // Legacy type aliases defined in shared.js:
      | 'baseline'
      | 'object'
      | 'ref'
      | 'probe'
      | 'stream'
      | 'merge'
      | 'pragma'
      | 'topic'
      | 'surface';

    /** Form rendering contract for container elements */
    spwForm?: 'brace' | string;

    /** Semantic bracing behavior or direction */
    spwBrace?: string;

    /** Visual canvas accent effect */
    spwAccent?: 'wave' | 'vortex' | 'crystal' | 'lattice' | 'flow' | string;

    /** Color theme mapping for the canvas accent */
    spwAccentPalette?: 'cool' | 'warm' | string;

    /** Interactive guidebook badge state */
    spwGuideBadge?: string;

    /** Current browser interaction context */
    spwInteractionContext?:
      | 'reading'
      | 'browsing'
      | 'inspecting'
      | 'collecting'
      | 'comparing';

    /** Flag indicating item collection status */
    spwCollected?: 'true' | 'false';

    /** Numeric strength of the collection resonance */
    spwCollectionStrength?: string;

    /** Flag indicating grounding status */
    spwGrounded?: 'true' | 'false';

    /** Origin reference key of grounding */
    spwGroundedIn?: string;

    /** Active wonder matching during grounding */
    spwGroundedWonder?: string;

    /** Pin state of active learning sets */
    spwPinned?: 'true' | 'false';

    /** Interactive theme setting (dark/light/system) */
    spwColorMode?: 'dark' | 'light' | 'system' | string;

    /** Intensity or resonance range of visual palette */
    spwPaletteResonance?: string;

    /** Visual color saturation scaling of operator chips */
    spwOperatorSaturation?: string;

    /** Density posture of copy/visual blocks */
    spwSemanticDensity?: 'compact' | 'medium' | 'loose';

    /** Background noise or grain amplitude */
    spwGrainIntensity?: string;

    /** Visibility of design annotations and spec info */
    spwShowSpecPills?: 'true' | 'false';

    /** Current level of JS enhancement enabled */
    spwEnhancementLevel?: string;

    /** Memory key of the active wonder mode */
    spwWonderMemory?: string;

    /** Developmental/educational climate factor */
    spwDevelopmentalClimate?: string;

    /** Active count of UI deviations detected */
    spwDeviationCount?: string;

    /** Serialized representation of active deviations */
    spwDeviations?: string;

    /** Current state name of structural deviation */
    spwDeviationState?: string;

    /** Attention or loading charge state of braces/fields */
    spwCharge?: 'charging' | 'active' | 'sustained' | 'manifest';

    /** Flag indicating if running in local dev server mode */
    spwDevServer?: 'true' | 'false';

    /** Layout orientation style of content streams */
    spwRegionFlow?: 'overlay' | string;

    /** Category variant for promotional cards */
    spwPromotionKind?: string;

    /** Accent color or theme for promotion layout */
    spwPromotionTheme?: string;

    /** Style variation of promotion CTAs */
    spwPromotionCtaStyle?: string;

    /** List of promotion handles */
    spwPromotionHandles?: string;

    /** Active focus key of media hosts */
    mediaFocus?: string;

    /** Collection group name of media elements */
    mediaCollection?: string;

    /* ── G1 axis bundles (2026-07-03 grammar) ─────────────────────────────
       Bundles carry space-separated `axis:value` tokens so CSS can match
       combinatorially with [data-*~="axis:value"] and a reader can learn an
       element's whole story from one attribute. Contracts own the axes:
       interface/cauldron/contract.js, kernel/shared.js, runtime/effect-ledger.js. */

    /** Cauldron vessel state bundle, e.g. "phase:mixing count:4".
        Axes: phase | count | garden | resonance | collected | discoverability. */
    spwCauldronState?: `phase:${'empty' | 'primed' | 'mixing' | 'spell-ready'}${string}` | string;

    /** Operator/operand projection, e.g. "operator:frame operand:address position:prefix".
        Written by kernel composeOpBundle(); never hand-author divergent axes. */
    spwOp?: `operator:${string}` | `operand:${string}` | string;

    /** Effect-ledger residue on <html>, e.g. "count:12 last:spell-cast". */
    spwEffects?: `count:${number}${string}` | string;

    /** Operand text where a surface exposes it standalone (prefer the spwOp bundle). */
    spwOperand?: string;

    /** What a sigil's operational payload does here, determined by its
        container (spatial physics): the cauldron charges, casting discharges,
        checkpoints reference, restore/decompose dereference. */
    spwOpDisposition?: 'charge' | 'discharge' | 'reference' | 'dereference';

    /** Sigil/operand anatomy state written by runtime/sigil-anatomy.js:
        raw HTML ships fused text; "hydrated" means the module wrapped
        .spw-sigil/.spw-operand spans; "authored" means markup already had
        its own anatomy; "bare" means no sigil to split. */
    spwSigilAnatomy?: 'hydrated' | 'authored' | 'bare';

    /** Wonder invitation marker on section-handle chrome */
    spwWonderEntry?: 'section-locomotion' | string;

    /** Expressive approach phase (expressive-registers.spw shorthand) */
    spwApproach?: 'distant' | 'approaching' | 'arrival' | 'return';

    /** Active section id published on html/body by attention-architecture */
    spwPageSectionCurrent?: string;
    spwPageSectionIndex?: string;
    spwPageSectionCount?: string;
    spwPageSectionPhase?: 'settled' | 'traveling';
    spwPageSectionEdge?: 'top' | 'middle' | 'bottom';
    spwPageSectionDirection?: 'forward' | 'back' | 'steady';

    /** Section-handle chrome state */
    spwHandleState?: 'hidden' | 'visible';
    spwHandlePhase?: 'settled' | 'traveling';
    spwHandleAvailability?: string;
    spwSectionHandleLabel?: string;
    spwSectionHandleOp?: string;
    spwSectionHasVocabulary?: 'true';

    /** Wonder-memory root projection (canvas-accents / wonder-memory.js) */
    spwWonderMemoryState?: 'active' | string;

    /** Catalog describes dialect written by module-describes-contract.js */
    spwModuleDescribes?: string;
    spwModuleDescribesGrade?: 'expression' | 'mixed' | 'prose';
    spwModuleDescribesSubject?: string;
    spwModuleDescribesSpell?: string;
  }
}

/** A cauldron ingredient as normalized by interface/cauldron/storage.js. */
export interface SpwIngredientPayload {
  scope?: string;
  page?: string;
  family?: string;
  role?: string;
  topic?: string;
  region?: string;
  liminality?: string;
  affordance?: string;
  consequence?: string;
  cadence?: string;
  cadenceMotion?: string;
  fixity?: string;
  phase?: string;
  biome?: string;
  [key: string]: unknown;
}

export interface SpwIngredient {
  expression: string;
  label: string;
  /** Operator sigil prefix (e.g. "#>", "^"); '' when the expression is bare. */
  operator?: string;
  /** Expression with the operator prefix stripped. */
  operand?: string;
  wonder?: string;
  /** Nearest authored semantic context preserved at capture time. */
  payload?: SpwIngredientPayload;
  capturedAt: number;
  type?: 'numerical' | string;
  value?: number;
  unit?: string;
}

/** One precipitated effect recorded by runtime/effect-ledger.js. */
export interface SpwEffectEntry {
  kind: string;
  label: string;
  summary: string;
  rewardKind: string;
  path: string;
  at: number;
}

/** The transdimensional chip payload: the invariant a chip carries across
    every dimension crossing - surface DOM -> cauldron ingredient -> spell
    step -> effect-ledger entry -> printed artifact. Each dimension may add
    fields; none may lose these. Lifecycle vocabulary: candidate -> primed ->
    collected -> composed -> cast -> (decayed | archived), with reference
    chips additionally fresh -> familiar. */
export interface SpwChipPayload {
  /** The Spw expression, fused form (source of truth for re-parsing). */
  expression: string;
  /** Human reading of the expression. */
  label: string;
  /** Operator grammar at capture time (kernel splitOperatorExpression). */
  op?: SpwOperatorSplit;
  /** Where the chip was when captured (route/surface). */
  origin?: string;
  /** Deep link back to the source dimension, when one exists. */
  deepLink?: string;
  /** Capture moment; lifecycle phases derive from age plus interaction. */
  capturedAt?: number;
  /** Current lifecycle phase (see vocabulary above). */
  lifecycle?: string;
}

/** One typed segment of a contour expression; the brace type is the slot. */
export interface SpwContourSegment {
  slot: 'payload' | 'mode' | 'queue';
  delimiter: '(' | '[' | '{' | string;
  content: string;
}

/** Result of kernel parseContourExpression() — a head plus typed brace
    segments, e.g. topic(primary payload)[mode]{discussion queue}, intended
    to be painted over an article as an annotation contour. */
export interface SpwContour {
  head: string;
  segments: SpwContourSegment[];
  remainder: string;
}

/** Result of kernel splitOperatorExpression(). */
export interface SpwOperatorSplit {
  /** Operator type name (e.g. "frame"); '' when no operator matched. */
  operator: string;
  /** The sigil delimiter as written (e.g. "#>", "$", "."). */
  prefix: string;
  operand: string;
  position: 'prefix' | 'postfix' | 'infix' | 'expression' | '';
}

export {};
