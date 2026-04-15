/**
 * site.js
 * --------------------------------------------------------------------------
 * Purpose
 * - Minimal staged runtime bootstrap for spwashi.com.
 * - Provide explicit lifecycle contracts for:
 *   core -> feature hydration -> region enhancement -> idle enhancement.
 * - Give CSS and JS a shared semantic vocabulary for discoverable harmony.
 * - Keep cleanup and refresh first-class so older modules can be reintroduced
 *   safely and incrementally.
 *
 * Design constraints
 * - Do not hijack scrolling.
 * - Do not continuously rank regions on scroll.
 * - Do not mount modules unless route/DOM proves they are needed.
 * - Expose region state and harmony hints to CSS.
 * - Keep core small and region work bounded.
 *
 * Page lifecycle
 * - booting
 * - interactive
 * - hydrated
 * - region-enhanced
 * - enhanced
 *
 * Region lifecycle
 * - queued
 * - primed
 * - hydrating
 * - interactive
 * - enhanced
 * - settling
 *
 * Module contract
 * A module definition should provide:
 * - id
 * - layer: "core" | "feature" | "region" | "enhancement"
 * - when: "immediate" | "visible" | "idle" | "interaction" | "region"
 * - selector?: CSS selector
 * - route?: string | string[]
 * - rootMode?: "single" | "each"
 * - load(): Promise<module>
 * - mount(mod, ctx, root?): cleanup fn | { cleanup?, refresh? } | void
 *
 * Notes
 * - This file intentionally avoids importing heavier modules at top-level.
 * - Region enhancement is lightweight by default and mostly writes state.
 * - Reintroduce richer modules by adding them to FEATURE_DEFS, REGION_DEFS,
 *   or ENHANCEMENT_DEFS.
 * --------------------------------------------------------------------------
 */

/* ==========================================================================
   1. Runtime constants
   ========================================================================== */

const PAGE_STATES = {
  BOOTING: 'booting',
  INTERACTIVE: 'interactive',
  HYDRATED: 'hydrated',
  REGION_ENHANCED: 'region-enhanced',
  ENHANCED: 'enhanced',
};

const REGION_STATES = {
  QUEUED: 'queued',
  PRIMED: 'primed',
  HYDRATING: 'hydrating',
  INTERACTIVE: 'interactive',
  ENHANCED: 'enhanced',
  SETTLING: 'settling',
};

const MODULE_LAYERS = {
  CORE: 'core',
  FEATURE: 'feature',
  REGION: 'region',
  ENHANCEMENT: 'enhancement',
};

const MOUNT_WHEN = {
  IMMEDIATE: 'immediate',
  VISIBLE: 'visible',
  IDLE: 'idle',
  INTERACTION: 'interaction',
  REGION: 'region',
};

const HTML = document.documentElement;
const BODY = document.body;
const ROOT_MAIN = document.querySelector('main');
let SITE_SURFACE = BODY?.dataset?.spwSurface || 'default';

const REGION_SELECTOR = [
  '.site-frame',
  '[data-spw-kind="frame"]',
  '[data-spw-kind="panel"]',
  '[data-spw-kind="card"]',
  '[data-spw-kind="surface"]',
  '[data-spw-role]',
  '[data-spw-slot]'
].join(', ');

/* ==========================================================================
   2. Small runtime helpers
   ========================================================================== */

function setPageState(state) {
  HTML.dataset.spwPageState = state;
}

function setRegionState(el, state) {
  if (!el || !(el instanceof HTMLElement)) return;
  el.dataset.spwRegionState = state;
}

function safeQuery(selector, root = document) {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}

function safeQueryAll(selector, root = document) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch {
    return [];
  }
}

function matchesRoute(def) {
  if (!def.route) return true;
  if (Array.isArray(def.route)) return def.route.includes(SITE_SURFACE);
  return def.route === SITE_SURFACE;
}

function hasSelector(def) {
  if (!def.selector) return true;
  return Boolean(safeQuery(def.selector));
}

function getRoots(def) {
  if (!def.selector) return [document.body];
  const matches = safeQueryAll(def.selector);
  return matches.length ? matches : [];
}

function isFn(value) {
  return typeof value === 'function';
}

function once(fn) {
  let called = false;
  let value;
  return (...args) => {
    if (called) return value;
    called = true;
    value = fn(...args);
    return value;
  };
}

function onIdle(callback, timeout = 1200) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 }), 180);
}

function cancelIdle(handle) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
}

