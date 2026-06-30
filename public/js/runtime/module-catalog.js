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

const PRETEXT_LIVE_SELECTOR = '[data-spw-flow="pretext"][data-spw-pretext-live="true"]:not([data-spw-pretext-static])';

export const CORE_DEFS = [
  {
    id: 'site-settings',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    describes: 'root[data-spw-color-mode][data-spw-palette-resonance][data-spw-wonder-memory] settings surface',
    updates: ['data-spw-color-mode', 'data-spw-palette-resonance', 'data-spw-wonder-memory', 'data-spw-semantic-density', 'data-spw-operator-saturation'],
    timingArc: 'boot-core',
    effectScope: 'root-state storage settings',
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
    describes: 'pwa[install|update|offline] notification surface',
    updates: ['data-pwa-toast', 'data-pwa-toast-styles', 'data-spw-pwa-mode'],
    evaluates: 'service-worker lifecycle offline-readiness update-feedback',
    timingArc: 'boot-feedback',
    effectScope: 'service-worker root-state toast',
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
    describes: 'shell[nav|weather|attention-posture] disclosure defaults',
    updates: ['data-spw-menu-mode', 'data-spw-nav-fit', 'data-spw-shell-tune-surface', 'data-spw-attention-posture'],
    evaluates: 'chrome defaults viewport pointer attention-posture',
    timingArc: 'boot-shell',
    effectScope: 'root-state chrome listeners viewport',
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
    describes: 'minimal frame/mode/hash runtime defaults',
    updates: ['data-spw-lens-state', 'data-spw-active', 'data-spw-attention', 'data-spw-state-accent'],
    evaluates: 'frame lifecycle mode-switch hash-target calm-defaults',
    timingArc: 'boot-frame',
    effectScope: 'frame-state hash listeners bus',
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
    describes: 'blog[input.interpret] summary[tone|lens|questions]',
    updates: ['data-blog-state', 'data-blog-lens', 'data-blog-tone', 'data-count', 'data-spw-charge-key'],
    evaluates: 'blog interpretation writing workflow attention-register',
    load: () => import('../modules/blog/interpreter.js'),
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
    describes: 'blog[specimen] demo[theme|operator|observer|audio|filter]',
    updates: ['data-panel-open', 'data-theme', '--io-ratio'],
    evaluates: 'blog specimens interaction demos visual filters',
    load: () => import('../modules/blog/specimens.js'),
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
    describes: 'attention-register[charge|remove|clear] blog terms',
    updates: ['data-attn-register', 'data-attn-active', 'data-theme', 'aria-pressed'],
    evaluates: 'attention charge register blog semantics local interaction',
    load: () => import('../modules/blog/attn-register.js'),
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
    describes: 'seed-card[template|field|copy|screenshot] generator',
    updates: ['data-spw-region-flow', 'data-spw-state', 'data-state', 'data-filled', '--card-charge'],
    evaluates: 'seed generation card authoring screenshot utility',
    load: () => import('../modules/cards/seed-card.js'),
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
    describes: 'payment-card[method|amount|enabled] support routing',
    updates: ['data-spw-region-flow', 'data-spw-touch', 'data-method', 'data-amount'],
    evaluates: 'payment settings support routes local storage',
    load: () => import('../modules/cards/payment-card.js'),
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
    describes: 'services[configure|score|tier] offer visualization',
    updates: ['data-svc-state', 'data-svc-tier', 'data-svc-price-shift', 'data-svc-focus', '--svc-score'],
    evaluates: 'services offer fit pricing dimensions grounding',
    load: () => import('../modules/services/configurator.js'),
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
    describes: 'rpg-wednesday[mode|evidence|local-kit] gameplay helpers',
    updates: ['data-rpg-hydrated', 'data-rpg-gameplay-kit', 'data-spw-evidence-hydrated', 'data-spw-card-state'],
    evaluates: 'rpg gameplay local state evidence capture play surface',
    load: () => import('../modules/rpg-wednesday/index.js'),
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
    describes: 'settings[form|preset|deviation-register] local defaults UI',
    evaluates: 'settings defaults presets local-storage deviations',
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
    describes: 'settings[payment-methods] support option controls',
    updates: ['data-spw-region-flow'],
    evaluates: 'payment settings support defaults',
    load: () => import('../modules/cards/payment-card.js'),
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
    describes: 'home[section-index] filter[current|match] navigation',
    updates: ['data-home-section-filtered', 'data-home-section-match', 'data-home-section-current', 'aria-current'],
    evaluates: 'homepage navigation filtering section discovery',
    load: () => import('../modules/home/section-index.js'),
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
    describes: 'promo-wonder-cycle[daily|weekly] feed card rotation',
    updates: ['data-spw-cadence', 'data-spw-presentation', 'data-spw-promotion-kind', 'data-spw-region-flow'],
    evaluates: 'promo cadence wonder marketing media-publishing',
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
    describes: 'media-publishing[focus|collection] feed rendering',
    updates: ['data-spw-component-kind', 'data-spw-copy-unit', 'data-spw-locale', 'data-spw-cadence'],
    evaluates: 'media publishing feed localization website surface',
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
    load: () => import('../modules/media/cauldron.js'),
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
    describes: 'brace-pivot[setting-cycle] inline defaults control',
    updates: ['data-spw-pivot-value', 'data-spw-pivot-active'],
    evaluates: 'settings defaults brace interaction',
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
    describes: 'narrative[instrument.copy.tokens] resonance drawer',
    updates: ['data-spw-resonance-token', 'data-spw-resonance-probe', 'data-spw-resonant', 'data-spw-narrative-token'],
    evaluates: 'narrative copy semantics operator resonance',
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
    describes: 'brace[gesture|inspect|semantic-expansion] physics',
    updates: ['data-spw-brace-nesting', 'data-spw-handle-kind', 'data-spw-resolved-operator', 'data-spw-last-gesture', 'data-spw-pinned'],
    evaluates: 'gesture semantics brace inspectability spell capture',
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
    describes: 'region-menu[inspect|mark|focus] semantic popover',
    updates: ['data-spw-region-menu', 'data-spw-region-menu-target', 'data-spw-inspect-semantic-focus-root', 'data-spw-region-mark'],
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
    describes: 'pronunciation[operator|sigil] learning hints',
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
    describes: 'local-notes[draft|register|preview] browser memory',
    updates: ['data-local-note-count', 'data-local-note-preview', 'data-local-note-status', 'data-local-note-latest-time'],
    evaluates: 'local memory notes privacy browser storage',
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
    describes: 'boonhonk-mixer[operator-blend|memory-state] widget',
    updates: ['data-bhm-state', 'data-bhm-disposition', 'data-bhm-memory-state', 'data-spw-selection', '--boon'],
    evaluates: 'operator blending widget color memory',
    load: () => import('../modules/widgets/boonhonk-mixer.js'),
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
  {
    id: 'pretext-physics',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    features: ['pretext-lab'],
    selector: PRETEXT_LIVE_SELECTOR,
    rootMode: 'each',
    describes: 'pretext[measure.classify.signal] text[wrap-volatility.width-class] css[projection-vars]',
    updates: ['data-text-wrap', 'data-text-measure', 'data-text-width-class', 'data-spw-pretext-width-class', '--pretext-canonical-width', '--pretext-projected-width'],
    load: () => import('../semantic/pretext-physics.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initPretextPhysics;
      if (!isFn(fn) || !(root instanceof HTMLElement)) return;
      return fn({
        root,
        selector: PRETEXT_LIVE_SELECTOR,
        ornamentEnabled: false,
        rhythmEnabled: false,
        pointerProjectionEnabled: false,
      });
    },
  },
  {
    id: 'typography-measurement-preview',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    route: 'settings',
    features: ['pretext-lab'],
    selector: '#typography-measurement-preview',
    describes: 'settings[typography.measure.preview] pretext[bus.telemetry] designer[conversation.handoff]',
    updates: ['data-spw-typography-measure-state', 'data-spw-pretext-line-count', 'data-text-wrap', 'data-spw-measure-kind'],
    load: () => import('../modules/design/typography-measurement-preview.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initTypographyMeasurementPreview;
      if (!isFn(fn)) return;
      return fn(root);
    },
  },
  {
    id: 'frame-metrics',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    features: ['metrics'],
    selector: 'main',
    describes: 'frame[text.measure] site-frame[line-count.height.wrap] bus[pretext-measurement]',
    updates: ['data-spw-frame-line-count', 'data-spw-frame-wrap', 'data-spw-measure-kind', 'data-spw-measure-source'],
    load: () => import('./frame-metrics.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initFrameMetrics;
      if (!isFn(fn)) return;
      return fn(root);
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
    describes: 'region[profile.harmony.density] enhancement pass',
    updates: ['data-spw-enhanced', 'data-spw-motion-family', 'data-spw-harmony', 'data-spw-density', 'data-spw-region-genome'],
    evaluates: 'region lifecycle harmony density motion defaults',
    timingArc: 'region-hydration',
    effectScope: 'region-state css-vars bus',
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
    selector: 'body',
    rootMode: 'single',
    describes: 'page-wide layout stability observer with explicit cleanup of PerformanceObserver state and root datasets',
    updates: ['data-spw-layout-shift-state', 'data-spw-layout-shift-count', 'data-spw-layout-shift-total', 'data-spw-layout-shift-outcome'],
    evaluates: 'layout stability page-lifecycle diagnostics',
    timingArc: 'immediate-diagnostics',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-site-settings-scope], [data-spw-affordance="tune"], [data-spw-feature], .vibe-widget[data-spw-role="control"]',
    rootMode: 'single',
    describes: 'embedded tuning surfaces, component anatomy handles + html[data-spw-tuning-discoverability]',
    updates: [
      'data-spw-tuning-surface',
      'data-spw-tuning-surface-count',
      'data-spw-tuning-discoverability',
      'data-spw-embedded-tuning-host',
      'data-spw-embedded-tuning-count',
      'data-spw-embedded-tuning-present',
      'data-spw-embedded-tuning-dimensions',
    ],
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
    selector: 'main [id].site-frame, main [data-spw-region-role], main [data-spw-feature]',
    rootMode: 'single',
    describes: 'desktop region index from main semantics + html[data-spw-page-region-rail], refreshed through dom-sync teardown',
    updates: ['data-spw-page-region-rail', 'data-spw-region-active', 'data-spw-region-role', 'data-spw-feature'],
    evaluates: 'navigation region-discoverability component-discovery theme-readability',
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
    selector: '[data-spw-gesture-contract], [data-spw-slot], .spw-living-term[data-spw-living-term]',
    rootMode: 'single',
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
    selector: '[data-spw-feature], [data-spw-box-model], [data-spw-gesture-contract], [data-spw-slot]',
    rootMode: 'single',
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
    describes: 'svg[filters.defs] shared visual treatment',
    evaluates: 'svg surfaces filters texture visual enhancement',
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
    describes: 'svg[tune|pointer|query] responsive diagram controls',
    updates: ['data-spw-svg-pointer-state', 'data-spw-svg-device', '--spw-svg-pointer-x', '--spw-svg-pointer-intensity'],
    evaluates: 'svg tunability pointer query device responsiveness',
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
    describes: 'canvas-accent[wave|vortex|lattice] background resonance',
    updates: ['--spw-accent-strength', '--spw-accent-color-1', '--spw-accent-color-2'],
    evaluates: 'visual accents canvas resonance reduced-motion',
    timingArc: 'immediate-visual',
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
    describes: 'component-semantics[authored|resolved] role inference',
    updates: ['data-spw-component-kind', 'data-spw-role-resolved', 'data-spw-context-resolved', 'data-spw-composition-stability-resolved'],
    evaluates: 'component ontology authored-vs-inferred semantics',
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
    id: 'page-anatomy',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-anatomy], [data-spw-vocabulary]',
    rootMode: 'single',
    describes: 'page-anatomy[vocabulary]{focus.pin.reference}',
    updates: ['data-spw-anatomy-ready', 'data-spw-anatomy-focus', 'data-spw-anatomy-vocabulary', 'data-spw-anatomy-pinned'],
    evaluates: 'semantics interaction timing reference-document',
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
    selector: 'body',
    rootMode: 'single',
    describes: 'page-wide discovery notice layer for runtime rewards, with dismissal storage and escape/listener teardown',
    updates: ['data-spw-discovery-notice-stack', 'data-spw-discovery-notice-modal', 'data-spw-feature-learning'],
    evaluates: 'feedback discoverability reward-cadence floating-chrome',
    timingArc: 'immediate-feedback',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'body',
    rootMode: 'single',
    describes: 'state[satchel]{inspect.modify.serialize.feedback}',
    updates: ['data-spw-state-inspector', 'data-spw-state-serialization-dimensions', 'data-spw-debug-mode', 'data-spw-module-visuals', 'data-spw-show-semantic-metadata', 'data-spw-feature-learning'],
    evaluates: 'state accessibility layering interaction learnability',
    timingArc: 'immediate-inspection',
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
    describes: 'semantic-chrome[seam|label|metadata] component overlays',
    updates: ['data-spw-generated', 'data-spw-semantic-tagged', 'data-spw-semantic-seam'],
    evaluates: 'semantic chrome component labels inspectability',
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
    describes: 'contextual-ui[module-inference|route-discovery|nav-fit]',
    updates: ['data-spw-module', 'data-spw-route-discovery', 'data-spw-route-menu-state', 'data-spw-nav-fit'],
    evaluates: 'route discovery contextual navigation inferred modules',
    timingArc: 'immediate-context',
    effectScope: 'header-dom route-menu nav-fit',
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
    describes: 'design-experiments[rule|material|ecology|token] live lab',
    updates: ['data-design-material-mode', 'data-design-ecology', 'data-spw-design-ecology', 'data-design-meter-value'],
    evaluates: 'design lab material ecology tokens settings bundles',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'body[data-spw-page-role="asset-review"], body[data-spw-page-role="token-review"], body[data-spw-page-role="design-lab"]',
    rootMode: 'single',
    describes: 'design-review[asset|token|lab] constellation surfaces',
    updates: ['data-review-key', 'data-spw-svg-tune-motion'],
    evaluates: 'design review asset token lab navigation',
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
    ],
    timingArc: 'immediate-attention',
    effectScope: 'root-state section-state listeners css-vars',
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
    describes: 'annotation-layer[handle|region-match|active-section]',
    updates: ['data-spw-annotation', 'data-spw-annotation-state', 'data-spw-annotation-match', 'data-spw-annotation-source'],
    evaluates: 'annotation region matching section locomotion',
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
    describes: 'operators[sigil.detect.annotate] grammar projection',
    updates: ['data-spw-operator', 'data-spw-sigil', 'data-spw-sigil-prefix', 'data-spw-operator-resolved'],
    evaluates: 'operator grammar accessibility semantic projection',
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
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-memory-action]',
    rootMode: 'single',
    describes: 'local-memory-controls[reset|status] browser storage actions',
    updates: ['data-spw-local-memory-controls-init', 'data-spw-memory-status-timer'],
    evaluates: 'local storage reset privacy settings',
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
    updates: ['data-spw-instrumentation', 'data-spw-prompt-copy-bound', 'data-spw-wonder-block-state', 'data-prompt-preview-target'],
    evaluates: 'prompt serialization copy utilities wonder blocks',
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
    describes: 'guide[threshold|reason] subtle component guidance',
    updates: ['data-spw-guided', 'data-spw-guide-reason', 'data-spw-guide-previous-liminality', 'data-spw-liminality'],
    evaluates: 'component guidance grounded state threshold cues',
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
