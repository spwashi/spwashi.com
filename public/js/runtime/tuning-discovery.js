import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import {
  TUNING_LEXICON,
  TUNING_LEXICON_BY_SETTING,
  getSiteSettings,
  resolveTuningDiscoverability,
} from '/public/js/kernel/site-settings.js';
import { registerDomSyncTask } from '/public/js/runtime/dom-sync-hub.js';
import { TUNING_SURFACES_EVENT } from '/public/js/runtime/tuning-contract.js';

const EVENT_NAME = TUNING_SURFACES_EVENT;

const TUNABLE_SCOPE_SELECTOR = [
  '[data-site-settings-scope]',
  '[data-spw-affordance="tune"]',
  '[data-spw-feature="embedded-workshop"]',
  '[data-site-settings-panel]',
  '.vibe-widget[data-spw-role="control"]',
].join(', ');

const SETTING_TRIGGER_SELECTOR = '[data-site-setting-set], [data-site-settings-recipe], [data-preset], [name]';
const EMBEDDED_TUNING_HOST_SELECTOR = [
  '.site-frame',
  '.frame-panel',
  '.frame-card',
  '.mode-panel',
  '.page-panel',
  '.generic-panel',
  '.reading-card',
  '.note-card',
  '.spw-region-menu',
  '[data-spw-kind="panel"]',
  '[data-spw-component-kind="panel"]',
].join(', ');
const EMBEDDED_TUNING_MAX = 16;
const EMBEDDED_TUNING_DIMENSIONS = Object.freeze([
  Object.freeze({
    id: 'spacing',
    label: 'Pack',
    title: 'Tighten this component so linked content scans faster',
    setting: 'spacingTuner:compact',
    sigil: '↔',
  }),
  Object.freeze({
    id: 'material',
    label: 'Ground',
    title: 'Use matte material so embedded reading and links stay clear',
    setting: 'baseMetamaterial:matte',
    sigil: '■',
  }),
  Object.freeze({
    id: 'gesture',
    label: 'Move',
    title: 'Make local navigation, swipe, hold, and panel gestures more responsive',
    setting: 'interactionTuner:responsive',
    sigil: '⌁',
  }),
]);

function isOutermostTunableSurface(node) {
  if (!(node instanceof HTMLElement)) return false;
  const parentScope = node.parentElement?.closest(TUNABLE_SCOPE_SELECTOR);
  return !(parentScope instanceof HTMLElement);
}

function inferSurfaceDimensions(surface) {
  const dimensions = new Set();

  surface.querySelectorAll(SETTING_TRIGGER_SELECTOR).forEach((control) => {
    if (!(control instanceof HTMLElement)) return;

    const settingSet = control.getAttribute('data-site-setting-set');
    if (settingSet) {
      const key = settingSet.split(':')[0]?.trim();
      const entry = TUNING_LEXICON_BY_SETTING[key];
      if (entry) dimensions.add(entry.id);
      return;
    }

    const recipe = control.getAttribute('data-site-settings-recipe');
    if (recipe) {
      dimensions.add('vocabulary');
      return;
    }

    if (control.hasAttribute('data-preset')) {
      dimensions.add('posture');
      dimensions.add('task');
      return;
    }

    const name = control.getAttribute('name');
    const entry = name ? TUNING_LEXICON_BY_SETTING[name] : null;
    if (entry) dimensions.add(entry.id);
  });

  if (!dimensions.size) dimensions.add('atmosphere');
  return [...dimensions];
}

function surfaceLabel(surface) {
  const heading = surface.querySelector('h2, h3, .vibe-widget-title, .frame-sigil');
  const text = heading?.textContent?.trim();
  if (text) return text.replace(/\s+/g, ' ').slice(0, 72);
  if (surface.id) return surface.id.replace(/-/g, ' ');
  return 'extension surface';
}

function clearMarginalia(surface) {
  surface.querySelectorAll('.spw-tuning-marginalia').forEach((node) => node.remove());
}

