/**
 * Runtime module catalog for the staged site bootstrap.
 */

import { REGION_SELECTOR } from '../kernel/dom-contracts.js';
import { isFn } from './runtime-helpers.js';

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
});

export const CORE_DEFS = [
  {
    id: 'site-settings',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    describes: 'root[data-spw-color-mode][data-spw-palette-resonance][data-spw-wonder-memory] settings surface',
    updates: ['data-spw-color-mode', 'data-spw-palette-resonance', 'data-spw-wonder-memory', 'data-spw-semantic-density', 'data-spw-operator-saturation'],
    load: () => import('../kernel/site-settings.js'),
    mount: (mod) => {
      const fn = mod?.applySiteSettings;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'pwa-update-handler',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./pwa-update-handler.js'),
    mount: (mod) => {
      const fn = mod?.initPwaUpdateHandler;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'shell-disclosure',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./shell-disclosure.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwShellDisclosure;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'site-core-minimal',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./site-core-minimal.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initMinimalSiteCore;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

export const FEATURE_DEFS = [
  {
    id: 'blog-interpreter',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-blog-interpreter]',
    route: 'blog',
    rootMode: 'each',
    load: () => import('../modules/blog-interpreter.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initBlogInterpreter;
      if (!isFn(fn)) return;
      return fn({ ...ctx, root });
    },
  },
  {
    id: 'blog-specimens',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.specimen-card, #specimen-index',
    route: 'blog',
    rootMode: 'single',
    load: () => import('../modules/blog-specimens.js'),
    mount: (mod) => {
      const fn = mod?.initBlogSpecimens;
      if (!isFn(fn)) return;
      return fn(document.querySelector('main') || document);
    },
  },
  {
    id: 'attn-register',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'blog',
    selector: '[data-blog-interpreter], #specimen-index',
    load: () => import('../modules/attn-register.js'),
    mount: (mod) => {
      const fn = mod?.initAttnRegister;
      if (!isFn(fn)) return;
      return fn(document.querySelector('main') || document);
    },
  },
  {
    id: 'seed-cards',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: ['services', 'newyear'],
    selector: '[data-seed-card]',
    load: () => import('../modules/seed-card.js'),
    mount: (mod) => {
      const fn = mod?.initSeedCards;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'payment-cards',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'services',
    selector: '[data-payment-card]',
    load: () => import('../modules/payment-card.js'),
    mount: (mod) => {
      const fn = mod?.initPaymentCards;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'services-configurators',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'services',
    selector: '[data-services-configurator]',
    load: () => import('../modules/services-configurator.js'),
    mount: (mod) => {
      const fn = mod?.initServicesConfigurators;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'rpg-wednesday',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    features: ['rpg-gameplay'],
    route: 'rpg-wednesday',
    selector: 'main',
    load: () => import('../modules/rpg-wednesday.js'),
    mount: (mod) => {
      const fn = mod?.initRpgWednesday;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'settings-page',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'settings',
    selector: '[data-spw-surface="settings"], main',
    load: () => import('../kernel/site-settings.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSiteSettingsPage;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'payment-settings',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'settings',
    selector: '#payment-settings-container',
    load: () => import('../modules/payment-card.js'),
    mount: (mod) => {
      const fn = mod?.initPaymentSettings;
      if (!isFn(fn)) return;
      return fn(document.getElementById('payment-settings-container'));
    },
  },
  {
    id: 'home-section-index',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'home',
    selector: '[data-home-section-index]',
    load: () => import('../modules/home-section-index.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initHomeSectionIndex;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'promo-wonder-cycle',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    features: ['media-publishing'],
    route: 'home',
    selector: '[data-promo-wonder-cycle]',
    load: () => import('../typed/promo-wonder-cycle.js'),
    mount: (mod) => {
      const fn = mod?.initPromoWonderCycle;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'media-publishing',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    features: ['media-publishing'],
    route: 'website',
    selector: '[data-media-focus], [data-media-collection]',
    load: () => import('../typed/media-publishing.js'),
    mount: (mod) => {
      const fn = mod?.initMediaPublishing;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'media-cauldron',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    features: ['console'],
    selector: '[data-media-cauldron]',
    rootMode: 'each',
    describes: 'media-cauldron[prime.select.generate] attention[self+local+global] artifact[prompt-pack]',
    updates: ['data-media-cauldron-state', 'data-media-cauldron-output', 'data-spw-attention-self-relation', 'data-spw-attention-local-relation', 'data-spw-attention-global-relation'],
    load: () => import('../modules/media-cauldron.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initMediaCauldron;
      if (!isFn(fn)) return;
      return fn(root, ctx);
    },
  },
  {
    id: 'brace-pivots',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-pivot]',
    load: () => import('./brace-pivots.js'),
    mount: (mod) => {
      const fn = mod?.initBracePivots;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'narrative-instrumentation',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-narrative-mode="on"]',
    rootMode: 'single',
    load: () => import('../semantic/narrative-instrumentation.js'),
    mount: (mod) => {
      const fn = mod?.initNarrativeInstrumentation;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'brace-physics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-form="brace"], .spw-delimiter, .frame-sigil, [data-spw-semantic-expression]',
    rootMode: 'single',
    load: () => import('./brace-gestures.js'),
    mount: (mod) => {
      const fn = mod?.initBraceGestures;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'region-menu',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.spw-delimiter, .frame-sigil, .operator-chip, [data-spw-semantic-expression]',
    rootMode: 'single',
    evaluates: 'semantics navigation interaction region-menu',
    load: () => import('./region-menu.js'),
    mount: (mod) => {
      const fn = mod?.initSpwRegionMenu;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'pronunciation-hints',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.frame-sigil, .operator-chip, .syntax-token, .spw-delimiter',
    rootMode: 'single',
    evaluates: 'semantics learning interaction',
    load: () => import('../interface/pronunciation.js'),
    mount: (mod) => {
      const fn = mod?.initPronunciationHints;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'cauldron',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    features: ['console'],
    describes: 'cauldron[gather|mix|garden] force[operator] emergence[composition]',
    updates: ['data-spw-cauldron', 'data-spw-cauldron-phase', 'data-spw-cauldron-count', 'data-spw-cauldron-ingredient', 'data-spw-ingredient-phase', 'data-spw-semantic-expression'],
    evaluates: 'semantics composition learning attention-field emergence',
    load: () => import('../interface/composition.js'),
    mount: (mod) => {
      const fn = mod?.initCauldron || mod?.initCompositionSpell;
      if (!isFn(fn)) return;
      const cleanup = fn();
      return {
        cleanup: isFn(cleanup) ? cleanup : null,
        refresh: mod?.refreshCauldronState,
      };
    },
  },
  {
    id: 'local-notes',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-local-note-entry], [data-spw-local-notes-root], [data-local-note-preview]',
    load: () => import('../interface/local-notes.js'),
    mount: (mod) => {
      const fn = mod?.initSpwLocalNotes;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'boonhonk-mixer',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-boonhonk-mixer]',
    rootMode: 'single',
    load: () => import('../modules/boonhonk-mixer.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initBoonhonkMixers;
      if (!isFn(fn)) return;
      return fn(ctx?.root || document);
    },
  },
  {
    id: 'pretext-lab',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    features: ['pretext-lab'],
    selector: '#pretext-input, .pretext-lab-grid',
    describes: 'pretext[layout|sandbox|projection] lab[observe|resize|inspect]',
    updates: ['data-spw-flow', 'data-text-wrap', 'data-text-mode'],
    load: () => import('../semantic/pretext-lab.js'),
    mount: (mod) => {
      const fn = mod?.initPretextLab;
      if (!isFn(fn)) return;
      return fn();
    },
  },
];

export const REGION_DEFS = [
  {
    id: 'region-enhancer',
    layer: MODULE_LAYERS.REGION,
    when: MOUNT_WHEN.REGION,
    selector: REGION_SELECTOR,
    rootMode: 'each',
    load: () => import('./region-enhancer.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initRegionEnhancer;
      if (!isFn(fn)) return;
      return fn(ctx, root);
    },
  },
];

export const ENHANCEMENT_DEFS = [
  {
    id: 'layout-shift-audit',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
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
    when: MOUNT_WHEN.IMMEDIATE,
    describes: 'embedded tuning surfaces marginalia + html[data-spw-tuning-discoverability]',
    updates: ['data-spw-tuning-surface', 'data-spw-tuning-surface-count', 'data-spw-tuning-discoverability'],
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
    describes: 'desktop region index from main semantics + html[data-spw-page-region-rail]',
    updates: ['data-spw-page-region-rail', 'data-spw-region-active'],
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
    describes: 'charge/discharge field state on html + frame consequence-live projection',
    updates: [
      'data-spw-charge-field',
      'data-spw-charge-intensity',
      'data-spw-last-discharge',
      'data-spw-charge-carrier',
      'data-spw-consequence-live',
      'data-spw-discharge-kind',
    ],
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
    when: MOUNT_WHEN.IMMEDIATE,
    describes: 'slot anatomy rails + data-spw-gesture-hint from gesture contracts',
    updates: ['data-spw-gesture-hint', 'data-spw-slot-label', 'data-spw-gesture-anatomy'],
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
    when: MOUNT_WHEN.IMMEDIATE,
    describes: 'metacognitive posture accounting, layout-contract audit, feature learnability resonance',
    updates: [
      'data-spw-learnability-ledger',
      'data-spw-learnability-posture',
      'data-spw-layout-contract',
      'data-spw-learnability-tier',
    ],
    load: () => import('./learnability-ledger.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initLearnabilityLedger;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'observation-beats',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    debugOnly: true,  // Enhanced gating via shouldScheduleDefinition + ctx.debug
    describes: 'beat[window] qa[observation] lifecycle[page+region+component+cauldron] consequence[traceable]',
    updates: ['data-spw-active-beat', 'data-spw-active-beat-state', 'data-spw-last-beat-id', 'data-spw-module-consequence'],
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
    selector: '[data-spw-svg-host], .spw-svg-figure[data-spw-svg-pointer]',
    rootMode: 'single',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-accent]',
    rootMode: 'single',
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
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-box-model], [data-spw-composition-flow], [data-site-settings-panel], body[data-spw-surface="settings"] .settings-fieldset',
    rootMode: 'single',
    describes: 'box-model[presence|measure|story] composition[flow]',
    updates: ['data-spw-box-model', 'data-spw-box-presence', 'data-spw-box-measure', 'data-spw-box-story', 'data-spw-composition-flow', 'data-spw-box-settle-phase', 'data-spw-size-context', 'data-spw-content-tone'],
    evaluates: 'layout semantics spacing-semantics state storytelling',
    load: () => import('./composition-box-model.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwCompositionBoxModel;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'semantic-crossrefs',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-semantic-cluster], [data-spw-vocab], [data-spw-semantic-expression], [data-spw-topic], .spw-topic',
    rootMode: 'single',
    describes: 'crossref[semantics] resonance[peer|source]',
    updates: ['data-spw-crossref', 'data-spw-crossref-source', 'data-spw-semantic-cluster', 'data-spw-vocab'],
    evaluates: 'semantics navigation interaction resonance',
    load: () => import('../semantic/semantic-crossrefs.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwSemanticCrossrefs;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'ingredient-lab',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-ingredient-lab]',
    rootMode: 'single',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.operator-chip, .frame-sigil, .frame-card-sigil, .spec-pill, [data-spw-guide-badge]',
    rootMode: 'single',
    describes: 'guide[badge|collect] operator[resonance]',
    updates: ['data-spw-guide-badge', 'data-spw-collected'],
    load: () => import('../interface/guide-badge.js'),
    mount: (mod) => {
      const fn = mod?.initGuideBadges;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'discovery-notices',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
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
    when: MOUNT_WHEN.IMMEDIATE,
    rootMode: 'single',
    describes: 'state[satchel]{inspect.modify.serialize.feedback}',
    updates: ['data-spw-state-inspector', 'data-spw-state-serialization-dimensions', 'data-spw-debug-mode', 'data-spw-module-visuals', 'data-spw-show-semantic-metadata', 'data-spw-feature-learning'],
    evaluates: 'state accessibility layering interaction learnability',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-image-reward], [data-spw-image-discovery]',
    rootMode: 'single',
    describes: 'image[discovery]{reward.notice.cadence.production}',
    updates: ['data-spw-image-discovery-state', 'data-spw-image-discovered', 'data-spw-discovery-cadence', 'data-spw-discovery-motion', 'data-spw-discovery-production'],
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
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
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
    selector: 'main, .site-header',
    rootMode: 'single',
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
    features: ['console'],
    selector: 'body',
    rootMode: 'single',
    describes: 'console[frame|mode|bus|layout] diagnostics[screenshot]',
    updates: ['data-spw-console-state'],
    evaluates: 'debuggability layout-shift interaction frame-state',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-design-experiments-root]',
    rootMode: 'single',
    load: () => import('../modules/design-experiments.js'),
    mount: (mod) => {
      const fn = mod?.initDesignExperiments;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'design-review-surfaces',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'body[data-spw-page-role="asset-review"], body[data-spw-page-role="token-review"], body[data-spw-page-role="design-lab"]',
    rootMode: 'single',
    load: () => import('../modules/design-review-surfaces.js'),
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
    selector: 'main, .spw-section-handle, [data-spw-operator]',
    rootMode: 'single',
    describes: 'attention[resonance|field-intensity|section-handle] operators',
    updates: ['data-spw-resonance-probe', 'data-spw-section-handle', 'data-spw-grounded', 'data-spw-attention'],
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-annotation-handle], [data-spw-header-annotation]',
    rootMode: 'single',
    load: () => import('./annotation-layer.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwAnnotationLayer;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'navigation-spells',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'header nav a[href], .site-header nav a[href], body > header nav a[href], .site-footer__nav a[href], .page-index a[href], .card-sub-links a[href], .frame-operators a[href]',
    rootMode: 'single',
    describes: 'navigation[spell|grounding] route[replay]',
    updates: ['data-spw-spell-path', 'data-spw-grounded-in'],
    load: () => import('./navigation-spells.js'),
    mount: (mod) => {
      const fn = mod?.initSpwNavigationSpells;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'operators',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.frame-sigil, .frame-card-sigil, .syntax-token',
    rootMode: 'single',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-groundable=\"true\"], [data-spw-living-term], [data-spw-concept], [data-spw-cauldron-candidate], .spw-living-term, .operator-chip, .syntax-token, .frame-sigil',
    rootMode: 'single',
    describes: 'grounding[collection|resonance] spell[grounded|checkpoint]',
    updates: ['data-spw-grounded', 'data-spw-collected', 'data-spw-prime-state', 'data-spw-collection-strength', 'data-spw-grounded-wonder'],
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-memory-action]',
    rootMode: 'single',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-promptability="visible"], [data-spw-prompt-host]',
    rootMode: 'single',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'header, main',
    rootMode: 'single',
    describes: 'gesture[tap|hold|swipe] spell[cauldron] learning[intuition]',
    updates: ['data-spw-interaction-hint', 'data-spw-learning-note', 'data-spw-visual-anchor', 'data-spw-sample-kind'],
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.spell-board-content, header',
    rootMode: 'single',
    describes: 'spell[checkpoint|replay] grounding[serialization]',
    updates: ['data-spw-spell', 'data-spw-grounded', 'data-spw-checkpoint'],
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
    load: () => import('../interface/guide.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwGuide;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];


export function filterEnhancementDefs(defs, includeLayoutAudit = true) {
  if (includeLayoutAudit) return defs;
  return defs.filter((def) => def?.id !== 'layout-shift-audit');
}

export const MODULE_DEFS = [
  ...CORE_DEFS,
  ...FEATURE_DEFS,
  ...REGION_DEFS,
  ...ENHANCEMENT_DEFS,
];
