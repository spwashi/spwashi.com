/**
 * Portable composition entrypoint.
 *
 * Import this when you want reusable Spw DOM helpers, palette utilities,
 * attention contracts, and interaction-loop records without booting the full
 * site runtime in /public/js/site.js.
 */

export const SPW_COMPOSITION_CONTRACT = Object.freeze({
  entrypoints: Object.freeze({
    css: '/public/css/compose.css',
    js: '/public/js/compose.js',
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
    'palette reasons',
    'SVG interpretation hooks',
  ]),
  literateRule:
    'A portable behavior should name its field, target, gesture, and visible result before it asks another site to run it.',
  consoleRule:
    'A portable behavior should expose enough logging and snapshots for the browser console to explain what changed.',
  tuningRule:
    'If an attribute can change layout, expose the reason and the tuning knobs as data attributes.',
});

export {
  HYDRATION_STATES,
  SKELETON_ROLES,
  SPW_DOM_RENDER_CONTRACT,
  cleanText,
  clearChildren,
  createElement,
  createJsonFeedLoader,
  createSkeleton,
  el,
  escapeAttr,
  escapeHtml,
  fragment,
  appendToDocument,
  getDocumentAppendHost,
  guardCall,
  hydrateHost,
  interpolateTemplate,
  normalizeError,
  replaceChildren,
  reportRenderError,
  runSafe,
  setHydrationState,
  setTrustedHtml,
} from './kernel/dom-render.js';

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
} from './kernel/dom-contracts.js';

export {
  cancelIdle,
  createRegistry,
  describeRuntimePolicy,
  inferRuntimePosture,
  isFn,
  normalizeRuntimeToken,
  normalizeMountHandle,
  onIdle,
  once,
  matchesFeatures,
  normalizeFeatureRequirements,
  parseFeatureList,
  readDelimitedSet,
  readModuleTimingMap,
  readRuntimePolicy,
  safeQuery,
  safeQueryAll,
  whenDocumentReady,
  whenWindowLoaded,
  SPW_RUNTIME_HELPERS_CONTRACT,
} from './runtime/runtime-helpers.js';

export {
  PAGE_ARRIVAL,
  PAGE_ATTENTION_EVENT,
  PAGE_PRESENCE,
  PAGE_STATES,
  PAGE_TRANSITION_EVENT,
  SPW_PAGE_STATE_CONTRACT,
  annotateFloatingChrome,
  clearPageAttentionSequence,
  clearPageState,
  describePageStateSnapshot,
  initPageAttentionLifecycle,
  schedulePageArrival,
  setPageAttentionState,
  setPageState,
  snapshotPageState,
} from './runtime/page-state.js';

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
} from './runtime/interaction-loop.js';

export {
  SPW_COMPOSITION_BOX_MODEL_CONTRACT,
  annotateCompositionBox,
  annotateCompositionBoxes,
  initSpwCompositionBoxModel,
  snapshotCompositionBox,
  snapshotCompositionBoxes,
} from './runtime/composition-box-model.js';

export {
  SPW_LAYOUT_QA_CONTRACT,
  evaluateLookFeel,
  inspectLayoutTarget,
  layoutQaRecipes,
  snapshotLayoutQa,
  snapshotPacking,
  snapshotPageSizing,
  summarizeLayoutQa,
} from './runtime/layout-qa.js';

export {
  snapshotLayoutAssumptions,
  SPW_LAYOUT_ASSUMPTIONS_CONTRACT,
} from './runtime/layout-assumptions.js';

export {
  SPW_DEBUG_QA_CONTRACT,
  SPW_DEBUG_QA_PRESETS,
  applyDebugQaPostureToRoot,
  describeDebugQaPosture,
  hasAgentQa,
  hasDebugOrQAMode,
  hasLayoutDebug,
  readDebugQaPosture,
} from './runtime/debug-qa-posture.js';

export {
  ATTENTION_ARCHITECTURE_CONTRACT,
  describeAttentionArchitecture,
  initPinchTextScale,
  initReadingGroove,
  initResonanceProbe,
  initScrollCadenceState,
  initSectionHandle,
  initSpwAttentionArchitecture,
} from './runtime/attention-architecture.js';

