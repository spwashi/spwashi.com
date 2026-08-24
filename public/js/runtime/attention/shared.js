import {
  SPW_LOG_RELATIONSHIPS,
  createSpwLogger,
} from '/public/js/kernel/instrumentation.js';

export const FONT_SCALE_STEPS = Object.freeze(['70', '80', '90', '100', '110', '120']);
export const HANDLE_SELECTOR = '.spw-section-handle';
export const HANDLE_SHELL_CLASS = 'spw-section-handle-shell';
export const NESTED_HOOK_SECTION_SELECTOR = [
  'main [data-spw-kind="hook"]',
  'main [data-spw-component-kind="hook"]',
  'main article [data-spw-kind="hook"]',
  'main article [data-spw-component-kind="hook"]',
].join(', ');

export const OPERATOR_SECTION_SELECTOR = [
  'main > section[id]',
  'main > section[data-spw-kind]',
  'main > aside[id]',
  'main > aside[data-spw-kind]',
  'main > article[id]',
  'main > article[data-spw-kind]',
  'main > article > section[id]',
  'main > article > section[data-spw-kind]',
  'main > article > aside[id]',
  'main > article > aside[data-spw-kind]',
  'main > [data-spw-svg-host]',
  'main > article > [data-spw-svg-host]',
  NESTED_HOOK_SECTION_SELECTOR,
].join(', ');
export const PROBE_ATTR = 'data-spw-resonance-probe';
export const RESONANCE_KEY_ATTR = 'data-spw-resonance-key';
export const PROBE_TARGET_SELECTOR = '[data-spw-resonance-key], [data-spw-operator], [data-spw-concept], [data-spw-ingredient]';
export const HANDLE_STATE_ATTR = 'data-spw-handle-state';
export const HANDLE_LABEL_ATTR = 'data-spw-section-handle-label';
export const HANDLE_OP_ATTR = 'data-spw-section-handle-op';
export const HANDLE_CADENCE_ATTR = 'data-spw-handle-cadence';
export const HANDLE_CADENCE_MOTION_ATTR = 'data-spw-handle-cadence-motion';
export const HANDLE_PHASE_ATTR = 'data-spw-handle-phase';
export const HANDLE_AVAILABILITY_ATTR = 'data-spw-handle-availability';
export const HANDLE_ENHANCED_ATTR = 'data-spw-handle-enhanced';
export const HANDLE_SHELL_STATE_ATTR = 'data-spw-handle-shell-state';
export const SECTION_STATE_ATTR = 'data-spw-section-state';
export const SECTION_INDEX_ATTR = 'data-spw-section-index';
export const SECTION_TIER_ATTR = 'data-spw-section-tier';
export const PAGE_SECTION_CURRENT_ATTR = 'data-spw-page-section-current';
export const PAGE_SECTION_INDEX_ATTR = 'data-spw-page-section-index';
export const PAGE_SECTION_COUNT_ATTR = 'data-spw-page-section-count';
export const PAGE_SECTION_PHASE_ATTR = 'data-spw-page-section-phase';
export const PAGE_SECTION_EDGE_ATTR = 'data-spw-page-section-edge';
export const PAGE_SECTION_DIRECTION_ATTR = 'data-spw-page-section-direction';
export const READING_GROOVE_ATTR = 'data-spw-reading-groove';
export const READING_GROOVE_COUNT_ATTR = 'data-spw-reading-groove-count';
export const READING_GROOVE_MODE_ATTR = 'data-spw-reading-groove-mode';
export const READING_BEAT_STATE_ATTR = 'data-spw-reading-beat';
export const READING_BEAT_INDEX_ATTR = 'data-spw-reading-beat-index';
export const READING_BEAT_ROLE_ATTR = 'data-spw-reading-beat-role';
export const READING_BEAT_CURRENT_ATTR = 'data-spw-reading-current';
export const READING_BEAT_FOCUS_ATTR = 'data-spw-reading-focus';
export const SCROLL_CADENCE_ATTR = 'data-spw-scroll-cadence';
export const PINCH_TEXT_SCALE_ATTR = 'data-spw-pinch-text-scale';
export const PINCH_ACTIVE_ATTR = 'data-spw-pinch-scaling';
export const PAGE_SECTION_EVENT = 'spw:section-locomotion-state';
export const SUBVOCAL_REHEARSAL_ATTR = 'data-spw-subvocal-rehearsal';
export const CAULDRON_RESONANCE_ATTR = 'data-spw-cauldron-resonance';
export const APPROACH_ATTR = 'data-spw-approach';
export const WONDER_ENTRY_ATTR = 'data-spw-wonder-entry';
export const AUTO_HANDLE_MIN_SECTIONS = 4;
export const HANDLE_VISIBILITY_SCROLL = 240;
export const HANDLE_TRAVEL_SETTLE_MS = 340;
export const HANDLE_COMPACT_QUERY = '(max-width: 720px)';
export const READING_GROOVE_MIN_BEATS = 5;
export const READING_GROOVE_SELECTOR = [
  'main article p',
  'main article li',
  'main article blockquote',
  'main article figcaption',
  'main article .inline-note',
  'main article .frame-note',
  'main article h2',
  'main article h3',
  'main > section p',
  'main > section li',
  'main > section blockquote',
  'main > section figcaption',
  'main > section .inline-note',
  'main > section .frame-note',
  'main > section h2',
  'main > section h3',
].join(', ');

