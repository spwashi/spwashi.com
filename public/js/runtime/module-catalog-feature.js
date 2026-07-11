/**
 * FEATURE_DEFS — staged runtime catalog family.
 * load() paths are relative to public/js/runtime/.
 */

import { isFn, MODULE_LAYERS, MOUNT_WHEN, PRETEXT_LIVE_SELECTOR } from './module-catalog-constants.js';

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
    timingArc: 'visible-feature',
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
    timingArc: 'visible-feature',
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
    timingArc: 'feature-route',
    effectScope: 'local-dom bus',
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
    timingArc: 'feature-route',
    effectScope: 'local-dom storage',
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
    timingArc: 'feature-route',
    effectScope: 'local-dom storage',
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
    timingArc: 'feature-route',
    effectScope: 'local-dom',
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
    timingArc: 'feature-route',
    effectScope: 'local-dom storage',
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
    evaluates: 'settings form presets deviation-register local defaults',
    timingArc: 'feature-route',
    effectScope: 'form storage root-state',
    updates: [
      'html:structural:data-spw-settings-ready',
      'html:inspect:data-spw-deviation-state',
      'html:inspect:data-spw-deviation-count',
    ],
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
    timingArc: 'feature-route',
    effectScope: 'local-dom storage',
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
    timingArc: 'feature-route',
    effectScope: 'local-dom',
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
    timingArc: 'visible-media',
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
    timingArc: 'visible-media',
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
    timingArc: 'visible-lab',
    evaluates: 'media cauldron attention relations prompt-pack generation',
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
    timingArc: 'immediate-settings',
    effectScope: 'local-dom root-state',
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
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-narrative-mode="on"]',
    rootMode: 'single',
    describes: 'narrative[instrument.copy.tokens] resonance drawer',
    updates: ['data-spw-resonance-token', 'data-spw-resonance-probe', 'data-spw-resonant', 'data-spw-narrative-token'],
    evaluates: 'narrative copy semantics operator resonance',
    timingArc: 'visible-semantics',
    effectScope: 'local-dom bus',
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
    timingArc: 'immediate-gesture',
    effectScope: 'element-state listeners bus',
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
    timingArc: 'immediate-inspect',
    effectScope: 'popover listeners',
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
    timingArc: 'enhance-learning',
    timingChunk: 'idle-lab',
    updates: [
      'inspect:data-spw-pronunciation-hint',
      'flourish:data-spw-operator-speech',
    ],
    load: () => import('../interface/pronunciation.js'),
    mount: (mod) => {
      const fn = mod?.initPronunciationHints;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'sigil-anatomy',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    features: ['operators'],
    selector: '.frame-sigil, .operator-chip, .syntax-token, .spw-delimiter, [data-spw-operator], [data-spw-sigil]',
    rootMode: 'single',
    describes: 'sigil-anatomy[hydrate] raw fused text -> sigil/operand elements',
    updates: ['data-spw-sigil-anatomy', 'data-spw-op'],
    evaluates: 'operator-grammar anatomy hydration capture-legibility',
    timingArc: 'immediate-grammar',
    effectScope: 'element-state',
    load: () => import('./sigil-anatomy.js'),
    mount: (mod) => {
      const fn = mod?.initSigilAnatomy;
      if (!isFn(fn)) return;
      const cleanup = fn();
      return { cleanup: isFn(cleanup) ? cleanup : null };
    },
  },
  {
    id: 'effect-ledger',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: 'html',
    rootMode: 'single',
    describes: 'effect-ledger[record|list|clear] precipitated literacy residue + flourish charge',
    updates: [
      'html:flourish:data-spw-effects',
      'html:flourish:data-spw-effect-pulse',
      'html:flourish:data-spw-effect-charge',
      'html:residue:data-spw-effect-ledger-count',
      'html:residue:data-spw-effect-ledger-last',
      'html:flourish:--spw-effect-count',
      'html:flourish:--spw-effect-charge',
      'html:flourish:--spw-effect-pulse',
      'residue:event:effect:recorded',
      'residue:event:effect:ledger-cleared',
    ],
    evaluates: 'named-effects recognition precipitation press-rung-1 flourish-residue',
    timingArc: 'enhance-ledger',
    timingChunk: 'idle-residue',
    effectScope: 'root-state storage bus flourish',
    load: () => import('./effect-ledger.js'),
    mount: (mod) => {
      const fn = mod?.initEffectLedger;
      if (!isFn(fn)) return;
      const cleanup = fn();
      return { cleanup: isFn(cleanup) ? cleanup : null };
    },
  },
  {
    id: 'cauldron',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    features: ['console'],
    describes: 'cauldron[gather|mix|garden] force[operator] emergence[composition]',
    updates: [
      'html:residue:data-spw-cauldron',
      'flourish:data-spw-cauldron-state',
      'structural:data-spw-cauldron-ingredient',
      'structural:data-spw-ingredient-phase',
      'structural:data-spw-semantic-expression',
    ],
    evaluates: 'semantics composition learning attention-field emergence',
    timingArc: 'enhance-collectible',
    timingChunk: 'idle-collectible',
    effectScope: 'storage bus floating-chrome root-state',
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
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-spw-local-note-entry], [data-spw-local-notes-root], [data-local-note-preview]',
    describes: 'local-notes[draft|register|preview] browser memory',
    updates: ['data-local-note-count', 'data-local-note-preview', 'data-local-note-status', 'data-local-note-latest-time'],
    evaluates: 'local memory notes privacy browser storage',
    timingArc: 'visible-memory',
    effectScope: 'local-dom storage',
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
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-boonhonk-mixer]',
    rootMode: 'single',
    describes: 'boonhonk-mixer[operator-blend|memory-state] widget',
    updates: ['data-bhm-state', 'data-bhm-disposition', 'data-bhm-memory-state', 'data-spw-selection', '--boon'],
    evaluates: 'operator blending widget color memory',
    timingArc: 'visible-widget',
    effectScope: 'local-dom',
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
    timingArc: 'visible-lab',
    evaluates: 'pretext layout sandbox projection observe resize inspect',
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
    timingArc: 'visible-lab',
    evaluates: 'pretext measure classify wrap-volatility width-class projection',
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
    timingArc: 'visible-lab',
    evaluates: 'typography measure preview pretext bus designer conversation',
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
    timingArc: 'visible-metrics',
    evaluates: 'frame text measure line-count wrap height pretext bus',
    load: () => import('./frame-metrics.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initFrameMetrics;
      if (!isFn(fn)) return;
      return fn(root);
    },
  },
];
