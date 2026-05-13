/**
 * attention-architecture.js
 * --------------------------------------------------------------------------
 * Two small progressive enhancements that belong to the attentional model:
 *
 *   1. Section-context handle — a sticky locomotion field (mobile-first)
 *      that surfaces the currently visible section and supports reversible
 *      top / previous / current / next / bottom travel. Without JS the
 *      markup still renders a stable "return to top" affordance.
 *
 *   2. Resonance probe pinning — when an operator chip receives keyboard
 *      focus or sustained hover, write [data-spw-resonance-probe] to <html>
 *      so same-operator elements across the page hold a soft echo. The CSS
 *      contract lives in wonder.css.
 *
 * Both features degrade cleanly. Mount is idempotent: the mount function
 * returns a cleanup fn that the site.js lifecycle can call to refresh.
 *
 * Public contract
 * - `initSpwAttentionArchitecture(ctx)` mounts both enhancements.
 * - `ATTENTION_ARCHITECTURE_CONTRACT` exposes the selectors, attributes, and
 *   thresholds in a portable, inspectable bundle for other sites or docs.
 * --------------------------------------------------------------------------
 */

import {
  SPW_LOG_RELATIONSHIPS,
  createSpwLogger,
} from '/public/js/kernel/instrumentation.js';

const FONT_SCALE_STEPS = Object.freeze(['70', '80', '90', '100', '110', '120']);
const HANDLE_SELECTOR = '.spw-section-handle';
const HANDLE_SHELL_CLASS = 'spw-section-handle-shell';
const OPERATOR_SECTION_SELECTOR = [
  'main > section[id]',
  'main > section[data-spw-kind]',
  'main > aside[id]',
  'main > article > section[id]',
  'main > article > section[data-spw-kind]',
  'main > article > aside[id]',
  'main > [data-spw-svg-host]',
  'main > article > [data-spw-svg-host]',
].join(', ');
const PROBE_ATTR = 'data-spw-resonance-probe';
const HANDLE_STATE_ATTR = 'data-spw-handle-state';
const HANDLE_LABEL_ATTR = 'data-spw-section-handle-label';
const HANDLE_OP_ATTR = 'data-spw-section-handle-op';
const HANDLE_PHASE_ATTR = 'data-spw-handle-phase';
const HANDLE_AVAILABILITY_ATTR = 'data-spw-handle-availability';
const HANDLE_ENHANCED_ATTR = 'data-spw-handle-enhanced';
const HANDLE_SHELL_STATE_ATTR = 'data-spw-handle-shell-state';
const SECTION_STATE_ATTR = 'data-spw-section-state';
const SECTION_INDEX_ATTR = 'data-spw-section-index';
const PAGE_SECTION_CURRENT_ATTR = 'data-spw-page-section-current';
const PAGE_SECTION_INDEX_ATTR = 'data-spw-page-section-index';
const PAGE_SECTION_COUNT_ATTR = 'data-spw-page-section-count';
const PAGE_SECTION_PHASE_ATTR = 'data-spw-page-section-phase';
const PAGE_SECTION_EDGE_ATTR = 'data-spw-page-section-edge';
const READING_GROOVE_ATTR = 'data-spw-reading-groove';
const READING_GROOVE_COUNT_ATTR = 'data-spw-reading-groove-count';
const READING_GROOVE_MODE_ATTR = 'data-spw-reading-groove-mode';
const READING_BEAT_STATE_ATTR = 'data-spw-reading-beat';
const READING_BEAT_INDEX_ATTR = 'data-spw-reading-beat-index';
const READING_BEAT_ROLE_ATTR = 'data-spw-reading-beat-role';
const READING_BEAT_CURRENT_ATTR = 'data-spw-reading-current';
const READING_BEAT_FOCUS_ATTR = 'data-spw-reading-focus';
const SCROLL_CADENCE_ATTR = 'data-spw-scroll-cadence';
const PINCH_TEXT_SCALE_ATTR = 'data-spw-pinch-text-scale';
const PINCH_ACTIVE_ATTR = 'data-spw-pinch-scaling';
const PAGE_SECTION_EVENT = 'spw:section-locomotion-state';
const AUTO_HANDLE_MIN_SECTIONS = 4;
const HANDLE_VISIBILITY_SCROLL = 240;
const HANDLE_TRAVEL_SETTLE_MS = 340;
const HANDLE_COMPACT_QUERY = '(max-width: 720px)';
const READING_GROOVE_MIN_BEATS = 5;
const READING_GROOVE_SELECTOR = [
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
let lastSectionLogKey = '';
let lastProbeLogKey = '';
const logger = createSpwLogger('attention-architecture', {
  role: 'runtime',
  metaphor: 'attention-field',
  owns: 'section locomotion, operator resonance probe',
  writes: 'data-spw-page-section-*, data-spw-section-state, data-spw-resonance-probe',
});

export const ATTENTION_ARCHITECTURE_CONTRACT = Object.freeze({
  selectors: Object.freeze({
    handle: HANDLE_SELECTOR,
    operatorSections: OPERATOR_SECTION_SELECTOR,
  }),
  attributes: Object.freeze({
    probe: PROBE_ATTR,
    handleState: HANDLE_STATE_ATTR,
    handleLabel: HANDLE_LABEL_ATTR,
    handleOperator: HANDLE_OP_ATTR,
    handlePhase: HANDLE_PHASE_ATTR,
    handleAvailability: HANDLE_AVAILABILITY_ATTR,
    handleEnhanced: HANDLE_ENHANCED_ATTR,
    handleShellState: HANDLE_SHELL_STATE_ATTR,
    sectionState: SECTION_STATE_ATTR,
    sectionIndex: SECTION_INDEX_ATTR,
    pageSectionCurrent: PAGE_SECTION_CURRENT_ATTR,
    pageSectionIndex: PAGE_SECTION_INDEX_ATTR,
    pageSectionCount: PAGE_SECTION_COUNT_ATTR,
    pageSectionPhase: PAGE_SECTION_PHASE_ATTR,
    pageSectionEdge: PAGE_SECTION_EDGE_ATTR,
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
  }),
  thresholds: Object.freeze({
    autoHandleMinSections: AUTO_HANDLE_MIN_SECTIONS,
    visibilityScroll: HANDLE_VISIBILITY_SCROLL,
    travelSettleMs: HANDLE_TRAVEL_SETTLE_MS,
    compactQuery: HANDLE_COMPACT_QUERY,
    readingGrooveMinBeats: READING_GROOVE_MIN_BEATS,
  }),
});

function getScrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function setHandleState(handle, state) {
  if (!handle) return;
  if (handle.getAttribute(HANDLE_STATE_ATTR) === state) return;
  handle.setAttribute(HANDLE_STATE_ATTR, state);
}

function setHandlePhase(handle, phase) {
  if (!handle) return;
  if (handle.getAttribute(HANDLE_PHASE_ATTR) === phase) return;
  handle.setAttribute(HANDLE_PHASE_ATTR, phase);
}

function writeAttributes(node, attributes = {}) {
  if (!(node instanceof HTMLElement)) return;

  Object.entries(attributes).forEach(([name, value]) => {
    if (value == null) return;
    const next = String(value);
    if (node.getAttribute(name) === next) return;
    node.setAttribute(name, next);
  });
}

function clearAttributes(node, names = []) {
  if (!(node instanceof HTMLElement)) return;
  names.forEach((name) => {
    if (!node.hasAttribute(name)) return;
    node.removeAttribute(name);
  });
}

function getRootPreference(name, fallback = 'off') {
  const htmlValue = document.documentElement?.dataset?.[name];
  const bodyValue = document.body?.dataset?.[name];
  return String(htmlValue || bodyValue || fallback);
}

function isReadingGrooveEnabled() {
  return getRootPreference('spwReadingGrooveMode', 'on') !== 'off';
}

function isPinchTextScaleEnabled() {
  return getRootPreference('spwPinchTextScale', 'on') !== 'off';
}

function getCurrentFontScale() {
  const current = window.spwSettings?.get?.()?.fontSizeScale
    || document.documentElement.dataset.spwFontSizeScale
    || '100';
  return FONT_SCALE_STEPS.includes(String(current)) ? String(current) : '100';
}

function clampFontScaleIndex(index) {
  return Math.max(0, Math.min(FONT_SCALE_STEPS.length - 1, index));
}

function getTouchDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function getSectionLifecycleState(index, activeIndex) {
  if (index === activeIndex) return 'active';
  if (index === activeIndex - 1) return 'previous';
  if (index === activeIndex + 1) return 'next';
  return 'rest';
}

function getPageSectionEdge(currentIndex, sectionCount) {
  if (currentIndex <= 0) return 'top';
  if (currentIndex >= sectionCount - 1) return 'bottom';
  return 'middle';
}

function buildSectionSnapshot(section, index, activeIndex, phase, source, origin, sectionCount) {
  const info = describeSection(section, index);
  if (!info) return null;

  return {
    currentId: info.id,
    currentIndex: activeIndex,
    currentLabel: info.label,
    currentToken: info.token,
    sectionCount,
    availability: describeAvailability(activeIndex, sectionCount),
    phase,
    source,
    origin,
  };
}

function syncHandleContent(parts, info, activeIndex, sectionCount) {
  const { opNode, labelNode, currentToken, currentLabel, progressNode, currentLink } = parts;

  if (opNode) opNode.textContent = info.token || '#>';
  if (labelNode) labelNode.textContent = info.label || 'section';
  if (currentToken) currentToken.textContent = info.token || '#>';
  if (currentLabel) currentLabel.textContent = info.label || 'section';
  if (progressNode) progressNode.textContent = `${activeIndex + 1} / ${sectionCount}`;
  if (currentLink instanceof HTMLAnchorElement) {
    currentLink.href = `#${info.id}`;
    currentLink.setAttribute('aria-label', `Jump to ${info.label}`);
  }
}

function getSectionHeading(section) {
  if (!(section instanceof HTMLElement)) return null;
  return (
    section.querySelector(':scope > h1, :scope > h2, :scope > h3')
    || section.querySelector(':scope > .frame-heading :is(h1, h2, h3)')
    || section.querySelector(':scope > .frame-topline .frame-sigil')
    || section.querySelector(':scope > .page-kicker')
    || section.querySelector(':scope > [data-spw-label]')
  );
}

function getSectionToken(section) {
  if (!(section instanceof HTMLElement)) return '#>';
  const sigil =
    section.querySelector(':scope > .frame-topline .frame-sigil')
    || section.querySelector(':scope > .frame-heading .frame-sigil')
    || section.querySelector(':scope > .section-label')
    || null;
  const sigilText = sigil?.textContent?.trim().replace(/\s+/g, ' ') || '';
  if (sigilText) {
    return sigilText.slice(0, 18);
  }

  const operator =
    section.getAttribute('data-spw-operator')
    || section.getAttribute('data-spw-role')
    || section.getAttribute('data-spw-kind')
    || '';
  return operator ? operator.slice(0, 14) : '#>';
}

function ensureSectionId(section, index) {
  if (!(section instanceof HTMLElement)) return '';
  if (section.id) return section.id;

  const svgHostId = section.getAttribute('data-spw-svg-host');
  const headingText = getSectionHeading(section)?.textContent || '';
  const base =
    svgHostId
    || headingText
    || section.getAttribute('aria-label')
    || section.getAttribute('data-spw-label')
    || `section-${index + 1}`;
  const normalized = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `section-${index + 1}`;

  let id = normalized;
  let suffix = 2;
  while (document.getElementById(id)) {
    id = `${normalized}-${suffix}`;
    suffix += 1;
  }
  section.id = id;
  return id;
}

function describeSection(section, index = 0) {
  if (!section) return null;
  const id = ensureSectionId(section, index);
  const svgHostId = section.getAttribute('data-spw-svg-host');
  const token = getSectionToken(section);
  const heading = getSectionHeading(section);
  const svgLabel = svgHostId
    ? section.querySelector(':scope > svg > title')?.textContent
      || svgHostId.replace(/[-_]+/g, ' ')
    : '';
  const labelSource =
    svgLabel ||
    (heading && heading.textContent) ||
    section.getAttribute('aria-label') ||
    section.getAttribute('data-spw-label') ||
    id ||
    '';
  const label = labelSource.trim().replace(/\s+/g, ' ').slice(0, 80);
  return { id, token, label };
}

function collectSections() {
  const sections = Array.from(document.querySelectorAll(OPERATOR_SECTION_SELECTOR));
  return sections.filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    if (!section.closest('main')) return false;
    if (section.hidden || section.getAttribute('aria-hidden') === 'true') return false;
    const info = describeSection(section);
    return !!info?.label;
  });
}

