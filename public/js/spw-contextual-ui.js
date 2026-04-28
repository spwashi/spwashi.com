/**
 * spw-contextual-ui.js
 * --------------------------------------------------------------------------
 * Purpose
 * - Add a small device/context bridge so CSS can respond to more than width.
 * - Improve top-route discoverability without rewriting every hand-authored nav.
 * - Treat cards, panels, and philosophy blocks as future Spw modules with
 *   declarative perspective / potential / dimension / salience fields.
 *
 * Design constraints
 * - Progressive enhancement only.
 * - No scroll hijacking.
 * - Keep authored HTML primary and readable.
 * - Prefer data attributes and CSS variables over imperative styling.
 * --------------------------------------------------------------------------
 */

import {
  MODULE_SELECTOR,
  inferTopographyKind,
  writeDatasetValue,
  writeDatasetValueIfMissing,
  writeStyleValue,
} from './spw-dom-contracts.js';
import {
  normalizeToken,
  unique,
} from './spw-semantic-utils.js';

const HTML = document.documentElement;

const TOP_ROUTE_REGISTRY = Object.freeze([
  { href: '/', label: 'Home', token: '#>home', note: 'Channel summary, active routes, and nearby materials.' },
  { href: '/about/', label: 'About', token: '.about', note: 'Practice, direction, and the wider Spwashi constellation.' },
  { href: '/design/', label: 'Design', token: '#>design', note: 'Team communication, rendering-context tests, and route circuits.' },
  { href: '/topics/', label: 'Topics', token: '<topics>', note: 'The atlas across software, math, craft, and design.' },
  { href: '/topics/software/', label: 'Software', token: '^software', note: 'spw-workbench, parsers, renderers, and language tools.' },
  { href: '/topics/math/', label: 'Math', token: '~math', note: 'Intuition routes for invariants, collapse, and structure.' },
  { href: '/topics/craft/', label: 'Craft', token: '@craft', note: 'Process art, fragments, and gentle ramps into making on the web.' },
  { href: '/design/website/', label: 'Website Design', token: '#design', note: 'Readable publishing surfaces, thresholds, and page systems for premium-feeling sites.' },
  { href: '/about/website/', label: 'Website', token: '>website', note: 'A field guide nudging authors toward HTML and illustrators toward CSS.' },
  { href: '/blog/', label: 'Blog', token: '*blog', note: 'Working threads, copy drafts, and public process.' },
  { href: '/about/domains/lore.land/', label: 'lore.land', token: '*lore', note: 'A public bridge from notes into ebooks, lore, and narrative surfaces.' },
  { href: '/recipes/', label: 'Recipes', token: '.recipes', note: 'Kitchen structure, hospitality, and another route into process.' },
  { href: '/play/', label: 'Play', token: '~play', note: 'RPG Wednesday, experiments, and looser systems.' },
  { href: '/tools/', label: 'Tools', token: '^tools', note: 'Utilities, profiles, and reusable helpers.' },
  { href: '/services/', label: 'Services', token: '@services', note: 'Ways to collaborate on readable systems and publishing surfaces.' },
  { href: '/settings/', label: 'Settings', token: '=settings', note: 'Tune the browser-local reading atmosphere.' },
]);

const PERSPECTIVE_WEIGHTS = Object.freeze({
  local: 0.34,
  self: 0.38,
  reader: 0.48,
  collaborative: 0.62,
  public: 0.72,
  system: 0.86,
});

const POTENTIAL_WEIGHTS = Object.freeze({
  archival: 0.16,
  latent: 0.26,
  emergent: 0.44,
  ready: 0.62,
  active: 0.82,
  realized: 0.94,
});

const SALIENCE_WEIGHTS = Object.freeze({
  quiet: 0.18,
  ambient: 0.34,
  near: 0.56,
  strong: 0.78,
  focal: 0.94,
});

function normalizePathname(pathname = '') {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '/') || '/';
}

function normalizeRouteHref(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    return normalizePathname(new URL(raw, window.location.href).pathname);
  } catch {
    return normalizePathname(raw);
  }
}

function parseContextTokens(value = '') {
  return unique(String(value).split(/[\s,]+/).map(normalizeToken));
}

function parseRoutePathList(value = '') {
  return unique(String(value).split(/[|,]/).map(normalizeRouteHref));
}

