/*
 * Root-scoped service worker for spwashi.com
 * ---------------------------------------------------------------------------
 * Goals
 * - Keep startup and navigation resilient without adding runtime jank.
 * - Make caching predictable and easy to invalidate.
 * - Avoid caching volatile responses or poisoning caches with bad responses.
 * - Prefer network for HTML, prefer cache for versioned/static assets.
 */

const APP_VERSION = '0.3.8';

const CACHE = {
  core: `spw-core-${APP_VERSION}`,
  pages: `spw-pages-${APP_VERSION}`,
  assets: `spw-assets-${APP_VERSION}`,
};

const OFFLINE_URL = '/offline/';
const FALLBACK_IMAGE_URL = '/public/images/icon-192.png';

const CORE_ROUTES = [
  '/',
  '/about',
  '/about/website/',
  '/blog/',
  '/contact',
  '/settings/',
  '/play/',
  '/play/rpg-wednesday/',
  '/play/rpg-wednesday/sessions/',
  '/play/rpg-wednesday/world/',
  '/play/rpg-wednesday/cast/',
  '/play/rpg-wednesday/arcs/',
  '/topics/',
  '/topics/architecture/',
  '/topics/craft/',
  '/topics/craft/fragments/',
  '/topics/craft/svg/',
  '/topics/craft/files/',
  '/topics/pedagogy/',
  '/topics/site-design/',
  '/topics/math/',
  '/topics/math/topology/',
  '/topics/math/symmetry/',
  '/topics/math/combinatorics/',
  '/topics/math/number-theory/',
  '/topics/math/field-theory/',
  '/topics/math/category-theory/',
  '/topics/math/complexity/',
  '/topics/software/',
  '/topics/software/renderers/',
  '/topics/software/geometry/',
  '/topics/software/lattices/',
  '/topics/software/schedulers/',
  '/topics/software/parsers/',
  '/topics/software/spw/',
  '/topics/software/spw/operators/frame/',
  '/topics/software/spw/operators/layer/',
  '/topics/software/spw/operators/baseline/',
  '/topics/software/spw/operators/object/',
  '/topics/software/spw/operators/ref/',
  '/topics/software/spw/operators/probe/',
  '/topics/software/spw/operators/action/',
  '/topics/software/spw/operators/stream/',
  '/topics/software/spw/operators/merge/',
  '/topics/software/spw/operators/binding/',
  '/topics/software/spw/operators/meta/',
  '/topics/software/spw/operators/normalize/',
  '/topics/software/spw/operators/pragma/',
  '/topics/software/spw/operators/surface/',
  '/tools/',
  '/tools/profile/',
  '/tools/character-sheet/',
  '/tools/midjourney/',
  OFFLINE_URL,
];

const CORE_ASSETS = [
  '/manifest.webmanifest',

  '/public/css/style.css',
  '/public/css/enhancements.css',

  '/public/js/site.js',
  '/public/js/site-settings.js',
  '/public/js/spw-math-diagrams.js',
  '/public/js/pwa-update-handler.js',

  '/public/images/apple-touch-icon.png',
  '/public/images/icon-192.png',
  '/public/images/icon-512.png',
  '/public/images/icon-maskable-512.png',
  '/public/images/favicon.svg',
  '/favicon.ico',
];

const PRECACHE_URLS = [...new Set([...CORE_ROUTES, ...CORE_ASSETS])];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE.core);

      const results = await Promise.allSettled(
        PRECACHE_URLS.map((url) => precacheUrl(cache, url))
      );

      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length) {
        console.warn(
          `[SW ${APP_VERSION}] Partial precache failure: ${failed.length}/${PRECACHE_URLS.length}`
        );
      } else {
        console.log(`[SW ${APP_VERSION}] Precache complete`);
      }

      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set(Object.values(CACHE));
      const names = await caches.keys();

      await Promise.all(
        names
          .filter((name) => !keep.has(name))
          .map((name) => caches.delete(name))
      );

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
      console.log(`[SW ${APP_VERSION}] Activated`);
    })().catch(async (error) => {
      console.warn(`[SW ${APP_VERSION}] Activate failed`, error);
      await self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!shouldHandleRequest(request)) return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (isStaticAssetRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(event, request, CACHE.assets));
    return;
  }

  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE.pages));
    return;
  }

  event.respondWith(networkFirst(request, CACHE.assets));
});

/* ==========================================================================
   Request routing
   ========================================================================== */