function ensureHandle(root, sections) {
  const existing = root.querySelector(HANDLE_SELECTOR);
  if (existing instanceof HTMLElement) {
    existing.dataset.spwFloatingChrome = 'true';
    existing.dataset.spwLayoutOwner = 'floating-chrome';
    return { handle: existing, generated: false };
  }

  if (sections.length < AUTO_HANDLE_MIN_SECTIONS) {
    return { handle: null, generated: false };
  }

  const handle = document.createElement('a');
  handle.className = 'spw-section-handle spw-section-handle--generated';
  handle.href = '#main-content';
  handle.setAttribute('aria-label', 'Jump to current section');
  handle.dataset.spwFloatingChrome = 'true';
  handle.dataset.spwLayoutOwner = 'floating-chrome';
  handle.innerHTML = `
    <span class="spw-section-handle__op" aria-hidden="true">#&gt;</span>
    <span class="spw-section-handle__label">section</span>
  `;

  const header = document.querySelector('body > header, .site-header');
  if (header?.after) {
    header.after(handle);
  } else {
    document.body.append(handle);
  }

  return { handle, generated: true };
}

function createHandleShell(origin) {
  const shell = document.createElement('nav');
  shell.className = HANDLE_SHELL_CLASS;
  shell.setAttribute('aria-label', 'Page locomotion');
  shell.setAttribute(HANDLE_ENHANCED_ATTR, 'true');
  shell.dataset.spwFloatingChrome = 'true';
  shell.dataset.spwLayoutOwner = 'floating-chrome';
  shell.dataset.spwHandleOrigin = origin;
  shell.innerHTML = `
    <button type="button" class="spw-section-handle-toggle" data-spw-handle-target="toggle" aria-expanded="false" aria-label="Expand page travel rail">
      <span aria-hidden="true">more</span>
    </button>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="top" data-spw-handle-advanced="true" aria-label="Jump to top of page">
      <span aria-hidden="true">↑</span>
    </button>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="prev" aria-label="Jump to previous section">
      <span aria-hidden="true">‹</span>
    </button>
    <a class="spw-section-handle-current" href="#main-content">
      <span class="spw-section-handle-current-token" aria-hidden="true">#&gt;</span>
      <span class="spw-section-handle-current-copy">
        <span class="spw-section-handle-current-label">section</span>
        <span class="spw-section-handle-progress">1 / 1</span>
      </span>
    </a>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="next" aria-label="Jump to next section">
      <span aria-hidden="true">›</span>
    </button>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="bottom" data-spw-handle-advanced="true" aria-label="Jump to bottom of page">
      <span aria-hidden="true">↓</span>
    </button>
  `;
  return shell;
}