function titleFromRoutePath(pathname = '') {
  const segments = normalizePathname(pathname)
    .split('/')
    .filter(Boolean);
  const last = segments[segments.length - 1] || 'home';
  return last
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function tokenFromRoutePath(pathname = '') {
  const segments = normalizePathname(pathname).split('/').filter(Boolean);
  const last = normalizeToken(segments[segments.length - 1] || 'home');
  return `~${last}`;
}

function getRouteDefinition(pathname = '') {
  const normalized = normalizeRouteHref(pathname);
  const known = TOP_ROUTE_REGISTRY.find((route) => normalizeRouteHref(route.href) === normalized);
  if (known) return known;
  return {
    href: normalized,
    label: titleFromRoutePath(normalized),
    token: tokenFromRoutePath(normalized),
    note: 'Related path from this surface.',
  };
}

function inferModuleId(el, index = 0) {
  const explicit = normalizeToken(el.dataset.spwModule || '');
  if (explicit) return explicit;

  const fromId = normalizeToken(el.id || '');
  if (fromId) return fromId;

  const heading = normalizeToken(
    el.querySelector('h1, h2, h3, strong')?.textContent || ''
  );
  if (heading) return heading;

  const kind =
    normalizeToken(el.dataset.spwKind || '')
    || inferTopographyKind(el, 'module');

  return `${kind}-${index + 1}`;
}

function inferPerspective(el) {
  const explicit = normalizeToken(el.dataset.spwPerspective || '');
  if (explicit) return explicit;

  if (el.matches('.context-edge-card[data-spw-edge="nearby"]')) return 'local';
  if (el.matches('.context-edge-card[data-spw-edge="projected"]')) return 'public';
  if (el.matches('.intent-cluster[data-spw-intent="inspect"]')) return 'system';
  if (el.matches('.intent-cluster[data-spw-intent="commit"]')) return 'collaborative';

  const role = normalizeToken(el.dataset.spwRole || '');
  const context = normalizeToken(el.dataset.spwContext || '');

  if (role === 'schema') return 'system';
  if (role === 'routing') return 'reader';
  if (role === 'projection') return 'public';
  if (role === 'control') return 'collaborative';
  if (context === 'routing') return 'reader';
  if (context === 'analysis') return 'system';

  return 'public';
}

function inferPotential(el) {
  const explicit = normalizeToken(el.dataset.spwPotential || '');
  if (explicit) return explicit;

  if (el.matches('.site-hero')) return 'active';
  if (el.matches('.topic-photo-card[data-spw-image-prominence="hero"], .image-study[data-spw-image-prominence="hero"]')) {
    return 'active';
  }
  if (el.matches('.context-edge-card[data-spw-edge="projected"]')) return 'ready';

  const promptability = normalizeToken(el.dataset.spwPromptability || '');
  const liminality = normalizeToken(el.dataset.spwLiminality || '');

  if (promptability === 'latent') return 'latent';
  if (promptability === 'ambient') return 'emergent';
  if (liminality === 'entry' || liminality === 'projected') return 'ready';

  return 'ready';
}

function inferDimensions(el) {
  const explicit = unique(
    String(el.dataset.spwDimension || '')
      .split(/[\s,]+/)
      .map(normalizeToken)
  );
  if (explicit.length) return explicit.slice(0, 4);

  const role = normalizeToken(el.dataset.spwRole || '');
  const context = normalizeToken(el.dataset.spwContext || '');
  const wonder = unique(String(el.dataset.spwWonder || '').split(/\s+/).map(normalizeToken));
  const dimensions = [];

  if (el.matches('.semantic-contract-card')) dimensions.push('syntax');
  if (el.matches('.intent-cluster')) dimensions.push('routing');
  if (el.matches('.context-edge-card')) dimensions.push('publication');
  if (el.matches('.image-study, .topic-photo-card, .spw-svg-figure, [data-spw-image-surface]')) {
    dimensions.push('surface', 'gesture');
  }
  if (el.querySelector('pre code')) dimensions.push('source');
  if (el.querySelector('img, svg')) dimensions.push('surface');

  if (role === 'schema') dimensions.push('syntax');
  if (role === 'routing') dimensions.push('routing');
  if (role === 'projection') dimensions.push('surface');
  if (role === 'example') dimensions.push('source');

  if (context === 'analysis') dimensions.push('reading');
  if (context === 'routing') dimensions.push('navigation');

  if (wonder.includes('projection')) dimensions.push('surface');
  if (wonder.includes('memory')) dimensions.push('memory');
  if (wonder.includes('resonance')) dimensions.push('gesture');

  return unique(dimensions).slice(0, 4);
}

function inferSalience(el) {
  const explicit = normalizeToken(el.dataset.spwSalience || '');
  if (explicit) return explicit;

  if (el.matches('.site-hero')) return 'strong';
  if (el.matches('.topic-photo-card[data-spw-image-prominence="hero"], .image-study[data-spw-image-prominence="hero"]')) {
    return 'focal';
  }
  if (el.matches('.image-study, .topic-photo-card, .spw-svg-figure, [data-spw-image-surface]')) {
    return 'near';
  }
  if (el.matches('.context-edge-card[data-spw-edge="projected"]')) return 'near';

  const role = normalizeToken(el.dataset.spwRole || '');

  if (role === 'orientation') return 'strong';
  if (role === 'schema' || role === 'routing') return 'near';
  return 'ambient';
}

function applyModuleSemantics(root = document) {
  const modules = root.querySelectorAll(MODULE_SELECTOR);
  const selectedContext = normalizeToken(HTML.dataset.spwSelectedContext || '');

  modules.forEach((el, index) => {
    const perspective = inferPerspective(el);
    const potential = inferPotential(el);
    const salience = inferSalience(el);
    const dimensions = inferDimensions(el);
    const contextBias = parseContextTokens(el.dataset.spwContextBias || '');
    const contextProjection = parseContextTokens(el.dataset.spwContextProjection || '');
    const contextMatched = Boolean(
      selectedContext
      && (contextBias.includes(selectedContext) || contextProjection.includes(selectedContext))
    );
    const baseSalience = SALIENCE_WEIGHTS[salience] ?? SALIENCE_WEIGHTS.ambient;
    const effectiveSalience = Math.min(1, baseSalience + (contextMatched ? 0.14 : 0));

    if (writeDatasetValueIfMissing(el, 'spwModule', inferModuleId(el, index))) {
      writeDatasetValue(el, 'spwModuleInferred', 'true');
    }

    writeDatasetValue(el, 'spwPerspectiveResolved', perspective);
    writeDatasetValue(el, 'spwPotentialResolved', potential);
    writeDatasetValue(el, 'spwSalienceResolved', salience);
    writeDatasetValue(el, 'spwDimensionResolved', dimensions.join(' '));
    writeDatasetValue(el, 'spwContextBiasResolved', contextBias.join(' '));
    writeDatasetValue(el, 'spwContextProjectionResolved', contextProjection.join(' '));
    writeDatasetValue(el, 'spwContextMatch', contextMatched ? 'active' : 'idle');

    if (writeDatasetValueIfMissing(el, 'spwModuleCopy', el.matches('.site-frame') ? 'scope-link' : 'fragment')) {
      writeDatasetValue(el, 'spwModuleCopyInferred', 'true');
    }

    if (writeDatasetValueIfMissing(el, 'spwModuleHydration', el.matches('.site-frame') ? 'defer' : 'ready')) {
      writeDatasetValue(el, 'spwModuleHydrationInferred', 'true');
    }

    writeStyleValue(
      el,
      '--spw-perspective-weight',
      String(PERSPECTIVE_WEIGHTS[perspective] ?? PERSPECTIVE_WEIGHTS.public)
    );
    writeStyleValue(
      el,
      '--spw-potential-weight',
      String(POTENTIAL_WEIGHTS[potential] ?? POTENTIAL_WEIGHTS.ready)
    );
    writeStyleValue(
      el,
      '--spw-salience-weight',
      String(effectiveSalience)
    );
    writeStyleValue(el, '--spw-dimension-count', String(Math.max(1, dimensions.length)));
    writeStyleValue(el, '--spw-context-bias-count', String(contextBias.length));
    writeStyleValue(el, '--spw-context-projection-count', String(contextProjection.length));
    writeStyleValue(el, '--spw-context-match-weight', contextMatched ? '1' : '0');
  });
}

function clearModuleSemantics(root = document) {
  root.querySelectorAll(MODULE_SELECTOR).forEach((el) => {
    if (el.dataset.spwModuleInferred === 'true') writeDatasetValue(el, 'spwModule', null);
    if (el.dataset.spwModuleCopyInferred === 'true') writeDatasetValue(el, 'spwModuleCopy', null);
    if (el.dataset.spwModuleHydrationInferred === 'true') writeDatasetValue(el, 'spwModuleHydration', null);

    [
      'spwModuleInferred',
      'spwModuleCopyInferred',
      'spwModuleHydrationInferred',
      'spwPerspectiveResolved',
      'spwPotentialResolved',
      'spwSalienceResolved',
      'spwSalienceState',
      'spwDimensionResolved',
      'spwContextBiasResolved',
      'spwContextProjectionResolved',
      'spwContextMatch',
    ].forEach((key) => writeDatasetValue(el, key, null));

    [
      '--spw-perspective-weight',
      '--spw-potential-weight',
      '--spw-salience-weight',
      '--spw-dimension-count',
      '--spw-context-bias-count',
      '--spw-context-projection-count',
      '--spw-context-match-weight',
    ].forEach((name) => writeStyleValue(el, name, null));
  });
}

function setActiveModuleState(target, active) {
  const host = target?.closest?.(MODULE_SELECTOR);
  if (!host) return;
  writeDatasetValue(host, 'spwSalienceState', active ? 'active' : 'resting');
}

function bindModuleInteractionStates() {
  const onPointerOver = (event) => {
    const host = event.target?.closest?.(MODULE_SELECTOR);
    if (!host) return;
    if (event.relatedTarget instanceof Node && host.contains(event.relatedTarget)) return;
    writeDatasetValue(host, 'spwSalienceState', 'active');
  };
  const onPointerOut = (event) => {
    const host = event.target?.closest?.(MODULE_SELECTOR);
    if (!host) return;
    if (event.relatedTarget instanceof Node && host.contains(event.relatedTarget)) return;
    writeDatasetValue(host, 'spwSalienceState', 'resting');
  };
  const onFocusIn = (event) => setActiveModuleState(event.target, true);
  const onFocusOut = (event) => {
    const host = event.target?.closest?.(MODULE_SELECTOR);
    if (!host) return;
    const active = document.activeElement;
    writeDatasetValue(host, 'spwSalienceState', active && host.contains(active) ? 'active' : 'resting');
  };

  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('pointerout', onPointerOut, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);

  return () => {
    document.removeEventListener('pointerover', onPointerOver, true);
    document.removeEventListener('pointerout', onPointerOut, true);
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
  };
}

function computeViewportTier(width = window.innerWidth) {
  if (width < 420) return 'compact';
  if (width < 720) return 'narrow';
  if (width < 980) return 'mid';
  if (width < 1280) return 'regular';
  return 'wide';
}

function computePointerMode() {
  if (window.matchMedia('(pointer: coarse)').matches) return 'coarse';
  return 'fine';
}

function applyDeviceContext() {
  const tier = computeViewportTier(window.innerWidth);
  const pointer = computePointerMode();
  const hover = window.matchMedia('(hover: hover)').matches ? 'hover' : 'touch';

  writeDatasetValue(HTML, 'spwViewportTier', tier);
  writeDatasetValue(HTML, 'spwPointerMode', pointer);
  writeDatasetValue(HTML, 'spwHoverMode', hover);
  writeDatasetValue(HTML, 'spwDeviceContext', `${tier}-${pointer}`);
}

function collectExistingNavPaths(navList) {
  return new Set(
    [...navList.querySelectorAll(':scope > li > a[href]')]
      .map((link) => {
        try {
          return normalizePathname(new URL(link.href, window.location.href).pathname);
        } catch {
          return '';
        }
      })
      .filter(Boolean)
  );
}

function collectContextualRoutes(header, existingPaths) {
  const currentPath = normalizeRouteHref(window.location.pathname);
  const relatedPaths = parseRoutePathList([
    document.body?.dataset?.spwRelatedRoutes,
    header?.dataset?.spwRelatedRoutes,
  ].filter(Boolean).join('|'));

  return relatedPaths
    .filter((pathname) => pathname && pathname !== currentPath && !existingPaths.has(pathname))
    .map(getRouteDefinition);
}

function closeRouteMenus(except = null) {
  document.querySelectorAll('.spw-route-menu[open]').forEach((menu) => {
    if (except && menu === except) return;
    menu.open = false;
    syncRouteMenuMode(menu);
  });
}

function applyRouteMenuPretext(details) {
  details.dataset.spwFlow = 'pretext';
  details.dataset.textKind = 'ledger';
  details.dataset.textDensity = 'soft';
  details.dataset.textMeasure = 'tight';
  details.dataset.textProjection = 'indent';
  details.dataset.textOrnament = 'none';
  details.dataset.textWrap = 'responsive';
  details.dataset.textPhase = 'ambient';
}

function syncRouteMenuMode(details) {
  if (!details) return;
  const phase = details.open
    ? 'projecting'
    : details.matches(':focus-within')
      ? 'contact'
      : details.dataset.spwRouteHover === 'on'
        ? 'approach'
        : 'resting';

  details.dataset.textMode = phase;
  details.dataset.spwRouteState = phase;
  details.dataset.spwRouteMenuState = details.open ? 'open' : 'closed';
  details.querySelector(':scope > summary')?.setAttribute('aria-expanded', details.open ? 'true' : 'false');
}

function createRouteMenu(hostHeader, navList) {
  let host = navList.querySelector(':scope > .spw-route-menu-host');
  if (host) return host;

  host = document.createElement('li');
  host.className = 'spw-route-menu-host';

  const details = document.createElement('details');
  details.className = 'spw-route-menu';
  details.dataset.spwFeature = 'route-discovery-menu';
  details.dataset.spwRole = 'routing';
  applyRouteMenuPretext(details);

  const summary = document.createElement('summary');
  summary.className = 'spw-route-menu-trigger';
  summary.id = 'spw-route-menu-trigger';
  summary.setAttribute('aria-label', 'Show additional top-level routes');
  summary.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.className = 'spw-route-menu-label';

  const count = document.createElement('span');
  count.className = 'spw-route-menu-count';

  summary.append(label, count);

  const panel = document.createElement('div');
  panel.className = 'spw-route-menu-panel';
  panel.setAttribute('aria-label', 'Additional top-level routes');
  panel.setAttribute('aria-labelledby', summary.id);

  details.append(summary, panel);
  host.append(details);
  navList.append(host);

  details.addEventListener('toggle', () => {
    if (details.open) closeRouteMenus(details);
    syncRouteMenuMode(details);
  });

  panel.addEventListener('click', () => {
    details.open = false;
    syncRouteMenuMode(details);
  });

  summary.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown') return;
    if (!details.open) {
      event.preventDefault();
      details.open = true;
      syncRouteMenuMode(details);
    }
    window.requestAnimationFrame(() => {
      panel.querySelector('a[href]')?.focus();
    });
  });

  details.addEventListener('pointerenter', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    details.dataset.spwRouteHover = 'on';
    syncRouteMenuMode(details);
  });

  details.addEventListener('pointerleave', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    details.dataset.spwRouteHover = 'off';
    syncRouteMenuMode(details);
  });

  details.addEventListener('focusin', () => {
    syncRouteMenuMode(details);
  });

  details.addEventListener('focusout', () => {
    window.setTimeout(() => syncRouteMenuMode(details), 0);
  });

  hostHeader.dataset.spwRouteDiscovery = 'on';
  syncRouteMenuMode(details);
  return host;
}