function shouldHandleRequest(request) {
  if (request.method !== 'GET') return false;
  if (request.headers.has('range')) return false;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return false;
  if (url.protocol !== 'https:' && self.location.protocol === 'https:') return false;

  // Let browser/dev tooling handle special endpoints directly.
  if (url.pathname.startsWith('/__') || url.pathname.startsWith('/.well-known/')) {
    return false;
  }

  return true;
}

function isStaticAssetRequest(request, url) {
  if (
    ['style', 'script', 'image', 'font', 'audio', 'video'].includes(request.destination)
  ) {
    return true;
  }

  return (
    url.pathname.startsWith('/public/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  );
}

/* ==========================================================================
   Install / precache
   ========================================================================== */

async function precacheUrl(cache, url) {
  const request = new Request(url, {
    credentials: 'same-origin',
    cache: 'reload',
  });

  const response = await fetch(request);

  if (!isCacheableResponse(response)) {
    throw new Error(`Failed to precache ${url}: ${response.status}`);
  }

  await cache.put(normalizeCacheKey(request), response);
}

/* ==========================================================================
   Strategies
   ========================================================================== */

async function handleNavigationRequest(event) {
  const request = event.request;

  try {
    const preloadResponse = await event.preloadResponse;
    if (isCacheableHtmlResponse(preloadResponse)) {
      event.waitUntil(cacheResponse(CACHE.pages, request, preloadResponse.clone()));
      return preloadResponse;
    }

    const networkResponse = await fetch(request, { cache: 'no-cache' });
    if (isCacheableHtmlResponse(networkResponse)) {
      event.waitUntil(cacheResponse(CACHE.pages, request, networkResponse.clone()));
    }

    return networkResponse;
  } catch {
    const cached = await matchNavigationCache(request);
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    return (
      offline ||
      new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request, { cache: 'no-cache' });

    if (isCacheableResponse(response)) {
      await cacheResponse(cacheName, request, response.clone());
    }

    return response;
  } catch {
    const cached = await caches.match(normalizeCacheKey(request));
    if (cached) return cached;

    if (request.destination === 'document') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function staleWhileRevalidate(event, request, cacheName) {
  const cache = await caches.open(cacheName);
  const cacheKey = normalizeCacheKey(request);
  const cached = await cache.match(cacheKey);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await cache.put(cacheKey, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  if (request.destination === 'image') {
    const fallback = await caches.match(FALLBACK_IMAGE_URL);
    if (fallback) return fallback;
  }

  return new Response('Offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/* ==========================================================================
   Cache helpers
   ========================================================================== */

async function cacheResponse(cacheName, request, response) {
  if (!isCacheableResponse(response)) return;

  try {
    const cache = await caches.open(cacheName);
    await cache.put(normalizeCacheKey(request), response);
  } catch (error) {
    console.warn(`[SW ${APP_VERSION}] Cache put failed`, error);
  }
}

function normalizeCacheKey(request) {
  const url = new URL(request.url);

  // Keep navigation cache keys stable and avoid query noise.
  if (request.mode === 'navigate' || request.destination === 'document') {
    url.search = '';
    url.hash = '';
    return url.pathname;
  }

  // For static assets, preserve the full URL so version/query-busted assets remain distinct.
  return request;
}

function isCacheableResponse(response) {
  if (!response) return false;
  if (!response.ok) return false;
  if (response.type === 'opaque') return false;
  return true;
}

function isCacheableHtmlResponse(response) {
  if (!isCacheableResponse(response)) return false;

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html');
}

async function matchNavigationCache(request) {
  try {
    const url = new URL(request.url);
    const candidates = buildNavigationCandidates(url);

    for (const candidate of candidates) {
      const cached = await caches.match(candidate);
      if (cached) return cached;
    }
  } catch {
    // fall through
  }

  return null;
}

function buildNavigationCandidates(url) {
  const pathname = url.pathname;
  const trimmed = trimIndexAndTrailingSlash(pathname);
  const candidates = new Set([pathname, trimmed]);

  if (trimmed === '/') {
    candidates.add('/');
    candidates.add('/index.html');
    return [...candidates];
  }

  candidates.add(`${trimmed}/`);
  candidates.add(`${trimmed}/index.html`);
  candidates.add(`${pathname.replace(/\/$/, '')}/index.html`);

  return [...candidates];
}

function trimIndexAndTrailingSlash(pathname) {
  const withoutIndex = pathname.replace(/index\.html$/, '');
  const trimmed = withoutIndex.replace(/\/+$/, '');
  return trimmed || '/';
}