function resolveActiveIndex(sections) {
  if (!sections.length) return -1;

  const anchorY = window.scrollY + Math.min(Math.max(window.innerHeight * 0.28, 120), 320);
  let activeIndex = sections.length - 1;

  for (let index = 0; index < sections.length; index += 1) {
    const nextTop = index + 1 < sections.length
      ? sections[index + 1].getBoundingClientRect().top + window.scrollY
      : Number.POSITIVE_INFINITY;

    if (anchorY < nextTop - 1) {
      activeIndex = index;
      break;
    }
  }

  return Math.max(0, activeIndex);
}

function describeAvailability(activeIndex, count) {
  const availability = ['current'];
  if (activeIndex > 0) availability.unshift('prev', 'top');
  if (activeIndex < count - 1) availability.push('next', 'bottom');
  return availability;
}

function writePageSectionDatasets(snapshot) {
  const edge = getPageSectionEdge(snapshot.currentIndex, snapshot.sectionCount);

  [document.documentElement, document.body].forEach((node) => {
    writeAttributes(node, {
      [PAGE_SECTION_CURRENT_ATTR]: snapshot.currentId,
      [PAGE_SECTION_INDEX_ATTR]: snapshot.currentIndex + 1,
      [PAGE_SECTION_COUNT_ATTR]: snapshot.sectionCount,
      [PAGE_SECTION_PHASE_ATTR]: snapshot.phase,
      [PAGE_SECTION_EDGE_ATTR]: edge,
    });
  });

  document.dispatchEvent(new CustomEvent(PAGE_SECTION_EVENT, {
    detail: {
      ...snapshot,
      edge,
    },
  }));

  const logKey = `${snapshot.currentId}:${snapshot.phase}:${snapshot.source}`;
  if (logKey !== lastSectionLogKey) {
    lastSectionLogKey = logKey;
    logger.debug(
      `section ${snapshot.phase}: ${snapshot.currentLabel}`,
      { ...snapshot, edge },
      SPW_LOG_RELATIONSHIPS.LIFECYCLE
    );
  }
}