function isEmbeddedHandleHost(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (!node.matches(EMBEDDED_TUNING_HOST_SELECTOR)) return false;
  if (node.closest('[data-site-settings-form], [data-site-settings-scope], [data-spw-embedded-tuning-skip]')) return false;
  if (node.matches('[data-spw-floating-chrome="true"]:not(.spw-region-menu)')) return false;
  if (node.querySelector(':scope > .spw-embedded-tuning-handle')) return false;
  if (node.querySelector(SETTING_TRIGGER_SELECTOR)) return false;
  return Boolean(node.querySelector('h1, h2, h3, h4, .frame-sigil, .frame-card-sigil, .frame-panel-sigil, p, li'));
}

function clearEmbeddedHandles(root = document) {
  root.querySelectorAll?.('.spw-embedded-tuning-handle').forEach((node) => node.remove());
  root.querySelectorAll?.('[data-spw-embedded-tuning-host]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    delete node.dataset.spwEmbeddedTuningHost;
    delete node.dataset.spwEmbeddedTuningMode;
    delete node.dataset.spwEmbeddedTuningDimensions;
  });
}

function makeEmbeddedHandle(host, mode) {
  const handle = document.createElement('div');
  handle.className = 'spw-embedded-tuning-handle';
  handle.dataset.spwEmbeddedTuningHandle = 'true';
  handle.dataset.spwEmbeddedTuningMode = mode;
  handle.dataset.spwEmbeddedTuningDimensions = EMBEDDED_TUNING_DIMENSIONS.map((dimension) => dimension.id).join(' ');
  handle.dataset.spwHypermediaExtension = 'presentation layout gesture';
  handle.dataset.spwLocality = 'local';
  handle.dataset.spwGestureHint = 'Local extension: pack layout, ground material, or change gesture posture';
  handle.setAttribute('role', 'group');
  handle.setAttribute('aria-label', `Hypermedia extension controls for ${surfaceLabel(host)}`);

  const label = document.createElement('span');
  label.className = 'spw-embedded-tuning-handle__label';
  label.textContent = 'extend';
  handle.append(label);

  EMBEDDED_TUNING_DIMENSIONS.forEach((dimension) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spw-embedded-tuning-handle__chip';
    button.dataset.siteSettingSet = dimension.setting;
    button.dataset.spwTuningDimension = dimension.id;
    button.dataset.spwGestureHint = dimension.title;
    button.title = dimension.title;
    button.setAttribute('aria-label', dimension.title);
    button.innerHTML = `<span aria-hidden="true">${dimension.sigil}</span><span>${dimension.label}</span>`;
    handle.append(button);
  });

  const rail = document.createElement('span');
  rail.className = 'spw-embedded-tuning-handle__gesture-rail';
  rail.setAttribute('aria-hidden', 'true');
  handle.append(rail);

  return handle;
}

function ensureEmbeddedHandles(root, mode) {
  if (mode === 'quiet') {
    clearEmbeddedHandles(root);
    return [];
  }

  root.querySelectorAll?.('.spw-embedded-tuning-handle').forEach((handle) => {
    if (!(handle instanceof HTMLElement)) return;
    handle.dataset.spwEmbeddedTuningMode = mode;
    const host = handle.parentElement;
    if (host instanceof HTMLElement) {
      host.dataset.spwEmbeddedTuningMode = mode;
    }
  });

  const hosts = [...root.querySelectorAll(EMBEDDED_TUNING_HOST_SELECTOR)]
    .filter(isEmbeddedHandleHost)
    .slice(0, mode === 'revealed' ? EMBEDDED_TUNING_MAX : Math.min(8, EMBEDDED_TUNING_MAX));

  hosts.forEach((host) => {
    host.dataset.spwEmbeddedTuningHost = 'true';
    host.dataset.spwEmbeddedTuningMode = mode;
    host.dataset.spwEmbeddedTuningDimensions = EMBEDDED_TUNING_DIMENSIONS.map((dimension) => dimension.id).join(' ');
    host.dataset.spwGestureHint ||= 'Hover or focus for local tuning handles';
    host.append(makeEmbeddedHandle(host, mode));
  });

  return [...root.querySelectorAll?.('[data-spw-embedded-tuning-host="true"]') || []]
    .filter((node) => node instanceof HTMLElement);
}

