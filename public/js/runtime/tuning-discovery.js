import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import {
  TUNING_LEXICON,
  TUNING_LEXICON_BY_SETTING,
  getSiteSettings,
  resolveTuningDiscoverability,
} from '/public/js/kernel/site-settings.js';
import { registerDomSyncTask } from '/public/js/runtime/dom-sync-hub.js';

const EVENT_NAME = 'spw:tuning-surfaces-updated';

const TUNABLE_SCOPE_SELECTOR = [
  '[data-site-settings-scope]',
  '[data-spw-affordance="tune"]',
  '[data-site-settings-panel]',
  '.vibe-widget[data-spw-role="control"]',
].join(', ');

const SETTING_TRIGGER_SELECTOR = '[data-site-setting-set], [data-site-settings-recipe], [data-preset], [name]';

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
  return 'tuning surface';
}

function clearMarginalia(surface) {
  surface.querySelectorAll('.spw-tuning-marginalia').forEach((node) => node.remove());
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
    spwTuningDiscoverability: mode,
  });

  document.dispatchEvent(new CustomEvent(EVENT_NAME, {
    detail: {
      count: surfaces.length,
      surfaces,
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
      semanticDensity: 'normal',
      cognitiveHandles: 'on',
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

export { EVENT_NAME as TUNING_SURFACES_EVENT };