/*
 * Root-scoped service worker for spwashi.com
 * ---------------------------------------------------------------------------
 * Goals
 * - Keep startup and navigation resilient without adding runtime jank.
 * - Make caching predictable and easy to invalidate.
 * - Avoid caching volatile responses or poisoning caches with bad responses.
 * - Prefer network for HTML, prefer cache for versioned/static assets.
 */

const CACHE_SCHEMA_VERSION = 'v6';
const CACHE_NAMESPACE = `spw-${CACHE_SCHEMA_VERSION}`;

const CACHE = {
  core: `${CACHE_NAMESPACE}-core`,
  pages: `${CACHE_NAMESPACE}-pages`,
  assets: `${CACHE_NAMESPACE}-assets`,
};

const CACHE_LIMITS = {
  pages: 48,
  assets: 160,
};

const CACHE_ROLES = {
  [CACHE.core]: 'core',
  [CACHE.pages]: 'pages',
  [CACHE.assets]: 'assets',
};

const LEGACY_CACHE_PREFIXES = [
  'spw-core',
  'spw-pages',
  'spw-assets',
  'spw-v',
  'spw-v2',
];

const OFFLINE_URL = '/offline/';
const FALLBACK_IMAGE_URL = '/public/images/icon-192.png';

const CORE_ROUTES = [
  '/',
  '/about/',
  '/blog/',
  '/settings/',
  '/play/',
  '/topics/craft/',
  '/topics/software/',
  OFFLINE_URL,
];

const CORE_ASSETS = [
  '/manifest.webmanifest',
  '/public/css/bundles/core.css',
  '/public/js/site.js',
  '/public/images/apple-touch-icon.png',
  '/public/images/icon-192.png',
  '/public/images/icon-512.png',
  '/public/images/icon-maskable-512.png',
  '/favicon.ico',
];

// A failed required shell must fail installation and leave the current worker
// in control. Routes and richer assets are useful offline, but they may warm
// opportunistically without making an otherwise sound update unusable.
const REQUIRED_PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/public/css/bundles/core.css',
  '/public/js/site.js',
  '/public/images/apple-touch-icon.png',
  '/public/images/icon-192.png',
  '/public/images/icon-512.png',
  '/public/images/icon-maskable-512.png',
  '/favicon.ico',
];

const requiredPrecacheSet = new Set(REQUIRED_PRECACHE_URLS);
const OPTIONAL_PRECACHE_URLS = [...new Set([...CORE_ROUTES, ...CORE_ASSETS])]
  .filter((url) => !requiredPrecacheSet.has(url));