function updateRouteMenu() {
  const header = document.querySelector('body > header, .site-header');
  const navList = header?.querySelector('nav > ul');
  if (!header || !navList) return;

  const existingPaths = collectExistingNavPaths(navList);
  const missingSiteRoutes = TOP_ROUTE_REGISTRY.filter(
    (route) => !existingPaths.has(normalizePathname(route.href))
  );
  const contextualRoutes = collectContextualRoutes(header, existingPaths);
  const discoveryRoutes = contextualRoutes.length
    ? contextualRoutes.slice(0, 5)
    : missingSiteRoutes.slice(0, 4);

  const existingHost = navList.querySelector(':scope > .spw-route-menu-host');
  if (!discoveryRoutes.length) {
    existingHost?.remove();
    header.dataset.spwRouteDiscovery = 'off';
    delete header.dataset.spwRouteDiscoveryCount;
    delete header.dataset.spwRouteDiscoveryLayout;
    delete header.dataset.spwRouteDiscoveryScope;
    return;
  }

  const host = createRouteMenu(header, navList);
  const details = host.querySelector('.spw-route-menu');
  const label = host.querySelector('.spw-route-menu-label');
  const count = host.querySelector('.spw-route-menu-count');
  const panel = host.querySelector('.spw-route-menu-panel');
  const compact = (
    HTML.dataset.spwViewportTier === 'compact'
    || HTML.dataset.spwPointerMode === 'coarse'
    || header.dataset.spwMenuMode === 'toggle'
  );
  const scope = contextualRoutes.length ? 'related' : 'site';
  const routeCountLabel = scope === 'related'
    ? `${discoveryRoutes.length} nearby ${discoveryRoutes.length === 1 ? 'path' : 'paths'}`
    : `${discoveryRoutes.length} additional ${discoveryRoutes.length === 1 ? 'route' : 'routes'}`;

  label.textContent = compact ? 'nearby' : '#>';
  count.textContent = `+${discoveryRoutes.length}`;
  details.dataset.spwRouteMenuCount = String(discoveryRoutes.length);
  details.dataset.spwRouteMenuLabel = routeCountLabel;
  details.dataset.spwRouteMenuLayout = compact ? 'expanded' : 'compact';
  details.dataset.spwRouteMenuScope = scope;
  panel.dataset.spwRouteMenuCount = String(discoveryRoutes.length);
  panel.dataset.spwRouteMenuLayout = compact ? 'expanded' : 'compact';
  panel.dataset.spwRouteMenuScope = scope;
  header.dataset.spwRouteDiscoveryCount = String(discoveryRoutes.length);
  header.dataset.spwRouteDiscoveryLayout = compact ? 'expanded' : 'compact';
  header.dataset.spwRouteDiscoveryScope = scope;
  details.querySelector(':scope > summary')?.setAttribute('aria-label', `Open ${routeCountLabel}`);

  panel.replaceChildren(
    ...discoveryRoutes.map((route) => {
      const link = document.createElement('a');
      link.href = route.href;
      link.className = 'spw-route-menu-link';

      const copy = document.createElement('span');
      copy.className = 'spw-route-menu-link-copy';

      const title = document.createElement('span');
      title.className = 'spw-route-menu-link-label';
      title.textContent = route.label;

      copy.append(title);

      if (route.note) {
        const note = document.createElement('span');
        note.className = 'spw-route-menu-link-note';
        note.textContent = route.note;
        copy.append(note);
      }

      const token = document.createElement('span');
      token.className = 'spw-route-menu-link-token';
      token.textContent = route.token;

      link.append(copy, token);
      return link;
    })
  );

  syncRouteMenuMode(details);
}

