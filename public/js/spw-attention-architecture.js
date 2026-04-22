/**
 * spw-attention-architecture.js
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
 *      contract lives in spw-wonder.css.
 *
 * Both features degrade cleanly. Mount is idempotent: the mount function
 * returns a cleanup fn that the site.js lifecycle can call to refresh.
 * --------------------------------------------------------------------------
 */

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
const PAGE_SECTION_EVENT = 'spw:section-locomotion-state';
const AUTO_HANDLE_MIN_SECTIONS = 4;
const HANDLE_VISIBILITY_SCROLL = 240;
const HANDLE_TRAVEL_SETTLE_MS = 760;
const HANDLE_COMPACT_QUERY = '(max-width: 720px)';

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
    return { handle: existing, generated: false };
  }

  if (sections.length < AUTO_HANDLE_MIN_SECTIONS) {
    return { handle: null, generated: false };
  }

  const handle = document.createElement('a');
  handle.className = 'spw-section-handle spw-section-handle--generated';
  handle.href = '#main-content';
  handle.setAttribute('aria-label', 'Jump to current section');
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
  shell.dataset.spwHandleOrigin = origin;
  shell.innerHTML = `
    <button type="button" class="spw-section-handle-toggle" data-spw-handle-target="toggle" aria-expanded="false" aria-label="Expand page travel">
      <span aria-hidden="true">+</span>
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
  const html = document.documentElement;
  const body = document.body;
  const edge = snapshot.currentIndex <= 0
    ? 'top'
    : snapshot.currentIndex >= snapshot.sectionCount - 1
      ? 'bottom'
      : 'middle';

  [html, body].forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.setAttribute(PAGE_SECTION_CURRENT_ATTR, snapshot.currentId);
    node.setAttribute(PAGE_SECTION_INDEX_ATTR, String(snapshot.currentIndex + 1));
    node.setAttribute(PAGE_SECTION_COUNT_ATTR, String(snapshot.sectionCount));
    node.setAttribute(PAGE_SECTION_PHASE_ATTR, snapshot.phase);
    node.setAttribute(PAGE_SECTION_EDGE_ATTR, edge);
  });

  document.dispatchEvent(new CustomEvent(PAGE_SECTION_EVENT, {
    detail: {
      ...snapshot,
      edge,
    },
  }));
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
      state.compact ? 'Expand page travel' : 'Collapse page travel'
    );
    toggleButton.title = state.compact ? 'More travel' : 'Less travel';
    toggleButton.textContent = state.compact ? '+' : '-';
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

    const availability = describeAvailability(state.activeIndex, sections.length);
    const snapshot = {
      currentId: info.id,
      currentIndex: state.activeIndex,
      currentLabel: info.label,
      currentToken: info.token,
      sectionCount: sections.length,
      availability,
      phase: state.phase,
      source,
      origin: generated ? 'generated' : 'markup',
    };

    if (opNode) opNode.textContent = info.token || '#>';
    if (labelNode) labelNode.textContent = info.label || 'section';
    if (currentToken) currentToken.textContent = info.token || '#>';
    if (currentLabel) currentLabel.textContent = info.label || 'section';
    if (progressNode) progressNode.textContent = `${state.activeIndex + 1} / ${sections.length}`;
    if (currentLink instanceof HTMLAnchorElement) {
      currentLink.href = `#${info.id}`;
      currentLink.setAttribute('aria-label', `Jump to ${info.label}`);
    }

    handle.href = `#${info.id}`;
    handle.setAttribute('aria-label', `Jump to ${info.label}`);
    handle.setAttribute(HANDLE_OP_ATTR, info.token || '');
    handle.setAttribute(HANDLE_LABEL_ATTR, info.label || '');

    sections.forEach((section, index) => {
      section.setAttribute(
        SECTION_STATE_ATTR,
        index === state.activeIndex
          ? 'active'
          : index === state.activeIndex - 1
            ? 'previous'
            : index === state.activeIndex + 1
              ? 'next'
              : 'rest'
      );
    });

    const hasPrev = state.activeIndex > 0;
    const hasNext = state.activeIndex < sections.length - 1;
    if (topButton instanceof HTMLButtonElement) topButton.disabled = !hasPrev;
    if (prevButton instanceof HTMLButtonElement) prevButton.disabled = !hasPrev;
    if (nextButton instanceof HTMLButtonElement) nextButton.disabled = !hasNext;
    if (bottomButton instanceof HTMLButtonElement) bottomButton.disabled = !hasNext;

    shell.setAttribute(HANDLE_LABEL_ATTR, info.label || '');
    shell.setAttribute(HANDLE_OP_ATTR, info.token || '');
    shell.setAttribute(HANDLE_AVAILABILITY_ATTR, availability.join(' '));
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
    state.phase = 'traveling';
    setHandlePhase(shell, 'traveling');
    setHandlePhase(handle, 'traveling');
    window.clearTimeout(state.travelTimer);
    state.travelTimer = window.setTimeout(() => {
      state.phase = 'settled';
      setHandlePhase(shell, 'settled');
      setHandlePhase(handle, 'settled');
      updateActiveState('current-settled');
    }, HANDLE_TRAVEL_SETTLE_MS);
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
    handle.removeAttribute(HANDLE_ENHANCED_ATTR);
    handle.removeAttribute(HANDLE_PHASE_ATTR);
    handle.removeAttribute(HANDLE_AVAILABILITY_ATTR);
    sections.forEach((section) => {
      section.removeAttribute(SECTION_STATE_ATTR);
      section.removeAttribute(SECTION_INDEX_ATTR);
    });
    [document.documentElement, document.body].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.removeAttribute(PAGE_SECTION_CURRENT_ATTR);
      node.removeAttribute(PAGE_SECTION_INDEX_ATTR);
      node.removeAttribute(PAGE_SECTION_COUNT_ATTR);
      node.removeAttribute(PAGE_SECTION_PHASE_ATTR);
      node.removeAttribute(PAGE_SECTION_EDGE_ATTR);
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
    if (op) html.setAttribute(PROBE_ATTR, op);
    else html.removeAttribute(PROBE_ATTR);
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

export function initSpwAttentionArchitecture(ctx) {
  const root = (ctx && ctx.root) || document;
  const cleanups = [];

  try { cleanups.push(initSectionHandle(root)); } catch (_) {}
  try { cleanups.push(initResonanceProbe(root)); } catch (_) {}

  return () => {
    for (const cleanup of cleanups) {
      try { cleanup && cleanup(); } catch (_) {}
    }
  };
}
