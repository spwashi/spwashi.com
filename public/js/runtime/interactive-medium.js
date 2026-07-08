/**
 * interactive-medium.js
 * ---------------------------------------------------------------------------
 * Entertainment and interactive-medium register: classifies route posture,
 * syncs device-specific tokens for module-added styles, and exposes snapshots
 * for page anatomy / topical handoff.
 */

import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { projectFeatureRouteContext } from '/public/js/kernel/feature-route-context.js';
import { presenceToken as normalizeToken } from '/public/js/kernel/text-normalization.js';

export const MEDIUM_REGISTERS = Object.freeze({
  SCENE: 'scene',
  PLAY: 'play',
  WORKSHOP: 'workshop',
  LAB: 'lab',
  READING: 'reading',
});

export const INTERACTION_POSTURES = Object.freeze({
  TOUCH_FIELD: 'touch-field',
  TOUCH_TABLET: 'touch-tablet',
  POINTER_BALANCED: 'pointer-balanced',
  POINTER_RICH: 'pointer-rich',
});

const BED_SELECTOR = '.spw-scene-bed[data-spw-scene-interactive], .spw-scene-bed[data-spw-scene-posture]';
const SCENE_HANDLE_SELECTOR = '[data-spw-scene-interpret]';
const PROMPT_HOST_SELECTOR = '[data-spw-prompt-host]';
const WONDER_SELECTOR = '.spw-wonder-block[data-spw-reveal-source]';

const PLAY_SURFACES = new Set(['play', 'rpg-wednesday', 'rpg']);
const PLAY_FAMILIES = new Set(['campaign']);
const SCENE_PAGE_FAMILIES = new Set(['practice-bed']);
const WORKSHOP_PAGE_FAMILIES = new Set(['workshop', 'laboratory']);

const DEVICE_ATTRS = Object.freeze([
  'data-spw-viewport-tier',
  'data-spw-pointer-mode',
  'data-spw-hover-mode',
  'data-spw-device-context',
]);

const ROUTE_ATTRS = Object.freeze([
  'data-spw-surface',
  'data-spw-page-family',
  'data-spw-page-modes',
  'data-spw-page-role',
  'data-spw-context',
]);

let initialized = false;
let syncRaf = 0;
let lastSignature = '';
let deviceObserver = null;
let hostObserver = null;
let routeObserver = null;
let activeRoot = document;
let handleSync = null;

function tokenIncludes(haystack = '', needle = '') {
  const tokens = normalizeToken(haystack).split(/\s+/).filter(Boolean);
  return tokens.includes(normalizeToken(needle));
}

function readBody() {
  return document.body instanceof HTMLElement ? document.body : null;
}

function readHtml() {
  return document.documentElement;
}

