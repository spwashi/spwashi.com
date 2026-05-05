import {
  REGION_HOST_SELECTOR,
  REGION_SELECTOR as PAGE_METADATA_REGION_SELECTOR,
  inferTopographyKind,
  writeDatasetValue,
  writeDatasetValueIfMissing,
} from '/public/js/kernel/spw-dom-contracts.js';

const SITE_NAME = 'Spwashi';
const DEFAULT_OG_IMAGE = 'https://spwashi.com/public/images/assets/illustrations/home-og-card.jpg';
const DEFAULT_OG_IMAGE_ALT = 'Illustrated Spwashi field card showing readable systems, structural surfaces, and playful semantic materials.';
const ASSET_PATH_RE = /\.(?:avif|css|gif|ico|jpe?g|js|json|mjs|cjs|map|pdf|png|svg|txt|webmanifest|webp|xml)$/i;
const NOISY_HASHES = new Set(['#main-content', '#top']);
const ROLE_CLUSTER_BY_ROLE = Object.freeze({
  routing: 'reference',
  register: 'reference',
  route: 'reference',
  artifact: 'reference',
  reference: 'reference',
  schema: 'schema',
  comparison: 'schema',
  pipeline: 'schema',
  probe: 'probe',
  telemetry: 'probe',
  lens: 'probe',
  projection: 'surface',
  surface: 'surface',
  control: 'surface',
  scenario: 'pragma',
  rationale: 'pragma',
  pragma: 'pragma',
});
const CONTEXT_STOP_WORDS = new Set([
  'a',
  'all',
  'an',
  'and',
  'about',
  'again',
  'after',
  'are',
  'as',
  'blog',
  'but',
  'can',
  'card',
  'choose',
  'contact',
  'domain',
  'each',
  'first',
  'for',
  'frame',
  'from',
  'get',
  'gets',
  'guide',
  'have',
  'home',
  'here',
  'index',
  'into',
  'its',
  'just',
  'kind',
  'kinds',
  'many',
  'more',
  'not',
  'now',
  'of',
  'once',
  'one',
  'or',
  'page',
  'pages',
  'paid',
  'public',
  'register',
  'route',
  'routes',
  'section',
  'services',
  'settings',
  'some',
  'site',
  'stay',
  'still',
  'spwashi',
  'surface',
  'surfaces',
  'systems',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'tools',
  'topic',
  'topics',
  'through',
  'use',
  'using',
  'want',
  'what',
  'when',
  'where',
  'which',
  'with',
  'without',
  'you',
  'your',
  'matches',
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
    test: (pathname) => pathMatchesPrefix(pathname, '/tools/character-sheet'),
    meta: {
      routeFamily: 'editorial apprenticeship workshop',
      context: 'analysis',
      wonder: 'projection locality consequence',
      pageFamily: 'workshop',
      pageModes: 'edit translate publish compare',
      pageRole: 'mentorship-tool',
      heroRole: 'schema',
      heroCategoryFamily: 'workshop',
      heroLiminality: 'entry',
    },
  },
  {
    test: (pathname) => pathMatchesPrefix(pathname, '/tools/midjourney'),
    meta: {
      routeFamily: 'editorial image lab',
      context: 'analysis',
      wonder: 'projection resonance locality',
      pageFamily: 'laboratory',
      pageModes: 'collect compare stage prompt',
      pageRole: 'prompt-lab',
      heroRole: 'schema',
      heroCategoryFamily: 'workshop',
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

function setDataIfMissing(el, key, value) {
  writeDatasetValueIfMissing(el, key, value);
}

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

function ensureId(el, fallback) {
  if (!(el instanceof Element)) return '';
  if (el.id) return el.id;

  const normalized = normalizeToken(fallback || el.textContent || 'section');
  if (!normalized) return '';

  let candidate = normalized;
  let index = 2;
  while (document.getElementById(candidate)) {
    candidate = `${normalized}-${index}`;
    index += 1;
  }

  el.id = candidate;
  return candidate;
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

function inferRoleCluster(role) {
  return ROLE_CLUSTER_BY_ROLE[normalizeToken(role)] || '';
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

function isLikelyAssetPath(pathname = '') {
  return ASSET_PATH_RE.test(pathname);
}

function normalizeInternalHref(rawHref) {
  if (!rawHref || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return '';
  if (rawHref.startsWith('#')) {
    return NOISY_HASHES.has(rawHref.toLowerCase()) ? '' : rawHref;
  }

  try {
    const url = new URL(rawHref, window.location.origin);
    if (url.origin !== window.location.origin) return '';
    if (isLikelyAssetPath(url.pathname)) return '';
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

function getPrimaryHeading(root = document) {
  return safeQuery('main h1, article h1, h1', root);
}

function getDocumentTitle(root = document) {
  const title = document.title?.trim();
  if (title) return title;
  const heading = getPrimaryHeading(root)?.textContent?.trim();
  return heading ? `${SITE_NAME} • ${heading}` : SITE_NAME;
}

function getDocumentDescription(root = document) {
  const described = document.head?.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
  if (described) return described;

  const source = safeQuery('.page-lede, .site-lede, .frame-note, main p, article p', root);
  const text = source?.textContent?.replace(/\s+/g, ' ').trim() || '';
  return text.slice(0, 220);
}

function getCanonicalUrl() {
  const existing = document.head?.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim();
  if (existing) return existing;
  return new URL(window.location.pathname, window.location.origin).toString();
}

function getPageSeed(surface, segments) {
  const basis = ['page', surface || 'home', ...segments].map(seedToken).filter(Boolean);
  return basis.join('_') || 'page_home';
}

function resolvePageMetadata({ body = document.body, main = document.querySelector('main') } = {}) {
  const pathname = window.location.pathname || '/';
  const segments = getPathSegments(pathname);
  const surface = body?.dataset?.spwSurface || deriveSurfaceFromPath(pathname);
  const context = inferContextFromSurface(surface, pathname);
  const fallback = {
    routeFamily: `editorial ${surface || 'site'} surface`,
    context,
    wonder: inferWonderFromContext(context),
    pageFamily: seedToken(segments[segments.length - 1] || surface || 'home').replace(/_/g, '-'),
    pageModes: inferPageModes(context),
    pageRole: inferPageRole(pathname, surface),
    pageSeed: getPageSeed(surface, segments),
    relatedRoutes: '',
    heroRole: context === 'routing' ? 'routing' : 'orientation',
    heroCategoryFamily: context === 'routing' ? 'register' : 'nook',
    heroLiminality: 'entry',
  };

  const matched = PAGE_METADATA_RULES.find((rule) => rule.test(pathname, surface, segments))?.meta || {};
  const meta = { ...fallback, ...matched };

  if (!meta.relatedRoutes) {
    meta.relatedRoutes = collectInternalRoutes(main || body || document.body, 8).join('|');
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

function normalizeHeadMetadata(pageMeta, { body = document.body, main = document.querySelector('main') } = {}) {
  const title = getDocumentTitle(document);
  const description = getDocumentDescription(document);
  const canonicalUrl = getCanonicalUrl();
  const image = document.head?.querySelector('meta[property="og:image"]')?.getAttribute('content') || DEFAULT_OG_IMAGE;
  const imageAlt =
    document.head?.querySelector('meta[property="og:image:alt"]')?.getAttribute('content')
    || `${stripSiteName(title) || title} illustrated metadata card on Spwashi.`;
  const keywords = collectContextTokens(main || body || document.body, 12).join(', ');

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
  ensureMetaTag('name', 'twitter:image:alt', imageAlt || DEFAULT_OG_IMAGE_ALT);

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
    about: collectContextTokens(main || body || document.body, 8),
    keywords: keywords || undefined,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'spwSurface', value: body?.dataset?.spwSurface || 'default' },
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

function inferAffordance(role, kind, el, body = document.body) {
  if (role === 'routing' || el.matches('nav')) return 'navigate';
  if (role === 'control') return 'tune';
  if (role === 'schema') return 'inspect';
  if (inferPromptability(el) === 'active') return 'edit';
  if (kind === 'card' && safeQuery('a[href]', el)) return 'open';
  if (body?.dataset?.spwContext === 'play') return 'play';
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

function collectRegions(root = document) {
  const regions = safeQueryAll(PAGE_METADATA_REGION_SELECTOR, root).filter((el) => el instanceof HTMLElement);
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
  return inferTopographyKind(el, 'component');
}

function inferRegionRole(el) {
  if (el.dataset.spwRole) return el.dataset.spwRole;

  const text = (
    el.id
    || el.getAttribute('aria-label')
    || el.querySelector('h1,h2,h3,h4,strong')?.textContent
    || ''
  ).toLowerCase();

  if (el.matches('nav')) return 'routing';
  if (text.includes('index') || text.includes('routes') || text.includes('navigation')) return 'routing';
  if (text.includes('plan') || text.includes('schema') || text.includes('structure')) return 'schema';
  if (text.includes('reference') || text.includes('register')) return 'reference';
  if (text.includes('settings')) return 'control';
  if (text.includes('hero') || text.includes('about') || text.includes('contact')) return 'orientation';

  return el.classList.contains('site-hero') ? 'orientation' : 'reference';
}

function inferRegionContext(el, body = document.body) {
  return (
    el.dataset.spwContext ||
    el.closest('[data-spw-context]')?.dataset?.spwContext ||
    body?.dataset?.spwContext ||
    'reading'
  );
}

function findRegionHeading(el) {
  if (!(el instanceof Element)) return null;
  return el.querySelector('h1, h2, h3, h4, h5, h6');
}

function ensureMainLandmark(main = safeQuery('main')) {
  if (!(main instanceof HTMLElement)) return null;
  if (!main.id) main.id = 'main-content';
  if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  return main;
}

function normalizeRegionAccessibility(pageMeta, { body = document.body } = {}) {
  const main = ensureMainLandmark(safeQuery('main'));
  const mainHeading = main ? findRegionHeading(main) : null;

  if (main && mainHeading && !main.hasAttribute('aria-labelledby') && !main.getAttribute('aria-label')) {
    const mainSeed = body?.dataset?.spwPageSeed || pageMeta?.pageSeed || 'page';
    main.setAttribute('aria-labelledby', ensureId(mainHeading, `${mainSeed}-main-title`));
  }

  collectRegions(document).forEach((el, index) => {
    const role = el.dataset.spwRole || inferRegionRole(el);
    const kind = el.dataset.spwKind || inferRegionKind(el);
    const roleCluster = inferRoleCluster(role);
    if (roleCluster) setDataIfMissing(el, 'spwRoleCluster', roleCluster);

    const heading = findRegionHeading(el);
    if (heading && !el.hasAttribute('aria-labelledby') && !el.getAttribute('aria-label')) {
      const labelBase = el.id || el.dataset.spwSeed || deriveRegionSeed(el, pageMeta, index) || kind || 'region';
      el.setAttribute('aria-labelledby', ensureId(heading, `${labelBase}-title`));
    }

    if (!el.hasAttribute('role') && el.tagName === 'DIV' && (kind === 'panel' || kind === 'card')) {
      el.setAttribute('role', 'group');
    }
  });

  safeQueryAll('nav').forEach((nav, index) => {
    if (nav.getAttribute('aria-label') || nav.hasAttribute('aria-labelledby')) return;

    const closestRegion = nav.closest(REGION_HOST_SELECTOR);
    const heading = findRegionHeading(closestRegion);
    if (!heading) return;

    const headingId = ensureId(
      heading,
      `${closestRegion?.id || closestRegion?.dataset?.spwSeed || pageMeta?.pageSeed || 'nav'}-nav-title-${index + 1}`
    );
    nav.setAttribute('aria-labelledby', headingId);
  });
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

function normalizeShellMetadata(pageMeta, { body = document.body } = {}) {
  const header = safeQuery('header');
  if (header) {
    setDataIfMissing(header, 'spwKind', 'shell');
    setDataIfMissing(header, 'spwRole', 'routing');
    setDataIfMissing(header, 'spwRoleCluster', inferRoleCluster('routing'));
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
  setDataIfMissing(hero, 'spwRoleCluster', inferRoleCluster(pageMeta.heroRole || 'orientation'));
  setDataIfMissing(hero, 'spwContext', pageMeta.context);
  setDataIfMissing(hero, 'spwWonder', pageMeta.wonder);
  setDataIfMissing(hero, 'spwAffordance', inferAffordance(pageMeta.heroRole || 'orientation', 'frame', hero, body));
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

function normalizeRegionMetadata(pageMeta, { body = document.body } = {}) {
  const regions = collectRegions(document);

  regions.forEach((el, index) => {
    const kind = inferRegionKind(el);
    const role = inferRegionRole(el);
    const context = inferRegionContext(el, body);
    const related = collectInternalRoutes(el, 8).join('|');
    const contextRelevance = collectContextTokens(el, 8).join(' ');

    setDataIfMissing(el, 'spwSeed', deriveRegionSeed(el, pageMeta, index));
    setDataIfMissing(el, 'spwPromptability', inferPromptability(el));
    setDataIfMissing(el, 'spwAffordance', inferAffordance(role, kind, el, body));
    setDataIfMissing(el, 'spwConsequence', inferConsequence(role, kind));
    setDataIfMissing(el, 'spwRoleCluster', inferRoleCluster(role));
    setDataIfMissing(el, 'spwCategoryFamily', inferCategoryFamily(role, kind, pageMeta, el));
    setDataIfMissing(el, 'spwCollectability', inferCollectability(kind, el));
    setDataIfMissing(el, 'spwLocality', inferLocality(kind, el));
    setDataIfMissing(el, 'spwWonder', pageMeta.wonder);
    setDataIfMissing(el, 'spwContext', context || pageMeta.context);

    if (related) setDataIfMissing(el, 'spwRelatedRoutes', related);
    if (contextRelevance) setDataIfMissing(el, 'spwContextRelevance', contextRelevance);
  });
}

function applyPageMetadata(pageMeta, body = document.body) {
  setDataIfMissing(body, 'spwRouteFamily', pageMeta.routeFamily);
  setDataIfMissing(body, 'spwContext', pageMeta.context);
  setDataIfMissing(body, 'spwWonder', pageMeta.wonder);
  setDataIfMissing(body, 'spwPageFamily', pageMeta.pageFamily);
  setDataIfMissing(body, 'spwPageModes', pageMeta.pageModes);
  setDataIfMissing(body, 'spwPageSeed', pageMeta.pageSeed);
  setDataIfMissing(body, 'spwPageRole', pageMeta.pageRole);
  if (pageMeta.relatedRoutes) setDataIfMissing(body, 'spwRelatedRoutes', pageMeta.relatedRoutes);
}

export function normalizeDocumentMetadata() {
  const body = document.body;
  if (!body) {
    return {
      pageMeta: null,
      surface: 'default',
    };
  }

  const main = document.querySelector('main');
  const pathname = window.location.pathname || '/';
  const surface = body.dataset.spwSurface || deriveSurfaceFromPath(pathname);

  if (!body.dataset.spwSurface) {
    writeDatasetValue(body, 'spwSurface', surface);
  }

  const pageMeta = resolvePageMetadata({ body, main });
  ensureMainLandmark(main);
  applyPageMetadata(pageMeta, body);
  normalizeHeadMetadata(pageMeta, { body, main });
  normalizeShellMetadata(pageMeta, { body });
  normalizeRegionMetadata(pageMeta, { body });
  normalizeRegionAccessibility(pageMeta, { body });

  return {
    pageMeta,
    surface: body.dataset.spwSurface || surface || 'default',
  };
}

export {
  PAGE_METADATA_REGION_SELECTOR,
  deriveSurfaceFromPath,
  normalizeInternalHref,
  collectContextTokens,
  collectInternalRoutes,
};
