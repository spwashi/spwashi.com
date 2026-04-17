/**
 * spw-attention-architecture.js
 * --------------------------------------------------------------------------
 * Two small progressive enhancements that belong to the attentional model:
 *
 *   1. Section-context handle — a sticky chip (mobile-first) that surfaces
 *      the currently visible section by reading operator + heading. Without
 *      JS the markup still renders a stable "return to top" affordance.
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
const OPERATOR_SECTION_SELECTOR = 'main section[data-spw-kind], main article[data-spw-kind], main aside[data-spw-kind], main section[id], main article[id]';
const PROBE_ATTR = 'data-spw-resonance-probe';
const HANDLE_STATE_ATTR = 'data-spw-handle-state';
const HANDLE_LABEL_ATTR = 'data-spw-section-handle-label';
const HANDLE_OP_ATTR = 'data-spw-section-handle-op';

function setHandleState(handle, state) {
  if (!handle) return;
  if (handle.getAttribute(HANDLE_STATE_ATTR) === state) return;
  handle.setAttribute(HANDLE_STATE_ATTR, state);
}

function describeSection(section) {
  if (!section) return null;
  const operator =
    section.getAttribute('data-spw-operator') ||
    section.getAttribute('data-spw-role') ||
    section.getAttribute('data-spw-kind') ||
    '';
  const heading = section.querySelector(':scope > :where(h1, h2, h3, .page-kicker, .frame-topline)');
  const labelSource =
    (heading && heading.textContent) ||
    section.getAttribute('aria-label') ||
    section.getAttribute('data-spw-label') ||
    section.id ||
    '';
  const label = labelSource.trim().replace(/\s+/g, ' ').slice(0, 80);
  return { operator, label };
}

function initSectionHandle(root) {
  const handle = root.querySelector(HANDLE_SELECTOR);
  if (!handle) return () => {};

  const sections = Array.from(document.querySelectorAll(OPERATOR_SECTION_SELECTOR));
  if (!sections.length) {
    setHandleState(handle, 'hidden');
    return () => {};
  }

  const opNode = handle.querySelector('.spw-section-handle__op');
  const labelNode = handle.querySelector('.spw-section-handle__label');

  let active = null;

  function updateHandleFrom(section) {
    const info = describeSection(section);
    if (!info) return;
    if (opNode) opNode.textContent = info.operator || '#';
    if (labelNode) labelNode.textContent = info.label || 'section';
    handle.setAttribute(HANDLE_OP_ATTR, info.operator || '');
    handle.setAttribute(HANDLE_LABEL_ATTR, info.label || '');
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let nextActive = active;
      let bestRatio = 0;

      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio;
          nextActive = entry.target;
        }
      }

      if (nextActive && nextActive !== active) {
        active = nextActive;
        updateHandleFrom(active);
      }

      const scrolledPast = window.scrollY > Math.max(240, (window.innerHeight || 800) * 0.4);
      setHandleState(handle, scrolledPast ? 'visible' : 'hidden');
    },
    {
      rootMargin: '-20% 0px -40% 0px',
      threshold: [0.05, 0.25, 0.5, 0.75],
    }
  );

  for (const section of sections) observer.observe(section);

  function onScroll() {
    const scrolledPast = window.scrollY > Math.max(240, (window.innerHeight || 800) * 0.4);
    setHandleState(handle, scrolledPast ? 'visible' : 'hidden');
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  updateHandleFrom(sections[0]);
  onScroll();

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
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