function readComputedCSSValue(element, name, fallback = '') {
  if (!(element instanceof Element) || typeof getComputedStyle !== 'function') return fallback;
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function countUniqueElements(root, selectors) {
  const seen = new Set();
  selectors.forEach((selector) => {
    root.querySelectorAll(selector).forEach((node) => {
      if (node instanceof Element) seen.add(node);
    });
  });
  return seen.size;
}

export function countInteractiveHosts(root = document) {
  const sceneBeds = root.querySelectorAll(BED_SELECTOR).length;
  const sceneHandles = root.querySelectorAll(SCENE_HANDLE_SELECTOR).length;
  const promptHosts = root.querySelectorAll(PROMPT_HOST_SELECTOR).length;
  const wonderBlocks = root.querySelectorAll(WONDER_SELECTOR).length;
  const uniqueHosts = countUniqueElements(root, [
    BED_SELECTOR,
    SCENE_HANDLE_SELECTOR,
    PROMPT_HOST_SELECTOR,
    WONDER_SELECTOR,
  ]);

  return {
    sceneBeds,
    sceneHandles,
    promptHosts,
    wonderBlocks,
    total: uniqueHosts,
  };
}

function hasSceneRegister(body, hosts) {
  if (hosts.sceneBeds > 0 || hosts.sceneHandles > 0) return true;
  const pageFamily = normalizeToken(body.dataset.spwPageFamily || '');
  const pageModes = normalizeToken(body.dataset.spwPageModes || '');
  const pageRole = normalizeToken(body.dataset.spwPageRole || '');
  return (
    SCENE_PAGE_FAMILIES.has(pageFamily)
    || tokenIncludes(pageModes, 'scene')
    || tokenIncludes(pageModes, 'film')
    || /(^|-)scene(-|$)/.test(pageRole)
  );
}

function hasPlayRegister(body) {
  const surface = normalizeToken(body.dataset.spwSurface || '');
  const pageFamily = normalizeToken(body.dataset.spwPageFamily || '');
  const pageModes = normalizeToken(body.dataset.spwPageModes || '');
  return (
    PLAY_SURFACES.has(surface)
    || PLAY_FAMILIES.has(pageFamily)
    || tokenIncludes(pageModes, 'play')
    || normalizeToken(body.dataset.spwContext || '') === 'play'
  );
}

function hasWorkshopRegister(body) {
  const pageFamily = normalizeToken(body.dataset.spwPageFamily || '');
  const pageModes = normalizeToken(body.dataset.spwPageModes || '');
  return (
    WORKSHOP_PAGE_FAMILIES.has(pageFamily)
    || tokenIncludes(pageModes, 'practice')
    || tokenIncludes(pageModes, 'build')
    || tokenIncludes(pageModes, 'compose')
  );
}

export function resolveMediumRegister(body = readBody(), root = document) {
  if (!body) return MEDIUM_REGISTERS.READING;

  const hosts = countInteractiveHosts(root);
  if (hasSceneRegister(body, hosts)) return MEDIUM_REGISTERS.SCENE;
  if (hasPlayRegister(body)) return MEDIUM_REGISTERS.PLAY;
  if (hasWorkshopRegister(body)) {
    return hosts.total > 0 ? MEDIUM_REGISTERS.WORKSHOP : MEDIUM_REGISTERS.LAB;
  }

  return hosts.total > 0 ? MEDIUM_REGISTERS.WORKSHOP : MEDIUM_REGISTERS.READING;
}

export function resolveInteractionPosture(html = readHtml()) {
  const tier = html?.dataset?.spwViewportTier || 'regular';
  const pointer = html?.dataset?.spwPointerMode || 'fine';
  const hover = html?.dataset?.spwHoverMode || 'hover';

  if (pointer === 'coarse' && (tier === 'compact' || tier === 'narrow')) {
    return INTERACTION_POSTURES.TOUCH_FIELD;
  }
  if (pointer === 'coarse' || hover === 'touch') {
    return INTERACTION_POSTURES.TOUCH_TABLET;
  }
  if (pointer === 'fine' && (tier === 'wide' || tier === 'regular')) {
    return INTERACTION_POSTURES.POINTER_RICH;
  }
  return INTERACTION_POSTURES.POINTER_BALANCED;
}

export function resolveMediumIntensity(register, hosts, html = readHtml()) {
  const baseByRegister = {
    [MEDIUM_REGISTERS.SCENE]: 0.82,
    [MEDIUM_REGISTERS.PLAY]: 0.76,
    [MEDIUM_REGISTERS.WORKSHOP]: 0.64,
    [MEDIUM_REGISTERS.LAB]: 0.52,
    [MEDIUM_REGISTERS.READING]: 0.42,
  };

  let weight = baseByRegister[register] ?? baseByRegister[MEDIUM_REGISTERS.READING];
  if (hosts.total > 0) weight += Math.min(0.12, hosts.total * 0.03);

  const tier = html?.dataset?.spwViewportTier || 'regular';
  if (tier === 'compact' || tier === 'narrow') weight += 0.06;
  if (html?.dataset?.spwPointerMode === 'coarse') weight += 0.05;

  return Math.min(1, Number(weight.toFixed(2)));
}

function buildSignature(snapshot) {
  return [
    snapshot.register,
    snapshot.posture,
    snapshot.intensity,
    snapshot.viewportTier,
    snapshot.pointerMode,
    snapshot.hoverMode,
    snapshot.hosts.total,
  ].join('|');
}

export function collectInteractiveMedium(root = document) {
  const html = readHtml();
  const body = readBody();
  const hosts = countInteractiveHosts(root);
  const register = resolveMediumRegister(body, root);
  const posture = resolveInteractionPosture(html);
  const intensity = resolveMediumIntensity(register, hosts, html);

  return {
    register,
    posture,
    intensity,
    viewportTier: html?.dataset?.spwViewportTier || '',
    pointerMode: html?.dataset?.spwPointerMode || '',
    hoverMode: html?.dataset?.spwHoverMode || '',
    deviceContext: html?.dataset?.spwDeviceContext || '',
    layout: body?.dataset?.spwLayout || '',
    pageFamily: body?.dataset?.spwPageFamily || '',
    pageModes: body?.dataset?.spwPageModes || '',
    surface: body?.dataset?.spwSurface || '',
    hosts,
    displayVariants: {
      packingTier: html?.dataset?.spwPackTier || readComputedCSSValue(html, '--spw-pack-tier'),
      componentDensity: html?.dataset?.spwComponentDensity || '',
      layoutPosture: html?.dataset?.spwLayoutPosture || html?.dataset?.spwExplorePosture || '',
      variantSelectionWeight: readComputedCSSValue(html, '--spw-variant-selection-weight'),
    },
    moduleTokens: {
      touchMin: readComputedCSSValue(html, '--spw-medium-touch-min'),
      revealStagger: readComputedCSSValue(html, '--spw-medium-reveal-stagger-step'),
      accentWeight: readComputedCSSValue(html, '--spw-medium-accent-weight'),
      styleModulator: readComputedCSSValue(html, '--spw-module-style-modulator'),
    },
  };
}

function applyInteractiveMedium(snapshot, html = readHtml()) {
  if (!html) return;

  projectFeatureRouteContext(html, {
    source: 'interactive-medium',
    reason: 'medium-sync',
  });

  writeDatasetValues(html, {
    spwMediumRegister: snapshot.register,
    spwInteractionPosture: snapshot.posture,
    spwMediumIntensity: String(snapshot.intensity),
    spwInteractiveMediumReady: 'true',
  });
  html.style.setProperty('--spw-medium-intensity', String(snapshot.intensity));
}

function syncInteractiveMedium(root = document, { force = false } = {}) {
  const html = readHtml();
  const snapshot = collectInteractiveMedium(root);
  const signature = buildSignature(snapshot);

  if (!force && signature === lastSignature) return snapshot;

  lastSignature = signature;
  applyInteractiveMedium(snapshot, html);
  return snapshot;
}

function scheduleSync(root = document) {
  if (syncRaf) window.cancelAnimationFrame(syncRaf);
  syncRaf = window.requestAnimationFrame(() => {
    syncRaf = 0;
    syncInteractiveMedium(root);
  });
}

function publishApi(root = document) {
  const api = {
    snapshot: () => collectInteractiveMedium(root),
    sync: (options) => syncInteractiveMedium(root, options),
    registers: MEDIUM_REGISTERS,
    postures: INTERACTION_POSTURES,
  };

  window.__SPW_INTERACTIVE_MEDIUM__ = api;
  window.spwInteractiveMedium = api;
}

export function initInteractiveMedium(root = document) {
  if (initialized) return () => {};
  initialized = true;

  publishApi(root);
  activeRoot = root;
  handleSync = () => scheduleSync(root);

  const html = readHtml();
  const body = readBody();
  const snapshot = syncInteractiveMedium(root, { force: true });

  window.addEventListener('resize', handleSync, { passive: true });
  window.addEventListener('orientationchange', handleSync, { passive: true });
  root.addEventListener('spw:shell-menu-state', handleSync);
  root.addEventListener('spw:variant-selected', handleSync);
  root.addEventListener('spw:scene-enter', handleSync);
  root.addEventListener('spw:scene-exit', handleSync);
  root.addEventListener('spw:scene-lane-focus', handleSync);
  root.addEventListener('spw:scene-bed-ready', handleSync);

  if (html instanceof HTMLElement) {
    deviceObserver = new MutationObserver(handleSync);
    deviceObserver.observe(html, {
      attributes: true,
      attributeFilter: DEVICE_ATTRS,
    });
  }

  if (body instanceof HTMLElement) {
    routeObserver = new MutationObserver(handleSync);
    routeObserver.observe(body, {
      attributes: true,
      attributeFilter: ROUTE_ATTRS,
    });
    hostObserver = new MutationObserver(handleSync);
    hostObserver.observe(body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-spw-scene-interactive', 'data-spw-scene-posture', 'hidden'],
    });
  }

  document.dispatchEvent(new CustomEvent('spw:interactive-medium-ready', {
    detail: snapshot,
    bubbles: true,
  }));

  return cleanup;
}

