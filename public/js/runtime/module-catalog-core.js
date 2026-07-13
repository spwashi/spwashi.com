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
      'data-spw-color-mode',
      'data-spw-palette-resonance',
      'data-spw-wonder-memory',
      'data-spw-semantic-density',
      'data-spw-operator-saturation',
      'data-spw-reward-display',
    ],
    timingArc: 'boot-core',
    effectScope: 'root-state storage settings',
    evaluates: 'root color palette wonder density saturation reward display',
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
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
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
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
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
    id: 'interactive-medium',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
    describes: 'medium[register|posture]{device|entertainment|module-tokens}',
    updates: [
      'data-spw-medium-register',
      'data-spw-interaction-posture',
      'data-spw-medium-intensity',
      'data-spw-interactive-medium-ready',
    ],
    evaluates: 'viewport-tier pointer-mode hover-mode scene/play register display-variant module-style-modulator',
    timingArc: 'boot-medium',
    effectScope: 'root-state css-vars entertainment-routes',
    load: () => import('./interactive-medium.js'),
    mount: (mod) => {
      const fn = mod?.initInteractiveMedium;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'site-core-minimal',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    costClass: COST_CLASS.PREMATURE_COMMITMENT,
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