function ensureMarginalia(surface, dimensions, mode) {
  clearMarginalia(surface);
  if (mode !== 'revealed') return;

  const mark = document.createElement('span');
  mark.className = 'spw-tuning-marginalia';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = dimensions
    .map((id) => TUNING_LEXICON[id]?.sigil || '◎')
    .join(' ');

  const titles = dimensions
    .map((id) => {
      const entry = TUNING_LEXICON[id];
      if (!entry) return '';
      return `${entry.label}: ${entry.metaphor}`;
    })
    .filter(Boolean);

  if (titles.length) mark.title = titles.join(' · ');
  surface.append(mark);
}

export function scanTuningSurfaces(root = document) {
  const mode = document.documentElement.dataset.spwTuningDiscoverability
    || resolveTuningDiscoverability(getSiteSettings());
  const embeddedHosts = ensureEmbeddedHandles(root, mode);

  const surfaces = [...root.querySelectorAll(TUNABLE_SCOPE_SELECTOR)]
    .filter(isOutermostTunableSurface)
    .map((node) => {
      const dimensions = inferSurfaceDimensions(node);
      node.dataset.spwTuningSurface = 'true';
      node.dataset.spwTuningDimensions = dimensions.join(' ');
      ensureMarginalia(node, dimensions, mode);

      return {
        element: node,
        id: node.id || null,
        label: surfaceLabel(node),
        dimensions,
        href: node.id ? `#${node.id}` : null,
      };
    });

  writeDatasetValues(document.documentElement, {
    spwTuningSurfaceCount: surfaces.length ? String(surfaces.length) : null,
    spwTuningSurfacesPresent: surfaces.length ? 'true' : 'false',
    spwEmbeddedTuningCount: embeddedHosts.length ? String(embeddedHosts.length) : null,
    spwEmbeddedTuningPresent: embeddedHosts.length ? 'true' : 'false',
    spwTuningDiscoverability: mode,
  });

  window.spwSettings?.initBindings?.();
  window.spwSettings?.syncUx?.(root);

  document.dispatchEvent(new CustomEvent(EVENT_NAME, {
    detail: {
      count: surfaces.length,
      surfaces,
      embeddedCount: embeddedHosts.length,
      mode,
    },
  }));

  return surfaces;
}

export function scrollToNearestTuningSurface() {
  const surfaces = [...document.querySelectorAll('[data-spw-tuning-surface="true"]')]
    .filter((node) => node instanceof HTMLElement);

  if (!surfaces.length) return false;

  const viewportMid = window.scrollY + (window.innerHeight * 0.35);
  const target = surfaces.reduce((best, node) => {
    const distance = Math.abs(node.getBoundingClientRect().top + window.scrollY - viewportMid);
    if (!best) return { node, distance };
    return distance < best.distance ? { node, distance } : best;
  }, null)?.node || surfaces[0];

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.dataset.spwTuningPulse = 'true';
  window.setTimeout(() => {
    delete target.dataset.spwTuningPulse;
  }, 1200);
  return true;
}

export function revealTuningSurfaces({ persist = true } = {}) {
  const settings = getSiteSettings();
  const mode = resolveTuningDiscoverability(settings);

  if (mode === 'quiet' && persist && window.spwSettings?.save) {
    window.spwSettings.save({
      explorePosture: 'field',
    });
    return 'enabled';
  }

  if (mode !== 'quiet') {
    scrollToNearestTuningSurface();
    return 'scrolled';
  }

  scanTuningSurfaces();
  scrollToNearestTuningSurface();
  return 'scrolled';
}

export function initTuningDiscovery(ctx = null) {
  const unregister = registerDomSyncTask('tuning-discovery', () => scanTuningSurfaces(), ctx);
  ctx?.addCleanup?.(unregister);

  return {
    cleanup: unregister,
    refresh: () => scanTuningSurfaces(),
  };
}

export { TUNING_SURFACES_EVENT };