function updateHeaderFit() {
  const header = document.querySelector('body > header, .site-header');
  const nav = header?.querySelector('nav');
  const list = nav?.querySelector('ul');
  if (!header || !nav || !list) return;

  const ratio = list.scrollWidth && nav.clientWidth
    ? list.scrollWidth / Math.max(nav.clientWidth, 1)
    : 1;

  if (ratio > 1.12) {
    header.dataset.spwNavFit = 'compressed';
  } else if (ratio > 0.96) {
    header.dataset.spwNavFit = 'tight';
  } else {
    header.dataset.spwNavFit = 'roomy';
  }
}

function bindRouteMenuDismissal() {
  const onPointerDown = (event) => {
    const openMenu = document.querySelector('.spw-route-menu[open]');
    if (!openMenu) return;
    if (openMenu.contains(event.target)) return;
    openMenu.open = false;
    syncRouteMenuMode(openMenu);
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    const openMenu = document.querySelector('.spw-route-menu[open]');
    const returnTarget = openMenu?.querySelector(':scope > summary');
    closeRouteMenus();
    if (returnTarget instanceof HTMLElement) returnTarget.focus();
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown);
  };
}

export function initSpwContextualUi() {
  if (document.body?.dataset?.spwContextualUiInit === '1') {
    return { cleanup() {}, refresh() {} };
  }

  document.body.dataset.spwContextualUiInit = '1';

  applyDeviceContext();
  applyModuleSemantics(document);
  updateHeaderFit();
  updateRouteMenu();

  const cleanupModuleStates = bindModuleInteractionStates();
  const cleanupRouteMenuDismissal = bindRouteMenuDismissal();

  const handleResize = () => {
    applyDeviceContext();
    updateHeaderFit();
    updateRouteMenu();
  };

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize);

  const header = document.querySelector('body > header, .site-header');
  const resizeObserver = 'ResizeObserver' in window && header
    ? new ResizeObserver(() => {
        updateHeaderFit();
        updateRouteMenu();
      })
    : null;

  resizeObserver?.observe(header);

  return {
    cleanup() {
      cleanupModuleStates();
      cleanupRouteMenuDismissal();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver?.disconnect();
      clearModuleSemantics(document);
      delete document.body.dataset.spwContextualUiInit;
    },
    refresh() {
      applyDeviceContext();
      applyModuleSemantics(document);
      updateHeaderFit();
      updateRouteMenu();
    },
  };
}