const PRECACHE_URLS = [...REQUIRED_PRECACHE_URLS, ...OPTIONAL_PRECACHE_URLS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE.core);

      await Promise.all(
        REQUIRED_PRECACHE_URLS.map((url) => precacheUrl(cache, url))
      );

      const optionalResults = await Promise.allSettled(
        OPTIONAL_PRECACHE_URLS.map((url) => precacheUrl(cache, url))
      );

      const failed = optionalResults.filter((result) => result.status === 'rejected');
      if (failed.length) {
        console.warn(
          `[SW ${CACHE_SCHEMA_VERSION}] Optional precache failure: ${failed.length}/${OPTIONAL_PRECACHE_URLS.length}`
        );
      } else {
        console.log(`[SW ${CACHE_SCHEMA_VERSION}] Precache complete`);
      }

      await pruneCacheEntries(CACHE.core, PRECACHE_URLS);
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
          .filter((name) => isManagedCacheName(name) && !keep.has(name))
          .map((name) => caches.delete(name))
      );

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
      console.log(`[SW ${CACHE_SCHEMA_VERSION}] Activated`);
    })().catch(async (error) => {
      console.warn(`[SW ${CACHE_SCHEMA_VERSION}] Activate failed`, error);
      await self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'SPW_CACHE_SUMMARY') {
    event.waitUntil(replyWithCacheSummary(event));
    return;
  }

  if (event.data?.type === 'SPW_PWA_STATUS') {
    event.waitUntil(replyWithPwaStatus(event));
    return;
  }

  if (event.data?.type === 'SPW_PREFETCH_URLS') {
    const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
    event.waitUntil(prefetchUrls(urls).then((summary) => {
      event.source?.postMessage?.({
        type: 'SPW_PREFETCH_URLS_RESULT',
        summary,
      });
    }));
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

  if (isShellAssetRequest(request, url)) {
    event.respondWith(networkFirst(request, CACHE.assets));
    return;
  }

  if (isMediaAssetRequest(request, url)) {
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

function isShellAssetRequest(request, url) {
  if (['style', 'script', 'worker'].includes(request.destination)) {
    return true;
  }

  return (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.webmanifest')
  );
}

function isMediaAssetRequest(request, url) {
  if (
    ['image', 'font', 'audio', 'video'].includes(request.destination)
  ) {
    return true;
  }

  return (
    url.pathname.startsWith('/public/') ||
    url.pathname === '/favicon.ico' ||
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
        await trimRuntimeCache(CACHE.assets);
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
    await trimRuntimeCache(cacheName);
  } catch (error) {
    console.warn(`[SW ${CACHE_SCHEMA_VERSION}] Cache put failed`, error);
  }
}

async function trimRuntimeCache(cacheName) {
  const limit = cacheName === CACHE.pages
    ? CACHE_LIMITS.pages
    : cacheName === CACHE.assets
      ? CACHE_LIMITS.assets
      : 0;
  if (!limit) return;

  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const overflow = requests.length - limit;
    if (overflow <= 0) return;

    await Promise.all(requests.slice(0, overflow).map((request) => cache.delete(request)));
  } catch (error) {
    console.warn(`[SW ${CACHE_SCHEMA_VERSION}] Cache trim failed`, error);
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
  const cacheControl = response.headers.get('cache-control') || '';
  if (/\bno-store\b/i.test(cacheControl)) return false;
  return true;
}

async function pruneCacheEntries(cacheName, allowlistUrls) {
  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const allowlist = new Set(
      allowlistUrls.map((url) => new URL(url, self.location.origin).href)
    );

    await Promise.all(
      requests
        .filter((request) => !allowlist.has(request.url))
        .map((request) => cache.delete(request))
    );
  } catch (error) {
    console.warn(`[SW ${CACHE_SCHEMA_VERSION}] Cache prune failed`, error);
  }
}

async function replyWithCacheSummary(event) {
  try {
    const entries = await collectManagedCacheEntries();

    event.source?.postMessage?.({
      type: 'SPW_CACHE_SUMMARY_RESULT',
      version: CACHE_SCHEMA_VERSION,
      caches: entries,
    });
  } catch (error) {
    event.source?.postMessage?.({
      type: 'SPW_CACHE_SUMMARY_RESULT',
      version: CACHE_SCHEMA_VERSION,
      error: error?.message || String(error),
      caches: [],
    });
  }
}

async function replyWithPwaStatus(event) {
  try {
    event.source?.postMessage?.({
      type: 'SPW_PWA_STATUS_RESULT',
      status: {
        version: CACHE_SCHEMA_VERSION,
        namespace: CACHE_NAMESPACE,
        offlineUrl: OFFLINE_URL,
        fallbackImageUrl: FALLBACK_IMAGE_URL,
        requiredPrecacheCount: REQUIRED_PRECACHE_URLS.length,
        optionalPrecacheCount: OPTIONAL_PRECACHE_URLS.length,
        cacheLimits: CACHE_LIMITS,
        caches: await collectManagedCacheEntries(),
      },
    });
  } catch (error) {
    event.source?.postMessage?.({
      type: 'SPW_PWA_STATUS_RESULT',
      error: error?.message || String(error),
      status: null,
    });
  }
}

async function collectManagedCacheEntries() {
  const names = await caches.keys();
  const managed = names.filter(isManagedCacheName);
  const entries = [];

  for (const name of managed) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    entries.push({
      name,
      role: CACHE_ROLES[name] || 'legacy',
      count: requests.length,
    });
  }

  return entries;
}

async function prefetchUrls(urls) {
  const normalized = urls
    .map((url) => {
      try {
        const parsed = new URL(url, self.location.origin);
        return parsed.origin === self.location.origin ? parsed.pathname + parsed.search : '';
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .slice(0, 12);

  if (!normalized.length) {
    return { requested: 0, cached: 0 };
  }

  const cache = await caches.open(CACHE.assets);
  const results = await Promise.allSettled(normalized.map((url) => precacheUrl(cache, url)));
  await trimRuntimeCache(CACHE.assets);
  return {
    requested: normalized.length,
    cached: results.filter((result) => result.status === 'fulfilled').length,
  };
}

function isManagedCacheName(name) {
  return name.startsWith(CACHE_NAMESPACE)
    || LEGACY_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix));
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