export const ATTENTION_ARCHITECTURE_CONTRACT = Object.freeze({
  selectors: Object.freeze({
    handle: HANDLE_SELECTOR,
    operatorSections: OPERATOR_SECTION_SELECTOR,
    nestedHookSections: NESTED_HOOK_SECTION_SELECTOR,
  }),
  attributes: Object.freeze({
    probe: PROBE_ATTR,
    handleState: HANDLE_STATE_ATTR,
    handleLabel: HANDLE_LABEL_ATTR,
    handleOperator: HANDLE_OP_ATTR,
    handleCadence: HANDLE_CADENCE_ATTR,
    handleCadenceMotion: HANDLE_CADENCE_MOTION_ATTR,
    handlePhase: HANDLE_PHASE_ATTR,
    handleAvailability: HANDLE_AVAILABILITY_ATTR,
    handleEnhanced: HANDLE_ENHANCED_ATTR,
    handleShellState: HANDLE_SHELL_STATE_ATTR,
    sectionState: SECTION_STATE_ATTR,
    sectionIndex: SECTION_INDEX_ATTR,
    sectionTier: SECTION_TIER_ATTR,
    pageSectionCurrent: PAGE_SECTION_CURRENT_ATTR,
    pageSectionIndex: PAGE_SECTION_INDEX_ATTR,
    pageSectionCount: PAGE_SECTION_COUNT_ATTR,
    pageSectionPhase: PAGE_SECTION_PHASE_ATTR,
    pageSectionEdge: PAGE_SECTION_EDGE_ATTR,
    pageSectionDirection: PAGE_SECTION_DIRECTION_ATTR,
    readingGroove: READING_GROOVE_ATTR,
    readingGrooveCount: READING_GROOVE_COUNT_ATTR,
    readingGrooveMode: READING_GROOVE_MODE_ATTR,
    readingBeat: READING_BEAT_STATE_ATTR,
    readingBeatIndex: READING_BEAT_INDEX_ATTR,
    readingBeatRole: READING_BEAT_ROLE_ATTR,
    readingCurrent: READING_BEAT_CURRENT_ATTR,
    readingFocus: READING_BEAT_FOCUS_ATTR,
    scrollCadence: SCROLL_CADENCE_ATTR,
    pinchTextScale: PINCH_TEXT_SCALE_ATTR,
    pinchScaling: PINCH_ACTIVE_ATTR,
    subvocalRehearsal: SUBVOCAL_REHEARSAL_ATTR,
    cauldronResonance: CAULDRON_RESONANCE_ATTR,
    resonanceKey: RESONANCE_KEY_ATTR,
    wonderEntry: WONDER_ENTRY_ATTR,
    approach: APPROACH_ATTR,
  }),
  thresholds: Object.freeze({
    autoHandleMinSections: AUTO_HANDLE_MIN_SECTIONS,
    visibilityScroll: HANDLE_VISIBILITY_SCROLL,
    travelSettleMs: HANDLE_TRAVEL_SETTLE_MS,
    compactQuery: HANDLE_COMPACT_QUERY,
    readingGrooveMinBeats: READING_GROOVE_MIN_BEATS,
  }),
});

export const logger = createSpwLogger('attention-architecture', {
  role: 'runtime',
  metaphor: 'attention-field',
  owns: 'section locomotion, operator resonance probe',
  writes: 'data-spw-page-section-*, data-spw-section-state, data-spw-handle-cadence, data-spw-handle-cadence-motion, data-spw-resonance-probe, data-spw-subvocal-rehearsal, data-spw-cauldron-resonance, data-spw-wonder-entry, data-spw-approach',
});

export { SPW_LOG_RELATIONSHIPS };

export function getScrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/**
 * Read editorial rhythm already authored on a section. Attention mirrors this
 * annotation while the section is current; it never infers dates or keeps a
 * cadence history of its own.
 */
export function readCadenceAnnotation(node) {
  const read = (name) => String(node?.getAttribute?.(name) || '').trim();
  return Object.freeze({
    cadence: read('data-spw-cadence'),
    motion: read('data-spw-cadence-motion'),
  });
}

export function writeAttributes(node, attributes = {}) {
  if (!(node instanceof HTMLElement)) return;

  Object.entries(attributes).forEach(([name, value]) => {
    if (value == null) return;
    const next = String(value);
    if (node.getAttribute(name) === next) return;
    node.setAttribute(name, next);
  });
}

export function clearAttributes(node, names = []) {
  if (!(node instanceof HTMLElement)) return;
  names.forEach((name) => {
    if (!node.hasAttribute(name)) return;
    node.removeAttribute(name);
  });
}

export function getRootPreference(name, fallback = 'off') {
  const htmlValue = document.documentElement?.dataset?.[name];
  const bodyValue = document.body?.dataset?.[name];
  return String(htmlValue || bodyValue || fallback);
}

export function writeSectionProgressStyle(node, progress, step) {
  if (!(node instanceof HTMLElement)) return;
  node.style.setProperty('--spw-section-progress', progress.toFixed(4));
  node.style.setProperty('--spw-section-step', step.toFixed(4));
}