function initSectionHandle(root) {
  const sections = collectSections();
  const { handle, generated } = ensureHandle(root, sections);
  if (!handle) return () => {};

  if (!sections.length) {
    setHandleState(handle, 'hidden');
    return () => {};
  }

  const opNode = handle.querySelector('.spw-section-handle__op');
  const labelNode = handle.querySelector('.spw-section-handle__label');
  const shell = createHandleShell(generated ? 'generated' : 'markup');
  const currentLink = shell.querySelector('.spw-section-handle-current');
  const currentToken = shell.querySelector('.spw-section-handle-current-token');
  const currentLabel = shell.querySelector('.spw-section-handle-current-label');
  const progressNode = shell.querySelector('.spw-section-handle-progress');
  const toggleButton = shell.querySelector('[data-spw-handle-target="toggle"]');
  const topButton = shell.querySelector('[data-spw-handle-target="top"]');
  const prevButton = shell.querySelector('[data-spw-handle-target="prev"]');
  const nextButton = shell.querySelector('[data-spw-handle-target="next"]');
  const bottomButton = shell.querySelector('[data-spw-handle-target="bottom"]');

  handle.after(shell);
  handle.hidden = true;
  handle.setAttribute(HANDLE_ENHANCED_ATTR, 'true');

  const state = {
    activeIndex: 0,
    phase: 'settled',
    raf: 0,
    travelTimer: 0,
    travelTargetId: '',
    compact: window.matchMedia(HANDLE_COMPACT_QUERY).matches,
    manualCompact: false,
  };

  const syncShellState = () => {
    shell.setAttribute(HANDLE_SHELL_STATE_ATTR, state.compact ? 'collapsed' : 'expanded');
    if (!(toggleButton instanceof HTMLButtonElement)) return;
    toggleButton.setAttribute('aria-expanded', state.compact ? 'false' : 'true');
    toggleButton.setAttribute(
      'aria-label',
      state.compact ? 'Expand page travel rail' : 'Collapse page travel rail'
    );
    toggleButton.title = state.compact ? 'Show more travel controls' : 'Show fewer travel controls';
    toggleButton.textContent = state.compact ? 'more' : 'less';
  };

  sections.forEach((section, index) => {
    section.setAttribute(SECTION_INDEX_ATTR, String(index + 1));
    ensureSectionId(section, index);
  });

  const updateActiveState = (source = 'sync') => {
    state.activeIndex = resolveActiveIndex(sections);
    const activeSection = sections[state.activeIndex];
    const info = describeSection(activeSection, state.activeIndex);
    if (!info) return;

    const snapshot = buildSectionSnapshot(
      activeSection,
      state.activeIndex,
      state.activeIndex,
      state.phase,
      source,
      generated ? 'generated' : 'markup',
      sections.length
    );
    if (!snapshot) return;

    syncHandleContent(
      { opNode, labelNode, currentToken, currentLabel, progressNode, currentLink },
      info,
      state.activeIndex,
      sections.length
    );

    writeAttributes(handle, {
      href: `#${info.id}`,
      'aria-label': `Jump to ${info.label}`,
      [HANDLE_OP_ATTR]: info.token || '',
      [HANDLE_LABEL_ATTR]: info.label || '',
    });

    sections.forEach((section, index) => {
      writeAttributes(section, {
        [SECTION_STATE_ATTR]: getSectionLifecycleState(index, state.activeIndex),
      });
    });

    const hasPrev = state.activeIndex > 0;
    const hasNext = state.activeIndex < sections.length - 1;
    if (topButton instanceof HTMLButtonElement) topButton.disabled = !hasPrev;
    if (prevButton instanceof HTMLButtonElement) prevButton.disabled = !hasPrev;
    if (nextButton instanceof HTMLButtonElement) nextButton.disabled = !hasNext;
    if (bottomButton instanceof HTMLButtonElement) bottomButton.disabled = !hasNext;

    writeAttributes(shell, {
      [HANDLE_LABEL_ATTR]: info.label || '',
      [HANDLE_OP_ATTR]: info.token || '',
      [HANDLE_AVAILABILITY_ATTR]: snapshot.availability.join(' '),
    });
    shell.dataset.spwHandleCurrent = info.id;
    shell.dataset.spwHandleIndex = String(state.activeIndex + 1);
    shell.dataset.spwHandleCount = String(sections.length);
    shell.dataset.spwHandleSource = source;

    const scrolledPast = window.scrollY > Math.max(HANDLE_VISIBILITY_SCROLL, (window.innerHeight || 800) * 0.34);
    const visible = sections.length > 1 && (scrolledPast || state.activeIndex > 0);
    setHandleState(handle, visible ? 'visible' : 'hidden');
    setHandleState(shell, visible ? 'visible' : 'hidden');

    writePageSectionDatasets(snapshot);

    if (state.phase === 'traveling' && state.travelTargetId && info.id === state.travelTargetId) {
      window.clearTimeout(state.travelTimer);
      state.travelTimer = window.setTimeout(() => {
        state.phase = 'settled';
        setHandlePhase(shell, 'settled');
        setHandlePhase(handle, 'settled');
        updateActiveState('settled');
      }, 120);
    }
  };

  const runUpdate = (source = 'scroll') => {
    if (state.raf) return;
    state.raf = window.requestAnimationFrame(() => {
      state.raf = 0;
      updateActiveState(source);
    });
  };

  const travelToIndex = (nextIndex, source) => {
    const targetIndex = Math.max(0, Math.min(nextIndex, sections.length - 1));
    const target = sections[targetIndex];
    if (!target) return;

    state.phase = 'traveling';
    state.travelTargetId = ensureSectionId(target, targetIndex);
    setHandlePhase(shell, 'traveling');
    setHandlePhase(handle, 'traveling');
    window.clearTimeout(state.travelTimer);
    state.travelTimer = window.setTimeout(() => {
      state.phase = 'settled';
      setHandlePhase(shell, 'settled');
      setHandlePhase(handle, 'settled');
      updateActiveState(`${source}-settled`);
    }, HANDLE_TRAVEL_SETTLE_MS);
    target.scrollIntoView({
      behavior: getScrollBehavior(),
      block: 'start',
      inline: 'nearest',
    });
    updateActiveState(source);
  };

  const handleButtonClick = (event) => {
    const button = event.target.closest?.('[data-spw-handle-target]');
    if (!(button instanceof HTMLButtonElement)) return;
    const target = button.dataset.spwHandleTarget || '';
    switch (target) {
      case 'toggle':
        state.compact = !state.compact;
        state.manualCompact = true;
        syncShellState();
        updateActiveState('toggle');
        break;
      case 'top':
        travelToIndex(0, 'top');
        break;
      case 'prev':
        travelToIndex(state.activeIndex - 1, 'prev');
        break;
      case 'next':
        travelToIndex(state.activeIndex + 1, 'next');
        break;
      case 'bottom':
        travelToIndex(sections.length - 1, 'bottom');
        break;
      default:
        break;
    }
  };

  const handleCurrentClick = () => {
    const settle = () => {
      state.phase = 'settled';
      setHandlePhase(shell, 'settled');
      setHandlePhase(handle, 'settled');
      updateActiveState('current-settled');
    };

    state.phase = 'traveling';
    setHandlePhase(shell, 'traveling');
    setHandlePhase(handle, 'traveling');
    window.clearTimeout(state.travelTimer);
    state.travelTimer = window.setTimeout(settle, HANDLE_TRAVEL_SETTLE_MS);
  };

  const handleShellKeydown = (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        travelToIndex(state.activeIndex - 1, 'arrow-prev');
        break;
      case 'ArrowRight':
        event.preventDefault();
        travelToIndex(state.activeIndex + 1, 'arrow-next');
        break;
      case 'Home':
        event.preventDefault();
        travelToIndex(0, 'home');
        break;
      case 'End':
        event.preventDefault();
        travelToIndex(sections.length - 1, 'end');
        break;
      default:
        break;
    }
  };

  const onScroll = () => {
    runUpdate('scroll');
  };

  const onResize = () => {
    if (!state.manualCompact) {
      state.compact = window.matchMedia(HANDLE_COMPACT_QUERY).matches;
    }
    if (!window.matchMedia(HANDLE_COMPACT_QUERY).matches) {
      state.compact = false;
      state.manualCompact = false;
    }
    syncShellState();
    runUpdate('resize');
  };

  shell.addEventListener('click', handleButtonClick);
  shell.addEventListener('keydown', handleShellKeydown);
  currentLink?.addEventListener('click', handleCurrentClick);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize);

  setHandlePhase(shell, 'settled');
  setHandlePhase(handle, 'settled');
  syncShellState();
  updateActiveState('init');

  return () => {
    shell.removeEventListener('click', handleButtonClick);
    shell.removeEventListener('keydown', handleShellKeydown);
    currentLink?.removeEventListener('click', handleCurrentClick);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    if (state.raf) {
      window.cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    window.clearTimeout(state.travelTimer);
    shell.remove();
    handle.hidden = false;
    clearAttributes(handle, [HANDLE_ENHANCED_ATTR, HANDLE_PHASE_ATTR, HANDLE_AVAILABILITY_ATTR]);
    sections.forEach((section) => {
      clearAttributes(section, [SECTION_STATE_ATTR, SECTION_INDEX_ATTR]);
    });
    [document.documentElement, document.body].forEach((node) => {
      clearAttributes(node, [
        PAGE_SECTION_CURRENT_ATTR,
        PAGE_SECTION_INDEX_ATTR,
        PAGE_SECTION_COUNT_ATTR,
        PAGE_SECTION_PHASE_ATTR,
        PAGE_SECTION_EDGE_ATTR,
      ]);
    });
    if (generated) {
      handle.remove();
    }
  };
}

