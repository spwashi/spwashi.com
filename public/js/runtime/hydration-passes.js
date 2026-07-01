/**
 * hydration-passes.js
 * ---------------------------------------------------------------------------
 * Documents and surfaces multi-pass hydration aligned with workbench runtime
 * phases (lex → semantic → pragmatic). Kernel hydration.js owns state; this
 * module narrates pass timing for CSS, spells, and inspectors.
 */

import {
  HYDRATION_PASSES,
  HYDRATION_STATES,
  SPW_HYDRATION_CONTRACT,
  getCurrentHydrationState,
} from '/public/js/kernel/hydration.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

const PASS_MOMENTUM_MS = 520;

let initialized = false;
let momentumTimer = 0;

function syncHydrationPassSurface(detail = {}) {
  const html = document.documentElement;
  const pass = detail.pass || html.dataset.spwHydrationPass || HYDRATION_PASSES.LEX;
  const state = detail.state || getCurrentHydrationState();

  writeDatasetValue(html, 'spwHydrationPass', pass);
  writeDatasetValue(html, 'spwHydrationPassState', state);
  writeDatasetValue(html, 'spwHydrationPassMomentum', 'active');

  if (momentumTimer) window.clearTimeout(momentumTimer);
  momentumTimer = window.setTimeout(() => {
    delete html.dataset.spwHydrationPassMomentum;
  }, PASS_MOMENTUM_MS);

  return { pass, state };
}

export const SPW_HYDRATION_PASSES_CONTRACT = Object.freeze({
  ...SPW_HYDRATION_CONTRACT,
  attributes: Object.freeze({
    pass: 'data-spw-hydration-pass',
    passState: 'data-spw-hydration-pass-state',
    passMomentum: 'data-spw-hydration-pass-momentum',
  }),
  workbenchAlignment: Object.freeze({
    lex: 'authored hypermedia HTML — static first paint',
    semantic: 'operator/sigil annotation, measure, packing projection',
    pragmatic: 'interactive spells, settings momentum, grounded replay',
  }),
});

export function initHydrationPasses(ctx) {
  if (initialized) return () => {};
  initialized = true;

  syncHydrationPassSurface({
    pass: document.documentElement.dataset.spwHydrationPass,
    state: getCurrentHydrationState(),
  });

  const onPass = (event) => {
    const payload = syncHydrationPassSurface(event?.detail || {});
    ctx?.bus?.emit?.(SPW_HYDRATION_CONTRACT.events.pass, payload);
  };

  document.addEventListener(SPW_HYDRATION_CONTRACT.events.pass, onPass);

  return () => {
    document.removeEventListener(SPW_HYDRATION_CONTRACT.events.pass, onPass);
    if (momentumTimer) window.clearTimeout(momentumTimer);
    momentumTimer = 0;
    const html = document.documentElement;
    delete html.dataset.spwHydrationPassState;
    delete html.dataset.spwHydrationPassMomentum;
    initialized = false;
  };
}