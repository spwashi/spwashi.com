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

  const target = container.querySelector('.demo-io-target');
  const indicator = root.querySelector('.demo-io-threshold-indicator');
  if (!target) return noop;

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;

      const ratio = entry.intersectionRatio;
      target.style.setProperty('--io-ratio', ratio.toFixed(2));

      if (indicator) {
        const label = ratio >= 0.5 ? 'threshold: crossed' : 'threshold: not crossed';
        indicator.textContent = `${label} (${ratio.toFixed(2)})`;
      }
    },
    {
      root: container,
      threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
    }
  );

  observer.observe(target);

  return () => observer.disconnect();
}

/* ==========================================================================
   Audio demo (gated)
   ========================================================================== */

function initAudioDemo(root, flags) {
  if (!flags.enhance) return noop;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  const btn = root.querySelector('.demo-audio-btn');
  const frequency = root.querySelector('#audio-freq');
  const frequencyOut = root.querySelector('#audio-freq-out');
  const waveform = root.querySelector('#audio-wave');
  const wavePath = root.querySelector('#audio-wave-path');
  if (!btn || !frequency || !frequencyOut || !waveform || !wavePath || !AudioCtor) return noop;

  let ctx = null;
  let osc = null;
  let gain = null;

  function buildWavePath(type) {
    const width = 300;
    const height = 60;
    const mid = height / 2;
    const amplitude = height * 0.3;
    const points = 36;
    const coords = [];

    for (let index = 0; index <= points; index += 1) {
      const progress = index / points;
      const phase = progress * Math.PI * 2;
      let value = Math.sin(phase);

      if (type === 'triangle') {
        value = (2 / Math.PI) * Math.asin(Math.sin(phase));
      } else if (type === 'square') {
        value = Math.sin(phase) >= 0 ? 1 : -1;
      } else if (type === 'sawtooth') {
        value = 2 * (progress - Math.floor(progress + 0.5));
      }

      const x = width * progress;
      const y = mid - value * amplitude;
      coords.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }

    return coords.join(' ');
  }

  function syncAudioState() {
    const freqValue = Math.round(Number(frequency.value) || 220);
    const waveValue = waveform.value || 'sine';

    frequencyOut.textContent = `${freqValue} Hz`;
    wavePath.setAttribute('d', buildWavePath(waveValue));

    if (!osc || !ctx) return;
    osc.frequency.setValueAtTime(freqValue, ctx.currentTime);
    osc.type = waveValue;
  }

  function start() {
    ctx = new AudioCtor();
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    syncAudioState();
    osc.start();
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = '~ stop tone';
  }

  function stop() {
    if (!osc) return;
    osc.stop();
    osc.disconnect();
    gain?.disconnect();
    ctx?.close();
    osc = null;
    gain = null;
    ctx = null;
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = '~ emit tone';
  }

  function toggle() {
    if (osc) stop();
    else start();
  }

  btn.textContent = '~ emit tone';
  syncAudioState();

  btn.addEventListener('click', toggle);
  frequency.addEventListener('input', syncAudioState);
  waveform.addEventListener('change', syncAudioState);

  return () => {
    btn.removeEventListener('click', toggle);
    frequency.removeEventListener('input', syncAudioState);
    waveform.removeEventListener('change', syncAudioState);
    stop();
  };
}

/* ==========================================================================
   Canvas demo (scoped, no global listeners)
   ========================================================================== */

function initCanvasDemo(root, flags) {
  if (!flags.enhance) return noop;

  const canvas = root.querySelector('.demo-canvas-wrap canvas');
  const clearButton = root.querySelector('#canvas-clear');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) return noop;

  const ctx = canvas.getContext('2d');
  if (!ctx) return noop;

  let drawing = false;
  const nodes = [];
  const canvasState = {
    width: canvas.width,
    height: canvas.height,
    ratio: 1,
  };

  function redraw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(canvasState.ratio, 0, 0, canvasState.ratio, 0, 0);

    ctx.strokeStyle = 'rgba(24,123,135,0.12)';
    ctx.lineWidth = 1;
    for (let x = 24; x < canvasState.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasState.height);
      ctx.stroke();
    }
    for (let y = 24; y < canvasState.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasState.width, y);
      ctx.stroke();
    }

    nodes.forEach(({ x, y, radius }) => {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(24,123,135,0.28)';
      ctx.arc(x, y, radius * 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = 'rgba(24,123,135,0.66)';
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(220, Math.round(rect.width || canvas.clientWidth || canvas.width));
    const height = Math.max(160, Math.round(rect.height || width * 0.38));
    const ratio = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvasState.width = width;
    canvasState.height = height;
    canvasState.ratio = ratio;
    redraw();
  }

  function addNode(x, y) {
    nodes.push({
      x,
      y,
      radius: 1.8 + Math.random() * 2.4,
    });
    redraw();
  }

  function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function onPointerDown(event) {
    drawing = true;
    canvas.setPointerCapture?.(event.pointerId);
    const point = getPointerPosition(event);
    addNode(point.x, point.y);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!drawing) return;
    const point = getPointerPosition(event);
    addNode(point.x, point.y);
    event.preventDefault();
  }

  function onPointerUp(event) {
    drawing = false;
    canvas.releasePointerCapture?.(event.pointerId);
  }

  function onClear() {
    nodes.length = 0;
    redraw();
  }

  function onKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    addNode(
      canvasState.width * 0.5 + (Math.random() - 0.5) * Math.min(40, canvasState.width * 0.12),
      canvasState.height * 0.5 + (Math.random() - 0.5) * Math.min(40, canvasState.height * 0.18)
    );
  }

  syncCanvasSize();

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', syncCanvasSize);
  clearButton?.addEventListener('click', onClear);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', syncCanvasSize);
    clearButton?.removeEventListener('click', onClear);
  };
}

/* ==========================================================================
   Filter demo (feature-flagged)
   ========================================================================== */

function initFilterDemo(root, flags) {
  if (!flags.filters) return noop;

  const target = root.querySelector('.demo-filter-target');
  const frequency = root.querySelector('#turb-freq');
  const frequencyOut = root.querySelector('#turb-freq-out');
  const scale = root.querySelector('#displace-scale');
  const scaleOut = root.querySelector('#displace-scale-out');
  const turbulence = root.querySelector('#demo-turbulence');
  const displace = root.querySelector('#demo-displace');
  const codeOut = root.querySelector('#filter-code-out');
  if (!target || !frequency || !frequencyOut || !scale || !scaleOut || !turbulence || !displace || !codeOut) {
    return noop;
  }

  function syncFilter() {
    const frequencyValue = Number(frequency.value);
    const scaleValue = Math.round(Number(scale.value) || 0);
    const frequencyText = frequencyValue.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

    turbulence.setAttribute('baseFrequency', frequencyText);
    displace.setAttribute('scale', String(scaleValue));
    frequencyOut.textContent = frequencyText;
    scaleOut.textContent = String(scaleValue);
    codeOut.textContent = `<feTurbulence baseFrequency="${frequencyText}"/>\n<feDisplacementMap scale="${scaleValue}"/>`;
  }

  syncFilter();
  frequency.addEventListener('input', syncFilter);
  scale.addEventListener('input', syncFilter);

  return () => {
    frequency.removeEventListener('input', syncFilter);
    scale.removeEventListener('input', syncFilter);
  };
}

/* ==========================================================================
   Utilities
   ========================================================================== */

function noop() {}