function initResonanceProbe(root) {
  const html = document.documentElement;
  let probeFocus = null;
  let probeHover = null;
  let hoverTimer = 0;
  const HOVER_DELAY = 260;

  function apply() {
    const op = probeFocus || probeHover;
    const nextLogKey = op || 'cleared';
    const shouldLog = nextLogKey !== lastProbeLogKey;
    lastProbeLogKey = nextLogKey;
    if (op) {
      html.setAttribute(PROBE_ATTR, op);
      if (shouldLog) logger.debug('resonance probe set', { operator: op }, SPW_LOG_RELATIONSHIPS.GESTURE);
    } else {
      html.removeAttribute(PROBE_ATTR);
      if (shouldLog) logger.debug('resonance probe cleared', {}, SPW_LOG_RELATIONSHIPS.GESTURE);
    }
  }

  function onFocusIn(event) {
    const target = event.target.closest?.('[data-spw-operator]');
    if (!target) return;
    probeFocus = target.getAttribute('data-spw-operator');
    apply();
  }

  function onFocusOut(event) {
    const next = event.relatedTarget?.closest?.('[data-spw-operator]');
    if (!next) {
      probeFocus = null;
      apply();
    }
  }

  function onMouseEnter(event) {
    const target = event.target.closest?.('[data-spw-operator]');
    if (!target) return;
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      probeHover = target.getAttribute('data-spw-operator');
      apply();
    }, HOVER_DELAY);
  }

  function onMouseLeave(event) {
    const target = event.target.closest?.('[data-spw-operator]');
    if (!target) return;
    clearTimeout(hoverTimer);
    probeHover = null;
    apply();
  }

  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('mouseover', onMouseEnter);
  root.addEventListener('mouseout', onMouseLeave);

  return () => {
    clearTimeout(hoverTimer);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    root.removeEventListener('mouseover', onMouseEnter);
    root.removeEventListener('mouseout', onMouseLeave);
    html.removeAttribute(PROBE_ATTR);
  };
}