function cleanup() {
  initialized = false;
  if (syncRaf) window.cancelAnimationFrame(syncRaf);
  syncRaf = 0;
  lastSignature = '';

  if (handleSync) {
    window.removeEventListener('resize', handleSync);
    window.removeEventListener('orientationchange', handleSync);
    activeRoot.removeEventListener('spw:shell-menu-state', handleSync);
    activeRoot.removeEventListener('spw:variant-selected', handleSync);
    activeRoot.removeEventListener('spw:scene-enter', handleSync);
    activeRoot.removeEventListener('spw:scene-exit', handleSync);
    activeRoot.removeEventListener('spw:scene-lane-focus', handleSync);
    activeRoot.removeEventListener('spw:scene-bed-ready', handleSync);
  }

  deviceObserver?.disconnect();
  hostObserver?.disconnect();
  routeObserver?.disconnect();
  deviceObserver = null;
  hostObserver = null;
  routeObserver = null;
  handleSync = null;

  const html = readHtml();
  writeDatasetValues(html, {
    spwMediumRegister: null,
    spwInteractionPosture: null,
    spwMediumIntensity: null,
    spwInteractiveMediumReady: null,
  });
  html?.style.removeProperty('--spw-medium-intensity');

  delete window.__SPW_INTERACTIVE_MEDIUM__;
  delete window.spwInteractiveMedium;
}

export const spwModule = {
  mount: initInteractiveMedium,
};