/**
 * palette-treat-discovery.js
 * ---------------------------------------------------------------------------
 * Decorative palette treats: probe-chip splashes when freshness beats, discovery
 * rewards, discover-phase interaction, palette resonance changes, or arrow-key
 * keyboard navigation land.
 */

import { readMicrointeractionPulseMs } from './pulse-beat-tuner.js';

// The palette probes are now one feature in the generic field guide, not a
// bespoke reward mechanism. It declares its contract here; the engine owns
// encounter classification, memory, and the "depth" progression (tier ×
// attentional arc) that used to live inline in this module.
const PALETTE_FEATURE = Object.freeze({
  species: 'palette-probe',
  label: 'Palette probes',
  traits: ['escalating-reward', 'resonance', 'keyboard-navigable'],
  progression: 'depth',
  memory: 'persistent',
});

const TREAT_EVENT = 'spw:palette-treat';
const COOLDOWN_MS = 360;
const ARROW_COOLDOWN_MS = 110;

const BEAT_TO_PROBE = Object.freeze({ 1: 1, 5: 2, 9: 3, 13: 4 });
const RESONANCE_TO_PROBE = Object.freeze({
  situate: 1,
  route: 1,
  hand: 2,
  craft: 2,
  lattice: 3,
  software: 3,
  inquiry: 4,
  math: 4,
});

const PROBE_LABELS = Object.freeze([
  'Probe 1 — primary accent',
  'Probe 2 — object voice',
  'Probe 3 — reference voice',
  'Probe 4 — inquiry voice',
]);

const PROBE_SWATCH_SELECTOR = '.palette-probe-swatches:not(.palette-probe-swatches--depth)';
const SHELL_SWATCH_SELECTOR = '.spw-shell-resonance-utility';
const NAVIGABLE_CHIP_SELECTOR = '.palette-probe-chip:not(.palette-probe-chip--depth-shadow):not(.palette-probe-chip--depth-highlight):not(.palette-probe-chip--depth-glow)';
const RESONANCE_CONTROL_SELECTOR = '[data-site-setting-set^="paletteResonance:"]';
const RESONANCE_TOOLBAR_SELECTOR = '.palette-probe-actions, .vibe-widget-actions, .wonder-memory-actions';

let initialized = false;
let treatTimer = null;
let lastTreatAt = 0;
let lastResonance = '';
let suppressFocusReward = false;
let paletteFeatureRegistered = false;
let featureReadyBound = false;
const attributeSnapshots = new Map();

function snapshotAttributes(element, names) {
  if (!(element instanceof Element)) return;
  let snapshot = attributeSnapshots.get(element);
  if (!snapshot) {
    snapshot = new Map();
    attributeSnapshots.set(element, snapshot);
  }
  names.forEach((name) => {
    if (!snapshot.has(name)) snapshot.set(name, element.getAttribute(name));
  });
}