function collectReadingBeats(root) {
  return Array.from(root.querySelectorAll(READING_GROOVE_SELECTOR)).filter((node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (!node.closest('main')) return false;
    if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
    const text = node.textContent?.trim() || '';
    if (text.length < 24) return false;
    return true;
  });
}

function describeReadingBeatRole(node) {
  if (!(node instanceof HTMLElement)) return 'body';
  if (node.matches('h2, h3')) return 'heading';
  if (node.matches('blockquote, figcaption')) return 'aside';
  if (node.matches('.inline-note, .frame-note')) return 'note';
  if (node.matches('li')) return 'list';
  return 'body';
}

function writeReadingGrooveState(beats, leadIndex) {
  beats.forEach((beat, index) => {
    const distance = Math.abs(index - leadIndex);
    let state = 'rest';
    if (index === leadIndex) state = 'lead';
    else if (distance <= 2) state = 'near';

    writeAttributes(beat, {
      [READING_BEAT_STATE_ATTR]: state,
      [READING_BEAT_CURRENT_ATTR]: index === leadIndex ? 'true' : 'false',
      [READING_BEAT_FOCUS_ATTR]: distance <= 1 ? 'tight' : distance === 2 ? 'wide' : 'ambient',
    });
  });
}

function initReadingGroove(root) {
  const beats = collectReadingBeats(root);
  if (beats.length < READING_GROOVE_MIN_BEATS) return () => {};

  const syncReadingGroovePreference = () => {
    [document.documentElement, document.body].forEach((node) => {
      writeAttributes(node, {
        [READING_GROOVE_ATTR]: isReadingGrooveEnabled() ? 'on' : 'off',
        [READING_GROOVE_COUNT_ATTR]: beats.length,
      });
    });
  };

  syncReadingGroovePreference();

  beats.forEach((beat, index) => {
    writeAttributes(beat, {
      [READING_BEAT_INDEX_ATTR]: index + 1,
      [READING_BEAT_ROLE_ATTR]: describeReadingBeatRole(beat),
    });
  });

  const state = {
    leadIndex: 0,
    raf: 0,
    visible: new Set(),
  };

  const resolveLeadIndex = () => {
    const anchorY = Math.min(Math.max(window.innerHeight * 0.38, 120), 320);
    const candidates = state.visible.size ? Array.from(state.visible) : beats;
    let bestIndex = state.leadIndex;
    let bestDistance = Number.POSITIVE_INFINITY;

    candidates.forEach((beat) => {
      const rect = beat.getBoundingClientRect();
      const center = rect.top + (rect.height * 0.45);
      const distance = Math.abs(center - anchorY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = beats.indexOf(beat);
      }
    });

    return Math.max(0, bestIndex);
  };

  const update = () => {
    state.raf = 0;
    const nextLeadIndex = resolveLeadIndex();
    if (nextLeadIndex === state.leadIndex && beats[state.leadIndex]?.hasAttribute(READING_BEAT_STATE_ATTR)) return;
    state.leadIndex = nextLeadIndex;
    writeReadingGrooveState(beats, state.leadIndex);
  };

  const scheduleUpdate = () => {
    if (state.raf) return;
    state.raf = window.requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target;
      if (!(target instanceof HTMLElement)) return;
      if (entry.isIntersecting && entry.intersectionRatio > 0.08) {
        state.visible.add(target);
      } else {
        state.visible.delete(target);
      }
    });
    scheduleUpdate();
  }, {
    root: null,
    rootMargin: '-12% 0px -42% 0px',
    threshold: [0, 0.08, 0.2, 0.4, 0.66, 1],
  });

  beats.forEach((beat) => observer.observe(beat));
  update();

  const onResize = () => scheduleUpdate();
  const preferenceObserver = new MutationObserver(() => {
    syncReadingGroovePreference();
  });

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize);
  preferenceObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [READING_GROOVE_MODE_ATTR],
  });

  return () => {
    observer.disconnect();
    preferenceObserver.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    if (state.raf) {
      window.cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    beats.forEach((beat) => {
      clearAttributes(beat, [
        READING_BEAT_STATE_ATTR,
        READING_BEAT_INDEX_ATTR,
        READING_BEAT_ROLE_ATTR,
        READING_BEAT_CURRENT_ATTR,
        READING_BEAT_FOCUS_ATTR,
      ]);
    });
    [document.documentElement, document.body].forEach((node) => {
      clearAttributes(node, [
        READING_GROOVE_ATTR,
        READING_GROOVE_COUNT_ATTR,
      ]);
    });
  };
}

