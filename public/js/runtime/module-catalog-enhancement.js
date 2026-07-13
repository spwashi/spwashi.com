/**
 * ENHANCEMENT_DEFS — staged runtime catalog family.
 * load() paths are relative to public/js/runtime/.
 */

import {
  COST_CLASS,
  isFn,
  MODULE_LAYERS,
  MOUNT_WHEN,
  REGION_SELECTOR,
} from './module-catalog-constants.js';

export const ENHANCEMENT_DEFS = [
  {
    id: 'layout-shift-audit',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    costClass: COST_CLASS.WORKING_MEMORY_PRESSURE,
    // Also filtered from the catalog unless ?debug=layout / log=layout-shift
    // (site.js filterEnhancementDefs). Idle so QA never contends with first paint.
    selector: 'body',
    rootMode: 'single',
    describes: 'page-wide layout stability observer with explicit cleanup of PerformanceObserver state and root datasets',
    updates: ['data-spw-layout-shift-state', 'data-spw-layout-shift-count', 'data-spw-layout-shift-total', 'data-spw-layout-shift-outcome'],
    evaluates: 'layout stability page-lifecycle diagnostics',
    timingArc: 'enhance-debug',
    timingChunk: 'idle-lab',
    effectScope: 'root-state performance-observer cleanup',
    load: () => import('./layout-shift-audit.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwLayoutShiftAudit;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'tuning-discovery',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    selector: '[data-site-settings-scope], [data-spw-affordance="tune"], [data-spw-feature], .vibe-widget[data-spw-role="control"]',
    rootMode: 'single',
    describes: 'embedded hypermedia extension surfaces for layout, material, and gesture controls + html[data-spw-tuning-discoverability]',
    updates: [
      'data-spw-tuning-surface',
      'data-spw-tuning-surface-count',
      'data-spw-tuning-discoverability',
      'data-spw-embedded-tuning-host',
      'data-spw-embedded-tuning-count',
      'data-spw-embedded-tuning-present',
      'data-spw-embedded-tuning-dimensions',
      'data-spw-hypermedia-extension',
    ],
    timingArc: 'visible-tuning',
    effectScope: 'root-state local-dom',
    evaluates: 'embedded tuning surfaces discoverability hypermedia extension',
    load: () => import('./tuning-discovery.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initTuningDiscovery;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'page-region-rail',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    selector: 'main [id].site-frame, main [data-spw-region-role], main [data-spw-feature]',
    rootMode: 'single',
    describes: 'desktop region index from main semantics + html[data-spw-page-region-rail], refreshed through dom-sync teardown',
    updates: [
      'html:structural:data-spw-page-region-rail',
      'structural:data-spw-region-active',
      'structural:data-spw-region-role',
      'structural:data-spw-feature',
    ],
    evaluates: 'navigation region-discoverability component-discovery theme-readability',
    timingArc: 'immediate-navigation',
    effectScope: 'floating-chrome root-state',
    load: () => import('./page-region-rail.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initPageRegionRail;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'charge-field',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    selector: '[data-spw-gesture-contract], .operator-chip, .frame-sigil, .spw-living-term, [data-spw-operator]',
    rootMode: 'single',
    describes: 'charge/discharge field state on html + frame consequence-live projection; clears timers, bus subscriptions, frame state, and CSS custom property on teardown',
    updates: [
      'data-spw-charge-field',
      'data-spw-charge-intensity',
      'data-spw-last-discharge',
      'data-spw-charge-carrier',
      'data-spw-consequence-live',
      'data-spw-discharge-kind',
    ],
    timingArc: 'immediate-gesture',
    effectScope: 'root-state frame-state timers bus',
    evaluates: 'charge discharge field intensity consequence-live gesture',
    load: () => import('./charge-field.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initChargeField;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'gesture-anatomy',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-gesture-contract], [data-spw-gesture-contract-resolved], [data-spw-slot], .spw-living-term[data-spw-living-term]',
    rootMode: 'single',
    describes: 'slot anatomy rails + gesture-hint from authored/resolved contracts; theme-link projection',
    updates: [
      'data-spw-gesture-hint',
      'data-spw-slot-label',
      'data-spw-anatomy-stack',
      'data-spw-anatomy-theming',
      'html:flourish:data-spw-gesture-anatomy',
      'html:inspect:data-spw-anatomy-discoverability',
      'html:inspect:data-spw-anatomy-theme-link',
    ],
    timingArc: 'visible-gesture',
    evaluates: 'gesture hint slot anatomy contract rails theme-synergy semantics-resolved',
    effectScope: 'element-state local-dom root-state settings',
    load: () => import('./gesture-anatomy.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initGestureAnatomy;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'learnability-ledger',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-feature], [data-spw-box-model], [data-spw-gesture-contract], [data-spw-slot]',
    rootMode: 'single',
    describes: 'metacognitive posture accounting, layout-contract audit, feature learnability resonance',
    updates: [
      'data-spw-learnability-ledger',
      'data-spw-learnability-posture',
      'data-spw-layout-contract',
      'data-spw-learnability-tier',
    ],
    timingArc: 'enhance-metacognition',
    timingChunk: 'idle-lab',
    effectScope: 'root-state element-state',
    evaluates: 'learnability posture layout-contract feature resonance tiers',
    load: () => import('./learnability-ledger.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initLearnabilityLedger;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'component-collection',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: REGION_SELECTOR,
    rootMode: 'single',
    describes: 'collection[component-kinds] achievement[diversity] persistent[cross-session] reward[fresh-pulse]',
    updates: [
      'html:residue:data-spw-collection-kinds',
      'html:residue:data-spw-collection-total',
      'html:residue:data-spw-collection-tier',
      'html:residue:data-spw-collection-achievements',
      'html:flourish:data-spw-collection-fresh',
    ],
    evaluates: 'discovered component diversity, achievement unlocks, collectible memory',
    timingArc: 'enhance-collection',
    timingChunk: 'idle-collectible',
    effectScope: 'root-state storage bus',
    load: () => import('./component-collection.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initComponentCollection;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'feature-discovery',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-feature]',
    features: ['feature-discovery'],
    rootMode: 'single',
    describes: 'field-guide[features] progression[local-contract] memory[local-contract] encounter[novel|convergent|return]',
    updates: [
      'html:residue:data-spw-feature-discovery-init',
      'flourish:data-spw-feature-encounter',
      'flourish:data-spw-feature-level',
      'residue:data-spw-feature-progress',
      'flourish:data-spw-feature-convergent',
      'flourish:data-spw-feature-fresh',
    ],
    evaluates: 'feature discovery, per-feature progression + memory contracts, convergent-trait recognition',
    timingArc: 'enhance-collection',
    timingChunk: 'idle-collectible',
    effectScope: 'element-state storage observer bus global-api',
    load: () => import('./feature-discovery.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initFeatureDiscovery;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'reward-ui',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: REGION_SELECTOR,
    rootMode: 'single',
    describes: 'reward[toasts.dock.settings] collection[component-kinds] capture-aware[clean] physical[charge-pulse]',
    updates: [
      'html:residue:data-spw-reward-ui-init',
      'html:flourish:data-spw-reward-easter-egg',
      'html:flourish:data-spw-reward-tier',
      'html:flourish:data-spw-reward-reveal',
    ],
    evaluates: 'achievement feedback, collection dock, settling reveal, reward tunability',
    timingArc: 'enhance-reward',
    timingChunk: 'idle-collectible',
    effectScope: 'root-state floating-chrome toast bus',
    load: () => import('./reward-ui.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initRewardUI;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'frame-navigator',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    features: ['navigator'],
    selector: '.site-frame',
    rootMode: 'single',
    describes: 'surface-map[frames|routes] keyboard-spells[g|traverse|filter] navigator chrome',
    updates: ['data-spw-nav-state', 'data-spw-nav-label'],
    evaluates: 'frame traversal, route index, surface-map filter, keyboard navigation',
    timingArc: 'enhance-navigator',
    timingChunk: 'idle-chrome',
    effectScope: 'floating-chrome listeners bus root-state',
    load: () => import('./frame-navigator.js'),
    // Presence gate: body[data-spw-features~="navigator"] via catalog features
    // (PRESENCE_FEATURE_KEYS in runtime-contracts — not a CSS behavior scope).
    // Module also self-gates on navigatorDisplay at runtime.
    mount: (mod) => {
      const fn = mod?.initFrameNavigator;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'observation-beats',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    debugOnly: true,  // Enhanced gating via shouldScheduleDefinition + ctx.debug
    describes: 'beat[window] qa[observation] lifecycle[page+region+component+cauldron] consequence[traceable]',
    updates: ['data-spw-active-beat', 'data-spw-active-beat-state', 'data-spw-last-beat-id', 'data-spw-module-consequence'],
    timingArc: 'enhance-debug',
    timingChunk: 'idle-lab',
    effectScope: 'root-state bus',
    evaluates: 'qa observation beats lifecycle consequence trace debug',
    load: () => import('./observation-beats.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initObservationBeats;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'svg-filters',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    features: ['svg-surfaces'],
    selector: '.spw-svg-figure, .image-study, [data-spw-image-surface]',
    rootMode: 'single',
    describes: 'svg[filters.defs] shared visual treatment',
    evaluates: 'svg surfaces filters texture visual enhancement',
    timingArc: 'visible-media',
    updates: [
      'structural:data-spw-svg-filters-ready',
      'html:structural:data-spw-svg-filter-defs',
    ],
    effectScope: 'local-dom root-state',
    load: () => import('../media/svg-filters.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSvgFilters;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'svg-tunability',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    features: ['svg-surfaces'],
    selector: '[data-spw-svg-host], .spw-svg-figure[data-spw-svg-pointer], [data-spw-svg-workbench]',
    rootMode: 'single',
    describes: 'svg[tune|pointer|query|workbench] responsive diagram controls',
    updates: ['data-spw-svg-pointer-state', 'data-spw-svg-device', 'data-spw-svg-environment', 'data-spw-svg-environment-reason', 'data-spw-svg-persona-active', 'data-spw-svg-persona-match', 'data-spw-svg-node-state', 'data-spw-svg-focus-node', '--spw-svg-pointer-x', '--spw-svg-pointer-intensity', '--spw-svg-persona-harmony'],
    evaluates: 'svg tunability pointer query device responsiveness',
    timingArc: 'visible-media',
    effectScope: 'svg element-state css-vars',
    load: () => import('../media/svg-tunability.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSvgTunability;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'canvas-accents',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    costClass: COST_CLASS.PAINT_COMPOSITE,
    selector: '[data-spw-accent]',
    rootMode: 'single',
    describes: 'canvas-accent[wave|vortex|lattice] background resonance',
    updates: [
      'html:flourish:--spw-accent-strength',
      'html:flourish:--spw-accent-color-1',
      'html:flourish:--spw-accent-color-2',
      'html:flourish:--field-balance',
      'html:flourish:data-spw-wonder-memory-state',
    ],
    evaluates: 'visual accents canvas resonance reduced-motion',
    timingArc: 'visible-visual',
    effectScope: 'canvas css-vars media-query',
    load: () => import('../interface/canvas-accents.js'),
    mount: (mod) => {
      const fn = mod?.initSpwCanvasAccents;
      if (!isFn(fn)) return;
      return fn(document.querySelector('main') || document);
    },
  },
  {
    id: 'image-metaphysics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.image-study, .spw-svg-figure, [data-spw-image-surface], .domain-visual, .spw-scaffold',
    rootMode: 'single',
    describes: 'image[managed|effect|memory|gesture] metaphysics',
    updates: ['data-spw-image-managed', 'data-spw-image-state', 'data-spw-contrast-state', 'data-spw-image-effect', 'data-spw-visited'],
    evaluates: 'image treatment gesture memory visual semantics',
    timingArc: 'visible-media',
    effectScope: 'target-dom gesture-memory listeners',
    load: () => import('../media/image-metaphysics.js'),
    mount: (mod) => {
      const fn = mod?.initSpwImageMetaphysics;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'logo-runtime',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spw-logo, [data-spw-logo]',
    rootMode: 'single',
    describes: 'logo[state|scroll|charge] shell identity runtime',
    updates: ['data-logo-state', 'data-logo-scroll', 'data-spw-kind', 'data-spw-touch', '--logo-charge'],
    evaluates: 'brand identity shell logo motion',
    timingArc: 'enhance-shell',
    timingChunk: 'idle-chrome',
    effectScope: 'element-state css-vars',
    load: () => import('../interface/logo-runtime.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwLogoRuntime || mod?.initLogoRuntime;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'topic-discovery',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spw-topic, [data-spw-topic]',
    rootMode: 'single',
    describes: 'topic[context|popover|navigation] discovery',
    evaluates: 'topic semantics navigation popover bus',
    timingArc: 'enhance-topic',
    timingChunk: 'idle-lab',
    effectScope: 'popover listeners bus',
    // Body token topic-discovery is pack narrative; selector is the demand gate
    // (many topic pages omit the feature token but still host .spw-topic).
    updates: [
      'inspect:data-spw-topic-discovery',
      'structural:data-spw-topic-context',
      'flourish:data-spw-topic-popover',
    ],
    load: () => import('../interface/topic-discovery.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwTopicDiscovery || mod?.initTopicDiscovery;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'component-semantics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.WORKING_MEMORY_PRESSURE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    describes: 'component-semantics[authored|resolved] role interaction lifecycle physics',
    updates: [
      'data-spw-component-kind',
      'data-spw-role-resolved',
      'data-spw-context-resolved',
      'data-spw-composition-stability-resolved',
      'data-spw-lifecycle-beat-resolved',
      'data-spw-interaction-phase-affinity',
      'data-spw-physics-profile-resolved',
      'data-spw-copy-depth-resolved',
      'data-spw-theming-posture-resolved',
      'data-spw-gesture-contract-resolved',
      'data-spw-interaction-contract-resolved',
    ],
    evaluates: 'component ontology interaction-vocabulary lifecycle physics copy-depth',
    timingArc: 'immediate-semantics',
    effectScope: 'element-state',
    load: () => import('../semantic/component-semantics.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwComponentSemantics;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'composition-box-model',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    costClass: COST_CLASS.WORKING_MEMORY_PRESSURE,
    selector: '[data-spw-box-model], [data-spw-composition-flow], [data-spw-pack-local], [data-site-settings-panel], body[data-spw-surface="settings"] .settings-fieldset',
    rootMode: 'single',
    describes: 'box-model[presence|measure|story|pack] composition[flow]',
    updates: ['data-spw-box-model', 'data-spw-box-presence', 'data-spw-box-measure', 'data-spw-box-story', 'data-spw-composition-flow', 'data-spw-box-settle-phase', 'data-spw-size-context', 'data-spw-content-tone', 'data-spw-pack-layout', 'data-spw-pack-fill'],
    evaluates: 'layout semantics spacing-semantics state storytelling',
    timingArc: 'visible-layout',
    effectScope: 'element-state css-vars',
    load: () => import('./composition-box-model.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwCompositionBoxModel;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'spatial-gravity',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-gravity]',
    rootMode: 'single',
    describes: 'spatial-gravity[room|edge|gravity|salience] two-axis positioning + overlap resolution',
    updates: [
      'attr:data-spw-edge-gravity',
      'attr:data-spw-edge-x',
      'attr:data-spw-edge-y',
      'attr:data-spw-vertical-gravity',
      'attr:data-spw-horizontal-gravity',
      'attr:data-spw-extent',
      'attr:data-spw-measure-band',
      'attr:data-spw-space-variant',
      'attr:data-spw-open-direction',
      'attr:data-spw-open-anchor',
      'attr:data-spw-salience-rank',
      'attr:data-spw-yielded',
      'attr:data-spw-yield-reason',
      'css-var:--spw-room-above',
      'css-var:--spw-room-below',
      'css-var:--spw-room-left',
      'css-var:--spw-room-right',
      'css-var:--spw-proximity-top',
      'css-var:--spw-proximity-bottom',
      'css-var:--spw-proximity-left',
      'css-var:--spw-proximity-right',
      'css-var:--spw-edge-proximity',
      'css-var:--spw-vertical-bias',
      'css-var:--spw-horizontal-bias',
    ],
    evaluates: 'viewport geometry room measurement two-axis gravity salience overlap variant selection',
    timingArc: 'visible-geometry',
    effectScope: 'element-state css-vars observers document-scroll resize field-guide',
    load: () => import('./spatial-gravity.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSpatialGravity;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'semantic-crossrefs',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.WORKING_MEMORY_PRESSURE,
    selector: '[data-spw-semantic-cluster], [data-spw-vocab], [data-spw-semantic-expression], [data-spw-topic], .spw-topic',
    rootMode: 'single',
    describes: 'crossref[semantics] resonance[peer|source]',
    updates: ['data-spw-crossref', 'data-spw-crossref-source', 'data-spw-semantic-cluster', 'data-spw-vocab'],
    evaluates: 'semantics navigation interaction resonance',
    timingArc: 'immediate-semantics',
    effectScope: 'element-state bus',
    load: () => import('../semantic/semantic-crossrefs.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwSemanticCrossrefs;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'page-anatomy',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-anatomy], [data-spw-vocabulary]',
    rootMode: 'single',
    describes: 'page-anatomy[vocabulary]{focus.pin.reference}',
    updates: ['data-spw-anatomy-ready', 'data-spw-anatomy-focus', 'data-spw-anatomy-vocabulary', 'data-spw-anatomy-pinned'],
    evaluates: 'semantics interaction timing reference-document',
    timingArc: 'visible-anatomy',
    effectScope: 'local-dom element-state',
    load: () => import('./page-anatomy.js'),
    mount: (mod) => {
      const fn = mod?.initPageAnatomy;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'ingredient-lab',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-ingredient-lab]',
    rootMode: 'single',
    describes: 'ingredient-lab[lens|status] local mode controls',
    updates: ['data-spw-ingredient-enhanced', 'data-spw-ingredient-mode', 'data-spw-ingredient-status'],
    evaluates: 'ingredient lab learning mode controls',
    timingArc: 'visible-lab',
    effectScope: 'local-dom element-state',
    load: () => import('./ingredient-lab.js'),
    mount: (mod) => {
      const fn = mod?.initIngredientLabs;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'guide-badge',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.operator-chip, .frame-sigil, .frame-card-sigil, .spec-pill, [data-spw-guide-badge]',
    rootMode: 'single',
    describes: 'guide[badge|collect] operator[resonance]',
    updates: [
      'flourish:data-spw-guide-badge',
      'residue:data-spw-collected',
    ],
    evaluates: 'collectible operator resonance guide badges',
    timingArc: 'enhance-collectible',
    timingChunk: 'idle-collectible',
    effectScope: 'element-state storage listeners',
    load: () => import('../interface/guide-badge.js'),
    mount: (mod) => {
      const fn = mod?.initGuideBadges;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'query-link-composer',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-query-composer], [data-spw-feature="query-composer"], [data-spw-feature="settings-partial-theatrics-lab"], [data-spw-feature="composition-partial-lab"]',
    rootMode: 'single',
    describes: 'query[share-setup] composer[instruments] cauldron[offer] feature-hub[embed]',
    updates: [
      'structural:data-spw-query-composer',
      'inspect:data-spw-query-composer-search',
      'structural:data-spw-query-composer-href',
      'flourish:data-spw-query-composer-expanded',
    ],
    evaluates: 'shareable lab setups module-visuals settings-parity cauldron spells',
    timingArc: 'enhance-lab',
    timingChunk: 'idle-lab',
    effectScope: 'local-dom bus clipboard navigation',
    load: () => import('./query-link-composer.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initQueryLinkComposer || mod?.bindQueryComposers;
      if (!isFn(fn)) return;
      if (mod?.initQueryLinkComposer) return fn(ctx);
      const binding = fn(document);
      return binding?.cleanup;
    },
  },
  {
    id: 'discovery-notices',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    selector: 'body',
    rootMode: 'single',
    describes: 'page-wide discovery notice layer for runtime rewards, with dismissal storage and escape/listener teardown',
    updates: [
      'html:flourish:data-spw-discovery-notice-stack',
      'html:flourish:data-spw-discovery-notice-modal',
      'html:flourish:data-spw-feature-learning',
    ],
    evaluates: 'feedback discoverability reward-cadence floating-chrome',
    timingArc: 'enhance-feedback',
    timingChunk: 'idle-chrome',
    effectScope: 'floating-chrome storage listeners',
    load: () => import('../interface/discovery-notices.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwDiscoveryNotices;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'state-inspector',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    costClass: COST_CLASS.WORKING_MEMORY_PRESSURE,
    selector: 'body',
    rootMode: 'single',
    describes: 'state[satchel]{inspect.modify.serialize.feedback}',
    updates: [
      'html:inspect:data-spw-state-inspector',
      'html:inspect:data-spw-state-serialization-dimensions',
      'html:inspect:data-spw-debug-mode',
      'html:flourish:data-spw-module-visuals',
      'html:inspect:data-spw-show-semantic-metadata',
      'html:inspect:data-spw-feature-learning',
    ],
    evaluates: 'state accessibility layering interaction learnability',
    timingArc: 'enhance-metacognition',
    timingChunk: 'idle-lab',
    effectScope: 'floating-chrome root-state local-controls',
    load: () => import('../interface/state-inspector.js'),
    mount: (mod) => {
      const fn = mod?.initStateInspector;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'image-discovery-rewards',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-image-reward], [data-spw-image-discovery]',
    rootMode: 'single',
    describes: 'image[discovery]{reward.notice.cadence.production}',
    updates: [
      'flourish:data-spw-image-discovery-state',
      'residue:data-spw-image-discovered',
      'flourish:data-spw-discovery-cadence',
      'flourish:data-spw-discovery-motion',
      'structural:data-spw-discovery-production',
    ],
    timingArc: 'visible-reward',
    evaluates: 'image discovery reward cadence motion production',
    effectScope: 'local-dom flourish residue bus',
    load: () => import('../interface/image-discovery-rewards.js'),
    mount: (mod) => {
      const fn = mod?.initImageDiscoveryRewards;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'semantic-chrome',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    features: ['inspectability'],
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    describes: 'semantic-chrome[seam|label|metadata] component overlays',
    updates: [
      'structural:data-spw-generated',
      'inspect:data-spw-semantic-tagged',
      'inspect:data-spw-semantic-seam',
    ],
    evaluates: 'semantic chrome component labels inspectability',
    timingArc: 'immediate-inspect',
    effectScope: 'element-state',
    load: () => import('../interface/semantic-chrome.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwSemanticChrome;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'contextual-ui',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    selector: 'main, .site-header',
    rootMode: 'single',
    describes: 'contextual-ui[module-inference|route-discovery|nav-fit]',
    updates: [
      'structural:data-spw-module',
      'html:structural:data-spw-route-discovery',
      'structural:data-spw-route-menu-state',
      'html:structural:data-spw-nav-fit',
    ],
    evaluates: 'route discovery contextual navigation inferred modules',
    timingArc: 'immediate-context',
    effectScope: 'header-dom route-menu nav-fit',
    // route-discovery body token is presence storytelling; module stays selector-gated
    // so hub routes without the token still get nav-fit inference.
    load: () => import('../interface/contextual-ui.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwContextualUi;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'console',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.WORKING_MEMORY_PRESSURE,
    features: ['console'],
    selector: 'body',
    rootMode: 'single',
    describes: 'console[frame|mode|bus|layout] diagnostics[screenshot]',
    updates: ['data-spw-console-state'],
    evaluates: 'debuggability layout-shift interaction frame-state',
    timingArc: 'immediate-diagnostics',
    effectScope: 'floating-chrome bus root-state',
    load: () => import('../interface/console.js'),
    mount: (mod) => {
      const fn = mod?.initSpwConsole;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'design-experiments',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-design-experiments-root]',
    rootMode: 'single',
    describes: 'design-experiments[rule|material|ecology|token] live lab',
    updates: ['data-design-material-mode', 'data-design-ecology', 'data-spw-design-ecology', 'data-design-meter-value'],
    evaluates: 'design lab material ecology tokens settings bundles',
    timingArc: 'visible-lab',
    effectScope: 'local-dom',
    load: () => import('../modules/design/experiments.js'),
    mount: (mod) => {
      const fn = mod?.initDesignExperiments;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'design-review-surfaces',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: 'body[data-spw-page-role="asset-review"], body[data-spw-page-role="token-review"], body[data-spw-page-role="design-lab"]',
    rootMode: 'single',
    describes: 'design-review[asset|token|lab] constellation surfaces',
    updates: ['data-review-key', 'data-spw-svg-tune-motion'],
    evaluates: 'design review asset token lab navigation',
    timingArc: 'visible-lab',
    effectScope: 'local-dom',
    load: () => import('../modules/design/review-surfaces.js'),
    mount: (mod) => {
      const fn = mod?.initDesignReviewSurfaces;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'attention-architecture',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PAINT_COMPOSITE,
    selector: 'main, .spw-section-handle, [data-spw-operator]',
    rootMode: 'single',
    describes: 'attention[resonance|field-intensity|section-handle|reading-groove] operators',
    updates: [
      'data-spw-resonance-probe',
      'data-spw-page-section-current',
      'data-spw-page-section-index',
      'data-spw-page-section-count',
      'data-spw-page-section-phase',
      'data-spw-page-section-edge',
      'data-spw-page-section-direction',
      'data-spw-section-state',
      'data-spw-section-index',
      'data-spw-section-tier',
      'data-spw-handle-state',
      'data-spw-handle-phase',
      'data-spw-handle-availability',
      'data-spw-handle-enhanced',
      'data-spw-handle-shell-state',
      'data-spw-handle-origin',
      'data-spw-handle-current',
      'data-spw-handle-index',
      'data-spw-handle-count',
      'data-spw-handle-source',
      'data-spw-section-handle-label',
      'data-spw-section-handle-op',
      'data-spw-section-has-vocabulary',
      'data-spw-wonder-entry',
      'data-spw-approach',
      'data-spw-reading-groove',
      'data-spw-reading-groove-count',
      'data-spw-reading-beat',
      'data-spw-reading-beat-index',
      'data-spw-reading-beat-role',
      'data-spw-reading-current',
      'data-spw-reading-focus',
      'data-spw-scroll-cadence',
      'data-spw-pinch-scaling',
      'data-spw-subvocal-rehearsal',
      'data-spw-cauldron-resonance',
      '--spw-section-progress',
      '--spw-section-step',
      '--field-balance',
    ],
    timingArc: 'immediate-attention',
    effectScope: 'root-state section-state listeners css-vars',
    evaluates: 'section handle resonance reading-groove scroll-cadence attention field',
    load: () => import('./attention-architecture.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwAttentionArchitecture;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'annotation-layer',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-annotation-handle], [data-spw-header-annotation]',
    rootMode: 'single',
    describes: 'annotation-layer[handle|region-match|active-section]',
    updates: ['data-spw-annotation', 'data-spw-annotation-state', 'data-spw-annotation-match', 'data-spw-annotation-source'],
    evaluates: 'annotation region matching section locomotion',
    timingArc: 'visible-annotation',
    effectScope: 'local-dom listeners',
    load: () => import('./annotation-layer.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwAnnotationLayer;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'module-effects',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PAINT_COMPOSITE,
    selector: 'html',
    rootMode: 'single',
    describes: 'module[effects]{root-state.surface}',
    updates: [
      'html:flourish:data-spw-module-effects-active',
      'html:flourish:data-spw-module-effect-pulse',
      'html:flourish:data-spw-runtime-enhancement-active',
      'html:flourish:data-spw-runtime-feature-active',
      'html:flourish:data-spw-runtime-layer-pulse',
    ],
    effectScope: 'root-state css-vars ornament',
    evaluates: 'runtime module side effects ornament pulse',
    timingArc: 'immediate-orchestration',
    load: () => import('./module-effects.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initModuleEffects;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'loading-ecology',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PAINT_COMPOSITE,
    selector: 'html',
    rootMode: 'single',
    describes: 'ecology[loading|measure|settle]{prefetch.personalize.genre}',
    updates: [
      'html:structural:data-spw-loading-ecology-phase',
      'html:flourish:data-spw-loading-ecology-salience',
      'html:flourish:data-spw-loading-ecology-rhythm',
      'html:flourish:data-spw-loading-ecology-twinkle',
      'html:flourish:data-spw-loading-ecology-trope',
      'html:structural:data-spw-loading-ecology-genre',
      'html:inspect:data-spw-loading-ecology-dimensions',
      'html:measure:data-spw-loading-ecology-measure-kind',
    ],
    effectScope: 'root-state css-vars ornament measurement',
    evaluates: 'loading measurement settling ecology salience rhythm trope genre packing dimensions',
    timingArc: 'immediate-orchestration',
    load: () => import('./loading-ecology.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initLoadingEcology;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'hydration-passes',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PAINT_COMPOSITE,
    selector: 'html',
    rootMode: 'single',
    describes: 'hydration[pass|lex.semantic.pragmatic] workbench-alignment',
    updates: [
      'data-spw-hydration-pass',
      'data-spw-hydration-pass-state',
      'data-spw-hydration-pass-momentum',
    ],
    effectScope: 'root-state css-vars',
    evaluates: 'multi-pass hydration workbench runtime phase narration',
    timingArc: 'immediate-orchestration',
    load: () => import('./hydration-passes.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initHydrationPasses;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'settings-momentum',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PAINT_COMPOSITE,
    selector: 'html',
    rootMode: 'single',
    describes: 'settings[tuning] spell[momentum] replayable-climate',
    updates: [
      'html:flourish:data-spw-settings-momentum',
      'html:flourish:data-spw-spell-momentum',
      'html:structural:data-spw-settings-tuning-phase',
    ],
    effectScope: 'root-state bus ornament',
    evaluates: 'settings tuning spell momentum pulse',
    timingArc: 'immediate-orchestration',
    load: () => import('./settings-momentum.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSettingsMomentum;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'image-utilization',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: 'main, [data-spw-image-surface], [data-spw-image-reward], [data-spw-image-discovery]',
    rootMode: 'single',
    describes: 'image[distribution|utilization] performance lazy-priority',
    updates: [
      'data-spw-image-utilization',
      'data-spw-image-distribution',
    ],
    evaluates: 'image lazy loading decode priority distribution metadata',
    timingArc: 'visible-media',
    effectScope: 'media element-state',
    load: () => import('../semantic/image-utilization.js'),
    mount: (mod) => {
      const fn = mod?.initImageUtilization;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'image-interaction',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.topic-photo-card, .image-study, [data-spw-image-reward], [data-spw-image-discovery], .frame-card-media, [data-spw-image-surface]',
    rootMode: 'single',
    describes: 'image[interaction]{prime|inspect|discover|lens} gesture-contract',
    updates: [
      'data-spw-image-interaction-state',
      'data-spw-image-lens-active',
      'data-spw-image-lens-cues',
      'data-spw-gesture-contract',
      'data-spw-interaction-contract',
      'data-spw-interaction-affordance',
      'data-spw-discovery-motion',
    ],
    evaluates: 'image hover focus hold swipe lens discovered interaction states',
    timingArc: 'visible-media',
    effectScope: 'media listeners element-state',
    load: () => import('../semantic/image-interaction.js'),
    mount: (mod) => {
      const fn = mod?.initImageInteraction;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'effect-interpretation',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.topic-photo-card, .image-study, [data-spw-image-reward], [data-spw-image-discovery], .frame-card-media, [data-spw-image-surface]',
    rootMode: 'single',
    describes: 'effect[interpretation]{lens|cues|state} visual legend',
    updates: [
      'data-spw-effect-legend-ready',
      'data-spw-effect-readout',
      'data-spw-effect-view',
      'data-spw-effect-state-value',
      'data-spw-image-lens-capacity',
      'data-spw-semantic-expression',
      'data-spw-sigil',
    ],
    evaluates: 'operator sigil lens capacity chips visual cue tokens interaction state readouts',
    timingArc: 'visible-media',
    effectScope: 'local-dom element-state',
    load: () => import('../semantic/effect-interpretation.js'),
    mount: (mod) => {
      const fn = mod?.initEffectInterpretation;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'pulse-beat-tuner',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PAINT_COMPOSITE,
    selector: 'html',
    rootMode: 'single',
    describes: 'rhythm[beat|freshness]{13-cycle|prime} settings-tuned pulse cadence',
    updates: [
      'html:structural:data-spw-beat',
      'html:structural:data-spw-playing',
      'html:flourish:data-spw-freshness-pulse',
    ],
    effectScope: 'root-state css-vars bus',
    evaluates: 'interaction-tuner beat-interval freshness-weight microinteraction-pulse-duration',
    timingArc: 'immediate-rhythm',
    load: () => import('./pulse-beat-tuner.js'),
    mount: (mod) => {
      const fn = mod?.initPulseBeatTuner;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'spw-key-events',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    selector: 'html',
    rootMode: 'single',
    describes: 'key[potentiate|actualize]{scene-context|selection-thread}',
    updates: [
      'data-spw-key-selection',
      'data-spw-selection-state',
      'data-spw-key-potential',
      'data-spw-scene-context',
      'data-spw-scene-depth',
      'data-spw-scene-state',
      'data-spw-scene-posture',
      'data-spw-reveal-phase',
      'data-spw-information-reveal',
      'data-spw-reveal-frame',
      'data-spw-key-events-ready',
    ],
    evaluates: 'keyboard scene-enter scene-exit reveal-framing wonder-block-staging LM-interpretable context stack',
    timingArc: 'immediate-keyboard',
    effectScope: 'root-state listeners bus',
    load: () => import('./spw-key-events.js'),
    mount: (mod) => {
      const fn = mod?.initSpwKeyEvents;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'scene-interaction',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.spw-scene-bed[data-spw-scene-posture], .spw-scene-bed[data-spw-scene-interactive]',
    rootMode: 'single',
    describes: 'scene[bed]{lane-focus|image-coupling|local-memory}',
    updates: [
      'data-spw-scene-interactive',
      'data-spw-scene-focus-lane',
      'data-spw-scene-lane-active',
      'data-spw-scene-image-active',
      'data-spw-scene-local-state',
    ],
    evaluates: 'scene lanes radiogroup image lens localStorage scene-memory strip',
    timingArc: 'visible-scene',
    effectScope: 'local-dom element-state storage',
    load: () => import('./scene-interaction.js'),
    mount: (mod) => {
      const fn = mod?.initSceneInteraction;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'topical-payload',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    selector: 'html',
    rootMode: 'single',
    describes: 'topical[payload]{topics|lore|handles|scene|image}',
    updates: ['data-spw-topical-payload-ready'],
    evaluates: 'topics lore prompt-host scene-interpret semantic-expression image handles LM handoff',
    timingArc: 'immediate-payload',
    effectScope: 'root-state',
    load: () => import('./topical-payload.js'),
    mount: (mod) => {
      const fn = mod?.initTopicalPayload;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'palette-treat-discovery',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.palette-probe, .spw-shell-resonance-utility, html',
    rootMode: 'single',
    describes: 'palette[treat|splash] probe-chip discovery resonance echo',
    updates: [
      'html:flourish:data-spw-palette-treat-active',
      'html:flourish:data-spw-palette-splash',
      'flourish:data-spw-palette-treat-probe',
      'flourish:data-spw-palette-treat-depth',
      'flourish:data-spw-palette-treat',
      'structural:data-spw-palette-probe-rail',
      'structural:data-spw-palette-probe-index',
      'structural:data-spw-palette-probe-toolbar',
    ],
    effectScope: 'root-state probe-chips operators bus keyboard',
    evaluates: 'freshness-pulse discovery-reward discover-phase palette-resonance arrow-reward probe keyboard-rail',
    timingArc: 'enhance-discovery',
    timingChunk: 'idle-lab',
    load: () => import('./palette-treat-discovery.js'),
    mount: (mod) => {
      const fn = mod?.initPaletteTreatDiscovery;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'interaction-progression',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    selector: 'html',
    rootMode: 'single',
    describes: 'interaction[phase]{idle|approach|prime|charge|inspect|discover|settle}',
    updates: ['data-spw-interaction-phase', 'data-spw-microinteraction-pulse'],
    evaluates: 'gesture loop pinch swipe hover tap image ecology interaction-vocabulary',
    timingArc: 'immediate-gesture',
    effectScope: 'root-state',
    load: () => import('./interaction-progression.js'),
    mount: (mod) => {
      const fn = mod?.initInteractionProgression;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'concept-salience',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-concept], [data-spw-semantic-expression], .study-summary, [data-spw-collectability]',
    rootMode: 'single',
    describes: 'concept[salience|vocabulary|collectible] learnable-dimension',
    updates: [
      'data-spw-concept-ref',
      'data-spw-vocabulary-term',
      'data-spw-vocabulary-collectible',
      'data-spw-learnable-dimension',
      'data-spw-salience-weight',
    ],
    evaluates: 'conceptual salience vocabulary collectibility dimension refs',
    timingArc: 'visible-semantics',
    effectScope: 'local-dom element-state',
    load: () => import('../semantic/concept-salience.js'),
    mount: (mod) => {
      const fn = mod?.initConceptSalience;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'precipitation-request',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    selector: 'html',
    rootMode: 'single',
    describes: 'precipitation[condense|print|screenshot] query projection',
    updates: [
      'data-spw-condense-tier',
      'data-spw-precipitation-mode',
      'data-spw-precipitation-active',
      'data-spw-print-ready',
      'data-spw-query-condense',
    ],
    evaluates: 'condensation print screenshot precipitation from modular query',
    timingArc: 'immediate-print',
    effectScope: 'root-state',
    load: () => import('./precipitation-request.js'),
    mount: (mod) => {
      const fn = mod?.initPrecipitationRequest;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'variant-selection',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.site-frame, .frame-card, [data-spw-feature], [data-spw-semantic-variant], [data-spw-content-variant]',
    rootMode: 'single',
    describes: 'component[variant]{mode|semantic|content} query override',
    updates: [
      'data-spw-variant-selected',
      'data-spw-component-variant-active',
      'data-spw-variant-selection-source',
      'data-spw-query-variant',
    ],
    evaluates: 'mode-switch variant selection query priming semantic weight',
    timingArc: 'visible-variant',
    effectScope: 'local-dom element-state',
    load: () => import('./variant-selection.js'),
    mount: (mod) => {
      const fn = mod?.initVariantSelection;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'navigation-locomotion',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    selector: 'main',
    rootMode: 'single',
    describes: 'navigation[locomotion] transition[section-travel] spell[cast] chrome[sync]',
    updates: [
      'html:structural:data-spw-navigation-locomotion',
      'html:structural:data-spw-navigation-transition',
      'html:structural:data-spw-navigation-section',
      'html:flourish:data-spw-spell-momentum',
      'html:structural:data-spw-bottom-lane-nav',
    ],
    evaluates: 'navigation transitions spells floating-chrome section-locomotion',
    timingArc: 'immediate-navigation',
    effectScope: 'root-state listeners bus floating-chrome',
    load: () => import('./navigation-locomotion.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initNavigationLocomotion;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'navigation-spells',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: 'header nav a[href], .site-header nav a[href], body > header nav a[href], .site-footer__nav a[href], .spw-route-menu-link[href], .operator-chip[href], .frame-sigil[href]',
    rootMode: 'single',
    describes: 'navigation[spell|grounding] route[replay]',
    updates: [
      'data-spw-nav-tokenized',
      'data-spw-nav-expression',
      'data-spw-interaction-contract',
      'data-spw-interaction-affordance',
      'data-spw-operator-geometry',
      'data-spw-ground-key',
    ],
    evaluates: 'nav spell grounding route replay',
    timingArc: 'enhance-spell',
    timingChunk: 'idle-residue',
    effectScope: 'target-dom gesture-memory listeners',
    load: () => import('./navigation-spells.js'),
    mount: (mod) => {
      const fn = mod?.initSpwNavigationSpells;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'bare-spw-markup',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    selector: '[data-spw-bare-spw="enhance"], .site-footer__summary, [data-spw-material-context~="mutable-markup"]',
    rootMode: 'single',
    describes: 'markup[bare-spw]{delimiter.operator.wrap}',
    updates: ['data-spw-bare-spw-enhanced', 'data-spw-form', 'data-spw-delimiter', 'data-spw-perspective'],
    evaluates: 'bare Spw prose delimiter and inline operator discoverability',
    timingArc: 'immediate-grammar',
    effectScope: 'element-state',
    load: () => import('../semantic/bare-spw-markup.js'),
    mount: (mod) => {
      const fn = mod?.initBareSpwMarkup;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'operators',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.DEMAND_COUPLED,
    features: ['operators'],
    selector: '.frame-sigil, .frame-card-sigil, .frame-panel-sigil, .syntax-token, .operator-chip, .spec-pill, .header-sigil, .site-footer__brand, .spw-delimiter, [data-spw-charge-key], a[data-spw-operator], button[data-spw-operator], [data-spw-sigil]',
    rootMode: 'single',
    describes: 'operators[sigil.detect.annotate.transition] grammar projection with page-region payload handoff',
    updates: [
      'data-spw-operator',
      'data-spw-sigil',
      'data-spw-sigil-prefix',
      'data-spw-sigil-role',
      'data-spw-identifier',
      'data-spw-address-role',
      'data-spw-operator-resolved',
      'data-spw-operator-geometry',
      'data-spw-operator-flow',
      'data-spw-operator-brace-bias',
      'data-spw-operator-charge-role',
      'data-spw-sigil-transitions-ready',
      'data-spw-active-sigil',
      'data-spw-active-sigil-operator',
      'data-spw-active-sigil-page',
      'data-spw-active-sigil-region',
      'data-spw-sigil-transition',
      'data-spw-sigil-payload-scope',
      'data-spw-sigil-region',
    ],
    evaluates: 'operator grammar accessibility semantic projection geometry transition page-region-payload',
    timingArc: 'immediate-grammar',
    effectScope: 'element-state geometry',
    load: () => import('../semantic/operators.js'),
    mount: (mod) => {
      const fn = mod?.initSpwOperators;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'haptics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-groundable=\"true\"], [data-spw-living-term], [data-spw-concept], [data-spw-cauldron-candidate], .spw-living-term, .operator-chip, .syntax-token, .frame-sigil',
    rootMode: 'single',
    describes: 'grounding[collection|resonance] spell[grounded|checkpoint]',
    updates: [
      'residue:data-spw-grounded',
      'residue:data-spw-collected',
      'flourish:data-spw-prime-state',
      'flourish:data-spw-collection-strength',
      'residue:data-spw-grounded-wonder',
    ],
    evaluates: 'collectible grounding resonance checkpoint',
    timingArc: 'enhance-collectible',
    timingChunk: 'idle-collectible',
    effectScope: 'element-state storage bus',
    load: () => import('../interface/haptics.js'),
    mount: (mod) => {
      const fn = mod?.initSpwHaptics;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'local-memory-controls',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-memory-action]',
    rootMode: 'single',
    describes: 'local-memory-controls[reset|status] browser storage actions',
    updates: ['data-spw-local-memory-controls-init', 'data-spw-memory-status-timer'],
    evaluates: 'local storage reset privacy settings',
    timingArc: 'visible-memory',
    effectScope: 'local-dom storage',
    load: () => import('../interface/local-memory-controls.js'),
    mount: (mod) => {
      const fn = mod?.initSpwLocalMemoryControls;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'prompt-utils',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-promptability="visible"], [data-spw-prompt-host]',
    rootMode: 'single',
    describes: 'prompt-utils[copy|serialize|wonder-block] prompt surfaces',
    updates: [
      'structural:data-spw-instrumentation',
      'structural:data-spw-prompt-copy-bound',
      'flourish:data-spw-wonder-block-state',
      'structural:data-prompt-preview-target',
    ],
    evaluates: 'prompt serialization copy utilities wonder blocks',
    timingArc: 'visible-lab',
    effectScope: 'local-dom clipboard',
    // promptability body token is pack-level; selector is the demand gate so
    // routes with prompt hosts outside design-lab packs still mount.
    load: () => import('../interface/prompt-utils.js'),
    mount: (mod) => {
      const fn = mod?.initSpwPromptUtils;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'experiential',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: 'header, main',
    rootMode: 'single',
    describes: 'gesture[tap|hold|swipe] spell[cauldron] learning[intuition]',
    updates: [
      'flourish:data-spw-interaction-hint',
      'inspect:data-spw-learning-note',
      'structural:data-spw-visual-anchor',
      'structural:data-spw-sample-kind',
    ],
    evaluates: 'gesture learning cauldron intuition',
    timingArc: 'enhance-spell',
    effectScope: 'listeners root-state bus',
    timingChunk: 'idle-residue',
    load: () => import('./experiential.js'),
    mount: (mod) => {
      const fn = mod?.initSpwExperiential;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'spells',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spell-board-content, header',
    rootMode: 'single',
    describes: 'spell[checkpoint|replay] grounding[serialization]',
    updates: [
      'residue:data-spw-spell',
      'residue:data-spw-grounded',
      'residue:data-spw-checkpoint',
    ],
    evaluates: 'checkpoint replay grounding spell path',
    timingArc: 'enhance-spell',
    effectScope: 'storage bus root-state',
    timingChunk: 'idle-residue',
    load: () => import('./spells.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSpells;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'guide',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    describes: 'guide[threshold|reason] subtle component guidance',
    updates: [
      'flourish:data-spw-guided',
      'inspect:data-spw-guide-reason',
      'structural:data-spw-guide-previous-liminality',
      'structural:data-spw-liminality',
    ],
    evaluates: 'component guidance grounded state threshold cues',
    timingArc: 'enhance-guide',
    timingChunk: 'idle-collectible',
    effectScope: 'element-state root-state',
    load: () => import('../interface/guide.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwGuide;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'layout-assumptions',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.SETTLED,
    selector: 'body',
    rootMode: 'single',
    describes: 'late layout alignment pass: module assumptions, compromises, refinements after runtime settle',
    updates: [
      'html:structural:data-spw-layout-assumptions-active',
      'html:inspect:data-spw-layout-assumptions-pass',
      'html:inspect:data-spw-layout-assumptions-compromises',
      'html:inspect:data-spw-layout-assumptions-refinements',
      'html:structural:data-spw-layout-correction',
      'html:structural:data-spw-layout-assumption-correction',
      'html:structural:data-spw-bottom-lane-handle',
      'html:structural:--spw-bottom-chrome-clearance',
    ],
    evaluates: 'layout alignment floating-chrome bottom-lane clearance module-settle',
    timingArc: 'after-all-settled',
    effectScope: 'root-state layout-correction observers floating-chrome',
    load: () => import('./layout-assumptions.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initLayoutAssumptions;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];