function restoreEnhancedAttributes() {
  attributeSnapshots.forEach((snapshot, element) => {
    snapshot.forEach((value, name) => {
      if (value == null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    });
  });
  attributeSnapshots.clear();
}

const featureGuide = () => (typeof window !== 'undefined' ? window.spwFeatureDiscovery : null);

function registerPaletteFeature() {
  if (paletteFeatureRegistered) return true;
  const guide = featureGuide();
  if (!guide?.register) return false;
  guide.register(PALETTE_FEATURE);
  paletteFeatureRegistered = true;
  return true;
}

function discoverPaletteFeature(detail) {
  registerPaletteFeature();
  return featureGuide()?.discover?.(PALETTE_FEATURE.species, detail) || null;
}

function onFeatureDiscoveryReady() {
  featureReadyBound = false;
  registerPaletteFeature();
}

function bindFeatureDiscoveryReady() {
  if (featureReadyBound || typeof document === 'undefined') return;
  featureReadyBound = true;
  // The generic guide is behavior-gated and mounts at idle. Palette treats can
  // remain useful everywhere without pulling that engine into every route.
  document.addEventListener('spw:feature-discovery-ready', onFeatureDiscoveryReady, { once: true });
}

function unbindFeatureDiscoveryReady() {
  if (!featureReadyBound || typeof document === 'undefined') return;
  document.removeEventListener('spw:feature-discovery-ready', onFeatureDiscoveryReady);
  featureReadyBound = false;
}

function isTreatEnabled(html) {
  if (html.dataset.spwReduceMotion === 'on') return false;
  if (html.dataset.spwAnimationThrottling === 'heavy') return false;
  const freshness = Number.parseFloat(html.dataset.spwFreshnessWeight || '');
  if (Number.isFinite(freshness) && freshness < 0.2) return false;
  return true;
}

function probeFromBeat(beat) {
  return BEAT_TO_PROBE[beat] || null;
}

function probeFromResonance(value = '') {
  const normalized = String(value).trim().toLowerCase();
  return RESONANCE_TO_PROBE[normalized] || 1;
}

function probeFromReward(detail = {}) {
  const seed = detail.reward
    || detail.id
    || detail.presentation
    || detail.source
    || 'discovery';
  let hash = 0;
  for (const char of String(seed)) {
    hash = ((hash * 31) + char.charCodeAt(0)) % 997;
  }
  return (hash % 4) + 1;
}

function probeFromResonanceControl(control) {
  if (!(control instanceof HTMLElement)) return 1;
  const attr = control.getAttribute('data-site-setting-set') || '';
  const value = attr.split(':')[1]?.trim().toLowerCase();
  return probeFromResonance(value);
}

function readActiveProbeIndex(html) {
  const resonance = html.dataset.spwPaletteResonance || lastResonance || 'route';
  return probeFromResonance(resonance);
}

function clearChipTreats(root) {
  root.querySelectorAll('[data-spw-palette-treat="true"]').forEach((chip) => {
    delete chip.dataset.spwPaletteTreat;
  });
}

function markProbeChips(root, probeIndex) {
  clearChipTreats(root);

  const markGroup = (group) => {
    const chips = group.querySelectorAll('.palette-probe-chip');
    const chip = chips[probeIndex - 1];
    if (chip instanceof HTMLElement) chip.dataset.spwPaletteTreat = 'true';
  };

  root.querySelectorAll(PROBE_SWATCH_SELECTOR).forEach(markGroup);
  root.querySelectorAll(SHELL_SWATCH_SELECTOR).forEach(markGroup);
}

function emitArrowReward(root, probeIndex, detail = {}) {
  root.dispatchEvent(new CustomEvent('spw:discovery-reward', {
    detail: {
      source: 'arrow-reward',
      reward: `probe-${probeIndex}`,
      probe: probeIndex,
      ...detail,
    },
    bubbles: true,
  }));
}

function splashTreat(html, source, probeIndex, detail = {}) {
  if (!html || !probeIndex || !isTreatEnabled(html)) return;

  const now = Date.now();
  const arrowReward = source === 'arrow-reward';
  if (!arrowReward && source !== 'beat-prime' && now - lastTreatAt < COOLDOWN_MS) return;
  if (arrowReward && now - lastTreatAt < ARROW_COOLDOWN_MS) return;
  lastTreatAt = now;

  const root = html.ownerDocument || document;
  // Record the encounter in the field guide; the engine returns the progression
  // level (its "depth" model: collection tier × attentional arc) which drives the
  // treat's escalation. Progression/memory/convergence live in the engine now;
  // the treat visuals below stay palette-specific.
  const discovered = discoverPaletteFeature({ source, variant: probeIndex, trigger: source });
  const depth = discovered ? discovered.level : 0;
  html.dataset.spwPaletteSplash = source;
  html.dataset.spwPaletteTreatActive = 'on';
  html.dataset.spwPaletteTreatProbe = String(probeIndex);
  html.dataset.spwPaletteTreatDepth = String(depth);
  markProbeChips(root, probeIndex);

  root.dispatchEvent(new CustomEvent(TREAT_EVENT, {
    detail: { source, probe: probeIndex, depth, ...detail },
    bubbles: true,
  }));

  if (arrowReward) emitArrowReward(root, probeIndex, detail);

  if (treatTimer) window.clearTimeout(treatTimer);
  const duration = Math.round(readMicrointeractionPulseMs(root) * (arrowReward ? 1.04 : 1.18));
  treatTimer = window.setTimeout(() => {
    delete html.dataset.spwPaletteSplash;
    delete html.dataset.spwPaletteTreatActive;
    delete html.dataset.spwPaletteTreatProbe;
    delete html.dataset.spwPaletteTreatDepth;
    clearChipTreats(root);
  }, duration);
}

function listRailChips(rail) {
  if (!(rail instanceof HTMLElement)) return [];
  if (rail.matches(SHELL_SWATCH_SELECTOR)) {
    return [...rail.querySelectorAll('.palette-probe-chip--shell')];
  }
  return [...rail.querySelectorAll(NAVIGABLE_CHIP_SELECTOR)];
}

function syncRailFocus(rail, activeIndex) {
  const chips = listRailChips(rail);
  chips.forEach((chip, index) => {
    const selected = index + 1 === activeIndex;
    chip.setAttribute('aria-checked', selected ? 'true' : 'false');
    chip.tabIndex = selected ? 0 : -1;
  });
  const activeChip = chips[activeIndex - 1];
  if (activeChip instanceof HTMLElement && document.activeElement !== activeChip) {
    suppressFocusReward = true;
    activeChip.focus({ preventScroll: true });
    suppressFocusReward = false;
  }
}

function enhanceProbeRail(rail, html, signal) {
  if (!(rail instanceof HTMLElement) || rail.dataset.spwPaletteProbeRail === 'ready') return;

  const chips = listRailChips(rail);
  if (chips.length < 2) return;

  snapshotAttributes(rail, ['data-spw-palette-probe-rail', 'role', 'aria-orientation', 'aria-label']);
  rail.dataset.spwPaletteProbeRail = 'ready';
  rail.setAttribute('role', 'radiogroup');
  rail.setAttribute('aria-orientation', 'horizontal');
  if (!rail.hasAttribute('aria-label')) {
    rail.setAttribute('aria-label', 'Palette resonance probe swatches');
  }

  const activeIndex = readActiveProbeIndex(html);
  chips.forEach((chip, index) => {
    snapshotAttributes(chip, ['role', 'data-spw-palette-probe-index', 'aria-label', 'aria-checked', 'tabindex']);
    const probeIndex = index + 1;
    chip.setAttribute('role', 'radio');
    chip.dataset.spwPaletteProbeIndex = String(probeIndex);
    if (!chip.hasAttribute('aria-label')) {
      chip.setAttribute('aria-label', PROBE_LABELS[index] || `Probe ${probeIndex}`);
    }
    chip.setAttribute('aria-checked', probeIndex === activeIndex ? 'true' : 'false');
    chip.tabIndex = probeIndex === activeIndex ? 0 : -1;
  });

  const onRailFocus = (event) => {
    if (suppressFocusReward) return;
    const chip = event.target.closest(NAVIGABLE_CHIP_SELECTOR + ', .palette-probe-chip--shell');
    if (!(chip instanceof HTMLElement) || !rail.contains(chip)) return;
    const probeIndex = Number.parseInt(chip.dataset.spwPaletteProbeIndex || '', 10);
    if (!Number.isFinite(probeIndex)) return;
    syncRailFocus(rail, probeIndex);
    splashTreat(html, 'arrow-reward', probeIndex, { input: 'focus' });
  };

  const onRailKeydown = (event) => {
    const chip = event.target.closest(NAVIGABLE_CHIP_SELECTOR + ', .palette-probe-chip--shell');
    if (!(chip instanceof HTMLElement) || !rail.contains(chip)) return;

    const chips = listRailChips(rail);
    const currentIndex = chips.indexOf(chip);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % chips.length;
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + chips.length) % chips.length;
        event.preventDefault();
        break;
      case 'Home':
        nextIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        nextIndex = chips.length - 1;
        event.preventDefault();
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        break;
      default:
        return;
    }

    const probeIndex = nextIndex + 1;
    syncRailFocus(rail, probeIndex);
    splashTreat(html, 'arrow-reward', probeIndex, { input: 'keyboard', key: event.key });
  };

  rail.addEventListener('focusin', onRailFocus, { signal });
  rail.addEventListener('keydown', onRailKeydown, { signal });
}