export {
  PAGE_HOOK_SELECTOR,
  PAGE_HOOK_STATES,
  SPW_PAGE_HOOK_CONTRACT,
  annotatePageHooks,
  describePageHook,
  focusPageHook,
  listPageHooks,
  pulsePageHook,
  resolvePageHook,
  setPageHookState,
  snapshotPageHooks,
} from './runtime/page-hooks.js';

export {
  SPW_NARRATIVE_INSTRUMENTATION_CONTRACT,
  initNarrativeInstrumentation,
} from './semantic/narrative-instrumentation.js';

export {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteResonanceSwatches,
  getPaletteResonanceTokens,
  normalizePaletteResonance,
} from './interface/palette-resonance.js';

export {
  SPW_INSTRUMENTATION_CONTRACT,
  SPW_LOG_LEVELS,
  SPW_LOG_RELATIONSHIPS,
  SPW_QUERY_ALIASES,
  SPW_QUERY_CONTRACT,
  SPW_QUERY_PRESETS,
  SPW_REFLOW_REASONS,
  announceSpwConsoleSurface,
  applySpwQueryDisposition,
  createSpwQueryContract,
  createSpwLogger,
  installSpwCompositionConsole,
  markInstrumented,
  markReflowReason,
  parseSpwQueryDisposition,
  readConsoleLogBuffer,
  snapshotSpwQueryState,
  snapshotInstrumentationTarget,
  writeTuningAttributes,
} from './kernel/instrumentation.js';

export {
  SPW_QUERY_LEGACY_ALIASES,
  SPW_QUERY_SHORT_KEYS,
  SPW_QUERY_CANONICAL_ORDER,
  composeSpwQuery,
  serializeSpwQuery,
  parseModularQuery,
  buildSpwQueryHref,
  normalizeQuerySearch,
  expandQueryParams,
} from './kernel/query-composer.js';

export {
  SPW_SVG_PALETTES,
  SPW_SVG_TUNABILITY_CONTRACT,
  applySvgQueryTunability,
  applySvgTunability,
  initSpwSvgTunability,
  parseSvgTunabilitySearch,
  serializeSvgTunability,
} from './media/svg-tunability.js';

export {
  COST_CLASS,
  COST_COMMITMENT,
  COST_COPY,
  COST_SPEND,
  MODULE_LAYERS,
  MOUNT_WHEN,
  costClassFromModel,
  describeModuleCost,
  filterEnhancementDefs,
  inferModuleCost,
  listModuleCatalogIndex,
  summarizeModuleCatalogOptimization,
} from './runtime/module-catalog.js';

export {
  MODULE_TIMING_STAGES,
  SPW_MODULE_LOADER_CONTRACT,
  createModuleLoader,
} from './runtime/module-loader.js';

export {
  MODULE_DESCRIBES_GRADES,
  SPW_MODULE_DESCRIBES_CONTRACT,
  annotateModuleDescribesTarget,
  describeModuleDescribes,
  formatModuleDescribesSpell,
  parseModuleDescribes,
} from './runtime/module-describes-contract.js';

export {
  SPW_MODULE_UPDATES_CONTRACT,
  annotateModuleUpdatesTarget,
  buildModuleUpdatesIndex,
  classifyModuleUpdate,
  coerceModuleUpdates,
  describeModuleUpdates,
  findModuleUpdateConflicts,
  findModuleUpdateOwners,
  formatModuleUpdatesBrief,
  formatModuleUpdatesReadable,
  formatModuleUpdatesSpell,
  mergeModuleUpdates,
  normalizeModuleUpdates,
  readModuleUpdatesFromTarget,
  summarizeModuleUpdates,
  validateModuleUpdateToken,
} from './runtime/module-updates-contract.js';

export {
  SPW_MODULE_EXPORT_CONTRACT,
  SPW_MODULE_EXPORT_SHAPE,
  createModuleExport,
  describeModuleExport,
  resolveModuleMount,
} from './runtime/module-export-contract.js';