function initPinchTextScale(root) {
  const main = root.querySelector?.('main');
  if (!(main instanceof HTMLElement)) return () => {};

  const state = {
    active: false,
    startDistance: 0,
    startIndex: clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale())),
    previewIndex: clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale())),
  };

  const clearPinchState = () => {
    state.active = false;
    state.startDistance = 0;
    state.startIndex = clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale()));
    state.previewIndex = state.startIndex;
    [document.documentElement, document.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.removeAttribute(PINCH_ACTIVE_ATTR);
    });
  };

  const isAllowedTarget = (target) => {
    if (!(target instanceof Element)) return false;
    if (!main.contains(target)) return false;
    return !target.closest(
      'a, button, input, select, textarea, label, summary, details, video, audio, iframe, [contenteditable="true"]'
    );
  };

  const handleTouchStart = (event) => {
    if (!isPinchTextScaleEnabled()) return;
    if (event.touches.length !== 2) return;
    if (!isAllowedTarget(event.target)) return;

    state.active = true;
    state.startDistance = getTouchDistance(event.touches);
    state.startIndex = clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale()));
    state.previewIndex = state.startIndex;

    [document.documentElement, document.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      writeAttributes(node, {
        [PINCH_ACTIVE_ATTR]: 'true',
      });
    });
  };

  const handleTouchMove = (event) => {
    if (!state.active || event.touches.length !== 2) return;
    if (!isPinchTextScaleEnabled()) return;

    const distance = getTouchDistance(event.touches);
    if (!(distance > 0) || !(state.startDistance > 0)) return;

    const delta = Math.log2(distance / state.startDistance);
    const stepChange = Math.round(delta / 0.12);
    const nextIndex = clampFontScaleIndex(state.startIndex + stepChange);
    event.preventDefault();

    if (nextIndex === state.previewIndex) return;
    state.previewIndex = nextIndex;

    const nextScale = FONT_SCALE_STEPS[nextIndex];
    if (nextScale && nextScale !== getCurrentFontScale()) {
      window.spwSettings?.save?.({ fontSizeScale: nextScale });
    }
  };

  const handleTouchEnd = () => {
    if (!state.active) return;
    clearPinchState();
  };

  main.addEventListener('touchstart', handleTouchStart, { passive: true });
  main.addEventListener('touchmove', handleTouchMove, { passive: false });
  main.addEventListener('touchend', handleTouchEnd, { passive: true });
  main.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  return () => {
    main.removeEventListener('touchstart', handleTouchStart);
    main.removeEventListener('touchmove', handleTouchMove);
    main.removeEventListener('touchend', handleTouchEnd);
    main.removeEventListener('touchcancel', handleTouchEnd);
    clearPinchState();
  };
}

export function initSpwAttentionArchitecture(ctx) {
  const root = (ctx && ctx.root) || document;
  const cleanups = [];

  try { cleanups.push(initSectionHandle(root)); } catch (_) {}
  try { cleanups.push(initResonanceProbe(root)); } catch (_) {}
  try { cleanups.push(initReadingGroove(root)); } catch (_) {}
  try { cleanups.push(initPinchTextScale(root)); } catch (_) {}

  return () => {
    for (const cleanup of cleanups) {
      try { cleanup && cleanup(); } catch (_) {}
    }
  };
}
