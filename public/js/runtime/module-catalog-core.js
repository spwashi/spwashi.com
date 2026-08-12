/**
 * CORE_DEFS — staged runtime catalog family.
 * load() paths are relative to public/js/runtime/.
 */

import { COST_CLASS, isFn, MODULE_LAYERS, MOUNT_WHEN } from './module-catalog-constants.js';

export const CORE_DEFS = [
  {
    id: 'site-settings',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    describes: 'root[data-spw-color-mode][data-spw-palette-resonance][data-spw-wonder-memory] settings surface',
    updates: [
      'html:structural:data-spw-color-mode',
      'html:structural:data-spw-palette-resonance',
      'html:flourish:data-spw-wonder-memory',
      'html:structural:data-spw-semantic-density',
      'html:structural:data-spw-operator-saturation',
      'html:flourish:data-spw-reward-display',
    ],
    timingArc: 'boot-core',
    effectScope: 'root-state storage settings',
    evaluates: 'root color palette wonder density saturation reward display',
    load: () => import('../kernel/site-settings-engine.js'),
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
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    describes: 'pwa[install|update|offline] notification surface',
    updates: [
      'flourish:data-pwa-toast',
      'flourish:data-pwa-toast-styles',
      'structural:data-spw-pwa-mode',
    ],
    evaluates: 'service-worker lifecycle offline-readiness update-feedback',
    timingArc: 'boot-feedback',
    effectScope: 'service-worker root-state toast',
    load: () => import('./pwa-update-handler.js'),
  },
  {
    id: 'shell-disclosure',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    describes: 'shell[nav|weather|attention-posture] disclosure defaults',
    updates: [
      'structural:data-spw-menu-mode',
      'structural:data-spw-nav-fit',
      'structural:data-spw-shell-tune-surface',
      'structural:data-spw-attention-posture',
    ],
    evaluates: 'chrome defaults viewport pointer attention-posture',
    timingArc: 'boot-shell',
    effectScope: 'root-state chrome listeners viewport',
    load: () => import('./shell-disclosure.js'),
  },
  {
    id: 'interactive-medium',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    describes: 'medium[register|posture]{device|entertainment|module-tokens}',
    updates: [
      'structural:data-spw-medium-register',
      'structural:data-spw-interaction-posture',
      'structural:data-spw-medium-intensity',
      'structural:data-spw-interactive-medium-ready',
    ],
    evaluates: 'viewport-tier pointer-mode hover-mode scene/play register display-variant module-style-modulator',
    timingArc: 'boot-medium',
    effectScope: 'root-state css-vars entertainment-routes',
    load: () => import('./interactive-medium.js'),
  },
  {
    id: 'site-core-minimal',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    describes: 'minimal frame/mode/hash runtime defaults',
    updates: [
      'structural:data-spw-lens-state',
      'structural:data-spw-active',
      'structural:data-spw-attention',
      'flourish:data-spw-state-accent',
    ],
    evaluates: 'frame lifecycle mode-switch hash-target calm-defaults',
    timingArc: 'boot-frame',
    effectScope: 'frame-state hash listeners bus',
    load: () => import('./site-core-minimal.js'),
  },
];