export {
  BEHAVIOR_SCOPE_BUNDLES,
  BEHAVIOR_SCOPE_KEYS,
  SPW_BEHAVIOR_SCOPES_CONTRACT,
} from './runtime/behavior-scopes.js';

export {
  QUERY_COMPOSER_INSTRUMENTS,
  QUERY_COMPOSER_SELECTOR,
  SPW_QUERY_COMPOSER_CONTRACT,
  bindQueryComposers,
  buildQueryComposerHref,
  buildQueryComposerSearch,
  createQueryComposerElement,
  hydrateQueryComposer,
  initQueryLinkComposer,
  syncQueryComposer,
} from './runtime/query-link-composer.js';

export {
  GESTURE_SPELL_SEEDS,
  GESTURE_VOCABULARY,
  SPW_GESTURE_CONTRACT,
  collectRelatedRouteSamples,
  describeComponentSample,
  describeCurrentPageSample,
  describeGestureContract,
  describeGestureTarget,
  snapshotFeatureClusters,
  snapshotGestureTargets,
} from './runtime/gesture-contract.js';

export {
  REGION_STATES,
  SPW_REGION_PROFILER_CONTRACT,
  describeRegionProfile,
  primeRegions,
  refreshRegionProfiles,
  setRegionState,
} from './runtime/region-profiler.js';

export {
  SEAT_COMPLEMENT,
  OPERATOR_COMPLEMENT,
  KIN_MOVES,
  KIN_CYCLE,
  SPW_REGION_KIN_CONTRACT,
  classifyRegionRelation,
  describeRegionKin,
  pickKinLabel,
  pickRegionKin,
  nextKinRelation,
} from './runtime/region-kin.js';

export {
  SPW_PHYSICAL_MODEL_CONTRACT,
  describePhysicalModelSummary,
  snapshotPhysicalModel,
} from './runtime/physical-model.js';

export {
  SPW_CHARGE_FIELD_CONTRACT,
  describeChargeFieldState,
  initChargeField,
  unmountChargeField,
} from './runtime/charge-field.js';

export {
  SPW_PULSE_BEAT_TUNER_CONTRACT,
  describePulseBeatTunerState,
  readMicrointeractionPulseMs,
} from './runtime/pulse-beat-tuner.js';

export {
  SPW_WONDER_MEMORY_CONTRACT,
  describeWonderMemorySnapshot,
} from './interface/wonder-memory.js';

export {
  DEVELOPMENTAL_CLIMATES,
  SPW_DEVELOPMENTAL_CLIMATE_CONTRACT,
  applyDevelopmentalClimate,
  describeDevelopmentalClimate,
  normalizeDevelopmentalClimate,
} from './interface/developmental-climate.js';

export {
  SPW_CANVAS_ACCENTS_CONTRACT,
  describeCanvasAccentInstance,
} from './interface/canvas-accents.js';

export {
  SPW_HERO_KINETIC_STAGE_CONTRACT,
} from './runtime/spw-hero-kinetic-stage.js';

export {
  SPW_ROLE_INFERENCE_CONTRACT,
  collectAnnotationRegions,
  collectRegions,
  inferRegionContext,
  inferRegionKind,
  inferRegionRole,
} from './semantic/role-inference.js';

export {
  ANNOTATION_LAYER_REGION_SELECTOR,
  ANNOTATION_LAYER_REGION_SELECTORS,
} from './kernel/dom-contracts.js';

export {
  SPW_DIMENSIONAL_ASCENT,
  SPW_DIMENSIONAL_EDGES,
  SPW_EXPRESSION_GEOMETRY_CONTRACT,
  describeSpwDimensionality,
  describeSpwExpression,
  parseSpwExpression,
  scanSpwExpression,
} from './semantic/spw-expression-geometry.js';

export {
  SPW_INTERACTION_EXPRESSION_CONTRACT,
  formatMicrointeractionExpression,
} from './semantic/interaction-expression.js';