function enhanceResonanceToolbar(toolbar, html, signal) {
  if (!(toolbar instanceof HTMLElement) || toolbar.dataset.spwPaletteProbeToolbar === 'ready') return;

  const controls = [...toolbar.querySelectorAll(RESONANCE_CONTROL_SELECTOR)]
    .filter((node) => node instanceof HTMLElement);
  if (controls.length < 2) return;

  snapshotAttributes(toolbar, ['data-spw-palette-probe-toolbar', 'role', 'aria-label']);
  toolbar.dataset.spwPaletteProbeToolbar = 'ready';
  toolbar.setAttribute('role', 'toolbar');
  if (!toolbar.hasAttribute('aria-label')) {
    toolbar.setAttribute('aria-label', 'Dimensional resonance choices');
  }

  const onToolbarKeydown = (event) => {
    const control = event.target.closest(RESONANCE_CONTROL_SELECTOR);
    if (!(control instanceof HTMLElement) || !toolbar.contains(control)) return;

    const items = [...toolbar.querySelectorAll(RESONANCE_CONTROL_SELECTOR)];
    const currentIndex = items.indexOf(control);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length;
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        event.preventDefault();
        break;
      case 'Home':
        nextIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        nextIndex = items.length - 1;
        event.preventDefault();
        break;
      default:
        return;
    }

    const nextControl = items[nextIndex];
    if (!(nextControl instanceof HTMLElement)) return;
    nextControl.focus({ preventScroll: true });
    splashTreat(html, 'arrow-reward', probeFromResonanceControl(nextControl), {
      input: 'keyboard',
      key: event.key,
      target: 'resonance-control',
    });
  };

  toolbar.addEventListener('keydown', onToolbarKeydown, { signal });
}

