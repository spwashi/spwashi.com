/**
 * Texture slice
 * --------------------------------------------------------------------------
 * Hash an authored seed into a crop of a morning material tile.
 * Opt-in: [data-spw-texture-slice]. Fine pointers may nudge the crop;
 * coarse pointers stay still (gesture-state-refinement). Capture freezes.
 */

const HOST_SELECTOR = '[data-spw-texture-slice]';
const FAMILIES = Object.freeze(['paper', 'linen', 'harlequin', 'wash']);
const SLICE_CLASS = 'spw-texture-slice';
const PARALLAX = 2.25;
const CAPTURE_ATTRS = Object.freeze([
  'data-spw-capture-mode',
  'data-spw-reduce-motion',
  'data-spw-color-mode',
  'data-spw-high-contrast',
  'data-spw-theme-pack',
  'data-spw-pointer-mode',
]);
const FORBIDDEN_OVERLAY_HOSTS = new Set([
  'OL', 'UL', 'DL', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'SELECT',
]);

function hashSeed(value = '') {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function familyFor(host, hash) {
  const authored = host.getAttribute('data-spw-texture-slice') || '';
  if (FAMILIES.includes(authored)) return authored;
  return FAMILIES[hash % FAMILIES.length];
}

function canMountOverlay(host) {
  return !FORBIDDEN_OVERLAY_HOSTS.has(host.tagName);
}

function overlayFor(host) {
  if (!canMountOverlay(host)) return null;
  let overlay = host.querySelector(`:scope > .${SLICE_CLASS}`);
  if (overlay) return overlay;
  overlay = document.createElement('span');
  overlay.className = SLICE_CLASS;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.dataset.spwOverlay = 'texture-slice';
  host.prepend(overlay);
  return overlay;
}

function restoreAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function prefersReducedMotion() {
  return document.documentElement.dataset.spwReduceMotion === 'on'
    || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

function isCoarsePointer() {
  return document.documentElement.dataset.spwPointerMode === 'coarse'
    || window.matchMedia?.('(pointer: coarse)')?.matches === true;
}

function isCapturing() {
  return Boolean(document.documentElement.dataset.spwCaptureMode);
}

function isHighContrast() {
  return document.documentElement.dataset.spwHighContrast === 'on';
}

function parseLightness(value) {
  const hsl = String(value || '').match(/hsl\(\s*[\d.]+[,\s]+[\d.]+%?[,\s]+([\d.]+)%/i);
  if (hsl) return Number(hsl[1]);
  const space = String(value || '').match(/hsl\(\s*[\d.]+\s+[\d.]+%\s+([\d.]+)%/i);
  if (space) return Number(space[1]);
  return null;
}

function groundPolarity() {
  if (isHighContrast()) return 'guarded';
  const root = document.documentElement;
  if (root.dataset.spwColorMode === 'dark') return 'dark';
  const bg = getComputedStyle(root).getPropertyValue('--bg');
  const lightness = parseLightness(bg);
  if (lightness == null) return 'light';
  return lightness < 42 ? 'dark' : 'light';
}

function parallaxAmount() {
  const ground = groundPolarity();
  if (ground === 'guarded') return 1.5;
  if (ground === 'dark') return 3;
  return PARALLAX;
}

function canParallax() {
  return !prefersReducedMotion() && !isCoarsePointer() && !isCapturing();
}

function resetParallax(host) {
  host.style.setProperty('--spw-slice-px', '0%');
  host.style.setProperty('--spw-slice-py', '0%');
}

function readInlineVar(host, property) {
  return {
    value: host.style.getPropertyValue(property),
    priority: host.style.getPropertyPriority(property),
  };
}

function readHostState(host) {
  return {
    family: host.getAttribute('data-spw-texture-slice'),
    ground: host.getAttribute('data-spw-slice-ground'),
    sliceFamily: host.getAttribute('data-spw-slice-family'),
    inline: {
      u: readInlineVar(host, '--spw-slice-u'),
      v: readInlineVar(host, '--spw-slice-v'),
      size: readInlineVar(host, '--spw-slice-size'),
      px: readInlineVar(host, '--spw-slice-px'),
      py: readInlineVar(host, '--spw-slice-py'),
    },
  };
}

function restoreHostState(host, state) {
  restoreAttribute(host, 'data-spw-texture-slice', state?.family);
  restoreAttribute(host, 'data-spw-slice-ground', state?.ground);
  restoreAttribute(host, 'data-spw-slice-family', state?.sliceFamily);

  const u = state?.inline?.u;
  if (u?.value) host.style.setProperty('--spw-slice-u', u.value, u.priority);
  else host.style.removeProperty('--spw-slice-u');

  const v = state?.inline?.v;
  if (v?.value) host.style.setProperty('--spw-slice-v', v.value, v.priority);
  else host.style.removeProperty('--spw-slice-v');

  const size = state?.inline?.size;
  if (size?.value) host.style.setProperty('--spw-slice-size', size.value, size.priority);
  else host.style.removeProperty('--spw-slice-size');

  const px = state?.inline?.px;
  if (px?.value) host.style.setProperty('--spw-slice-px', px.value, px.priority);
  else host.style.removeProperty('--spw-slice-px');

  const py = state?.inline?.py;
  if (py?.value) host.style.setProperty('--spw-slice-py', py.value, py.priority);
  else host.style.removeProperty('--spw-slice-py');
}

function seedHashFor(host) {
  const seed = host.getAttribute('data-spw-image-key')
    || host.getAttribute('data-spw-seed')
    || host.getAttribute('id')
    || host.getAttribute('data-spw-feature')
    || '';
  return hashSeed(seed || host.className);
}

function syncEnvironment(host, hash = seedHashFor(host)) {
  const overlay = overlayFor(host);
  const family = familyFor(host, hash);
  const capturing = isCapturing();
  const ground = groundPolarity();
  const guarded = ground === 'guarded' || isHighContrast();

  host.setAttribute('data-spw-slice-ground', ground);
  host.setAttribute('data-spw-slice-family', family);
  if (!overlay) return;
  overlay.dataset.spwSliceFamily = family;
  overlay.dataset.spwSliceGlitch = (capturing || guarded) ? 'false' : (((hash >>> 16) % 5) === 0 ? 'true' : 'false');
}

function annotate(host) {
  const hash = seedHashFor(host);
  const u = 8 + (hash % 78);
  const v = 10 + ((hash >>> 8) % 74);

  host.style.setProperty('--spw-slice-u', `${u}%`);
  host.style.setProperty('--spw-slice-v', `${v}%`);
  host.style.setProperty('--spw-slice-size', `${155 + (hash % 40)}%`);
  resetParallax(host);
  syncEnvironment(host, hash);
}

function bindParallax(host, unbinds) {
  let frame = 0;

  const onMove = (event) => {
    if (!canParallax()) {
      resetParallax(host);
      return;
    }
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const amount = parallaxAmount();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * amount;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2 * amount;
      host.style.setProperty('--spw-slice-px', `${x.toFixed(2)}%`);
      host.style.setProperty('--spw-slice-py', `${y.toFixed(2)}%`);
    });
  };

  const onLeave = () => {
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    resetParallax(host);
  };

  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('blur', onLeave, true);
  unbinds.push(() => {
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerleave', onLeave);
    host.removeEventListener('blur', onLeave, true);
    if (frame) window.cancelAnimationFrame(frame);
    resetParallax(host);
  });
}

export function initTextureSlice() {
  const hosts = [...document.querySelectorAll(HOST_SELECTOR)];
  const hostStates = new Map(hosts.map((host) => [host, readHostState(host)]));
  const overlayStates = new Map(hosts.map((host) => {
    const overlay = host.querySelector(`:scope > .${SLICE_CLASS}`);
    return [host, overlay ? {
      element: overlay,
      family: overlay.getAttribute('data-spw-slice-family'),
      glitch: overlay.getAttribute('data-spw-slice-glitch'),
    } : null];
  }));
  const pointerUnbinds = [];
  const abort = new AbortController();
  const { signal } = abort;

  hosts.forEach(annotate);

  const rebindPointers = () => {
    pointerUnbinds.splice(0).forEach((fn) => fn());
    hosts.forEach((host) => syncEnvironment(host));
    if (!canParallax()) {
      hosts.forEach((host) => {
        resetParallax(host);
        const overlay = host.querySelector(`:scope > .${SLICE_CLASS}`);
        if (overlay && (isCapturing() || isHighContrast())) overlay.dataset.spwSliceGlitch = 'false';
      });
      return;
    }
    hosts.forEach((host) => bindParallax(host, pointerUnbinds));
  };

  rebindPointers();

  window.matchMedia?.('(prefers-reduced-motion: reduce)')
    ?.addEventListener?.('change', rebindPointers, { signal });
  window.matchMedia?.('(pointer: coarse)')
    ?.addEventListener?.('change', rebindPointers, { signal });

  const captureObserver = new MutationObserver(rebindPointers);
  captureObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [...CAPTURE_ATTRS],
  });

  return () => {
    abort.abort();
    captureObserver.disconnect();
    pointerUnbinds.splice(0).forEach((fn) => fn());
    hosts.forEach((host) => {
      const overlay = host.querySelector(`:scope > .${SLICE_CLASS}`);
      const authoredOverlay = overlayStates.get(host);
      if (authoredOverlay?.element === overlay) {
        restoreAttribute(overlay, 'data-spw-slice-family', authoredOverlay.family);
        restoreAttribute(overlay, 'data-spw-slice-glitch', authoredOverlay.glitch);
      } else {
        overlay?.remove();
      }
      restoreHostState(host, hostStates.get(host));
    });
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'texture-slice',
  mount: () => initTextureSlice(),
  describes: 'texture[slice]{paper.linen.harlequin.wash.auto}<glitch.lift.screenshot>',
  updates: [
    'flourish:data-spw-slice-ground',
    'flourish:data-spw-overlay',
    'flourish:data-spw-slice-family',
    'flourish:data-spw-slice-glitch',
    'flourish:--spw-slice-u',
    'flourish:--spw-slice-v',
    'flourish:--spw-slice-size',
    'flourish:--spw-slice-px',
    'flourish:--spw-slice-py',
  ],
  timingArc: 'visible-media',
  effectScope: 'local-dom css-vars pointer',
});

export const spwModule = SPW_MODULE_EXPORT;
