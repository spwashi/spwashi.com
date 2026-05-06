/**
 * Portable composition entrypoint.
 *
 * Import this when you want reusable Spw DOM helpers, palette utilities,
 * attention contracts, and interaction-loop records without booting the full
 * site runtime in /public/js/site.js.
 */

export const SPW_COMPOSITION_CONTRACT = Object.freeze({
  entrypoints: Object.freeze({
    css: '/public/css/spw-compose.css',
    js: '/public/js/spw-compose.js',
    siteCss: '/public/css/style.css',
    siteJs: '/public/js/site.js',
  }),
  metaphor: Object.freeze({
    browser: 'field',
    script: 'spell',
    stylesheet: 'disposition',
    markup: 'score',
  }),
  extensionParts: Object.freeze([
    'field tokens',
    'target selectors',
    'state attributes',
    'script gestures',
    'visible CSS result',
  ]),
  literateRule:
    'A portable behavior should name its field, target, gesture, and visible result before it asks another site to run it.',
  consoleRule:
    'A portable behavior should expose enough logging and snapshots for the browser console to explain what changed.',
  tuningRule:
    'If an attribute can change layout, expose the reason and the tuning knobs as data attributes.',
});

export {
  CORE_COMPONENT_SELECTORS,
  SURFACE_COMPONENT_SELECTORS,
  RELATION_COMPONENT_SELECTORS,
  SEMANTIC_ATTRIBUTE_SELECTORS,
  REGION_SELECTORS,
  COMPONENT_SELECTORS,
  MODULE_SELECTORS,
  SEMANTIC_CHROME_SELECTORS,
  COMPONENT_SELECTOR,
  MODULE_SELECTOR,
  REGION_SELECTOR,
  SEMANTIC_CHROME_SELECTOR,
  FRAME_SELECTOR,
  REGION_HOST_SELECTOR,
  SITE_TOPOGRAPHY,
  axisToken,
  buildAxisGenome,
  inferTopographyKind,
  normalizeTopographyToken,
  removeDatasetValues,
  writeDatasetValue,
  writeDatasetValueIfMissing,
  writeDatasetValues,
  writeStyleValue,
} from './kernel/spw-dom-contracts.js';

export {
  INTERACTION_LOOP_CONTRACT,
  IMAGE_REFRESH_EVENT,
  IMAGE_REFRESH_REASONS,
  LOOP_STATES,
  LOOP_TOKENS,
  createLoopRecord,
  dispatchImageRefresh,
  formatLoopFieldValue,
  formatLoopLabel,
  getImageRefreshTransition,
  getLoopTiming,
  readDurationMs,
} from './runtime/spw-interaction-loop.js';

export {
  ATTENTION_ARCHITECTURE_CONTRACT,
  initSpwAttentionArchitecture,
} from './runtime/spw-attention-architecture.js';

export {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteResonanceSwatches,
  getPaletteResonanceTokens,
  normalizePaletteResonance,
} from './interface/spw-palette-resonance.js';

export {
  SPW_INSTRUMENTATION_CONTRACT,
  SPW_LOG_LEVELS,
  SPW_LOG_RELATIONSHIPS,
  SPW_REFLOW_REASONS,
  applySpwQueryDisposition,
  createSpwLogger,
  installSpwCompositionConsole,
  markInstrumented,
  markReflowReason,
  parseSpwQueryDisposition,
  snapshotInstrumentationTarget,
  writeTuningAttributes,
} from './kernel/spw-instrumentation.js';
