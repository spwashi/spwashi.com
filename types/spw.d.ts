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
  }
}

export {};