function whenDocumentReady() {
  if (document.readyState === 'loading') {
    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
  return Promise.resolve();
}

function whenWindowLoaded() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true });
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseFeatureList(value) {
  if (!value || typeof value !== 'string') return new Set();
  return new Set(
    value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function setDataIfMissing(el, key, value) {
  if (!el || !value) return;
  if (!el.dataset[key]) el.dataset[key] = value;
}

function readSet(...values) {
  return new Set(values.filter(Boolean));
}

const SITE_NAME = 'Spwashi';
const DEFAULT_OG_IMAGE = 'https://spwashi.com/public/images/assets/illustrations/home-og-card.jpg';
const DEFAULT_OG_IMAGE_ALT = 'Illustrated Spwashi field card showing readable systems, structural surfaces, and playful semantic materials.';
const CONTEXT_STOP_WORDS = new Set([
  'about',
  'again',
  'blog',
  'card',
  'contact',
  'domain',
  'frame',
  'guide',
  'home',
  'index',
  'page',
  'register',
  'route',
  'routes',
  'section',
  'services',
  'settings',
  'site',
  'spwashi',
  'surface',
  'tools',
  'topic',
  'topics',
]);

const PAGE_METADATA_RULES = [
  {
    test: (pathname) => pathname === '/',
    meta: {
      routeFamily: 'editorial system atlas',
      context: 'orientation',
      wonder: 'orientation locality consequence',
      pageFamily: 'atlas',
      pageModes: 'reading inspect prompt collect',
      pageRole: 'portal-register',
      relatedRoutes: '/about/website/|/topics/software/|/topics/craft/|/play/|/settings/',
      heroRole: 'orientation',
      heroCategoryFamily: 'portal',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/about/domains'),
    meta: {
      routeFamily: 'editorial domain constellation',
      context: 'reading',
      wonder: 'comparison resonance projection',
      pageFamily: 'constellation',
      pageModes: 'reading compare navigate collect',
      pageRole: 'domain-specimen',
      heroRole: 'orientation',
      heroCategoryFamily: 'specimen',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/about/website'),
    meta: {
      routeFamily: 'editorial system observatory',
      context: 'analysis',
      wonder: 'orientation comparison projection',
      pageFamily: 'observatory',
      pageModes: 'reading inspect compare tune',
      pageRole: 'field-guide',
      heroRole: 'orientation',
      heroCategoryFamily: 'portal',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/about/plans'),
    meta: {
      routeFamily: 'editorial system roadmap',
      context: 'analysis',
      wonder: 'projection constraint consequence',
      pageFamily: 'roadmap',
      pageModes: 'reading inspect plan sequence',
      pageRole: 'plan-register',
      heroRole: 'schema',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/about'),
    meta: {
      routeFamily: 'editorial system portrait',
      context: 'reading',
      wonder: 'orientation consequence resonance',
      pageFamily: 'portrait',
      pageModes: 'reading compare navigate contact',
      pageRole: 'identity-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'nook',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/topics/software/spw/operators'),
    meta: {
      routeFamily: 'editorial operator atlas',
      context: 'analysis',
      wonder: 'comparison constraint locality',
      pageFamily: 'operator-atlas',
      pageModes: 'reading inspect compare implement',
      pageRole: 'operator-specimen',
      heroRole: 'schema',
      heroCategoryFamily: 'specimen',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/topics/software/spw'),
    meta: {
      routeFamily: 'editorial syntax atlas',
      context: 'analysis',
      wonder: 'orientation comparison projection',
      pageFamily: 'syntax-atlas',
      pageModes: 'reading inspect compare prompt',
      pageRole: 'operator-register',
      heroRole: 'schema',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/topics/software'),
    meta: {
      routeFamily: 'editorial systems curriculum',
      context: 'analysis',
      wonder: 'comparison constraint locality',
      pageFamily: 'curriculum',
      pageModes: 'reading inspect compare build',
      pageRole: 'topic-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/topics/craft'),
    meta: {
      routeFamily: 'editorial craft studio',
      context: 'publishing',
      wonder: 'projection resonance comparison',
      pageFamily: 'studio',
      pageModes: 'reading inspect make publish',
      pageRole: 'craft-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'workshop',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/topics/architecture'),
    meta: {
      routeFamily: 'editorial systems field-guide',
      context: 'analysis',
      wonder: 'constraint consequence locality',
      pageFamily: 'field-guide',
      pageModes: 'reading inspect compare design',
      pageRole: 'architecture-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/topics/pedagogy'),
    meta: {
      routeFamily: 'editorial learning field-guide',
      context: 'reading',
      wonder: 'orientation comparison consequence',
      pageFamily: 'field-guide',
      pageModes: 'reading inspect teach practice',
      pageRole: 'learning-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/topics'),
    meta: {
      routeFamily: 'editorial topic atlas',
      context: 'routing',
      wonder: 'orientation comparison projection',
      pageFamily: 'atlas',
      pageModes: 'navigate compare collect read',
      pageRole: 'topic-portal',
      heroRole: 'orientation',
      heroCategoryFamily: 'portal',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/recipes'),
    meta: {
      routeFamily: 'editorial kitchen grammar',
      context: 'ritual',
      wonder: 'memory projection consequence',
      pageFamily: 'recipe-book',
      pageModes: 'reading practice sequence host',
      pageRole: 'principle-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/play/rpg-wednesday'),
    meta: {
      routeFamily: 'editorial campaign ledger',
      context: 'play',
      wonder: 'memory consequence resonance',
      pageFamily: 'campaign',
      pageModes: 'read track play recall',
      pageRole: 'campaign-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'encounter',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/play'),
    meta: {
      routeFamily: 'editorial playfield',
      context: 'play',
      wonder: 'projection resonance consequence',
      pageFamily: 'playfield',
      pageModes: 'read play explore compare',
      pageRole: 'play-register',
      heroRole: 'orientation',
      heroCategoryFamily: 'encounter',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/blog'),
    meta: {
      routeFamily: 'editorial laboratory',
      context: 'publishing',
      wonder: 'orientation resonance projection',
      pageFamily: 'laboratory',
      pageModes: 'reading inspect interpret compose',
      pageRole: 'editorial-lab',
      heroRole: 'orientation',
      heroCategoryFamily: 'workshop',
      heroLiminality: 'threshold',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/services'),
    meta: {
      routeFamily: 'editorial service menu',
      context: 'routing',
      wonder: 'projection consequence locality',
      pageFamily: 'menu',
      pageModes: 'read compare book contact',
      pageRole: 'service-register',
      heroRole: 'routing',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/contact'),
    meta: {
      routeFamily: 'editorial routing exchange',
      context: 'routing',
      wonder: 'locality consequence resonance',
      pageFamily: 'switchboard',
      pageModes: 'navigate contact compare context',
      pageRole: 'contact-register',
      heroRole: 'routing',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/settings'),
    meta: {
      routeFamily: 'editorial control panel',
      context: 'settings',
      wonder: 'comparison constraint locality',
      pageFamily: 'control-room',
      pageModes: 'inspect tune compare restore',
      pageRole: 'control-register',
      heroRole: 'control',
      heroCategoryFamily: 'register',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/tools/profile'),
    meta: {
      routeFamily: 'editorial profile workshop',
      context: 'analysis',
      wonder: 'comparison locality consequence',
      pageFamily: 'workshop',
      pageModes: 'edit inspect export compare',
      pageRole: 'tool-surface',
      heroRole: 'schema',
      heroCategoryFamily: 'workshop',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/tools'),
    meta: {
      routeFamily: 'editorial toolbench',
      context: 'analysis',
      wonder: 'projection locality consequence',
      pageFamily: 'toolbench',
      pageModes: 'inspect build compare use',
      pageRole: 'tool-register',
      heroRole: 'schema',
      heroCategoryFamily: 'workshop',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/offline'),
    meta: {
      routeFamily: 'editorial offline shell',
      context: 'reading',
      wonder: 'memory locality consequence',
      pageFamily: 'fallback',
      pageModes: 'recover navigate return inspect',
      pageRole: 'offline-surface',
      heroRole: 'orientation',
      heroCategoryFamily: 'register',
      heroLiminality: 'threshold',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/newyear'),
    meta: {
      routeFamily: 'editorial seasonal signal',
      context: 'publishing',
      wonder: 'memory projection resonance',
      pageFamily: 'seasonal',
      pageModes: 'read reflect send archive',
      pageRole: 'seasonal-message',
      heroRole: 'orientation',
      heroCategoryFamily: 'specimen',
      heroLiminality: 'threshold',
    },
  },
];

function pathMatchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalizeToken(value, separator = '-') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['".]/g, '')
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${separator}+`, 'g'), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');
}

function seedToken(value) {
  return normalizeToken(value, '_');
}

function titleizeSegment(segment) {
  if (!segment) return '';
  if (segment.includes('.')) return segment.toLowerCase();

  return segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === 'spw') return 'Spw';
      if (lower === 'rpg') return 'RPG';
      if (lower === 'uiuc') return 'UIUC';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function stripSiteName(title) {
  return String(title || '')
    .replace(/^\s*Spwashi\s*[•·|-]\s*/i, '')
    .trim();
}

function getPathSegments(pathname = window.location.pathname) {
  return pathname.split('/').filter(Boolean);
}

function deriveSurfaceFromPath(pathname = window.location.pathname) {
  const [first = 'home'] = getPathSegments(pathname);
  return normalizeToken(first) || 'home';
}

function inferContextFromSurface(surface, pathname) {
  if (surface === 'blog') return 'publishing';
  if (surface === 'contact' || surface === 'services') return 'routing';
  if (surface === 'settings') return 'settings';
  if (surface === 'play') return 'play';
  if (surface === 'recipes') return 'ritual';
  if (surface === 'tools') return 'analysis';
  if (surface === 'topics') return pathname.includes('/craft/') ? 'publishing' : 'analysis';
  return pathname === '/' ? 'orientation' : 'reading';
}

function inferWonderFromContext(context) {
  switch (context) {
    case 'routing':
      return 'orientation locality consequence';
    case 'analysis':
      return 'comparison constraint locality';
    case 'publishing':
      return 'projection resonance consequence';
    case 'play':
      return 'memory resonance consequence';
    case 'ritual':
      return 'memory projection consequence';
    case 'settings':
      return 'comparison constraint locality';
    case 'orientation':
      return 'orientation locality consequence';
    default:
      return 'orientation resonance consequence';
  }
}

function inferPageModes(context) {
  switch (context) {
    case 'routing':
      return 'navigate compare contact read';
    case 'analysis':
      return 'reading inspect compare build';
    case 'publishing':
      return 'reading inspect compose publish';
    case 'play':
      return 'read play track recall';
    case 'ritual':
      return 'reading practice sequence host';
    case 'settings':
      return 'inspect tune compare restore';
    case 'orientation':
      return 'reading inspect prompt collect';
    default:
      return 'reading inspect compare';
  }
}

function inferPageRole(pathname, surface) {
  if (pathname === '/') return 'portal-register';
  if (surface === 'contact') return 'contact-register';
  if (surface === 'services') return 'service-register';
  if (surface === 'blog') return 'editorial-lab';
  if (surface === 'settings') return 'control-register';
  if (surface === 'play') return 'play-register';
  if (surface === 'recipes') return 'principle-register';
  if (surface === 'tools') return 'tool-register';
  if (surface === 'topics') return 'topic-register';
  return `${surface || 'page'}-surface`;
}

function normalizeInternalHref(rawHref) {
  if (!rawHref || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return '';
  if (rawHref.startsWith('#')) return rawHref;

  try {
    const url = new URL(rawHref, window.location.origin);
    if (url.origin !== window.location.origin) return '';
    return `${url.pathname}${url.hash}`;
  } catch {
    return '';
  }
}

function collectInternalRoutes(root = document, limit = 8) {
  const routes = [];
  const seen = new Set();

  for (const anchor of safeQueryAll('a[href]', root)) {
    const href = normalizeInternalHref(anchor.getAttribute('href'));
    if (!href || seen.has(href)) continue;
    if (href === window.location.pathname || href === `${window.location.pathname}/`) continue;
    seen.add(href);
    routes.push(href);
    if (routes.length >= limit) break;
  }

  return routes;
}

function pushUniqueToken(bucket, seen, token, limit) {
  if (!token || seen.has(token) || CONTEXT_STOP_WORDS.has(token)) return;
  seen.add(token);
  bucket.push(token);
  if (bucket.length > limit) bucket.length = limit;
}

function collectContextTokens(root = document, limit = 8) {
  const tokens = [];
  const seen = new Set();
  const textBits = [];

  collectInternalRoutes(root, limit + 4).forEach((href) => textBits.push(href.replace(/[/?#]/g, ' ')));

  safeQueryAll('h1, h2, h3, strong, .spec-pill, .page-kicker, .spec-kicker', root)
    .slice(0, 12)
    .forEach((el) => textBits.push(el.textContent || ''));

  textBits
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .forEach((part) => {
      if (!part || part.length < 3) return;
      if (/^\d+$/.test(part)) return;
      pushUniqueToken(tokens, seen, normalizeToken(part), limit);
    });

  return tokens.slice(0, limit);
}

function getPrimaryHeading() {
  return safeQuery('main h1, article h1, h1');
}

function getDocumentTitle() {
  const title = document.title?.trim();
  if (title) return title;
  const heading = getPrimaryHeading()?.textContent?.trim();
  return heading ? `${SITE_NAME} • ${heading}` : SITE_NAME;
}

function getDocumentDescription() {
  const described = document.head?.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
  if (described) return described;

  const source = safeQuery('.page-lede, .site-lede, .frame-note, main p, article p');
  const text = source?.textContent?.replace(/\s+/g, ' ').trim() || '';
  return text.slice(0, 220);
}

function getCanonicalUrl() {
  const existing = document.head?.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim();
  if (existing) return existing;
  return new URL(window.location.pathname, window.location.origin).toString();
}

function getPageSeed(pathname, surface, segments) {
  const basis = ['page', surface || 'home', ...segments].map(seedToken).filter(Boolean);
  return basis.join('_') || 'page_home';
}

function resolvePageMetadata() {
  const pathname = window.location.pathname || '/';
  const segments = getPathSegments(pathname);
  const surface = BODY?.dataset?.spwSurface || deriveSurfaceFromPath(pathname);
  const context = inferContextFromSurface(surface, pathname);
  const fallback = {
    routeFamily: `editorial ${surface || 'site'} surface`,
    context,
    wonder: inferWonderFromContext(context),
    pageFamily: seedToken(segments[segments.length - 1] || surface || 'home').replace(/_/g, '-'),
    pageModes: inferPageModes(context),
    pageRole: inferPageRole(pathname, surface),
    pageSeed: getPageSeed(pathname, surface, segments),
    relatedRoutes: '',
    heroRole: context === 'routing' ? 'routing' : 'orientation',
    heroCategoryFamily: context === 'routing' ? 'register' : 'nook',
    heroLiminality: 'entry',
  };

  const matched = PAGE_METADATA_RULES.find((rule) => rule.test(pathname, surface, segments))?.meta || {};
  const meta = { ...fallback, ...matched };

  if (!meta.relatedRoutes) {
    meta.relatedRoutes = collectInternalRoutes(ROOT_MAIN || document.body, 8).join('|');
  }

  return meta;
}

function ensureMetaTag(attributeName, attributeValue, content) {
  if (!content || !document.head) return;
  const metas = [...document.head.querySelectorAll('meta')];
  let node = metas.find((meta) => meta.getAttribute(attributeName) === attributeValue) || null;

  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attributeName, attributeValue);
    document.head.append(node);
  }

  if (!node.getAttribute('content')) {
    node.setAttribute('content', content);
  }
}

function ensureLinkTag(rel, href, extra = {}) {
  if (!href || !document.head) return;
  const links = [...document.head.querySelectorAll('link')];
  let node = links.find((link) => link.getAttribute('rel') === rel) || null;

  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.append(node);
  }

  if (!node.getAttribute('href')) {
    node.setAttribute('href', href);
  }

  Object.entries(extra).forEach(([key, value]) => {
    if (value && !node.getAttribute(key)) node.setAttribute(key, value);
  });
}

function ensureStructuredData(id, payload) {
  if (!document.head || !payload) return;
  let node = document.head.querySelector(`script[data-spw-generated="${id}"]`);

  if (!node) {
    node = document.createElement('script');
    node.type = 'application/ld+json';
    node.dataset.spwGenerated = id;
    document.head.append(node);
  }

  node.textContent = JSON.stringify(payload, null, 2);
}

function buildBreadcrumbList(title, canonicalUrl) {
  const segments = getPathSegments(window.location.pathname);
  const items = [{
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: 'https://spwashi.com/',
  }];

  let path = '/';
  segments.forEach((segment, index) => {
    path += `${segment}/`;
    const isLast = index === segments.length - 1;
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: isLast ? stripSiteName(title) || titleizeSegment(segment) : titleizeSegment(segment),
      item: isLast ? canonicalUrl : new URL(path, window.location.origin).toString(),
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function normalizeHeadMetadata(pageMeta) {
  const title = getDocumentTitle();
  const description = getDocumentDescription();
  const canonicalUrl = getCanonicalUrl();
  const image = document.head?.querySelector('meta[property="og:image"]')?.getAttribute('content') || DEFAULT_OG_IMAGE;
  const imageAlt =
    document.head?.querySelector('meta[property="og:image:alt"]')?.getAttribute('content')
    || `${stripSiteName(title) || title} illustrated metadata card on Spwashi.`;
  const keywords = collectContextTokens(ROOT_MAIN || document.body, 12).join(', ');

  ensureLinkTag('canonical', canonicalUrl);
  ensureLinkTag('icon', '/favicon.ico', { sizes: '32x32' });
  ensureLinkTag('apple-touch-icon', '/public/images/apple-touch-icon.png');

  ensureMetaTag('name', 'description', description);
  ensureMetaTag('name', 'keywords', keywords);
  ensureMetaTag('property', 'og:type', 'website');
  ensureMetaTag('property', 'og:site_name', SITE_NAME);
  ensureMetaTag('property', 'og:title', title);
  ensureMetaTag('property', 'og:description', description);
  ensureMetaTag('property', 'og:url', canonicalUrl);
  ensureMetaTag('property', 'og:image', image);
  ensureMetaTag('property', 'og:image:alt', imageAlt);
  ensureMetaTag('property', 'og:image:width', '1200');
  ensureMetaTag('property', 'og:image:height', '630');
  ensureMetaTag('name', 'twitter:card', 'summary_large_image');
  ensureMetaTag('name', 'twitter:title', title);
  ensureMetaTag('name', 'twitter:description', description);
  ensureMetaTag('name', 'twitter:image', image);
  ensureMetaTag('name', 'twitter:image:alt', imageAlt);

  ensureStructuredData('spw-page', {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: 'https://spwashi.com/',
    },
    about: collectContextTokens(ROOT_MAIN || document.body, 8),
    keywords: keywords || undefined,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'spwSurface', value: BODY?.dataset?.spwSurface || 'default' },
      { '@type': 'PropertyValue', name: 'spwPageFamily', value: pageMeta.pageFamily },
      { '@type': 'PropertyValue', name: 'spwPageRole', value: pageMeta.pageRole },
      { '@type': 'PropertyValue', name: 'spwWonder', value: pageMeta.wonder },
    ],
  });

  ensureStructuredData('spw-breadcrumbs', buildBreadcrumbList(title, canonicalUrl));
}

function inferPromptability(el) {
  if (safeQuery('input, textarea, select, [contenteditable="true"]', el)) return 'active';
  if (safeQuery('button, a[href], summary, [data-set-mode]', el)) return 'latent';
  return 'ambient';
}

function inferAffordance(role, kind, el) {
  if (role === 'routing' || el.matches('nav')) return 'navigate';
  if (role === 'control') return 'tune';
  if (role === 'schema') return 'inspect';
  if (inferPromptability(el) === 'active') return 'edit';
  if (kind === 'card' && safeQuery('a[href]', el)) return 'open';
  if (BODY?.dataset?.spwContext === 'play') return 'play';
  if (role === 'orientation') return 'orient';
  return 'read';
}

function inferConsequence(role, kind) {
  if (role === 'routing') return 'entry';
  if (role === 'control') return 'state';
  if (role === 'schema') return 'model';
  if (role === 'orientation') return 'framing';
  if (role === 'reference') return 'memory';
  if (kind === 'card') return 'selection';
  return 'reflection';
}

function inferCategoryFamily(role, kind, pageMeta, el) {
  if (kind === 'card') return safeQuery('a[href]', el) ? 'portal' : 'specimen';
  if (kind === 'panel') return 'specimen';
  if (role === 'routing' || el.matches('nav')) return 'register';
  if (role === 'schema') return 'specimen';
  if (role === 'orientation') {
    return pageMeta.pageRole.includes('portal') || pageMeta.pageFamily === 'atlas' ? 'portal' : pageMeta.heroCategoryFamily;
  }
  if (pageMeta.context === 'play') return 'encounter';
  return 'register';
}

function inferCollectability(kind, el) {
  if (kind === 'card') return 'high';
  if (kind === 'panel') return 'medium';
  const count = safeQueryAll('a[href], li', el).length;
  if (count >= 6) return 'index';
  if (count >= 3) return 'some';
  return 'none';
}

function inferLocality(kind, el) {
  if (safeQuery('[data-set-mode], input, textarea, select', el)) return 'high';
  if (kind === 'card') return 'medium';
  if (safeQuery('a[href], button', el)) return 'medium';
  return 'low';
}

function deriveRegionSeed(el, pageMeta, index) {
  const raw =
    el.id
    || el.dataset.spwMeaning
    || el.getAttribute('aria-label')
    || el.querySelector('h1, h2, h3, h4, strong')?.textContent
    || `${inferRegionKind(el)}_${index}`;

  return `${pageMeta.pageSeed}__${seedToken(raw) || index}`;
}

function normalizeShellMetadata(pageMeta) {
  const header = safeQuery('header');
  if (header) {
    setDataIfMissing(header, 'spwKind', 'shell');
    setDataIfMissing(header, 'spwRole', 'routing');
    setDataIfMissing(header, 'spwContext', 'routing');
    setDataIfMissing(header, 'spwCategoryFamily', 'portal');
    setDataIfMissing(header, 'spwSeed', `${pageMeta.pageSeed}__site_header`);

    const related = collectInternalRoutes(header, 8).join('|');
    const contextRelevance = collectContextTokens(header, 8).join(' ');
    if (related) setDataIfMissing(header, 'spwRelatedRoutes', related);
    if (contextRelevance) setDataIfMissing(header, 'spwContextRelevance', contextRelevance);
  }

  const hero = safeQuery('.site-frame.site-hero, main > article > section:first-of-type, main > section:first-of-type');
  if (!hero) return;

  setDataIfMissing(hero, 'spwKind', 'frame');
  setDataIfMissing(hero, 'spwRole', pageMeta.heroRole || 'orientation');
  setDataIfMissing(hero, 'spwContext', pageMeta.context);
  setDataIfMissing(hero, 'spwWonder', pageMeta.wonder);
  setDataIfMissing(hero, 'spwAffordance', inferAffordance(pageMeta.heroRole || 'orientation', 'frame', hero));
  setDataIfMissing(hero, 'spwForm', 'brace');
  setDataIfMissing(hero, 'spwLiminality', pageMeta.heroLiminality || 'entry');
  setDataIfMissing(hero, 'spwCategoryFamily', pageMeta.heroCategoryFamily || 'nook');
  setDataIfMissing(hero, 'spwLocality', 'high');
  setDataIfMissing(hero, 'spwConsequence', inferConsequence(pageMeta.heroRole || 'orientation', 'frame'));
  setDataIfMissing(hero, 'spwPromptability', inferPromptability(hero));
  setDataIfMissing(hero, 'spwCollectability', inferCollectability('frame', hero));
  setDataIfMissing(hero, 'spwSeed', `${pageMeta.pageSeed}__hero`);

  const related = collectInternalRoutes(hero, 8).join('|');
  const contextRelevance = collectContextTokens(hero, 8).join(' ');
  if (related) setDataIfMissing(hero, 'spwRelatedRoutes', related);
  if (contextRelevance) setDataIfMissing(hero, 'spwContextRelevance', contextRelevance);
}

function normalizeRegionMetadata(pageMeta) {
  const regions = collectRegions(document);

  regions.forEach((el, index) => {
    const kind = inferRegionKind(el);
    const role = inferRegionRole(el);
    const context = inferRegionContext(el);
    const related = collectInternalRoutes(el, 8).join('|');
    const contextRelevance = collectContextTokens(el, 8).join(' ');

    setDataIfMissing(el, 'spwSeed', deriveRegionSeed(el, pageMeta, index));
    setDataIfMissing(el, 'spwPromptability', inferPromptability(el));
    setDataIfMissing(el, 'spwAffordance', inferAffordance(role, kind, el));
    setDataIfMissing(el, 'spwConsequence', inferConsequence(role, kind));
    setDataIfMissing(el, 'spwCategoryFamily', inferCategoryFamily(role, kind, pageMeta, el));
    setDataIfMissing(el, 'spwCollectability', inferCollectability(kind, el));
    setDataIfMissing(el, 'spwLocality', inferLocality(kind, el));
    setDataIfMissing(el, 'spwWonder', pageMeta.wonder);
    setDataIfMissing(el, 'spwContext', context || pageMeta.context);

    if (related) setDataIfMissing(el, 'spwRelatedRoutes', related);
    if (contextRelevance) setDataIfMissing(el, 'spwContextRelevance', contextRelevance);
  });
}

function normalizeDocumentMetadata() {
  const pathname = window.location.pathname || '/';
  const surface = BODY?.dataset?.spwSurface || deriveSurfaceFromPath(pathname);
  if (BODY && !BODY.dataset.spwSurface) BODY.dataset.spwSurface = surface;
  SITE_SURFACE = BODY?.dataset?.spwSurface || surface || 'default';

  const pageMeta = resolvePageMetadata();
  setDataIfMissing(BODY, 'spwRouteFamily', pageMeta.routeFamily);
  setDataIfMissing(BODY, 'spwContext', pageMeta.context);
  setDataIfMissing(BODY, 'spwWonder', pageMeta.wonder);
  setDataIfMissing(BODY, 'spwPageFamily', pageMeta.pageFamily);
  setDataIfMissing(BODY, 'spwPageModes', pageMeta.pageModes);
  setDataIfMissing(BODY, 'spwPageSeed', pageMeta.pageSeed);
  setDataIfMissing(BODY, 'spwPageRole', pageMeta.pageRole);
  if (pageMeta.relatedRoutes) setDataIfMissing(BODY, 'spwRelatedRoutes', pageMeta.relatedRoutes);

  normalizeHeadMetadata(pageMeta);
  normalizeShellMetadata(pageMeta);
  normalizeRegionMetadata(pageMeta);

  return pageMeta;
}

/* ==========================================================================
   3. Tiny event bus
   ========================================================================== */

function createBus() {
  const target = new EventTarget();

  return {
    on(type, handler, options) {
      target.addEventListener(type, handler, options);
      return () => target.removeEventListener(type, handler, options);
    },
    emit(type, detail = {}) {
      target.dispatchEvent(new CustomEvent(type, { detail }));
    },
  };
}

/* ==========================================================================
   4. Runtime registry
   ========================================================================== */

function createRegistry() {
  const records = new Map();

  function set(id, record) {
    records.set(id, record);
    return record;
  }

  function get(id) {
    return records.get(id) || null;
  }

  function has(id) {
    return records.has(id);
  }

  function remove(id) {
    records.delete(id);
  }

  function values() {
    return [...records.values()];
  }

  function cleanupAll() {
    for (const record of records.values()) {
      try {
        record.cleanup?.();
      } catch (error) {
        console.warn(`[site.js] cleanup failed for ${record.id}`, error);
      }
    }
    records.clear();
  }

  return {
    set,
    get,
    has,
    remove,
    values,
    cleanupAll,
  };
}

/* ==========================================================================
   5. Cleanup / refresh normalization
   ========================================================================== */

function normalizeMountHandle(result) {
  if (isFn(result)) {
    return { cleanup: result, refresh: null };
  }

  if (result && typeof result === 'object') {
    return {
      cleanup: isFn(result.cleanup) ? result.cleanup : null,
      refresh: isFn(result.refresh) ? result.refresh : null,
    };
  }

  return { cleanup: null, refresh: null };
}

/* ==========================================================================
   6. Region profiling and harmony
   --------------------------------------------------------------------------
   This is the main new layer: a lightweight semantic read of regions that
   both CSS and JS can use without expensive choreography.
   ========================================================================== */

function collectRegions(root = document) {
  const regions = safeQueryAll(REGION_SELECTOR, root).filter((el) => el instanceof HTMLElement);
  const seen = new Set();
  const ordered = [];

  for (const el of regions) {
    if (seen.has(el)) continue;
    seen.add(el);
    ordered.push(el);
  }

  return ordered;
}

function inferRegionKind(el) {
  return (
    el.dataset.spwKind ||
    (el.classList.contains('site-frame') ? 'frame' : '') ||
    (el.classList.contains('frame-panel') ? 'panel' : '') ||
    (el.classList.contains('frame-card') ? 'card' : '') ||
    (el.matches('nav') ? 'nav' : '') ||
    (el.matches('aside') ? 'aside' : '') ||
    (el.matches('section') ? 'section' : '') ||
    'component'
  );
}

function inferRegionRole(el) {
  if (el.dataset.spwRole) return el.dataset.spwRole;

  const text = (
    el.id ||
    el.getAttribute('aria-label') ||
    el.querySelector('h1,h2,h3,h4,strong')?.textContent ||
    ''
  ).toLowerCase();

  if (el.matches('nav')) return 'routing';
  if (text.includes('index') || text.includes('routes') || text.includes('navigation')) return 'routing';
  if (text.includes('plan') || text.includes('schema') || text.includes('structure')) return 'schema';
  if (text.includes('reference') || text.includes('register')) return 'reference';
  if (text.includes('settings')) return 'control';
  if (text.includes('hero') || text.includes('about') || text.includes('contact')) return 'orientation';

  return el.classList.contains('site-hero') ? 'orientation' : 'reference';
}

function inferRegionContext(el) {
  return (
    el.dataset.spwContext ||
    el.closest('[data-spw-context]')?.dataset?.spwContext ||
    BODY?.dataset?.spwContext ||
    'reading'
  );
}

function inferRegionSurface(el) {
  return (
    el.dataset.spwSurface ||
    el.closest('[data-spw-surface]')?.dataset?.spwSurface ||
    SITE_SURFACE
  );
}

function inferRegionHarmony(profile) {
  const role = profile.role;
  const kind = profile.kind;
  const context = profile.context;

  if (role === 'routing') return 'indexed';
  if (role === 'schema') return 'structured';
  if (role === 'reference') return 'measured';
  if (role === 'control') return 'responsive';
  if (role === 'orientation') return 'anchored';
  if (context === 'publishing') return 'editorial';
  if (kind === 'card') return 'modular';
  return 'ambient';
}

function inferRegionTempo(profile) {
  switch (profile.harmony) {
    case 'indexed': return 'snap';
    case 'structured': return 'deliberate';
    case 'responsive': return 'fast';
    case 'editorial': return 'settle';
    case 'anchored': return 'base';
    default: return 'base';
  }
}

function inferRegionDensity(profile) {
  if (profile.kind === 'card') return 'compact';
  if (profile.kind === 'panel') return 'medium';
  if (profile.role === 'reference') return 'reading';
  if (profile.role === 'schema') return 'dense';
  return 'medium';
}

function buildRegionProfile(el, index = 0) {
  const kind = inferRegionKind(el);
  const role = inferRegionRole(el);
  const context = inferRegionContext(el);
  const surface = inferRegionSurface(el);

  const profile = {
    index,
    id: el.id || null,
    key: el.id || el.dataset.spwId || `${kind}-${index}`,
    kind,
    role,
    context,
    surface,
    harmony: '',
    tempo: '',
    density: '',
    features: readSet(
      ...parseFeatureList(el.dataset.spwFeatures).values?.() || [],
      kind,
      role,
      context
    )
  };

  profile.harmony = inferRegionHarmony(profile);
  profile.tempo = inferRegionTempo(profile);
  profile.density = inferRegionDensity(profile);

  return profile;
}

function applyRegionProfile(el, profile) {
  setDataIfMissing(el, 'spwKind', profile.kind);
  setDataIfMissing(el, 'spwRole', profile.role);
  setDataIfMissing(el, 'spwContext', profile.context);
  setDataIfMissing(el, 'spwSurface', profile.surface);

  el.dataset.spwHarmony = profile.harmony;
  el.dataset.spwTempo = profile.tempo;
  el.dataset.spwDensity = profile.density;
  el.dataset.spwRegionKey = profile.key;
  el.style.setProperty('--region-index', String(profile.index));
}

function syncPageHarmony(ctx) {
  const profiles = ctx.regions.map((entry) => entry.profile);
  const harmonies = new Set(profiles.map((profile) => profile.harmony));
  const tempos = new Set(profiles.map((profile) => profile.tempo));

  HTML.dataset.spwHarmonyField = [...harmonies].join(' ');
  HTML.dataset.spwTempoField = [...tempos].join(' ');
  HTML.style.setProperty('--region-count', String(profiles.length));
}

/* ==========================================================================
   7. Runtime context
   ========================================================================== */

function createRuntimeContext() {
  const bus = createBus();
  const registry = createRegistry();

  const ctx = {
    version: 'site-runtime-v0.2',
    bus,
    registry,
    html: HTML,
    body: BODY,
    main: ROOT_MAIN,
    route: SITE_SURFACE,
    now: () => performance.now(),
    features: parseFeatureList(BODY?.dataset?.spwFeatures),
    routeFamily: parseFeatureList(BODY?.dataset?.spwRouteFamily),
    debug: parseFeatureList(HTML?.dataset?.spwDebug || BODY?.dataset?.spwDebug),
    observers: new Set(),
    timers: new Set(),
    cleanupStack: [],
    regions: [],
  };

  ctx.addCleanup = (fn) => {
    if (!isFn(fn)) return () => {};
    ctx.cleanupStack.push(fn);
    return () => {
      const idx = ctx.cleanupStack.indexOf(fn);
      if (idx >= 0) ctx.cleanupStack.splice(idx, 1);
    };
  };

  ctx.addTimer = (timerId) => {
    ctx.timers.add(timerId);
    return timerId;
  };

  ctx.clearTimers = () => {
    for (const timerId of ctx.timers) {
      window.clearTimeout(timerId);
      window.clearInterval(timerId);
      cancelIdle(timerId);
    }
    ctx.timers.clear();
  };

  ctx.addObserver = (observer) => {
    if (observer) ctx.observers.add(observer);
    return observer;
  };

  ctx.disconnectObservers = () => {
    for (const observer of ctx.observers) {
      try {
        observer.disconnect?.();
      } catch (error) {
        console.warn('[site.js] observer disconnect failed', error);
      }
    }
    ctx.observers.clear();
  };

  ctx.destroy = () => {
    ctx.registry.cleanupAll();
    ctx.disconnectObservers();
    ctx.clearTimers();
    for (const fn of ctx.cleanupStack.splice(0)) {
      try {
        fn();
      } catch (error) {
        console.warn('[site.js] context cleanup failed', error);
      }
    }
    ctx.regions = [];
  };

  return ctx;
}

function primeRegions(ctx) {
  const elements = collectRegions(document);
  ctx.regions = elements.map((el, index) => {
    const profile = buildRegionProfile(el, index);
    applyRegionProfile(el, profile);
    setRegionState(el, REGION_STATES.QUEUED);
    return {
      el,
      profile,
      visible: false,
      enhanced: false,
      active: false,
    };
  });

  syncPageHarmony(ctx);

  ctx.bus.emit('spw:regions-primed', {
    route: ctx.route,
    count: ctx.regions.length,
    profiles: ctx.regions.map((entry) => entry.profile),
  });
}

/* ==========================================================================
   8. Minimal core behavior
   ========================================================================== */

function initMinimalSiteCore(ctx) {
  const cleanups = [];

  cleanups.push(bindModeGroups(ctx));
  cleanups.push(bindExplicitFrameActivation(ctx));
  cleanups.push(bindHashLandingState(ctx));
  cleanups.push(bindHashChangeRefresh(ctx));
  cleanups.push(bindRegionPrimeObserver(ctx));

  return {
    cleanup() {
      for (const fn of cleanups) {
        try {
          fn?.();
        } catch (error) {
          console.warn('[site.js] core cleanup failed', error);
        }
      }
    },
    refresh(nextCtx) {
      nextCtx?.bus?.emit('spw:core-refresh', { route: nextCtx.route });
      refreshRegionProfiles(nextCtx || ctx);
    },
  };
}

function bindModeGroups(ctx) {
  const buttons = safeQueryAll('[data-mode-group][data-set-mode]');
  if (!buttons.length) return () => {};

  const grouped = new Map();

  for (const button of buttons) {
    const group = button.getAttribute('data-mode-group');
    if (!group) continue;
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(button);
  }

  function applyMode(group, mode) {
    const groupButtons = grouped.get(group) || [];
    for (const button of groupButtons) {
      const isActive = button.getAttribute('data-set-mode') === mode;
      button.setAttribute('aria-pressed', String(isActive));
    }

    const panels = safeQueryAll(`[data-mode-group="${CSS.escape(group)}"][data-mode-panel]`);
    for (const panel of panels) {
      const show = panel.getAttribute('data-mode-panel') === mode;
      panel.hidden = !show;
    }

    ctx.bus.emit('spw:mode-change', { group, mode });
  }

  const handlers = [];

  for (const button of buttons) {
    const handler = (event) => {
      event.preventDefault();
      const group = button.getAttribute('data-mode-group');
      const mode = button.getAttribute('data-set-mode');
      if (!group || !mode) return;
      applyMode(group, mode);
    };
    button.addEventListener('click', handler);
    handlers.push(() => button.removeEventListener('click', handler));
  }

  return () => {
    for (const cleanup of handlers) cleanup();
  };
}

function bindExplicitFrameActivation(ctx) {
  const frames = safeQueryAll('.site-frame, [data-spw-kind="frame"]');
  if (!frames.length) return () => {};

  function setActiveFrame(nextFrame) {
    for (const frame of frames) {
      const isActive = frame === nextFrame;
      frame.classList.toggle('is-active-frame', isActive);
      frame.dataset.spwActive = isActive ? 'true' : 'false';
    }

    const region = ctx.regions.find((entry) => entry.el === nextFrame);
    if (region) {
      region.active = true;
      region.el.dataset.spwAttention = 'focused';
      region.el.dataset.spwStateAccent = 'active';
    }

    ctx.bus.emit('spw:frame-change', {
      id: nextFrame?.id || null,
      frame: nextFrame || null,
      route: ctx.route,
      source: 'explicit',
    });
  }

  const handlers = [];

  for (const frame of frames) {
    const focusHandler = () => setActiveFrame(frame);
    const pointerHandler = () => setActiveFrame(frame);

    frame.addEventListener('focusin', focusHandler);
    frame.addEventListener('pointerdown', pointerHandler, { passive: true });

    handlers.push(() => frame.removeEventListener('focusin', focusHandler));
    handlers.push(() => frame.removeEventListener('pointerdown', pointerHandler));
  }

  const initialTarget = resolveHashTargetFrame() || frames[0] || null;
  if (initialTarget) setActiveFrame(initialTarget);

  return () => {
    for (const cleanup of handlers) cleanup();
  };
}

function resolveHashTargetFrame() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;
  const target = safeQuery(hash);
  if (!target) return null;
  return target.closest('.site-frame, [data-spw-kind="frame"]') || null;
}

function bindHashLandingState(ctx) {
  function applyHashState() {
    const frame = resolveHashTargetFrame();
    if (!frame) return;
    frame.classList.add('is-active-frame');
    frame.dataset.spwActive = 'true';
    frame.dataset.spwAttention = 'focused';
    ctx.bus.emit('spw:hash-target', { frame, id: frame.id || null });
  }

  const handle = window.setTimeout(applyHashState, 0);
  ctx.addTimer(handle);

  return () => window.clearTimeout(handle);
}

function bindHashChangeRefresh(ctx) {
  const handler = () => {
    const frame = resolveHashTargetFrame();
    if (!frame) return;
    frame.classList.add('is-active-frame');
    frame.dataset.spwActive = 'true';
    frame.dataset.spwAttention = 'focused';
    ctx.bus.emit('spw:hash-target', { frame, id: frame.id || null });
  };

  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

function bindRegionPrimeObserver(ctx) {
  if (!ctx.regions.length || !('IntersectionObserver' in window)) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const region = ctx.regions.find((item) => item.el === entry.target);
        if (!region) continue;

        region.visible = entry.isIntersecting || entry.intersectionRatio > 0;
        if (region.visible) {
          setRegionState(region.el, REGION_STATES.PRIMED);
          region.el.dataset.spwAttention = region.active ? 'focused' : 'approach';
          region.el.dataset.spwStateAccent = region.profile.harmony;
        } else if (!region.enhanced) {
          setRegionState(region.el, REGION_STATES.QUEUED);
          region.el.dataset.spwAttention = 'ambient';
        }
      }
    },
    {
      root: null,
      rootMargin: '220px 0px',
      threshold: [0, 0.01, 0.2],
    }
  );

  ctx.addObserver(observer);
  ctx.regions.forEach((region) => observer.observe(region.el));

  return () => observer.disconnect();
}

function refreshRegionProfiles(ctx) {
  ctx.regions.forEach((entry, index) => {
    entry.profile = buildRegionProfile(entry.el, index);
    applyRegionProfile(entry.el, entry.profile);
  });
  syncPageHarmony(ctx);
}

/* ==========================================================================
   9. Region enhancement layer
   --------------------------------------------------------------------------
   Lightweight by default. Writes CSS-facing state and can mount tiny
   region-scoped helpers later.
   ========================================================================== */

function initRegionEnhancer(ctx, root) {
  if (!(root instanceof HTMLElement)) return;

  const region = ctx.regions.find((entry) => entry.el === root);
  if (!region) return;

  setRegionState(root, REGION_STATES.HYDRATING);

  const { profile } = region;

  root.dataset.spwEnhanced = 'true';
  root.dataset.spwMotionFamily = profile.tempo;
  root.dataset.spwHarmony = profile.harmony;
  root.dataset.spwDensity = profile.density;
  root.dataset.spwRegionLayer = 'enhanced';
  root.style.setProperty('--region-harmonic-weight', String(region.profile.index + 1));

  const chips = root.querySelector('.spec-strip, .frame-operators, [data-spw-slot="meta"]');
  if (chips) {
    chips.dataset.spwRegionLinked = 'true';
  }

  setRegionState(root, REGION_STATES.ENHANCED);
  region.enhanced = true;

  ctx.bus.emit('spw:region-enhanced', {
    route: ctx.route,
    id: profile.id,
    key: profile.key,
    harmony: profile.harmony,
    tempo: profile.tempo,
    density: profile.density,
    root,
  });

  return {
    cleanup() {
      region.enhanced = false;
      root.dataset.spwRegionLayer = 'settling';
      setRegionState(root, REGION_STATES.SETTLING);
      delete root.dataset.spwEnhanced;
      const chips = root.querySelector('.spec-strip, .frame-operators, [data-spw-slot="meta"]');
      if (chips) delete chips.dataset.spwRegionLinked;
    },
    refresh(nextCtx) {
      const nextRegion = (nextCtx || ctx).regions.find((entry) => entry.el === root);
      if (!nextRegion) return;
      applyRegionProfile(root, nextRegion.profile);
      root.dataset.spwMotionFamily = nextRegion.profile.tempo;
      root.dataset.spwHarmony = nextRegion.profile.harmony;
      root.dataset.spwDensity = nextRegion.profile.density;
    },
  };
}

/* ==========================================================================
   10. Module definitions
   ========================================================================== */

const CORE_DEFS = [
  {
    id: 'site-settings',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./site-settings.js'),
    mount: (mod, ctx) => {
      const fn = mod?.applySiteSettings;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'shell-disclosure',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./spw-shell-disclosure.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwShellDisclosure;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'site-core-minimal',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: async () => ({ initMinimalSiteCore }),
    mount: (mod, ctx) => {
      const fn = mod?.initMinimalSiteCore;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

const FEATURE_DEFS = [
  {
    id: 'blog-interpreter',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-blog-interpreter]',
    route: 'blog',
    rootMode: 'each',
    load: () => import('./blog-interpreter.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initBlogInterpreter;
      if (!isFn(fn)) return;
      return fn({ ...ctx, root });
    },
  },
  {
    id: 'blog-specimens',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.specimen-card, #specimen-index',
    route: 'blog',
    rootMode: 'single',
    load: () => import('./blog-specimens.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initBlogSpecimens;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'settings-page',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'settings',
    selector: '[data-spw-surface="settings"], main',
    load: () => import('./site-settings-page.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSiteSettingsPage;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

const REGION_DEFS = [
  {
    id: 'region-enhancer',
    layer: MODULE_LAYERS.REGION,
    when: MOUNT_WHEN.REGION,
    selector: REGION_SELECTOR,
    rootMode: 'each',
    load: async () => ({ initRegionEnhancer }),
    mount: (mod, ctx, root) => {
      const fn = mod?.initRegionEnhancer;
      if (!isFn(fn)) return;
      return fn(ctx, root);
    },
  },
];

const ENHANCEMENT_DEFS = [
  {
    id: 'logo-runtime',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spw-logo, [data-spw-logo]',
    rootMode: 'single',
    load: () => import('./spw-logo-runtime.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwLogoRuntime || mod?.initLogoRuntime;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'topic-discovery',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spw-topic, [data-spw-topic]',
    rootMode: 'single',
    load: () => import('./spw-topic-discovery.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwTopicDiscovery || mod?.initTopicDiscovery;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'component-semantics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    load: () => import('./spw-component-semantics.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwComponentSemantics;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

/* ==========================================================================
   11. Module mounting
   ========================================================================== */

function makeRecordId(def, root = null, index = 0) {
  if (!root || root === document.body) return def.id;
  const rootId = root.id || root.getAttribute('data-spw-region-key') || root.getAttribute('data-spw-id') || root.getAttribute('data-spw-kind') || index;
  return `${def.id}::${String(rootId)}`;
}

async function mountDefinition(def, ctx, root = null, index = 0) {
  const recordId = makeRecordId(def, root, index);

  if (ctx.registry.has(recordId)) return ctx.registry.get(recordId);

  ctx.registry.set(recordId, {
    id: recordId,
    layer: def.layer,
    status: 'idle',
    cleanup: null,
    refresh: null,
    root,
    mountedAt: null,
    error: null,
  });

  try {
    if (root instanceof HTMLElement) setRegionState(root, REGION_STATES.HYDRATING);

    const mod = await def.load();
    const result = await def.mount(mod, ctx, root);
    const handle = normalizeMountHandle(result);

    const record = {
      id: recordId,
      layer: def.layer,
      status: 'mounted',
      cleanup: handle.cleanup,
      refresh: handle.refresh,
      root,
      mountedAt: performance.now(),
      error: null,
    };

    ctx.registry.set(recordId, record);

    if (root instanceof HTMLElement) {
      const state =
        def.layer === MODULE_LAYERS.ENHANCEMENT || def.layer === MODULE_LAYERS.REGION
          ? REGION_STATES.ENHANCED
          : REGION_STATES.INTERACTIVE;
      setRegionState(root, state);
    }

    ctx.bus.emit('spw:module-mounted', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      route: ctx.route,
      root,
    });

    return record;
  } catch (error) {
    console.warn(`[site.js] module mount failed: ${def.id}`, error);

    const record = {
      id: recordId,
      layer: def.layer,
      status: 'failed',
      cleanup: null,
      refresh: null,
      root,
      mountedAt: null,
      error,
    };

    ctx.registry.set(recordId, record);

    if (root instanceof HTMLElement) setRegionState(root, REGION_STATES.QUEUED);

    ctx.bus.emit('spw:module-failed', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      route: ctx.route,
      root,
      error,
    });

    return record;
  }
}

async function mountImmediateLayer(defs, ctx) {
  for (const def of defs) {
    if (!matchesRoute(def) || !hasSelector(def)) continue;
    await mountDefinition(def, ctx, null, 0);
  }
}

async function mountVisibleFeatures(defs, ctx) {
  const visibleDefs = defs.filter((def) => def.when === MOUNT_WHEN.VISIBLE && matchesRoute(def) && hasSelector(def));
  if (!visibleDefs.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;

        for (const def of visibleDefs) {
          if (!el.matches(def.selector)) continue;

          if (def.rootMode === 'single') {
            void mountDefinition(def, ctx, null, 0);
          } else {
            void mountDefinition(def, ctx, el);
          }
        }

        observer.unobserve(el);
      }
    },
    {
      root: null,
      rootMargin: '240px 0px',
      threshold: 0.01,
    }
  );

  ctx.addObserver(observer);

  for (const def of visibleDefs) {
    const roots = getRoots(def);
    roots.forEach((el) => {
      if (el instanceof HTMLElement) {
        setRegionState(el, REGION_STATES.QUEUED);
      }
      observer.observe(el);
    });
  }
}

async function mountInteractionFeatures(defs, ctx) {
  const interactionDefs = defs.filter((def) => def.when === MOUNT_WHEN.INTERACTION && matchesRoute(def) && hasSelector(def));
  if (!interactionDefs.length) return;

  const activate = once(async () => {
    for (const def of interactionDefs) {
      const roots = getRoots(def);
      if (!roots.length || def.rootMode === 'single') {
        await mountDefinition(def, ctx, null, 0);
        continue;
      }
      for (const [index, root] of roots.entries()) {
        await mountDefinition(def, ctx, root, index);
      }
    }
  });

  const handler = () => {
    void activate();
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener('pointerdown', handler, options);
    window.removeEventListener('keydown', handler, options);
    window.removeEventListener('touchstart', handler, options);
  };

  const options = { once: true, passive: true };
  window.addEventListener('pointerdown', handler, options);
  window.addEventListener('keydown', handler, options);
  window.addEventListener('touchstart', handler, options);

  ctx.addCleanup(cleanup);
}

async function mountRegionLayer(defs, ctx) {
  const regionDefs = defs.filter((def) => def.when === MOUNT_WHEN.REGION && matchesRoute(def) && hasSelector(def));
  if (!regionDefs.length || !ctx.regions.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;

        for (const def of regionDefs) {
          if (!el.matches(def.selector)) continue;
          void mountDefinition(def, ctx, el);
        }

        observer.unobserve(el);
      }
    },
    {
      root: null,
      rootMargin: '160px 0px',
      threshold: 0.01,
    }
  );

  ctx.addObserver(observer);

  ctx.regions.forEach((region) => {
    setRegionState(region.el, REGION_STATES.PRIMED);
    observer.observe(region.el);
  });
}

function queueIdleEnhancements(defs, ctx) {
  const idleDefs = defs.filter((def) => def.when === MOUNT_WHEN.IDLE && matchesRoute(def) && hasSelector(def));
  if (!idleDefs.length) return;

  const handle = onIdle(async () => {
    for (const def of idleDefs) {
      const roots = getRoots(def);

      if (!roots.length || def.rootMode === 'single') {
        await mountDefinition(def, ctx, null, 0);
        continue;
      }

      for (const [index, root] of roots.entries()) {
        await mountDefinition(def, ctx, root, index);
      }
    }

    setPageState(PAGE_STATES.ENHANCED);
    ctx.bus.emit('spw:page-enhanced', { route: ctx.route });
  });

  ctx.addTimer(handle);
}

/* ==========================================================================
   12. Refresh support
   ========================================================================== */

function refreshRuntime(ctx) {
  refreshRegionProfiles(ctx);

  for (const record of ctx.registry.values()) {
    try {
      record.refresh?.(ctx);
    } catch (error) {
      console.warn(`[site.js] refresh failed for ${record.id}`, error);
    }
  }

  ctx.bus.emit('spw:runtime-refresh', { route: ctx.route });
}

/* ==========================================================================
   13. Public teardown / reinit hooks
   ========================================================================== */

let runtimeCtx = null;

function destroyRuntime() {
  if (!runtimeCtx) return;
  runtimeCtx.destroy();
  runtimeCtx = null;
  delete HTML.dataset.spwPageState;
  delete HTML.dataset.spwHarmonyField;
  delete HTML.dataset.spwTempoField;
}

async function bootSite() {
  await whenDocumentReady();
  normalizeDocumentMetadata();

  runtimeCtx = createRuntimeContext();
  setPageState(PAGE_STATES.BOOTING);

  runtimeCtx.bus.emit('spw:page-boot', { route: runtimeCtx.route });

  primeRegions(runtimeCtx);

  await mountImmediateLayer(CORE_DEFS, runtimeCtx);
  await mountImmediateLayer(
    FEATURE_DEFS.filter((def) => def.when === MOUNT_WHEN.IMMEDIATE),
    runtimeCtx
  );

  setPageState(PAGE_STATES.INTERACTIVE);
  runtimeCtx.bus.emit('spw:page-interactive', { route: runtimeCtx.route });

  await mountVisibleFeatures(FEATURE_DEFS, runtimeCtx);
  await mountInteractionFeatures(FEATURE_DEFS, runtimeCtx);

  setPageState(PAGE_STATES.HYDRATED);
  runtimeCtx.bus.emit('spw:page-hydrated', { route: runtimeCtx.route });

  await mountRegionLayer(REGION_DEFS, runtimeCtx);

  setPageState(PAGE_STATES.REGION_ENHANCED);
  runtimeCtx.bus.emit('spw:page-region-enhanced', { route: runtimeCtx.route });

  queueIdleEnhancements(ENHANCEMENT_DEFS, runtimeCtx);

  whenWindowLoaded().then(() => {
    if (!runtimeCtx) return;
    refreshRuntime(runtimeCtx);
  });

  return runtimeCtx;
}

/* ==========================================================================
   14. Dev / manual hooks
   ========================================================================== */

window.__SPW_SITE__ = {
  bootSite,
  destroyRuntime,
  refreshRuntime: () => runtimeCtx && refreshRuntime(runtimeCtx),
  getContext: () => runtimeCtx,
};

/* ==========================================================================
   15. Start
   ========================================================================== */

void bootSite();
