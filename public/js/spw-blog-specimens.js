/**
 * blog-specimens.js
 * ---------------------------------------------------------------------------
 * Purpose
 * - Route-level orchestrator for blog interactive components.
 * - Initializes bounded, optional subsystems inside a provided root.
 *
 * Design rules
 * - No auto-init. Caller controls lifecycle.
 * - Each subsystem:
 *    - receives a root
 *    - early-returns if not present
 *    - avoids global DOM scanning
 * - Feature flags respected via data attributes on <html>/<body>
 *
 * Public API
 * - initBlogSpecimens(root?, options?)
 */

export function initBlogSpecimens(root = document, options = {}) {
  const rootEl = root instanceof Element ? root : document;
  const html = document.documentElement;
  const body = document.body;

  const flags = {
    enhance: html.dataset.spwEnhance !== 'off',
    filters: html.dataset.spwFilters !== 'off',
    motion: html.dataset.spwReduceMotion !== 'on',
    charge: html.dataset.spwCharge !== 'off',
    ...options.flags,
  };

  const teardown = [];

  teardown.push(initThemeSwatches(rootEl));
  teardown.push(initOperatorCards(rootEl, flags));
  teardown.push(initBraceCharge(rootEl, flags));
  teardown.push(initObserverDemo(rootEl, flags));
  teardown.push(initAudioDemo(rootEl, flags));
  teardown.push(initCanvasDemo(rootEl, flags));
  teardown.push(initFilterDemo(rootEl, flags));

  return {
    destroy() {
      teardown.forEach((fn) => fn && fn());
    },
  };
}

/* ==========================================================================
   Theme swatches
   ========================================================================== */

function initThemeSwatches(root) {
  const buttons = root.querySelectorAll('[data-theme-set]');
  if (!buttons.length) return noop;

  function resolveActiveTheme() {
    if (document.body.dataset.theme) return document.body.dataset.theme;

    const colorMode = document.documentElement.dataset.spwColorMode;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    if (colorMode === 'dark') return 'atelier-dark';
    if (colorMode === 'light') return 'atelier-light';
    return prefersDark ? 'atelier-dark' : 'atelier-light';
  }

  function syncPressed(activeTheme = resolveActiveTheme()) {
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeSet === activeTheme));
    });
  }

  function onClick(e) {
    const btn = e.target.closest('[data-theme-set]');
    if (!btn) return;

    const theme = btn.dataset.themeSet;
    document.body.dataset.theme = theme;
    syncPressed(theme);
  }

  root.addEventListener('click', onClick);
  syncPressed();

  return () => root.removeEventListener('click', onClick);
}

/* ==========================================================================
   Operator card panel (bounded, delegated)
   ========================================================================== */

function initOperatorCards(root, flags) {
  const container = root.querySelector('.operator-snippet-grid');
  if (!container) return noop;

  function onClick(e) {
    const toggle = e.target.closest('.operator-card-toggle');
    if (!toggle) return;

    const card = toggle.closest('.operator-snippet');
    if (!card) return;

    const isOpen = card.hasAttribute('data-panel-open');

    closeAll();

    if (!isOpen) {
      openPanel(card);
    }
  }

  function openPanel(card) {
    const panel = createPanel(card);
    card.appendChild(panel);
    card.setAttribute('data-panel-open', '');
  }

  function closeAll() {
    container.querySelectorAll('[data-panel-open]').forEach((card) => {
      card.removeAttribute('data-panel-open');
      card.querySelector('.operator-card-panel')?.remove();
    });
  }

  function createPanel(card) {
    const panel = document.createElement('div');
    panel.className = 'operator-card-panel';

    const example = card.querySelector('.operator-snippet-example')?.textContent || '';

    const code = document.createElement('code');
    code.className = 'operator-card-panel-reduction';
    code.textContent = example;

    panel.appendChild(code);
    return panel;
  }

  container.addEventListener('click', onClick);

  return () => container.removeEventListener('click', onClick);
}

/* ==========================================================================
   Brace charge (lightweight, no global scan loop)
   ========================================================================== */

function initBraceCharge(root, flags) {
  if (!flags.charge) return noop;

  const nodes = root.querySelectorAll('.site-frame');
  if (!nodes.length) return noop;

  function onEnter(e) {
    const frame = e.target.closest('.site-frame');
    if (!frame) return;
    frame.classList.add('has-active-charge');
  }

  function onLeave(e) {
    const frame = e.target.closest('.site-frame');
    if (!frame) return;
    frame.classList.remove('has-active-charge');
  }

  root.addEventListener('mouseover', onEnter);
  root.addEventListener('mouseout', onLeave);

  return () => {
    root.removeEventListener('mouseover', onEnter);
    root.removeEventListener('mouseout', onLeave);
  };
}

/* ==========================================================================
   Intersection Observer demo (scoped)
   ========================================================================== */

function initObserverDemo(root, flags) {
  if (!('IntersectionObserver' in window)) return noop;

  const container = root.querySelector('.demo-io-scroll-area');
  if (!container) return noop;

  const fibers = container.querySelectorAll('.demo-io-fiber');
  const indicator = root.querySelector('.demo-io-threshold-indicator');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const ratio = entry.intersectionRatio;
        entry.target.style.setProperty('--io-ratio', ratio.toFixed(2));

        if (indicator && entry.isIntersecting) {
          indicator.textContent = `ratio: ${ratio.toFixed(2)}`;
        }
      });
    },
    { threshold: [0.1, 0.3, 0.5, 0.7, 0.9] }
  );

  fibers.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}

/* ==========================================================================
   Audio demo (gated)
   ========================================================================== */

function initAudioDemo(root, flags) {
  if (!flags.enhance || !window.AudioContext) return noop;

  const btn = root.querySelector('.demo-audio-btn');
  if (!btn) return noop;

  let ctx = null;
  let osc = null;

  function start() {
    ctx = new AudioContext();
    osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.start();
    btn.setAttribute('aria-pressed', 'true');
  }

  function stop() {
    if (!osc) return;
    osc.stop();
    osc.disconnect();
    ctx.close();
    osc = null;
    ctx = null;
    btn.setAttribute('aria-pressed', 'false');
  }

  function toggle() {
    if (osc) stop();
    else start();
  }

  btn.addEventListener('click', toggle);

  return () => {
    btn.removeEventListener('click', toggle);
    stop();
  };
}

/* ==========================================================================
   Canvas demo (scoped, no global listeners)
   ========================================================================== */

function initCanvasDemo(root, flags) {
  if (!flags.enhance) return noop;

  const canvas = root.querySelector('.demo-canvas-wrap canvas');
  if (!canvas) return noop;

  const ctx = canvas.getContext('2d');
  let drawing = false;

  function draw(x, y) {
    ctx.fillStyle = 'rgba(24,123,135,0.6)';
    ctx.fillRect(x, y, 2, 2);
  }

  function onDown(e) {
    drawing = true;
    draw(e.offsetX, e.offsetY);
  }

  function onMove(e) {
    if (!drawing) return;
    draw(e.offsetX, e.offsetY);
  }

  function onUp() {
    drawing = false;
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  return () => {
    canvas.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
}

/* ==========================================================================
   Filter demo (feature-flagged)
   ========================================================================== */

function initFilterDemo(root, flags) {
  if (!flags.filters) return noop;

  const target = root.querySelector('.demo-filter-target');
  if (!target) return noop;

  // No JS needed now — placeholder for future param control
  return noop;
}

/* ==========================================================================
   Utilities
   ========================================================================== */

function noop() {}