function enhanceKeyboardSurfaces(root, html, signal) {
  root.querySelectorAll(PROBE_SWATCH_SELECTOR).forEach((rail) => enhanceProbeRail(rail, html, signal));
  root.querySelectorAll(SHELL_SWATCH_SELECTOR).forEach((rail) => enhanceProbeRail(rail, html, signal));
  root.querySelectorAll(RESONANCE_TOOLBAR_SELECTOR).forEach((toolbar) => {
    if (toolbar.querySelector(RESONANCE_CONTROL_SELECTOR)) {
      enhanceResonanceToolbar(toolbar, html, signal);
    }
  });
}

function syncRailsToResonance(root, html) {
  const activeIndex = readActiveProbeIndex(html);
  root.querySelectorAll(`[data-spw-palette-probe-rail="ready"]`).forEach((rail) => {
    syncRailFocus(rail, activeIndex);
  });
}

export function initPaletteTreatDiscovery(root = document) {
  if (initialized) return () => {};
  initialized = true;

  // Declare the palette-probe feature to the field guide. Registration is
  // order-independent: the depth progression reads the root tokens directly, so
  // it resolves whether or not the discovery engine has mounted yet.
  if (!registerPaletteFeature()) bindFeatureDiscoveryReady();

  const html = root.documentElement;
  const controller = new AbortController();
  const { signal } = controller;

  const onFreshnessPulse = (event) => {
    const source = event.detail?.source || html.dataset.spwFreshnessPulse;
    if (source === 'beat-prime') {
      const probe = probeFromBeat(event.detail?.beat || Number.parseInt(html.dataset.spwBeat || '', 10));
      if (probe) splashTreat(html, 'beat-prime', probe, event.detail || {});
      return;
    }
    if (String(source || '').startsWith('phase-')) {
      const phase = event.detail?.phase || source.replace('phase-', '');
      if (phase === 'discover') {
        splashTreat(html, 'discover-phase', probeFromBeat(Number.parseInt(html.dataset.spwBeat || '', 10)) || 4, event.detail || {});
      }
    }
  };

  const onDiscoveryReward = (event) => {
    if (event.detail?.source === 'arrow-reward') return;
    splashTreat(html, 'discovery', probeFromReward(event.detail || {}), event.detail || {});
  };

  const onInteractionPhase = (event) => {
    if (event.detail?.phase !== 'discover') return;
    const beatProbe = probeFromBeat(Number.parseInt(html.dataset.spwBeat || '', 10));
    splashTreat(html, 'discover-phase', beatProbe || probeFromReward(event.detail || {}), event.detail || {});
  };

  const onSettingsChange = (event) => {
    const resonance = event.detail?.paletteResonance
      || event.detail?.settings?.paletteResonance
      || html.dataset.spwPaletteResonance;
    if (!resonance) return;
    const changed = resonance !== lastResonance;
    lastResonance = String(resonance);
    syncRailsToResonance(root, html);
    if (!changed) return;
    splashTreat(html, 'resonance-change', probeFromResonance(resonance), {
      paletteResonance: resonance,
      ...(event.detail || {}),
    });
  };

  const refreshKeyboardSurfaces = () => enhanceKeyboardSurfaces(root, html, signal);

  lastResonance = String(html.dataset.spwPaletteResonance || '');
  refreshKeyboardSurfaces();
  syncRailsToResonance(root, html);

  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => refreshKeyboardSurfaces());
    observer.observe(root.body || root.documentElement, {
      childList: true,
      subtree: true,
    });
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }

  root.addEventListener('spw:freshness-pulse', onFreshnessPulse, { signal });
  root.addEventListener('spw:discovery-reward', onDiscoveryReward, { signal });
  root.addEventListener('spw:interaction-phase', onInteractionPhase, { signal });
  root.addEventListener('spw:settings-change', onSettingsChange, { signal });
  root.addEventListener('spw:settings:changed', onSettingsChange, { signal });

  controller.signal.addEventListener('abort', () => {
    if (treatTimer) window.clearTimeout(treatTimer);
    treatTimer = null;
    lastTreatAt = 0;
    delete html.dataset.spwPaletteSplash;
    delete html.dataset.spwPaletteTreatActive;
    delete html.dataset.spwPaletteTreatProbe;
    delete html.dataset.spwPaletteTreatDepth;
    clearChipTreats(root);
    restoreEnhancedAttributes();
    unbindFeatureDiscoveryReady();
    paletteFeatureRegistered = false;
    lastResonance = '';
    suppressFocusReward = false;
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}

export { TREAT_EVENT, BEAT_TO_PROBE, RESONANCE_TO_PROBE };
