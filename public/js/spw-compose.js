/**
 * Portable composition entrypoint.
 *
 * Import this when you want reusable Spw DOM helpers, palette utilities,
 * attention contracts, and interaction-loop records without booting the full
 * site runtime in /public/js/site.js.
 */

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
